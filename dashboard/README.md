# Customizable Frontend Dashboard

A production-quality, single-page customizable dashboard built with pure HTML, CSS, and vanilla JavaScript. Features drag-and-drop widgets, persistent layouts, multiple themes, and comprehensive accessibility support.

![Dashboard Preview](https://github.com/user-attachments/assets/504183fb-3d88-4614-beb6-d36b7cb74c58)

## ✨ Features

### 🎯 Core Functionality
- **Grid-based Layout**: 12-column responsive grid with snap-to-grid positioning
- **Drag & Drop**: Smooth widget repositioning with visual feedback and collision detection
- **Resize Support**: 8-direction resize handles (N/E/S/W + corners) with grid snapping
- **Persistent State**: Automatic localStorage persistence with import/export capabilities
- **Widget Management**: Add, remove, clone, and configure widgets with settings modals

### 🎨 Theming & Design
- **Multiple Themes**: Light, Dark, and AMOLED themes with system preference support
- **CSS Variables**: Comprehensive design token system for easy customization
- **Glassmorphism**: Optional backdrop-filter effects with fallback support
- **Animations**: Smooth micro-interactions with `prefers-reduced-motion` support
- **Responsive Design**: Mobile-first approach with breakpoint optimizations

### ♿ Accessibility
- **Keyboard Navigation**: Full keyboard support with arrow key movement and resizing
- **Screen Reader Support**: Comprehensive ARIA labels, roles, and landmarks
- **Focus Management**: Proper focus rings and tab order throughout the interface
- **High Contrast**: WCAG AA contrast compliance with high contrast theme variants

### 📱 Widget Library

#### 🕐 Clock Widget
- Digital and analog display modes
- Timezone selection with common zones
- 12/24 hour format toggle
- Date display with customizable formatting
- Double-click to switch modes

#### 🌤️ Weather Widget
- Current weather conditions with mock data
- Temperature in Celsius, Fahrenheit, or Kelvin
- Detailed metrics: humidity, wind, pressure, UV index
- City selection with API key support (OpenWeatherMap)
- Offline mode with graceful fallback

#### 📝 Notes Widget
- Rich text editing with formatting toolbar
- Markdown-style formatting (bold, italic, underline)
- Auto-save functionality with configurable intervals
- Character count and limit enforcement
- Export/import text files
- Bullet and numbered list support

#### ✅ Todo Widget *(Coming Soon)*
- Task creation, completion, and deletion
- Filter views (All, Active, Completed)
- Drag-to-reorder functionality
- Task statistics and progress tracking

#### 🍅 Pomodoro Widget *(Coming Soon)*
- Focus and break timer cycles
- Audio notifications and visual progress
- Customizable work/break durations
- Session statistics tracking

#### 📅 Calendar Widget *(Coming Soon)*
- Mini month view with navigation
- Quick note creation for dates
- Event reminders (local storage)
- Today highlighting

#### 💭 Quotes Widget *(Coming Soon)*
- Inspirational quotes with categories
- Random quote generation
- Copy/share functionality
- Custom quote collections

#### 📈 Stocks Widget *(Coming Soon)*
- Stock and cryptocurrency tracking
- Real-time price updates (with API)
- Mini sparkline charts
- Portfolio management

#### 🔗 Quick Links Widget *(Coming Soon)*
- Bookmark management with favicons
- Drag-to-reorder links
- Categories and folders
- Open in new tab support

#### 💻 System Widget *(Coming Soon)*
- Memory usage monitoring
- Network status indicator
- Battery level (when available)
- Browser information

## 🚀 Quick Start

### Prerequisites
- Modern web browser with ES6+ support
- No build tools required - works directly from file system

### Installation
1. Clone or download the repository
2. Navigate to the `dashboard` directory
3. Open `index.html` in your web browser

```bash
# Clone the repository
git clone <repository-url>
cd Node-Js-Trial/dashboard

# Open in browser (choose one)
# Option 1: Double-click index.html
# Option 2: Serve locally
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### First Use
1. The dashboard loads with a default layout of sample widgets
2. Drag widgets by their title bars to reposition
3. Use resize handles (corners and edges) to change widget size
4. Click "Add Widget" to add new widgets
5. Right-click widgets for context menu options
6. Use the theme toggle to switch between light/dark/AMOLED themes

## 🎮 Usage Guide

### Navigation & Shortcuts

#### Mouse Controls
- **Drag**: Click and drag widget title bar to move
- **Resize**: Click and drag resize handles (8 directions)
- **Context Menu**: Right-click widget for options menu
- **Double-click**: Toggle clock widget display mode

#### Keyboard Shortcuts
- `Ctrl/Cmd + A` - Open "Add Widget" modal
- `Ctrl/Cmd + T` - Toggle theme
- `Ctrl/Cmd + S` - Force save current layout
- `Ctrl/Cmd + Shift + R` - Refresh all widgets
- `Esc` - Close modals/menus
- `Arrow Keys` - Move focused widget (1 grid unit)
- `Shift + Arrow Keys` - Move focused widget (5 grid units)
- `Ctrl/Cmd + Arrow Keys` - Resize focused widget

#### Widget-Specific Shortcuts
- **Notes**: `Ctrl/Cmd + B/I/U` for bold/italic/underline
- **Notes**: `Ctrl/Cmd + S` to save notes

### Widget Management

#### Adding Widgets
1. Click "Add Widget" button or press `Ctrl/Cmd + A`
2. Select desired widget type from the library
3. Widget appears in the next available grid position
4. Configure settings via the settings button

#### Removing Widgets
1. Right-click widget → "Remove"
2. Or click the remove button in widget header
3. Confirm deletion in the dialog

#### Widget Settings
1. Click the settings icon in widget header
2. Modify configuration options
3. Click "Save Changes" to apply

### Layout Management

#### Saving & Loading
- **Auto-save**: Layout automatically saves to localStorage
- **Manual save**: `Ctrl/Cmd + S` or "Save" button
- **Export**: More menu → "Export Layout" (downloads JSON)
- **Import**: More menu → "Import Layout" (upload JSON file)
- **Reset**: More menu → "Reset to Default"

#### Grid Configuration
The dashboard uses a 12-column grid system:
- **Columns**: 12 (responsive: 4 on mobile, 6 on tablet, 8+ on desktop)
- **Row Height**: 4rem (64px)
- **Gap**: 1rem (16px)
- **Responsive**: Automatically adjusts on screen size changes

## 🛠️ Customization

### Adding New Widget Types

1. **Create Widget Module** (`/js/widgets/mywidget.js`):
```javascript
export function createWidget(initialConfig = {}) {
    // Widget configuration
    const config = { title: 'My Widget', ...initialConfig };
    
    // Create DOM element
    const element = document.createElement('div');
    element.className = 'my-widget';
    element.innerHTML = `...`; // Widget HTML
    
    // Return widget API
    return {
        el: element,
        getConfig: () => ({ ...config }),
        setConfig: (newConfig) => Object.assign(config, newConfig),
        refresh: () => { /* refresh logic */ },
        destroy: () => { /* cleanup logic */ },
        getSettingsForm: () => { /* settings form */ }
    };
}
```

2. **Register in Main** (`/js/main.js`):
```javascript
import * as MyWidget from './widgets/mywidget.js';

// Add to registerWidgetTypes()
{ type: 'mywidget', module: MyWidget, name: 'My Widget', description: '...' }
```

3. **Add Widget Styles** (`/css/widgets.css`):
```css
.my-widget {
    /* Widget-specific styles */
}
```

### Theme Customization

#### Modifying Existing Themes
Edit `/css/themes.css` to modify color values:

```css
[data-theme="light"] {
    --primary: #your-color;
    --bg: #your-background;
    /* ... other variables */
}
```

#### Creating New Themes
Add new theme definitions:

```css
[data-theme="mytheme"] {
    --bg: #...;
    --text: #...;
    /* ... all required variables */
}
```

#### CSS Variables Reference
See `/css/base.css` for the complete list of available CSS custom properties.

### Performance Optimizations

#### Efficient Drag & Drop
- Uses `transform` properties for 60fps performance
- `will-change` hints for hardware acceleration
- Debounced save operations to prevent excessive localStorage writes

#### Responsive Observers
- `ResizeObserver` for container size changes
- `IntersectionObserver` for lazy widget initialization
- Automatic cleanup on component destruction

#### Memory Management
- Proper event listener cleanup
- Timer clearing on widget destruction
- Efficient DOM manipulation with document fragments

## 🧪 Testing

### Manual Testing Checklist

#### Core Functionality
- [ ] Dashboard loads without errors
- [ ] Default widgets appear in correct positions
- [ ] Drag and drop works smoothly
- [ ] Resize handles function properly
- [ ] Grid snapping works correctly
- [ ] Collision detection prevents overlaps

#### Persistence
- [ ] Layout saves automatically
- [ ] Page refresh preserves layout
- [ ] Export downloads valid JSON
- [ ] Import restores layout correctly
- [ ] Reset returns to default layout

#### Theming
- [ ] Theme toggle cycles through all themes
- [ ] System preference detection works
- [ ] Reduced motion preference respected
- [ ] All themes have proper contrast

#### Accessibility
- [ ] Tab navigation follows logical order
- [ ] All interactive elements focusable
- [ ] Keyboard shortcuts work as documented
- [ ] Screen reader announcements appropriate
- [ ] Focus indicators visible and clear

#### Widget Functionality
- [ ] Clock updates every second
- [ ] Weather displays mock data correctly
- [ ] Notes auto-save and manual save work
- [ ] All widget actions function properly
- [ ] Settings modals open and save

#### Responsive Design
- [ ] Layout adapts to different screen sizes
- [ ] Touch interactions work on mobile
- [ ] Grid columns adjust appropriately
- [ ] Text remains readable at all sizes

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Features Used**: ES6 Modules, CSS Grid, CSS Custom Properties, ResizeObserver
- **Fallbacks**: Graceful degradation for unsupported features

## 📋 Technical Architecture

### File Structure
```
dashboard/
├── index.html              # Main entry point
├── assets/
│   ├── favicon.svg         # Site favicon
│   └── icons.svg           # SVG icon sprite
├── css/
│   ├── base.css            # CSS reset, variables, utilities
│   ├── layout.css          # Grid system, responsive layout
│   ├── components.css      # UI components (buttons, modals)
│   ├── widgets.css         # Widget-specific styles
│   ├── themes.css          # Theme definitions
│   └── animations.css      # Animations and transitions
└── js/
    ├── main.js             # Application bootstrap
    ├── state.js            # State management and persistence
    ├── grid.js             # Drag, drop, resize functionality
    ├── ui.js               # UI components and interactions
    └── widgets/
        ├── clock.js        # Clock widget implementation
        ├── weather.js      # Weather widget implementation
        ├── notes.js        # Notes widget implementation
        ├── todo.js         # Todo widget implementation
        ├── pomodoro.js     # Pomodoro widget implementation
        ├── calendar.js     # Calendar widget implementation
        ├── quotes.js       # Quotes widget implementation
        ├── stocks.js       # Stocks widget implementation
        ├── links.js        # Links widget implementation
        └── system.js       # System widget implementation
```

### State Management
- **Centralized Store**: Single source of truth in `StateManager`
- **Event-Driven**: Pub/sub pattern for component communication
- **Persistent**: Automatic localStorage with migration support
- **Transactional**: All changes go through state actions

### Component Architecture
- **Modular**: Each widget is a self-contained module
- **Composable**: Widgets implement consistent API interface
- **Lifecycle**: Proper initialization and cleanup
- **Configurable**: Settings-driven behavior

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes following the coding standards
4. Test thoroughly using the manual checklist
5. Submit a pull request

### Coding Standards
- **JavaScript**: ES6+ modules, consistent naming, JSDoc comments
- **CSS**: BEM methodology, mobile-first, design tokens
- **HTML**: Semantic markup, accessibility attributes
- **Performance**: 60fps animations, debounced operations

### Reporting Issues
Please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console error messages
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons from various open source icon libraries
- Inspiration from modern dashboard designs
- Community feedback and contributions

---

**Built with ❤️ using vanilla web technologies**