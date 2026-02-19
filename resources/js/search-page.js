/**
 * Search Page JavaScript
 * Handles search results display and navigation
 */

// Processa os resultados da busca
(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    const lang = urlParams.get('lang') || localStorage.getItem('codeflow-language') || 'en';
    
    // Updates language
    localStorage.setItem('codeflow-language', lang);
    if (document.getElementById('languageSelector')) {
        document.getElementById('languageSelector').value = lang;
    }
    
    // Atualiza placeholder do campo de busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        searchInput.placeholder = lang === 'en' ? '🔍 Search content...' : '🔍 Buscar conteúdo...';
    }
    
    const resultsContainer = document.getElementById('searchResultsContainer');
    
    if (!query || query.trim().length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <h2>${lang === 'en' ? 'No search query' : 'Nenhuma busca realizada'}</h2>
                <p>${lang === 'en' ? 'Please enter a search term in the search box above.' : 'Por favor, digite um termo de busca no campo acima.'}</p>
            </div>
        `;
        return;
    }
    
    try {
        console.log('Search: Building search index...');
        // Builds search index
        const index = await buildSearchIndex();
        console.log('Search: Index built with', index ? index.length : 0, 'pages');
        
        // Performs search
        console.log('Search: Searching for:', query);
        const results = searchContent(query, index);
        console.log('Search: Found', results.length, 'results');
        
        // Exibe os resultados
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-stats">
                    ${lang === 'en' ? `No results found for "${query}"` : `Nenhum resultado encontrado para "${query}"`}
                </div>
                <div class="search-no-results">
                    <h2>${lang === 'en' ? 'No results found' : 'Nenhum resultado encontrado'}</h2>
                    <p>${lang === 'en' ? 'Try different keywords or check the spelling.' : 'Tente palavras-chave diferentes ou verifique a ortografia.'}</p>
                </div>
            `;
        } else {
            let html = `
                <div class="search-stats">
                    ${lang === 'en' 
                        ? `Found ${results.length} result${results.length > 1 ? 's' : ''} for "${query}"`
                        : `Encontrado${results.length > 1 ? 's' : ''} ${results.length} resultado${results.length > 1 ? 's' : ''} para "${query}"`}
                </div>
                <div class="search-results">
            `;
            
            results.forEach(result => {
                // ALWAYS extracts relative path, never uses result.url directly
                let filePath = result.originalPath;
                
                console.log('Search: Result:', result);
                console.log('Search: originalPath:', result.originalPath);
                console.log('Search: url:', result.url);
                
                // If no originalPath, ALWAYS extracts from URL
                if (!filePath || !filePath.startsWith('content/')) {
                    let urlPath = result.url || '';
                    
                    // Removes file:// protocol if exists
                    if (urlPath.startsWith('file://')) {
                        urlPath = urlPath.substring(7);
                    }
                    
                    // Removes http:// or https:// if exists
                    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
                        const urlObj = new URL(urlPath);
                        urlPath = urlObj.pathname;
                    }
                    
                    // Removes absolute paths and keeps only relative path from content/
                    const contentIndex = urlPath.indexOf('content/');
                    if (contentIndex !== -1) {
                        filePath = urlPath.substring(contentIndex);
                    } else if (urlPath.startsWith('./content/')) {
                        filePath = urlPath.substring(2); // Remove ./
                    } else if (urlPath.startsWith('/content/')) {
                        filePath = urlPath.substring(1); // Remove /
                    }
                }
                
                // Ensures it starts with content/
                if (!filePath || !filePath.startsWith('content/')) {
                    console.warn('Search: Invalid path after processing:', filePath, 'from result:', result);
                    // Fallback: tries to use menu path if available
                    if (result.path) {
                        // Tries to build path from menu path
                        const pathParts = result.path.split('/');
                        // Assumes last element is file name
                        const fileName = pathParts[pathParts.length - 1];
                        // Tries to find file in menu.json to get correct htmlFile
                        filePath = null; // Will be filled below if possible
                    }
                    
                    // If still no valid filePath, skips this result
                    if (!filePath || !filePath.startsWith('content/')) {
                        console.error('Search: Could not determine file path for:', result.title);
                        return; // Skips this result
                    }
                }
                
                console.log('Search: filePath after processing:', filePath);
                
                // Redireciona para index.html com o parâmetro file
                // ALWAYS uses index.html, never direct file path
                const encodedFilePath = encodeURIComponent(filePath);
                const homeUrl = `./index.html?file=${encodedFilePath}`;
                
                console.log('Search: filePath final:', filePath);
                console.log('Search: homeUrl:', homeUrl);
                
                html += `
                    <div class="search-result-item">
                        <div class="search-result-title">
                            <a href="javascript:void(0)" class="search-result-link" data-file="${encodedFilePath}">📖 ${result.title}</a>
                        </div>
                        ${result.path ? `<div class="search-result-path">📍 ${result.path}</div>` : ''}
                        <div class="search-result-description">
                            ${result.description}
                        </div>
                        ${result.snippet ? `<div class="search-result-snippet">${result.snippet}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
            resultsContainer.innerHTML = html;
            
            // Uses event delegation on container to capture all clicks
            // This ensures it works even if links are modified later
            resultsContainer.addEventListener('click', function(e) {
                const link = e.target.closest('.search-result-link');
                if (link) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const filePathAttr = link.getAttribute('data-file');
                    console.log('Search: Link clicked (delegation), filePath:', filePathAttr);
                    
                    if (filePathAttr) {
                        // Check if we are in index.html
                        const currentFileName = window.location.pathname.split('/').pop();
                        if (currentFileName === 'index.html' || currentFileName === '' || window.location.pathname === '/') {
                            // If in index.html, use loadContentFromFile if available
                            if (typeof window.loadContentFromFile === 'function') {
                                window.loadContentFromFile(filePathAttr);
                                return false;
                            }
                        }
                        // Otherwise, redirect to index.html with file parameter
                        const redirectUrl = `./index.html?file=${filePathAttr}`;
                        console.log('Search: Redirecting to:', redirectUrl);
                        window.location.href = redirectUrl;
                        return false;
                    } else {
                        console.error('Search: filePath not found in data-file attribute');
                        return false;
                    }
                }
            }, true); // Usa capture phase para interceptar antes de outros handlers
            
            // Also adds individual listeners as backup
            const resultLinks = resultsContainer.querySelectorAll('.search-result-link');
            console.log('Search: Found', resultLinks.length, 'result links');
            resultLinks.forEach((link, index) => {
                const filePath = link.getAttribute('data-file');
                console.log(`Search: Setting up link ${index}, filePath:`, filePath);
                
                // Ensures href is always javascript:void(0)
                link.setAttribute('href', 'javascript:void(0)');
                
                // Observa mudanças no href para garantir que não seja alterado
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
                            const currentHref = link.getAttribute('href');
                            if (currentHref && !currentHref.startsWith('javascript:') && !currentHref.startsWith('#')) {
                                console.warn('Search: href foi alterado para:', currentHref, '- restaurando para javascript:void(0)');
                                link.setAttribute('href', 'javascript:void(0)');
                            }
                        }
                    });
                });
                observer.observe(link, { attributes: true, attributeFilter: ['href'] });
                
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const filePathAttr = this.getAttribute('data-file');
                    console.log('Search: Link clicado (individual), filePath:', filePathAttr);
                    
                    if (filePathAttr) {
                        // Check if we are in index.html
                        const currentFileName = window.location.pathname.split('/').pop();
                        if (currentFileName === 'index.html' || currentFileName === '' || window.location.pathname === '/') {
                            // If in index.html, use loadContentFromFile if available
                            if (typeof window.loadContentFromFile === 'function') {
                                window.loadContentFromFile(filePathAttr);
                                return false;
                            }
                        }
                        // Otherwise, redirect to index.html with file parameter
                        const redirectUrl = `./index.html?file=${filePathAttr}`;
                        console.log('Search: Redirecting to:', redirectUrl);
                        window.location.href = redirectUrl;
                        return false;
                    }
                    return false;
                }, true);
            });
        }
    } catch (error) {
        console.error('Erro ao realizar busca:', error);
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <h2>${lang === 'en' ? 'Search Error' : 'Erro na Busca'}</h2>
                <p>${lang === 'en' ? 'An error occurred while searching. Please try again.' : 'Ocorreu um erro ao realizar a busca. Por favor, tente novamente.'}</p>
            </div>
        `;
    }
})();
