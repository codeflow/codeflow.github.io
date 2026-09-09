#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Codeflow — validate that a post is fully wired into the site.

  python3 scripts/validate_post.py --key <slug> --lang <lang> [--site http://localhost:4000] [--build]

Checks (each prints PASS/FAIL/INFO):
  TREE      the Content Navigator (rendered by the site's own JS in headless Chrome) has the post link under its
            category and topic
  SEARCH    /search.json has the post, and a search with a word of its title finds it (same rule as the site JS)
  TAGS      every tag of the post is in the tag counts; which ones are visible in Popular Tags (top 10)
  ARCHIVE   the post's month appears in the Archive section
  LIST      the post appears in Published Articles (page 1 when it is among the 6 newest of its language)
  FIT       SVG labels inside boxes: how many had to be condensed (textLength) to fit, none beyond 15%
  GEOM      SVG connectors start/end on box edges, never run over a box drawn before them, never cross a text
  LANG      <html lang>, the combobox option, the i18n dictionary (same keys as en.yml) and a stop-word language
            detector over the article text all agree with --lang
Exit code 0 when every check passes.
"""
import argparse, json, os, re, subprocess, sys, time, urllib.request, urllib.parse, html as htmlmod
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
    ap.add_argument("--site", default="http://localhost:4000"); ap.add_argument("--build", action="store_true")
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
    months = json.loads(re.search(r"months:\s*(\[.*?\])", dom).group(1))
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

    # ---------- language ----------
    page_html = fetch(site + post["url"])
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

    print_summary(results)
    if server: server.terminate()
    sys.exit(0 if all(r[1] is not False for r in results) else 1)

def print_summary(results):
    fails = [r for r in results if r[1] is False]
    print("-" * 60); print(("ALL CHECKS PASSED" if not fails else f"{len(fails)} CHECK(S) FAILED: " + ", ".join(r[0] for r in fails)))

if __name__ == "__main__":
    main()
