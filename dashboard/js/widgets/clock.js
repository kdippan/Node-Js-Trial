/**
 * Clock Widget - Digital and analog clock with timezone support
 * Customizable Dashboard
 */

/**
 * Create clock widget
 */
export function createWidget(initialConfig = {}) {
    // Default configuration
    const defaultConfig = {
        title: 'Clock',
        mode: 'digital', // 'digital' or 'analog'
        format: '24h', // '12h' or '24h'
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        showDate: true,
        showSeconds: true,
        theme: 'default'
    };

    // Merge with initial config
    const config = { ...defaultConfig, ...initialConfig };
    
    // Widget state
    let element = null;
    let updateTimer = null;
    let isDestroyed = false;

    /**
     * Create widget element
     */
    function createElement() {
        const widget = document.createElement('div');
        widget.className = 'clock-widget';
        
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
                    <div class="clock-display">
                        ${config.mode === 'digital' ? createDigitalClock() : createAnalogClock()}
                    </div>
                </div>
            </div>
        `;

        // Set up event listeners
        setupEventListeners(widget);
        
        return widget;
    }

    /**
     * Create digital clock display
     */
    function createDigitalClock() {
        return `
            <div class="clock-time" id="clock-time">00:00:00</div>
            ${config.showDate ? '<div class="clock-date" id="clock-date">Loading...</div>' : ''}
            <div class="clock-timezone" id="clock-timezone">${config.timezone}</div>
        `;
    }

    /**
     * Create analog clock display
     */
    function createAnalogClock() {
        return `
            <div class="clock-analog" id="analog-clock">
                <div class="clock-hand clock-hand-hour" id="hour-hand"></div>
                <div class="clock-hand clock-hand-minute" id="minute-hand"></div>
                <div class="clock-hand clock-hand-second" id="second-hand"></div>
                <div class="clock-center"></div>
                <!-- Clock numbers -->
                ${Array.from({ length: 12 }, (_, i) => {
                    const num = i === 0 ? 12 : i;
                    const angle = i * 30 - 90; // Convert to degrees, offset by 90
                    const x = 50 + 35 * Math.cos(angle * Math.PI / 180);
                    const y = 50 + 35 * Math.sin(angle * Math.PI / 180);
                    return `<div class="clock-number" style="position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); font-size: 12px; font-weight: bold;">${num}</div>`;
                }).join('')}
            </div>
            ${config.showDate ? '<div class="clock-date" id="clock-date">Loading...</div>' : ''}
            <div class="clock-timezone" id="clock-timezone">${config.timezone}</div>
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

        // Toggle between modes on double-click
        const clockDisplay = widget.querySelector('.clock-display');
        clockDisplay.addEventListener('dblclick', () => {
            toggleMode();
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
                updateClock();
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
     * Toggle between digital and analog modes
     */
    function toggleMode() {
        config.mode = config.mode === 'digital' ? 'analog' : 'digital';
        
        // Recreate display
        const clockDisplay = element.querySelector('.clock-display');
        clockDisplay.innerHTML = config.mode === 'digital' ? createDigitalClock() : createAnalogClock();
        
        // Update immediately
        updateClock();
        
        // Show toast notification
        window.dashboard?.ui?.showToast(`Switched to ${config.mode} mode`, 'success');
    }

    /**
     * Show settings modal
     */
    function showSettings() {
        // This would integrate with the main UI manager
        console.log('Clock settings requested');
    }

    /**
     * Update clock display
     */
    function updateClock() {
        if (isDestroyed || !element) return;

        try {
            const now = new Date();
            
            if (config.mode === 'digital') {
                updateDigitalClock(now);
            } else {
                updateAnalogClock(now);
            }
            
            if (config.showDate) {
                updateDate(now);
            }
            
        } catch (error) {
            console.error('Error updating clock:', error);
        }
    }

    /**
     * Update digital clock display
     */
    function updateDigitalClock(date) {
        const timeElement = element.querySelector('#clock-time');
        if (!timeElement) return;

        const options = {
            timeZone: config.timezone,
            hour12: config.format === '12h',
            hour: '2-digit',
            minute: '2-digit'
        };

        if (config.showSeconds) {
            options.second = '2-digit';
        }

        const timeString = date.toLocaleTimeString('en-US', options);
        timeElement.textContent = timeString;
        
        // Add pulsing animation on second change
        if (config.showSeconds) {
            timeElement.style.animation = 'none';
            timeElement.offsetHeight; // Trigger reflow
            timeElement.style.animation = 'pulse 0.5s ease-out';
        }
    }

    /**
     * Update analog clock display
     */
    function updateAnalogClock(date) {
        const hourHand = element.querySelector('#hour-hand');
        const minuteHand = element.querySelector('#minute-hand');
        const secondHand = element.querySelector('#second-hand');
        
        if (!hourHand || !minuteHand || !secondHand) return;

        // Get time in selected timezone
        const timeInZone = new Date(date.toLocaleString('en-US', { timeZone: config.timezone }));
        
        const hours = timeInZone.getHours() % 12;
        const minutes = timeInZone.getMinutes();
        const seconds = timeInZone.getSeconds();

        // Calculate angles (0 degrees = 12 o'clock)
        const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
        const minuteAngle = minutes * 6; // 6 degrees per minute
        const secondAngle = seconds * 6; // 6 degrees per second

        // Apply rotations
        hourHand.style.transform = `rotate(${hourAngle}deg)`;
        minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        secondHand.style.transform = `rotate(${secondAngle}deg)`;
        
        // Add smooth transition for second hand
        if (config.showSeconds) {
            secondHand.style.transition = seconds === 0 ? 'none' : 'transform 0.1s ease-out';
        }
    }

    /**
     * Update date display
     */
    function updateDate(date) {
        const dateElement = element.querySelector('#clock-date');
        if (!dateElement) return;

        const options = {
            timeZone: config.timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const dateString = date.toLocaleDateString('en-US', options);
        dateElement.textContent = dateString;
    }

    /**
     * Start the clock
     */
    function start() {
        // Update immediately
        updateClock();
        
        // Set up interval for updates
        updateTimer = setInterval(updateClock, 1000);
    }

    /**
     * Stop the clock
     */
    function stop() {
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
        start();
        return element;
    }

    /**
     * Destroy widget
     */
    function destroy() {
        isDestroyed = true;
        stop();
        
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        element = null;
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
        const oldMode = config.mode;
        Object.assign(config, newConfig);
        
        // Update title if changed
        if (newConfig.title) {
            const titleElement = element?.querySelector('.widget-title');
            if (titleElement) {
                titleElement.textContent = newConfig.title;
            }
        }
        
        // Recreate display if mode changed
        if (newConfig.mode && newConfig.mode !== oldMode) {
            const clockDisplay = element?.querySelector('.clock-display');
            if (clockDisplay) {
                clockDisplay.innerHTML = config.mode === 'digital' ? createDigitalClock() : createAnalogClock();
            }
        }
        
        // Update immediately
        updateClock();
    }

    /**
     * Refresh widget
     */
    function refresh() {
        updateClock();
    }

    /**
     * Get settings form for configuration
     */
    function getSettingsForm() {
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="clock-mode">Display Mode</label>
                <select id="clock-mode" class="form-select" name="mode">
                    <option value="digital" ${config.mode === 'digital' ? 'selected' : ''}>Digital</option>
                    <option value="analog" ${config.mode === 'analog' ? 'selected' : ''}>Analog</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="clock-format">Time Format</label>
                <select id="clock-format" class="form-select" name="format">
                    <option value="12h" ${config.format === '12h' ? 'selected' : ''}>12 Hour</option>
                    <option value="24h" ${config.format === '24h' ? 'selected' : ''}>24 Hour</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="clock-timezone">Timezone</label>
                <select id="clock-timezone" class="form-select" name="timezone">
                    ${getTimezoneOptions()}
                </select>
            </div>
            
            <div class="form-group">
                <div class="form-checkbox">
                    <input type="checkbox" id="clock-show-date" name="showDate" ${config.showDate ? 'checked' : ''}>
                    <label for="clock-show-date">Show Date</label>
                </div>
            </div>
            
            <div class="form-group">
                <div class="form-checkbox">
                    <input type="checkbox" id="clock-show-seconds" name="showSeconds" ${config.showSeconds ? 'checked' : ''}>
                    <label for="clock-show-seconds">Show Seconds</label>
                </div>
            </div>
        `;
        
        return form;
    }

    /**
     * Get timezone options for select
     */
    function getTimezoneOptions() {
        const commonTimezones = [
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Anchorage',
            'Pacific/Honolulu',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Europe/Rome',
            'Europe/Moscow',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Kolkata',
            'Asia/Dubai',
            'Australia/Sydney',
            'Australia/Melbourne',
            'Pacific/Auckland'
        ];

        return commonTimezones.map(tz => {
            const selected = tz === config.timezone ? 'selected' : '';
            const displayName = tz.replace(/_/g, ' ').replace('/', ' / ');
            return `<option value="${tz}" ${selected}>${displayName}</option>`;
        }).join('');
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