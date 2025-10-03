import os
import json
import logging
from datetime import datetime, timedelta
from functools import wraps

import requests
from flask import Flask, request, jsonify, render_template, g
from flask_cors import CORS
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Firebase Admin SDK initialization
firebase_initialized = False
try:
    # Initialize Firebase Admin SDK
    service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
    else:
        logger.warning("Firebase service account key not found. Authentication will not work.")
except Exception as e:
    logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

# Amadeus API configuration
AMADEUS_CLIENT_ID = os.getenv('AMADEUS_CLIENT_ID')
AMADEUS_CLIENT_SECRET = os.getenv('AMADEUS_CLIENT_SECRET')
AMADEUS_BASE_URL = 'https://test.api.amadeus.com'  # Test environment

# Global variable to store Amadeus access token
amadeus_access_token = None
token_expires_at = None


def verify_firebase_token(f):
    """
    Decorator to verify Firebase ID token from request headers
    Only authenticated users can access protected endpoints
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip authentication if Firebase is not initialized (for demo purposes)
        if not firebase_initialized:
            logger.warning("Firebase not initialized - skipping authentication for demo")
            # Create a mock user for demo
            g.user = {'uid': 'demo_user', 'email': 'demo@example.com'}
            return f(*args, **kwargs)
        
        try:
            # Get the Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Missing or invalid authorization header'}), 401
            
            # Extract the token
            id_token = auth_header.split('Bearer ')[1]
            
            # Verify the token with Firebase
            decoded_token = auth.verify_id_token(id_token)
            
            # Add user info to request context
            g.user = decoded_token
            
            return f(*args, **kwargs)
            
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'ID token has expired'}), 401
        except auth.InvalidIdTokenError:
            return jsonify({'error': 'Invalid ID token'}), 401
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function


def get_amadeus_access_token():
    """
    Get or refresh Amadeus API access token using OAuth2
    """
    global amadeus_access_token, token_expires_at
    
    # Check if we have a valid token
    if amadeus_access_token and token_expires_at and datetime.now() < token_expires_at:
        return amadeus_access_token
    
    # Get new access token
    try:
        url = f"{AMADEUS_BASE_URL}/v1/security/oauth2/token"
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        data = {
            'grant_type': 'client_credentials',
            'client_id': AMADEUS_CLIENT_ID,
            'client_secret': AMADEUS_CLIENT_SECRET
        }
        
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        amadeus_access_token = token_data['access_token']
        expires_in = token_data.get('expires_in', 3600)  # Default 1 hour
        
        # Set expiration time with some buffer
        token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)
        
        logger.info("Successfully obtained Amadeus access token")
        return amadeus_access_token
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to get Amadeus access token: {e}")
        raise Exception("Failed to authenticate with Amadeus API")


def search_amadeus_flights(search_params, currency='USD'):
    """
    Search flights using Amadeus Flight Offers Search API
    """
    try:
        access_token = get_amadeus_access_token()
        
        url = f"{AMADEUS_BASE_URL}/v2/shopping/flight-offers"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Prepare API parameters
        params = {
            'originLocationCode': search_params['origin'],
            'destinationLocationCode': search_params['destination'],
            'adults': search_params.get('passengers', 1),
            'currencyCode': currency,  # Add currency parameter
            'max': 10  # Limit results
        }
        
        # Add departure date if provided
        if search_params.get('departureDate'):
            params['departureDate'] = search_params['departureDate']
        
        # Add price filters if provided
        if search_params.get('maxPrice'):
            params['maxPrice'] = search_params['maxPrice']
        
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Process and format the flight data
        flights = []
        if 'data' in data:
            for offer in data['data']:
                flight = format_amadeus_flight(offer)
                
                # Apply price filters
                if search_params.get('minPrice') and flight['price'] < search_params['minPrice']:
                    continue
                
                flights.append(flight)
        
        return flights
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Amadeus API request failed: {e}")
        raise Exception("Failed to search flights from Amadeus API")
    except Exception as e:
        logger.error(f"Flight search error: {e}")
        raise


def format_amadeus_flight(offer):
    """
    Format Amadeus flight offer data into our standard format
    """
    try:
        # Extract basic flight info
        itinerary = offer['itineraries'][0]  # Take first itinerary
        segment = itinerary['segments'][0]  # Take first segment
        
        # Calculate total duration
        duration = itinerary.get('duration', 'PT0H0M')
        duration_formatted = format_duration(duration)
        
        # Count stops
        stops = len(itinerary['segments']) - 1
        
        # Extract price
        price = float(offer['price']['total'])
        currency = offer['price']['currency']
        
        # Get airline info
        airline_code = segment['carrierCode']
        flight_number = f"{airline_code}-{segment['number']}"
        
        # Extract times
        departure_time = format_time(segment['departure']['at'])
        arrival_time = format_time(segment['arrival']['at'])
        
        # Get aircraft info if available
        aircraft = segment.get('aircraft', {}).get('code', 'Unknown')
        
        return {
            'id': offer['id'],
            'airline': get_airline_name(airline_code),
            'flightNumber': flight_number,
            'origin': segment['departure']['iataCode'],
            'destination': segment['arrival']['iataCode'],
            'departureTime': departure_time,
            'arrivalTime': arrival_time,
            'duration': duration_formatted,
            'stops': stops,
            'price': price,
            'currency': currency,
            'aircraft': aircraft,
            'amenities': get_default_amenities(airline_code)
        }
        
    except Exception as e:
        logger.error(f"Error formatting flight data: {e}")
        # Return a basic flight object on error
        return {
            'id': offer.get('id', 'unknown'),
            'airline': 'Unknown Airline',
            'flightNumber': 'N/A',
            'origin': 'N/A',
            'destination': 'N/A',
            'departureTime': 'N/A',
            'arrivalTime': 'N/A',
            'duration': 'N/A',
            'stops': 0,
            'price': 0,
            'currency': 'USD',
            'aircraft': 'Unknown',
            'amenities': []
        }


def format_duration(duration_str):
    """
    Convert ISO 8601 duration (PT4H30M) to readable format (4h 30m)
    """
    try:
        duration_str = duration_str.replace('PT', '')
        hours = 0
        minutes = 0
        
        if 'H' in duration_str:
            hours = int(duration_str.split('H')[0])
            duration_str = duration_str.split('H')[1]
        
        if 'M' in duration_str:
            minutes = int(duration_str.split('M')[0])
        
        if hours > 0 and minutes > 0:
            return f"{hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h"
        elif minutes > 0:
            return f"{minutes}m"
        else:
            return "Unknown"
            
    except Exception:
        return "Unknown"


def format_time(datetime_str):
    """
    Format datetime string to time only (HH:MM)
    """
    try:
        dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        return dt.strftime('%H:%M')
    except Exception:
        return "N/A"


def get_airline_name(airline_code):
    """
    Get airline name from code (basic mapping)
    In production, you would use Amadeus Airline Code Lookup API
    """
    airline_names = {
        'AI': 'Air India',
        '6E': 'IndiGo',
        'SG': 'SpiceJet',
        'UK': 'Vistara',
        'TG': 'Thai Airways',
        'SQ': 'Singapore Airlines',
        'EK': 'Emirates',
        'QR': 'Qatar Airways',
        'LH': 'Lufthansa',
        'BA': 'British Airways',
        'AF': 'Air France',
        'KL': 'KLM',
        'AA': 'American Airlines',
        'DL': 'Delta Air Lines',
        'UA': 'United Airlines'
    }
    return airline_names.get(airline_code, f"{airline_code} Airlines")


def get_default_amenities(airline_code):
    """
    Get default amenities based on airline (basic mapping)
    """
    premium_airlines = ['SQ', 'EK', 'QR', 'LH', 'BA', 'AF']
    budget_airlines = ['6E', 'SG']
    
    if airline_code in premium_airlines:
        return ['WiFi', 'Meals', 'Entertainment', 'Lounge Access']
    elif airline_code in budget_airlines:
        return ['WiFi', 'Snacks']
    else:
        return ['Meals', 'Entertainment']


# Routes
@app.route('/')
def index():
    """Serve the main application"""
    return render_template('index.html')


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


@app.route('/api/flights/search', methods=['POST'])
@verify_firebase_token
def search_flights():
    """
    Search flights endpoint - requires authentication
    """
    try:
        # Get search parameters from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No search parameters provided'}), 400
        
        # Validate required parameters
        required_fields = ['origin', 'destination']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate airport codes (should be 3 letters)
        if len(data['origin']) != 3 or len(data['destination']) != 3:
            return jsonify({'error': 'Airport codes must be 3 letters (e.g., CCU, BKK)'}), 400
        
        # Validate date format if provided
        if data.get('departureDate'):
            try:
                datetime.strptime(data['departureDate'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        logger.info(f"Flight search request from user {g.user['uid']}: {data}")
        
        # Extract currency parameter (default to USD)
        currency = data.get('currency', 'USD')
        
        # Check if Amadeus credentials are configured
        if not AMADEUS_CLIENT_ID or not AMADEUS_CLIENT_SECRET:
            logger.warning("Amadeus API credentials not configured, using mock data")
            flights = generate_mock_flights(data)
        else:
            try:
                # Search using Amadeus API
                flights = search_amadeus_flights(data)
            except Exception as e:
                logger.error(f"Amadeus API error: {e}")
                # Fallback to mock data
                flights = generate_mock_flights(data, currency)
        
        # Return results
        response = {
            'success': True,
            'flights': flights,
            'searchParams': data,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Flight search error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


def generate_mock_flights(search_params, currency='USD'):
    """
    Generate mock flight data for testing when Amadeus API is not available
    """
    # Exchange rates for currency conversion (in a real app, fetch from API)
    exchange_rates = {
        'USD': 1.0, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25,
        'AUD': 1.35, 'CHF': 0.92, 'CNY': 6.45, 'INR': 74.5, 'KRW': 1180.0,
        'SGD': 1.35, 'HKD': 7.8, 'SEK': 8.6, 'NOK': 8.5, 'DKK': 6.3,
        'PLN': 3.9, 'CZK': 21.5, 'HUF': 295.0, 'RUB': 74.0, 'BRL': 5.2,
        'MXN': 20.1, 'ZAR': 14.8, 'THB': 31.5
    }
    
    rate = exchange_rates.get(currency, 1.0)
    
    mock_flights = [
        {
            'id': 'mock_1',
            'airline': 'Air India',
            'flightNumber': 'AI-142',
            'origin': search_params['origin'],
            'destination': search_params['destination'],
            'departureTime': '10:30',
            'arrivalTime': '14:45',
            'duration': '4h 15m',
            'stops': 0,
            'basePrice': 299.99,  # Always store base price in USD
            'price': round(299.99 * rate, 2),
            'currency': currency,
            'aircraft': 'Boeing 737-800',
            'amenities': ['WiFi', 'Meals', 'Entertainment']
        },
        {
            'id': 'mock_2',
            'airline': 'IndiGo',
            'flightNumber': '6E-1023',
            'origin': search_params['origin'],
            'destination': search_params['destination'],
            'departureTime': '06:15',
            'arrivalTime': '12:20',
            'duration': '6h 05m',
            'stops': 1,
            'stopover': 'DEL',
            'basePrice': 245.50,
            'price': round(245.50 * rate, 2),
            'currency': currency,
            'aircraft': 'Airbus A320',
            'amenities': ['WiFi', 'Snacks']
        },
        {
            'id': 'mock_3',
            'airline': 'Thai Airways',
            'flightNumber': 'TG-314',
            'origin': search_params['origin'],
            'destination': search_params['destination'],
            'departureTime': '23:55',
            'arrivalTime': '06:30+1',
            'duration': '4h 35m',
            'stops': 0,
            'basePrice': 425.00,
            'price': round(425.00 * rate, 2),
            'currency': currency,
            'aircraft': 'Boeing 777-300',
            'amenities': ['WiFi', 'Meals', 'Entertainment', 'Lounge Access']
        },
        {
            'id': 'mock_4',
            'airline': 'Singapore Airlines',
            'flightNumber': 'SQ-516',
            'origin': search_params['origin'],
            'destination': search_params['destination'],
            'departureTime': '15:20',
            'arrivalTime': '19:45',
            'duration': '4h 25m',
            'stops': 0,
            'basePrice': 385.75,
            'price': round(385.75 * rate, 2),
            'currency': currency,
            'aircraft': 'Airbus A350',
            'amenities': ['WiFi', 'Meals', 'Entertainment', 'Lounge Access', 'Premium Economy']
        }
    ]
    
    # Apply price filters
    min_price = search_params.get('minPrice')
    max_price = search_params.get('maxPrice')
    
    if min_price is not None or max_price is not None:
        filtered_flights = []
        for flight in mock_flights:
            if min_price is not None and flight['price'] < min_price:
                continue
            if max_price is not None and flight['price'] > max_price:
                continue
            filtered_flights.append(flight)
        return filtered_flights
    
    return mock_flights


@app.route('/api/airports/search')
@verify_firebase_token
def search_airports():
    """
    Airport search endpoint for autocomplete functionality
    In production, you would use Amadeus Airport & City Search API
    """
    query = request.args.get('query', '').strip().lower()
    
    if len(query) < 2:
        return jsonify({'airports': []})
    
    # Mock airport data
    airports = [
        {'code': 'CCU', 'name': 'Kolkata', 'country': 'India', 'full_name': 'Netaji Subhas Chandra Bose International Airport'},
        {'code': 'BKK', 'name': 'Bangkok', 'country': 'Thailand', 'full_name': 'Suvarnabhumi Airport'},
        {'code': 'DEL', 'name': 'Delhi', 'country': 'India', 'full_name': 'Indira Gandhi International Airport'},
        {'code': 'BOM', 'name': 'Mumbai', 'country': 'India', 'full_name': 'Chhatrapati Shivaji Maharaj International Airport'},
        {'code': 'SIN', 'name': 'Singapore', 'country': 'Singapore', 'full_name': 'Changi Airport'},
        {'code': 'DXB', 'name': 'Dubai', 'country': 'UAE', 'full_name': 'Dubai International Airport'},
        {'code': 'LHR', 'name': 'London', 'country': 'UK', 'full_name': 'Heathrow Airport'},
        {'code': 'JFK', 'name': 'New York', 'country': 'USA', 'full_name': 'John F. Kennedy International Airport'}
    ]
    
    # Filter airports based on query
    matching_airports = []
    for airport in airports:
        if (query in airport['code'].lower() or 
            query in airport['name'].lower() or 
            query in airport['full_name'].lower()):
            matching_airports.append(airport)
    
    return jsonify({'airports': matching_airports[:10]})  # Limit to 10 results


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Check if required environment variables are set
    if not AMADEUS_CLIENT_ID or not AMADEUS_CLIENT_SECRET:
        logger.warning("Amadeus API credentials not configured. Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to .env file")
        logger.warning("Using mock data for demonstration purposes")
    
        # Run the application (for local development)
        # In production (Vercel), this won't execute
        if __name__ == '__main__':
            port = int(os.environ.get('PORT', 5000))
            debug = os.environ.get('FLASK_ENV') == 'development'
            app.run(debug=debug, host='0.0.0.0', port=port)
