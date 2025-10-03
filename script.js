// Firebase Configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
    apiKey: "AIzaSyB7AmZgcMGTzA5huAEHfa5kqfsdyeCDCmk",
    authDomain: "chooseyourflight-65fe0.firebaseapp.com",
    projectId: "chooseyourflight-65fe0",
    storageBucket: "chooseyourflight-65fe0.firebasestorage.app",
    messagingSenderId: "1041538627339",
    appId: "1:1041538627339:web:4c358947f59bd44d93540e",
    measurementId: "G-S16CCCDW2P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Global variables
let currentUser = null;
let flightResults = [];
let selectedCurrency = 'USD';

// Currency symbols and information
const currencyInfo = {
    'USD': { symbol: '$', name: 'US Dollar' },
    'EUR': { symbol: '€', name: 'Euro' },
    'GBP': { symbol: '£', name: 'British Pound' },
    'INR': { symbol: '₹', name: 'Indian Rupee' },
    'JPY': { symbol: '¥', name: 'Japanese Yen' },
    'AUD': { symbol: 'A$', name: 'Australian Dollar' },
    'CAD': { symbol: 'C$', name: 'Canadian Dollar' },
    'CHF': { symbol: 'CHF', name: 'Swiss Franc' },
    'CNY': { symbol: '¥', name: 'Chinese Yuan' },
    'KRW': { symbol: '₩', name: 'South Korean Won' },
    'SGD': { symbol: 'S$', name: 'Singapore Dollar' },
    'THB': { symbol: '฿', name: 'Thai Baht' },
    'AED': { symbol: 'AED', name: 'UAE Dirham' },
    'SAR': { symbol: 'SAR', name: 'Saudi Riyal' },
    'QAR': { symbol: 'QAR', name: 'Qatari Riyal' },
    'MYR': { symbol: 'RM', name: 'Malaysian Ringgit' },
    'IDR': { symbol: 'Rp', name: 'Indonesian Rupiah' },
    'PHP': { symbol: '₱', name: 'Philippine Peso' },
    'VND': { symbol: '₫', name: 'Vietnamese Dong' },
    'BDT': { symbol: '৳', name: 'Bangladeshi Taka' },
    'LKR': { symbol: 'Rs', name: 'Sri Lankan Rupee' },
    'NPR': { symbol: 'Rs', name: 'Nepalese Rupee' },
    'PKR': { symbol: 'Rs', name: 'Pakistani Rupee' }
};

