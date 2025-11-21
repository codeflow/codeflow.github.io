// Inicialização principal da aplicação

(function() {
    // Inicializar menu mobile
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    function openMobileMenu() {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('mobile-open');
            mobileOverlay.classList.add('active');
            mobileMenuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileMenu() {
        sidebar.classList.remove('mobile-open');
        mobileOverlay.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (sidebar.classList.contains('mobile-open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    // Fechar menu ao clicar em um item do tree view (mobile)
    const treeView = document.getElementById('treeView');
    if (treeView) {
        treeView.addEventListener('click', function(e) {
            const node = e.target.closest('.app-tree__node');
            if (node && window.innerWidth <= 768) {
                // Pequeno delay para permitir que o conteúdo seja carregado
                setTimeout(closeMobileMenu, 300);
            }
        });
    }

    // Fechar menu ao redimensionar para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        } else {
            // Garantir que o scroll funcione quando o menu está fechado
            if (!sidebar.classList.contains('mobile-open')) {
                document.body.style.overflow = '';
            }
        }
    });

    // Garantir que o scroll funcione quando a página carrega
    if (window.innerWidth <= 768 && !sidebar.classList.contains('mobile-open')) {
        document.body.style.overflow = '';
    }

    // Inicializar idioma e seletor
    const languageSelector = document.getElementById('languageSelector');
    
    // Definir idioma inicial
    updateLanguage(currentLanguage);
    
    // Carregar página inicial se não houver seleção
    const selectedNode = document.querySelector('.app-tree__node--selected');
    if (!selectedNode) {
        // Carrega a página inicial (home/index)
        const homePath = 'content/java.md/1nqriq7eql.html';
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
            const homePath = 'content/java.md/1nqriq7eql.html';
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

