// Sistema de Busca de Conteúdo

// Cache de índices de busca
let searchIndex = null;
let searchIndexPromise = null;

// Função para normalizar texto para busca
function normalizeSearchText(text) {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .trim();
}

// Função para extrair texto de um elemento HTML
function extractTextFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// Função para obter snippet de texto ao redor da palavra-chave
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

// Função para indexar uma página HTML
async function indexPage(url, lang) {
    try {
        console.log('Search: Indexando página:', url);
        
        // Para file:// protocol, usa XMLHttpRequest em vez de fetch
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
                            console.error('Search: Erro ao carregar', url, 'Status:', xhr.status);
                            reject(new Error(`HTTP ${xhr.status}`));
                        }
                    }
                };
                xhr.onerror = function() {
                    console.error('Search: Erro de rede ao carregar', url);
                    reject(new Error('Network error'));
                };
                xhr.send();
            });
        } else {
            const response = await fetch(url);
            if (!response.ok) {
                console.error('Search: Erro HTTP ao carregar', url, 'Status:', response.status);
                return null;
            }
            html = await response.text();
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extrai o título da página
        const titleElement = doc.querySelector('h1');
        const title = titleElement ? titleElement.textContent.trim() : doc.title;
        
        // Extrai o conteúdo principal
        const contentContainer = doc.querySelector('.content-container');
        if (!contentContainer) return null;
        
        // Remove scripts e estilos
        const clone = contentContainer.cloneNode(true);
        clone.querySelectorAll('script, style').forEach(el => el.remove());
        
        // Extrai todo o texto
        const text = clone.textContent || clone.innerText || '';
        
        // Extrai descrição (primeiro parágrafo ou info-box)
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
            path: menuPath
        };
    } catch (error) {
        console.error('Erro ao indexar página:', url, error);
        return null;
    }
}

