// Menu Builder - Constrói o menu dinamicamente a partir de menu.json

let menuData = null;
let menuDataPromise = null;

// Função para calcular caminho relativo para o menu.json
function getMenuJsonPath() {
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    
    if (currentHref.startsWith('file://')) {
        try {
            const url = new URL(currentHref);
            const pathname = url.pathname;
            const projectIndex = pathname.indexOf('/codeflow.github.io/');
            
            if (projectIndex !== -1) {
                const projectRoot = pathname.substring(0, projectIndex + '/codeflow.github.io'.length);
                return `file://${projectRoot}/templates/menu.json`;
            } else {
                // Fallback: calcula caminho relativo
                if (pathname.includes('/content/')) {
                    const pathParts = pathname.split('/').filter(p => p);
                    const depth = pathParts.length - 1;
                    return '../'.repeat(depth) + 'templates/menu.json';
                } else {
                    return './templates/menu.json';
                }
            }
        } catch (e) {
            // Fallback
            if (currentPath.includes('/content/')) {
                const pathParts = currentPath.split('/').filter(p => p);
                const depth = pathParts.length - 1;
                return '../'.repeat(depth) + 'templates/menu.json';
            } else {
                return './templates/menu.json';
            }
        }
    } else {
        // Para http/https
        if (currentPath.includes('/content/')) {
            const pathParts = currentPath.split('/').filter(p => p && p !== 'index.html' && !p.endsWith('.html'));
            // Para content/br/welcome.html, pathParts seria ['content', 'br']
            // Precisamos subir 2 níveis: ../../templates/menu.json
            const depth = pathParts.length;
            return '../'.repeat(depth) + 'templates/menu.json';
        } else {
            return './templates/menu.json';
        }
    }
}

// Função para carregar o menu.json
async function loadMenuData(forceReload = false) {
    // Se não forçar recarregamento e já tiver dados, retorna cache
    if (!forceReload && menuData) return menuData;
    if (!forceReload && menuDataPromise) return menuDataPromise;
    
    // Limpa cache se forçar recarregamento
    if (forceReload) {
        menuData = null;
        menuDataPromise = null;
    }
    
    menuDataPromise = (async () => {
        const menuJsonPath = getMenuJsonPath();
        // Adiciona timestamp para evitar cache do navegador
        const separator = menuJsonPath.includes('?') ? '&' : '?';
        const cacheBuster = `${separator}_t=${Date.now()}`;
        const menuJsonPathWithCache = menuJsonPath + cacheBuster;
        
        console.log('Menu: Carregando menu.json de:', menuJsonPath);
        
        try {
            let response;
            if (menuJsonPath.startsWith('file://')) {
                // Para file://, usa XMLHttpRequest (sem cache buster, pois não funciona com file://)
                const data = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', menuJsonPath, true);
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 0 || xhr.status === 200) {
                                resolve(xhr.responseText);
                            } else {
                                reject(new Error(`HTTP ${xhr.status}`));
                            }
                        }
                    };
                    xhr.onerror = function() {
                        reject(new Error('Network error'));
                    };
                    xhr.send();
                });
                menuData = JSON.parse(data);
            } else {
                // Para http/https, usa fetch com cache buster
                response = await fetch(menuJsonPathWithCache, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                menuData = await response.json();
            }
            
            console.log('Menu: Menu carregado com sucesso');
            return menuData;
        } catch (error) {
            console.error('Menu: Erro ao carregar menu.json:', error);
            return null;
        }
    })();
    
    return menuDataPromise;
}

// Função para construir um item do menu recursivamente
function buildMenuItem(item, lang) {
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = item.type === 'folder' || hasChildren;
    // Obtém o label traduzido diretamente do menu.json (não depende do i18n.js)
    const label = item.i18n && item.i18n[lang] ? item.i18n[lang] : item.path.split('/').pop();
    
    let html = '<li class="app-tree__item">';
    html += `<div class="app-tree__node${hasChildren ? ' app-tree__node--has-children' : ''}"`;
    html += ` data-path="${item.path}"`;
    if (item.html) {
        // Usa o caminho do JSON diretamente, o content.js fará a conversão relativa
        html += ` data-html="${item.html}"`;
    }
    html += '>';
    
    if (hasChildren) {
        html += '<span class="app-tree__toggle app-tree__toggle--collapsed"></span>';
    }
    
    html += `<span class="app-tree__icon${isFolder ? '' : ' app-tree__icon--file'}">${item.icon || (isFolder ? '📁' : '📖')}</span>`;
    // Usa o label diretamente do menu.json, sem depender do i18n.js
    // O data-i18n-key armazena o label em português para referência, mas não é usado para tradução
    const brLabel = item.i18n && item.i18n['br'] ? item.i18n['br'] : item.path.split('/').pop();
    html += `<span class="app-tree__label" data-i18n-key="${brLabel}">${label}</span>`;
    html += '</div>';
    
    if (hasChildren) {
        html += '<ul class="app-tree__children">';
        item.children.forEach(child => {
            html += buildMenuItem(child, lang);
        });
        html += '</ul>';
    }
    
    html += '</li>';
    return html;
}

// Função para construir o menu completo
async function buildMenu(forceReload = false) {
    const treeView = document.getElementById('treeView');
    if (!treeView) {
        console.error('Menu: Elemento #treeView não encontrado');
        return;
    }
    
    const lang = localStorage.getItem('codeflow-language') || 'br';
    const menuData = await loadMenuData(forceReload);
    
    if (!menuData || !menuData.menu) {
        console.error('Menu: Dados do menu não disponíveis');
        return;
    }
    
    let menuHtml = '';
    menuData.menu.forEach(item => {
        menuHtml += buildMenuItem(item, lang);
    });
    
    treeView.innerHTML = menuHtml;
    
    // Aguarda um pouco para garantir que o DOM foi atualizado
    setTimeout(() => {
        // Dispara evento customizado para que tree.js possa reanexar listeners se necessário
        const event = new CustomEvent('menuBuilt', { detail: { lang: lang } });
        document.dispatchEvent(event);
        
        // O menu já usa as traduções do menu.json diretamente, então não precisa do i18n.js
        // Mas atualiza outros elementos da interface (como header) se o i18n estiver disponível
        if (typeof updateLanguage !== 'undefined') {
            updateLanguage(lang);
        }
        
        console.log('Menu: Menu construído com sucesso');
    }, 50);
}

// Função para reconstruir o menu quando o idioma muda
function rebuildMenuOnLanguageChange(newLang) {
    buildMenu(false); // false = não força recarregamento do JSON, apenas reconstrói com novo idioma
}

// Inicialização automática
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildMenu);
    } else {
        buildMenu();
    }
})();

// Exporta funções para uso externo
if (typeof window !== 'undefined') {
    window.buildMenu = buildMenu;
    window.loadMenuData = loadMenuData;
}

