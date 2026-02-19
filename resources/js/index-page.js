/**
 * Index Page JavaScript
 * Handles dynamic content loading, pagination, mobile menu, and other page-specific functionality
 */

// ===== Global utility functions (needed by dynamically loaded content) =====

        // Copy code button handler (used by code blocks in content pages)
        window.copyCode = function(button) {
            const wrapper = button.closest('.code-block-wrapper');
            if (!wrapper) return;
            const codeEl = wrapper.querySelector('code');
            if (!codeEl) return;
            const text = codeEl.textContent;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    const original = button.textContent;
                    button.textContent = '✔ Copied!';
                    setTimeout(function() { button.textContent = original; }, 2000);
                }).catch(function() {
                    fallbackCopy(text, button);
                });
            } else {
                fallbackCopy(text, button);
            }
        };

        // Fallback for browsers without Clipboard API (e.g. file://)
        function fallbackCopy(text, button) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
                const original = button.textContent;
                button.textContent = '✔ Copied!';
                setTimeout(function() { button.textContent = original; }, 2000);
            } catch (e) {
                console.warn('Copy failed:', e);
            }
            document.body.removeChild(ta);
        }

        // ===== Helper: execute scripts found inside a container =====
        function executeContainerScripts(container) {
            container.querySelectorAll('script').forEach(function(oldScript) {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(function(attr) {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }

        // Função para carregar conteúdo dinamicamente baseado no HTML file do menu
        async function loadContentFromMenu(htmlFile, label) {
            const contentBody = document.getElementById('contentBody');
            const contentHeader = document.getElementById('contentHeader');
            
            if (!contentBody) return;
            
            // Se não há htmlFile, mostra mensagem padrão
            if (!htmlFile) {
                contentBody.innerHTML = '<div class="content-container"><h1>Welcome to Codeflow</h1><p>Select an item from the menu to view content.</p></div>';
                if (contentHeader) contentHeader.textContent = 'Home';
                return;
            }
            
            try {
                // Obtém o idioma atual
                const currentLang = localStorage.getItem('codeflow-language') || 'en';
                
                // Constrói o caminho completo com idioma
                // O htmlFile vem do menu.json sem o /{LANGUAGE}/, então precisamos adicionar
                let contentPath = htmlFile;
                
                // Se o caminho não inclui o idioma, adiciona
                // Padrão: content/{tech}.md/{hash}/{lang}/{file}.html ou content/{tech}.md/{lang}/{file}.html
                if (!contentPath.includes(`/${currentLang}/`)) {
                    // Verifica se tem hash de categoria (formato: content/{tech}.md/{hash}/{file}.html)
                    const hashPattern = /content\/([a-z0-9]+)\.md\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
                    const hashMatch = contentPath.match(hashPattern);
                    
                    if (hashMatch) {
                        // Tem hash de categoria: content/{tech}.md/{hash}/{lang}/{file}.html
                        const tech = hashMatch[1];
                        const hash = hashMatch[2];
                        const file = hashMatch[3];
                        contentPath = `content/${tech}.md/${hash}/${currentLang}/${file}`;
                    } else {
                        // Sem hash: content/{tech}.md/{file}.html -> content/{tech}.md/{lang}/{file}.html
                        const simplePattern = /content\/([a-z0-9]+)\.md\/([a-z0-9]+\.html)$/;
                        const simpleMatch = contentPath.match(simplePattern);
                        
                        if (simpleMatch) {
                            const tech = simpleMatch[1];
                            const file = simpleMatch[2];
                            contentPath = `content/${tech}.md/${currentLang}/${file}`;
                        } else {
                            // Tenta adicionar o idioma antes do último segmento
                            const lastSlash = contentPath.lastIndexOf('/');
                            if (lastSlash !== -1) {
                                const before = contentPath.substring(0, lastSlash);
                                const after = contentPath.substring(lastSlash + 1);
                                contentPath = `${before}/${currentLang}/${after}`;
                            }
                        }
                    }
                }
                
                // Calculates relative path a partir de index.html (na raiz)
                let relativePath = contentPath;
                if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
                    relativePath = './' + relativePath;
                }
                
                let html;
                
                // Checks if using file:// or http/https
                if (window.location.href.startsWith('file://')) {
                    // For file://, uses XMLHttpRequest
                    html = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', relativePath, true);
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 0 || xhr.status === 200) {
                                    resolve(xhr.responseText);
                                } else {
                                    console.error('Error loading content, Status:', xhr.status);
                                    // If not found and not 'en', tries 'en' as fallback
                                    if (xhr.status === 404 && currentLang !== 'en') {
                                        console.warn(`Content not found in ${currentLang}, trying 'en' as fallback`);
                                        const fallbackPath = relativePath.replace(`/${currentLang}/`, '/en/');
                                        const fallbackXhr = new XMLHttpRequest();
                                        fallbackXhr.open('GET', fallbackPath, true);
                                        fallbackXhr.onreadystatechange = function() {
                                            if (fallbackXhr.readyState === 4) {
                                                if (fallbackXhr.status === 0 || fallbackXhr.status === 200) {
                                                    resolve(fallbackXhr.responseText);
                                                } else {
                                                    reject(new Error(`HTTP ${fallbackXhr.status} - Content not found in ${currentLang} or en`));
                                                }
                                            }
                                        };
                                        fallbackXhr.send();
                                    } else {
                                        reject(new Error(`HTTP ${xhr.status}`));
                                    }
                                }
                            }
                        };
                        xhr.onerror = function() {
                            console.error('Network error loading content');
                            reject(new Error('Network error'));
                        };
                        xhr.send();
                    });
                } else {
                    // Para http/https, usa fetch
                    const response = await fetch(relativePath);
                    if (!response.ok) {
                        // Se não encontrou, tenta com idioma 'en' como fallback
                        if (response.status === 404 && currentLang !== 'en') {
                            console.warn(`Content not found in ${currentLang}, trying 'en' as fallback`);
                            // Tenta substituir o idioma por 'en' no caminho
                            const fallbackPath = relativePath.replace(`/${currentLang}/`, '/en/');
                            const fallbackResponse = await fetch(fallbackPath);
                            if (fallbackResponse.ok) {
                                html = await fallbackResponse.text();
                            } else {
                                // Se ainda não encontrou, mostra mensagem de erro
                                throw new Error(`HTTP ${response.status} - Content not found in ${currentLang} or en`);
                            }
                        } else if (response.status === 404) {
                            // Se já estava tentando 'en' e não encontrou, mostra erro
                            throw new Error(`HTTP ${response.status} - Content not found`);
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    } else {
                        html = await response.text();
                    }
                }
                
                // Parses HTML and extracts only content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const contentContainer = doc.querySelector('.content-container');
                
                if (contentContainer) {
                    // Inserts content into content area
                    contentBody.innerHTML = contentContainer.outerHTML;

                    // Execute any inline scripts present in the loaded content
                    const insertedContainer = contentBody.querySelector('.content-container');
                    if (insertedContainer) {
                        executeContainerScripts(insertedContainer);
                    }
                    
                    // Updates header
                    if (contentHeader && label) {
                        contentHeader.textContent = label;
                    }
                    
                    // Initializes highlight.js for code
                    if (typeof hljs !== 'undefined') {
                        document.querySelectorAll('pre code').forEach((block) => {
                            hljs.highlightElement(block);
                            if (typeof hljs.lineNumbersBlock !== 'undefined') {
                                hljs.lineNumbersBlock(block);
                            }
                        });
                    }
                    
                    // Initializes Giscus if comments container exists
                    initializeGiscusIfNeeded();
                } else {
                    contentBody.innerHTML = '<div class="content-container"><p>Error: Content not found</p></div>';
                }
            } catch (error) {
                console.error('Error loading content:', error);
                // Mostra mensagem de erro em vez de redirecionar
                const errorMessage = error.message.includes('404') 
                    ? 'Content not found. Please check if the content exists in the selected language.'
                    : 'Error loading content: ' + error.message;
                contentBody.innerHTML = `<div class="content-container"><h1>Error</h1><p>${errorMessage}</p></div>`;
                if (contentHeader) {
                    contentHeader.textContent = 'Error';
                }
            }
        }
        
        // Function to load search content in index.html
        async function loadSearchContent(query, lang) {
            const contentBody = document.getElementById('contentBody');
            const contentHeader = document.getElementById('contentHeader');
            
            if (!contentBody) return;
            
            try {
                // Get current language
                const currentLang = lang || localStorage.getItem('codeflow-language') || 'en';
                
                // Build path to search.html
                const searchPath = `./content/${currentLang}/search.html`;
                
                // Load search page
                let html;
                if (window.location.href.startsWith('file://')) {
                    html = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', searchPath, true);
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 0 || xhr.status === 200) {
                                    resolve(xhr.responseText);
                                } else {
                                    if (xhr.status === 404 && currentLang !== 'en') {
                                        const fallbackXhr = new XMLHttpRequest();
                                        fallbackXhr.open('GET', './content/en/search.html', true);
                                        fallbackXhr.onreadystatechange = function() {
                                            if (fallbackXhr.readyState === 4) {
                                                if (fallbackXhr.status === 0 || fallbackXhr.status === 200) {
                                                    resolve(fallbackXhr.responseText);
                                                } else {
                                                    reject(new Error(`HTTP ${fallbackXhr.status}`));
                                                }
                                            }
                                        };
                                        fallbackXhr.send();
                                    } else {
                                        reject(new Error(`HTTP ${xhr.status}`));
                                    }
                                }
                            }
                        };
                        xhr.onerror = function() {
                            reject(new Error('Network error'));
                        };
                        xhr.send();
                    });
                } else {
                    let response = await fetch(searchPath);
                    if (!response.ok) {
                        if (response.status === 404 && currentLang !== 'en') {
                            response = await fetch('./content/en/search.html');
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`);
                            }
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    }
                    html = await response.text();
                }
                
                // Parse HTML and extract content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const contentContainer = doc.querySelector('.content-container');
                
                if (contentContainer && contentBody) {
                    // Update URL with search query FIRST, before inserting content
                    // This ensures search-page.js can read the query from URL
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('q', query);
                    newUrl.searchParams.set('lang', currentLang);
                    window.history.replaceState({}, '', newUrl);
                    
                    // Extract and execute scripts before inserting content
                    const scripts = contentContainer.querySelectorAll('script');
                    const scriptsToExecute = [];
                    scripts.forEach(script => {
                        scriptsToExecute.push({
                            src: script.src,
                            text: script.textContent
                        });
                        script.remove();
                    });
                    
                    // Insert content
                    contentBody.innerHTML = contentContainer.outerHTML;
                    
                    // Set search query in input field
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.value = query;
                    }
                    
                    // Execute scripts in order
                    // search.js is already loaded in index.html, so we just need search-page.js
                    // Use absolute path from root
                    const searchPageJsPath = window.location.href.startsWith('file://') 
                        ? './resources/js/search-page.js'
                        : '/resources/js/search-page.js';
                    
                    async function executeSearchScripts() {
                        try {
                            // Wait a bit to ensure URL is updated and DOM is ready
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                            // Verify that searchResultsContainer exists
                            const resultsContainer = document.getElementById('searchResultsContainer');
                            if (!resultsContainer) {
                                return;
                            }
                            
                            // Check if buildSearchIndex is available (from search.js)
                            if (typeof buildSearchIndex === 'undefined') {
                                resultsContainer.innerHTML = `
                                    <div class="search-no-results">
                                        <h2>Search Error</h2>
                                        <p>Search functionality is not available. Please refresh the page.</p>
                                    </div>
                                `;
                                return;
                            }
                            
                            // Now load search-page.js
                            // This will execute immediately when loaded (it's an IIFE)
                            await new Promise((resolve, reject) => {
                                const script = document.createElement('script');
                                script.src = searchPageJsPath;
                                script.onload = () => {
                                    // Wait a bit more to ensure the IIFE executed
                                    setTimeout(() => {
                                        resolve();
                                    }, 300);
                                };
                                script.onerror = () => {
                                    reject(new Error('Failed to load search-page.js'));
                                };
                                document.body.appendChild(script);
                            });
                            
                            // Execute inline scripts
                            scriptsToExecute.forEach(scriptData => {
                                if (!scriptData.src) {
                                    const newScript = document.createElement('script');
                                    newScript.textContent = scriptData.text;
                                    document.body.appendChild(newScript);
                                }
                            });
                        } catch (error) {
                            console.error('Error loading search scripts:', error);
                            const resultsContainer = document.getElementById('searchResultsContainer');
                            if (resultsContainer) {
                                resultsContainer.innerHTML = `
                                    <div class="search-no-results">
                                        <h2>Search Error</h2>
                                        <p>An error occurred while loading search functionality. Please try again.</p>
                                        <p style="font-size: 12px; color: #666;">Error: ${error.message}</p>
                                    </div>
                                `;
                            }
                        }
                    }
                    
                    executeSearchScripts();
                    
                    // Update header
                    if (contentHeader) {
                        contentHeader.textContent = '🔍 Search Results';
                    }
                    
                    // Initialize highlight.js
                    if (typeof hljs !== 'undefined') {
                        document.querySelectorAll('pre code').forEach((block) => {
                            hljs.highlightElement(block);
                            if (typeof hljs.lineNumbersBlock !== 'undefined') {
                                hljs.lineNumbersBlock(block);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading search page:', error);
                contentBody.innerHTML = '<div class="content-container"><h1>🔍 Search Results</h1><p>Error loading search page.</p></div>';
                if (contentHeader) contentHeader.textContent = '🔍 Search Results';
            }
        }
        
        // Make loadSearchContent available globally for performSearch
        window.loadSearchContent = loadSearchContent;
        
        // Função para inicializar paginação do welcome page
        function initializeWelcomePagination() {
            // Initialize pagination for Content Statistics (table rows)
            const statsTbody = document.getElementById('statistics-tbody');
            if (statsTbody) {
                const statsRows = Array.from(statsTbody.querySelectorAll('tr'));
                if (statsRows.length > 10) {
                    initializePaginationForItems('statistics-container', statsRows, 'statistics-pagination', 10);
                }
            }
            
            // Initialize pagination for Latest Updates (timeline items)
            const updatesTimeline = document.getElementById('updates-timeline');
            if (updatesTimeline) {
                const timelineItems = Array.from(updatesTimeline.querySelectorAll('.timeline-item'));
                if (timelineItems.length > 10) {
                    initializePaginationForItems('updates-container', timelineItems, 'updates-pagination', 10);
                }
            }
        }
        
        // Função genérica para inicializar paginação
        function initializePaginationForItems(containerId, items, paginationId, itemsPerPage) {
            const totalItems = items.length;
            const paginationContainer = document.getElementById(paginationId);
            
            if (!paginationContainer) {
                console.log('Pagination container not found:', paginationId);
                return;
            }
            
            if (totalItems <= itemsPerPage) {
                return;
            }
            
            paginationContainer.classList.remove('pagination-hidden');
            
            let currentPage = 1;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            
            function showPage(page) {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                
                items.forEach((item, index) => {
                    if (index >= start && index < end) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                updatePaginationControls(page, totalPages);
            }
            
            function updatePaginationControls(page, totalPages) {
                paginationContainer.innerHTML = '';
                
                // Create button group container
                const buttonGroup = document.createElement('div');
                buttonGroup.style.display = 'flex';
                buttonGroup.style.gap = '0';
                
                // Previous button
                const prevButton = document.createElement('button');
                prevButton.className = 'pagination-button';
                prevButton.textContent = '← Previous';
                prevButton.disabled = page === 1;
                prevButton.onclick = () => {
                    if (page > 1) {
                        currentPage = page - 1;
                        showPage(currentPage);
                    }
                };
                buttonGroup.appendChild(prevButton);
                
                // Page numbers
                const maxVisiblePages = 5;
                let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                if (startPage > 1) {
                    const firstButton = document.createElement('button');
                    firstButton.className = 'pagination-button';
                    firstButton.textContent = '1';
                    firstButton.onclick = () => {
                        currentPage = 1;
                        showPage(currentPage);
                    };
                    buttonGroup.appendChild(firstButton);
                    
                    if (startPage > 2) {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'pagination-info';
                        ellipsis.textContent = '...';
                        ellipsis.style.margin = '0';
                        ellipsis.style.padding = '0.5rem 0.25rem';
                        buttonGroup.appendChild(ellipsis);
                    }
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.className = 'pagination-button' + (i === page ? ' active' : '');
                    pageButton.textContent = i;
                    pageButton.onclick = () => {
                        currentPage = i;
                        showPage(currentPage);
                    };
                    buttonGroup.appendChild(pageButton);
                }
                
                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'pagination-info';
                        ellipsis.textContent = '...';
                        ellipsis.style.margin = '0';
                        ellipsis.style.padding = '0.5rem 0.25rem';
                        buttonGroup.appendChild(ellipsis);
                    }
                    
                    const lastButton = document.createElement('button');
                    lastButton.className = 'pagination-button';
                    lastButton.textContent = totalPages;
                    lastButton.onclick = () => {
                        currentPage = totalPages;
                        showPage(currentPage);
                    };
                    buttonGroup.appendChild(lastButton);
                }
                
                // Next button
                const nextButton = document.createElement('button');
                nextButton.className = 'pagination-button';
                nextButton.textContent = 'Next →';
                nextButton.disabled = page === totalPages;
                nextButton.onclick = () => {
                    if (page < totalPages) {
                        currentPage = page + 1;
                        showPage(currentPage);
                    }
                };
                buttonGroup.appendChild(nextButton);
                
                // Append button group to container
                paginationContainer.appendChild(buttonGroup);
                
                // Page info (with spacing before it)
                const info = document.createElement('span');
                info.className = 'pagination-info';
                info.textContent = `Page ${page} of ${totalPages}`;
                info.style.marginLeft = '0.75rem';
                paginationContainer.appendChild(info);
            }
            
            // Initialize first page
            showPage(1);
        }
        
        // Function to initialize Giscus when needed
        function initializeGiscusIfNeeded() {
            const giscusContainer = document.getElementById('giscus-container');
            if (!giscusContainer) {
                return; // No comments container
            }
            
            // Waits a bit to ensure DOM was updated
            setTimeout(() => {
                // Uses global GiscusComments function if available
                // Passes true to force reinitialization if already initialized before
                if (window.GiscusComments && typeof window.GiscusComments.init === 'function') {
                    window.GiscusComments.init(true); // Forces reinitialization
                } else {
                    // If not available, tries to initialize manually
                    // Waits a bit more for script to load
                    setTimeout(() => {
                        if (window.GiscusComments && typeof window.GiscusComments.init === 'function') {
                            window.GiscusComments.init(true); // Forces reinitialization
                        }
                    }, 200);
                }
            }, 100);
        }
        
        // Function to initialize circular progress bars for mobile
        function initializeCircularProgressBars() {
            const progressBars = document.querySelectorAll('.progress-bar-fill');
            progressBars.forEach(function(fill) {
                const container = fill.closest('.progress-bar-container');
                if (!container) return;
                
                // Get percentage from width (can be "33%" or "33px")
                let width = fill.style.width || window.getComputedStyle(fill).width;
                let percentage = 0;
                
                // First, try to get from text content (most reliable)
                const text = fill.querySelector('.progress-bar-text');
                if (text) {
                    const textContent = text.textContent || '';
                    percentage = parseFloat(textContent.replace('%', '')) || 0;
                }
                
                // If not found in text, try to get from width
                if (isNaN(percentage) || percentage === 0) {
                    // If width contains %, extract percentage directly
                    if (width.includes('%')) {
                        percentage = parseFloat(width);
                    } else {
                        // If it's in pixels, calculate percentage from container width
                        const containerWidth = container.offsetWidth || parseFloat(window.getComputedStyle(container).width);
                        if (containerWidth > 0) {
                            percentage = (parseFloat(width) / containerWidth) * 100;
                        }
                    }
                }
                
                // Calculate angle: percentage * 3.6 degrees (360 / 100)
                const angle = percentage * 3.6;
                
                // Set CSS variable for conic-gradient
                container.style.setProperty('--progress-angle', angle + 'deg');
                
                // Set data-percentage attribute for tooltip (always set, even if 0)
                const roundedPercentage = Math.round(percentage);
                container.setAttribute('data-percentage', roundedPercentage + '%');
            });
        }
        
        // Function to load welcome.html from current language
        async function loadWelcomePage() {
            let currentLang = localStorage.getItem('codeflow-language') || 'en';
            let welcomePath = `./content/${currentLang}/welcome.html`;
            
            try {
                let html;
                
                // Checks if using file:// or http/https
                if (window.location.href.startsWith('file://')) {
                    // For file://, uses XMLHttpRequest
                    html = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', welcomePath, true);
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 0 || xhr.status === 200) {
                                    resolve(xhr.responseText);
                                } else {
                                    // If not found and not 'en', tries 'en' as fallback
                                    if (xhr.status === 404 && currentLang !== 'en') {
                                        console.warn(`Welcome not found in ${currentLang}, trying 'en' as fallback`);
                                        const fallbackXhr = new XMLHttpRequest();
                                        fallbackXhr.open('GET', './content/en/welcome.html', true);
                                        fallbackXhr.onreadystatechange = function() {
                                            if (fallbackXhr.readyState === 4) {
                                                if (fallbackXhr.status === 0 || fallbackXhr.status === 200) {
                                                    resolve(fallbackXhr.responseText);
                                                } else {
                                                    reject(new Error(`HTTP ${fallbackXhr.status}`));
                                                }
                                            }
                                        };
                                        fallbackXhr.send();
                                    } else {
                                        reject(new Error(`HTTP ${xhr.status}`));
                                    }
                                }
                            }
                        };
                        xhr.onerror = function() {
                            reject(new Error('Network error'));
                        };
                        xhr.send();
                    });
                } else {
                    // Para http/https, usa fetch
                    let response = await fetch(welcomePath);
                    if (!response.ok) {
                        // If not found and not 'en', tries 'en' as fallback
                        if (response.status === 404 && currentLang !== 'en') {
                            console.warn(`Welcome not found in ${currentLang}, trying 'en' as fallback`);
                            response = await fetch('./content/en/welcome.html');
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status} - Welcome not found in ${currentLang} or en`);
                            }
                        } else if (response.status === 404) {
                            throw new Error(`HTTP ${response.status} - Welcome not found`);
                        } else {
                            throw new Error(`HTTP ${response.status}`);
                        }
                    }
                    html = await response.text();
                }
                
                // Parses HTML and extracts only content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const contentContainer = doc.querySelector('.content-container');
                
                const contentBody = document.getElementById('contentBody');
                const contentHeader = document.getElementById('contentHeader');
                
                if (contentContainer && contentBody) {
                    // Extracts and executes scripts before inserting content
                    const scripts = contentContainer.querySelectorAll('script');
                    const scriptsToExecute = [];
                    scripts.forEach(script => {
                        scriptsToExecute.push({
                            src: script.src,
                            text: script.textContent
                        });
                        script.remove(); // Removes script from content before inserting
                    });
                    
                    // Inserts content into content area
                    contentBody.innerHTML = contentContainer.outerHTML;
                    
                    // Executes extracted scripts
                    scriptsToExecute.forEach(scriptData => {
                        const newScript = document.createElement('script');
                        if (scriptData.src) {
                            newScript.src = scriptData.src;
                        } else {
                            newScript.textContent = scriptData.text;
                        }
                        document.body.appendChild(newScript);
                    });
                    
                    // Wait for DOM to be ready, then call welcome functions
                    setTimeout(() => {
                        if (typeof loadWelcomeStatistics === 'function') {
                            loadWelcomeStatistics();
                        }
                        if (typeof loadWelcomeUpdates === 'function') {
                            loadWelcomeUpdates();
                        }
                    }, 500);
                    
                    // Updates header
                    if (contentHeader) {
                        contentHeader.textContent = 'Welcome to Codeflow';
                    }
                    
                    // Initializes highlight.js for code
                    if (typeof hljs !== 'undefined') {
                        document.querySelectorAll('pre code').forEach((block) => {
                            hljs.highlightElement(block);
                            if (typeof hljs.lineNumbersBlock !== 'undefined') {
                                hljs.lineNumbersBlock(block);
                            }
                        });
                    }
                    
                    // Initializes Giscus if comments container exists
                    initializeGiscusIfNeeded();
                    
                    // Load statistics and updates from JSON files
                    // Wait a bit to ensure DOM is ready
                    setTimeout(() => {
                        if (typeof loadWelcomeStatistics === 'function') {
                            loadWelcomeStatistics();
                        }
                        if (typeof loadWelcomeUpdates === 'function') {
                            loadWelcomeUpdates();
                        }
                        
                        // Initialize pagination after data is loaded and rendered
                        // The pagination will be initialized by the load functions themselves
                        // after they finish rendering the data
                    }, 300);
                }
            } catch (error) {
                console.error('Error loading welcome page:', error);
                const contentBody = document.getElementById('contentBody');
                if (contentBody) {
                    contentBody.innerHTML = '<div class="content-container"><h1>Welcome to Codeflow</h1><p>Select an item from the menu to view content.</p></div>';
                }
            }
        }
        
        // Waits for DOM to be completely ready before initializing
        function initializeHomePage() {
            const originalUpdateContent = window.updateContent;
            
            window.updateContent = async function(path, label, htmlFile, file, lines) {
                const currentFileName = window.location.pathname.split('/').pop();
                
                // Se estamos no index.html, carrega dinamicamente
                if (currentFileName === 'index.html') {
                    // If no htmlFile, does not load content (it is a folder)
                    if (!htmlFile) {
                        return; // Does nothing for folders
                    }
                    await loadContentFromMenu(htmlFile, label);
                } else {
                    // For other pages, uses original behavior
                    if (originalUpdateContent) {
                        return originalUpdateContent(path, label, htmlFile, file, lines);
                    }
                }
            };
            
            // Waits for menu to be built and then checks if there is selected item
            // If not, loads welcome.html
            function checkAndLoadWelcome() {
                const selectedNode = document.querySelector('.app-tree__node--selected');
                
                // If no item selected, loads welcome.html
                if (!selectedNode) {
                    loadWelcomePage();
                }
            }
            
            // Verifica se há parâmetro 'file' ou 'q' na URL
            const urlParams = new URLSearchParams(window.location.search);
            const fileParam = urlParams.get('file');
            const searchQuery = urlParams.get('q');
            
            if (fileParam) {
                // If file parameter exists, loads content directly
                // Removes parameter from URL to clean
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
                
                // Loads content from specified file
                loadContentFromFile(fileParam);
            } else if (searchQuery !== null) {
                // If search query parameter exists (even if empty), loads search page
                loadSearchContent(searchQuery || '', urlParams.get('lang') || localStorage.getItem('codeflow-language') || 'en');
            } else {
                // If there's no parameter, use normal behavior
                // Escuta o evento de menu construído
                document.addEventListener('menuBuilt', function() {
                    // Wait a bit to ensure everything was processed
                    setTimeout(checkAndLoadWelcome, 100);
                });
            }
            
            // Função para carregar conteúdo diretamente de um arquivo (usado pela busca)
            async function loadContentFromFile(filePath) {
                const contentBody = document.getElementById('contentBody');
                const contentHeader = document.getElementById('contentHeader');
                
                if (!contentBody) return;
                
                try {
                    // Obtém o idioma atual
                    const currentLang = localStorage.getItem('codeflow-language') || 'en';
                    
                    // O filePath já vem no formato correto (ex: content/gtk.md/fu153936/en/79zltr953e0t.html)
                    // Mas pode precisar ajustar o idioma se estiver incorreto
                    let contentPath = filePath;
                    
                    // Se o caminho não inclui o idioma correto, ajusta
                    if (!contentPath.includes(`/${currentLang}/`)) {
                        // Tenta substituir o idioma no caminho
                        const langPattern = /\/(en|br|es|fr|de|it|pt)\//;
                        if (langPattern.test(contentPath)) {
                            contentPath = contentPath.replace(langPattern, `/${currentLang}/`);
                        } else {
                            // Se não tem idioma, adiciona antes do nome do arquivo
                            const lastSlash = contentPath.lastIndexOf('/');
                            if (lastSlash !== -1) {
                                const before = contentPath.substring(0, lastSlash);
                                const after = contentPath.substring(lastSlash + 1);
                                contentPath = `${before}/${currentLang}/${after}`;
                            }
                        }
                    }
                    
                    // Calculates relative path a partir de index.html (na raiz)
                    let relativePath = contentPath;
                    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
                        relativePath = './' + relativePath;
                    }
                    
                    let html;
                    
                    // Checks if using file:// or http/https
                    if (window.location.href.startsWith('file://')) {
                        // For file://, uses XMLHttpRequest
                        html = await new Promise((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', relativePath, true);
                            xhr.onreadystatechange = function() {
                                if (xhr.readyState === 4) {
                                    if (xhr.status === 0 || xhr.status === 200) {
                                        resolve(xhr.responseText);
                                    } else {
                                        console.error('Error loading content, Status:', xhr.status);
                                        reject(new Error(`HTTP ${xhr.status}`));
                                    }
                                }
                            };
                            xhr.onerror = function() {
                                console.error('Network error loading content');
                                reject(new Error('Network error'));
                            };
                            xhr.send();
                        });
                    } else {
                        // Para http/https, usa fetch
                        const response = await fetch(relativePath);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        html = await response.text();
                    }
                    
                    // Parses HTML and extracts only content
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const contentContainer = doc.querySelector('.content-container');
                    
                    if (contentContainer) {
                        contentBody.innerHTML = contentContainer.outerHTML;
                        
                        // Updates header com o título
                        const titleElement = contentContainer.querySelector('h1');
                        if (titleElement && contentHeader) {
                            contentHeader.textContent = titleElement.textContent.trim();
                        }
                        
                        // Seleciona o item correspondente no menu
                        // Removes previous selection primeiro
                        document.querySelectorAll('.app-tree__node--selected').forEach(n => {
                            n.classList.remove('app-tree__node--selected');
                        });
                        
                        // Wait for the menu to be built before trying to select
                        await new Promise(resolve => {
                            if (document.querySelector('#treeView')) {
                                // Verifica se o menu já foi construído
                                const checkMenu = setInterval(() => {
                                    const menuNodes = document.querySelectorAll('[data-html]');
                                    if (menuNodes.length > 0) {
                                        clearInterval(checkMenu);
                                        resolve();
                                    }
                                }, 100);
                                
                                // Timeout de segurança
                                setTimeout(() => {
                                    clearInterval(checkMenu);
                                    resolve();
                                }, 2000);
                            } else {
                                resolve();
                            }
                        });
                        
                        // Tenta encontrar o item do menu pelo caminho do arquivo
                        const menuNodes = document.querySelectorAll('[data-html]');
                        const fileName = contentPath.split('/').pop();
                        
                        for (const node of menuNodes) {
                            const nodeHtml = node.getAttribute('data-html');
                            // Verifica se é um arquivo (tem data-html) e não uma pasta
                            const hasChildren = node.closest('.app-tree__item')?.querySelector('.app-tree__children');
                            
                            // Só seleciona se for um arquivo (tem data-html e não tem children)
                            if (nodeHtml && !hasChildren && nodeHtml.includes(fileName)) {
                                // Seleciona o item no menu
                                node.classList.add('app-tree__node--selected');
                                
                                // Expande os pais se necessário
                                let parent = node.closest('.app-tree__item')?.querySelector('.app-tree__children');
                                while (parent) {
                                    const parentItem = parent.closest('.app-tree__item');
                                    if (parentItem) {
                                        const parentNode = parentItem.querySelector('.app-tree__node');
                                        const toggle = parentNode?.querySelector('.app-tree__toggle');
                                        if (toggle) {
                                            toggle.classList.remove('app-tree__toggle--collapsed');
                                            toggle.classList.add('app-tree__toggle--expanded');
                                            parent.classList.add('app-tree__children--expanded');
                                            parent.style.display = 'block';
                                        }
                                    }
                                    parent = parent.parentElement?.closest('.app-tree__item')?.querySelector('.app-tree__children');
                                }
                                break;
                            }
                        }
                        
                        // Inicializa highlight.js se necessário
                        if (typeof hljs !== 'undefined') {
                            document.querySelectorAll('pre code').forEach((block) => {
                                hljs.highlightElement(block);
                                if (typeof hljs.lineNumbersBlock !== 'undefined') {
                                    hljs.lineNumbersBlock(block);
                                }
                            });
                        }
                    } else {
                        contentBody.innerHTML = '<div class="content-container"><h1>Error</h1><p>Content not found.</p></div>';
                    }
                } catch (error) {
                    console.error('Error loading content from file:', error);
                    contentBody.innerHTML = '<div class="content-container"><h1>Error</h1><p>Failed to load content.</p></div>';
                    if (contentHeader) contentHeader.textContent = 'Error';
                }
            }
            
            // Make loadContentFromFile available globally for search-page.js
            window.loadContentFromFile = loadContentFromFile;
            
            // Escuta mudanças no seletor de idioma para recarregar o welcome se necessário
            const languageSelector = document.getElementById('languageSelector');
            if (languageSelector) {
                languageSelector.addEventListener('change', function() {
                    // Waits for menu to be rebuilt and then checks
                    setTimeout(() => {
                        const selectedNode = document.querySelector('.app-tree__node--selected');
                        // If no item selected, reloads welcome with new language
                        if (!selectedNode) {
                            loadWelcomePage();
                        }
                    }, 500);
                });
            }
            
            // Checks after initial delay to ensure menu was built
            setTimeout(() => {
                checkAndLoadWelcome();
            }, 1000);
        }
        
        // Ensures script is executed after main.js
        // And also ensures mobile menu is initialized correctly
        function ensureMobileMenuWorks() {
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            const sidebar = document.getElementById('sidebar');
            const mobileOverlay = document.getElementById('mobileOverlay');
            
            if (!mobileMenuToggle || !sidebar || !mobileOverlay) {
                setTimeout(ensureMobileMenuWorks, 100);
                return;
            }
            
            // Remove all existing listeners by replacing the button
            const newToggle = mobileMenuToggle.cloneNode(true);
            mobileMenuToggle.parentNode.replaceChild(newToggle, mobileMenuToggle);
            const freshToggle = document.getElementById('mobileMenuToggle');
            
            // Simple toggle function
            function toggleMenu() {
                const isOpen = sidebar.classList.contains('mobile-open');
                if (isOpen) {
                    sidebar.classList.remove('mobile-open');
                    // Reset all inline styles when closing
                    sidebar.style.removeProperty('left');
                    sidebar.style.removeProperty('position');
                    sidebar.style.removeProperty('top');
                    sidebar.style.removeProperty('bottom');
                    sidebar.style.removeProperty('width');
                    sidebar.style.removeProperty('z-index');
                    sidebar.style.removeProperty('display');
                    sidebar.style.removeProperty('flex-direction');
                    sidebar.style.removeProperty('background-color');
                    sidebar.style.removeProperty('transition');
                    sidebar.style.removeProperty('visibility');
                    sidebar.style.removeProperty('opacity');
                    sidebar.style.removeProperty('transform');
                    mobileOverlay.classList.remove('active');
                    freshToggle.classList.remove('active');
                    // Header permanece fixo no mobile (definido no CSS), apenas limpa propriedades inline se necessário
                    const header = document.querySelector('.app-content__header');
                    const headerLeft = document.querySelector('.app-content__header-left');
                    // No mobile, header deve permanecer fixo, então não removemos position/top/left/right
                    // Apenas removemos z-index e background-color se foram definidos inline
                    if (header && window.innerWidth <= 768) {
                        // No mobile, mantém position fixed (definido no CSS)
                        header.style.removeProperty('z-index');
                        header.style.removeProperty('background-color');
                    } else if (header && window.innerWidth > 768) {
                        // No desktop, remove tudo
                        header.style.removeProperty('position');
                        header.style.removeProperty('top');
                        header.style.removeProperty('left');
                        header.style.removeProperty('right');
                        header.style.removeProperty('z-index');
                        header.style.removeProperty('background-color');
                    }
                    if (headerLeft) {
                        headerLeft.style.removeProperty('z-index');
                        headerLeft.style.removeProperty('position');
                    }
                    document.body.style.overflow = '';
                } else {
                    if (window.innerWidth <= 768) {
                        const header = document.querySelector('.app-content__header');
                        const headerLeft = document.querySelector('.app-content__header-left');

                        sidebar.classList.add('mobile-open');
                        // Force all styles with !important via inline styles
                        sidebar.style.setProperty('position', 'fixed', 'important');
                        sidebar.style.setProperty('left', '0', 'important');
                        sidebar.style.setProperty('top', '0', 'important');
                        sidebar.style.setProperty('bottom', '0', 'important');
                        sidebar.style.setProperty('width', '280px', 'important');
                        sidebar.style.setProperty('z-index', '1002', 'important');
                        sidebar.style.setProperty('display', 'flex', 'important');
                        sidebar.style.setProperty('flex-direction', 'column', 'important');
                        sidebar.style.setProperty('background-color', '#FFFFFF', 'important');
                        sidebar.style.setProperty('transition', 'none', 'important');
                        sidebar.style.setProperty('visibility', 'visible', 'important');
                        sidebar.style.setProperty('opacity', '1', 'important');
                        sidebar.style.setProperty('transform', 'none', 'important');
                        mobileOverlay.classList.add('active');
                        freshToggle.classList.add('active');

                        // Ensure content does NOT create a stacking context (so header participates in root)
                        const content = document.querySelector('.app-content');
                        if (content) {
                            content.style.setProperty('position', 'relative', 'important');
                            content.style.removeProperty('z-index');
                        }
                        // Ensure header is also above sidebar - use fixed positioning
                        if (header) {
                            header.style.setProperty('z-index', '1007', 'important');
                            header.style.setProperty('position', 'fixed', 'important');
                            header.style.setProperty('top', '0', 'important');
                            header.style.setProperty('left', '0', 'important');
                            header.style.setProperty('right', '0', 'important');
                            header.style.setProperty('background-color', '#FFFFFF', 'important');
                        }
                        if (headerLeft) {
                            headerLeft.style.setProperty('z-index', '1008', 'important');
                            headerLeft.style.setProperty('position', 'relative', 'important');
                        }
                        document.body.style.overflow = 'hidden';
                    }
                }
            }
            
            // Function to update button visibility based on screen size
            function updateButtonVisibility() {
                if (window.innerWidth <= 768) {
                    freshToggle.style.setProperty('pointer-events', 'auto', 'important');
                    freshToggle.style.setProperty('touch-action', 'manipulation', 'important');
                    freshToggle.style.setProperty('cursor', 'pointer', 'important');
                    freshToggle.style.setProperty('z-index', '1009', 'important');
                    freshToggle.style.setProperty('position', 'relative', 'important');
                    freshToggle.style.setProperty('display', 'flex', 'important');
                    freshToggle.style.setProperty('visibility', 'visible', 'important');
                    freshToggle.style.setProperty('opacity', '1', 'important');
                } else {
                    freshToggle.style.setProperty('display', 'none', 'important');
                    freshToggle.style.setProperty('visibility', 'hidden', 'important');
                    freshToggle.style.setProperty('opacity', '0', 'important');
                    freshToggle.style.setProperty('pointer-events', 'none', 'important');
                }
            }
            
            // Set initial styles
            updateButtonVisibility();
            
            // Update styles on window resize
            window.addEventListener('resize', updateButtonVisibility);
            
            // Add simple event handler - use only onclick to avoid duplicate events
            let isToggling = false;
            freshToggle.onclick = function(e) {
                if (isToggling) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                isToggling = true;
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
                setTimeout(() => {
                    isToggling = false;
                }, 300);
                return false;
            };
            
            // Overlay click handler - close menu when clicking on overlay background
            // Use capture phase to catch clicks before they reach other elements
            mobileOverlay.addEventListener('click', function(e) {
                // Only close if clicking directly on overlay, not on children
                if (e.target === mobileOverlay || e.target === this) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (sidebar.classList.contains('mobile-open')) {
                        toggleMenu();
                    }
                }
            }, true); // Use capture phase
            
            // Close menu when clicking on tree items (mobile) - use capture phase to run before tree.js
            const treeView = document.getElementById('treeView');
            if (treeView) {
                treeView.addEventListener('click', function(e) {
                    const node = e.target.closest('.app-tree__node');
                    // Check if it's a clickable node (has data-html attribute) and not a folder toggle
                    if (node && !e.target.closest('.app-tree__toggle')) {
                        const htmlFile = node.getAttribute('data-html');
                        const hasChildren = node.closest('.app-tree__item')?.querySelector('.app-tree__children');
                        // Only close if it's a file (has data-html) and not a folder
                        if (htmlFile && !hasChildren && window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                            // Close menu after a small delay to allow content to load
                            setTimeout(() => {
                                toggleMenu();
                            }, 300);
                        }
                    }
                }, true); // Use capture phase to run before tree.js handler
            }
            
            // Also listen for clicks on document when overlay is active
            document.addEventListener('click', function(e) {
                if (sidebar.classList.contains('mobile-open')) {
                    // If clicking outside sidebar and header, close menu
                    const clickedSidebar = e.target.closest('.app-sidebar');
                    const clickedHeader = e.target.closest('.app-content__header');
                    const clickedButton = e.target.closest('#mobileMenuToggle');
                    
                    if (!clickedSidebar && !clickedHeader && !clickedButton && mobileOverlay.classList.contains('active')) {
                        toggleMenu();
                    }
                }
            }, true); // Use capture phase
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                // Wait a bit to ensure main.js has already initialized
                setTimeout(() => {
                    initializeHomePage();
                    ensureMobileMenuWorks();
                }, 300);
            });
        } else {
            // DOM is already ready, but still wait a bit for main.js
            setTimeout(() => {
                initializeHomePage();
                ensureMobileMenuWorks();
            }, 300);
        }