// Função para construir índice de busca
async function buildSearchIndex() {
    if (searchIndex) return searchIndex;
    if (searchIndexPromise) return searchIndexPromise;
    
    searchIndexPromise = (async () => {
        const index = [];
        const currentLang = localStorage.getItem('codeflow-language') || 'br';
        
        // Lista de páginas conhecidas (pode ser expandida)
        const pages = [
            // Páginas principais
            { path: 'content/java.md/br/1nqriq7eql.html', lang: 'br' },
            { path: 'content/java.md/en/1nqriq7eql.html', lang: 'en' },
            { path: 'content/java.md/br/ee3l86y9j0cd.html', lang: 'br' },
            { path: 'content/java.md/en/ee3l86y9j0cd.html', lang: 'en' },
            { path: 'content/java.md/br/1xrfm11lm1.html', lang: 'br' },
            { path: 'content/java.md/en/1xrfm11lm1.html', lang: 'en' },
            { path: 'content/java.md/br/1o4a4w7aov.html', lang: 'br' },
            { path: 'content/java.md/en/1o4a4w7aov.html', lang: 'en' },
            { path: 'content/java.md/br/u8n8srtc79q8.html', lang: 'br' },
            { path: 'content/java.md/en/u8n8srtc79q8.html', lang: 'en' },
            // Páginas de resumo - Recursos Avançados
            { path: 'content/java.md/br/npowyzyv1zxzy68985b9.html', lang: 'br' },
            { path: 'content/java.md/en/npowyzyv1zxzy68985b9.html', lang: 'en' },
            // Páginas de conteúdo
            { path: 'content/java.md/hi870208/br/363ba4sngb4e.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/363ba4sngb4e.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/xb9pezoakznr.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/xb9pezoakznr.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/ev6nbs1cxqd6.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/ev6nbs1cxqd6.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/3qvvuyx7rfph.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/3qvvuyx7rfph.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/kfwhqp409kpx.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/kfwhqp409kpx.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/kfwi2r409ls1.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/kfwi2r409ls1.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/kfwhvv409l69.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/kfwhvv409l69.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/3z28jy2onq8u.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/3z28jy2onq8u.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/lfr7klwpxix9.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/lfr7klwpxix9.html', lang: 'en' },
            { path: 'content/java.md/hi870208/br/uou6eno1v99v.html', lang: 'br' },
            { path: 'content/java.md/hi870208/en/uou6eno1v99v.html', lang: 'en' },
            // Páginas de conteúdo - Recursos Avançados
            { path: 'content/java.md/re120788/br/nvppty1uxxx5zz38b477.html', lang: 'br' },
            { path: 'content/java.md/re120788/en/nvppty1uxxx5zz38b477.html', lang: 'en' },
            // Páginas principais - Golang
            { path: 'content/golang.md/br/1nqriq7eql.html', lang: 'br' },
            { path: 'content/golang.md/en/1nqriq7eql.html', lang: 'en' },
            { path: 'content/golang.md/br/kigsa21few3.html', lang: 'br' },
            { path: 'content/golang.md/en/kigsa21few3.html', lang: 'en' },
            // Páginas de resumo - História e Filosofia do Go
            { path: 'content/golang.md/hi111630/br/igmd7ry7yy2z.html', lang: 'br' },
            { path: 'content/golang.md/hi111630/en/igmd7ry7yy2z.html', lang: 'en' },
            // Páginas de conteúdo - História e Filosofia do Go
            { path: 'content/golang.md/hi111630/br/yd7hc8hvimk7.html', lang: 'br' },
            { path: 'content/golang.md/hi111630/en/yd7hc8hvimk7.html', lang: 'en' },
        ];
        
        // Indexa apenas páginas do idioma atual
        const pagesToIndex = pages.filter(p => p.lang === currentLang);
        
        // Calcula caminho base
        const currentHref = window.location.href;
        const currentPath = window.location.pathname;
        let basePath = '';
        
        console.log('Search: currentHref:', currentHref);
        console.log('Search: currentPath:', currentPath);
        
        if (currentHref.startsWith('file://')) {
            // Para file://, constrói caminho absoluto
            try {
                const url = new URL(currentHref);
                const pathname = url.pathname;
                
                // Encontra onde está 'codeflow.github.io' no caminho
                const projectIndex = pathname.indexOf('/codeflow.github.io/');
                
                if (projectIndex !== -1) {
                    // Constrói caminho absoluto até a raiz do projeto
                    const projectRoot = pathname.substring(0, projectIndex + '/codeflow.github.io'.length);
                    basePath = `file://${projectRoot}/`;
                } else {
                    // Fallback: calcula caminho relativo
                    if (currentPath.includes('/content/')) {
                        const pathParts = currentPath.split('/').filter(p => p);
                        const depth = pathParts.length - 1;
                        basePath = '../'.repeat(depth);
                    } else {
                        basePath = './';
                    }
                }
            } catch (e) {
                console.error('Search: Erro ao calcular basePath file://', e);
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
        
        // Indexa todas as páginas
        const indexPromises = pagesToIndex.map(page => {
            const fullPath = basePath + page.path;
            console.log('Search: Indexando:', fullPath);
            return indexPage(fullPath, page.lang);
        });
        
        const results = await Promise.all(indexPromises);
        const indexed = results.filter(r => r !== null);
        
        searchIndex = indexed;
        return indexed;
    })();
    
    return searchIndexPromise;
}

// Função de busca
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
        
        // Busca por palavras
        queryWords.forEach(word => {
            // Título tem peso maior
            if (normalizedTitle.includes(word)) {
                score += 10;
                matches.push('title');
            }
            
            // Descrição tem peso médio
            if (normalizedDescription.includes(word)) {
                score += 5;
                matches.push('description');
            }
            
            // Conteúdo tem peso menor
            const contentMatches = (normalizedText.match(new RegExp(word, 'g')) || []).length;
            score += contentMatches;
            if (contentMatches > 0) {
                matches.push('content');
            }
        });
        
        // Busca exata tem peso extra
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
    
    // Ordena por score (maior primeiro)
    results.sort((a, b) => b.score - a.score);
    
    return results;
}

// Função para executar busca e redirecionar para página de resultados
function performSearch(query) {
    console.log('Search: performSearch chamado com query:', query);
    
    if (!query || query.trim().length === 0) {
        alert('Por favor, digite um termo de busca.');
        return;
    }
    
    // Salva a query na URL
    const currentLang = localStorage.getItem('codeflow-language') || 'br';
    
    // Calcula caminho relativo
    const currentHref = window.location.href;
    const currentPath = window.location.pathname;
    let relativePath = '';
    
    console.log('Search: currentPath:', currentPath);
    console.log('Search: currentHref:', currentHref);
    
    // Detecta se estamos usando file:// protocol
    if (currentHref.startsWith('file://')) {
        // Para file://, usa uma abordagem mais simples: constrói caminho absoluto
        try {
            const url = new URL(currentHref);
            const pathname = url.pathname;
            
            // Remove o nome do arquivo atual
            const lastSlashIndex = pathname.lastIndexOf('/');
            const directoryPath = pathname.substring(0, lastSlashIndex + 1);
            
            // Encontra onde está 'codeflow.github.io' no caminho
            const projectIndex = pathname.indexOf('/codeflow.github.io/');
            
            if (projectIndex !== -1) {
                // Constrói caminho absoluto até a raiz do projeto
                const projectRoot = pathname.substring(0, projectIndex + '/codeflow.github.io'.length);
                relativePath = `file://${projectRoot}/search.html`;
            } else {
                // Fallback: calcula caminho relativo baseado na estrutura
                if (pathname.includes('/content/')) {
                    // Conta quantos níveis subir
                    const pathParts = directoryPath.split('/').filter(p => p);
                    const contentIndex = pathParts.indexOf('content');
                    
                    if (contentIndex !== -1) {
                        // Do arquivo até content, depois até a raiz
                        const depth = pathParts.length - contentIndex;
                        relativePath = '../'.repeat(depth) + 'search.html';
                    } else {
                        // Conta todos os diretórios
                        const depth = pathParts.length;
                        relativePath = '../'.repeat(depth) + 'search.html';
                    }
                } else {
                    relativePath = './search.html';
                }
            }
        } catch (e) {
            console.error('Search: Erro ao calcular caminho file://', e);
            // Fallback simples
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
    console.log('Search: Redirecionando para:', finalUrl);
    
    window.location.href = finalUrl;
}

// Inicialização do sistema de busca
(function() {
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (!searchInput || !searchButton) {
            console.warn('Search: Elementos de busca não encontrados');
            return;
        }
        
        console.log('Search: Inicializando sistema de busca');
        
        // Busca ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                console.log('Search: Enter pressionado, query:', query);
                if (query) {
                    performSearch(query);
                } else {
                    alert('Por favor, digite um termo de busca.');
                }
            }
        });
        
        // Busca ao clicar no botão
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            console.log('Search: Botão clicado, query:', query);
            if (query) {
                performSearch(query);
            } else {
                alert('Por favor, digite um termo de busca.');
            }
        });
        
        // Função para atualizar placeholder baseado no idioma
        function updateSearchPlaceholder() {
            const currentLang = localStorage.getItem('codeflow-language') || 'br';
            if (currentLang === 'en') {
                searchInput.placeholder = '🔍 Search content...';
                searchButton.title = 'Search';
            } else {
                searchInput.placeholder = '🔍 Buscar conteúdo...';
                searchButton.title = 'Buscar';
            }
        }
        
        // Atualiza placeholder inicial
        updateSearchPlaceholder();
        
        // Observa mudanças no idioma
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.addEventListener('change', updateSearchPlaceholder);
        }
        
        // Observa mudanças no localStorage (para quando o idioma muda em outra parte)
        window.addEventListener('storage', function(e) {
            if (e.key === 'codeflow-language') {
                updateSearchPlaceholder();
            }
        });
    }
    
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        // DOM já está pronto, inicializa imediatamente
        initSearch();
    }
    
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (!searchInput || !searchButton) {
            console.warn('Search: Elementos de busca não encontrados');
            return;
        }
        
        console.log('Search: Inicializando sistema de busca');
        
        // Busca ao pressionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                console.log('Search: Enter pressionado, query:', query);
                if (query) {
                    performSearch(query);
                } else {
                    alert('Por favor, digite um termo de busca.');
                }
            }
        });
        
        // Busca ao clicar no botão
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            console.log('Search: Botão clicado, query:', query);
            if (query) {
                performSearch(query);
            } else {
                alert('Por favor, digite um termo de busca.');
            }
        });
        
        // Função para atualizar placeholder baseado no idioma
        function updateSearchPlaceholder() {
            const currentLang = localStorage.getItem('codeflow-language') || 'br';
            if (currentLang === 'en') {
                searchInput.placeholder = '🔍 Search content...';
                searchButton.title = 'Search';
            } else {
                searchInput.placeholder = '🔍 Buscar conteúdo...';
                searchButton.title = 'Buscar';
            }
        }
        
        // Atualiza placeholder inicial
        updateSearchPlaceholder();
        
        // Observa mudanças no idioma
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.addEventListener('change', updateSearchPlaceholder);
        }
        
        // Observa mudanças no localStorage (para quando o idioma muda em outra parte)
        window.addEventListener('storage', function(e) {
            if (e.key === 'codeflow-language') {
                updateSearchPlaceholder();
            }
        });
    }
})();

// Exporta funções para uso na página de resultados
if (typeof window !== 'undefined') {
    window.searchContent = searchContent;
    window.buildSearchIndex = buildSearchIndex;
    window.normalizeSearchText = normalizeSearchText;
    window.getSnippet = getSnippet;
}

