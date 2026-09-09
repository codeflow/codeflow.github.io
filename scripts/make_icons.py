#!/usr/bin/env python3
"""Generates every icon and social image of the site from assets/codeflow.png (the logo).

Outputs (all committed, regenerate only when the logo changes):
  assets/icons/icon-192.png, icon-512.png           transparent, purpose "any"
  assets/icons/icon-maskable-192.png, -512.png      white background + safe-zone padding, purpose "maskable"
  assets/icons/apple-touch-icon.png                 180x180, white background (iOS ignores transparency)
  favicon.ico                                       16/32/48
  assets/og-default.png                             1200x630 social card (Open Graph / Twitter)
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "assets", "codeflow.png")
OUT = os.path.join(ROOT, "assets", "icons")
os.makedirs(OUT, exist_ok=True)

logo = Image.open(LOGO).convert("RGBA")

def fit(img, size):
    return img.resize((size, size), Image.LANCZOS)

def on_background(size, scale, bg=(255, 255, 255, 255)):
    """logo centred on a solid square, occupying `scale` of the side."""
    canvas = Image.new("RGBA", (size, size), bg)
    inner = fit(logo, round(size * scale))
    off = (size - inner.width) // 2
    canvas.alpha_composite(inner, (off, off))
    return canvas

# transparent icons (purpose any)
for s in (192, 512):
    fit(logo, s).save(os.path.join(OUT, f"icon-{s}.png"), optimize=True)
# maskable icons: the safe zone is the central 80%, so the logo takes 62% of the side
for s in (192, 512):
    on_background(s, 0.62).save(os.path.join(OUT, f"icon-maskable-{s}.png"), optimize=True)
# apple touch icon: iOS rounds the corners itself and fills transparency with black, so use a white ground
on_background(180, 0.78).save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
# favicon.ico with three sizes
fit(logo, 48).save(os.path.join(ROOT, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

# ---- social card 1200x630: brand gradient, logo, wordmark, tagline ----
W, H = 1200, 630
card = Image.new("RGBA", (W, H))
draw = ImageDraw.Draw(card)
top, mid, bot = (0x54, 0x74, 0x9B), (0x3A, 0x5C, 0x86), (0x1F, 0x3F, 0x63)
for y in range(H):
    t = y / (H - 1)
    if t < 0.48:
        k = t / 0.48; c = tuple(round(top[i] + (mid[i] - top[i]) * k) for i in range(3))
    else:
        k = (t - 0.48) / 0.52; c = tuple(round(mid[i] + (bot[i] - mid[i]) * k) for i in range(3))
    draw.line([(0, y), (W, y)], fill=c + (255,))
draw.rectangle([0, H - 10, W, H], fill=(0x8F, 0xB2, 0xD9, 255))      # thin light bar at the bottom, like the hero

def font(name, size):
    for p in (f"/System/Library/Fonts/Supplemental/{name}.ttf", f"/Library/Fonts/{name}.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

# white rounded plate with the logo
plate = 300
px, py = 110, (H - plate) // 2
draw.rounded_rectangle([px, py, px + plate, py + plate], radius=36, fill=(255, 255, 255, 255))
inner = fit(logo, 232)
card.alpha_composite(inner, (px + (plate - inner.width) // 2, py + (plate - inner.height) // 2))

tx = px + plate + 70
draw.text((tx, 205), "CODEFLOW", font=font("Tahoma Bold", 96), fill=(255, 255, 255, 255))
draw.text((tx + 4, 322), "Technology Articles and References", font=font("Tahoma", 40), fill=(0xDA, 0xE6, 0xF2, 255))
draw.text((tx + 4, 390), "Artificial Intelligence  ·  Generative AI", font=font("Tahoma", 30), fill=(0xB9, 0xCD, 0xE3, 255))
draw.text((tx + 4, 470), "codeflow.com.br", font=font("Tahoma Bold", 30), fill=(0xFF, 0xFF, 0xFF, 230))
card.convert("RGB").save(os.path.join(ROOT, "assets", "og-default.png"), optimize=True)
print("icons and social card written")

# ---- logo glow: a soft light ring hugging the OUTER contour of the hexagon (the inside stays dark) ----
# The outline of the logo is made of separate chevrons, so the outer contour is the convex hull of its opaque pixels.
from PIL import ImageFilter
def convex_hull(points):
    points = sorted(set(points))
    if len(points) <= 2: return points
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower = []
    for pt in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], pt) <= 0: lower.pop()
        lower.append(pt)
    upper = []
    for pt in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], pt) <= 0: upper.pop()
        upper.append(pt)
    return lower[:-1] + upper[:-1]

alpha = logo.getchannel("A")
w, h = alpha.size
pix = alpha.load()
pts = [(x, y) for y in range(h) for x in range(w) if pix[x, y] > 128]
hull = convex_hull(pts)
PAD = 40                                   # source px around the 200px logo (= 4px around the 20px logo on screen)
S = w + 2 * PAD
shape = Image.new("L", (S, S), 0)
ImageDraw.Draw(shape).polygon([(x + PAD, y + PAD) for x, y in hull], fill=255)
outer = shape.filter(ImageFilter.MaxFilter(31))          # contour grown by 15px (1.5px on screen)
ring = Image.new("L", (S, S), 0)
ring.paste(outer)
ring.paste(0, mask=shape)                                # subtract the hexagon itself: nothing inside the contour
ring = ring.filter(ImageFilter.GaussianBlur(9))          # soft edge
glow = Image.new("RGBA", (S, S), (250, 253, 255, 0))       # near-white light
glow.putalpha(ring)
glow.save(os.path.join(ROOT, "assets", "logo-glow.png"), optimize=True)
print("logo glow written (%dx%d, ring hugging the outer contour)" % (S, S))
