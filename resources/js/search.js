// Content Search System

// Search index cache
let searchIndex = null;
let searchIndexPromise = null;

// Function to normalize text for search
function normalizeSearchText(text) {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim();
}

// Function to extract text from an HTML element
function extractTextFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// Function to get text snippet around keyword
function getSnippet(text, keyword, maxLength = 150) {
    const normalizedText = normalizeSearchText(text);
    const normalizedKeyword = normalizeSearchText(keyword);
    const index = normalizedText.indexOf(normalizedKeyword);
    
    if (index === -1) {
        return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + keyword.length + 50);
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
}

// Function to index an HTML page
async function indexPage(url, lang) {
    try {
        console.log('Search: Indexing page:', url);
        
        // For file:// protocol, uses XMLHttpRequest instead of fetch
        let html;
        if (url.startsWith('file://')) {
            html = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 0 || xhr.status === 200) {
                            resolve(xhr.responseText);
                        } else {
                            console.error('Search: Error loading', url, 'Status:', xhr.status);
                            reject(new Error(`HTTP ${xhr.status}`));
                        }
                    }
                };
                xhr.onerror = function() {
                    console.error('Search: Network error loading', url);
                    reject(new Error('Network error'));
                };
                xhr.send();
            });
        } else {
            const response = await fetch(url);
            if (!response.ok) {
                console.error('Search: HTTP error loading', url, 'Status:', response.status);
                return null;
            }
            html = await response.text();
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extracts page title
        const titleElement = doc.querySelector('h1');
        const title = titleElement ? titleElement.textContent.trim() : doc.title;
        
        // Extracts main content
        const contentContainer = doc.querySelector('.content-container');
        if (!contentContainer) return null;
        
        // Remove scripts e estilos
        const clone = contentContainer.cloneNode(true);
        clone.querySelectorAll('script, style').forEach(el => el.remove());
        
        // Extrai todo o texto
        const text = clone.textContent || clone.innerText || '';
        
        // Extracts description (first paragraph or info-box)
        const infoBox = contentContainer.querySelector('.info-box');
        let description = '';
        if (infoBox) {
            description = infoBox.textContent.trim();
        } else {
            const firstParagraph = contentContainer.querySelector('p');
            if (firstParagraph) {
                description = firstParagraph.textContent.trim();
            }
        }
        
        // Extrai o path do menu para obter o caminho correto
        const menuNode = doc.querySelector(`[data-html="${url.replace(/^.*\//, '')}"]`);
        const menuPath = menuNode ? menuNode.getAttribute('data-path') : '';
        
        return {
            url: url,
            title: title,
            description: description || text.substring(0, 200),
            text: text,
            lang: lang,
            path: menuPath,
            originalPath: null // Will be filled during indexing
        };
    } catch (error) {
        console.error('Error indexing page:', url, error);
        return null;
    }
}

// Function to load pages from JSON
async function loadPagesFromJSON() {
    try {
        // Path is relative to index.html (root)
        const response = await fetch('resources/db/search.json');
        if (!response.ok) {
            console.error('Search: Error loading search.json:', response.status);
            return [];
        }
        const data = await response.json();
        if (!data || !data.pages) {
            console.error('Search: Invalid search.json format');
            return [];
        }
        return data.pages;
    } catch (error) {
        console.error('Search: Error loading search.json:', error);
        return [];
    }
}

