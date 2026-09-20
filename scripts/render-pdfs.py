#!/usr/bin/env python3
"""Render src/print/*.html to public/print/*.pdf with Chromium (pip install playwright && playwright install chromium),
then bundle the care sheets into public/print/comfort-kit.pdf (pip install pypdf)."""
import glob, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(f'{ROOT}/public/print', exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    import json
    from pypdf import PdfReader
    targets = {p['slug']: p.get('pages', 1) for p in json.load(open(f'{ROOT}/src/content/printables.json'))}
    for f in sorted(glob.glob(f'{ROOT}/src/print/*.html')):
        slug = os.path.basename(f)[:-5]; target = targets.get(slug, 1); out = f'{ROOT}/public/print/{slug}.pdf'
        pg = b.new_page(); pg.goto('file://' + f); pg.wait_for_timeout(150)
        # Fit to the intended page count: a sheet that spills three lines onto a second page is shrunk slightly instead.
        for cls in ['', 'fit-95', 'fit-90', 'fit-85', 'fit-80']:
            pg.evaluate(f"document.documentElement.className={cls!r}")
            pg.pdf(path=out, format='Letter', print_background=True, prefer_css_page_size=True)
            n = len(PdfReader(out).pages)
            if n <= target: break
        print('pdf', slug, n, 'page(s)', cls or 'at 100%')
    b.close()
try:
    from pypdf import PdfWriter, PdfReader
    w = PdfWriter()
    for slug in ['when-you-dont-know-what-to-say', 'grief', 'hospital-room', 'waiting-for-test-results', 'end-of-life', 'caregivers', 'for-tonight', 'funeral-scripture']:
        for page in PdfReader(f'{ROOT}/public/print/{slug}.pdf').pages: w.add_page(page)
    w.add_metadata({'/Title': 'Better Verses Comfort Kit', '/Author': 'Better Verses'})
    with open(f'{ROOT}/public/print/comfort-kit.pdf', 'wb') as fh: w.write(fh)
    print('kit: comfort-kit.pdf')
except ImportError:
    print('pypdf not installed; skipped the pack', file=sys.stderr)
