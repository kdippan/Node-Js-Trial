/**
 * Notes Widget - Rich text notepad with autosave
 * Customizable Dashboard
 */

/**
 * Create notes widget
 */
export function createWidget(initialConfig = {}) {
    // Default configuration
    const defaultConfig = {
        title: 'Notes',
        content: '',
        autoSave: true,
        saveInterval: 2000, // 2 seconds
        placeholder: 'Start typing your notes...',
        enableFormatting: true,
        maxLength: 10000
    };

    // Merge with initial config
    const config = { ...defaultConfig, ...initialConfig };
    
    // Widget state
    let element = null;
    let saveTimer = null;
    let isDestroyed = false;
    let isDirty = false;
    let editor = null;

    /**
     * Create widget element
     */
    function createElement() {
        const widget = document.createElement('div');
        widget.className = 'notes-widget';
        
        widget.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${config.title}</h3>
                <div class="widget-actions">
                    <button class="widget-action" data-action="save" aria-label="Save" title="Save notes">
                        <svg viewBox="0 0 24 24">
                            <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3M19 19H5V5H16.17L19 7.83V19M12 12C13.66 12 15 13.34 15 15S13.66 18 12 18 9 16.66 9 15 10.34 12 12 12M6 6H15V10H6V6Z"/>
                        </svg>
                    </button>
                    <button class="widget-action" data-action="clear" aria-label="Clear" title="Clear all notes">
                        <svg viewBox="0 0 24 24">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                    </button>
                    <button class="widget-action" data-action="settings" aria-label="Settings">
                        <svg viewBox="0 0 24 24">
                            <use href="./assets/icons.svg#settings"></use>
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
                    <div class="notes-editor">
                        ${createEditor()}
                    </div>
                    ${config.enableFormatting ? createToolbar() : ''}
                </div>
            </div>
            <div class="widget-footer">
                <span class="notes-status" id="notes-status">Ready</span>
                <span class="notes-count" id="notes-count">0 / ${config.maxLength}</span>
            </div>
        `;

        // Set up event listeners
        setupEventListeners(widget);
        
        return widget;
    }

    /**
     * Create editor element
     */
    function createEditor() {
        return `
            <textarea 
                class="notes-textarea" 
                id="notes-textarea"
                placeholder="${config.placeholder}"
                maxlength="${config.maxLength}"
                aria-label="Notes editor"
            >${config.content}</textarea>
        `;
    }

    /**
     * Create formatting toolbar
     */
    function createToolbar() {
        return `
            <div class="notes-toolbar">
                <button class="notes-tool" data-format="bold" aria-label="Bold" title="Bold">
                    <svg viewBox="0 0 24 24">
                        <path d="M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9.02 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z"/>
                    </svg>
                </button>
                <button class="notes-tool" data-format="italic" aria-label="Italic" title="Italic">
                    <svg viewBox="0 0 24 24">
                        <path d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z"/>
                    </svg>
                </button>
                <button class="notes-tool" data-format="underline" aria-label="Underline" title="Underline">
                    <svg viewBox="0 0 24 24">
                        <path d="M5,21H19V19H5V21M12,17A6,6 0 0,0 18,11V3H15.5V11A3.5,3.5 0 0,1 12,14.5A3.5,3.5 0 0,1 8.5,11V3H6V11A6,6 0 0,0 12,17Z"/>
                    </svg>
                </button>
                <div class="toolbar-divider"></div>
                <button class="notes-tool" data-format="bullet" aria-label="Bullet List" title="Bullet List">
                    <svg viewBox="0 0 24 24">
                        <path d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"/>
                    </svg>
                </button>
                <button class="notes-tool" data-format="number" aria-label="Numbered List" title="Numbered List">
                    <svg viewBox="0 0 24 24">
                        <path d="M7,13V11H21V13H7M7,19V17H21V19H7M7,7V5H21V7H7M3,8V5H2V4H4V8H3M2,17V16H5V20H2V19H4V18.5H3V17.5H4V17H2M4.25,10A0.75,0.75 0 0,1 5,10.75C5,10.95 4.92,11.14 4.79,11.27L3.12,13H5V14H2V13.08L4,11H2V10H4.25Z"/>
                    </svg>
                </button>
                <div class="toolbar-divider"></div>
                <button class="notes-tool" data-action="export" aria-label="Export" title="Export as text file">
                    <svg viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                </button>
                <button class="notes-tool" data-action="import" aria-label="Import" title="Import text file">
                    <svg viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners(widget) {
        editor = widget.querySelector('#notes-textarea');
        
        // Widget action buttons
        widget.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            const format = e.target.closest('[data-format]')?.dataset.format;
            
            if (action) {
                handleAction(action);
            } else if (format) {
                handleFormat(format);
            }
        });

        // Editor events
        if (editor) {
            editor.addEventListener('input', handleInput);
            editor.addEventListener('keydown', handleKeyDown);
            editor.addEventListener('paste', handlePaste);
            editor.addEventListener('focus', handleFocus);
            editor.addEventListener('blur', handleBlur);
        }

        // Prevent losing focus when clicking toolbar
        const toolbar = widget.querySelector('.notes-toolbar');
        if (toolbar) {
            toolbar.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
        }
    }

    /**
     * Handle widget actions
     */
    function handleAction(action) {
        switch (action) {
            case 'save':
                saveNotes(true);
                break;
            case 'clear':
                clearNotes();
                break;
            case 'export':
                exportNotes();
                break;
            case 'import':
                importNotes();
                break;
            case 'settings':
                showSettings();
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
     * Handle text formatting
     */
    function handleFormat(format) {
        if (!editor) return;

        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        const beforeText = editor.value.substring(0, start);
        const afterText = editor.value.substring(end);

        let newText = '';
        let newSelectionStart = start;
        let newSelectionEnd = end;

        switch (format) {
            case 'bold':
                newText = `**${selectedText}**`;
                if (selectedText) {
                    newSelectionStart = start;
                    newSelectionEnd = end + 4;
                } else {
                    newSelectionStart = newSelectionEnd = start + 2;
                }
                break;
                
            case 'italic':
                newText = `*${selectedText}*`;
                if (selectedText) {
                    newSelectionStart = start;
                    newSelectionEnd = end + 2;
                } else {
                    newSelectionStart = newSelectionEnd = start + 1;
                }
                break;
                
            case 'underline':
                newText = `_${selectedText}_`;
                if (selectedText) {
                    newSelectionStart = start;
                    newSelectionEnd = end + 2;
                } else {
                    newSelectionStart = newSelectionEnd = start + 1;
                }
                break;
                
            case 'bullet':
                if (selectedText) {
                    newText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
                } else {
                    newText = '• ';
                    newSelectionStart = newSelectionEnd = start + 2;
                }
                break;
                
            case 'number':
                if (selectedText) {
                    newText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
                } else {
                    newText = '1. ';
                    newSelectionStart = newSelectionEnd = start + 3;
                }
                break;
        }

        // Update editor content
        editor.value = beforeText + newText + afterText;
        editor.setSelectionRange(newSelectionStart, newSelectionEnd);
        editor.focus();

        // Trigger input event
        handleInput();
    }

    /**
     * Handle editor input
     */
    function handleInput() {
        if (isDestroyed) return;

        isDirty = true;
        updateCharacterCount();
        updateStatus('Modified');

        if (config.autoSave) {
            scheduleAutoSave();
        }
    }

    /**
     * Handle key down events
     */
    function handleKeyDown(e) {
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    saveNotes(true);
                    break;
                case 'b':
                    if (config.enableFormatting) {
                        e.preventDefault();
                        handleFormat('bold');
                    }
                    break;
                case 'i':
                    if (config.enableFormatting) {
                        e.preventDefault();
                        handleFormat('italic');
                    }
                    break;
                case 'u':
                    if (config.enableFormatting) {
                        e.preventDefault();
                        handleFormat('underline');
                    }
                    break;
            }
        }

        // Auto-indent for lists
        if (e.key === 'Enter' && config.enableFormatting) {
            const cursorPos = editor.selectionStart;
            const textBeforeCursor = editor.value.substring(0, cursorPos);
            const lines = textBeforeCursor.split('\n');
            const currentLine = lines[lines.length - 1];

            // Check for bullet points
            const bulletMatch = currentLine.match(/^(\s*)(•|\*|-)\s/);
            if (bulletMatch) {
                e.preventDefault();
                const indent = bulletMatch[1];
                const bullet = bulletMatch[2];
                const newLine = `\n${indent}${bullet} `;
                insertAtCursor(newLine);
                return;
            }

            // Check for numbered lists
            const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s/);
            if (numberMatch) {
                e.preventDefault();
                const indent = numberMatch[1];
                const nextNumber = parseInt(numberMatch[2]) + 1;
                const newLine = `\n${indent}${nextNumber}. `;
                insertAtCursor(newLine);
                return;
            }
        }
    }

    /**
     * Handle paste events
     */
    function handlePaste(e) {
        // Clean up pasted content
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const cleanPaste = paste.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Check if it would exceed max length
        const currentLength = editor.value.length;
        const selectionLength = editor.selectionEnd - editor.selectionStart;
        const newLength = currentLength - selectionLength + cleanPaste.length;
        
        if (newLength > config.maxLength) {
            e.preventDefault();
            const allowedLength = config.maxLength - (currentLength - selectionLength);
            const truncatedPaste = cleanPaste.substring(0, allowedLength);
            insertAtCursor(truncatedPaste);
            showMessage('Content was truncated to fit within the character limit', 'warning');
        }
    }

    /**
     * Handle focus events
     */
    function handleFocus() {
        updateStatus('Editing');
    }

    /**
     * Handle blur events
     */
    function handleBlur() {
        if (isDirty && config.autoSave) {
            saveNotes();
        }
    }

    /**
     * Insert text at cursor position
     */
    function insertAtCursor(text) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const before = editor.value.substring(0, start);
        const after = editor.value.substring(end);
        
        editor.value = before + text + after;
        editor.selectionStart = editor.selectionEnd = start + text.length;
        
        handleInput();
    }

    /**
     * Update character count display
     */
    function updateCharacterCount() {
        const countElement = element?.querySelector('#notes-count');
        if (countElement && editor) {
            const current = editor.value.length;
            countElement.textContent = `${current} / ${config.maxLength}`;
            
            // Update color based on usage
            if (current > config.maxLength * 0.9) {
                countElement.style.color = 'var(--danger)';
            } else if (current > config.maxLength * 0.8) {
                countElement.style.color = 'var(--warning)';
            } else {
                countElement.style.color = '';
            }
        }
    }

    /**
     * Update status display
     */
    function updateStatus(status) {
        const statusElement = element?.querySelector('#notes-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * Schedule auto-save
     */
    function scheduleAutoSave() {
        if (saveTimer) {
            clearTimeout(saveTimer);
        }
        
        saveTimer = setTimeout(() => {
            saveNotes();
        }, config.saveInterval);
    }

    /**
     * Save notes
     */
    function saveNotes(showToast = false) {
        if (!editor || isDestroyed) return;

        try {
            config.content = editor.value;
            isDirty = false;
            
            // Clear auto-save timer
            if (saveTimer) {
                clearTimeout(saveTimer);
                saveTimer = null;
            }

            updateStatus('Saved');
            
            if (showToast) {
                showMessage('Notes saved successfully', 'success');
            }

            // Trigger save event for persistence
            window.dashboard?.state?.save();
            
        } catch (error) {
            console.error('Error saving notes:', error);
            showMessage('Failed to save notes', 'error');
        }
    }

    /**
     * Clear all notes
     */
    function clearNotes() {
        if (!editor) return;

        const hasContent = editor.value.trim().length > 0;
        if (hasContent) {
            const confirmed = confirm('Are you sure you want to clear all notes? This action cannot be undone.');
            if (!confirmed) return;
        }

        editor.value = '';
        config.content = '';
        isDirty = false;
        
        updateCharacterCount();
        updateStatus('Cleared');
        
        showMessage('Notes cleared', 'success');
        
        // Save the cleared state
        saveNotes();
    }

    /**
     * Export notes as text file
     */
    function exportNotes() {
        if (!editor || !editor.value.trim()) {
            showMessage('No content to export', 'warning');
            return;
        }

        try {
            const content = editor.value;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `notes-${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            showMessage('Notes exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting notes:', error);
            showMessage('Failed to export notes', 'error');
        }
    }

    /**
     * Import notes from text file
     */
    function importNotes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.text';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const content = await file.text();
                
                if (content.length > config.maxLength) {
                    const confirmed = confirm(
                        `The imported file is ${content.length} characters, which exceeds the limit of ${config.maxLength}. ` +
                        'Do you want to import it anyway? It will be truncated.'
                    );
                    if (!confirmed) return;
                }

                const finalContent = content.length > config.maxLength 
                    ? content.substring(0, config.maxLength)
                    : content;

                if (editor) {
                    editor.value = finalContent;
                    config.content = finalContent;
                    isDirty = true;
                    
                    updateCharacterCount();
                    updateStatus('Imported');
                    
                    if (content.length > config.maxLength) {
                        showMessage('File imported and truncated to fit character limit', 'warning');
                    } else {
                        showMessage('Notes imported successfully', 'success');
                    }
                    
                    saveNotes();
                }
                
            } catch (error) {
                console.error('Error importing notes:', error);
                showMessage('Failed to import file', 'error');
            }
        });
        
        input.click();
    }

    /**
     * Show message (toast or inline)
     */
    function showMessage(message, type) {
        window.dashboard?.ui?.showToast(message, type);
    }

    /**
     * Show settings modal
     */
    function showSettings() {
        console.log('Notes settings requested');
    }

    /**
     * Initialize widget
     */
    function init() {
        element = createElement();
        updateCharacterCount();
        return element;
    }

    /**
     * Destroy widget
     */
    function destroy() {
        isDestroyed = true;
        
        // Save any unsaved changes
        if (isDirty && config.autoSave) {
            saveNotes();
        }
        
        // Clear timers
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        
        element = null;
        editor = null;
    }

    /**
     * Get widget configuration
     */
    function getConfig() {
        // Save current content before returning config
        if (editor && !isDestroyed) {
            config.content = editor.value;
        }
        return { ...config };
    }

    /**
     * Set widget configuration
     */
    function setConfig(newConfig) {
        Object.assign(config, newConfig);
        
        // Update title if changed
        if (newConfig.title) {
            const titleElement = element?.querySelector('.widget-title');
            if (titleElement) {
                titleElement.textContent = newConfig.title;
            }
        }
        
        // Update content if changed
        if (newConfig.content !== undefined && editor) {
            editor.value = newConfig.content;
            updateCharacterCount();
        }
        
        // Update placeholder
        if (newConfig.placeholder && editor) {
            editor.placeholder = newConfig.placeholder;
        }
        
        // Update max length
        if (newConfig.maxLength && editor) {
            editor.maxLength = newConfig.maxLength;
            updateCharacterCount();
        }
    }

    /**
     * Refresh widget
     */
    function refresh() {
        // Notes don't need refreshing, but we can update the display
        updateCharacterCount();
        updateStatus('Ready');
    }

    /**
     * Get settings form for configuration
     */
    function getSettingsForm() {
        const form = document.createElement('div');
        form.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="notes-placeholder">Placeholder Text</label>
                <input type="text" id="notes-placeholder" class="form-input" 
                       name="placeholder" value="${config.placeholder}" 
                       placeholder="Enter placeholder text">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="notes-max-length">Character Limit</label>
                <input type="number" id="notes-max-length" class="form-input" 
                       name="maxLength" value="${config.maxLength}" 
                       min="100" max="50000" placeholder="10000">
            </div>
            
            <div class="form-group">
                <div class="form-checkbox">
                    <input type="checkbox" id="notes-auto-save" 
                           name="autoSave" ${config.autoSave ? 'checked' : ''}>
                    <label for="notes-auto-save">Auto-save</label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="notes-save-interval">Save Interval (seconds)</label>
                <input type="number" id="notes-save-interval" class="form-input" 
                       name="saveInterval" value="${config.saveInterval / 1000}" 
                       min="1" max="60" placeholder="2">
            </div>
            
            <div class="form-group">
                <div class="form-checkbox">
                    <input type="checkbox" id="notes-enable-formatting" 
                           name="enableFormatting" ${config.enableFormatting ? 'checked' : ''}>
                    <label for="notes-enable-formatting">Enable formatting toolbar</label>
                </div>
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