// Comprehensive airport codes for suggestions - Major international airports
const commonAirports = [
    // India
    { code: 'CCU', name: 'Kolkata, India (Netaji Subhas Chandra Bose International)' },
    { code: 'DEL', name: 'Delhi, India (Indira Gandhi International)' },
    { code: 'BOM', name: 'Mumbai, India (Chhatrapati Shivaji Maharaj International)' },
    { code: 'MAA', name: 'Chennai, India (Chennai International)' },
    { code: 'HYD', name: 'Hyderabad, India (Rajiv Gandhi International)' },
    { code: 'BLR', name: 'Bangalore, India (Kempegowda International)' },
    { code: 'COK', name: 'Kochi, India (Cochin International)' },
    { code: 'AMD', name: 'Ahmedabad, India (Sardar Vallabhbhai Patel International)' },
    { code: 'GOI', name: 'Goa, India (Goa International)' },
    { code: 'PNQ', name: 'Pune, India (Pune Airport)' },
    { code: 'JAI', name: 'Jaipur, India (Jaipur International)' },
    { code: 'LKO', name: 'Lucknow, India (Chaudhary Charan Singh International)' },
    { code: 'IXC', name: 'Chandigarh, India (Chandigarh Airport)' },
    { code: 'GAU', name: 'Guwahati, India (Lokpriya Gopinath Bordoloi International)' },
    { code: 'IXB', name: 'Bagdogra, India (Bagdogra Airport)' },
    
    // Southeast Asia
    { code: 'BKK', name: 'Bangkok, Thailand (Suvarnabhumi)' },
    { code: 'DMK', name: 'Bangkok, Thailand (Don Mueang International)' },
    { code: 'SIN', name: 'Singapore (Changi)' },
    { code: 'KUL', name: 'Kuala Lumpur, Malaysia (Kuala Lumpur International)' },
    { code: 'CGK', name: 'Jakarta, Indonesia (Soekarno-Hatta International)' },
    { code: 'DPS', name: 'Bali, Indonesia (Ngurah Rai International)' },
    { code: 'MNL', name: 'Manila, Philippines (Ninoy Aquino International)' },
    { code: 'HAN', name: 'Hanoi, Vietnam (Noi Bai International)' },
    { code: 'SGN', name: 'Ho Chi Minh City, Vietnam (Tan Son Nhat International)' },
    { code: 'RGN', name: 'Yangon, Myanmar (Yangon International)' },
    { code: 'PNH', name: 'Phnom Penh, Cambodia (Phnom Penh International)' },
    { code: 'VTE', name: 'Vientiane, Laos (Wattay International)' },
    
    // Middle East
    { code: 'DXB', name: 'Dubai, UAE (Dubai International)' },
    { code: 'DWC', name: 'Dubai, UAE (Al Maktoum International)' },
    { code: 'AUH', name: 'Abu Dhabi, UAE (Abu Dhabi International)' },
    { code: 'DOH', name: 'Doha, Qatar (Hamad International)' },
    { code: 'KWI', name: 'Kuwait City, Kuwait (Kuwait International)' },
    { code: 'BAH', name: 'Manama, Bahrain (Bahrain International)' },
    { code: 'MCT', name: 'Muscat, Oman (Muscat International)' },
    { code: 'RUH', name: 'Riyadh, Saudi Arabia (King Khalid International)' },
    { code: 'JED', name: 'Jeddah, Saudi Arabia (King Abdulaziz International)' },
    { code: 'AMM', name: 'Amman, Jordan (Queen Alia International)' },
    { code: 'BEY', name: 'Beirut, Lebanon (Rafic Hariri International)' },
    { code: 'TLV', name: 'Tel Aviv, Israel (Ben Gurion)' },
    
    // Europe
    { code: 'LHR', name: 'London, UK (Heathrow)' },
    { code: 'LGW', name: 'London, UK (Gatwick)' },
    { code: 'STN', name: 'London, UK (Stansted)' },
    { code: 'LTN', name: 'London, UK (Luton)' },
    { code: 'CDG', name: 'Paris, France (Charles de Gaulle)' },
    { code: 'ORY', name: 'Paris, France (Orly)' },
    { code: 'FRA', name: 'Frankfurt, Germany (Frankfurt am Main)' },
    { code: 'MUC', name: 'Munich, Germany (Munich Airport)' },
    { code: 'BER', name: 'Berlin, Germany (Brandenburg)' },
    { code: 'AMS', name: 'Amsterdam, Netherlands (Schiphol)' },
    { code: 'ZUR', name: 'Zurich, Switzerland (Zurich Airport)' },
    { code: 'GVA', name: 'Geneva, Switzerland (Geneva Airport)' },
    { code: 'VIE', name: 'Vienna, Austria (Vienna International)' },
    { code: 'FCO', name: 'Rome, Italy (Leonardo da Vinci–Fiumicino)' },
    { code: 'MXP', name: 'Milan, Italy (Malpensa)' },
    { code: 'MAD', name: 'Madrid, Spain (Adolfo Suárez Madrid–Barajas)' },
    { code: 'BCN', name: 'Barcelona, Spain (Barcelona-El Prat)' },
    { code: 'LIS', name: 'Lisbon, Portugal (Humberto Delgado)' },
    { code: 'ATH', name: 'Athens, Greece (Eleftherios Venizelos)' },
    { code: 'IST', name: 'Istanbul, Turkey (Istanbul Airport)' },
    { code: 'SAW', name: 'Istanbul, Turkey (Sabiha Gökçen)' },
    { code: 'OSL', name: 'Oslo, Norway (Oslo Gardermoen)' },
    { code: 'ARN', name: 'Stockholm, Sweden (Stockholm Arlanda)' },
    { code: 'CPH', name: 'Copenhagen, Denmark (Copenhagen Airport)' },
    { code: 'HEL', name: 'Helsinki, Finland (Helsinki-Vantaa)' },
    { code: 'SVO', name: 'Moscow, Russia (Sheremetyevo)' },
    { code: 'DME', name: 'Moscow, Russia (Domodedovo)' },
    { code: 'LED', name: 'St. Petersburg, Russia (Pulkovo)' },
    
    // North America
    { code: 'JFK', name: 'New York, USA (John F. Kennedy International)' },
    { code: 'LGA', name: 'New York, USA (LaGuardia)' },
    { code: 'EWR', name: 'Newark, USA (Newark Liberty International)' },
    { code: 'LAX', name: 'Los Angeles, USA (Los Angeles International)' },
    { code: 'SFO', name: 'San Francisco, USA (San Francisco International)' },
    { code: 'ORD', name: 'Chicago, USA (O\'Hare International)' },
    { code: 'MDW', name: 'Chicago, USA (Midway International)' },
    { code: 'MIA', name: 'Miami, USA (Miami International)' },
    { code: 'DFW', name: 'Dallas, USA (Dallas/Fort Worth International)' },
    { code: 'DEN', name: 'Denver, USA (Denver International)' },
    { code: 'SEA', name: 'Seattle, USA (Seattle-Tacoma International)' },
    { code: 'ATL', name: 'Atlanta, USA (Hartsfield-Jackson Atlanta International)' },
    { code: 'BOS', name: 'Boston, USA (Logan International)' },
    { code: 'IAD', name: 'Washington DC, USA (Dulles International)' },
    { code: 'DCA', name: 'Washington DC, USA (Ronald Reagan Washington National)' },
    { code: 'PHX', name: 'Phoenix, USA (Sky Harbor International)' },
    { code: 'LAS', name: 'Las Vegas, USA (McCarran International)' },
    { code: 'MSP', name: 'Minneapolis, USA (Minneapolis-St. Paul International)' },
    { code: 'DTW', name: 'Detroit, USA (Detroit Metropolitan Wayne County)' },
    { code: 'YYZ', name: 'Toronto, Canada (Pearson International)' },
    { code: 'YVR', name: 'Vancouver, Canada (Vancouver International)' },
    { code: 'YUL', name: 'Montreal, Canada (Pierre Elliott Trudeau International)' },
    { code: 'MEX', name: 'Mexico City, Mexico (Mexico City International)' },
    
    // East Asia
    { code: 'NRT', name: 'Tokyo, Japan (Narita International)' },
    { code: 'HND', name: 'Tokyo, Japan (Haneda)' },
    { code: 'KIX', name: 'Osaka, Japan (Kansai International)' },
    { code: 'ICN', name: 'Seoul, South Korea (Incheon International)' },
    { code: 'GMP', name: 'Seoul, South Korea (Gimpo International)' },
    { code: 'PEK', name: 'Beijing, China (Beijing Capital International)' },
    { code: 'PKX', name: 'Beijing, China (Beijing Daxing International)' },
    { code: 'PVG', name: 'Shanghai, China (Pudong International)' },
    { code: 'SHA', name: 'Shanghai, China (Hongqiao International)' },
    { code: 'CAN', name: 'Guangzhou, China (Guangzhou Baiyun International)' },
    { code: 'SZX', name: 'Shenzhen, China (Shenzhen Bao\'an International)' },
    { code: 'HKG', name: 'Hong Kong (Hong Kong International)' },
    { code: 'TPE', name: 'Taipei, Taiwan (Taiwan Taoyuan International)' },
    { code: 'TSA', name: 'Taipei, Taiwan (Taipei Songshan)' },
    
    // Australia & Oceania
    { code: 'SYD', name: 'Sydney, Australia (Kingsford Smith)' },
    { code: 'MEL', name: 'Melbourne, Australia (Melbourne Airport)' },
    { code: 'BNE', name: 'Brisbane, Australia (Brisbane Airport)' },
    { code: 'PER', name: 'Perth, Australia (Perth Airport)' },
    { code: 'ADL', name: 'Adelaide, Australia (Adelaide Airport)' },
    { code: 'AKL', name: 'Auckland, New Zealand (Auckland Airport)' },
    { code: 'CHC', name: 'Christchurch, New Zealand (Christchurch Airport)' },
    
    // Africa
    { code: 'CPT', name: 'Cape Town, South Africa (Cape Town International)' },
    { code: 'JNB', name: 'Johannesburg, South Africa (O.R. Tambo International)' },
    { code: 'CAI', name: 'Cairo, Egypt (Cairo International)' },
    { code: 'ADD', name: 'Addis Ababa, Ethiopia (Bole International)' },
    { code: 'NBO', name: 'Nairobi, Kenya (Jomo Kenyatta International)' },
    { code: 'LOS', name: 'Lagos, Nigeria (Murtala Muhammed International)' },
    { code: 'CAS', name: 'Casablanca, Morocco (Mohammed V International)' },
    
    // South America
    { code: 'GRU', name: 'São Paulo, Brazil (Guarulhos International)' },
    { code: 'GIG', name: 'Rio de Janeiro, Brazil (Galeão International)' },
    { code: 'EZE', name: 'Buenos Aires, Argentina (Ezeiza International)' },
    { code: 'SCL', name: 'Santiago, Chile (Arturo Merino Benítez International)' },
    { code: 'LIM', name: 'Lima, Peru (Jorge Chávez International)' },
    { code: 'BOG', name: 'Bogotá, Colombia (El Dorado International)' },
    { code: 'UIO', name: 'Quito, Ecuador (Mariscal Sucre International)' },
    
    // Central Asia
    { code: 'ALA', name: 'Almaty, Kazakhstan (Almaty Airport)' },
    { code: 'NUR', name: 'Nur-Sultan, Kazakhstan (Nur-Sultan Nazarbayev International)' },
    { code: 'TAS', name: 'Tashkent, Uzbekistan (Islam Karimov Tashkent International)' },
    { code: 'FRU', name: 'Bishkek, Kyrgyzstan (Manas International)' },
    
    // Pakistan & Neighboring Countries
    { code: 'KHI', name: 'Karachi, Pakistan (Jinnah International)' },
    { code: 'LHE', name: 'Lahore, Pakistan (Allama Iqbal International)' },
    { code: 'ISB', name: 'Islamabad, Pakistan (Islamabad International)' },
    { code: 'KBL', name: 'Kabul, Afghanistan (Hamid Karzai International)' },
    { code: 'KTM', name: 'Kathmandu, Nepal (Tribhuvan International)' },
    { code: 'DAC', name: 'Dhaka, Bangladesh (Hazrat Shahjalal International)' },
    { code: 'CGP', name: 'Chattogram, Bangladesh (Shah Amanat International)' },
    { code: 'CMB', name: 'Colombo, Sri Lanka (Bandaranaike International)' },
    { code: 'MLE', name: 'Malé, Maldives (Velana International)' }
];