// Function to build search index
async function buildSearchIndex() {
    if (searchIndex) return searchIndex;
    if (searchIndexPromise) return searchIndexPromise;
    
    searchIndexPromise = (async () => {
        const index = [];
        const currentLang = localStorage.getItem('codeflow-language') || 'en';
        
        // Load pages from JSON file
        const pages = await loadPagesFromJSON();
        console.log('Search: Pages loaded from JSON:', pages.length);
        
        if (pages.length === 0) {
            console.error('Search: No pages found in search.json');
            return [];
        }
        
        // Indexes only pages from current language
        let pagesToIndex = pages.filter(p => p.lang === currentLang);
        console.log('Search: Pages to index for language', currentLang + ':', pagesToIndex.length);
        
        // If no pages found for current language, fallback to 'en'
        if (pagesToIndex.length === 0 && currentLang !== 'en') {
            console.log('Search: No pages found for language', currentLang + ', falling back to en');
            pagesToIndex = pages.filter(p => p.lang === 'en');
            console.log('Search: Pages to index for language en:', pagesToIndex.length);
        }
        
        // Calculates base path
        const currentHref = window.location.href;
        const currentPath = window.location.pathname;
        let basePath = '';
        
        console.log('Search: currentHref:', currentHref);
        console.log('Search: currentPath:', currentPath);
        
        if (currentHref.startsWith('file://')) {
            // For file://, builds absolute path
            try {
                const url = new URL(currentHref);
                const pathname = url.pathname;
                
                // Finds where 'codeflow.github.io' is in path
                const projectIndex = pathname.indexOf('/codeflow.github.io/');
                
                if (projectIndex !== -1) {
                    // Builds absolute path to project root
                    const projectRoot = pathname.substring(0, projectIndex + '/codeflow.github.io'.length);
                    basePath = `file://${projectRoot}/`;
                } else {
                    // Fallback: calculates relative path
                    if (currentPath.includes('/content/')) {
                        const pathParts = currentPath.split('/').filter(p => p);
                        const depth = pathParts.length - 1;
                        basePath = '../'.repeat(depth);
                    } else {
                        basePath = './';
                    }
                }
            } catch (e) {
                console.error('Search: Error calculating basePath file://', e);
                basePath = './';
            }
        } else {
            // Para http/https
            if (currentPath.includes('/content/')) {
                const pathParts = currentPath.split('/').filter(p => p);
                const depth = pathParts.length - 1;
                basePath = '../'.repeat(depth);
            } else if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath.endsWith('search.html')) {
                basePath = './';
            } else {
                basePath = './';
            }
        }
        
        console.log('Search: basePath calculado:', basePath);
        
        // Indexes all pages
        const indexPromises = pagesToIndex.map(page => {
            const fullPath = basePath + page.path;
            console.log('Search: Indexing:', fullPath);
            return indexPage(fullPath, page.lang).then(result => {
                if (result) {
                    // Stores original page path
                    result.originalPath = page.path;
                }
                return result;
            });
        });
        
        const results = await Promise.all(indexPromises);
        const indexed = results.filter(r => r !== null);
        
        searchIndex = indexed;
        return indexed;
    })();
    
    return searchIndexPromise;
}

// Search function
function searchContent(query, index) {
    if (!query || !index || index.length === 0) return [];
    
    const normalizedQuery = normalizeSearchText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    
    const results = [];
    
    index.forEach(page => {
        const normalizedText = normalizeSearchText(page.text);
        const normalizedTitle = normalizeSearchText(page.title);
        const normalizedDescription = normalizeSearchText(page.description);
        
        let score = 0;
        let matches = [];
        
        // Searches by words
        queryWords.forEach(word => {
            // Title has higher weight
            if (normalizedTitle.includes(word)) {
                score += 10;
                matches.push('title');
            }
            
            // Description has medium weight
            if (normalizedDescription.includes(word)) {
                score += 5;
                matches.push('description');
            }
            
            // Content has lower weight
            const contentMatches = (normalizedText.match(new RegExp(word, 'g')) || []).length;
            score += contentMatches;
            if (contentMatches > 0) {
                matches.push('content');
            }
        });
        
        // Exact search has extra weight
        if (normalizedText.includes(normalizedQuery) || normalizedTitle.includes(normalizedQuery)) {
            score += 20;
        }
        
        if (score > 0) {
            results.push({
                ...page,
                score: score,
                matches: [...new Set(matches)],
                snippet: getSnippet(page.text, query)
            });
        }
    });
    
    // Sorts by score (highest first)
    results.sort((a, b) => b.score - a.score);
    
    return results;
}

