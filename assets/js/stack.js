/* Codeflow — stack.js: renders the content stack tree (internal page). Uses the tree twisties of shell.js. */
(function () {
  var data = (window.CODEFLOW_STACK || {}).software_engineering || [];
  var lang = CF.lang;
  function tr(o) { return (o && (o[lang] || o.en)) || ''; }
  function ph(s, m) { return s.replace(/\{(\w+)\}/g, function (_, k) { return m[k]; }); }
  var topics = 0, subs = 0;
  function node(n, depth, idx) {
    var kids = n.children || [];
    var id = 'st_' + n.id;
    if (depth === 0) topics++; else subs++;
    var row = '<div class="af-treeRow' + (depth === 0 ? ' topic' : ' sub') + '" onclick="' + (kids.length ? 'toggleTree(\'' + id + '\')' : '') + '">' +
      '<span class="tw"' + (kids.length ? ' onclick="event.stopPropagation(); toggleTree(\'' + id + '\')"' : '') + '>' + (kids.length ? TW_CLOSED : '') + '</span>' +
      (kids.length ? ICO_FOLDER : ICO_DOC) +
      '<span class="lbl"><b>' + esc(tr(n.name)) + '</b><span class="desc">' + esc(tr(n.desc)) + '</span></span></div>';
    return '<li class="af-treeNode closed" id="' + id + '">' + row + (kids.length ? '<ul>' + kids.map(function (k, j) { return node(k, depth + 1, j); }).join('') + '</ul>' : '') + '</li>';
  }
  var html = data.map(function (n, i) { return node(n, 0, i); }).join('');
  document.getElementById('stackTree').innerHTML = html;
  document.getElementById('stackCount').textContent = ph(t('stack_count'), { n: topics, m: subs });
  window.stackExpand = function (open) {
    document.querySelectorAll('#stackTree .af-treeNode').forEach(function (n) {
      var has = n.querySelector(':scope > ul');
      if (!has) return;
      n.classList.toggle('closed', !open);
      n.querySelector(':scope > .af-treeRow .tw').innerHTML = open ? TW_OPEN : TW_CLOSED;
    });
  };
})();
