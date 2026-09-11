/* Codeflow — carousel.js: "Latest articles" spotlight on the Home, in the Fusion af:carousel style.
   A stage shows the covers of the newest posts of the page language (at most 10): the current one large in the
   centre, its neighbours smaller and receding to the sides; the caption below carries title, metadata and excerpt.
   Advances on its own; arrows, dots, clicking a side cover, keyboard, swipe on touch screens; pauses on hover/focus
   and when the tab is hidden; hidden while a filter is active on the list below, and altogether with fewer than two
   articles. */
(function () {
  'use strict';
  var box = document.getElementById('latestCarousel');
  if (!box || typeof ARTICLES === 'undefined') return;
  var MAX = 10, INTERVAL = 6000;
  var items = ARTICLES.filter(function (a) { return !a.stub; })
    .sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; }).slice(0, MAX);
  if (items.length < 2) { box.hidden = true; return; }

  var stage = document.getElementById('crStage'), caption = document.getElementById('crCaption');
  var dots = document.getElementById('crDots'), count = document.getElementById('crCount');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n = items.length, idx = 0, timer = null, paused = false;

  stage.innerHTML = items.map(function (a, i) {
    return '<a class="crCard" data-i="' + i + '" href="' + a.href + '" aria-label="' + esc(a.title) + '" tabindex="-1">' +
      (a.cover ? '<img src="' + a.cover + '" alt="">' : '<span class="crNoCover">' + esc(a.title) + '</span>') + '</a>';
  }).join('');
  dots.innerHTML = items.map(function (a, i) {
    return '<button type="button" class="crDot" data-i="' + i + '" aria-label="' + (i + 1) + ' / ' + n + '" title="' + esc(a.title) + '"></button>';
  }).join('');
  if (reduce) box.classList.add('noAnim');
  var cards = Array.prototype.slice.call(stage.children);

  /* place every cover by its offset from the current one: 0 = centre, ±1 and ±2 recede, the rest are hidden */
  function layout() {
    var w = stage.clientWidth, step = Math.round(Math.min(290, w * 0.31)), half = Math.floor(n / 2);
    cards.forEach(function (c, i) {
      var o = ((i - idx) % n + n) % n; if (o > half) o -= n;           // -half … +half
      var d = Math.abs(o), visible = d <= 2;
      var x = o * step * (d === 2 ? 0.8 : 1), s = d === 0 ? 1 : d === 1 ? 0.72 : 0.54, op = d === 0 ? 1 : d === 1 ? 0.6 : 0.32;
      c.style.transform = 'translate(-50%, -50%) translateX(' + x + 'px) scale(' + s + ')';
      c.style.opacity = visible ? op : 0;
      c.style.zIndex = 10 - d;
      c.style.pointerEvents = visible ? 'auto' : 'none';
      c.classList.toggle('current', d === 0);
      c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
    });
  }
  function show(k, user) {
    idx = (k + n) % n;
    var a = items[idx];
    caption.classList.remove('in'); void caption.offsetWidth;
    caption.innerHTML =
      '<div class="crTitle"><a href="' + a.href + '">' + esc(a.title) + '</a></div>' +
      '<div class="cf-articleMeta"><span class="item">' + t('published_on') + ' <b>' + a.date + '</b></span><span class="sep">·</span> ' +
        '<span class="item"><b>' + esc(label(a.cat)) + '</b></span><span class="sep">·</span> ' +
        '<span class="item">' + t('reading_time') + ' <b>' + a.min + ' ' + t('min') + '</b></span></div>' +
      '<p class="crExcerpt">' + esc(a.excerpt) + '</p>' +
      '<a class="readMore" href="' + a.href + '">' + t('read_more') + ' ▸</a>';
    caption.classList.add('in');
    Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === idx); });
    count.textContent = t('carousel_of', { n: idx + 1, total: n });
    layout();
    if (user) restart();
  }
  function tick() { if (!paused && !document.hidden) show(idx + 1); }
  function restart() { if (timer) clearInterval(timer); timer = reduce ? null : setInterval(tick, INTERVAL); }

  stage.addEventListener('click', function (e) {
    var c = e.target.closest('.crCard'); if (!c) return;
    if (+c.dataset.i !== idx) { e.preventDefault(); show(+c.dataset.i, true); }   // a side cover comes to the centre; the centre one opens
  });
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
  stage.addEventListener('touchstart', function (e) { var p = e.touches[0]; sx = p.clientX; sy = p.clientY; swiping = true; paused = true; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!swiping) return; swiping = false; paused = false;
    var p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? idx + 1 : idx - 1, true); else restart();
  }, { passive: true });
  window.addEventListener('resize', layout);

  /* the list below hides the carousel while a filter is active (shell.js calls this from render()) */
  window.cfCarouselSync = function (filtering) {
    box.hidden = !!filtering;
    if (filtering) { if (timer) clearInterval(timer); timer = null; } else { layout(); if (!timer) restart(); }
  };

  show(0);
  restart();
})();
