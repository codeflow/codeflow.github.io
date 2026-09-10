#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Codeflow — validate that a post is fully wired into the site.

  python3 scripts/validate_post.py --key <slug> --lang <lang> [--site http://localhost:3000] [--build]

Checks (each prints PASS/FAIL/INFO):
  SEO       meta description ≤160 chars, canonical, hreflang (own language + x-default), a 1200x630 social card as
            og:image, h2 section headings and a TechArticle JSON-LD node
  TREE      the Content Navigator (rendered by the site's own JS in headless Chrome) has the post link under its
            category and topic
  SEARCH    /search.json has the post, and a search with a word of its title finds it (same rule as the site JS)
  TAGS      every tag of the post is in the tag counts; which ones are visible in Popular Tags (top 10)
  ARCHIVE   the post's month appears in the Archive section
  LIST      the post appears in Published Articles (page 1 when it is among the 6 newest of its language)
  FIT       SVG labels inside boxes: how many had to be condensed (textLength) to fit, none beyond 15%
  GEOM      SVG connectors start/end on box edges, never run over a box drawn before them, never cross a text
  LAB       the post's Lab (source file): at least 3 exercises of known kinds, each tied to an existing section,
            every "open in the Lab" link resolving to an exercise and every exercise linked from a section, JSON
            specs valid, quiz answers within the options, one blanks rule per ___, and the run-kind reference
            solutions passing their own tests (needs node)
  LANG      <html lang>, the combobox option, the i18n dictionary (same keys as en.yml) and a stop-word language
            detector over the article text all agree with --lang
Exit code 0 when every check passes.
"""
import argparse, json, os, re, shutil, subprocess, sys, time, urllib.request, urllib.parse, html as htmlmod
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
STOP = {
    "en": "the and of to in is that with for as are this it by on be or an from at which not can we each one when if into its than only also more but they their".split(),
    "pt-BR": "de a o que e do da em um para com não uma os no se na por mais as dos como mas ao ele das à seu sua ou quando muito nos já eu também só pelo pela até isso ela entre depois sem mesmo".split(),
    "es": "de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también me hasta".split(),
    "fr": "le la les de des du et est un une que qui dans pour pas au aux ce cette il elle sur avec plus ne sont être par ou".split(),
}

def fetch(url):
    with urllib.request.urlopen(url, timeout=30) as r: return r.read().decode("utf-8")

def dump_dom(url):
    """Rendered DOM after the site's JavaScript ran (needs Chrome)."""
    if not os.path.exists(CHROME): return None
    out = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--virtual-time-budget=6000",
                          "--dump-dom", url], capture_output=True, text=True, timeout=120)
    return out.stdout

