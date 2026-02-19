/**
 * Welcome page data loading functions
 * Loads statistics and updates from JSON files
 */

// Track if data has been loaded
let statisticsLoaded = false;
let updatesLoaded = false;

// Function to initialize pagination after both data sets are loaded
function checkAndInitializePagination() {
    if (statisticsLoaded && updatesLoaded) {
        if (typeof initializeWelcomePagination === 'function') {
            setTimeout(() => {
                initializeWelcomePagination();
            }, 100);
        }
    }
}

// Load and render statistics from JSON
async function loadWelcomeStatistics() {
    try {
        // Path is relative to index.html (root), not welcome.html
        const response = await fetch('resources/db/statistics.json');
        if (!response.ok) {
            console.error('Error loading statistics.json:', response.status);
            return;
        }
        const data = await response.json();
        const tbody = document.getElementById('statistics-tbody');
        if (!tbody) {
            console.error('Statistics tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        data.statistics.forEach(function(stat) {
            const row = document.createElement('tr');
            const percentage = stat.percentage + '%';
            const label = stat.completedSubtopics + '/' + stat.totalSubtopics;
            const tooltip = stat.completedSubtopics + ' of ' + stat.totalSubtopics + ' subtopics';
            
            row.innerHTML = 
                '<td style="vertical-align: middle;">' + stat.technology + '</td>' +
                '<td style="vertical-align: middle;">' + stat.category + '</td>' +
                '<td style="vertical-align: middle;">' + stat.availableTopics + '</td>' +
                '<td style="vertical-align: middle;">' +
                    '<div class="progress-bar-wrapper" style="display: flex; align-items: center; gap: 0.5rem;">' +
                        '<div class="progress-bar-container" style="flex: 1; height: 16px;" data-percentage="' + percentage + '">' +
                            '<div class="progress-bar-fill" style="width: ' + percentage + ';">' +
                                '<span class="progress-bar-text">' + percentage + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<span class="progress-bar-label" title="' + tooltip + '" style="font-size: 11px; color: #666; white-space: nowrap; display: flex; align-items: center; justify-content: center; margin-top: 0; height: 16px; padding: 0;">' + label + '</span>' +
                    '</div>' +
                '</td>';
            tbody.appendChild(row);
        });
        
        // Initialize circular progress bars after rendering
        if (typeof initializeCircularProgressBars === 'function') {
            initializeCircularProgressBars();
        }
        
        statisticsLoaded = true;
        checkAndInitializePagination();
    } catch (error) {
        console.error('Error loading statistics:', error);
        statisticsLoaded = true; // Mark as loaded even on error to avoid blocking
        checkAndInitializePagination();
    }
}

// Load and render updates from JSON
async function loadWelcomeUpdates() {
    try {
        // Path is relative to index.html (root), not welcome.html
        const response = await fetch('resources/db/updates.json');
        if (!response.ok) {
            console.error('Error loading updates.json:', response.status);
            return;
        }
        const data = await response.json();
        const timeline = document.getElementById('updates-timeline');
        if (!timeline) {
            console.error('Updates timeline not found');
            return;
        }
        
        timeline.innerHTML = '';
        data.updates.forEach(function(update) {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = '<strong>' + update.title + '</strong> - ' + update.description;
            timeline.appendChild(item);
        });
        
        updatesLoaded = true;
        checkAndInitializePagination();
    } catch (error) {
        console.error('Error loading updates:', error);
        updatesLoaded = true; // Mark as loaded even on error to avoid blocking
        checkAndInitializePagination();
    }
}
