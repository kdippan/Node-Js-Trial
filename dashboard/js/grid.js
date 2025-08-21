/**
 * Grid JS - Drag, drop, resize, and grid snapping
 * Customizable Dashboard
 */

/**
 * Grid manager for dashboard layout
 * Handles drag and drop, resizing, and grid snapping
 */
export class GridManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.ui = null; // Set by main.js
        this.container = null;
        this.widgets = new Map();
        this.dragState = null;
        this.resizeState = null;
        this.gridConfig = { cols: 12, rowHeight: 64, gap: 16 };
        this.observers = new Map();
        
        // Event handlers
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.debounce(this.handleWindowResize.bind(this), 250);
        
        // Configuration
        this.config = {
            snapToGrid: true,
            preventOverlap: true,
            autoScroll: true,
            scrollSpeed: 5,
            scrollThreshold: 50,
            minWidgetSize: { w: 1, h: 1 },
            maxWidgetSize: { w: 12, h: 8 }
        };
    }

    /**
     * Initialize grid manager
     */
    async init() {
        try {
            this.container = document.getElementById('dashboard-grid');
            if (!this.container) {
                throw new Error('Dashboard grid container not found');
            }
            
            this.updateGridConfig();
            this.setupEventListeners();
            this.setupResizeObserver();
            
            console.log('🔧 Grid manager initialized');
            
        } catch (error) {
            console.error('Failed to initialize grid manager:', error);
            throw error;
        }
    }

    /**
     * Set UI manager reference
     */
    setUIManager(uiManager) {
        this.ui = uiManager;
    }

    /**
     * Update grid configuration from state
     */
    updateGridConfig() {
        const stateGrid = this.state.getGrid();
        const containerRect = this.container.getBoundingClientRect();
        
        this.gridConfig = {
            cols: stateGrid.cols,
            rowHeight: stateGrid.rowHeight * 16, // Convert rem to px
            gap: stateGrid.gap * 16, // Convert rem to px
            containerWidth: containerRect.width
        };
        
        // Update CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--grid-cols', this.gridConfig.cols);
        root.style.setProperty('--grid-row-height', `${stateGrid.rowHeight}rem`);
        root.style.setProperty('--grid-gap', `${stateGrid.gap}rem`);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Pointer events for drag and resize
        this.container.addEventListener('pointerdown', this.handlePointerDown);
        document.addEventListener('pointermove', this.handlePointerMove);
        document.addEventListener('pointerup', this.handlePointerUp);
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Window resize
        window.addEventListener('resize', this.handleResize);
        
        // State changes
        this.state.on('gridUpdated', () => this.updateGridConfig());
    }

    /**
     * Setup resize observer
     */
    setupResizeObserver() {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    if (entry.target === this.container) {
                        this.updateGridConfig();
                        this.refreshLayout();
                    }
                }
            });
            
            this.resizeObserver.observe(this.container);
        }
    }

    /**
     * Add widget to grid
     */
    addWidget(id, element, config) {
        try {
            // Create widget wrapper
            const wrapper = this.createWidgetWrapper(id, element, config);
            
            // Store widget reference
            this.widgets.set(id, {
                element: wrapper,
                config: { ...config },
                originalElement: element
            });
            
            // Position widget
            this.positionWidget(id, config.x, config.y, config.w, config.h);
            
            // Add to container
            this.container.appendChild(wrapper);
            
            // Setup widget-specific event listeners
            this.setupWidgetListeners(id, wrapper);
            
            console.log(`📍 Widget added to grid: ${id}`);
            
        } catch (error) {
            console.error(`Failed to add widget to grid: ${id}`, error);
            throw error;
        }
    }

    /**
     * Create widget wrapper with grid functionality
     */
    createWidgetWrapper(id, element, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'widget';
        wrapper.dataset.widgetId = id;
        wrapper.dataset.widgetType = config.type;
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', `${config.type} widget`);
        
        // Add minimized class if needed
        if (config.minimized) {
            wrapper.classList.add('minimized');
        }
        
        // Add original element
        wrapper.appendChild(element);
        
        // Add resize handles
        this.addResizeHandles(wrapper);
        
        return wrapper;
    }

    /**
     * Add resize handles to widget
     */
    addResizeHandles(wrapper) {
        const handles = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${direction}`;
            handle.dataset.direction = direction;
            handle.setAttribute('aria-label', `Resize ${direction}`);
            wrapper.appendChild(handle);
        });
    }

    /**
     * Setup widget-specific event listeners
     */
    setupWidgetListeners(id, wrapper) {
        // Focus handling
        wrapper.addEventListener('focus', () => {
            this.focusWidget(id);
        });
        
        wrapper.addEventListener('blur', () => {
            this.blurWidget(id);
        });
        
        // Context menu
        wrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(id, e.clientX, e.clientY);
        });
    }

    /**
     * Remove widget from grid
     */
    removeWidget(id) {
        try {
            const widget = this.widgets.get(id);
            if (!widget) {
                throw new Error(`Widget not found: ${id}`);
            }
            
            // Remove from container
            if (widget.element.parentNode) {
                widget.element.parentNode.removeChild(widget.element);
            }
            
            // Remove from widgets map
            this.widgets.delete(id);
            
            console.log(`🗑️ Widget removed from grid: ${id}`);
            
        } catch (error) {
            console.error(`Failed to remove widget from grid: ${id}`, error);
        }
    }

    /**
     * Position widget on grid
     */
    positionWidget(id, x, y, w, h) {
        const widget = this.widgets.get(id);
        if (!widget) return;
        
        const element = widget.element;
        
        // Update grid positioning
        element.style.gridColumnStart = x;
        element.style.gridColumnEnd = x + w;
        element.style.gridRowStart = y;
        element.style.gridRowEnd = y + h;
        
        // Update config
        widget.config.x = x;
        widget.config.y = y;
        widget.config.w = w;
        widget.config.h = h;
        
        // Update data attributes for CSS targeting
        element.dataset.x = x;
        element.dataset.y = y;
        element.dataset.w = w;
        element.dataset.h = h;
    }

    /**
     * Handle pointer down events
     */
    handlePointerDown(e) {
        const target = e.target;
        const widget = target.closest('.widget');
        if (!widget) return;
        
        const widgetId = widget.dataset.widgetId;
        
        // Check if clicking on resize handle
        const resizeHandle = target.closest('.resize-handle');
        if (resizeHandle) {
            this.startResize(widgetId, resizeHandle.dataset.direction, e);
            return;
        }
        
        // Check if clicking on widget header (draggable area)
        const header = target.closest('.widget-header');
        if (header) {
            this.startDrag(widgetId, e);
            return;
        }
    }

    /**
     * Start drag operation
     */
    startDrag(widgetId, e) {
        e.preventDefault();
        
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        const element = widget.element;
        const rect = element.getBoundingClientRect();
        
        this.dragState = {
            widgetId,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            originalX: widget.config.x,
            originalY: widget.config.y,
            placeholder: null
        };
        
        // Add drag classes
        element.classList.add('dragging');
        document.body.classList.add('dragging');
        
        // Create placeholder
        this.createDragPlaceholder(widget.config);
        
        // Set pointer capture
        this.container.setPointerCapture(e.pointerId);
        
        // Focus widget
        this.focusWidget(widgetId);
        
        console.log(`🔄 Started dragging: ${widgetId}`);
    }

    /**
     * Start resize operation
     */
    startResize(widgetId, direction, e) {
        e.preventDefault();
        e.stopPropagation();
        
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        const element = widget.element;
        
        this.resizeState = {
            widgetId,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            originalW: widget.config.w,
            originalH: widget.config.h,
            originalX: widget.config.x,
            originalY: widget.config.y
        };
        
        // Add resize classes
        element.classList.add('resizing');
        document.body.classList.add('resizing');
        
        // Set pointer capture
        document.setPointerCapture(e.pointerId);
        
        // Focus widget
        this.focusWidget(widgetId);
        
        console.log(`📏 Started resizing: ${widgetId} (${direction})`);
    }

    /**
     * Handle pointer move events
     */
    handlePointerMove(e) {
        if (this.dragState) {
            this.handleDragMove(e);
        } else if (this.resizeState) {
            this.handleResizeMove(e);
        }
    }

    /**
     * Handle drag movement
     */
    handleDragMove(e) {
        const { widgetId, startX, startY, offsetX, offsetY } = this.dragState;
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Calculate new position
        const newGridPos = this.screenToGrid(
            e.clientX - offsetX,
            e.clientY - offsetY
        );
        
        // Validate position
        const validPos = this.validatePosition(
            newGridPos.x,
            newGridPos.y,
            widget.config.w,
            widget.config.h,
            widgetId
        );
        
        // Update placeholder
        this.updateDragPlaceholder(validPos.x, validPos.y, widget.config.w, widget.config.h);
        
        // Auto-scroll if near edges
        this.handleAutoScroll(e.clientX, e.clientY);
    }

    /**
     * Handle resize movement
     */
    handleResizeMove(e) {
        const { widgetId, direction, startX, startY, originalW, originalH, originalX, originalY } = this.resizeState;
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Calculate new size and position
        const result = this.calculateResize(
            direction,
            deltaX,
            deltaY,
            originalX,
            originalY,
            originalW,
            originalH
        );
        
        // Validate new dimensions
        const validResult = this.validateResize(result, widgetId);
        
        // Apply resize
        this.positionWidget(widgetId, validResult.x, validResult.y, validResult.w, validResult.h);
    }

    /**
     * Handle pointer up events
     */
    handlePointerUp(e) {
        if (this.dragState) {
            this.finishDrag(e);
        } else if (this.resizeState) {
            this.finishResize(e);
        }
    }

    /**
     * Finish drag operation
     */
    finishDrag(e) {
        const { widgetId, placeholder } = this.dragState;
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        // Get final position from placeholder
        const finalX = parseInt(placeholder.style.gridColumnStart);
        const finalY = parseInt(placeholder.style.gridRowStart);
        
        // Update widget position
        this.positionWidget(widgetId, finalX, finalY, widget.config.w, widget.config.h);
        
        // Update state
        this.state.moveWidget(widgetId, finalX, finalY);
        
        // Cleanup
        this.cleanupDrag();
        
        console.log(`✅ Finished dragging: ${widgetId} to (${finalX}, ${finalY})`);
    }

    /**
     * Finish resize operation
     */
    finishResize(e) {
        const { widgetId } = this.resizeState;
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        // Update state
        this.state.resizeWidget(widgetId, widget.config.w, widget.config.h);
        this.state.moveWidget(widgetId, widget.config.x, widget.config.y);
        
        // Cleanup
        this.cleanupResize();
        
        console.log(`✅ Finished resizing: ${widgetId}`);
    }

    /**
     * Calculate resize dimensions
     */
    calculateResize(direction, deltaX, deltaY, x, y, w, h) {
        const cellWidth = this.gridConfig.containerWidth / this.gridConfig.cols;
        const cellHeight = this.gridConfig.rowHeight + this.gridConfig.gap;
        
        const deltaGridX = Math.round(deltaX / cellWidth);
        const deltaGridY = Math.round(deltaY / cellHeight);
        
        let newX = x, newY = y, newW = w, newH = h;
        
        switch (direction) {
            case 'n':
                newY = y + deltaGridY;
                newH = h - deltaGridY;
                break;
            case 's':
                newH = h + deltaGridY;
                break;
            case 'w':
                newX = x + deltaGridX;
                newW = w - deltaGridX;
                break;
            case 'e':
                newW = w + deltaGridX;
                break;
            case 'nw':
                newX = x + deltaGridX;
                newY = y + deltaGridY;
                newW = w - deltaGridX;
                newH = h - deltaGridY;
                break;
            case 'ne':
                newY = y + deltaGridY;
                newW = w + deltaGridX;
                newH = h - deltaGridY;
                break;
            case 'sw':
                newX = x + deltaGridX;
                newW = w - deltaGridX;
                newH = h + deltaGridY;
                break;
            case 'se':
                newW = w + deltaGridX;
                newH = h + deltaGridY;
                break;
        }
        
        return { x: newX, y: newY, w: newW, h: newH };
    }

    /**
     * Validate resize dimensions
     */
    validateResize(result, widgetId) {
        const { minWidgetSize, maxWidgetSize } = this.config;
        
        // Constrain size
        result.w = Math.max(minWidgetSize.w, Math.min(maxWidgetSize.w, result.w));
        result.h = Math.max(minWidgetSize.h, Math.min(maxWidgetSize.h, result.h));
        
        // Constrain position
        result.x = Math.max(1, result.x);
        result.y = Math.max(1, result.y);
        result.x = Math.min(this.gridConfig.cols - result.w + 1, result.x);
        
        // Check for overlaps if enabled
        if (this.config.preventOverlap) {
            const validPos = this.validatePosition(result.x, result.y, result.w, result.h, widgetId);
            result.x = validPos.x;
            result.y = validPos.y;
        }
        
        return result;
    }

    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGrid(screenX, screenY) {
        const containerRect = this.container.getBoundingClientRect();
        const relativeX = screenX - containerRect.left;
        const relativeY = screenY - containerRect.top;
        
        const cellWidth = this.gridConfig.containerWidth / this.gridConfig.cols;
        const cellHeight = this.gridConfig.rowHeight + this.gridConfig.gap;
        
        const gridX = Math.max(1, Math.round(relativeX / cellWidth) + 1);
        const gridY = Math.max(1, Math.round(relativeY / cellHeight) + 1);
        
        return { x: gridX, y: gridY };
    }

    /**
     * Validate widget position
     */
    validatePosition(x, y, w, h, excludeId = null) {
        // Constrain to grid bounds
        x = Math.max(1, Math.min(this.gridConfig.cols - w + 1, x));
        y = Math.max(1, y);
        
        // Check for overlaps if enabled
        if (this.config.preventOverlap) {
            const occupied = this.getOccupiedCells(excludeId);
            
            // Find first available position
            let testY = y;
            while (testY < y + 20) { // Limit search to prevent infinite loop
                let testX = x;
                while (testX <= this.gridConfig.cols - w + 1) {
                    if (!this.hasOverlap(testX, testY, w, h, occupied)) {
                        return { x: testX, y: testY };
                    }
                    testX++;
                }
                testY++;
            }
        }
        
        return { x, y };
    }

    /**
     * Get occupied grid cells
     */
    getOccupiedCells(excludeId = null) {
        const occupied = new Set();
        
        for (const [id, widget] of this.widgets) {
            if (id === excludeId) continue;
            
            const { x, y, w, h } = widget.config;
            for (let row = y; row < y + h; row++) {
                for (let col = x; col < x + w; col++) {
                    occupied.add(`${col},${row}`);
                }
            }
        }
        
        return occupied;
    }

    /**
     * Check if position has overlap
     */
    hasOverlap(x, y, w, h, occupied) {
        for (let row = y; row < y + h; row++) {
            for (let col = x; col < x + w; col++) {
                if (occupied.has(`${col},${row}`)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Create drag placeholder
     */
    createDragPlaceholder(config) {
        const placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        placeholder.style.gridColumnStart = config.x;
        placeholder.style.gridColumnEnd = config.x + config.w;
        placeholder.style.gridRowStart = config.y;
        placeholder.style.gridRowEnd = config.y + config.h;
        
        this.container.appendChild(placeholder);
        this.dragState.placeholder = placeholder;
    }

    /**
     * Update drag placeholder position
     */
    updateDragPlaceholder(x, y, w, h) {
        if (!this.dragState.placeholder) return;
        
        const placeholder = this.dragState.placeholder;
        placeholder.style.gridColumnStart = x;
        placeholder.style.gridColumnEnd = x + w;
        placeholder.style.gridRowStart = y;
        placeholder.style.gridRowEnd = y + h;
    }

    /**
     * Handle auto-scroll during drag
     */
    handleAutoScroll(clientX, clientY) {
        if (!this.config.autoScroll) return;
        
        const containerRect = this.container.getBoundingClientRect();
        const { scrollThreshold, scrollSpeed } = this.config;
        
        let scrollX = 0, scrollY = 0;
        
        // Check horizontal scroll
        if (clientX < containerRect.left + scrollThreshold) {
            scrollX = -scrollSpeed;
        } else if (clientX > containerRect.right - scrollThreshold) {
            scrollX = scrollSpeed;
        }
        
        // Check vertical scroll
        if (clientY < containerRect.top + scrollThreshold) {
            scrollY = -scrollSpeed;
        } else if (clientY > containerRect.bottom - scrollThreshold) {
            scrollY = scrollSpeed;
        }
        
        if (scrollX !== 0 || scrollY !== 0) {
            this.container.scrollBy(scrollX, scrollY);
        }
    }

    /**
     * Cleanup drag operation
     */
    cleanupDrag() {
        if (!this.dragState) return;
        
        const widget = this.widgets.get(this.dragState.widgetId);
        if (widget) {
            widget.element.classList.remove('dragging');
        }
        
        document.body.classList.remove('dragging');
        
        if (this.dragState.placeholder) {
            this.dragState.placeholder.remove();
        }
        
        this.dragState = null;
    }

    /**
     * Cleanup resize operation
     */
    cleanupResize() {
        if (!this.resizeState) return;
        
        const widget = this.widgets.get(this.resizeState.widgetId);
        if (widget) {
            widget.element.classList.remove('resizing');
        }
        
        document.body.classList.remove('resizing');
        this.resizeState = null;
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyDown(e) {
        const focusedWidget = document.activeElement.closest('.widget');
        if (!focusedWidget) return;
        
        const widgetId = focusedWidget.dataset.widgetId;
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        const { key, shiftKey, ctrlKey, metaKey } = e;
        const modifier = ctrlKey || metaKey;
        
        let handled = false;
        
        // Movement
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            const delta = shiftKey ? 5 : 1;
            let { x, y } = widget.config;
            
            switch (key) {
                case 'ArrowUp':
                    y = Math.max(1, y - delta);
                    break;
                case 'ArrowDown':
                    y += delta;
                    break;
                case 'ArrowLeft':
                    x = Math.max(1, x - delta);
                    break;
                case 'ArrowRight':
                    x = Math.min(this.gridConfig.cols - widget.config.w + 1, x + delta);
                    break;
            }
            
            const validPos = this.validatePosition(x, y, widget.config.w, widget.config.h, widgetId);
            this.positionWidget(widgetId, validPos.x, validPos.y, widget.config.w, widget.config.h);
            this.state.moveWidget(widgetId, validPos.x, validPos.y);
            
            handled = true;
        }
        
        // Resizing
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) && modifier) {
            const delta = shiftKey ? 2 : 1;
            let { w, h } = widget.config;
            
            switch (key) {
                case 'ArrowUp':
                    h = Math.max(this.config.minWidgetSize.h, h - delta);
                    break;
                case 'ArrowDown':
                    h = Math.min(this.config.maxWidgetSize.h, h + delta);
                    break;
                case 'ArrowLeft':
                    w = Math.max(this.config.minWidgetSize.w, w - delta);
                    break;
                case 'ArrowRight':
                    w = Math.min(this.config.maxWidgetSize.w, w + delta);
                    break;
            }
            
            this.positionWidget(widgetId, widget.config.x, widget.config.y, w, h);
            this.state.resizeWidget(widgetId, w, h);
            
            handled = true;
        }
        
        if (handled) {
            e.preventDefault();
        }
    }

    /**
     * Focus widget
     */
    focusWidget(id) {
        const widget = this.widgets.get(id);
        if (widget) {
            widget.element.classList.add('focused');
            widget.element.focus();
        }
    }

    /**
     * Blur widget
     */
    blurWidget(id) {
        const widget = this.widgets.get(id);
        if (widget) {
            widget.element.classList.remove('focused');
        }
    }

    /**
     * Show context menu for widget
     */
    showContextMenu(id, x, y) {
        if (this.ui) {
            this.ui.showContextMenu(id, x, y);
        }
    }

    /**
     * Refresh layout
     */
    refreshLayout() {
        this.updateGridConfig();
        
        // Reposition all widgets
        for (const [id, widget] of this.widgets) {
            const { x, y, w, h } = widget.config;
            this.positionWidget(id, x, y, w, h);
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        this.updateGridConfig();
        this.refreshLayout();
    }

    /**
     * Debounce utility
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Remove event listeners
        this.container?.removeEventListener('pointerdown', this.handlePointerDown);
        document.removeEventListener('pointermove', this.handlePointerMove);
        document.removeEventListener('pointerup', this.handlePointerUp);
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);
        
        // Cleanup observers
        this.resizeObserver?.disconnect();
        
        // Clear state
        this.widgets.clear();
        this.dragState = null;
        this.resizeState = null;
        
        console.log('🧹 Grid manager destroyed');
    }
}