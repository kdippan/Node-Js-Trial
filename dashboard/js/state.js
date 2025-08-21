/**
 * State JS - App state management and persistence
 * Customizable Dashboard
 */

/**
 * State management for the dashboard application
 * Handles widget configuration, layout, and user preferences
 */
export class StateManager {
    constructor() {
        this.state = {
            grid: {
                cols: 12,
                rowHeight: 4, // rem units
                gap: 1 // rem units
            },
            widgets: [],
            theme: 'system',
            version: '1.0.0'
        };
        
        this.listeners = new Map();
        this.storageKey = 'dashboard-state';
        this.debounceTimer = null;
        this.debounceDelay = 500; // ms
    }

    /**
     * Initialize state manager
     */
    async init() {
        try {
            await this.load();
            console.log('📊 State manager initialized');
        } catch (error) {
            console.error('Failed to initialize state:', error);
            // Use default state on error
        }
    }

    /**
     * Load state from localStorage
     */
    async load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedState = JSON.parse(stored);
                
                // Migrate state if needed
                const migratedState = await this.migrateState(parsedState);
                
                // Validate state structure
                if (this.validateState(migratedState)) {
                    this.state = { ...this.state, ...migratedState };
                    console.log('📥 State loaded from localStorage');
                } else {
                    console.warn('Invalid state structure, using defaults');
                    await this.save(); // Save default state
                }
            } else {
                console.log('📋 No saved state found, using defaults');
                await this.save(); // Save default state
            }
        } catch (error) {
            console.error('Failed to load state:', error);
            throw error;
        }
    }

    /**
     * Save state to localStorage (debounced)
     */
    save() {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Debounce save operations
        this.debounceTimer = setTimeout(() => {
            this.saveImmediate();
        }, this.debounceDelay);
    }

    /**
     * Save state immediately without debouncing
     */
    saveImmediate() {
        try {
            const stateToSave = {
                ...this.state,
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
            console.log('💾 State saved to localStorage');
            
            // Emit save event
            this.emit('save', stateToSave);
            
        } catch (error) {
            console.error('Failed to save state:', error);
            
            // Check if quota exceeded
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
        }
    }

    /**
     * Handle localStorage quota exceeded
     */
    handleQuotaExceeded() {
        console.warn('localStorage quota exceeded, attempting cleanup');
        
        try {
            // Remove old data or compress state
            const essentialState = {
                grid: this.state.grid,
                widgets: this.state.widgets.slice(-20), // Keep only latest 20 widgets
                theme: this.state.theme,
                version: this.state.version
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(essentialState));
            this.state = essentialState;
            
            console.log('🧹 State cleaned up and saved');
            
        } catch (error) {
            console.error('Failed to cleanup state:', error);
            // Reset to minimal state
            this.reset();
        }
    }

    /**
     * Migrate state from older versions
     */
    async migrateState(state) {
        const currentVersion = this.state.version;
        const stateVersion = state.version || '0.0.0';
        
        if (stateVersion === currentVersion) {
            return state;
        }
        
        console.log(`🔄 Migrating state from v${stateVersion} to v${currentVersion}`);
        
        let migratedState = { ...state };
        
        // Migration logic for different versions
        if (this.compareVersions(stateVersion, '1.0.0') < 0) {
            // Migration from pre-1.0.0 versions
            migratedState = await this.migrateToV1(migratedState);
        }
        
        // Set current version
        migratedState.version = currentVersion;
        
        return migratedState;
    }

    /**
     * Migrate to version 1.0.0
     */
    async migrateToV1(state) {
        // Add any missing properties with defaults
        const migrated = {
            grid: state.grid || this.state.grid,
            widgets: state.widgets || [],
            theme: state.theme || 'system',
            version: '1.0.0'
        };
        
        // Ensure widget IDs are unique
        const seenIds = new Set();
        migrated.widgets = migrated.widgets.map(widget => {
            if (seenIds.has(widget.id)) {
                widget.id = this.generateWidgetId(widget.type);
            }
            seenIds.add(widget.id);
            return widget;
        });
        
        console.log('✅ Migrated to v1.0.0');
        return migrated;
    }

    /**
     * Compare version strings
     */
    compareVersions(a, b) {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || 0;
            const bPart = bParts[i] || 0;
            
            if (aPart < bPart) return -1;
            if (aPart > bPart) return 1;
        }
        
        return 0;
    }

    /**
     * Validate state structure
     */
    validateState(state) {
        try {
            // Check required properties
            if (!state || typeof state !== 'object') return false;
            if (!state.grid || typeof state.grid !== 'object') return false;
            if (!Array.isArray(state.widgets)) return false;
            if (!state.theme || typeof state.theme !== 'string') return false;
            
            // Validate grid configuration
            const { grid } = state;
            if (typeof grid.cols !== 'number' || grid.cols < 1 || grid.cols > 24) return false;
            if (typeof grid.rowHeight !== 'number' || grid.rowHeight < 1) return false;
            if (typeof grid.gap !== 'number' || grid.gap < 0) return false;
            
            // Validate widgets
            for (const widget of state.widgets) {
                if (!this.validateWidget(widget)) return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('State validation error:', error);
            return false;
        }
    }

    /**
     * Validate widget configuration
     */
    validateWidget(widget) {
        if (!widget || typeof widget !== 'object') return false;
        if (!widget.id || typeof widget.id !== 'string') return false;
        if (!widget.type || typeof widget.type !== 'string') return false;
        if (typeof widget.x !== 'number' || widget.x < 1) return false;
        if (typeof widget.y !== 'number' || widget.y < 1) return false;
        if (typeof widget.w !== 'number' || widget.w < 1) return false;
        if (typeof widget.h !== 'number' || widget.h < 1) return false;
        if (typeof widget.minimized !== 'boolean') return false;
        if (!widget.config || typeof widget.config !== 'object') return false;
        
        return true;
    }

    /**
     * Reset state to defaults
     */
    reset() {
        this.state = {
            grid: {
                cols: 12,
                rowHeight: 4,
                gap: 1
            },
            widgets: [],
            theme: 'system',
            version: '1.0.0'
        };
        
        this.saveImmediate();
        this.emit('reset', this.state);
        
        console.log('🔄 State reset to defaults');
    }

    /**
     * Add a widget to the state
     */
    addWidget(widget) {
        if (!this.validateWidget(widget)) {
            throw new Error('Invalid widget configuration');
        }
        
        // Check for ID conflicts
        if (this.state.widgets.some(w => w.id === widget.id)) {
            widget.id = this.generateWidgetId(widget.type);
        }
        
        this.state.widgets.push(widget);
        this.save();
        this.emit('widgetAdded', widget);
        
        console.log(`📦 Widget added: ${widget.type} (${widget.id})`);
    }

    /**
     * Update a widget in the state
     */
    updateWidget(id, updates) {
        const index = this.state.widgets.findIndex(w => w.id === id);
        if (index === -1) {
            throw new Error(`Widget not found: ${id}`);
        }
        
        const widget = { ...this.state.widgets[index], ...updates };
        
        if (!this.validateWidget(widget)) {
            throw new Error('Invalid widget update');
        }
        
        this.state.widgets[index] = widget;
        this.save();
        this.emit('widgetUpdated', widget);
        
        console.log(`📝 Widget updated: ${id}`);
    }

    /**
     * Remove a widget from the state
     */
    removeWidget(id) {
        const index = this.state.widgets.findIndex(w => w.id === id);
        if (index === -1) {
            throw new Error(`Widget not found: ${id}`);
        }
        
        const widget = this.state.widgets[index];
        this.state.widgets.splice(index, 1);
        this.save();
        this.emit('widgetRemoved', widget);
        
        console.log(`🗑️ Widget removed: ${id}`);
    }

    /**
     * Move a widget to new position
     */
    moveWidget(id, x, y) {
        const widget = this.state.widgets.find(w => w.id === id);
        if (!widget) {
            throw new Error(`Widget not found: ${id}`);
        }
        
        widget.x = x;
        widget.y = y;
        this.save();
        this.emit('widgetMoved', widget);
        
        console.log(`📍 Widget moved: ${id} to (${x}, ${y})`);
    }

    /**
     * Resize a widget
     */
    resizeWidget(id, w, h) {
        const widget = this.state.widgets.find(widget => widget.id === id);
        if (!widget) {
            throw new Error(`Widget not found: ${id}`);
        }
        
        widget.w = w;
        widget.h = h;
        this.save();
        this.emit('widgetResized', widget);
        
        console.log(`📏 Widget resized: ${id} to ${w}x${h}`);
    }

    /**
     * Toggle widget minimized state
     */
    toggleWidgetMinimized(id) {
        const widget = this.state.widgets.find(w => w.id === id);
        if (!widget) {
            throw new Error(`Widget not found: ${id}`);
        }
        
        widget.minimized = !widget.minimized;
        this.save();
        this.emit('widgetToggled', widget);
        
        console.log(`🔽 Widget ${widget.minimized ? 'minimized' : 'expanded'}: ${id}`);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        const validThemes = ['system', 'light', 'dark', 'amoled'];
        if (!validThemes.includes(theme)) {
            throw new Error(`Invalid theme: ${theme}`);
        }
        
        this.state.theme = theme;
        this.save();
        this.emit('themeChanged', theme);
        
        console.log(`🎨 Theme changed: ${theme}`);
    }

    /**
     * Update grid configuration
     */
    updateGrid(gridConfig) {
        const validatedGrid = {
            cols: Math.max(1, Math.min(24, gridConfig.cols || this.state.grid.cols)),
            rowHeight: Math.max(1, gridConfig.rowHeight || this.state.grid.rowHeight),
            gap: Math.max(0, gridConfig.gap || this.state.grid.gap)
        };
        
        this.state.grid = validatedGrid;
        this.save();
        this.emit('gridUpdated', validatedGrid);
        
        console.log('📐 Grid configuration updated');
    }

    /**
     * Export layout as JSON
     */
    exportLayout() {
        const exportData = {
            ...this.state,
            exportedAt: new Date().toISOString(),
            exportVersion: this.state.version
        };
        
        console.log('📤 Layout exported');
        return exportData;
    }

    /**
     * Import layout from JSON
     */
    async importLayout(layoutData) {
        try {
            // Validate import data
            if (!layoutData || typeof layoutData !== 'object') {
                throw new Error('Invalid import data');
            }
            
            // Migrate imported data if needed
            const migratedData = await this.migrateState(layoutData);
            
            // Validate migrated data
            if (!this.validateState(migratedData)) {
                throw new Error('Invalid layout data structure');
            }
            
            // Generate new IDs for widgets to avoid conflicts
            const importedWidgets = migratedData.widgets.map(widget => ({
                ...widget,
                id: this.generateWidgetId(widget.type)
            }));
            
            // Update state
            this.state = {
                ...migratedData,
                widgets: importedWidgets,
                version: this.state.version
            };
            
            this.saveImmediate();
            this.emit('layoutImported', this.state);
            
            console.log('📥 Layout imported successfully');
            
        } catch (error) {
            console.error('Failed to import layout:', error);
            throw error;
        }
    }

    /**
     * Generate unique widget ID
     */
    generateWidgetId(type) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${type}-${timestamp}-${random}`;
    }

    /**
     * Get all widgets
     */
    getWidgets() {
        return [...this.state.widgets];
    }

    /**
     * Get widget by ID
     */
    getWidget(id) {
        return this.state.widgets.find(w => w.id === id);
    }

    /**
     * Get grid configuration
     */
    getGrid() {
        return { ...this.state.grid };
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.state.theme;
    }

    /**
     * Get full state (read-only)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Event listener management
     */
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
    }

    off(event, listener) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(listener);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get statistics about the dashboard
     */
    getStats() {
        const widgets = this.state.widgets;
        const widgetTypes = {};
        
        widgets.forEach(widget => {
            widgetTypes[widget.type] = (widgetTypes[widget.type] || 0) + 1;
        });
        
        return {
            totalWidgets: widgets.length,
            minimizedWidgets: widgets.filter(w => w.minimized).length,
            widgetTypes,
            theme: this.state.theme,
            gridCols: this.state.grid.cols,
            lastModified: this.getLastModified()
        };
    }

    /**
     * Get last modified timestamp
     */
    getLastModified() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.lastModified;
            }
        } catch (error) {
            console.error('Error getting last modified:', error);
        }
        return null;
    }

    /**
     * Clear all data
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            this.reset();
            console.log('🧹 All state data cleared');
        } catch (error) {
            console.error('Error clearing state:', error);
        }
    }

    /**
     * Check if state has unsaved changes
     */
    hasUnsavedChanges() {
        return this.debounceTimer !== null;
    }

    /**
     * Force save any pending changes
     */
    flush() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.saveImmediate();
        }
    }
}