// Internationalization System (i18n)

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
let currentLanguage = localStorage.getItem('codeflow-language') || 'en';

// Update interface with selected language
function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('codeflow-language', lang);
    
    // Update selector
    document.getElementById('languageSelector').value = lang;
    
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

