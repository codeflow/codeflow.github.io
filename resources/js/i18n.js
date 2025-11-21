// Sistema de Internacionalização (i18n)

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

// Detectar idioma do navegador
function detectBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith('en')) {
        return 'en';
    }
    return 'br'; // Padrão português
}

// Gerenciar idioma atual
let currentLanguage = localStorage.getItem('codeflow-language') || detectBrowserLanguage();

// Atualizar interface com o idioma selecionado
function updateLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('codeflow-language', lang);
    
    // Atualizar seletor
    document.getElementById('languageSelector').value = lang;
    
    // Atualizar textos da interface
    const translations = i18n[lang];
    if (translations) {
        const contentHeader = document.getElementById('contentHeader');
        // Atualizar header se for mensagem de boas-vindas
        if (contentHeader) {
            const headerText = contentHeader.textContent.trim();
            if (headerText === i18n.br.welcome || headerText === i18n.en.welcome) {
                contentHeader.textContent = translations.welcome;
            } else {
                // Se for um label de conteúdo, tenta traduzir
                const headerKey = Object.keys(i18n.br).find(k => i18n.br[k] === headerText);
                if (headerKey && translations[headerKey]) {
                    contentHeader.textContent = translations[headerKey];
                }
            }
        }
        
        // O menu agora é gerenciado pelo menu.js usando traduções do menu.json
        // Não precisa mais traduzir os labels do menu aqui
    }
}

