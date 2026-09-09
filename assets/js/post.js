/* Codeflow — post.js: comportamento das páginas de artigo (abas, caixas, código, sumário). */
function gotoSection(id) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ block: 'start' });
}
function gotoRefs() {
  selectTab(document.getElementById('artTabBtnRefs'), 'artTabRefs');
  document.getElementById('artTabs').scrollIntoView({ block: 'nearest' });
}
function toggleBox(id) {
  var b = document.getElementById(id);
  b.classList.toggle('collapsed');
  b.querySelector('.disc').textContent = b.classList.contains('collapsed') ? '▶' : '▼';
  if (!b.classList.contains('collapsed')) b.scrollIntoView({ block: 'nearest' });
}
function selectTab(tab, panelId) {
  var bar = tab.parentNode;
  bar.querySelectorAll('.af-tab').forEach(function (t) { t.classList.remove('selected'); });
  tab.classList.add('selected');
  var content = bar.nextElementSibling;
  content.querySelectorAll('.af-tabPanel').forEach(function (p) { p.classList.remove('active'); });
  document.getElementById(panelId).classList.add('active');
}
function selectRow(row) {
  row.parentNode.querySelectorAll('tr').forEach(function (r) { r.classList.remove('selected'); });
  row.classList.add('selected');
}
function copyCode(btn) {
  var pre = btn.closest('.cf-codeBox').querySelector('pre:not(.cf-lineNums)');
  if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent);
  btn.textContent = 'Copied';
  setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
}
/* Line numbers for every code block: a non-selectable gutter beside the <pre>. */
document.querySelectorAll('.cf-codeBox pre').forEach(function (pre) {
  var lines = pre.textContent.replace(/\n$/, '').split('\n').length;
  var gutter = document.createElement('pre');
  gutter.className = 'cf-lineNums';
  gutter.setAttribute('aria-hidden', 'true');
  gutter.textContent = Array.from({ length: lines }, function (_, i) { return i + 1; }).join('\n');
  var body = document.createElement('div');
  body.className = 'cf-codeBody';
  pre.parentNode.insertBefore(body, pre);
  body.appendChild(gutter);
  body.appendChild(pre);
});
/* Table of contents drawer, generated from the article's numbered headings and figure captions. */
(function () {
  var sec = document.getElementById('tocSections'), fig = document.getElementById('tocFigures');
  if (!sec) return;
  var heads = document.querySelectorAll('.cf-article .af-subHeader[id]');
  sec.innerHTML = Array.prototype.map.call(heads, function (h) {
    return '<a href="#' + h.id + '" onclick="gotoSection(\'' + h.id + '\'); return false;">' + h.textContent + '</a>';
  }).join('') +
  '<a class="lvl2" href="#" onclick="gotoRefs(); return false;">' + t('references') + '</a>' +
  '<a class="lvl2" href="#" onclick="gotoSection(\'artTabs\'); return false;">' + t('tags_and_history') + '</a>';
  var figs = document.querySelectorAll('.cf-article .cf-figure');
  fig.innerHTML = Array.prototype.map.call(figs, function (f, i) {
    if (!f.id) f.id = 'fig' + (i + 1);
    var label = (f.querySelector('.figHdr') ? f.querySelector('.figHdr').childNodes[0].textContent.trim() : 'Figure ' + (i + 1));
    return '<a href="#' + f.id + '" onclick="gotoSection(\'' + f.id + '\'); return false;">' + t('figure_abbr') + ' ' + (i + 1) + ' &mdash; ' + label + '</a>';
  }).join('');
  if (!figs.length) fig.parentNode.querySelector('.af-subHeader').hidden = true;
})();

/* SVG text fit: a translated label can be longer than the box drawn for it. When a <text> overflows the
   <rect> it sits in, condense it with textLength so it stays inside; the element is marked with data-fit
   (the applied ratio) so the validator can flag labels condensed beyond taste (the author should shorten those). */
