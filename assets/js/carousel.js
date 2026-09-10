/* Codeflow — carousel.js: "Latest articles" spotlight on the Home, in the Fusion carousel style.
   Takes the newest posts of the page language (at most 10) from the catalogue, shows one at a time and advances on
   its own; arrows, dots, keyboard, swipe on touch screens; pauses on hover/focus and when the tab is hidden; hidden
   while a filter is active on the list below, and altogether when there are fewer than two articles. */
(function () {
  'use strict';
  var box = document.getElementById('latestCarousel');
  if (!box || typeof ARTICLES === 'undefined') return;
  var MAX = 10, INTERVAL = 6000;
  var items = ARTICLES.filter(function (a) { return !a.stub; })
    .sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; }).slice(0, MAX);
  if (items.length < 2) { box.hidden = true; return; }

  var track = document.getElementById('crTrack'), dots = document.getElementById('crDots'), count = document.getElementById('crCount');
  var viewport = document.getElementById('crViewport');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0, timer = null, paused = false;

  track.innerHTML = items.map(function (a, i) {
    return '<div class="crSlide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + items.length + '">' +
      (a.cover ? '<a class="crCover" href="' + a.href + '" tabindex="-1"><img src="' + a.cover + '" alt=""></a>' : '') +
      '<div class="crBody">' +
        '<div class="crTitle"><a href="' + a.href + '">' + esc(a.title) + '</a></div>' +
        '<div class="cf-articleMeta">' +
          '<span class="item">' + t('published_on') + ' <b>' + a.date + '</b></span><span class="sep">·</span> ' +
          '<span class="item"><b>' + esc(label(a.cat)) + '</b></span><span class="sep">·</span> ' +
          '<span class="item">' + t('reading_time') + ' <b>' + a.min + ' ' + t('min') + '</b></span></div>' +
        '<p class="crExcerpt">' + esc(a.excerpt) + '</p>' +
        '<a class="readMore" href="' + a.href + '">' + t('read_more') + ' ▸</a>' +
      '</div></div>';
  }).join('');
  dots.innerHTML = items.map(function (a, i) {
    return '<button type="button" class="crDot" data-i="' + i + '" aria-label="' + (i + 1) + ' / ' + items.length + '" title="' + esc(a.title) + '"></button>';
  }).join('');
  if (reduce) track.classList.add('noAnim');

  function show(n, user) {
    idx = (n + items.length) % items.length;
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    Array.prototype.forEach.call(track.children, function (s, i) { s.classList.toggle('current', i === idx); s.setAttribute('aria-hidden', i === idx ? 'false' : 'true'); });
    Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === idx); });
    count.textContent = t('carousel_of', { n: idx + 1, total: items.length });
    if (user) restart();
  }
  function tick() { if (!paused && !document.hidden) show(idx + 1); }
  function restart() { if (timer) clearInterval(timer); timer = reduce ? null : setInterval(tick, INTERVAL); }

  document.getElementById('crPrev').addEventListener('click', function () { show(idx - 1, true); });
  document.getElementById('crNext').addEventListener('click', function () { show(idx + 1, true); });
  dots.addEventListener('click', function (e) { var d = e.target.closest('.crDot'); if (d) show(+d.dataset.i, true); });
  box.addEventListener('mouseenter', function () { paused = true; });
  box.addEventListener('mouseleave', function () { paused = false; });
  box.addEventListener('focusin', function () { paused = true; });
  box.addEventListener('focusout', function () { paused = false; });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); }
  });
  /* swipe: a horizontal drag of at least 40px, more horizontal than vertical, changes the slide */
  var sx = 0, sy = 0, swiping = false;
  viewport.addEventListener('touchstart', function (e) { var p = e.touches[0]; sx = p.clientX; sy = p.clientY; swiping = true; paused = true; }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    if (!swiping) return; swiping = false; paused = false;
    var p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? idx + 1 : idx - 1, true); else restart();
  }, { passive: true });

  /* the list below hides the carousel while a filter is active (shell.js calls this from render()) */
  window.cfCarouselSync = function (filtering) { box.hidden = !!filtering; if (filtering) { if (timer) clearInterval(timer); timer = null; } else if (!timer) restart(); };

  show(0);
  restart();
})();
