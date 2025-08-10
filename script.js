// DOM Elements
const elements = {
    temperature: document.querySelector('.temperature'),
    location: document.querySelector('.location'),
    time: document.querySelector('.time'),
    date: document.querySelector('.date'),
    conditionIcon: document.querySelector('.weather-icon'),
    conditionText: document.querySelector('.condition-text'),
    windSpeed: document.querySelector('.wind-speed'),
    windDir: document.querySelector('.wind-dir'),
    humidity: document.querySelector('.humidity'),
    pressure: document.querySelector('.pressure'),
    visibility: document.querySelector('.visibility'),
    searchInput: document.querySelector('.search-input'),
    searchForm: document.querySelector('.search-form'),
    suggestions: document.querySelector('.search-suggestions'),
    unitButtons: document.querySelectorAll('.unit-switcher button')
};

// App State
const state = {
    currentUnit: 'c',
    lastLocation: localStorage.getItem('lastLocation') || 'London',
    weatherData: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    setupEventListeners();
    await fetchWeather(state.lastLocation);
}

// Event Listeners
function setupEventListeners() {
    elements.searchForm.addEventListener('submit', handleSearch);
    elements.searchInput.addEventListener('input', debounce(handleInput, 300));
    elements.suggestions.addEventListener('click', handleSuggestionClick);
    
    elements.unitButtons.forEach(btn => {
        btn.addEventListener('click', () => switchUnit(btn.dataset.unit));
    });
}

// Fetch Weather Data
async function fetchWeather(location) {
    try {
        showLoadingState();
        
        const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=44ab26d1da7d4804a1d30908251008&q=${encodeURIComponent(location)}`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Weather data unavailable');
        }
        
        state.weatherData = await response.json();
        updateUI();
        storeLocation(location);
        
    } catch (error) {
        console.error('Fetch error:', error);
        showErrorState(error.message);
    }
}

// Update UI with Weather Data
function updateUI() {
    const { location, current } = state.weatherData;
    
    // Location and Time
    elements.location.textContent = `${location.name}, ${location.country}`;
    updateDateTime(location.localtime);
    
    // Temperature
    updateTemperature(current[`temp_${state.currentUnit}`], state.currentUnit);
    
    // Weather Condition
    elements.conditionIcon.src = `https:${current.condition.icon}`;
    elements.conditionIcon.alt = current.condition.text;
    elements.conditionText.textContent = current.condition.text;
    
    // Detailed Info
    elements.windSpeed.textContent = `${current.wind_kph} km/h`;
    elements.windDir.textContent = current.wind_dir;
    elements.humidity.textContent = `${current.humidity}%`;
    elements.pressure.textContent = `${current.pressure_mb} hPa`;
    elements.visibility.textContent = `${current.vis_km} km`;
    
    // Update day/night styling
    document.body.classList.toggle('night-mode', !current.is_day);
}

function updateDateTime(localtime) {
    const date = new Date(localtime);
    
    // Format time (HH:MM AM/PM)
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    elements.time.textContent = date.toLocaleTimeString(undefined, timeOptions);
    
    // Format date (Weekday, Month Day, Year)
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.date.textContent = date.toLocaleDateString(undefined, dateOptions);
}

function updateTemperature(temp, unit) {
    elements.temperature.textContent = Math.round(temp);
    elements.unitButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });
}

// Unit Conversion
function switchUnit(unit) {
    if (state.currentUnit === unit || !state.weatherData) return;
    
    state.currentUnit = unit;
    const temp = state.weatherData.current[`temp_${unit}`];
    updateTemperature(temp, unit);
}

// Search Handling
async function handleSearch(e) {
    e.preventDefault();
    const location = elements.searchInput.value.trim();
    if (location) {
        await fetchWeather(location);
        clearSearch();
    }
}

async function handleInput() {
    const query = elements.searchInput.value.trim();
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/search.json?key=44ab26d1da7d4804a1d30908251008&q=${encodeURIComponent(query)}`
        );
        
        if (!response.ok) throw new Error('Suggestions unavailable');
        
        const suggestions = await response.json();
        showSuggestions(suggestions);
        
    } catch (error) {
        console.error('Suggestions error:', error);
        hideSuggestions();
    }
}

function handleSuggestionClick(e) {
    if (e.target.classList.contains('suggestion-item')) {
        fetchWeather(e.target.textContent);
        clearSearch();
    }
}

function showSuggestions(suggestions) {
    if (!suggestions || !suggestions.length) {
        elements.suggestions.innerHTML = '<div class="suggestion-item">No results found</div>';
    } else {
        elements.suggestions.innerHTML = suggestions
            .slice(0, 5)
            .map(item => `<div class="suggestion-item">${item.name}, ${item.country}</div>`)
            .join('');
    }
    elements.suggestions.classList.add('show');
}

function hideSuggestions() {
    elements.suggestions.classList.remove('show');
}

function clearSearch() {
    elements.searchInput.value = '';
    hideSuggestions();
}

// State Management
function storeLocation(location) {
    state.lastLocation = location;
    localStorage.setItem('lastLocation', location);
}

// UI States
function showLoadingState() {
    elements.temperature.textContent = '...';
    elements.conditionText.textContent = 'Loading...';
}

function showErrorState(message) {
    elements.temperature.textContent = '--';
    elements.conditionText.textContent = message || 'Data unavailable';
}

// Utility
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Night mode styles (added to CSS)
const style = document.createElement('style');
style.textContent = `
    .night-mode .weather-card {
        background: rgba(0, 0, 0, 0.3);
    }
    .night-mode .detail-card {
        background: rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);
