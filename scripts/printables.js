#!/usr/bin/env node
/**
 * Printables: one-page sheets people keep in a binder or a glovebox.
 *   node scripts/printables.js     → writes src/print/*.html (then render to PDF; see README)
 * The PDFs in public/print/ are committed; regenerate them when the source text changes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const bible = json('src/data/bible.json');
const guides = json('src/content/guides.json');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function passage(ref) {
  const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref); const bk = bible.books.find((b) => b.n.toLowerCase() === m[1].toLowerCase());
  const ch = bk.c[+m[2] - 1]; const out = []; for (let v = +m[3]; v <= +(m[4] || m[3]); v++) out.push(ch[v - 1]);
  return out.join(' ');
}

const CSS = `
@page { size: Letter; margin: 0.6in 0.65in; }
* { box-sizing: border-box; }
body { margin: 0; font: 10.5pt/1.4 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #182019; }
h1 { font: 700 20pt/1.15 Georgia, "Times New Roman", serif; margin: 0 0 4pt; letter-spacing: -.01em; }
.sub { color: #59635B; margin: 0 0 12pt; font-size: 10pt; }
h2 { font: 700 9pt/1.3 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #2E7D32; margin: 12pt 0 4pt; }
.note { color: #59635B; font-size: 9.5pt; margin: 0 0 6pt; }
.v { margin: 0 0 7pt; padding: 6pt 8pt; background: #F5FAF6; border-radius: 6pt; break-inside: avoid; }
.v b { display: block; font-size: 9.5pt; color: #2E7D32; margin-bottom: 1pt; }
.v q { font: 11pt/1.35 Georgia, "Times New Roman", serif; quotes: "“" "”"; }
.v .why { display: block; font-size: 9pt; color: #59635B; margin-top: 3pt; }
.cols { column-count: 2; column-gap: 18pt; }
.foot { margin-top: 10pt; padding-top: 6pt; border-top: 1px solid #D7E1D9; font-size: 8.5pt; color: #59635B; }
.say { font-size: 9.5pt; margin: 0 0 8pt; }
.say b { color: #182019; }
`;
const clean = (t) => t.replace(/^[“"]+|[”"]+$/g, '');
const V = (ref, why, text) => `<div class="v"><b>${esc(ref)}</b><q>${esc(clean(text || passage(ref)))}</q>${why ? `<span class="why">${esc(why)}</span>` : ''}</div>`;
const foot = (name) => `<p class="foot">${esc(name)} · Free to print and copy. Scripture from the World English Bible, public domain. More at ${site.url.replace('https://', '')}</p>`;

// ---------- 1. Scripture for the hospital room (one page) ----------
const hospital = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Scripture for the hospital room</title><style>${CSS}</style></head><body>
<h1>Scripture for the hospital room</h1>
<p class="sub">Eight passages that hold up at a bedside, and a few words to say with them. Read one. Then stop. Presence matters more than words.</p>
<div class="cols">
<h2>Before surgery</h2>
${V('Isaiah 41:10', 'Five promises in one verse, said to people who had every reason to be afraid. The last one is a hand.')}
${V('Exodus 33:14', 'God’s answer to Moses when Moses was afraid to go forward without him. The presence goes in with you.')}
${V('Psalm 4:8', 'For the night before. Sleep is possible because someone else is on watch.')}
<h2>Waiting for news</h2>
${V('Psalm 112:7', 'A heart steady before the result, not after it. The only kind of steadiness available while the phone hasn’t rung.')}
${V('Philippians 4:6-7', 'Not a feeling but a practice: each worry turned into a request, with thanks. The peace stands guard.')}
<h2>A long stay</h2>
${V('Matthew 11:28-30', 'For the patient and for the exhausted family in the chair. The rest on offer is a burden that fits.')}
${V('Psalm 23:1-4', 'Confident because of the shepherd, not because the road is safe. It names the valley without flinching.')}
<h2>When there are no words</h2>
${V('Psalm 34:18', 'Near to the brokenhearted. It asks nothing of the person but being broken. Read it and sit down.')}
<h2>What to say</h2>
<p class="say"><b>Arriving:</b> “I don’t have anything wise to say. I just wanted to be here.”</p>
<p class="say"><b>Offering a verse:</b> “Can I read you something short? You don’t have to say anything back.”</p>
<p class="say"><b>Leaving:</b> “I’ll be back Thursday. You don’t need to remember that; I will.”</p>
<p class="say"><b>Don’t say:</b> “Everything happens for a reason.” “God won’t give you more than you can handle.” Neither is in the Bible, and both put the weight back on the person in the bed.</p>
</div>
${foot('Better Verses')}
</body></html>`;

// ---------- 2. Funeral Scripture by situation (two pages) ----------
const g = guides.find((x) => x.slug === 'funeral-scripture');
const funeral = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Funeral Scripture by situation</title><style>${CSS}</style></head><body>
<h1>Funeral Scripture by situation</h1>
<p class="sub">${esc(g.intro)}</p>
<div class="cols">
${g.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}${s.refs.map((r) => V(r.ref, r.why)).join('')}`).join('')}
<h2>How to use this</h2>
<p class="note">${esc(g.howToUse)}</p>
</div>
${foot('Better Verses')}
</body></html>`;

mkdirSync(join(ROOT, 'src/print'), { recursive: true });
writeFileSync(join(ROOT, 'src/print/hospital-room.html'), hospital);
writeFileSync(join(ROOT, 'src/print/funeral-scripture.html'), funeral);
console.log('wrote src/print/hospital-room.html, src/print/funeral-scripture.html');
