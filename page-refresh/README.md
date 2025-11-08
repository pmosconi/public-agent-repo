# Page Refresh

A lightweight JavaScript module that provides automatic page refresh functionality through URL query parameters.

## Features

- **Periodic Refresh**: Automatically refresh the page at regular intervals
- **Scheduled Refresh**: Refresh the page at a specific time of day
- **Flexible Configuration**: Use both refresh methods simultaneously
- **No Dependencies**: Pure JavaScript implementation

## Usage in Your Site

### 1. Include the Script

Add the `page-refresh.js` file to your project and include it in your HTML:

```html
<script src="page-refresh.js"></script>
```

### 2. Initialize the Module

Initialize the PageRefresh module in your page:

```html
<script>
    const pageRefresh = new PageRefresh();
    const config = pageRefresh.init();
    
    // Optional: Display status messages
    if (config.statusMessages.length > 0) {
        console.log(config.statusMessages.join('\n'));
    }
</script>
```

### 3. Use URL Parameters

Control the refresh behavior using URL query parameters:

#### Refresh Every N Seconds

```
https://yoursite.com/page.html?refresh_every=30
```

This will refresh the page every 30 seconds.

#### Refresh at a Specific Time

```
https://yoursite.com/page.html?refresh_at=1430
```

This will refresh the page at 14:30 (2:30 PM). Time format is `hhmm` in 24-hour notation.

#### Combine Both Methods

```
https://yoursite.com/page.html?refresh_every=60&refresh_at=1500
```

This will refresh the page every 60 seconds AND at 15:00 (3:00 PM).

## API Reference

### Constructor

```javascript
const pageRefresh = new PageRefresh();
```

Creates a new PageRefresh instance.

### Methods

#### `init()`

Initializes the page refresh functionality by reading URL parameters and setting up timers.

**Returns:** Configuration object with status messages

```javascript
const config = pageRefresh.init();
// config.statusMessages: Array of status messages
// config.refreshEvery: Configured refresh interval (seconds)
// config.refreshAt: Configured refresh time (object with hours, minutes, targetTime)
```

#### `cancel()`

Cancels all scheduled refreshes.

```javascript
pageRefresh.cancel();
```

#### `getConfig()`

Returns the current configuration.

```javascript
const config = pageRefresh.getConfig();
```

## Example

See `index.html` for a complete working example that demonstrates the page refresh functionality with a live status display.

## Notes

- If `refresh_at` time has already passed for the current day, it will be scheduled for the next day
- Both refresh methods can be active simultaneously
- Invalid parameters will be logged in the status messages but won't cause errors
