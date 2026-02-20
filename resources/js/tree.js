// Tree View functionality

(function() {
    // Function to initialize content treeviews (for hierarchical structures in content pages)
    function initContentTreeview(contentTree) {
        if (!contentTree) return;
        
        // Expand all nodes by default
        const allToggles = contentTree.querySelectorAll('.content-treeview__toggle--collapsed');
        const allChildren = contentTree.querySelectorAll('.content-treeview__children');
        
        allToggles.forEach(toggle => {
            toggle.classList.remove('content-treeview__toggle--collapsed');
            toggle.classList.add('content-treeview__toggle--expanded');
        });
        
        allChildren.forEach(children => {
            children.classList.add('content-treeview__children--expanded');
        });
        
        // Add click listeners for expand/collapse
        contentTree.addEventListener('click', function(e) {
            const toggle = e.target.closest('.content-treeview__toggle');
            if (toggle) {
                e.stopPropagation();
                const node = toggle.closest('.content-treeview__item');
                const children = node.querySelector('.content-treeview__children');
                if (children) {
                    const isExpanded = toggle.classList.contains('content-treeview__toggle--expanded');
                    if (isExpanded) {
                        toggle.classList.remove('content-treeview__toggle--expanded');
                        toggle.classList.add('content-treeview__toggle--collapsed');
                        children.classList.remove('content-treeview__children--expanded');
                    } else {
                        toggle.classList.remove('content-treeview__toggle--collapsed');
                        toggle.classList.add('content-treeview__toggle--expanded');
                        children.classList.add('content-treeview__children--expanded');
                    }
                }
            }
        });
    }
    
    // Support both menu treeview (app-tree) and content treeview (content-treeview)
    const treeView = document.getElementById('treeView');
    const contentTreeviews = document.querySelectorAll('.content-treeview');
    
    // Initialize content treeviews
    if (contentTreeviews.length > 0) {
        contentTreeviews.forEach(contentTree => {
            initContentTreeview(contentTree);
        });
    }
    
    // Initialize menu treeview
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
    
    // Initialize content treeviews when DOM is ready (for dynamically loaded content)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const contentTreeviews = document.querySelectorAll('.content-treeview');
            contentTreeviews.forEach(contentTree => {
                initContentTreeview(contentTree);
            });
        });
    } else {
        const contentTreeviews = document.querySelectorAll('.content-treeview');
        contentTreeviews.forEach(contentTree => {
            initContentTreeview(contentTree);
        });
    }
})();

