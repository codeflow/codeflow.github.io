// Funcionalidade da Tree View

(function() {
    const treeView = document.getElementById('treeView');

    // Expandir todos os nós na inicialização
    function expandAllNodes() {
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

    // Expandir todos os nós quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', expandAllNodes);
    } else {
        expandAllNodes();
    }

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

