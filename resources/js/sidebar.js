// Sidebar menu resizing functionality

(function() {
    const sidebar = document.getElementById('sidebar');
    const resizer = document.getElementById('resizer');
    let isResizing = false;
    let startX, startWidth;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const width = startWidth + e.clientX - startX;
        const minWidth = parseInt(sidebar.style.minWidth || '150', 10);
        const maxWidth = parseInt(sidebar.style.maxWidth || '500', 10);
        if (width >= minWidth && width <= maxWidth) {
            sidebar.style.width = width + 'px';
        }
    }

    function handleMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
})();