// Function to perform search and redirect to results page or load in index.html
function performSearch(query) {
    console.log('Search: performSearch called with query:', query);
    
    if (!query || query.trim().length === 0) {
        alert('Please enter a search term.');
        return;
    }
    
    // Saves query in URL
    const currentLang = localStorage.getItem('codeflow-language') || 'en';
    
    // Check if we are in index.html
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop();
    const isIndexPage = currentFileName === 'index.html' || currentFileName === '' || currentPath === '/';
    
    if (isIndexPage && typeof window.loadSearchContent === 'function') {
        // If we are in index.html and the function exists, load search content directly
        console.log('Search: Loading search content in index.html');
        window.loadSearchContent(query, currentLang);
        // Update URL without reloading
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('q', query);
        newUrl.searchParams.set('lang', currentLang);
        window.history.pushState({}, '', newUrl);
    } else {
        // Otherwise, redirect to search.html (for standalone access or other pages)
        const currentHref = window.location.href;
        const currentPath = window.location.pathname;
        let relativePath = '';
        
        console.log('Search: currentPath:', currentPath);
        console.log('Search: currentHref:', currentHref);
        
        // Detects if we are using file:// protocol
        if (currentHref.startsWith('file://')) {
            // For file://, uses a simpler approach: builds absolute path
            try {
                const url = new URL(currentHref);
                const pathname = url.pathname;
                
                // Removes current file name
                const lastSlashIndex = pathname.lastIndexOf('/');
                const directoryPath = pathname.substring(0, lastSlashIndex + 1);
                
                // Finds where 'codeflow.github.io' is in path
                const projectIndex = pathname.indexOf('/codeflow.github.io/');
                
                if (projectIndex !== -1) {
                    // Builds absolute path to project root
                    const projectRoot = pathname.substring(0, projectIndex + '/codeflow.github.io'.length);
                    relativePath = `file://${projectRoot}/search.html`;
                } else {
                    // Fallback: calculates relative path based on structure
                    if (pathname.includes('/content/')) {
                        // Counts how many levels to go up
                        const pathParts = directoryPath.split('/').filter(p => p);
                        const contentIndex = pathParts.indexOf('content');
                        
                        if (contentIndex !== -1) {
                            // From file to content, then to root
                            const depth = pathParts.length - contentIndex;
                            relativePath = '../'.repeat(depth) + 'search.html';
                        } else {
                            // Counts all directories
                            const depth = pathParts.length;
                            relativePath = '../'.repeat(depth) + 'search.html';
                        }
                    } else {
                        relativePath = './search.html';
                    }
                }
            } catch (e) {
                console.error('Search: Error calculating path file://', e);
                // Simple fallback
                if (currentPath.includes('/content/')) {
                    const pathWithoutFile = currentPath.substring(0, currentPath.lastIndexOf('/'));
                    const depth = (pathWithoutFile.match(/\//g) || []).length;
                    relativePath = '../'.repeat(depth) + 'search.html';
                } else {
                    relativePath = './search.html';
                }
            }
        } else {
            // Para http/https
            if (currentPath.includes('/content/')) {
                const pathParts = currentPath.split('/').filter(p => p);
                const depth = pathParts.length - 1;
                relativePath = '../'.repeat(depth) + 'search.html';
            } else if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath.endsWith('search.html')) {
                relativePath = './search.html';
            } else {
                relativePath = './search.html';
            }
        }
        
        const finalUrl = `${relativePath}?q=${encodeURIComponent(query)}&lang=${currentLang}`;
        console.log('Search: Redirecting to:', finalUrl);
        
        window.location.href = finalUrl;
    }
}

// Search system initialization
(function() {
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (!searchInput || !searchButton) {
            console.warn('Search: Search elements not found');
            return;
        }
        
        console.log('Search: Initializing search system');
        
        // Busca ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                console.log('Search: Enter pressed, query:', query);
                if (query) {
                    performSearch(query);
                } else {
                    alert('Please enter a search term.');
                }
            }
        });
        
        // Search on button click
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            console.log('Search: Button clicked, query:', query);
            if (query) {
                performSearch(query);
            } else {
                alert('Please enter a search term.');
            }
        });
        
        // Function to update placeholder based on language
        function updateSearchPlaceholder() {
            const currentLang = localStorage.getItem('codeflow-language') || 'en';
            searchInput.placeholder = '🔍 Search content...';
            searchButton.title = 'Search';
        }
        
        // Updates initial placeholder
        updateSearchPlaceholder();
        
        // Observes language changes
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.addEventListener('change', updateSearchPlaceholder);
        }
        
        // Observes localStorage changes (for when language changes elsewhere)
        window.addEventListener('storage', function(e) {
            if (e.key === 'codeflow-language') {
                updateSearchPlaceholder();
            }
        });
    }
    
    // Waits for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        // DOM is already ready, inicializa imediatamente
        initSearch();
    }
    
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (!searchInput || !searchButton) {
            console.warn('Search: Search elements not found');
            return;
        }
        
        console.log('Search: Initializing search system');
        
        // Busca ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                console.log('Search: Enter pressed, query:', query);
                if (query) {
                    performSearch(query);
                } else {
                    alert('Please enter a search term.');
                }
            }
        });
        
        // Search on button click
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            console.log('Search: Button clicked, query:', query);
            if (query) {
                performSearch(query);
            } else {
                alert('Please enter a search term.');
            }
        });
        
        // Function to update placeholder based on language
        function updateSearchPlaceholder() {
            const currentLang = localStorage.getItem('codeflow-language') || 'en';
            searchInput.placeholder = '🔍 Search content...';
            searchButton.title = 'Search';
        }
        
        // Updates initial placeholder
        updateSearchPlaceholder();
        
        // Observes language changes
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.addEventListener('change', updateSearchPlaceholder);
        }
        
        // Observes localStorage changes (for when language changes elsewhere)
        window.addEventListener('storage', function(e) {
            if (e.key === 'codeflow-language') {
                updateSearchPlaceholder();
            }
        });
    }
})();

// Exports functions for use in results page
if (typeof window !== 'undefined') {
    window.searchContent = searchContent;
    window.buildSearchIndex = buildSearchIndex;
    window.normalizeSearchText = normalizeSearchText;
    window.getSnippet = getSnippet;
}

