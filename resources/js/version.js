/**
 * Version Badge Script
 * Fetches the latest tag from GitHub repository and displays it as a badge
 */

(function() {
    'use strict';

    const GITHUB_API_URL = 'https://api.github.com/repos/codeflow/codeflow.github.io/tags';
    const VERSION_BADGE_ID = 'versionBadge';

    /**
     * Extracts version number from tag name (removes 'v' prefix if present)
     * @param {string} tagName - Tag name from GitHub (e.g., "v1.0.0" or "1.0.0")
     * @returns {string} - Version number without 'v' prefix
     */
    function extractVersionNumber(tagName) {
        if (!tagName) return '-';
        // Remove 'v' prefix if present
        return tagName.replace(/^v/i, '');
    }

    /**
     * Updates the version badge with the version number
     * @param {string} version - Version number to display
     */
    function updateVersionBadge(version) {
        const badge = document.getElementById(VERSION_BADGE_ID);
        if (!badge) {
            console.warn('Version badge element not found');
            return;
        }

        const versionNumber = extractVersionNumber(version);
        badge.textContent = versionNumber;
        badge.title = `Version: ${versionNumber}`;
        badge.style.display = 'inline-block';
    }

    /**
     * Handles error when fetching version
     */
    function handleVersionError() {
        const badge = document.getElementById(VERSION_BADGE_ID);
        if (!badge) return;

        badge.textContent = '-';
        badge.title = 'Version: Unable to load';
    }

    /**
     * Fetches the latest tag from GitHub API
     */
    async function fetchLatestVersion() {
        const badge = document.getElementById(VERSION_BADGE_ID);
        if (!badge) {
            console.warn('Version badge element not found, retrying...');
            // Retry after a short delay
            setTimeout(fetchLatestVersion, 500);
            return;
        }

        try {
            const response = await fetch(GITHUB_API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tags = await response.json();
            
            if (!tags || !Array.isArray(tags) || tags.length === 0) {
                throw new Error('No tags found');
            }

            // Get the first tag (latest)
            const latestTag = tags[0];
            const tagName = latestTag.name || latestTag.tag_name || '';
            
            updateVersionBadge(tagName);
        } catch (error) {
            console.error('Error fetching version:', error);
            handleVersionError();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fetchLatestVersion);
    } else {
        // Small delay to ensure DOM is fully ready
        setTimeout(fetchLatestVersion, 100);
    }
})();
