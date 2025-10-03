# Flight Search Application

A modern flight search web application built with Flask and Firebase, featuring multi-currency support and comprehensive airport coverage.

## 🌟 Features

- 🔐 **Firebase Authentication** - Google Sign-In and Email/Password
- 🌍 **Multi-Currency Support** - 23+ currencies with real-time conversion
- ✈️ **Comprehensive Airport Database** - 150+ international airports
- 🎨 **Modern UI** - Glassmorphism design with responsive layout
- 🔍 **Advanced Search** - Price filters, travel class selection, passenger count
- 📱 **Mobile Responsive** - Optimized for all device sizes
- 🚀 **Real-time Results** - Live flight search with detailed information

## 🚀 Live Demo

Deploy your own instance to Vercel and add the URL here!

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python Flask
- **Authentication**: Firebase Authentication
- **Flight Data**: Amadeus for Developers API
- **Styling**: Modern CSS with glassmorphism effects

## Prerequisites

1. **Firebase Project**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google providers
   - Download service account key (JSON file)

2. **Amadeus API**
   - Register at [Amadeus for Developers](https://developers.amadeus.com/)
   - Create a new application to get Client ID and Client Secret
   - Use the test environment initially

3. **Python Environment**
   - Python 3.7 or higher
   - pip package manager

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd "Check Flight Status"

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Amadeus API Credentials
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/your/firebase-service-account-key.json
```

### 3. Firebase Configuration

1. **Get Firebase Config**:
   - Go to Firebase Console → Project Settings → General
   - Scroll down to "Your apps" and click "Web app"
   - Copy the config object

2. **Update JavaScript Config**:
   - Open `script.js`
   - Replace the `firebaseConfig` object with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

3. **Download Service Account Key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file and update the path in `.env`

### 4. Enable Authentication Providers

In Firebase Console:
1. Go to Authentication → Sign-in method
2. Enable "Email/Password"
3. Enable "Google" and configure OAuth consent screen

### 5. Run the Application

```bash
# Start the Flask backend
python app.py
```

The application will be available at: `http://localhost:5000`

## Project Structure

```bash
Check Flight Status/
├── app.py                 # Flask backend with API endpoints
├── index.html            # Main HTML file with auth and search UI
├── style.css             # Responsive CSS with glassmorphism design
├── script.js             # Frontend JavaScript with Firebase auth
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (create this)
├── .gitignore           # Git ignore file
└── README.md            # This file
```

## API Endpoints

### Backend Endpoints

- `GET /` - Serve the main application
- `GET /api/health` - Health check endpoint
- `POST /api/flights/search` - Search flights (requires authentication)
- `GET /api/airports/search` - Airport search for autocomplete

### Authentication

All flight search endpoints require a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Usage

1. **Authentication**:
   - Open the website
   - Sign up with email/password or use Google Sign-In
   - Once logged in, you'll see the flight search interface

2. **Search Flights**:
   - Enter origin and destination airport codes (e.g., CCU, BKK)
   - Optionally select departure date and price range
   - Click "Search Flights" to get results

3. **View Details**:
   - Click on any flight card to see detailed information
   - View airline details, flight times, and amenities

## Configuration Notes

### Amadeus API

- The project uses Amadeus test environment by default
- Test environment has limited data but doesn't require payment
- For production, change `AMADEUS_BASE_URL` to production endpoint
- Mock data is used as fallback when API is not configured

### Firebase Security

- ID tokens are verified on the backend using Firebase Admin SDK
- Only authenticated users can access flight search endpoints
- Tokens expire automatically and need refresh

### Development vs Production

**Development**:
- Uses mock flight data if Amadeus API is not configured
- Debug mode enabled in Flask
- Detailed error logging

**Production**:
- Configure real Amadeus API credentials
- Set Flask debug mode to False
- Use environment variables for all secrets
- Deploy with proper HTTPS

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**:
   - Check if Firebase config is correct in `script.js`
   - Verify that authentication providers are enabled
   - Ensure service account key path is correct

2. **Amadeus API Error**:
   - Verify API credentials in `.env` file
   - Check if API quota is not exceeded
   - Ensure airport codes are valid IATA codes

3. **CORS Issues**:
   - Flask-CORS is configured to allow all origins in development
   - For production, configure specific allowed origins

4. **Module Import Errors**:
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Use virtual environment for better dependency management

### Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv flight-search-env

# Activate virtual environment
# Windows:
flight-search-env\Scripts\activate
# Linux/Mac:
source flight-search-env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Firebase and Amadeus documentation
3. Check browser console for JavaScript errors
4. Review Flask logs for backend errors

## Security Notes

- Never commit `.env` file or service account keys to version control
- Use HTTPS in production
- Regularly rotate API keys and secrets
- Implement rate limiting for production use
- Validate all user inputs on both frontend and backend