from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# page.html → clean path (leading slash)
PAGE_MAP = {
    "index.html": "/",
    "countdown.html": "/countdown",
    "download-calculator.html": "/download-calculator",
    "cost-calculator.html": "/cost-calculator",
    "launch-planner.html": "/launch-planner",
    "edition-quiz.html": "/edition-quiz",
    "support.html": "/support",
    "about.html": "/about",
    "privacy.html": "/privacy",
    "404.html": "/404",
}

# Longer keys first so edition-quiz.html before quiz.html etc.
REPLACEMENTS = sorted(PAGE_MAP.items(), key=lambda kv: len(kv[0]), reverse=True)


def rewrite_html(text: str) -> str:
    for old, new in REPLACEMENTS:
        # href="page.html" or href='page.html'
        text = text.replace(f'href="{old}"', f'href="{new}"')
        text = text.replace(f"href='{old}'", f"href='{new}'")
        # canonical / og absolute URLs
        text = text.replace(f"https://example.com/{old}", f"https://example.com{new if new != '/' else '/'}")
        # Fix double slash if any (example.com//)
        text = text.replace("https://example.com//", "https://example.com/")
    # canonical for home already /
    # Fix 404 canonical to https://example.com/404
    text = text.replace("https://example.com/404.html", "https://example.com/404")
    return text


for html in root.glob("*.html"):
    raw = html.read_text(encoding="utf-8")
    out = rewrite_html(raw)
    if out != raw:
        html.write_text(out, encoding="utf-8", newline="\n")
        print("updated", html.name)
    else:
        print("unchanged", html.name)

sitemap = root / "public" / "sitemap.xml"
sm = sitemap.read_text(encoding="utf-8")
for old, new in REPLACEMENTS:
    if old == "index.html":
        continue
    if old == "404.html":
        continue
    sm = sm.replace(f"https://example.com/{old}", f"https://example.com{new}")
sitemap.write_text(sm, encoding="utf-8", newline="\n")
print("sitemap updated")
print(sm)
