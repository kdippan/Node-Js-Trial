/**
 * UI JS - Toasts, modals, menus, tooltips
 * Customizable Dashboard
 */

/**
 * UI manager for dashboard interface
 * Handles modals, toasts, tooltips, and menus
 */
export class UIManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.grid = null; // Set by main.js
        this.activeToasts = new Map();
        this.activeModals = new Set();
        this.activeDropdowns = new Set();
        this.tooltipTimer = null;
        this.currentTooltip = null;
        this.toastCounter = 0;
        
        // DOM elements cache
        this.elements = {
            toastContainer: null,
            tooltip: null,
            addWidgetModal: null,
            settingsModal: null,
            contextMenu: null
        };
    }

    /**
     * Initialize UI manager
     */
    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupTooltips();
            
            console.log('🎨 UI manager initialized');
            
        } catch (error) {
            console.error('Failed to initialize UI manager:', error);
            throw error;
        }
    }

    /**
     * Set grid manager reference
     */
    setGridManager(gridManager) {
        this.grid = gridManager;
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            toastContainer: document.getElementById('toast-container'),
            tooltip: document.getElementById('tooltip'),
            addWidgetModal: document.getElementById('add-widget-modal'),
            settingsModal: document.getElementById('widget-settings-modal'),
            contextMenu: document.getElementById('context-menu'),
            moreMenu: document.getElementById('more-menu'),
            widgetLibrary: document.getElementById('widget-library')
        };
        
        // Validate required elements
        const required = ['toastContainer', 'tooltip', 'addWidgetModal', 'settingsModal', 'contextMenu'];
        for (const key of required) {
            if (!this.elements[key]) {
                console.warn(`Required UI element not found: ${key}`);
            }
        }
    }

    /**
     * Setup global UI event listeners
     */
    setupEventListeners() {
        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, [data-action="cancel"]')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            }
        });

        // Modal backdrop clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                this.hideModal(e.target.id);
            }
        });

        // Toast close buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.toast-close')) {
                const toast = e.target.closest('.toast');
                if (toast) {
                    this.hideToast(toast.dataset.toastId);
                }
            }
        });

        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-menu, .context-menu, [aria-expanded="true"]')) {
                this.hideAllDropdowns();
                this.hideContextMenu();
            }
        });

        // Add widget modal events
        if (this.elements.addWidgetModal) {
            this.elements.addWidgetModal.addEventListener('click', (e) => {
                const preview = e.target.closest('.widget-preview');
                if (preview) {
                    this.handleAddWidget(preview.dataset.type);
                }
            });
        }

        // Settings modal events
        if (this.elements.settingsModal) {
            this.elements.settingsModal.addEventListener('click', (e) => {
                if (e.target.matches('[data-action="save"]')) {
                    this.handleSaveSettings();
                }
            });
        }

        // Context menu events
        if (this.elements.contextMenu) {
            this.elements.contextMenu.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                const widgetId = this.elements.contextMenu.dataset.widgetId;
                
                if (action && widgetId) {
                    this.handleContextMenuAction(widgetId, action);
                }
            });
        }
    }

    /**
     * Setup tooltip functionality
     */
    setupTooltips() {
        document.addEventListener('mouseenter', (e) => {
            const target = e.target.closest('[title], [aria-label], [data-tooltip]');
            if (target && !target.matches('input, textarea, select')) {
                const text = target.dataset.tooltip || target.title || target.getAttribute('aria-label');
                if (text) {
                    target.removeAttribute('title'); // Prevent native tooltip
                    this.showTooltip(text, target);
                }
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            const target = e.target.closest('[data-tooltip], [aria-label]');
            if (target) {
                this.hideTooltip();
            }
        }, true);

        document.addEventListener('focus', (e) => {
            const target = e.target;
            if (target.matches('[data-tooltip], [aria-label]') && !target.matches('input, textarea, select')) {
                const text = target.dataset.tooltip || target.getAttribute('aria-label');
                if (text) {
                    this.showTooltip(text, target);
                }
            }
        }, true);

        document.addEventListener('blur', () => {
            this.hideTooltip();
        }, true);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000, actions = null) {
        if (!this.elements.toastContainer) {
            console.warn('Toast container not found');
            return null;
        }

        const id = `toast-${++this.toastCounter}`;
        const toast = this.createToastElement(id, message, type, actions);
        
        // Add to container
        this.elements.toastContainer.appendChild(toast);
        
        // Store reference
        this.activeToasts.set(id, {
            element: toast,
            timer: null,
            type,
            message
        });

        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-hide after duration
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.hideToast(id);
            }, duration);
            
            this.activeToasts.get(id).timer = timer;
        }

        console.log(`📢 Toast shown: ${type} - ${message}`);
        return id;
    }

    /**
     * Create toast element
     */
    createToastElement(id, message, type, actions) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.dataset.toastId = id;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const iconMap = {
            success: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
            error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
            warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
            info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <svg viewBox="0 0 24 24">${iconMap[type] || iconMap.info}</svg>
                </div>
                <div class="toast-message">
                    <div class="toast-title">${this.capitalizeFirst(type)}</div>
                    <div class="toast-description">${this.escapeHtml(message)}</div>
                </div>
                <button class="toast-close" aria-label="Close notification">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
            <div class="toast-progress"></div>
        `;

        // Add actions if provided
        if (actions && actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'toast-actions';
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'btn btn-sm';
                button.textContent = action.label;
                button.addEventListener('click', () => {
                    action.handler();
                    this.hideToast(id);
                });
                actionsContainer.appendChild(button);
            });
            
            toast.querySelector('.toast-content').appendChild(actionsContainer);
        }

        return toast;
    }

    /**
     * Hide toast notification
     */
    hideToast(id) {
        const toast = this.activeToasts.get(id);
        if (!toast) return;

        // Clear timer
        if (toast.timer) {
            clearTimeout(toast.timer);
        }

        // Add exit animation
        toast.element.classList.add('hide');
        toast.element.classList.remove('show');

        // Remove after animation
        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.activeToasts.delete(id);
        }, 300);
    }

    /**
     * Clear all toasts
     */
    clearAllToasts() {
        for (const [id] of this.activeToasts) {
            this.hideToast(id);
        }
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal not found: ${modalId}`);
            return;
        }

        // Set up modal
        modal.setAttribute('open', '');
        modal.classList.add('modal-enter');
        this.activeModals.add(modalId);

        // Focus management
        this.trapFocus(modal);
        
        // Store previously focused element
        modal.dataset.previousFocus = document.activeElement?.id || '';

        // Focus first focusable element
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }

        console.log(`📺 Modal shown: ${modalId}`);
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal || !this.activeModals.has(modalId)) return;

        // Add exit animation
        modal.classList.add('modal-exit');
        modal.classList.remove('modal-enter');

        // Remove after animation
        setTimeout(() => {
            modal.removeAttribute('open');
            modal.classList.remove('modal-exit');
            this.activeModals.delete(modalId);

            // Restore focus
            const previousFocusId = modal.dataset.previousFocus;
            if (previousFocusId) {
                const previousElement = document.getElementById(previousFocusId);
                if (previousElement) {
                    previousElement.focus();
                }
            }
        }, 300);

        console.log(`📺 Modal hidden: ${modalId}`);
    }

    /**
     * Show add widget modal
     */
    showAddWidgetModal() {
        this.populateWidgetLibrary();
        this.showModal('add-widget-modal');
    }

    /**
     * Populate widget library
     */
    populateWidgetLibrary() {
        if (!this.elements.widgetLibrary) return;

        const widgetTypes = window.dashboard?.getWidgetTypes() || [];
        
        this.elements.widgetLibrary.innerHTML = widgetTypes.map(widget => `
            <div class="widget-preview" data-type="${widget.type}">
                <div class="widget-preview-icon">
                    <svg viewBox="0 0 24 24">
                        <use href="./assets/icons.svg#${widget.type}"></use>
                    </svg>
                </div>
                <h3 class="widget-preview-title">${widget.name}</h3>
                <p class="widget-preview-description">${widget.description}</p>
            </div>
        `).join('');
    }

    /**
     * Handle add widget action
     */
    async handleAddWidget(type) {
        try {
            this.hideModal('add-widget-modal');
            
            const widgetId = await window.dashboard?.createWidget(type);
            if (widgetId) {
                this.showToast(`${type} widget added successfully`, 'success');
            }
        } catch (error) {
            console.error('Failed to add widget:', error);
            this.showToast('Failed to add widget', 'error');
        }
    }

    /**
     * Show widget settings modal
     */
    showWidgetSettings(widgetId) {
        const widget = window.dashboard?.getWidget(widgetId);
        if (!widget) return;

        // Populate settings form
        this.populateSettingsForm(widget);
        
        // Store widget ID
        this.elements.settingsModal.dataset.widgetId = widgetId;
        
        this.showModal('widget-settings-modal');
    }

    /**
     * Populate settings form
     */
    populateSettingsForm(widget) {
        const content = this.elements.settingsModal.querySelector('#widget-settings-content');
        if (!content) return;

        // Basic settings form
        content.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="widget-title">Title</label>
                <input type="text" id="widget-title" class="form-input" 
                       value="${widget.config.title || widget.type}" 
                       placeholder="Widget title">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="widget-refresh">Auto-refresh (seconds)</label>
                <input type="number" id="widget-refresh" class="form-input" 
                       value="${widget.config.refreshInterval || 0}" 
                       min="0" max="3600" placeholder="0 = disabled">
            </div>
            
            <div class="form-group">
                <div class="form-checkbox">
                    <input type="checkbox" id="widget-minimized" 
                           ${widget.config.minimized ? 'checked' : ''}>
                    <label for="widget-minimized">Start minimized</label>
                </div>
            </div>
        `;

        // Add widget-specific settings if available
        if (widget.getSettingsForm) {
            const specificSettings = widget.getSettingsForm();
            if (specificSettings) {
                content.appendChild(specificSettings);
            }
        }
    }

    /**
     * Handle save settings
     */
    handleSaveSettings() {
        const modal = this.elements.settingsModal;
        const widgetId = modal.dataset.widgetId;
        
        if (!widgetId) return;

        try {
            // Collect form data
            const form = modal.querySelector('#widget-settings-content');
            const formData = new FormData(form);
            const config = Object.fromEntries(formData.entries());

            // Apply settings
            window.dashboard?.updateWidget(widgetId, config);
            
            this.hideModal('widget-settings-modal');
            this.showToast('Settings saved successfully', 'success');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }

    /**
     * Show tooltip
     */
    showTooltip(text, target) {
        if (!this.elements.tooltip || !text) return;

        // Clear existing timer
        if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
        }

        // Delay showing tooltip
        this.tooltipTimer = setTimeout(() => {
            this.elements.tooltip.querySelector('.tooltip-content').textContent = text;
            this.positionTooltip(target);
            this.elements.tooltip.classList.add('show');
            this.elements.tooltip.setAttribute('aria-hidden', 'false');
            this.currentTooltip = target;
        }, 500);
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
            this.tooltipTimer = null;
        }

        if (this.elements.tooltip) {
            this.elements.tooltip.classList.remove('show');
            this.elements.tooltip.setAttribute('aria-hidden', 'true');
        }
        
        this.currentTooltip = null;
    }

    /**
     * Position tooltip relative to target
     */
    positionTooltip(target) {
        const tooltip = this.elements.tooltip;
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let placement = 'top';
        let x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        let y = targetRect.top - tooltipRect.height - 8;

        // Adjust for viewport boundaries
        if (y < 0) {
            placement = 'bottom';
            y = targetRect.bottom + 8;
        }

        if (x < 0) {
            x = 8;
        } else if (x + tooltipRect.width > viewportWidth) {
            x = viewportWidth - tooltipRect.width - 8;
        }

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.dataset.placement = placement;
    }

    /**
     * Show dropdown menu
     */
    showDropdownMenu(menuId, triggerElement) {
        this.hideAllDropdowns();
        
        const menu = document.getElementById(menuId);
        if (!menu) return;

        // Position menu
        this.positionDropdown(menu, triggerElement);
        
        // Show menu
        menu.classList.add('show');
        menu.setAttribute('aria-hidden', 'false');
        this.activeDropdowns.add(menuId);

        // Update trigger state
        triggerElement.setAttribute('aria-expanded', 'true');
    }

    /**
     * Hide dropdown menu
     */
    hideDropdownMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (!menu || !this.activeDropdowns.has(menuId)) return;

        menu.classList.remove('show');
        menu.setAttribute('aria-hidden', 'true');
        this.activeDropdowns.delete(menuId);

        // Update trigger state
        const trigger = document.querySelector(`[aria-controls="${menuId}"]`);
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Toggle dropdown menu
     */
    toggleDropdownMenu(menuId, triggerElement) {
        if (this.activeDropdowns.has(menuId)) {
            this.hideDropdownMenu(menuId);
        } else {
            this.showDropdownMenu(menuId, triggerElement);
        }
    }

    /**
     * Position dropdown menu
     */
    positionDropdown(menu, trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = triggerRect.left;
        let y = triggerRect.bottom + 4;

        // Adjust for viewport boundaries
        if (x + menuRect.width > viewportWidth) {
            x = triggerRect.right - menuRect.width;
        }

        if (y + menuRect.height > viewportHeight) {
            y = triggerRect.top - menuRect.height - 4;
        }

        menu.style.left = `${Math.max(8, x)}px`;
        menu.style.top = `${Math.max(8, y)}px`;
    }

    /**
     * Show context menu
     */
    showContextMenu(widgetId, x, y) {
        if (!this.elements.contextMenu) return;

        this.hideContextMenu();
        
        // Store widget ID
        this.elements.contextMenu.dataset.widgetId = widgetId;
        
        // Populate context menu
        this.populateContextMenu(widgetId);
        
        // Position and show
        this.positionContextMenu(x, y);
        this.elements.contextMenu.classList.add('show');
        this.elements.contextMenu.setAttribute('aria-hidden', 'false');
    }

    /**
     * Populate context menu
     */
    populateContextMenu(widgetId) {
        const widget = window.dashboard?.getWidget(widgetId);
        if (!widget) return;

        this.elements.contextMenu.innerHTML = `
            <button class="menu-item" data-action="settings">
                <svg viewBox="0 0 24 24">
                    <use href="./assets/icons.svg#settings"></use>
                </svg>
                Settings
            </button>
            <button class="menu-item" data-action="refresh">
                <svg viewBox="0 0 24 24">
                    <use href="./assets/icons.svg#refresh"></use>
                </svg>
                Refresh
            </button>
            <button class="menu-item" data-action="duplicate">
                <svg viewBox="0 0 24 24">
                    <use href="./assets/icons.svg#duplicate"></use>
                </svg>
                Duplicate
            </button>
            <hr class="menu-divider">
            <button class="menu-item" data-action="minimize">
                <svg viewBox="0 0 24 24">
                    <use href="./assets/icons.svg#${widget.config.minimized ? 'maximize' : 'minimize'}"></use>
                </svg>
                ${widget.config.minimized ? 'Expand' : 'Minimize'}
            </button>
            <button class="menu-item" data-action="remove">
                <svg viewBox="0 0 24 24">
                    <use href="./assets/icons.svg#remove"></use>
                </svg>
                Remove
            </button>
        `;
    }

    /**
     * Position context menu
     */
    positionContextMenu(x, y) {
        const menu = this.elements.contextMenu;
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Adjust for viewport boundaries
        if (x + menuRect.width > viewportWidth) {
            x = viewportWidth - menuRect.width - 8;
        }

        if (y + menuRect.height > viewportHeight) {
            y = viewportHeight - menuRect.height - 8;
        }

        menu.style.left = `${Math.max(8, x)}px`;
        menu.style.top = `${Math.max(8, y)}px`;
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        if (!this.elements.contextMenu) return;

        this.elements.contextMenu.classList.remove('show');
        this.elements.contextMenu.setAttribute('aria-hidden', 'true');
        this.elements.contextMenu.dataset.widgetId = '';
    }

    /**
     * Handle context menu actions
     */
    async handleContextMenuAction(widgetId, action) {
        this.hideContextMenu();

        try {
            switch (action) {
                case 'settings':
                    this.showWidgetSettings(widgetId);
                    break;
                    
                case 'refresh':
                    const widget = window.dashboard?.getWidget(widgetId);
                    if (widget?.refresh) {
                        widget.refresh();
                        this.showToast('Widget refreshed', 'success');
                    }
                    break;
                    
                case 'duplicate':
                    const originalWidget = window.dashboard?.getWidget(widgetId);
                    if (originalWidget) {
                        await window.dashboard?.createWidget(originalWidget.type, {
                            ...originalWidget.config,
                            x: originalWidget.config.x + 1,
                            y: originalWidget.config.y + 1
                        });
                        this.showToast('Widget duplicated', 'success');
                    }
                    break;
                    
                case 'minimize':
                    window.dashboard?.state.toggleWidgetMinimized(widgetId);
                    this.showToast('Widget toggled', 'success');
                    break;
                    
                case 'remove':
                    const confirmed = await this.showConfirmDialog(
                        'Remove Widget',
                        'Are you sure you want to remove this widget?'
                    );
                    if (confirmed) {
                        await window.dashboard?.removeWidget(widgetId);
                    }
                    break;
                    
                default:
                    console.warn('Unknown context menu action:', action);
            }
        } catch (error) {
            console.error('Context menu action failed:', error);
            this.showToast('Action failed', 'error');
        }
    }

    /**
     * Show confirmation dialog
     */
    async showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'modal';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-labelledby', 'confirm-title');
            dialog.setAttribute('aria-describedby', 'confirm-message');
            
            dialog.innerHTML = `
                <div class="modal-content">
                    <header class="modal-header">
                        <h2 id="confirm-title">${this.escapeHtml(title)}</h2>
                    </header>
                    <div class="modal-body">
                        <p id="confirm-message">${this.escapeHtml(message)}</p>
                    </div>
                    <footer class="modal-footer">
                        <button class="btn-secondary" data-result="false">Cancel</button>
                        <button class="btn-primary" data-result="true">Confirm</button>
                    </footer>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            dialog.addEventListener('click', (e) => {
                const result = e.target.dataset.result;
                if (result !== undefined) {
                    document.body.removeChild(dialog);
                    resolve(result === 'true');
                } else if (e.target === dialog) {
                    document.body.removeChild(dialog);
                    resolve(false);
                }
            });
            
            // Show dialog
            dialog.setAttribute('open', '');
            dialog.classList.add('modal-enter');
            
            // Focus first button
            dialog.querySelector('button').focus();
        });
    }

    /**
     * Hide all dropdowns
     */
    hideAllDropdowns() {
        for (const menuId of this.activeDropdowns) {
            this.hideDropdownMenu(menuId);
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        for (const modalId of this.activeModals) {
            this.hideModal(modalId);
        }
    }

    /**
     * Handle escape key
     */
    handleEscapeKey() {
        // Hide tooltip
        this.hideTooltip();
        
        // Hide context menu
        this.hideContextMenu();
        
        // Hide dropdowns
        this.hideAllDropdowns();
        
        // Hide modals (only the topmost one)
        if (this.activeModals.size > 0) {
            const modals = Array.from(this.activeModals);
            this.hideModal(modals[modals.length - 1]);
        }
    }

    /**
     * Trap focus within element
     */
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }

    /**
     * Utility functions
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Clear all toasts
        this.clearAllToasts();
        
        // Close all modals
        this.closeAllModals();
        
        // Hide all dropdowns
        this.hideAllDropdowns();
        
        // Hide tooltip
        this.hideTooltip();
        
        // Clear timers
        if (this.tooltipTimer) {
            clearTimeout(this.tooltipTimer);
        }
        
        console.log('🧹 UI manager destroyed');
    }
}