// DOM Elements
const authContainer = document.getElementById('auth-container');
const searchContainer = document.getElementById('search-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginToggle = document.getElementById('login-toggle');
const registerToggle = document.getElementById('register-toggle');
const googleSigninBtn = document.getElementById('google-signin');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const flightSearchForm = document.getElementById('flight-search-form');
const resultsContainer = document.getElementById('results-container');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const loadingOverlay = document.getElementById('loading-overlay');
const toast = document.getElementById('toast');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupAirportSuggestions();
    setupCurrencySelection();
    setMinDate();
});

// Initialize the application
function initializeApp() {
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showSearchInterface();
            updateUserProfile(user);
        } else {
            currentUser = null;
            showAuthInterface();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Auth toggle buttons
    loginToggle.addEventListener('click', () => switchAuthMode('login'));
    registerToggle.addEventListener('click', () => switchAuthMode('register'));
    
    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Google sign-in
    googleSigninBtn.addEventListener('click', handleGoogleSignIn);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Flight search
    flightSearchForm.addEventListener('submit', handleFlightSearch);
    
    // Modal close
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    // Toast close
    document.getElementById('toast-close').addEventListener('click', hideToast);
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            hideToast();
        }
    });
}

// Switch between login and register modes
function switchAuthMode(mode) {
    if (mode === 'login') {
        loginToggle.classList.add('active');
        registerToggle.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerToggle.classList.add('active');
        loginToggle.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    hideAuthError();
}

// Handle email/password login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Successfully logged in!', 'success');
    } catch (error) {
        showAuthError(getErrorMessage(error));
    } finally {
        hideLoading();
    }
}

