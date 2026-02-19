// Main application initialization

(function() {
    // Function to initialize when DOM is ready
    function init() {
        // Initialize mobile menu
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileOverlay');

        function openMobileMenu() {
            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.add('mobile-open');
                if (mobileOverlay) mobileOverlay.classList.add('active');
                if (mobileMenuToggle) mobileMenuToggle.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeMobileMenu() {
            if (sidebar) sidebar.classList.remove('mobile-open');
            if (mobileOverlay) mobileOverlay.classList.remove('active');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Mobile menu initialization is handled in index.html
        // This prevents conflicts with multiple initialization attempts
        // The menu toggle is initialized in ensureMobileMenuWorks() in index.html

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMobileMenu);
        }

        // Close menu when clicking a tree view item (mobile)
        const treeView = document.getElementById('treeView');
        if (treeView) {
            treeView.addEventListener('click', function(e) {
                const node = e.target.closest('.app-tree__node');
                if (node && window.innerWidth <= 768) {
                    // Small delay to allow content to be loaded
                    setTimeout(closeMobileMenu, 300);
                }
            });
        }

        // Close menu when resizing to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            } else {
                // Ensure scroll works when menu is closed
                if (sidebar && !sidebar.classList.contains('mobile-open')) {
                    document.body.style.overflow = '';
                }
            }
        });

        // Ensure scroll works when page loads
        if (window.innerWidth <= 768 && sidebar && !sidebar.classList.contains('mobile-open')) {
            document.body.style.overflow = '';
        }

        // Initialize language and selector
        const languageSelector = document.getElementById('languageSelector');
        
        // Set initial language
        updateLanguage(currentLanguage);
        
        // No need to load content in index.html - it redirects automatically
        // The code below only executes on pages that already have content (not in index.html)
        const currentPath = window.location.pathname;
        const currentFileName = currentPath.split('/').pop();
        
        // Listener for language change (should work on all pages, including index.html)
        if (languageSelector) {
            languageSelector.addEventListener('change', function(e) {
            const newLang = e.target.value;
            const oldLang = currentLanguage;
            
            // Updates language first (this updates currentLanguage)
            updateLanguage(newLang);
            
            // Rebuilds menu with new language (menu.js uses translations from menu.json)
            if (typeof buildMenu !== 'undefined') {
                buildMenu(false); // false = does not force JSON reload, just rebuilds with new language
            }
            
            // If we are on index.html, just updates menu and returns (does not navigate)
            if (currentFileName === 'index.html') {
                return;
            }
            
            // Detects current page by URL
            const currentPath = window.location.pathname;
            const currentFileName = currentPath.split('/').pop();
            
            // If we are on an HTML content page (not index.html)
            if (currentFileName && currentFileName !== 'index.html' && currentPath.includes('content/')) {
                // Swaps language in current path - replaces any 2-letter language code with new language
                // Generic pattern: detects any 2-letter lowercase language code (br, en, es, fr, pt-BR, etc.)
                // Also supports codes with region (pt-BR, en-US, es-ES) but only takes the first part
                let newPath = currentPath.replace(/\/([a-z]{2})(-[A-Z]{2})?\//, `/${newLang}/`);
                
                // If pattern not found (page without language in path), adds language
                if (newPath === currentPath) {
                    const pathParts = currentPath.split('/');
                    const fileName = pathParts[pathParts.length - 1];
                    const dirs = pathParts.slice(0, -1);
                    newPath = dirs.join('/') + '/' + newLang + '/' + fileName;
                }
                
                // Prepares path for verification (must be absolute, starting with /)
                let pathToCheck = newPath;
                // Ensures it starts with / to be an absolute path
                if (!pathToCheck.startsWith('/')) {
                    pathToCheck = '/' + pathToCheck;
                }
                
                // Checks if page exists before navigating
                // checkPageExists function should be available from content.js
                if (typeof checkPageExists === 'undefined') {
                    console.warn('checkPageExists is not available, navigating without verification');
                    // Navigates with relative path
                    let relativePath = newPath;
                    if (relativePath.startsWith('/')) {
                        relativePath = relativePath.substring(1);
                    }
                    if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
                        relativePath = './' + relativePath;
                    }
                    window.location.href = relativePath;
                    return;
                }
                
                checkPageExists(pathToCheck).then(pageExists => {
                    if (!pageExists) {
                        // Page does not exist in selected language, redirects to warning page
                        // Calculates relative path to warning page
                        let currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
                        // Removes initial slash if exists
                        if (currentDir.startsWith('/')) {
                            currentDir = currentDir.substring(1);
                        }
                        const currentDirParts = currentDir ? currentDir.split('/').filter(p => p) : [];
                        
                        // The target path is content/{language}/not-translated.html
                        const targetDir = `content/${newLang}`;
                        const targetDirParts = targetDir.split('/').filter(p => p);
                        
                        // Finds common point between paths
                        let commonDepth = 0;
                        for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                            if (currentDirParts[i] === targetDirParts[i]) {
                                commonDepth++;
                            } else {
                                break;
                            }
                        }
                        
                        // Calculates how many levels to go back
                        const levelsToGoUp = currentDirParts.length - commonDepth;
                        
                        // Builds relative path
                        let relativeNotTranslatedPath;
                        if (levelsToGoUp > 0) {
                            // Needs to go back some levels to common directory
                            const remainingPath = targetDirParts.slice(commonDepth).join('/');
                            const fileName = 'not-translated.html';
                            if (remainingPath) {
                                relativeNotTranslatedPath = '../'.repeat(levelsToGoUp) + remainingPath + '/' + fileName;
                            } else {
                                relativeNotTranslatedPath = '../'.repeat(levelsToGoUp) + fileName;
                            }
                        } else {
                            // We are at same level or closer
                            const remainingPath = targetDirParts.slice(commonDepth).join('/');
                            const fileName = 'not-translated.html';
                            if (remainingPath) {
                                relativeNotTranslatedPath = remainingPath + '/' + fileName;
                            } else {
                                relativeNotTranslatedPath = fileName;
                            }
                            // Adds ./ if necessary
                            if (!relativeNotTranslatedPath.startsWith('./') && !relativeNotTranslatedPath.startsWith('../')) {
                                relativeNotTranslatedPath = './' + relativeNotTranslatedPath;
                            }
                        }
                        
                        console.log('Page does not exist in language', newLang, '- redirecting to', relativeNotTranslatedPath);
                        window.location.href = relativeNotTranslatedPath;
                    } else {
                        // Page exists, navigates normally
                        // Ensures path is relative (without initial slash)
                        let relativePath = newPath;
                        if (relativePath.startsWith('/')) {
                            relativePath = relativePath.substring(1);
                        }
                        // If it does not start with ./ or ../, adds ./
                        if (!relativePath.startsWith('./') && !relativePath.startsWith('../')) {
                            relativePath = './' + relativePath;
                        }
                        console.log('Changing language from', oldLang, 'to', newLang);
                        console.log('Navigating from', currentPath, 'to', relativePath);
                        window.location.href = relativePath;
                    }
                }).catch(error => {
                    // In case of error in verification, tries to navigate normally
                    console.warn('Error verifying page existence:', error);
                    console.log('Navigating from', currentPath, 'to', newPath);
                    window.location.href = newPath;
                });
                return;
            }
            
            // Reload current content if available (for when we are on index.html)
            const selectedNode = document.querySelector('.app-tree__node--selected');
            if (selectedNode && selectedNode.getAttribute('data-html')) {
                const path = selectedNode.getAttribute('data-path');
                const labelElement = selectedNode.querySelector('.app-tree__label');
                // The label is already translated by menu.json, so uses directly
                const label = labelElement.textContent;
                const htmlFile = selectedNode.getAttribute('data-html');
                const file = selectedNode.getAttribute('data-file');
                const lines = selectedNode.getAttribute('data-lines');
                
                // Reload content immediately - currentLanguage already updated by updateLanguage
                console.log('Reloading content with language:', currentLanguage, 'for path:', path);
                updateContent(path, label, htmlFile, file, lines);
            } else {
                // If no selection, reloads home page
                const homePath = 'content/java.md/1nqriq7eql.html';
                const translations = i18n[currentLanguage];
                const welcomeLabel = translations.welcome || 'Welcome';
                const contentHeader = document.getElementById('contentHeader');
                if (contentHeader) {
                    contentHeader.textContent = welcomeLabel;
                }
                updateContent('Home', welcomeLabel, homePath, null, null);
            }
        });
        }
    }
    
    // Executes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM is already ready
        init();
    }
})();

