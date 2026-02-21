/**
 * Welcome page data loading functions
 * Loads statistics and updates from JSON files
 */

// Track if data has been loaded
let statisticsLoaded = false;
let updatesLoaded = false;
let latestPostsLoaded = false;

// Function to initialize pagination after both data sets are loaded
function checkAndInitializePagination() {
    if (statisticsLoaded && updatesLoaded) {
        if (typeof initializeWelcomePagination === 'function') {
            setTimeout(() => {
                initializeWelcomePagination();
            }, 100);
        }
    }
}

// Load and render statistics from JSON
async function loadWelcomeStatistics() {
    try {
        // Path is relative to index.html (root), not welcome.html
        const response = await fetch('resources/db/statistics.json');
        if (!response.ok) {
            console.error('Error loading statistics.json:', response.status);
            return;
        }
        const data = await response.json();
        const tbody = document.getElementById('statistics-tbody');
        if (!tbody) {
            console.error('Statistics tbody not found');
            return;
        }
        
        tbody.innerHTML = '';
        data.statistics.forEach(function(stat) {
            const row = document.createElement('tr');
            const percentage = stat.percentage + '%';
            const label = stat.completedSubtopics + '/' + stat.totalSubtopics;
            const tooltip = stat.completedSubtopics + ' of ' + stat.totalSubtopics + ' subtopics';
            
            row.innerHTML = 
                '<td style="vertical-align: middle;">' + stat.technology + '</td>' +
                '<td style="vertical-align: middle;">' + stat.category + '</td>' +
                '<td style="vertical-align: middle;">' + stat.availableTopics + '</td>' +
                '<td style="vertical-align: middle;">' +
                    '<div class="progress-bar-wrapper" style="display: flex; align-items: center; gap: 0.5rem;">' +
                        '<div class="progress-bar-container" style="flex: 1; height: 16px;" data-percentage="' + percentage + '">' +
                            '<div class="progress-bar-fill" style="width: ' + percentage + ';">' +
                                '<span class="progress-bar-text">' + percentage + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<span class="progress-bar-label" title="' + tooltip + '" style="font-size: 11px; color: #666; white-space: nowrap; display: flex; align-items: center; justify-content: center; margin-top: 0; height: 16px; padding: 0;">' + label + '</span>' +
                    '</div>' +
                '</td>';
            tbody.appendChild(row);
        });
        
        // Initialize circular progress bars after rendering
        if (typeof initializeCircularProgressBars === 'function') {
            initializeCircularProgressBars();
        }
        
        statisticsLoaded = true;
        checkAndInitializePagination();
    } catch (error) {
        console.error('Error loading statistics:', error);
        statisticsLoaded = true; // Mark as loaded even on error to avoid blocking
        checkAndInitializePagination();
    }
}

// Load and render updates from JSON
async function loadWelcomeUpdates() {
    try {
        // Path is relative to index.html (root), not welcome.html
        const response = await fetch('resources/db/updates.json');
        if (!response.ok) {
            console.error('Error loading updates.json:', response.status);
            return;
        }
        const data = await response.json();
        const timeline = document.getElementById('updates-timeline');
        if (!timeline) {
            console.error('Updates timeline not found');
            return;
        }
        
        timeline.innerHTML = '';
        data.updates.forEach(function(update) {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = '<strong>' + update.title + '</strong> - ' + update.description;
            timeline.appendChild(item);
        });

        // Render latest 10 posts carousel from the same updates dataset
        await loadWelcomeLatestPosts(data.updates);
        
        updatesLoaded = true;
        checkAndInitializePagination();
    } catch (error) {
        console.error('Error loading updates:', error);
        updatesLoaded = true; // Mark as loaded even on error to avoid blocking
        checkAndInitializePagination();
    }
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trimEnd() + '...';
}

function extractTopicFromUpdateTitle(title) {
    if (!title) return '';
    const parts = title.split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ').trim() : title.trim();
}

function buildMenuFileMap(items, resultMap) {
    if (!Array.isArray(items)) return;
    items.forEach(function(item) {
        if (item.type === 'file' && item.html && item.i18n && item.i18n.en) {
            resultMap.set(item.i18n.en.trim(), item.html);
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
            buildMenuFileMap(item.children, resultMap);
        }
    });
}

function buildReadMoreUrl(contentPath) {
    const encodedFile = encodeURIComponent(contentPath);
    const currentPath = window.location.pathname || '';
    const isRootIndex = currentPath.endsWith('/index.html') || currentPath === '/';
    const basePath = isRootIndex ? 'index.html' : '../../index.html';
    return basePath + '?file=' + encodedFile;
}

