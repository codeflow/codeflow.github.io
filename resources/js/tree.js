// Tree View functionality

(function() {
    const treeView = document.getElementById('treeView');
    if (!treeView) return;

    // Expand all nodes on initialization
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

    // Function to initialize event listeners
    function initTreeListeners() {
        if (!treeView) return;
        
        // Node expansion/collapse
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

        // Node selection
        treeView.addEventListener('click', function(e) {
            const node = e.target.closest('.app-tree__node');
            if (node && !e.target.closest('.app-tree__toggle')) {
                // Checks if it is a folder (has children) or a file (has data-html)
                const treeItem = node.closest('.app-tree__item');
                const hasChildren = treeItem ? treeItem.querySelector('.app-tree__children') : null;
                const htmlFile = node.getAttribute('data-html');
                
                // If it is a folder (has children but no htmlFile), just expands/collapses, does not load content
                if (hasChildren && !htmlFile) {
                    // It is a folder, just expands/collapses if it has toggle
                    const toggle = node.querySelector('.app-tree__toggle');
                    if (toggle) {
                        const children = treeItem.querySelector('.app-tree__children');
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
                    // Does not remove previous selection nor adds new selection for folders
                    // Does not load content for folders
                    e.stopPropagation();
                    return;
                }
                
                // If no htmlFile, it is not a valid file, does nothing
                if (!htmlFile) {
                    e.stopPropagation();
                    return;
                }
                
                // Removes previous selection
                document.querySelectorAll('.app-tree__node--selected').forEach(n => {
                    n.classList.remove('app-tree__node--selected');
                });
                // Adds selection to clicked node
                node.classList.add('app-tree__node--selected');
                
                // Updates content only if it is a file (has htmlFile)
                if (typeof updateContent !== 'undefined') {
                    const path = node.getAttribute('data-path');
                    const label = node.querySelector('.app-tree__label').textContent;
                    const file = node.getAttribute('data-file');
                    const lines = node.getAttribute('data-lines');
                    
                    updateContent(path, label, htmlFile, file, lines);
                }
            }
        });
    }

    // Expand all nodes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            expandAllNodes();
            initTreeListeners();
        });
    } else {
        expandAllNodes();
        initTreeListeners();
    }
    
    // Listens to event when menu is built dynamically
    document.addEventListener('menuBuilt', () => {
        expandAllNodes();
        // Event listeners are already attached, no need to reattach
    });
})();

