/**
 * Page Refresh Module
 * 
 * Provides automatic page refresh functionality based on URL parameters:
 * - refresh_every: Refresh page every N seconds
 * - refresh_at: Refresh page at a specific time (hhmm format)
 * 
 * Both parameters can be used simultaneously.
 */

class PageRefresh {
    constructor() {
        this.refreshEveryTimeout = null;
        this.refreshAtTimeout = null;
        this.config = {
            refreshEvery: null,
            refreshAt: null,
            statusMessages: []
        };
    }

    /**
     * Parse query string parameter
     * @param {string} param - Parameter name
     * @returns {string|null} Parameter value or null
     */
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    /**
     * Setup refresh_every timer
     * @param {string} refreshEvery - Seconds to wait before refresh
     * @returns {boolean} Success status
     */
    setupRefreshEvery(refreshEvery) {
        const seconds = parseInt(refreshEvery);
        if (isNaN(seconds) || seconds <= 0) {
            this.config.statusMessages.push('Invalid refresh_every parameter (must be a positive number)');
            return false;
        }

        this.config.refreshEvery = seconds;
        this.config.statusMessages.push(`Auto-refresh enabled: Page will refresh every ${seconds} seconds`);
        
        this.refreshEveryTimeout = setTimeout(() => {
            window.location.reload();
        }, seconds * 1000);

        return true;
    }

    /**
     * Setup refresh_at timer
     * @param {string} refreshAt - Time in hhmm format
     * @returns {boolean} Success status
     */
    setupRefreshAt(refreshAt) {
        const timeStr = refreshAt.toString();
        if (timeStr.length !== 4) {
            this.config.statusMessages.push('Invalid refresh_at parameter (format should be hhmm, e.g., 1430 for 2:30 PM)');
            return false;
        }

        const hours = parseInt(timeStr.substring(0, 2));
        const minutes = parseInt(timeStr.substring(2, 4));
        
        if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
            this.config.statusMessages.push('Invalid refresh_at parameter (format should be hhmm, e.g., 1430 for 2:30 PM)');
            return false;
        }

        const now = new Date();
        const targetTime = new Date();
        targetTime.setHours(hours, minutes, 0, 0);
        
        // If target time is in the past today, set it for tomorrow
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        const timeUntilRefresh = targetTime - now;
        
        this.config.refreshAt = { hours, minutes, targetTime };
        this.config.statusMessages.push(
            `Auto-refresh enabled: Page will refresh at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
        );
        
        this.refreshAtTimeout = setTimeout(() => {
            window.location.reload();
        }, timeUntilRefresh);

        return true;
    }

    /**
     * Initialize page refresh functionality
     * @returns {Object} Configuration object with status messages
     */
    init() {
        const refreshEvery = this.getQueryParam('refresh_every');
        const refreshAt = this.getQueryParam('refresh_at');

        if (refreshEvery) {
            this.setupRefreshEvery(refreshEvery);
        }

        if (refreshAt) {
            this.setupRefreshAt(refreshAt);
        }

        if (!refreshEvery && !refreshAt) {
            this.config.statusMessages.push('No refresh parameters detected - page will not auto-refresh');
        }

        return this.config;
    }

    /**
     * Cancel all scheduled refreshes
     */
    cancel() {
        if (this.refreshEveryTimeout) {
            clearTimeout(this.refreshEveryTimeout);
            this.refreshEveryTimeout = null;
        }
        if (this.refreshAtTimeout) {
            clearTimeout(this.refreshAtTimeout);
            this.refreshAtTimeout = null;
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return this.config;
    }
}

// Export for use in HTML page
if (typeof window !== 'undefined') {
    window.PageRefresh = PageRefresh;
}