function initializeLatestPostsCarouselControls() {
    const carousel = document.getElementById('latest-posts-carousel');
    const track = document.getElementById('latest-posts-track');
    const prevBtn = document.getElementById('latest-posts-prev');
    const nextBtn = document.getElementById('latest-posts-next');

    if (!carousel || !track || !prevBtn || !nextBtn) return;

    const cards = Array.from(track.querySelectorAll('.latest-post-card'));
    if (cards.length === 0) return;

    let index = 0;
    let autoplayTimer = null;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartTranslate = 0;
    let currentTranslate = 0;
    let suppressClick = false;

    function getStep() {
        if (cards.length < 2) return cards[0].offsetWidth;
        const gap = cards[1].offsetLeft - cards[0].offsetLeft - cards[0].offsetWidth;
        return cards[0].offsetWidth + Math.max(0, gap);
    }

    function getVisibleCount() {
        if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
            return 1; // Mobile: always one card per view
        }
        const step = getStep();
        if (step <= 0) return 1;
        return Math.max(1, Math.floor(carousel.clientWidth / step));
    }

    function getMaxIndex() {
        return Math.max(0, cards.length - getVisibleCount());
    }

    function updateButtons() {
        const maxIndex = getMaxIndex();
        const prevDisabled = index <= 0;
        const nextDisabled = index >= maxIndex;

        prevBtn.classList.toggle('is-disabled', prevDisabled);
        nextBtn.classList.toggle('is-disabled', nextDisabled);
        prevBtn.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false');
        nextBtn.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false');
    }

    function applyPosition() {
        const step = getStep();
        const translate = Math.round(-index * step);
        track.style.transform = 'translateX(' + translate + 'px)';
        currentTranslate = translate;
        updateButtons();
    }

    function goNext() {
        if (nextBtn.classList.contains('is-disabled') && getMaxIndex() === 0) return;
        const maxIndex = getMaxIndex();
        if (index < maxIndex) {
            index += 1; // moves strip to the left (right -> left motion)
        } else {
            index = 0; // loop
        }
        applyPosition();
    }

    function goPrev() {
        if (prevBtn.classList.contains('is-disabled') && getMaxIndex() === 0) return;
        if (index > 0) {
            index -= 1;
        } else {
            index = getMaxIndex();
        }
        applyPosition();
    }

    prevBtn.onclick = function() {
        if (!prevBtn.classList.contains('is-disabled') || getMaxIndex() > 0) {
            goPrev();
        }
    };
    nextBtn.onclick = function() {
        if (!nextBtn.classList.contains('is-disabled') || getMaxIndex() > 0) {
            goNext();
        }
    };

    function bindKeyboard(btn, handler) {
        btn.onkeydown = function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handler();
            }
        };
    }
    bindKeyboard(prevBtn, prevBtn.onclick);
    bindKeyboard(nextBtn, nextBtn.onclick);

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(goNext, 3500);
    }

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    window.addEventListener('resize', applyPosition);

    function clampTranslate(value) {
        const step = getStep();
        const min = -getMaxIndex() * step;
        const max = 0;
        return Math.min(max, Math.max(min, value));
    }

    function onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        isDragging = true;
        suppressClick = false;
        dragStartX = event.clientX;
        dragStartTranslate = -index * getStep();
        currentTranslate = dragStartTranslate;
        stopAutoplay();
        track.style.transition = 'none';
        carousel.classList.add('is-dragging');
        if (carousel.setPointerCapture) {
            carousel.setPointerCapture(event.pointerId);
        }
    }

    function onPointerMove(event) {
        if (!isDragging) return;
        const delta = event.clientX - dragStartX;
        if (Math.abs(delta) > 4) suppressClick = true;
        currentTranslate = clampTranslate(dragStartTranslate + delta);
        track.style.transform = 'translateX(' + currentTranslate + 'px)';
        if (event.cancelable) event.preventDefault();
    }

    function onPointerUp(event) {
        if (!isDragging) return;
        isDragging = false;
        carousel.classList.remove('is-dragging');
        track.style.transition = 'transform 0.35s ease';
        if (carousel.releasePointerCapture) {
            try { carousel.releasePointerCapture(event.pointerId); } catch (e) {}
        }

        const delta = currentTranslate - dragStartTranslate;
        const threshold = Math.max(30, getStep() * 0.18);
        const maxIndex = getMaxIndex();

        if (delta <= -threshold && index < maxIndex) {
            index += 1;
        } else if (delta >= threshold && index > 0) {
            index -= 1;
        }

        applyPosition();
        startAutoplay();
    }

    carousel.addEventListener('pointerdown', onPointerDown);
    carousel.addEventListener('pointermove', onPointerMove);
    carousel.addEventListener('pointerup', onPointerUp);
    carousel.addEventListener('pointercancel', onPointerUp);
    carousel.addEventListener('pointerleave', onPointerUp);

    // Avoid accidental click on links/buttons right after drag
    track.addEventListener('click', function(event) {
        if (suppressClick) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick = false;
        }
    }, true);

    applyPosition();
    startAutoplay();
}

async function loadWelcomeLatestPosts(updates) {
    try {
        const track = document.getElementById('latest-posts-track');
        if (!track) return;

        const response = await fetch('resources/db/menu.json');
        if (!response.ok) {
            console.error('Error loading menu.json for latest posts:', response.status);
            return;
        }
        const menuData = await response.json();
        const fileMap = new Map();
        buildMenuFileMap(menuData.menu, fileMap);

        const latest = (updates || []).slice(0, 10);
        track.innerHTML = '';

        latest.forEach(function(update) {
            const topic = extractTopicFromUpdateTitle(update.title);
            const path = fileMap.get(topic);
            const card = document.createElement('article');
            card.className = 'latest-post-card';

            const title = document.createElement('h3');
            title.className = 'latest-post-card__title';
            title.textContent = topic || update.title || 'New content';

            const description = document.createElement('p');
            description.className = 'latest-post-card__description';
            description.textContent = truncateText(update.description || 'New content available on Codeflow.', 220);

            const cta = document.createElement('a');
            cta.className = 'latest-post-card__cta';
            cta.textContent = 'Read more...';
            cta.href = path ? buildReadMoreUrl(path) : '#';
            if (!path) {
                cta.setAttribute('aria-disabled', 'true');
                cta.style.opacity = '0.6';
                cta.style.pointerEvents = 'none';
            }

            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(cta);
            track.appendChild(card);
        });

        initializeLatestPostsCarouselControls();
        latestPostsLoaded = true;
    } catch (error) {
        console.error('Error loading latest posts carousel:', error);
        latestPostsLoaded = true;
    }
}