// Handle email/password registration
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }
    
    try {
        showLoading();
        await auth.createUserWithEmailAndPassword(email, password);
        showToast('Account created successfully!', 'success');
    } catch (error) {
        showAuthError(getErrorMessage(error));
    } finally {
        hideLoading();
    }
}

// Handle Google sign-in
async function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
        showLoading();
        await auth.signInWithPopup(provider);
        showToast('Successfully signed in with Google!', 'success');
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') {
            showAuthError(getErrorMessage(error));
        }
    } finally {
        hideLoading();
    }
}

// Handle logout
async function handleLogout() {
    try {
        await auth.signOut();
        showToast('Successfully logged out', 'success');
    } catch (error) {
        showToast('Error logging out', 'error');
    }
}

// Show auth interface
function showAuthInterface() {
    authContainer.classList.remove('hidden');
    searchContainer.classList.add('hidden');
}

// Show search interface
function showSearchInterface() {
    authContainer.classList.add('hidden');
    searchContainer.classList.remove('hidden');
}

// Update user profile display
function updateUserProfile(user) {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');
    
    userName.textContent = user.displayName || 'User';
    userEmail.textContent = user.email;
    userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=667eea&color=fff`;
}

// Setup airport suggestions
function setupAirportSuggestions() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    const originSuggestions = document.getElementById('origin-suggestions');
    const destinationSuggestions = document.getElementById('destination-suggestions');
    
    setupAirportInput(originInput, originSuggestions);
    setupAirportInput(destinationInput, destinationSuggestions);
}

// Setup individual airport input with suggestions
function setupAirportInput(input, suggestionsContainer) {
    input.addEventListener('input', () => {
        const value = input.value.toLowerCase();
        if (value.length < 1) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        const filtered = commonAirports.filter(airport => 
            airport.code.toLowerCase().includes(value) || 
            airport.name.toLowerCase().includes(value)
        );
        
        if (filtered.length > 0) {
            suggestionsContainer.innerHTML = filtered.slice(0, 5).map(airport => 
                `<div class="airport-suggestion" data-code="${airport.code}">
                    <strong>${airport.code}</strong> - ${airport.name}
                </div>`
            ).join('');
            suggestionsContainer.style.display = 'block';
            
            // Add click handlers
            suggestionsContainer.querySelectorAll('.airport-suggestion').forEach(suggestion => {
                suggestion.addEventListener('click', () => {
                    input.value = suggestion.dataset.code;
                    suggestionsContainer.style.display = 'none';
                });
            });
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

// Set minimum date to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('departure-date').min = today;
}

// Setup currency selection
function setupCurrencySelection() {
    const currencySelect = document.getElementById('currency');
    const priceCurrencyDisplay = document.getElementById('price-currency-display');
    const currencyInfoText = document.getElementById('currency-info-text');
    
    // Update currency display when selection changes
    currencySelect.addEventListener('change', function() {
        selectedCurrency = this.value;
        const currencyData = currencyInfo[selectedCurrency];
        
        // Update price filter header
        priceCurrencyDisplay.textContent = selectedCurrency;
        
        // Update info text
        currencyInfoText.textContent = `Prices will be displayed in ${currencyData.name} (${selectedCurrency})`;
        
        // Update placeholders based on currency
        updatePricePlaceholders();
        
        // If there are existing results, update their display
        if (flightResults.length > 0) {
            updateFlightResultsCurrency();
        }
    });
    
    // Initialize currency display
    selectedCurrency = currencySelect.value;
    updatePricePlaceholders();
}

// Update price input placeholders based on currency
function updatePricePlaceholders() {
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    
    // Set appropriate placeholders based on currency
    const placeholders = getCurrencyPlaceholders(selectedCurrency);
    minPriceInput.placeholder = placeholders.min;
    maxPriceInput.placeholder = placeholders.max;
}

// Get appropriate price placeholders for different currencies
function getCurrencyPlaceholders(currency) {
    const placeholderMap = {
        'USD': { min: '0', max: '5000' },
        'EUR': { min: '0', max: '4500' },
        'GBP': { min: '0', max: '4000' },
        'INR': { min: '0', max: '400000' },
        'JPY': { min: '0', max: '550000' },
        'AUD': { min: '0', max: '7500' },
        'CAD': { min: '0', max: '6500' },
        'CHF': { min: '0', max: '4800' },
        'CNY': { min: '0', max: '35000' },
        'KRW': { min: '0', max: '6000000' },
        'SGD': { min: '0', max: '6800' },
        'THB': { min: '0', max: '170000' },
        'AED': { min: '0', max: '18000' },
        'SAR': { min: '0', max: '19000' },
        'QAR': { min: '0', max: '18000' },
        'MYR': { min: '0', max: '21000' },
        'IDR': { min: '0', max: '75000000' },
        'PHP': { min: '0', max: '250000' },
        'VND': { min: '0', max: '115000000' },
        'BDT': { min: '0', max: '425000' },
        'LKR': { min: '0', max: '1000000' },
        'NPR': { min: '0', max: '640000' },
        'PKR': { min: '0', max: '900000' }
    };
    
    return placeholderMap[currency] || { min: '0', max: '5000' };
}

// Handle flight search
async function handleFlightSearch(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please log in to search flights', 'error');
        return;
    }
    
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const departureDate = document.getElementById('departure-date').value;
    const passengers = document.getElementById('passengers').value;
    const currency = document.getElementById('currency').value;
    const travelClass = document.getElementById('class').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    if (!origin || !destination) {
        showToast('Please enter both origin and destination', 'error');
        return;
    }
    
    if (origin === destination) {
        showToast('Origin and destination cannot be the same', 'error');
        return;
    }
    
    const searchParams = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departureDate,
        passengers: parseInt(passengers),
        currency: currency,
        travelClass: travelClass,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null
    };
    
    try {
        showLoading();
        await searchFlights(searchParams);
    } catch (error) {
        console.error('Flight search error:', error);
        showToast('Error searching flights. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Update all displayed prices when currency changes
function updateDisplayedPrices() {
    const selectedCurrency = document.getElementById('currency').value;
    const priceFilterHeader = document.getElementById('price-filter-header');
    
    // Update price filter header
    const currencySymbol = currencyInfo[selectedCurrency]?.symbol || selectedCurrency;
    priceFilterHeader.textContent = `Price (${currencySymbol})`;
    
    // Update all flight cards
    const flightCards = document.querySelectorAll('.flight-card');
    flightCards.forEach(card => {
        const priceElement = card.querySelector('.price');
        const flightId = card.dataset.flightId;
        
        if (flightId && window.currentFlights) {
            const flight = window.currentFlights.find(f => f.id === flightId);
            if (flight) {
                const convertedPrice = convertCurrency(flight.originalPrice || flight.price, 'USD', selectedCurrency);
                const formattedPrice = formatPrice(convertedPrice, selectedCurrency);
                priceElement.innerHTML = `<span class="amount">${formattedPrice}</span>`;
                
                // Update flight data for modal display
                flight.price = convertedPrice;
                flight.currency = selectedCurrency;
            }
        }
    });
    
    // Update modal if open
    const modal = document.getElementById('flight-details-modal');
    if (modal && modal.style.display === 'block') {
        const modalFlightId = modal.dataset.currentFlightId;
        if (modalFlightId && window.currentFlights) {
            const flight = window.currentFlights.find(f => f.id === modalFlightId);
            if (flight) {
                showFlightDetails(flight);
            }
        }
    }
}

// Add event listener for currency change
document.addEventListener('DOMContentLoaded', function() {
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', updateDisplayedPrices);
    }
});

// Store current flights globally for currency conversion
window.currentFlights = [];

// Search flights via backend API
async function searchFlights(params) {
    try {
        // Get Firebase ID token for authentication
        const idToken = await currentUser.getIdToken();
        
        const response = await fetch('/api/flights/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to search flights');
        }
        
        const data = await response.json();
        flightResults = data.flights || [];
        displayFlightResults(flightResults, params);
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback to mock data for demonstration
        console.log('Using mock data for demonstration');
        flightResults = generateMockFlights(params);
        displayFlightResults(flightResults, params);
        
        showToast('Using demo data - Configure Amadeus API for real results', 'error');
    }
}

// Generate mock flight data for demonstration
function generateMockFlights(params) {
    // Base prices in USD
    const baseFlights = [
        {
            id: '1',
            airline: 'Air India',
            flightNumber: 'AI-142',
            origin: params.origin,
            destination: params.destination,
            departureTime: '10:30',
            arrivalTime: '14:45',
            duration: '4h 15m',
            stops: 0,
            basePrice: 299, // Base price in USD
            aircraft: 'Boeing 737-800',
            amenities: ['WiFi', 'Meals', 'Entertainment']
        },
        {
            id: '2',
            airline: 'IndiGo',
            flightNumber: '6E-1023',
            origin: params.origin,
            destination: params.destination,
            departureTime: '06:15',
            arrivalTime: '12:20',
            duration: '6h 05m',
            stops: 1,
            stopover: 'DEL',
            basePrice: 245,
            aircraft: 'Airbus A320',
            amenities: ['WiFi', 'Snacks']
        },
        {
            id: '3',
            airline: 'Thai Airways',
            flightNumber: 'TG-314',
            origin: params.origin,
            destination: params.destination,
            departureTime: '23:55',
            arrivalTime: '06:30+1',
            duration: '4h 35m',
            stops: 0,
            basePrice: 425,
            aircraft: 'Boeing 777-300',
            amenities: ['WiFi', 'Meals', 'Entertainment', 'Lounge Access']
        },
        {
            id: '4',
            airline: 'Singapore Airlines',
            flightNumber: 'SQ-516',
            origin: params.origin,
            destination: params.destination,
            departureTime: '15:20',
            arrivalTime: '19:45',
            duration: '4h 25m',
            stops: 0,
            basePrice: 385,
            aircraft: 'Airbus A350',
            amenities: ['WiFi', 'Meals', 'Entertainment', 'Lounge Access', 'Premium Service']
        }
    ];
    
    // Convert prices to selected currency
    const convertedFlights = baseFlights.map(flight => {
        const convertedPrice = convertCurrency(flight.basePrice, 'USD', params.currency);
        return {
            ...flight,
            price: Math.round(convertedPrice),
            currency: params.currency
        };
    });
    
    // Apply price filters in the selected currency
    let filtered = convertedFlights;
    if (params.minPrice) {
        filtered = filtered.filter(flight => flight.price >= params.minPrice);
    }
    if (params.maxPrice) {
        filtered = filtered.filter(flight => flight.price <= params.maxPrice);
    }
    
    return filtered;
}

// Simple currency conversion (in production, use real exchange rates API)
function convertCurrency(amount, fromCurrency, toCurrency) {
    // Mock exchange rates (in production, fetch from a real API like exchangerate-api.com)
    const exchangeRates = {
        'USD': 1.0,
        'EUR': 0.92,
        'GBP': 0.79,
        'INR': 83.15,
        'JPY': 149.50,
        'AUD': 1.55,
        'CAD': 1.36,
        'CHF': 0.91,
        'CNY': 7.24,
        'KRW': 1340.00,
        'SGD': 1.36,
        'THB': 36.50,
        'AED': 3.67,
        'SAR': 3.75,
        'QAR': 3.64,
        'MYR': 4.68,
        'IDR': 15400.00,
        'PHP': 56.50,
        'VND': 24300.00,
        'BDT': 110.00,
        'LKR': 326.00,
        'NPR': 133.00,
        'PKR': 279.00
    };
    
    // Convert from source currency to USD, then to target currency
    const usdAmount = amount / exchangeRates[fromCurrency];
    const convertedAmount = usdAmount * exchangeRates[toCurrency];
    
    return convertedAmount;
}

// Format price with appropriate currency symbol and formatting
function formatPrice(amount, currency) {
    const currencyData = currencyInfo[currency];
    const symbol = currencyData ? currencyData.symbol : currency;
    
    // Format based on currency conventions
    if (['JPY', 'KRW', 'VND', 'IDR'].includes(currency)) {
        // No decimal places for these currencies
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    } else {
        // Two decimal places for most currencies
        return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
}

// Display flight results
function displayFlightResults(flights, searchParams) {
    resultsContainer.innerHTML = '';
    
    if (flights.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>No flights found</h3>
                <p>Try adjusting your search criteria or dates</p>
            </div>
        `;
        return;
    }
    
    // Store original prices and prepare flights for currency conversion
    const selectedCurrency = document.getElementById('currency').value;
    const processedFlights = flights.map(flight => {
        const processedFlight = { ...flight };
        // Store original price if not already stored
        if (!processedFlight.originalPrice) {
            processedFlight.originalPrice = flight.basePrice || flight.price || 299;
        }
        // Convert to selected currency
        processedFlight.price = convertCurrency(processedFlight.originalPrice, 'USD', selectedCurrency);
        processedFlight.currency = selectedCurrency;
        return processedFlight;
    });
    
    // Store globally for currency conversion
    window.currentFlights = processedFlights;
    
    const resultsHTML = `
        <div class="results-header">
            <h2>Found ${processedFlights.length} flight${processedFlights.length > 1 ? 's' : ''}</h2>
            <p>${searchParams.origin} → ${searchParams.destination}</p>
        </div>
        <div class="results-grid">
            ${processedFlights.map(flight => createFlightCard(flight)).join('')}
        </div>
    `;
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Add click handlers to flight cards
    resultsContainer.querySelectorAll('.flight-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            const modal = document.getElementById('flight-details-modal');
            modal.dataset.currentFlightId = processedFlights[index].id;
            showFlightDetails(processedFlights[index]);
        });
    });
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Create flight card HTML
function createFlightCard(flight) {
    const stopText = flight.stops === 0 ? 'Non-stop' : 
                    flight.stops === 1 ? '1 stop' : `${flight.stops} stops`;
    
    const formattedPrice = formatPrice(flight.price, flight.currency);
    
    return `
        <div class="flight-card" data-flight-id="${flight.id}">
            <div class="flight-header">
                <div class="airline-info">
                    <div class="airline-logo">${flight.airline.charAt(0)}</div>
                    <div>
                        <div class="airline-name">${flight.airline}</div>
                        <div class="flight-number">${flight.flightNumber}</div>
                    </div>
                </div>
                <div class="price">${formattedPrice}</div>
            </div>
            
            <div class="flight-route">
                <div class="airport">
                    <div class="airport-code">${flight.origin}</div>
                    <div class="airport-name">${flight.departureTime}</div>
                </div>
                <div class="flight-arrow">✈️</div>
                <div class="airport">
                    <div class="airport-code">${flight.destination}</div>
                    <div class="airport-name">${flight.arrivalTime}</div>
                </div>
            </div>
            
            <div class="flight-details">
                <div class="duration">
                    <span>⏱️</span>
                    <span>${flight.duration}</span>
                </div>
                <div class="stops">
                    <span>🔄</span>
                    <span>${stopText}</span>
                </div>
            </div>
        </div>
    `;
}