(function fitSvgText() {
  document.querySelectorAll('.cf-hero svg, .cf-figure svg').forEach(function (svg) {
    var rects = Array.prototype.filter.call(svg.querySelectorAll('rect'), function (r) {
      return +r.getAttribute('width') < 600 && +r.getAttribute('height') < 120;
    });
    Array.prototype.forEach.call(svg.querySelectorAll('text'), function (t) {
      var b; try { b = t.getBBox(); } catch (e) { return; }
      if (!b.width) return;
      var cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      var box = rects.filter(function (r) {
        var x = +r.getAttribute('x'), y = +r.getAttribute('y'), w = +r.getAttribute('width'), h = +r.getAttribute('height');
        return cx >= x && cx <= x + w && cy >= y && cy <= y + h;
      })[0];
      if (!box) return;
      var avail = +box.getAttribute('width') - 6;
      if (b.width > avail) {
        t.setAttribute('textLength', avail);
        t.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        t.dataset.fit = (avail / b.width).toFixed(2);
      }
    });
  });
})();

/* SVG geometry lint: connectors must start and end on a box edge (never inside a box), must not run over a box
   drawn before them, and no stroke may cross a text label. Issues are stored on the <svg> as data-geom so the
   validator (GEOM check) can fail the post; nothing is drawn or changed here. */
(function lintSvgGeometry() {
  var TOL = 1.5;
  function inside(pt, r, tol) { return pt.x > r.x + tol && pt.x < r.x + r.w - tol && pt.y > r.y + tol && pt.y < r.y + r.h - tol; }
  document.querySelectorAll('.cf-hero svg, .cf-figure svg').forEach(function (svg, si) {
    var issues = [];
    var rects = Array.prototype.map.call(svg.querySelectorAll('rect'), function (r) {
      return { el: r, x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height') };
    }).filter(function (r) { return r.w < 600 && r.h < 120 && r.w > 8; });
    var texts = Array.prototype.map.call(svg.querySelectorAll('text'), function (t) {
      var b; try { b = t.getBBox(); } catch (e) { return null; }
      return b && b.width ? { el: t, x: b.x, y: b.y, w: b.width, h: b.height, label: t.textContent.trim().slice(0, 28) } : null;
    }).filter(Boolean);
    var strokes = Array.prototype.filter.call(svg.querySelectorAll('path, line'), function (p) {
      return !p.closest('defs') && p.getAttribute('stroke') && (p.getAttribute('fill') || 'none') === 'none';
    });
    strokes.forEach(function (p, pi) {
      var len; try { len = p.getTotalLength(); } catch (e) { return; }
      if (!len) return;
      var start = p.getPointAtLength(0), end = p.getPointAtLength(len);
      var before = rects.filter(function (r) { return r.el.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING; });   // boxes drawn before the stroke
      rects.forEach(function (r) {
        if (inside(start, r, TOL)) issues.push('stroke ' + pi + ' starts inside a box at (' + Math.round(start.x) + ',' + Math.round(start.y) + ')');
        if (inside(end, r, TOL)) issues.push('stroke ' + pi + ' ends inside a box at (' + Math.round(end.x) + ',' + Math.round(end.y) + ')');
      });
      var crossedBox = null, crossedText = null;
      for (var d = 4; d < len - 4; d += 3) {
        var pt = p.getPointAtLength(d);
        if (!crossedBox) before.forEach(function (r) { if (inside(pt, r, TOL)) crossedBox = r; });
        if (!crossedText) texts.forEach(function (t) { if (inside(pt, t, -0.5)) crossedText = t; });
      }
      if (crossedBox) issues.push('stroke ' + pi + ' runs over a box at (' + crossedBox.x + ',' + crossedBox.y + ')');
      if (crossedText) issues.push('stroke ' + pi + ' crosses the text “' + crossedText.label + '”');
    });
    svg.dataset.geom = JSON.stringify(issues);
  });
})();

/* Tables scroll horizontally inside their own container on narrow screens instead of widening the page. */
(function wrapTables() {
  document.querySelectorAll('#mainPanel table.af-table').forEach(function (tb) {
    if (tb.parentNode.classList.contains('cf-tableScroll')) return;
    var w = document.createElement('div');
    w.className = 'cf-tableScroll';
    tb.parentNode.insertBefore(w, tb);
    w.appendChild(tb);
  });
})();
