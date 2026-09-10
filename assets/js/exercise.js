/* Codeflow — exercises and the Lab drawer.
   A post keeps its exercises in a hidden <div class="cf-lab"> after the article; this script moves them into the
   Lab drawer (#drLab), shows the Lab tab/button, builds the chip navigation and tracks progress. Each exercise is a
   .cf-exercise with a JSON spec in <script type="application/json" class="exSpec">. Kinds (data-kind):
     code    — free text editor; static checks over the code (regex, balanced, semicolons)
     blanks  — a code template with ___ gaps rendered as inputs; accepted answers per gap
     run     — JavaScript editor; the code is executed and the spec's tests asserted
     quiz    — multiple choice (radio or checkbox options in .exOptions); spec.answer lists the right indexes
     text    — short written answer (.exText); accepted values or a regex, accent/case-insensitive
   Links in the article: <a class="cf-labLink" href="#lab-<id>">…</a> open the Lab at that exercise.
   Everything runs in the browser; attempts and completed exercises live in localStorage. */
(function () {
  'use strict';

  var UI = {
    'en':    { summaryOk: 'All {n} checks passed', summaryFail: '{ok} of {n} checks passed', error: 'Error while running the code', solutionHdr: 'Reference solution', hide: 'Hide solution', show: 'Show solution', expected: 'expected', got: 'got', blankOk: 'Gap {i}: correct', blankFail: 'Gap {i}: not what was expected', empty: 'Write something before validating.', pick: 'Choose an option before validating.', quizOk: 'Correct answer', quizFail: 'Wrong answer', textOk: 'Correct answer', textFail: 'Not the expected answer', progress: '{done} of {n} completed', done: 'completed', section: 'Section', line: 'line' },
    'pt-BR': { summaryOk: 'Todas as {n} verificações passaram', summaryFail: '{ok} de {n} verificações passaram', error: 'Erro ao executar o código', solutionHdr: 'Solução de referência', hide: 'Ocultar solução', show: 'Ver solução', expected: 'esperado', got: 'obtido', blankOk: 'Lacuna {i}: correta', blankFail: 'Lacuna {i}: não é o esperado', empty: 'Escreva algo antes de validar.', pick: 'Escolha uma alternativa antes de validar.', quizOk: 'Resposta correta', quizFail: 'Resposta incorreta', textOk: 'Resposta correta', textFail: 'Não é a resposta esperada', progress: '{done} de {n} concluídos', done: 'concluído', section: 'Seção', line: 'linha' },
    'es':    { summaryOk: 'Las {n} comprobaciones pasaron', summaryFail: '{ok} de {n} comprobaciones pasaron', error: 'Error al ejecutar el código', solutionHdr: 'Solución de referencia', hide: 'Ocultar solución', show: 'Ver solución', expected: 'esperado', got: 'obtenido', blankOk: 'Hueco {i}: correcto', blankFail: 'Hueco {i}: no es lo esperado', empty: 'Escribe algo antes de validar.', pick: 'Elige una opción antes de validar.', quizOk: 'Respuesta correcta', quizFail: 'Respuesta incorrecta', textOk: 'Respuesta correcta', textFail: 'No es la respuesta esperada', progress: '{done} de {n} completados', done: 'completado', section: 'Sección', line: 'línea' }
  };
  var lang = document.documentElement.getAttribute('lang') || 'en';
  var t = UI[lang] || UI.en;
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fold(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }

  /* ---------- helpers over source code ---------- */
  function stripComments(code) { return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); }
  function stripStrings(code) { return code.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/'(?:\\.|[^'\\])*'/g, "''"); }
  function normalize(code) { return stripComments(code).replace(/\s+/g, ' ').trim(); }

  var CHECKS = {
    /* {type:"regex", pattern, flags?, absent?, raw?, msg, hint?} over the comment-free, whitespace-collapsed code */
    regex: function (code, c) {
      var re = new RegExp(c.pattern, c.flags || '');
      var hit = re.test(c.raw ? code : normalize(code));
      return { ok: c.absent ? !hit : hit };
    },
    /* {type:"balanced"} — (), [] and {} open and close in order, ignoring strings and comments */
    balanced: function (code) {
      var src = stripStrings(stripComments(code)), stack = [], pairs = { ')': '(', ']': '[', '}': '{' };
      for (var i = 0; i < src.length; i++) {
        var ch = src[i];
        if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
        else if (pairs[ch]) { if (stack.pop() !== pairs[ch]) return { ok: false, detail: '"' + ch + '"' }; }
      }
      return stack.length ? { ok: false, detail: '"' + stack[stack.length - 1] + '"' } : { ok: true };
    },
    /* {type:"semicolons"} — statement-looking lines (return, declarations, assignments, calls) must end with ";" */
    semicolons: function (code) {
      var lines = stripStrings(stripComments(code)).split('\n'), bad = [];
      var stmt = /^(return\b|break\b|continue\b|throw\b|[A-Za-z_][\w<>\[\],\s.]*\s+[A-Za-z_]\w*\s*(=|;|$)|[A-Za-z_][\w.]*\s*=|[A-Za-z_][\w.]*\s*\(.*\)$|[A-Za-z_][\w.]*\s*(\+\+|--)$)/;
      var control = /^(if|for|while|switch|catch|else|do|try|synchronized)\b/;
      lines.forEach(function (raw, i) {
        var l = raw.trim();
        if (!l || /[;{},(]$/.test(l) || l[0] === '@' || l[0] === '}' || control.test(l)) return;
        if (stmt.test(l)) bad.push(i + 1);
      });
      return bad.length ? { ok: false, detail: t.line + ' ' + bad.join(', ') } : { ok: true };
    }
  };

  /* ---------- persistence ---------- */
  var DONE_KEY = 'cf-ex-done:' + location.pathname, DONE = {};
  try { DONE = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) {}
  function attemptKey(ex) { return 'cf-ex:' + location.pathname + '#' + ex.id; }
  /* one object per exercise: { code, blanks: [...], quiz: [indexes], text, validated } */
  function loadState(ex) {
    var raw; try { raw = localStorage.getItem(attemptKey(ex)); } catch (e) { return {}; }
    if (!raw) return {};
    try { var v = JSON.parse(raw); if (v && typeof v === 'object') return v; } catch (e) {}
    return { code: raw };                                   // older format: the code alone
  }
  function saveState(ex, patch) {
    var st = loadState(ex); Object.keys(patch).forEach(function (k) { st[k] = patch[k]; });
    try { localStorage.setItem(attemptKey(ex), JSON.stringify(st)); } catch (e) {}
  }

  /* ---------- editor: tab key, line numbers, saved attempt ---------- */
  function setupEditor(ex, ta) {
    var gutter = ex.querySelector('.exGutter');
    function renumber() {
      if (!gutter) return;
      var n = ta.value.split('\n').length, s = '';
      for (var i = 1; i <= n; i++) s += i + '\n';
      gutter.textContent = s; gutter.scrollTop = ta.scrollTop;
    }
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 4; renumber();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); validate(ex); }
    });
    ta.addEventListener('input', function () { renumber(); saveState(ex, { code: ta.value }); });
    ta.addEventListener('scroll', function () { if (gutter) gutter.scrollTop = ta.scrollTop; });
    ta.dataset.starter = ta.value;
    var saved = loadState(ex).code; if (saved) ta.value = saved;
    renumber();
  }

  /* ---------- blanks: turn ___ into inputs ---------- */
  function setupBlanks(ex, spec) {
    var pre = ex.querySelector('.exBlanks'); if (!pre) return;
    var i = 0;
    pre.innerHTML = esc(pre.textContent).replace(/___/g, function () {
      var width = Math.max(3, (spec.blanks[i] && spec.blanks[i].width) || 6);
      return '<input type="text" data-gap="' + (i++) + '" spellcheck="false" autocomplete="off" style="width:' + width + 'em">';
    });
    var saved = loadState(ex).blanks || [], inputs = pre.querySelectorAll('input');
    inputs.forEach(function (inp, k) {
      if (saved[k]) inp.value = saved[k];
      inp.addEventListener('input', function () { saveState(ex, { blanks: Array.prototype.map.call(inputs, function (i) { return i.value; }) }); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') validate(ex); });
    });
  }

  /* ---------- validation per kind ---------- */
  function spec(ex) { var s = ex.querySelector('script.exSpec'); return s ? JSON.parse(s.textContent) : {}; }

  function validate(ex) {
    var sp = spec(ex), kind = ex.dataset.kind || 'code', items = [], out = ex.querySelector('.exResult');
    if (kind === 'blanks') {
      ex.querySelectorAll('.exBlanks input').forEach(function (inp, i) {
        var rule = sp.blanks[i] || {}, v = inp.value.trim(), ok = false;
        if (Array.isArray(rule.accept)) ok = rule.accept.indexOf(v) >= 0;
        else if (rule.regex) ok = new RegExp(rule.regex).test(v);
        inp.classList.toggle('ok', ok); inp.classList.toggle('err', !ok);
        items.push({ ok: ok, msg: fmt(ok ? t.blankOk : t.blankFail, { i: i + 1 }), detail: ok ? '' : (rule.hint || '') });
      });
    } else if (kind === 'quiz') {
      var lis = ex.querySelectorAll('.exOptions li'), chosen = [];
      lis.forEach(function (li, i) { li.classList.remove('ok', 'err', 'missed'); if (li.querySelector('input').checked) chosen.push(i); });
      if (!chosen.length) { render(ex, out, [{ ok: false, msg: t.pick }]); return; }
      var answer = (sp.answer || []).slice().sort(), ok = JSON.stringify(chosen) === JSON.stringify(answer);
      lis.forEach(function (li, i) {
        var right = answer.indexOf(i) >= 0, picked = chosen.indexOf(i) >= 0;
        if (picked) li.classList.add(right ? 'ok' : 'err'); else if (right) li.classList.add('missed');
      });
      items.push({ ok: ok, msg: ok ? t.quizOk : t.quizFail, detail: sp.explain || '' });
    } else if (kind === 'text') {
      var inp = ex.querySelector('.exText'), v = inp.value.trim(), okT = false;
      if (!v) { render(ex, out, [{ ok: false, msg: t.empty }]); return; }
      if (Array.isArray(sp.accept)) okT = sp.accept.some(function (a) { return fold(a) === fold(v); });
      if (!okT && sp.regex) okT = new RegExp(sp.regex, sp.flags || 'i').test(v);
      inp.classList.toggle('ok', okT); inp.classList.toggle('err', !okT);
      items.push({ ok: okT, msg: okT ? t.textOk : t.textFail, detail: okT ? (sp.explain || '') : (sp.hint || '') });
    } else {
      var code = ex.querySelector('textarea').value;
      if (!code.trim()) { render(ex, out, [{ ok: false, msg: t.empty }]); return; }
      if (kind === 'run') items = runJs(code, sp);
      else (sp.checks || []).forEach(function (c) {
        var fn = CHECKS[c.type]; if (!fn) return;
        var r; try { r = fn(code, c); } catch (e) { r = { ok: false, detail: String(e) }; }
        items.push({ ok: r.ok, msg: c.msg, detail: r.detail || (r.ok ? '' : (c.hint || '')) });
      });
    }
    saveState(ex, { validated: true });
    render(ex, out, items);
  }

  /* Execute JavaScript from the editor and assert the spec's tests: [{call:"fatorial(5)", expect:120}].
     Prototype: new Function in the page itself; the published version must run this in a sandboxed iframe or a
     Web Worker with a timeout. */
  function runJs(code, sp) {
    return (sp.tests || []).map(function (test) {
      var got, ok = false, detail = '';
      try {
        got = new Function(code + '\n;return (' + test.call + ');')();
        ok = JSON.stringify(got) === JSON.stringify(test.expect);
        detail = t.expected + ' ' + JSON.stringify(test.expect) + ', ' + t.got + ' ' + JSON.stringify(got);
      } catch (e) { detail = t.error + ': ' + e.message; }
      return { ok: ok, msg: test.msg || test.call, detail: ok ? '' : detail };
    });
  }

  function render(ex, out, items) {
    var okN = items.filter(function (i) { return i.ok; }).length, all = okN === items.length;
    out.className = 'exResult' + (all ? ' ok' : '');
    var head = items.length === 1 ? items[0].msg : fmt(all ? t.summaryOk : t.summaryFail, { ok: okN, n: items.length });   // one item: its own message is the header
    out.innerHTML = '<div class="msgHead">' + esc(head) + '</div><ul>' +
      items.map(function (i) {
        return '<li><span class="st ' + (i.ok ? 'ok' : 'err') + '">' + esc(i.msg) + '</span>' + (i.detail ? '<span class="detail">' + esc(i.detail) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    out.hidden = false;
    if (all) markDone(ex);
  }

  function toggleSolution(ex, btn) {
    var box = ex.querySelector('.exSolution');
    if (box) { box.remove(); btn.textContent = t.show; return; }
    var sp = spec(ex); if (!sp.solution) return;
    box = document.createElement('div'); box.className = 'exSolution cf-codeBox';
    box.innerHTML = '<div class="codeHdr">' + esc(t.solutionHdr) + ' <span class="lang">&mdash; ' + esc(ex.dataset.lang || '') + '</span></div><pre>' + esc(sp.solution) + '</pre>';
    ex.appendChild(box); btn.textContent = t.hide;
  }

  function reset(ex) {
    var ta = ex.querySelector('textarea');
    if (ta) { ta.value = ta.dataset.starter || ''; ta.dispatchEvent(new Event('input')); }
    ex.querySelectorAll('.exBlanks input, .exText').forEach(function (i) { i.value = ''; i.classList.remove('ok', 'err'); });
    ex.querySelectorAll('.exOptions li').forEach(function (li) { li.classList.remove('ok', 'err', 'missed'); li.querySelector('input').checked = false; });
    var out = ex.querySelector('.exResult'); if (out) { out.hidden = true; out.innerHTML = ''; }
    try { localStorage.removeItem(attemptKey(ex)); } catch (e) {}
  }

  /* ---------- Lab drawer: move the exercises in, chips, progress, deep links ---------- */
  var labBody = document.getElementById('labBody'), labNav = document.getElementById('labNav');
  var exercises = [];

  function markDone(ex) {
    DONE[ex.id] = true;
    try { localStorage.setItem(DONE_KEY, JSON.stringify(DONE)); } catch (e) {}
    paintDone();
  }
  function paintDone() {
    var n = 0;
    exercises.forEach(function (ex) {
      var d = !!DONE[ex.id]; if (d) n++;
      var mark = ex.querySelector('.exHdr .exDone');
      if (d && !mark) { mark = document.createElement('span'); mark.className = 'exDone'; mark.textContent = '\u2714 ' + t.done; ex.querySelector('.exHdr').appendChild(mark); }
      if (!d && mark) mark.remove();
      var chip = labNav && labNav.querySelector('[data-ex="' + ex.id + '"]');
      if (chip) chip.classList.toggle('done', d);
    });
    var p = document.getElementById('labProgress');
    if (p) p.textContent = exercises.length ? fmt(t.progress, { done: n, n: exercises.length }) : '';
  }

  function openLab(id) {
    var dr = document.getElementById('drLab'); if (!dr) return;
    if (!dr.classList.contains('open')) toggleDrawer('drLab');
    var ex = id && document.getElementById(id); if (!ex) return;
    requestAnimationFrame(function () {
      var body = dr.querySelector('.drBody');
      body.scrollTop += ex.getBoundingClientRect().top - body.getBoundingClientRect().top - 6;
      ex.classList.remove('flash'); void ex.offsetWidth; ex.classList.add('flash');
    });
  }
  window.openLab = openLab;

  function setupLab() {
    var lab = document.querySelector('.cf-lab');
    if (lab && labBody) { while (lab.firstChild) labBody.appendChild(lab.firstChild); lab.remove(); }
    exercises = Array.prototype.slice.call(document.querySelectorAll('.cf-exercise'));
    if (!exercises.length || !labBody) return;
    var inLab = exercises.filter(function (ex) { return labBody.contains(ex); });
    if (!inLab.length) return;
    ['dtLab', 'btnLab'].forEach(function (id) { var el = document.getElementById(id); if (el) el.hidden = false; });
    labNav.innerHTML = inLab.map(function (ex, i) {
      var short = ex.dataset.short || (ex.querySelector('.exHdr') ? ex.querySelector('.exHdr').childNodes[0].textContent.replace(/^.*?[—–-]\s*/, '').trim() : ex.id);
      return '<span class="chip" data-ex="' + esc(ex.id) + '"><span class="num">' + (i + 1) + '</span>' + esc(short) + '</span>';
    }).join('');
    labNav.addEventListener('click', function (e) { var c = e.target.closest('.chip'); if (c) openLab(c.dataset.ex); });
    /* "Section n" link in each header, back to the part of the article the exercise belongs to */
    inLab.forEach(function (ex) {
      var sec = ex.dataset.section, h = sec && document.getElementById(sec);
      if (!h) return;
      var a = document.createElement('a'); a.className = 'exSection'; a.href = '#' + sec;
      a.textContent = '\u21A9 ' + t.section + ' ' + (h.textContent.match(/^\s*(\d+)/) || ['', ''])[1];
      a.addEventListener('click', function (e) { e.preventDefault(); gotoSection(sec); });
      ex.querySelector('.exHdr').appendChild(a);
    });
    /* links in the article: <a class="cf-labLink" href="#lab-ex1"> */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a.cf-labLink'); if (!a) return;
      e.preventDefault(); openLab((a.getAttribute('href') || '').replace(/^#lab-/, ''));
    });
    if (/^#lab-/.test(location.hash)) openLab(location.hash.replace(/^#lab-/, ''));
  }

  document.querySelectorAll('.cf-exercise').forEach(function (ex) {
    var sp = spec(ex), ta = ex.querySelector('textarea');
    if (ta) setupEditor(ex, ta);
    if ((ex.dataset.kind || 'code') === 'blanks') setupBlanks(ex, sp);
    var st = loadState(ex), opts = ex.querySelectorAll('.exOptions input');
    opts.forEach(function (inp, k) {
      if ((st.quiz || []).indexOf(k) >= 0) inp.checked = true;
      inp.addEventListener('change', function () {
        saveState(ex, { quiz: Array.prototype.map.call(opts, function (i, j) { return i.checked ? j : -1; }).filter(function (j) { return j >= 0; }) });
      });
    });
    var txt = ex.querySelector('.exText');
    if (txt) {
      if (st.text) txt.value = st.text;
      txt.addEventListener('input', function () { saveState(ex, { text: txt.value }); });
      txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') validate(ex); });
    }
    if (st.validated) validate(ex);                          // rebuild the last result from the restored answers
    ex.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      if (b.dataset.act === 'check') validate(ex);
      else if (b.dataset.act === 'reset') reset(ex);
      else if (b.dataset.act === 'solution') toggleSolution(ex, b);
    });
  });
  setupLab();
  paintDone();
})();
