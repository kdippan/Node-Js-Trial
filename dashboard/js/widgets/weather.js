/**
 * Weather Widget - Current weather conditions and forecast
 * Customizable Dashboard
 */

/**
 * Create weather widget
 */
export function createWidget(initialConfig = {}) {
    // Default configuration
    const defaultConfig = {
        title: 'Weather',
        city: 'New York',
        units: 'metric', // 'metric', 'imperial', 'kelvin'
        showForecast: false,
        autoRefresh: true,
        refreshInterval: 600000, // 10 minutes
        apiKey: '', // Optional API key for live data
        useGeolocation: false
    };

    // Merge with initial config
    const config = { ...defaultConfig, ...initialConfig };
    
    // Widget state
    let element = null;
    let updateTimer = null;
    let isDestroyed = false;
    let weatherData = null;

    // Mock weather data for offline mode
    const mockWeatherData = {
        'New York': {
            temperature: 22,
            condition: 'partly-cloudy',
            description: 'Partly Cloudy',
            humidity: 65,
            windSpeed: 12,
            pressure: 1013,
            visibility: 10,
            uvIndex: 6,
            icon: '⛅'
        },
        'London': {
            temperature: 18,
            condition: 'rainy',
            description: 'Light Rain',
            humidity: 80,
            windSpeed: 8,
            pressure: 1008,
            visibility: 8,
            uvIndex: 3,
            icon: '🌧️'
        },
        'Tokyo': {
            temperature: 26,
            condition: 'sunny',
            description: 'Sunny',
            humidity: 55,
            windSpeed: 5,
            pressure: 1020,
            visibility: 15,
            uvIndex: 8,
            icon: '☀️'
        },
        'Paris': {
            temperature: 20,
            condition: 'cloudy',
            description: 'Cloudy',
            humidity: 70,
            windSpeed: 10,
            pressure: 1015,
            visibility: 12,
            uvIndex: 4,
            icon: '☁️'
        }
    };

    /**
     * Create widget element
     */
    function createElement() {
        const widget = document.createElement('div');
        widget.className = 'weather-widget';
        
        widget.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${config.title}</h3>
                <div class="widget-actions">
                    <button class="widget-action" data-action="settings" aria-label="Settings">
                        <svg viewBox="0 0 24 24">
                            <use href="./assets/icons.svg#settings"></use>
                        </svg>
                    </button>
                    <button class="widget-action" data-action="refresh" aria-label="Refresh">
                        <svg viewBox="0 0 24 24">
                            <use href="./assets/icons.svg#refresh"></use>
                        </svg>
                    </button>
                    <button class="widget-action" data-action="minimize" aria-label="Minimize">
                        <svg viewBox="0 0 24 24">
                            <use href="./assets/icons.svg#minimize"></use>
                        </svg>
                    </button>
                    <button class="widget-action" data-action="remove" aria-label="Remove">
                        <svg viewBox="0 0 24 24">
                            <use href="./assets/icons.svg#remove"></use>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="widget-body">
                <div class="widget-content">
                    ${createWeatherDisplay()}
                </div>
            </div>
        `;

        // Set up event listeners
        setupEventListeners(widget);
        
        return widget;
    }

    /**
     * Create weather display
     */
    function createWeatherDisplay() {
        return `
            <div class="weather-main">
                <div class="weather-icon" id="weather-icon">🌤️</div>
                <div class="weather-temp" id="weather-temp">--°</div>
                <div class="weather-condition" id="weather-condition">Loading...</div>
                <div class="weather-location" id="weather-location">${config.city}</div>
            </div>
            <div class="weather-details" id="weather-details">
                <div class="weather-detail">
                    <span>Humidity</span>
                    <span id="humidity">--%</span>
                </div>
                <div class="weather-detail">
                    <span>Wind</span>
                    <span id="wind-speed">-- km/h</span>
                </div>
                <div class="weather-detail">
                    <span>Pressure</span>
                    <span id="pressure">-- hPa</span>
                </div>
                <div class="weather-detail">
                    <span>UV Index</span>
                    <span id="uv-index">--</span>
                </div>
            </div>
            <div class="weather-status" id="weather-status">
                <small>Offline Mode - Mock Data</small>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners(widget) {
        // Widget action buttons
        widget.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action) {
                handleAction(action);
            }
        });

        // Double-click to change location
        const weatherMain = widget.querySelector('.weather-main');
        weatherMain.addEventListener('dblclick', () => {
            promptForLocation();
        });
    }

    /**
     * Handle widget actions
     */
    function handleAction(action) {
        switch (action) {
            case 'settings':
                showSettings();
                break;
            case 'refresh':
                fetchWeatherData();
                break;
            case 'minimize':
                // Handled by grid manager
                break;
            case 'remove':
                // Handled by grid manager
                break;
        }
    }

    /**
     * Prompt for location change
     */
    function promptForLocation() {
        const newCity = prompt('Enter city name:', config.city);
        if (newCity && newCity.trim() !== config.city) {
            config.city = newCity.trim();
            updateLocationDisplay();
            fetchWeatherData();
        }
    }

    /**
     * Show settings modal
     */
    function showSettings() {
        console.log('Weather settings requested');
    }

    /**
     * Fetch weather data
     */
    async function fetchWeatherData() {
        if (isDestroyed) return;

        try {
            showLoading(true);
            
            // Try to fetch live data if API key is available
            if (config.apiKey) {
                await fetchLiveWeatherData();
            } else {
                // Use mock data
                await fetchMockWeatherData();
            }
            
            updateWeatherDisplay();
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            showError('Failed to fetch weather data');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Fetch live weather data from API
     */
    async function fetchLiveWeatherData() {
        // Using OpenWeatherMap API as an example
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(config.city)}&appid=${config.apiKey}&units=${config.units}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        weatherData = {
            temperature: Math.round(data.main.temp),
            condition: data.weather[0].main.toLowerCase(),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * (config.units === 'metric' ? 3.6 : 1)), // Convert m/s to km/h for metric
            pressure: data.main.pressure,
            visibility: data.visibility ? Math.round(data.visibility / 1000) : 10,
            uvIndex: 0, // Would need additional API call
            icon: getWeatherIcon(data.weather[0].main, data.weather[0].icon),
            isLive: true
        };
        
        updateStatusDisplay('Live Data');
    }

    /**
     * Fetch mock weather data
     */
    async function fetchMockWeatherData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get mock data for city or use default
        const cityData = mockWeatherData[config.city] || mockWeatherData['New York'];
        
        weatherData = {
            ...cityData,
            temperature: adjustTemperatureForUnits(cityData.temperature),
            windSpeed: adjustWindSpeedForUnits(cityData.windSpeed),
            isLive: false
        };
        
        updateStatusDisplay('Offline Mode - Mock Data');
    }

    /**
     * Adjust temperature based on units
     */
    function adjustTemperatureForUnits(celsius) {
        switch (config.units) {
            case 'imperial':
                return Math.round(celsius * 9/5 + 32);
            case 'kelvin':
                return Math.round(celsius + 273.15);
            default:
                return celsius;
        }
    }

    /**
     * Adjust wind speed based on units
     */
    function adjustWindSpeedForUnits(kmh) {
        switch (config.units) {
            case 'imperial':
                return Math.round(kmh * 0.621371); // Convert to mph
            default:
                return kmh;
        }
    }

    /**
     * Get weather icon for condition
     */
    function getWeatherIcon(condition, iconCode = null) {
        const iconMap = {
            'clear': '☀️',
            'sunny': '☀️',
            'clouds': '☁️',
            'cloudy': '☁️',
            'rain': '🌧️',
            'rainy': '🌧️',
            'drizzle': '🌦️',
            'thunderstorm': '⛈️',
            'snow': '❄️',
            'mist': '🌫️',
            'fog': '🌫️',
            'partly-cloudy': '⛅'
        };
        
        return iconMap[condition.toLowerCase()] || '🌤️';
    }

    /**
     * Update weather display
     */
    function updateWeatherDisplay() {
        if (!weatherData || !element) return;

        const icon = element.querySelector('#weather-icon');
        const temp = element.querySelector('#weather-temp');
        const condition = element.querySelector('#weather-condition');
        const humidity = element.querySelector('#humidity');
        const windSpeed = element.querySelector('#wind-speed');
        const pressure = element.querySelector('#pressure');
        const uvIndex = element.querySelector('#uv-index');

        if (icon) icon.textContent = weatherData.icon;
        if (temp) temp.textContent = `${weatherData.temperature}${getTemperatureUnit()}`;
        if (condition) condition.textContent = weatherData.description;
        if (humidity) humidity.textContent = `${weatherData.humidity}%`;
        if (windSpeed) windSpeed.textContent = `${weatherData.windSpeed} ${getWindSpeedUnit()}`;
        if (pressure) pressure.textContent = `${weatherData.pressure} hPa`;
        if (uvIndex) uvIndex.textContent = weatherData.uvIndex || '--';

        // Add temperature-based styling
        updateTemperatureColor(temp, weatherData.temperature);
    }

    /**
     * Get temperature unit symbol
     */
    function getTemperatureUnit() {
        switch (config.units) {
            case 'imperial':
                return '°F';
            case 'kelvin':
                return 'K';
            default:
                return '°C';
        }
    }

    /**
     * Get wind speed unit
     */
    function getWindSpeedUnit() {
        switch (config.units) {
            case 'imperial':
                return 'mph';
            default:
                return 'km/h';
        }
    }

    /**
     * Update temperature color based on value
     */
    function updateTemperatureColor(element, temperature) {
        if (!element) return;

        // Convert to Celsius for comparison
        let celsius = temperature;
        if (config.units === 'imperial') {
            celsius = (temperature - 32) * 5/9;
        } else if (config.units === 'kelvin') {
            celsius = temperature - 273.15;
        }

        // Apply color based on temperature
        element.style.color = '';
        if (celsius <= 0) {
            element.style.color = '#3b82f6'; // Cold - Blue
        } else if (celsius <= 10) {
            element.style.color = '#06b6d4'; // Cool - Cyan
        } else if (celsius <= 25) {
            element.style.color = '#10b981'; // Mild - Green
        } else if (celsius <= 35) {
            element.style.color = '#f59e0b'; // Warm - Orange
        } else {
            element.style.color = '#ef4444'; // Hot - Red
        }
    }

    /**
     * Update location display
     */
    function updateLocationDisplay() {
        const locationElement = element?.querySelector('#weather-location');
        if (locationElement) {
            locationElement.textContent = config.city;
        }
    }

    /**
     * Update status display
     */
    function updateStatusDisplay(status) {
        const statusElement = element?.querySelector('#weather-status small');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * Show loading state
     */
    function showLoading(isLoading) {
        const details = element?.querySelector('#weather-details');
        if (details) {
            details.style.opacity = isLoading ? '0.5' : '1';
        }

        const condition = element?.querySelector('#weather-condition');
        if (condition && isLoading) {
            condition.textContent = 'Loading...';
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        const condition = element?.querySelector('#weather-condition');
        if (condition) {
            condition.textContent = 'Error loading data';
            condition.style.color = 'var(--danger)';
        }

        // Show toast notification
        window.dashboard?.ui?.showToast(message, 'error');
    }

    /**
     * Start auto-refresh timer
     */
    function startAutoRefresh() {
        if (config.autoRefresh && config.refreshInterval > 0) {
            updateTimer = setInterval(fetchWeatherData, config.refreshInterval);
        }
    }

    /**
     * Stop auto-refresh timer
     */
    function stopAutoRefresh() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }

    /**
     * Initialize widget
     */
    function init() {
        element = createElement();
        fetchWeatherData();
        startAutoRefresh();
        return element;
    }

    /**
     * Destroy widget
     */
    function destroy() {
        isDestroyed = true;
        stopAutoRefresh();
        
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        element = null;
        weatherData = null;
    }

    /**
     * Get widget configuration
     */
    function getConfig() {
        return { ...config };
    }

    /**
     * Set widget configuration
     */
    function setConfig(newConfig) {
        const oldCity = config.city;
        const oldUnits = config.units;
        const oldRefreshInterval = config.refreshInterval;
        
        Object.assign(config, newConfig);
        
        // Update title if changed
        if (newConfig.title) {
            const titleElement = element?.querySelector('.widget-title');
            if (titleElement) {
                titleElement.textContent = newConfig.title;
            }
        }
        
        // Update location if changed
        if (newConfig.city && newConfig.city !== oldCity) {
            updateLocationDisplay();
            fetchWeatherData();
        }
        
        // Refresh if units changed
        if (newConfig.units && newConfig.units !== oldUnits) {
            fetchWeatherData();
        }
        
        // Update refresh timer if interval changed
        if (newConfig.refreshInterval !== oldRefreshInterval) {
            stopAutoRefresh();
            startAutoRefresh();
        }
    }

    /**
     * Refresh widget
     */
    function refresh() {
        fetchWeatherData();
    }

    /**
     * Get settings form for configuration
     */
    function getSettingsForm() {
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="weather-city">City</label>
                <input type="text" id="weather-city" class="form-input" 
                       name="city" value="${config.city}" 
                       placeholder="Enter city name">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="weather-units">Units</label>
                <select id="weather-units" class="form-select" name="units">
                    <option value="metric" ${config.units === 'metric' ? 'selected' : ''}>Metric (°C, km/h)</option>
                    <option value="imperial" ${config.units === 'imperial' ? 'selected' : ''}>Imperial (°F, mph)</option>
                    <option value="kelvin" ${config.units === 'kelvin' ? 'selected' : ''}>Kelvin (K, km/h)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="weather-api-key">API Key (Optional)</label>
                <input type="password" id="weather-api-key" class="form-input" 
                       name="apiKey" value="${config.apiKey}" 
                       placeholder="OpenWeatherMap API key for live data">
                <div class="form-help">Leave empty to use mock data</div>
            </div>
            
            <div class="form-group">
                <div class="form-checkbox">
                    <input type="checkbox" id="weather-auto-refresh" 
                           name="autoRefresh" ${config.autoRefresh ? 'checked' : ''}>
                    <label for="weather-auto-refresh">Auto-refresh</label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="weather-refresh-interval">Refresh Interval (minutes)</label>
                <input type="number" id="weather-refresh-interval" class="form-input" 
                       name="refreshInterval" value="${config.refreshInterval / 60000}" 
                       min="1" max="60" placeholder="10">
            </div>
        `;
        
        return form;
    }

    // Initialize and return widget API
    const widget = {
        el: init(),
        getConfig,
        setConfig,
        refresh,
        destroy,
        getSettingsForm
    };

    return widget;
}