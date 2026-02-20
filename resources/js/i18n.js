// Internationalization System (i18n)

// CRITICAL: Force English as default BEFORE any other code runs
// This script runs IMMEDIATELY when loaded, before any other scripts
// Force localStorage to 'en' and set the select value
(function() {
    // Force localStorage to English
    localStorage.setItem('codeflow-language', 'en');
    
    // Force the select element to English immediately when DOM is ready
    function forceEnglish() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = 'en';
            // Force all options
            const options = selector.querySelectorAll('option');
            options.forEach(function(opt) {
                opt.removeAttribute('selected');
                if (opt.value === 'en') {
                    opt.setAttribute('selected', 'selected');
                    opt.selected = true;
                }
            });
        }
    }
    
    // Try immediately
    forceEnglish();
    
    // Try when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceEnglish);
    } else {
        forceEnglish();
    }
    
    // Try multiple times to ensure it sticks
    setTimeout(forceEnglish, 0);
    setTimeout(forceEnglish, 10);
    setTimeout(forceEnglish, 50);
    setTimeout(forceEnglish, 100);
})();

const i18n = {
    br: {
        welcome: 'Bem-vindo',
        welcomeMessage: 'Bem-vindo ao RichFaces BlueSky',
        selectItem: 'Selecione um item no menu lateral para visualizar seu conteúdo aqui.',
        navigation: 'CODEFLOW'
    },
    en: {
        welcome: 'Welcome',
        welcomeMessage: 'Welcome to RichFaces BlueSky',
        selectItem: 'Select an item in the side menu to view its content here.',
        navigation: 'CODEFLOW'
    }
};

// Detect browser language
function detectBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith('en')) {
        return 'en';
    }
    return 'en'; // Default English
}

// Manage current language
// ALWAYS start with 'en' (English) on page load - ignore localStorage on initial load
// This ensures English is always the default, regardless of what was saved before
let currentLanguage = 'en';

// Force English as default on every page load
// The user can change it if they want, and it will be saved for future sessions
// But on initial load, we always start with English
localStorage.setItem('codeflow-language', 'en');

// Update interface with selected language
function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('codeflow-language', lang);
    
    // Update selector - ensure it's set correctly
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector) {
        languageSelector.value = lang;
        // Ensure the selected attribute is set correctly
        const options = languageSelector.querySelectorAll('option');
        options.forEach(option => {
            option.removeAttribute('selected');
            if (option.value === lang) {
                option.setAttribute('selected', 'selected');
            }
        });
    }
    
    // Update interface texts
    const translations = i18n[lang];
    if (translations) {
        const contentHeader = document.getElementById('contentHeader');
        // Update header if it's a welcome message
        if (contentHeader) {
            const headerText = contentHeader.textContent.trim();
            if (headerText === i18n.br.welcome || headerText === i18n.en.welcome) {
                contentHeader.textContent = translations.welcome;
            } else {
                // If it's a content label, tries to translate
                const headerKey = Object.keys(i18n.br).find(k => i18n.br[k] === headerText);
                if (headerKey && translations[headerKey]) {
                    contentHeader.textContent = translations[headerKey];
                }
            }
        }
        
        // Menu is now managed by menu.js using translations from menu.json
        // No longer needs to translate menu labels here
    }
}