// Show flight details in modal
function showFlightDetails(flight) {
    const modalContent = document.getElementById('modal-content');
    
    const amenitiesList = flight.amenities ? 
        flight.amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('') :
        '<span class="amenity-tag">Basic Service</span>';
    
    const stopoverInfo = flight.stopover ? 
        `<div class="stopover-info">
            <h4>Stopover</h4>
            <p>Connection in ${flight.stopover}</p>
        </div>` : '';
    
    const formattedPrice = formatPrice(flight.price, flight.currency);
    const currencyName = currencyInfo[flight.currency]?.name || flight.currency;
    
    modalContent.innerHTML = `
        <div class="flight-detail-header">
            <div class="airline-info-large">
                <div class="airline-logo-large">${flight.airline.charAt(0)}</div>
                <div>
                    <h3>${flight.airline}</h3>
                    <p>Flight ${flight.flightNumber}</p>
                    <p>${flight.aircraft || 'Aircraft not specified'}</p>
                </div>
            </div>
            <div class="price-large">${formattedPrice} <span class="currency">${currencyName}</span></div>
        </div>
        
        <div class="flight-timeline">
            <div class="timeline-item">
                <div class="timeline-time">${flight.departureTime}</div>
                <div class="timeline-airport">
                    <strong>${flight.origin}</strong>
                    <br><small>Departure</small>
                </div>
            </div>
            <div class="timeline-connector">
                <div class="timeline-line"></div>
                <div class="timeline-duration">${flight.duration}</div>
            </div>
            <div class="timeline-item">
                <div class="timeline-time">${flight.arrivalTime}</div>
                <div class="timeline-airport">
                    <strong>${flight.destination}</strong>
                    <br><small>Arrival</small>
                </div>
            </div>
        </div>
        
        ${stopoverInfo}
        
        <div class="amenities-section">
            <h4>Amenities & Services</h4>
            <div class="amenities-list">
                ${amenitiesList}
            </div>
        </div>
        
        <div class="booking-section">
            <button class="book-flight-btn" onclick="bookFlight('${flight.id}')">
                Book This Flight - ${formattedPrice}
            </button>
            <p class="booking-note">You will be redirected to complete your booking</p>
        </div>
    `;
    
    // Add additional styles for modal content
    const style = document.createElement('style');
    style.textContent = `
        .flight-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .airline-info-large {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .airline-logo-large {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #667eea;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.5rem;
        }
        
        .price-large {
            font-size: 2rem;
            font-weight: 700;
            color: #27ae60;
        }
        
        .currency {
            font-size: 1rem;
            color: #7f8c8d;
        }
        
        .flight-timeline {
            margin: 2rem 0;
            position: relative;
        }
        
        .timeline-item {
            display: flex;
            align-items: center;
            gap: 2rem;
            margin: 1rem 0;
        }
        
        .timeline-time {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2c3e50;
            min-width: 80px;
        }
        
        .timeline-airport {
            flex: 1;
        }
        
        .timeline-connector {
            display: flex;
            align-items: center;
            margin: 0.5rem 0;
            padding-left: 40px;
        }
        
        .timeline-line {
            width: 2px;
            height: 30px;
            background: #667eea;
            margin-right: 1rem;
        }
        
        .timeline-duration {
            background: #f8f9fa;
            padding: 0.25rem 0.75rem;
            border-radius: 15px;
            font-size: 0.9rem;
            color: #7f8c8d;
        }
        
        .stopover-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
        }
        
        .amenities-section {
            margin: 2rem 0;
        }
        
        .amenities-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .amenity-tag {
            background: #667eea;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 15px;
            font-size: 0.8rem;
        }
        
        .booking-section {
            text-align: center;
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #e9ecef;
        }
        
        .book-flight-btn {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .book-flight-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(39, 174, 96, 0.3);
        }
        
        .booking-note {
            color: #7f8c8d;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
    `;
    
    if (!document.querySelector('#modal-styles')) {
        style.id = 'modal-styles';
        document.head.appendChild(style);
    }
    
    modalOverlay.classList.remove('hidden');
}

// Book flight (placeholder function)
function bookFlight(flightId) {
    showToast('Booking functionality would be implemented here', 'success');
    closeModal();
}

// Close modal
function closeModal() {
    modalOverlay.classList.add('hidden');
}

// Show/hide loading overlay
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Show auth error
function showAuthError(message) {
    authError.textContent = message;
    authError.classList.add('show');
}

// Hide auth error
function hideAuthError() {
    authError.classList.remove('show');
}

// Show toast message
function showToast(message, type = 'info') {
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(hideToast, 5000);
}

// Hide toast
function hideToast() {
    toast.classList.add('hidden');
}

// Get user-friendly error message
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No account found with this email address';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection';
        case 'auth/popup-blocked':
            return 'Popup blocked. Please allow popups for this site';
        default:
            return error.message || 'An error occurred. Please try again';
    }
}