def detect_lang(text):
    words = re.findall(r"[a-záàâãéêíóôõúçñü]+", text.lower())
    if not words: return None, {}
    scores = {l: sum(1 for w in words if w in set(sw)) / len(words) for l, sw in STOP.items()}
    best = max(scores, key=scores.get)
    return best, scores

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True); ap.add_argument("--lang", default="en")
    ap.add_argument("--site", default="http://localhost:3000"); ap.add_argument("--build", action="store_true")
    a = ap.parse_args()
    site = a.site.rstrip("/")
    server = None
    try:
        fetch(site + "/")
    except Exception:
        # no local server: build with Docker and serve _site on a temporary port
        subprocess.run([os.path.join(ROOT, "serve.sh"), "build"], check=True)
        server = subprocess.Popen([sys.executable, "-m", "http.server", "4011"], cwd=os.path.join(ROOT, "_site"),
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        site = "http://localhost:4011"; time.sleep(1.5)

    results = []
    def rep(name, ok, msg): results.append((name, ok, msg)); print(("PASS " if ok is True else "FAIL " if ok is False else "INFO ") + name.ljust(8) + " " + msg)

    # ---------- data: search.json ----------
    try:
        idx = json.loads(fetch(site + "/search.json"))
    except Exception as e:
        print("could not load /search.json:", e); sys.exit(2)
    post = [p for p in idx if p["key"] == a.key and p["lang"] == a.lang]
    if not post:
        rep("SEARCH", False, f"no entry with key={a.key} lang={a.lang} in search.json"); print_summary(results); sys.exit(1)
    post = post[0]
    home = site + ("/" if a.lang == "en" else f"/{a.lang}/")
    same_lang = [p for p in idx if p["lang"] == a.lang]

    # SEARCH: title word query, same rule as textMatch() in shell.js
    words = [w for w in re.findall(r"[\w-]{5,}", post["title"].lower()) if w not in STOP.get(a.lang, [])]
    q = words[0] if words else post["title"].split()[0].lower()
    hay = (post["title"] + " " + post["excerpt"] + " " + " ".join(post["tags"]) + " " + post["content"]).lower()
    hits = [p for p in same_lang if q in (p["title"] + " " + p["excerpt"] + " " + " ".join(p["tags"]) + " " + p["content"]).lower()]
    rep("SEARCH", (q in hay) and post in hits, f"indexed ({len(post['content'])} chars of text); query “{q}” → {len(hits)} hit(s)")

    # ---------- rendered Home (tree, tags, archive, list) ----------
    dom = dump_dom(home)
    if dom is None:
        rep("TREE", None, "Chrome not found — skipped DOM checks"); print_summary(results); sys.exit(0 if all(r[1] is not False for r in results) else 1)
    href = post["url"]
    # TREE
    tree = re.search(r'<ul class="af-tree" id="navTree">(.*?)</ul>\s*</div>\s*</div>', dom, flags=re.S)
    tree = tree.group(1) if tree else ""
    cat_block = None
    for m in re.finditer(r'<li class="af-treeNode[^"]*" id="tn\d+">(.*?)(?=<li class="af-treeNode[^"]*" id="tn\d+">|$)', tree, flags=re.S):
        if f'data-cat="{htmlmod.escape(post["cat"], quote=True)}"' in m.group(1) or f'data-cat="{post["cat"]}"' in m.group(1): cat_block = m.group(1)
    in_cat = bool(cat_block) and href in cat_block
    if post.get("topic"):
        tb = re.search(r'data-topic="' + re.escape(htmlmod.escape(post["topic"], quote=True)) + r'".*?</ul>', cat_block or "", flags=re.S)
        in_topic = bool(tb) and href in tb.group(0)
        rep("TREE", in_cat and in_topic, f"link under “{post['cat']}” › “{post['topic']}”" if in_topic else f"link NOT under topic “{post['topic']}” (in category: {in_cat})")
    else:
        rep("TREE", in_cat, f"link under “{post['cat']}”" if in_cat else "link not found in the Content Navigator")
    # TAGS
    counts = Counter(t for p in same_lang for t in p["tags"])
    top10 = [t for t, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:10]]
    cloud = re.search(r'id="tagCloud">(.*?)</div>', dom, flags=re.S); cloud = cloud.group(1) if cloud else ""
    missing = [t for t in post["tags"] if t not in counts]
    visible = [t for t in post["tags"] if t in top10 and htmlmod.escape(t) in cloud]
    rep("TAGS", not missing, f"{len(post['tags'])} tags counted; visible in Popular Tags (top 10): {visible or 'none'}")
    # ARCHIVE
    y, mth, _ = post["date"].split("-")
    i18n_js = fetch(f"{site}/assets/js/i18n/{a.lang}.js")          # month names live in the language script file
    months = json.loads(re.search(r"months:\s*(\[.*?\])", i18n_js).group(1))
    label = f"{months[int(mth)-1]} {y}"
    arch = re.search(r'id="archList">(.*?)</div>\s*</div>', dom, flags=re.S); arch = arch.group(1) if arch else ""
    rep("ARCHIVE", label in arch and f"'{y}-{mth}'" in arch, f"month entry “{label}”")
    # LIST
    order = sorted(same_lang, key=lambda p: p["date"], reverse=True)
    pos = [p["key"] for p in order].index(a.key) + 1
    page = (pos - 1) // 6 + 1
    listed = re.search(r'id="postList">(.*?)<div class="af-statusBar">', dom, flags=re.S); listed = listed.group(1) if listed else ""
    if page == 1: rep("LIST", href in listed, f"position {pos} of {len(order)} → page 1 (rendered: {'yes' if href in listed else 'no'})")
    else: rep("LIST", True, f"position {pos} of {len(order)} → page {page} (not on page 1 by date order)")

    # ---------- SVG labels that had to be condensed to fit their boxes ----------
    pdom = dump_dom(site + post["url"]) or ""
    fits = [float(x) for x in re.findall(r'data-fit="([0-9.]+)"', pdom)]
    tight = [f for f in fits if f < 0.85]
    rep("FIT", not tight, f"{len(fits)} SVG label(s) auto-condensed to fit; " + (f"{len(tight)} beyond 15% — shorten those texts or widen the boxes" if tight else "none beyond 15%"))

    # ---------- SVG geometry: connectors on box edges, nothing drawn over boxes or text ----------
    geom = []
    for m in re.finditer(r'data-geom="([^"]*)"', pdom):
        try: geom += json.loads(htmlmod.unescape(m.group(1)))
        except Exception: pass
    rep("GEOM", not geom, ("no connector inside/over a box or across a text" if not geom else "; ".join(geom[:4]) + (f" (+{len(geom)-4} more)" if len(geom) > 4 else "")))

    # ---------- Lab: exercises, section links and specs (checked on the source file) ----------
    page_html = fetch(site + post["url"])
    pat = re.compile(r"^\d{4}-\d{2}-\d{2}-" + re.escape(a.key) + (r"\.html$" if a.lang == "en" else r"\." + re.escape(a.lang) + r"\.html$"))
    srcs = [f for f in os.listdir(os.path.join(ROOT, "_posts")) if pat.match(f)]
    if not srcs:
        rep("LAB", False, "post source file not found in _posts")
    else:
        src = open(os.path.join(ROOT, "_posts", srcs[0]), encoding="utf-8").read()
        h2 = set(re.findall(r'<h2 class="af-subHeader" id="(sec\d+)"', src))
        lab = re.search(r'<div class="cf-lab"[^>]*>(.*)$', src, flags=re.S)
        exs = re.findall(r'<div class="cf-exercise"([^>]*)>(.*?)<script type="application/json" class="exSpec">(.*?)</script>', lab.group(1) if lab else "", flags=re.S)
        issues, ids, run_specs = [], [], []
        for attrs, body, spec in exs:
            at = dict(re.findall(r'([\w-]+)="([^"]*)"', attrs)); eid = at.get("id", "?"); kind = at.get("data-kind", "code"); ids.append(eid)
            if kind not in ("code", "blanks", "run", "quiz", "text"): issues.append(f"{eid}: unknown kind “{kind}”")
            if at.get("data-section") not in h2: issues.append(f"{eid}: data-section “{at.get('data-section')}” is not a section of the article")
            try: sp = json.loads(spec)
            except Exception as e: issues.append(f"{eid}: invalid JSON spec ({e})"); continue
            if kind == "quiz":
                n_opt = len(re.findall(r"<li>", body)); ans = sp.get("answer") or []
                if not ans or any(not isinstance(i, int) or i < 0 or i >= n_opt for i in ans): issues.append(f"{eid}: quiz answer {ans} outside its {n_opt} options")
            elif kind == "text" and not (sp.get("accept") or sp.get("regex")): issues.append(f"{eid}: text exercise without accept/regex")
            elif kind == "blanks" and body.count("___") != len(sp.get("blanks") or []): issues.append(f"{eid}: {body.count('___')} gaps but {len(sp.get('blanks') or [])} blank rule(s)")
            elif kind == "run":
                if not sp.get("tests") or not sp.get("solution"): issues.append(f"{eid}: run exercise needs tests and a solution")
                else: run_specs.append((eid, sp))
            elif kind == "code" and not sp.get("checks"): issues.append(f"{eid}: code exercise without checks")
        if run_specs and shutil.which("node"):
            js = ("const S=JSON.parse(require('fs').readFileSync(0,'utf8'));const out=[];for(const [id,sp] of S){for(const t of sp.tests){let g;"
                  "try{g=new Function(sp.solution+'\\n;return ('+t.call+');')();}catch(e){g='ERR '+e.message}"
                  "if(JSON.stringify(g)!==JSON.stringify(t.expect))out.push(id+': solution fails '+t.call.slice(0,50)+' → '+JSON.stringify(g))}}console.log(JSON.stringify(out))")
            r = subprocess.run(["node", "-e", js], input=json.dumps(run_specs), capture_output=True, text=True)
            try: issues += json.loads(r.stdout or "[]")
            except Exception: issues.append("could not run the run-kind solutions with node")
        links = re.findall(r'class="cf-labLink" href="#lab-([^"]+)"', src)
        issues += [f"link to #lab-{h} has no exercise" for h in links if h not in ids]
        issues += [f"{i}: no section links to it" for i in ids if i not in links]
        if len(exs) < 3: issues.append(f"only {len(exs)} exercise(s); a post needs at least 3 (5 recommended)")
        if 'id="labBody"' not in page_html: issues.append("Lab drawer not rendered on the page")
        rep("LAB", not issues, f"{len(exs)} exercise(s), {len(links)} section link(s), {len(run_specs)} run-kind solution(s) tested" if not issues else "; ".join(issues[:4]) + (f" (+{len(issues)-4} more)" if len(issues) > 4 else ""))

    # ---------- language ----------
    html_lang = re.search(r'<html lang="([^"]+)"', page_html).group(1)
    combo = re.findall(r'<option value="([^"]+)"', page_html)
    i18n_ok = os.path.exists(os.path.join(ROOT, "_data", "i18n", f"{a.lang}.yml"))
    parity = ""
    if i18n_ok:
        try:
            import yaml
            en = yaml.safe_load(open(os.path.join(ROOT, "_data/i18n/en.yml"), encoding="utf-8"))["ui"]
            cur = yaml.safe_load(open(os.path.join(ROOT, "_data/i18n", f"{a.lang}.yml"), encoding="utf-8"))["ui"]
            miss = sorted(set(en) - set(cur)); parity = f"; dictionary missing keys: {miss}" if miss else "; dictionary complete"
            i18n_ok = not miss
        except Exception as e: parity = f"; dictionary error: {e}"; i18n_ok = False
    art = re.search(r'<div class="cf-article">(.*?)<!-- /cf-article -->', page_html, flags=re.S)
    text = re.sub(r"<svg.*?</svg>|<pre.*?</pre>|<[^>]+>", " ", art.group(1) if art else post["content"], flags=re.S)
    det, scores = detect_lang(htmlmod.unescape(text))
    sc = ", ".join(f"{k}={v:.2f}" for k, v in sorted(scores.items(), key=lambda kv: -kv[1])[:3])
    ok = html_lang == a.lang and a.lang in combo and i18n_ok and det == a.lang
    rep("LANG", ok, f"html lang={html_lang}; combobox={'/'.join(combo)}; text reads as {det} ({sc}){parity}")

    # ---------- SEO: what every post must carry for search engines and social networks ----------
    head = page_html.split("</head>")[0]
    desc = re.search(r'<meta name="description" content="([^"]*)"', head)
    dlen = len(htmlmod.unescape(desc.group(1))) if desc else 0
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', head)
    alts = re.findall(r'<link rel="alternate" hreflang="([^"]+)"', head)
    ogimg = re.search(r'<meta property="og:image" content="([^"]+)"', head)
    img_ok, img_msg = False, "no og:image"
    if ogimg:
        rel = re.sub(r"^https?://[^/]+", "", ogimg.group(1))
        local = os.path.join(ROOT, rel.lstrip("/"))
        if rel.startswith("/assets/social/") and os.path.exists(local):
            try:
                from PIL import Image
                w, h = Image.open(local).size; img_ok = (w, h) == (1200, 630); img_msg = f"social card {os.path.basename(local)} {w}x{h}"
            except Exception: img_ok = True; img_msg = f"social card {os.path.basename(local)}"
        elif rel.startswith("/assets/social/"): img_msg = f"og:image {rel} missing — run scripts/make_social_card.py"
        else: img_msg = f"og:image is the default card ({rel}) — run scripts/make_social_card.py --key {a.key} --lang {a.lang}"
    body_art = art.group(1) if art else ""
    h2s = re.findall(r'<h2 class="af-subHeader" id="sec\d+">', body_art)
    stray = re.findall(r'<div class="af-subHeader" id="sec\d+">', body_art)
    jsonld_ok = False
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', head, flags=re.S)
    if m:
        try: jsonld_ok = any(n.get("@type") == "TechArticle" for n in json.loads(m.group(1)).get("@graph", []))
        except Exception: jsonld_ok = False
    problems = []
    if not desc or dlen == 0: problems.append("no meta description")
    elif dlen > 160: problems.append(f"description has {dlen} chars (max 160)")
    if not canon: problems.append("no canonical")
    if a.lang not in alts or "x-default" not in alts: problems.append(f"hreflang incomplete ({'/'.join(alts) or 'none'})")
    if not img_ok: problems.append(img_msg)
    if len(h2s) < 5 or stray: problems.append(f"{len(h2s)} h2 section heading(s), {len(stray)} still <div> — sections must be <h2 class=\"af-subHeader\" id=\"secN\">")
    if not jsonld_ok: problems.append("JSON-LD without a TechArticle node")
    cover = post.get("cover") or ""
    if not cover.startswith("/assets/covers/") or not os.path.exists(os.path.join(ROOT, cover.lstrip("/"))):
        problems.append("no cover illustration (front matter cover: /assets/covers/<slug>.svg, see the skill step 3a)")
    rep("SEO", not problems, ("; ".join(problems)) if problems else f"description {dlen} chars; canonical; hreflang {'/'.join(alts)}; {img_msg}; {len(h2s)} h2 sections; TechArticle JSON-LD")

    print_summary(results)
    if server: server.terminate()
    sys.exit(0 if all(r[1] is not False for r in results) else 1)

def print_summary(results):
    fails = [r for r in results if r[1] is False]
    print("-" * 60); print(("ALL CHECKS PASSED" if not fails else f"{len(fails)} CHECK(S) FAILED: " + ", ".join(r[0] for r in fails)))

if __name__ == "__main__":
    main()
