#!/usr/bin/env python3
"""Render src/print/*.html to public/print/*.pdf with Chromium (pip install playwright && playwright install chromium),
then bundle the pastoral-care sheets into public/print/pastoral-care-pack.pdf (pip install pypdf)."""
import glob, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(f'{ROOT}/public/print', exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    for f in sorted(glob.glob(f'{ROOT}/src/print/*.html')):
        slug = os.path.basename(f)[:-5]
        pg = b.new_page(); pg.goto('file://' + f); pg.wait_for_timeout(150)
        pg.pdf(path=f'{ROOT}/public/print/{slug}.pdf', format='Letter', print_background=True, prefer_css_page_size=True)
        print('pdf', slug)
    b.close()
try:
    from pypdf import PdfWriter, PdfReader
    w = PdfWriter()
    for slug in ['funeral-scripture', 'hospital-room', 'grief', 'waiting-for-test-results', 'end-of-life', 'caregivers', 'when-you-dont-know-what-to-say', 'for-tonight']:
        for page in PdfReader(f'{ROOT}/public/print/{slug}.pdf').pages: w.add_page(page)
    w.add_metadata({'/Title': 'Better Verses Pastoral Care Pack', '/Author': 'Better Verses'})
    with open(f'{ROOT}/public/print/pastoral-care-pack.pdf', 'wb') as fh: w.write(fh)
    print('pack: pastoral-care-pack.pdf')
except ImportError:
    print('pypdf not installed; skipped the pack', file=sys.stderr)
