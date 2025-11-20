// Sistema de Internacionalização (i18n)

const i18n = {
    br: {
        welcome: 'Bem-vindo',
        welcomeMessage: 'Bem-vindo ao RichFaces BlueSky',
        selectItem: 'Selecione um item no menu lateral para visualizar seu conteúdo aqui.',
        navigation: 'CODEFLOW',
        java: 'Java',
        'História do Java': 'História do Java',
        'Concepção (Sun, James Gosling)': 'Concepção (Sun, James Gosling)',
        'JDK 1.0': 'JDK 1.0',
        'Lançamento do JDK 1.0': 'Lançamento do JDK 1.0',
        'Compilador JDK 1.0': 'Compilador JDK 1.0',
        'Plataforma': 'Plataforma',
        'Era J2SE, J2EE, J2ME': 'Era J2SE, J2EE, J2ME',
        'Arquitetura J2SE': 'Arquitetura J2SE',
        'Arquitetura J2EE': 'Arquitetura J2EE',
        'Transição para Oracle': 'Transição para Oracle',
        'OpenJDK e comunidade': 'OpenJDK e comunidade',
        'Evolução (Java 8, 11, 17, 21, 22+)': 'Evolução (Java 8, 11, 17, 21, 22+)'
    },
    en: {
        welcome: 'Welcome',
        welcomeMessage: 'Welcome to RichFaces BlueSky',
        selectItem: 'Select an item in the side menu to view its content here.',
        navigation: 'CODEFLOW',
        java: 'Java',
        'História do Java': 'Java History',
        'Concepção (Sun, James Gosling)': 'Conception (Sun, James Gosling)',
        'JDK 1.0': 'JDK 1.0',
        'Lançamento do JDK 1.0': 'JDK 1.0 Launch',
        'Compilador JDK 1.0': 'JDK 1.0 Compiler',
        'Plataforma': 'Platform',
        'Era J2SE, J2EE, J2ME': 'J2SE, J2EE, J2ME Era',
        'Arquitetura J2SE': 'J2SE Architecture',
        'Arquitetura J2EE': 'J2EE Architecture',
        'Transição para Oracle': 'Transition to Oracle',
        'OpenJDK e comunidade': 'OpenJDK and Community',
        'Evolução (Java 8, 11, 17, 21, 22+)': 'Evolution (Java 8, 11, 17, 21, 22+)'
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
        
        // Atualizar labels do menu usando data-i18n-key
        document.querySelectorAll('.app-tree__label').forEach(label => {
            // Sempre usa data-i18n-key se existir
            const i18nKey = label.getAttribute('data-i18n-key');
            
            if (i18nKey) {
                // Se tem a chave, traduz
                if (translations[i18nKey]) {
                    label.textContent = translations[i18nKey];
                }
            } else {
                // Se não tem data-i18n-key, tenta encontrar a chave original
                const currentText = label.textContent.trim();
                
                // Procura no objeto br (português original)
                let originalKey = Object.keys(i18n.br).find(k => i18n.br[k] === currentText);
                
                // Se não encontrou, procura no objeto en (inglês)
                if (!originalKey) {
                    originalKey = Object.keys(i18n.en).find(k => i18n.en[k] === currentText);
                }
                
                if (originalKey && translations[originalKey]) {
                    label.textContent = translations[originalKey];
                    // Salva a chave para próximas traduções
                    label.setAttribute('data-i18n-key', originalKey);
                } else {
                    // Se não encontrou tradução, salva o texto atual como chave
                    label.setAttribute('data-i18n-key', currentText);
                }
            }
        });
    }
}

