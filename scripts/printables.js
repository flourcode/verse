#!/usr/bin/env node
/**
 * Printables. One content file (src/content/printables.json) → a print-ready HTML for each sheet in src/print/,
 * which scripts/render-pdfs.py turns into public/print/<slug>.pdf (and the Comfort Kit).
 * The landing pages at /printables/<slug>/ are built by build.js from the same file.
 *   npm run printables
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const bible = json('src/data/bible.json');
const printables = json('src/content/printables.json');
const guides = json('src/content/guides.json');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function passage(ref) {
  const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref); const bk = bible.books.find((b) => b.n.toLowerCase() === m[1].toLowerCase());
  const ch = bk.c[+m[2] - 1]; const out = []; for (let v = +m[3]; v <= +(m[4] || m[3]); v++) out.push(ch[v - 1]);
  return out.join(' ');
}
const clean = (t) => t.replace(/^[“"]+|[”"]+$/g, '');

const CSS = `
@page { size: Letter; margin: 0.45in 0.5in; }
* { box-sizing: border-box; }
body { margin: 0; font: 10pt/1.38 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #182019; }
.kicker { font: 700 8.5pt/1.3 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #2E7D32; margin: 0 0 3pt; }
h1 { font: 700 21pt/1.12 Georgia, "Times New Roman", serif; margin: 0 0 6pt; letter-spacing: -.01em; }
.moment { color: #59635B; margin: 0 0 8pt; font-size: 9.5pt; }
h2 { font: 700 8.5pt/1.3 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #2E7D32; margin: 10pt 0 4pt; break-after: avoid; }
.note { color: #59635B; font-size: 9.5pt; margin: 0 0 5pt; }
.v { margin: 0 0 5pt; padding: 5pt 7pt; background: #F4FAF4; border-radius: 6pt; break-inside: avoid; }
.v b { display: block; font-size: 9.5pt; color: #2E7D32; margin-bottom: 1pt; }
.v q { font: 10.5pt/1.32 Georgia, "Times New Roman", serif; quotes: "“" "”"; }
.v.big q { font-size: 12.5pt; }
.v .why { display: block; font-size: 9pt; color: #59635B; margin-top: 3pt; }
.cols { column-count: 2; column-gap: 16pt; }
html.fit-95 body { zoom: .95; } html.fit-90 body { zoom: .9; } html.fit-85 body { zoom: .85; } html.fit-80 body { zoom: .8; }
.one { max-width: 5.2in; margin: 0 auto; }
.say { font-size: 9.5pt; margin: 0 0 4pt; padding-left: 10pt; text-indent: -10pt; }
.say::before { content: "·"; margin-right: 6pt; color: #2E7D32; }
.dont { font-size: 9.5pt; margin: 0 0 4pt; color: #59635B; padding-left: 10pt; text-indent: -10pt; }
.dont::before { content: "×"; margin-right: 6pt; color: #B8372B; }
.use { font-size: 9.5pt; color: #182019; margin: 0; }
.foot { margin-top: 10pt; padding-top: 6pt; border-top: 1px solid #D7E1D9; font-size: 8.5pt; color: #59635B; }
`;
export const FOOT = `Better Verses · Free to print and share · Scripture from the World English Bible, public domain · betterverses.com`;
const V = (r, big) => `<div class="v${big ? ' big' : ''}"><b>${esc(r.ref)}</b><q>${esc(clean(passage(r.ref)))}</q>${r.why ? `<span class="why">${esc(r.why)}</span>` : ''}</div>`;

function sheet(p) {
  const body = `
<p class="kicker">${esc(p.kicker || 'Better Verses')}</p>
<h1>${esc(p.h1)}</h1>
<p class="moment">${esc(p.moment)}</p>
<div class="${p.leave ? 'one' : 'cols'}">
${p.sections.map((s) => `<h2>${esc(s.h)}</h2>${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}${s.refs.map((r) => V(r, p.leave)).join('')}`).join('')}
${p.say && p.say.length ? `<h2>What to say</h2>${p.say.map((l) => `<p class="say">${esc(l)}</p>`).join('')}` : ''}
${p.dontSay && p.dontSay.length ? `<h2>What not to say</h2>${p.dontSay.map((l) => `<p class="dont">${esc(l)}</p>`).join('')}` : ''}
${p.use ? `<h2>How to use this</h2><p class="use">${esc(p.use)}</p>` : ''}
</div>
<p class="foot">${FOOT}</p>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${esc(p.title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

mkdirSync(join(ROOT, 'src/print'), { recursive: true });
for (const p of printables) writeFileSync(join(ROOT, 'src/print', `${p.slug}.html`), sheet(p));
// The two originals: the funeral guide (from guides.json) and the hospital-room card.
const g = guides.find((x) => x.slug === 'funeral-scripture');
writeFileSync(join(ROOT, 'src/print/funeral-scripture.html'), sheet({ kicker: 'For clergy, families, and funeral directors', h1: g.h1, title: g.title, moment: g.intro, sections: g.sections.map((s) => ({ h: s.h, note: s.note, refs: s.refs })), say: [], use: g.howToUse }));
writeFileSync(join(ROOT, 'src/print/hospital-room.html'), sheet({
  kicker: 'For the bedside, the waiting room, and the drive over', h1: 'Scripture for the hospital room', title: 'Scripture for the hospital room',
  moment: 'Eight passages that hold up at a bedside, and a few words to say with them. Read one. Then stop. Presence matters more than words.',
  sections: [
    { h: 'Before surgery', refs: [{ ref: 'Isaiah 41:10', why: 'Five promises in one verse, said to people who had every reason to be afraid. The last one is a hand.' }, { ref: 'Exodus 33:14', why: 'God’s answer to Moses when Moses was afraid to go forward without him. The presence goes in with you.' }, { ref: 'Psalm 4:8', why: 'For the night before. Sleep is possible because someone else is on watch.' }] },
    { h: 'Waiting for news', refs: [{ ref: 'Psalm 112:7', why: 'A heart steady before the result, not after it.' }, { ref: 'Philippians 4:6-7', why: 'Not a feeling but a practice: each worry turned into a request, with thanks. The peace stands guard.' }] },
    { h: 'A long stay', refs: [{ ref: 'Matthew 11:28-30', why: 'For the patient and for the exhausted family in the chair. The rest on offer is a burden that fits.' }, { ref: 'Psalm 23:1-4', why: 'Confident because of the shepherd, not because the road is safe.' }] },
    { h: 'When there are no words', refs: [{ ref: 'Psalm 34:18', why: 'Near to the brokenhearted. It asks nothing of the person but being broken. Read it and sit down.' }] },
  ],
  say: ['Arriving: “I don’t have anything wise to say. I just wanted to be here.”', 'Offering a verse: “Can I read you something short? You don’t have to say anything back.”', 'Leaving: “I’ll be back Thursday. You don’t need to remember that; I will.”'],
  dontSay: ['“Everything happens for a reason.” “God won’t give you more than you can handle.” Neither is in the Bible, and both put the weight back on the person in the bed.'],
  use: 'Read one. Then stop. Presence matters more than words.',
}));
console.log(`wrote ${printables.length + 2} print sheets to src/print/`);
