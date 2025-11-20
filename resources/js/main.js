// Inicialização principal da aplicação

(function() {
    // Inicializar idioma e seletor
    const languageSelector = document.getElementById('languageSelector');
    
    // Definir idioma inicial
    updateLanguage(currentLanguage);
    
    // Carregar página inicial se não houver seleção
    const selectedNode = document.querySelector('.app-tree__node--selected');
    if (!selectedNode) {
        // Carrega a página inicial (home/index)
        const homePath = 'conteudos/java.md/1nqriq7eql.html';
        const translations = i18n[currentLanguage];
        const welcomeLabel = translations.welcome || 'Bem-vindo';
        const contentHeader = document.getElementById('contentHeader');
        if (contentHeader) {
            contentHeader.textContent = welcomeLabel;
        }
        updateContent('Home', welcomeLabel, homePath, null, null);
    }
    
    // Listener para mudança de idioma
    languageSelector.addEventListener('change', function(e) {
        const newLang = e.target.value;
        
        // Atualiza o idioma primeiro (isso atualiza currentLanguage)
        updateLanguage(newLang);
        
        // Recarregar conteúdo atual se houver
        const selectedNode = document.querySelector('.app-tree__node--selected');
        if (selectedNode && selectedNode.getAttribute('data-html')) {
            const path = selectedNode.getAttribute('data-path');
            const labelElement = selectedNode.querySelector('.app-tree__label');
            // Pega a chave i18n original, não o texto já traduzido
            const i18nKey = labelElement.getAttribute('data-i18n-key');
            const originalLabel = i18nKey ? (i18n.br[i18nKey] || labelElement.textContent) : labelElement.textContent;
            const htmlFile = selectedNode.getAttribute('data-html');
            const file = selectedNode.getAttribute('data-file');
            const lines = selectedNode.getAttribute('data-lines');
            
            // Recarregar conteúdo imediatamente - currentLanguage já foi atualizado por updateLanguage
            console.log('Recarregando conteúdo com idioma:', currentLanguage, 'para path:', path);
            updateContent(path, originalLabel, htmlFile, file, lines);
        } else {
            // Se não houver seleção, recarrega a página inicial
            const homePath = 'conteudos/java.md/1nqriq7eql.html';
            const translations = i18n[currentLanguage];
            const welcomeLabel = translations.welcome || 'Bem-vindo';
            const contentHeader = document.getElementById('contentHeader');
            if (contentHeader) {
                contentHeader.textContent = welcomeLabel;
            }
            updateContent('Home', welcomeLabel, homePath, null, null);
        }
    });
})();

