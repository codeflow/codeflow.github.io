/**
 * Redirect to index.html if page is accessed directly (not loaded in index.html)
 * This ensures all content pages are displayed with menu and header
 * 
 * This script must be loaded FIRST, before any other scripts, styles, or content loads
 */
(function() {
    // Check immediately if we should redirect
    if (window.self !== window.top) return; // In iframe, don't redirect
    if (document.querySelector('.app-layout')) return; // Already in index.html, don't redirect
    
    // Get current page path
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const searchQuery = urlParams.get('q');
    
    // Check if this is the search page
    const isSearchPage = currentPath.includes('search.html');
    
    if (isSearchPage) {
        // For search page, always redirect with ?q= parameter (even if empty)
        const lang = urlParams.get('lang') || localStorage.getItem('codeflow-language') || 'en';
        let redirectUrl;
        if (currentHref.startsWith('file://')) {
            if (searchQuery) {
                redirectUrl = `../../index.html?q=${encodeURIComponent(searchQuery)}&lang=${lang}`;
            } else {
                redirectUrl = `../../index.html?q=&lang=${lang}`;
            }
        } else {
            if (searchQuery) {
                redirectUrl = `/index.html?q=${encodeURIComponent(searchQuery)}&lang=${lang}`;
            } else {
                redirectUrl = `/index.html?q=&lang=${lang}`;
            }
        }
        window.location.replace(redirectUrl);
        return;
    }
    
    // For other content pages, extract path from content/ directory
    let filePath = '';
    
    if (currentHref.startsWith('file://')) {
        // For file:// protocol
        const projectIndex = currentPath.indexOf('/codeflow.github.io/');
        if (projectIndex !== -1) {
            filePath = currentPath.substring(projectIndex + '/codeflow.github.io/'.length);
        } else {
            const contentIndex = currentPath.indexOf('content/');
            if (contentIndex !== -1) {
                filePath = currentPath.substring(contentIndex);
            }
        }
    } else {
        // For http/https - extract everything from 'content' onwards
        const pathParts = currentPath.split('/').filter(p => p);
        const contentIndex = pathParts.indexOf('content');
        if (contentIndex !== -1) {
            filePath = pathParts.slice(contentIndex).join('/');
        }
    }
    
    // If we found a content path, redirect to index.html
    if (filePath && filePath.startsWith('content/')) {
        const depth = filePath.split('/').length - 1;
        let redirectUrl;
        if (currentHref.startsWith('file://')) {
            // For file://, calculate relative path
            const relativePath = '../'.repeat(depth) + 'index.html';
            redirectUrl = `${relativePath}?file=${encodeURIComponent(filePath)}`;
        } else {
            // For http/https, use absolute path from root
            redirectUrl = `/index.html?file=${encodeURIComponent(filePath)}`;
        }
        window.location.replace(redirectUrl);
    }
})();
