/**
 * Main JS - Bootstrap and initialization
 * Customizable Dashboard
 */

import { StateManager } from './state.js';
import { GridManager } from './grid.js';
import { UIManager } from './ui.js';
import * as ClockWidget from './widgets/clock.js';
import * as WeatherWidget from './widgets/weather.js';
import * as NotesWidget from './widgets/notes.js';
import * as TodoWidget from './widgets/todo.js';
import * as PomodoroWidget from './widgets/pomodoro.js';
import * as CalendarWidget from './widgets/calendar.js';
import * as QuotesWidget from './widgets/quotes.js';
import * as StocksWidget from './widgets/stocks.js';
import * as LinksWidget from './widgets/links.js';
import * as SystemWidget from './widgets/system.js';

/**
 * Dashboard application class
 */
class Dashboard {
    constructor() {
        this.state = null;
        this.grid = null;
        this.ui = null;
        this.widgets = new Map();
        this.widgetTypes = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the dashboard application
     */
    async init() {
        try {
            console.log('🚀 Initializing Dashboard...');
            
            // Add page entrance animation
            document.body.classList.add('page-enter');
            
            // Initialize core managers
            await this.initializeManagers();
            
            // Register widget types
            this.registerWidgetTypes();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize theme
            this.initializeTheme();
            
            // Load and render dashboard state
            await this.loadDashboard();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ Dashboard initialized successfully');
            
            // Show success toast
            this.ui.showToast('Dashboard loaded successfully', 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.ui?.showToast('Failed to initialize dashboard', 'error');
        }
    }

    /**
     * Initialize core managers
     */
    async initializeManagers() {
        // Initialize state manager
        this.state = new StateManager();
        await this.state.init();
        
        // Initialize grid manager
        this.grid = new GridManager(this.state);
        await this.grid.init();
        
        // Initialize UI manager
        this.ui = new UIManager(this.state);
        await this.ui.init();
        
        // Set up cross-manager references
        this.grid.setUIManager(this.ui);
        this.ui.setGridManager(this.grid);
    }

    /**
     * Register all widget types
     */
    registerWidgetTypes() {
        const widgets = [
            { type: 'clock', module: ClockWidget, name: 'Clock', description: 'Digital and analog clock with timezone support' },
            { type: 'weather', module: WeatherWidget, name: 'Weather', description: 'Current weather conditions and forecast' },
            { type: 'notes', module: NotesWidget, name: 'Notes', description: 'Rich text notepad with autosave' },
            { type: 'todo', module: TodoWidget, name: 'Todo List', description: 'Task management with filters and stats' },
            { type: 'pomodoro', module: PomodoroWidget, name: 'Pomodoro Timer', description: 'Focus timer with break cycles' },
            { type: 'calendar', module: CalendarWidget, name: 'Calendar', description: 'Mini calendar with quick notes' },
            { type: 'quotes', module: QuotesWidget, name: 'Quotes', description: 'Inspirational quotes with categories' },
            { type: 'stocks', module: StocksWidget, name: 'Stocks', description: 'Stock and crypto ticker with charts' },
            { type: 'links', module: LinksWidget, name: 'Quick Links', description: 'Bookmarks with favicons' },
            { type: 'system', module: SystemWidget, name: 'System Info', description: 'Memory, network, and battery status' }
        ];

        widgets.forEach(widget => {
            this.widgetTypes.set(widget.type, {
                ...widget,
                createWidget: widget.module.createWidget
            });
        });

        console.log(`📦 Registered ${widgets.length} widget types`);
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Add widget button
        const addWidgetBtn = document.querySelector('.add-widget-btn');
        if (addWidgetBtn) {
            addWidgetBtn.addEventListener('click', () => {
                this.ui.showAddWidgetModal();
            });
        }

        // More menu button
        const moreMenuBtn = document.querySelector('.more-menu-btn');
        if (moreMenuBtn) {
            moreMenuBtn.addEventListener('click', (e) => {
                this.ui.toggleDropdownMenu('more-menu', e.target);
            });
        }

        // Search functionality
        const searchInput = document.querySelector('#widget-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // More menu actions
        const moreMenu = document.querySelector('#more-menu');
        if (moreMenu) {
            moreMenu.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action) {
                    this.handleMoreMenuAction(action);
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window focus/blur for auto-refresh
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshActiveWidgets();
            }
        });

        // Handle beforeunload to save state
        window.addEventListener('beforeunload', () => {
            this.state.save();
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.ui?.showToast('An error occurred', 'error');
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.ui?.showToast('An error occurred', 'error');
        });
    }

    /**
     * Initialize theme based on preferences
     */
    initializeTheme() {
        const savedTheme = this.state.getTheme();
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        
        const theme = savedTheme === 'system' ? systemPreference : savedTheme;
        this.setTheme(theme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.state.getTheme() === 'system') {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Load and render dashboard from state
     */
    async loadDashboard() {
        const widgets = this.state.getWidgets();
        
        if (widgets.length === 0) {
            // Load default layout
            await this.loadDefaultLayout();
        } else {
            // Render existing widgets
            for (const widgetConfig of widgets) {
                await this.createWidget(widgetConfig.type, widgetConfig);
            }
        }

        // Apply grid layout
        this.grid.refreshLayout();
    }

    /**
     * Load default dashboard layout
     */
    async loadDefaultLayout() {
        console.log('📋 Loading default layout...');
        
        const defaultWidgets = [
            // Row 1
            { type: 'clock', x: 1, y: 1, w: 3, h: 2 },
            { type: 'weather', x: 4, y: 1, w: 3, h: 2 },
            { type: 'pomodoro', x: 7, y: 1, w: 3, h: 2 },
            { type: 'todo', x: 10, y: 1, w: 3, h: 3 },
            
            // Row 2
            { type: 'calendar', x: 1, y: 3, w: 4, h: 3 },
            { type: 'notes', x: 5, y: 3, w: 4, h: 3 },
            
            // Row 3
            { type: 'links', x: 1, y: 6, w: 6, h: 2 },
            { type: 'quotes', x: 7, y: 6, w: 3, h: 2 },
            { type: 'stocks', x: 10, y: 4, w: 3, h: 2 },
            { type: 'system', x: 10, y: 6, w: 3, h: 2 }
        ];

        for (const config of defaultWidgets) {
            await this.createWidget(config.type, config);
        }

        // Save default layout
        this.state.save();
    }

    /**
     * Create and add a widget to the dashboard
     */
    async createWidget(type, config = {}) {
        try {
            const widgetType = this.widgetTypes.get(type);
            if (!widgetType) {
                throw new Error(`Unknown widget type: ${type}`);
            }

            // Generate unique ID if not provided
            const id = config.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Create widget configuration
            const widgetConfig = {
                id,
                type,
                x: config.x || 1,
                y: config.y || 1,
                w: config.w || 3,
                h: config.h || 2,
                minimized: config.minimized || false,
                config: config.config || {}
            };

            // Create widget instance
            const widget = await widgetType.createWidget(widgetConfig.config);
            if (!widget) {
                throw new Error(`Failed to create widget: ${type}`);
            }

            // Store widget reference
            this.widgets.set(id, {
                ...widget,
                type,
                config: widgetConfig
            });

            // Add to state
            this.state.addWidget(widgetConfig);

            // Add to grid
            this.grid.addWidget(id, widget.el, widgetConfig);

            // Add entrance animation
            widget.el.classList.add('widget-enter');

            console.log(`✅ Created widget: ${type} (${id})`);
            return id;

        } catch (error) {
            console.error(`❌ Failed to create widget ${type}:`, error);
            this.ui.showToast(`Failed to create ${type} widget`, 'error');
            return null;
        }
    }

    /**
     * Remove a widget from the dashboard
     */
    async removeWidget(id) {
        try {
            const widget = this.widgets.get(id);
            if (!widget) {
                throw new Error(`Widget not found: ${id}`);
            }

            // Add exit animation
            widget.el.classList.add('widget-exit');
            
            // Wait for animation to complete
            await new Promise(resolve => {
                widget.el.addEventListener('animationend', resolve, { once: true });
                setTimeout(resolve, 400); // Fallback timeout
            });

            // Cleanup widget
            if (widget.destroy) {
                widget.destroy();
            }

            // Remove from grid
            this.grid.removeWidget(id);

            // Remove from state
            this.state.removeWidget(id);

            // Remove from widgets map
            this.widgets.delete(id);

            console.log(`🗑️ Removed widget: ${id}`);
            this.ui.showToast('Widget removed', 'success');

        } catch (error) {
            console.error(`❌ Failed to remove widget ${id}:`, error);
            this.ui.showToast('Failed to remove widget', 'error');
        }
    }

    /**
     * Toggle theme (light -> dark -> amoled -> light)
     */
    toggleTheme() {
        const currentTheme = this.state.getTheme();
        let nextTheme;

        switch (currentTheme) {
            case 'light':
                nextTheme = 'dark';
                break;
            case 'dark':
                nextTheme = 'amoled';
                break;
            case 'amoled':
                nextTheme = 'light';
                break;
            default:
                nextTheme = 'light';
        }

        this.setTheme(nextTheme);
        this.state.setTheme(nextTheme);
        this.ui.showToast(`Theme changed to ${nextTheme}`, 'success');
    }

    /**
     * Set the theme
     */
    setTheme(theme) {
        // Add transition class for smooth theme change
        document.documentElement.classList.add('theme-transitioning');
        
        // Set theme attribute
        document.documentElement.setAttribute('data-theme', theme);
        
        // Remove transition class after animation
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 500);
    }

    /**
     * Handle search functionality
     */
    handleSearch(query) {
        const widgets = document.querySelectorAll('.widget');
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            // Show all widgets
            widgets.forEach(widget => {
                widget.style.display = '';
            });
            return;
        }

        widgets.forEach(widget => {
            const widgetId = widget.dataset.widgetId;
            const widgetData = this.widgets.get(widgetId);
            
            if (widgetData) {
                const title = widget.querySelector('.widget-title')?.textContent?.toLowerCase() || '';
                const type = widgetData.type.toLowerCase();
                
                const matches = title.includes(searchTerm) || type.includes(searchTerm);
                widget.style.display = matches ? '' : 'none';
            }
        });
    }

    /**
     * Handle more menu actions
     */
    async handleMoreMenuAction(action) {
        this.ui.hideDropdownMenu('more-menu');

        switch (action) {
            case 'export':
                await this.exportLayout();
                break;
            case 'import':
                await this.importLayout();
                break;
            case 'reset':
                await this.resetLayout();
                break;
            default:
                console.warn('Unknown menu action:', action);
        }
    }

    /**
     * Export dashboard layout
     */
    async exportLayout() {
        try {
            const layout = this.state.exportLayout();
            const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-layout-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            this.ui.showToast('Layout exported successfully', 'success');

        } catch (error) {
            console.error('Failed to export layout:', error);
            this.ui.showToast('Failed to export layout', 'error');
        }
    }

    /**
     * Import dashboard layout
     */
    async importLayout() {
        try {
            const fileInput = document.querySelector('#import-file-input');
            fileInput.click();
            
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const text = await file.text();
                const layout = JSON.parse(text);
                
                await this.state.importLayout(layout);
                
                // Clear existing widgets
                for (const [id] of this.widgets) {
                    await this.removeWidget(id);
                }
                
                // Load imported layout
                await this.loadDashboard();
                
                this.ui.showToast('Layout imported successfully', 'success');
                
            }, { once: true });

        } catch (error) {
            console.error('Failed to import layout:', error);
            this.ui.showToast('Failed to import layout', 'error');
        }
    }

    /**
     * Reset to default layout
     */
    async resetLayout() {
        try {
            const confirmed = await this.ui.showConfirmDialog(
                'Reset Layout',
                'This will remove all widgets and reset to the default layout. Continue?'
            );
            
            if (!confirmed) return;

            // Clear existing widgets
            for (const [id] of this.widgets) {
                await this.removeWidget(id);
            }
            
            // Reset state
            this.state.reset();
            
            // Load default layout
            await this.loadDefaultLayout();
            
            this.ui.showToast('Layout reset to default', 'success');

        } catch (error) {
            console.error('Failed to reset layout:', error);
            this.ui.showToast('Failed to reset layout', 'error');
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in inputs
        if (e.target.matches('input, textarea, [contenteditable]')) {
            return;
        }

        const { key, ctrlKey, metaKey, shiftKey } = e;
        const modifier = ctrlKey || metaKey;

        switch (key) {
            case 'Escape':
                this.ui.closeAllModals();
                this.ui.hideAllDropdowns();
                break;
                
            case 'a':
                if (modifier) {
                    e.preventDefault();
                    this.ui.showAddWidgetModal();
                }
                break;
                
            case 't':
                if (modifier) {
                    e.preventDefault();
                    this.toggleTheme();
                }
                break;
                
            case 'r':
                if (modifier && shiftKey) {
                    e.preventDefault();
                    this.refreshActiveWidgets();
                    this.ui.showToast('Widgets refreshed', 'success');
                }
                break;
                
            case 's':
                if (modifier) {
                    e.preventDefault();
                    this.state.save();
                    this.ui.showToast('Layout saved', 'success');
                }
                break;
        }
    }

    /**
     * Refresh all active widgets
     */
    refreshActiveWidgets() {
        for (const [id, widget] of this.widgets) {
            if (widget.refresh && !widget.config.minimized) {
                try {
                    widget.refresh();
                } catch (error) {
                    console.error(`Failed to refresh widget ${id}:`, error);
                }
            }
        }
    }

    /**
     * Get widget by ID
     */
    getWidget(id) {
        return this.widgets.get(id);
    }

    /**
     * Get all widget types
     */
    getWidgetTypes() {
        return Array.from(this.widgetTypes.values());
    }

    /**
     * Update widget configuration
     */
    updateWidget(id, config) {
        const widget = this.widgets.get(id);
        if (!widget) return;

        // Update widget config
        Object.assign(widget.config.config, config);
        
        // Update state
        this.state.updateWidget(id, { config });
        
        // Update widget instance
        if (widget.setConfig) {
            widget.setConfig(config);
        }
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new Dashboard();
        window.dashboard.init();
    });
} else {
    window.dashboard = new Dashboard();
    window.dashboard.init();
}

// Export for debugging
export { Dashboard };