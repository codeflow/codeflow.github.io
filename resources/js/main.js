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
    
    // Não precisa carregar conteúdo no index.html - ele redireciona automaticamente
    // O código abaixo só executa em páginas que já têm conteúdo (não no index.html)
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop();
    
    // Se estamos no index.html ou home.html, não faz nada (já redirecionou)
    if (currentFileName === 'index.html' || currentFileName === 'home.html') {
        return;
    }
    
    // Listener para mudança de idioma
    languageSelector.addEventListener('change', function(e) {
        const newLang = e.target.value;
        const oldLang = currentLanguage;
        
        // Atualiza o idioma primeiro (isso atualiza currentLanguage)
        updateLanguage(newLang);
        
        // Detecta a página atual pela URL
        const currentPath = window.location.pathname;
        const currentFileName = currentPath.split('/').pop();
        
        // Se estamos em uma página HTML de conteúdo (não index.html ou home.html)
        if (currentFileName && currentFileName !== 'index.html' && currentFileName !== 'home.html' && currentPath.includes('content/')) {
            // Troca o idioma no caminho atual - substitui /br/ ou /en/ pelo novo idioma
            let newPath = currentPath.replace(/\/(br|en)\//, `/${newLang}/`);
            
            // Se não encontrou o padrão (página sem idioma no caminho), adiciona o idioma
            if (newPath === currentPath) {
                const pathParts = currentPath.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const dirs = pathParts.slice(0, -1);
                newPath = dirs.join('/') + '/' + newLang + '/' + fileName;
            }
            
            // Navega para a nova página com o idioma correto
            console.log('Mudando idioma de', oldLang, 'para', newLang);
            console.log('Navegando de', currentPath, 'para', newPath);
            window.location.href = newPath;
            return;
        }
        
        // Recarregar conteúdo atual se houver (para quando estamos no index.html)
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

