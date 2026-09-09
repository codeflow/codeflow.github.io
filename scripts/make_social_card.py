#!/usr/bin/env python3
"""Social card (Open Graph / Twitter, 1200x630) for one post, in the post's own language.

usage: make_social_card.py --key <slug> --lang <lang>        (or --all to regenerate every post)

Writes assets/social/<slug>.<lang>.png and sets `image:` in the post's front matter when missing.
Brand gradient, logo plate, kicker with the category label of that language, the title wrapped on up to
three lines, and a footer with the site, the reading time and the language name.
"""
import argparse, glob, os, re, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "social")
W, H = 1200, 630

def font(name, size):
    for p in (f"/System/Library/Fonts/Supplemental/{name}.ttf", f"/Library/Fonts/{name}.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def yaml_scalar(text, key):
    m = re.search(r"^%s:\s*(.+?)\s*$" % re.escape(key), text, re.M)
    if not m:
        return None
    v = m.group(1)
    if v[:1] in "\"'" and v[-1:] == v[:1]:
        v = v[1:-1]
    return v

def i18n(lang):
    """native language name, 'min' label and the labels map of _data/i18n/<lang>.yml (no YAML library needed)."""
    p = os.path.join(ROOT, "_data", "i18n", f"{lang}.yml")
    t = open(p, encoding="utf-8").read() if os.path.exists(p) else ""
    native = yaml_scalar(t, "native") or lang
    minl = re.search(r"^\s+min:\s*(.+?)\s*$", t, re.M)
    labels = {}
    block = re.search(r"^labels:\n((?:[ \t]+.*\n?)+)", t, re.M)
    if block:
        for line in block.group(1).splitlines():
            m = re.match(r'\s+"?([^":]+)"?:\s*"?([^"]+?)"?\s*$', line)
            if m:
                labels[m.group(1)] = m.group(2)
    return native, (minl.group(1).strip('"\'') if minl else "min"), labels

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if draw.textlength(trial, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur); cur = w_
    if cur:
        lines.append(cur)
    return lines

def gradient():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    top, mid, bot = (0x54, 0x74, 0x9B), (0x3A, 0x5C, 0x86), (0x1F, 0x3F, 0x63)
    for y in range(H):
        t = y / (H - 1)
        if t < 0.48:
            k = t / 0.48; c = tuple(round(top[i] + (mid[i] - top[i]) * k) for i in range(3))
        else:
            k = (t - 0.48) / 0.52; c = tuple(round(mid[i] + (bot[i] - mid[i]) * k) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)
    d.rectangle([0, H - 10, W, H], fill=(0x8F, 0xB2, 0xD9))
    return img

def build(path):
    src = open(path, encoding="utf-8").read()
    fm_end = src.index("\n---", 4)
    fm = src[4:fm_end]
    title = yaml_scalar(fm, "title") or ""
    lang = yaml_scalar(fm, "lang") or "en"
    key = yaml_scalar(fm, "key") or re.sub(r"^\d{4}-\d{2}-\d{2}-", "", os.path.basename(path)).split(".")[0]
    category = yaml_scalar(fm, "category") or ""
    minutes = yaml_scalar(fm, "reading_time") or ""
    native, min_label, labels = i18n(lang)
    cat_label = labels.get(category, category)

    img = gradient().convert("RGBA")
    d = ImageDraw.Draw(img)
    # logo plate (top-left) + kicker
    logo = Image.open(os.path.join(ROOT, "assets", "codeflow.png")).convert("RGBA").resize((72, 72), Image.LANCZOS)
    d.rounded_rectangle([80, 70, 176, 166], radius=16, fill=(255, 255, 255, 255))
    img.alpha_composite(logo, (92, 82))
    d.text((204, 84), "CODEFLOW", font=font("Tahoma Bold", 40), fill=(255, 255, 255, 255))
    d.text((204, 130), (cat_label or "").upper(), font=font("Tahoma", 24), fill=(0xB9, 0xCD, 0xE3, 255))
    # title, up to three lines, shrinking the font if needed
    size = 58
    while True:
        f = font("Tahoma Bold", size)
        lines = wrap(d, title, f, W - 160)
        if len(lines) <= 3 or size <= 40:
            break
        size -= 4
    y = 218
    for ln in lines[:3]:
        d.text((80, y), ln, font=f, fill=(255, 255, 255, 255)); y += int(size * 1.22)
    # footer
    foot = "codeflow.com.br"
    if minutes:
        foot += f"   ·   {minutes} {min_label}"
    foot += f"   ·   {native}"
    d.text((80, 540), foot, font=font("Tahoma", 28), fill=(0xDA, 0xE6, 0xF2, 255))

    os.makedirs(OUT, exist_ok=True)
    out_rel = f"/assets/social/{key}.{lang}.png"
    img.convert("RGB").save(os.path.join(ROOT, out_rel.lstrip("/")), optimize=True)
    # front matter: image
    if not re.search(r"^image:", fm, re.M):
        fm2 = fm.replace("\ndescription:", f'\nimage: "{out_rel}"\ndescription:', 1) if "\ndescription:" in fm else fm + f'\nimage: "{out_rel}"'
        open(path, "w", encoding="utf-8").write(src[:4] + fm2 + src[fm_end:])
    print("card:", out_rel, "|", len(lines), "line(s) at", size, "px")

ap = argparse.ArgumentParser()
ap.add_argument("--key"); ap.add_argument("--lang", default="en"); ap.add_argument("--all", action="store_true")
a = ap.parse_args()
if a.all:
    for p in sorted(glob.glob(os.path.join(ROOT, "_posts", "*.html"))):
        build(p)
elif a.key:
    suffix = "" if a.lang == "en" else "." + a.lang
    hits = glob.glob(os.path.join(ROOT, "_posts", f"*-{a.key}{suffix}.html"))
    if not hits:
        sys.exit(f"no post found for key {a.key} / {a.lang}")
    build(hits[0])
else:
    ap.print_help()
