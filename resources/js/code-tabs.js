// Function to switch between code tabs
function switchCodeTab(button, tabId) {
    // Removes active from all buttons and contents in same container
    const container = button.closest('.code-tabs-container');
    if (!container) return;
    
    container.querySelectorAll('.code-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    container.querySelectorAll('.code-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adds active to clicked button and corresponding content
    button.classList.add('active');
    const content = document.getElementById(tabId);
    
    if (content) {
        content.classList.add('active');
        
        // Re-applies highlight.js if necessary
        if (typeof hljs !== 'undefined') {
            content.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
                if (typeof hljs.lineNumbersBlock !== 'undefined') {
                    hljs.lineNumbersBlock(block);
                }
            });
        }
    }
}

// Initializes syntax highlighting for all active tabs when loading page
document.addEventListener('DOMContentLoaded', function() {
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('.code-tab-content.active pre code').forEach((block) => {
            hljs.highlightElement(block);
            if (typeof hljs.lineNumbersBlock !== 'undefined') {
                hljs.lineNumbersBlock(block);
            }
        });
    }
});
