// Funcionalidade da Tree View

(function() {
    const treeView = document.getElementById('treeView');
    if (!treeView) return;

    // Expandir todos os nós na inicialização
    function expandAllNodes() {
        if (!treeView) return;
        const allToggles = treeView.querySelectorAll('.app-tree__toggle--collapsed');
        const allChildren = treeView.querySelectorAll('.app-tree__children');
        
        allToggles.forEach(toggle => {
            toggle.classList.remove('app-tree__toggle--collapsed');
            toggle.classList.add('app-tree__toggle--expanded');
        });
        
        allChildren.forEach(children => {
            children.classList.add('app-tree__children--expanded');
        });
    }

    // Função para inicializar event listeners
    function initTreeListeners() {
        if (!treeView) return;
        
        // Expansão/colapso de nós
        treeView.addEventListener('click', function(e) {
            const toggle = e.target.closest('.app-tree__toggle');
            if (toggle) {
                e.stopPropagation();
                const node = toggle.closest('.app-tree__item');
                const children = node.querySelector('.app-tree__children');
                if (children) {
                    const isExpanded = toggle.classList.contains('app-tree__toggle--expanded');
                    if (isExpanded) {
                        toggle.classList.remove('app-tree__toggle--expanded');
                        toggle.classList.add('app-tree__toggle--collapsed');
                        children.classList.remove('app-tree__children--expanded');
                    } else {
                        toggle.classList.remove('app-tree__toggle--collapsed');
                        toggle.classList.add('app-tree__toggle--expanded');
                        children.classList.add('app-tree__children--expanded');
                    }
                }
            }
        });

        // Seleção de nós
        treeView.addEventListener('click', function(e) {
            const node = e.target.closest('.app-tree__node');
            if (node && !e.target.closest('.app-tree__toggle')) {
                // Remove seleção anterior
                document.querySelectorAll('.app-tree__node--selected').forEach(n => {
                    n.classList.remove('app-tree__node--selected');
                });
                // Adiciona seleção ao nó clicado
                node.classList.add('app-tree__node--selected');
                
                // Atualiza conteúdo
                const path = node.getAttribute('data-path');
                const label = node.querySelector('.app-tree__label').textContent;
                const htmlFile = node.getAttribute('data-html');
                const file = node.getAttribute('data-file');
                const lines = node.getAttribute('data-lines');
                
                if (typeof updateContent !== 'undefined') {
                    updateContent(path, label, htmlFile, file, lines);
                }
            }
        });
    }

    // Expandir todos os nós quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            expandAllNodes();
            initTreeListeners();
        });
    } else {
        expandAllNodes();
        initTreeListeners();
    }
    
    // Escuta evento quando o menu é construído dinamicamente
    document.addEventListener('menuBuilt', () => {
        expandAllNodes();
        // Os event listeners já estão anexados, não precisa reanexar
    });

    // Expansão/colapso de nós
    treeView.addEventListener('click', function(e) {
        const toggle = e.target.closest('.app-tree__toggle');
        if (toggle) {
            e.stopPropagation();
            const node = toggle.closest('.app-tree__item');
            const children = node.querySelector('.app-tree__children');
            if (children) {
                const isExpanded = toggle.classList.contains('app-tree__toggle--expanded');
                if (isExpanded) {
                    toggle.classList.remove('app-tree__toggle--expanded');
                    toggle.classList.add('app-tree__toggle--collapsed');
                    children.classList.remove('app-tree__children--expanded');
                } else {
                    toggle.classList.remove('app-tree__toggle--collapsed');
                    toggle.classList.add('app-tree__toggle--expanded');
                    children.classList.add('app-tree__children--expanded');
                }
            }
        }
    });

    // Seleção de nós
    treeView.addEventListener('click', function(e) {
        const node = e.target.closest('.app-tree__node');
        if (node && !e.target.closest('.app-tree__toggle')) {
            // Remove seleção anterior
            document.querySelectorAll('.app-tree__node--selected').forEach(n => {
                n.classList.remove('app-tree__node--selected');
            });
            // Adiciona seleção ao nó clicado
            node.classList.add('app-tree__node--selected');
            
            // Atualiza conteúdo
            const path = node.getAttribute('data-path');
            const label = node.querySelector('.app-tree__label').textContent;
            const htmlFile = node.getAttribute('data-html');
            const file = node.getAttribute('data-file');
            const lines = node.getAttribute('data-lines');
            
            updateContent(path, label, htmlFile, file, lines);
        }
    });
})();

