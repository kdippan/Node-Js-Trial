/**
 * Calendar Widget - Mini month view with notes
 * Customizable Dashboard
 */

export function createWidget(initialConfig = {}) {
    const config = { title: 'Calendar', ...initialConfig };
    
    const element = document.createElement('div');
    element.className = 'calendar-widget';
    element.innerHTML = `
        <div class="widget-header">
            <h3 class="widget-title">${config.title}</h3>
            <div class="widget-actions">
                <button class="widget-action" data-action="settings" aria-label="Settings">
                    <svg viewBox="0 0 24 24"><use href="./assets/icons.svg#settings"></use></svg>
                </button>
                <button class="widget-action" data-action="minimize" aria-label="Minimize">
                    <svg viewBox="0 0 24 24"><use href="./assets/icons.svg#minimize"></use></svg>
                </button>
                <button class="widget-action" data-action="remove" aria-label="Remove">
                    <svg viewBox="0 0 24 24"><use href="./assets/icons.svg#remove"></use></svg>
                </button>
            </div>
        </div>
        <div class="widget-body">
            <div class="widget-content">
                <p>Calendar widget coming soon...</p>
            </div>
        </div>
    `;
    
    return {
        el: element,
        getConfig: () => ({ ...config }),
        setConfig: (newConfig) => Object.assign(config, newConfig),
        refresh: () => {},
        destroy: () => {}
    };
}