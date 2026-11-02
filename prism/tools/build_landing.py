"""Generate /prism.html (the landing page at the site root) from prism/index.html.

Run from the repository root after editing prism/index.html:  python3 prism/tools/build_landing.py
Relative links are prefixed with prism/ so the page loads the same CSS, scripts and assets.
"""
import re
from pathlib import Path

src = Path(__file__).resolve().parents[1] / 'index.html'
out = src.parents[1] / 'prism.html'
html = src.read_text()
html = re.sub(r'(href|src|poster)="(?!https?:|#|mailto:|data:|/)([^"]+)"', r'\1="prism/\2"', html)
html = html.replace("location.replace('app/' + location.hash)", "location.replace('prism/app/' + location.hash)")
html = html.replace('<link rel="icon"', '<link rel="canonical" href="https://asiyetajwa.github.io/me/prism.html">\n  <link rel="icon"', 1)
out.write_text(html)
print('wrote', out)
