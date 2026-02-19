// Menu Builder - Builds menu dynamically from menu.json

let menuData = null;
let menuDataPromise = null;

// Function to calculate relative path to menu.json
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
                return `file://${projectRoot}/resources/db/menu.json`;
            } else {
                // Fallback: calculates relative path
                if (pathname.includes('/content/')) {
                    const pathParts = pathname.split('/').filter(p => p);
                    const depth = pathParts.length - 1;
                    return '../'.repeat(depth) + 'resources/db/menu.json';
                } else {
                    return './resources/db/menu.json';
                }
            }
        } catch (e) {
            // Fallback
            if (currentPath.includes('/content/')) {
                const pathParts = currentPath.split('/').filter(p => p);
                const depth = pathParts.length - 1;
                return '../'.repeat(depth) + 'resources/db/menu.json';
            } else {
                return './resources/db/menu.json';
            }
        }
    } else {
        // For http/https
        if (currentPath.includes('/content/')) {
            const pathParts = currentPath.split('/').filter(p => p && p !== 'index.html' && !p.endsWith('.html'));
            // For content/br/welcome.html, pathParts would be ['content', 'br']
            // We need to go up 2 levels: ../../resources/db/menu.json
            const depth = pathParts.length;
            return '../'.repeat(depth) + 'resources/db/menu.json';
        } else {
            return './resources/db/menu.json';
        }
    }
}

// Function to load menu.json
async function loadMenuData(forceReload = false) {
    // If not forcing reload and data already exists, returns cache
    if (!forceReload && menuData) return menuData;
    if (!forceReload && menuDataPromise) return menuDataPromise;
    
    // Clears cache if forcing reload
    if (forceReload) {
        menuData = null;
        menuDataPromise = null;
    }
    
    menuDataPromise = (async () => {
        const menuJsonPath = getMenuJsonPath();
        // Adds timestamp to avoid browser cache
        const separator = menuJsonPath.includes('?') ? '&' : '?';
        const cacheBuster = `${separator}_t=${Date.now()}`;
        const menuJsonPathWithCache = menuJsonPath + cacheBuster;
        
        console.log('Menu: Loading menu.json from:', menuJsonPath);
        
        try {
            let response;
            if (menuJsonPath.startsWith('file://')) {
                // For file://, uses XMLHttpRequest (without cache buster, as it doesn't work with file://)
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
                // For http/https, uses fetch with cache buster
                response = await fetch(menuJsonPathWithCache, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                menuData = await response.json();
            }
            
            console.log('Menu: Menu loaded successfully');
            return menuData;
        } catch (error) {
            console.error('Menu: Error loading menu.json:', error);
            return null;
        }
    })();
    
    return menuDataPromise;
}

// Function to build a menu item recursively
function buildMenuItem(item, lang) {
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = item.type === 'folder' || hasChildren;
    // Gets translated label directly from menu.json (doesn't depend on i18n.js)
    const label = item.i18n && item.i18n[lang] ? item.i18n[lang] : item.path.split('/').pop();
    
    let html = '<li class="app-tree__item">';
    html += `<div class="app-tree__node${hasChildren ? ' app-tree__node--has-children' : ''}"`;
    html += ` data-path="${item.path}"`;
    if (item.html) {
        // Uses JSON path directly, content.js will do relative conversion
        html += ` data-html="${item.html}"`;
    }
    html += '>';
    
    if (hasChildren) {
        html += '<span class="app-tree__toggle app-tree__toggle--collapsed"></span>';
    }
    
    html += `<span class="app-tree__icon${isFolder ? '' : ' app-tree__icon--file'}">${item.icon || (isFolder ? '📁' : '📖')}</span>`;
    // Uses label directly from menu.json, without depending on i18n.js
    // data-i18n-key stores the label in Portuguese for reference, but is not used for translation
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

// Function to build the complete menu
async function buildMenu(forceReload = false) {
    const treeView = document.getElementById('treeView');
    if (!treeView) {
        console.error('Menu: Element #treeView not found');
        return;
    }
    
    const lang = localStorage.getItem('codeflow-language') || 'en';
    const menuData = await loadMenuData(forceReload);
    
    if (!menuData || !menuData.menu) {
        console.error('Menu: Menu data not available');
        return;
    }
    
    let menuHtml = '';
    menuData.menu.forEach(item => {
        menuHtml += buildMenuItem(item, lang);
    });
    
    treeView.innerHTML = menuHtml;
    
    // Waits a bit to ensure DOM was updated
    setTimeout(() => {
        // Dispatches custom event so tree.js can reattach listeners if needed
        const event = new CustomEvent('menuBuilt', { detail: { lang: lang } });
        document.dispatchEvent(event);
        
        // Menu already uses translations from menu.json directly, so doesn't need i18n.js
        // But updates other interface elements (like header) if i18n is available
        if (typeof updateLanguage !== 'undefined') {
            updateLanguage(lang);
        }
        
        console.log('Menu: Menu built successfully');
    }, 50);
}

// Function to rebuild menu when language changes
function rebuildMenuOnLanguageChange(newLang) {
    buildMenu(false); // false = doesn't force JSON reload, just rebuilds with new language
}

// Automatic initialization
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildMenu);
    } else {
        buildMenu();
    }
})();

// Exports functions for external use
if (typeof window !== 'undefined') {
    window.buildMenu = buildMenu;
    window.loadMenuData = loadMenuData;
}

