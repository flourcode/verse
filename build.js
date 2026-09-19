#!/usr/bin/env node
/**
 * Better Verses — static site generator.
 *   node build.js          → writes dist/
 *   node build.js --check  → validates content only, no output
 *
 * Zero runtime dependencies. Everything is plain Node (>=18).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from './site.config.js';
import { urlFor, home, searchPage, topicsHub, topicPage, today, random, staticPage, notFound, versesIndex, versePage, journalIndex, journalPost, ministryHub, guidePage } from './src/lib/pages.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const CHECK = process.argv.includes('--check');
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

// ---------- load ----------
const versesArr = json('src/data/verses.json');
if (site.divineName && site.divineName !== 'Yahweh') for (const v of versesArr) if (v.text) v.text = renderDivineName(v.text, site.divineName);
function renderDivineName(text, name) {
  // "Yahweh is my shepherd" → "The LORD is my shepherd"; "trust in Yahweh" → "trust in the LORD"
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  return text.replace(/\bYahweh\b/g, (m, i, str) => {
    const before = str.slice(0, i).replace(/[“"‘'(\s]+$/, '');
    const startsSentence = before === '' || /[.!?;:]$/.test(before);
    return startsSentence ? cap : name;
  });
}
const clusters = json('src/data/clusters.json');
const aliases = json('src/data/aliases.json');
const dailyRaw = json('src/data/daily.json');
const pages = [...json('src/content/topics.json'), ...json('src/content/situations.json'), ...json('src/content/occasions.json')];
const staticDir = join(ROOT, 'src/content/pages');
const versePages = json('src/content/verses-pages.json');
const guides = json('src/content/guides.json');
const journalDir = join(ROOT, 'src/content/journal');
const posts = (await Promise.all(readdirSync(journalDir).filter((f) => f.endsWith('.js')).map(async (f) => (await import(join(journalDir, f))).default))).sort((a, b) => b.date.localeCompare(a.date));
const bible = JSON.parse(readFileSync(join(ROOT, 'src/data/bible.json'), 'utf8'));
const statics = await Promise.all(readdirSync(staticDir).filter((f) => f.endsWith('.js')).sort().map(async (f) => (await import(join(staticDir, f))).default));

// ---------- validate ----------
const errors = [];
const warn = [];
const verses = Object.fromEntries(versesArr.map((v) => [v.id, v]));
const slugs = new Set();
for (const p of pages) {
  const at = `${p.type}/${p.slug}`;
  if (slugs.has(p.slug)) errors.push(`${at}: duplicate slug`);
  slugs.add(p.slug);
  for (const k of ['slug', 'type', 'cluster', 'title', 'h1', 'label', 'for', 'description', 'intro', 'verses', 'related', 'faq']) if (p[k] == null) errors.push(`${at}: missing "${k}"`);
  if (!clusters.some((c) => c.id === p.cluster)) errors.push(`${at}: unknown cluster "${p.cluster}"`);
  if (!p.verses || p.verses.length < 7) warn.push(`${at}: only ${p.verses?.length ?? 0} verses (spec asks for 7–10)`);
  if (p.verses && p.verses.length > 10) warn.push(`${at}: ${p.verses.length} verses (spec asks for 7–10)`);
  for (const e of p.verses || []) {
    if (!verses[e.id]) errors.push(`${at}: unknown verse id "${e.id}"`);
    if (!verses[e.id]?.text) errors.push(`${at}: verse "${e.id}" has no text — run \`npm run verses:sync\``);
    const w = (e.why || '').split(/\s+/).filter(Boolean).length;
    if (w < 40) warn.push(`${at}: "${e.id}" why-note is short (${w} words)`);
    if (w > 170) warn.push(`${at}: "${e.id}" why-note is long (${w} words)`);
  }
  for (const k of p.picks || []) if (!verses[k.id]) errors.push(`${at}: unknown pick verse "${k.id}"`);
  if (!aliases[p.slug] || !aliases[p.slug].length) warn.push(`${at}: no aliases — the home finder can't match it`);
  if (p.description && (p.description.length > 165 || p.description.length < 60)) warn.push(`${at}: meta description is ${p.description.length} chars`);
  if (p.title && p.title.length > 65) warn.push(`${at}: title is ${p.title.length} chars`);
  if (p.faq && p.faq.length < 2) warn.push(`${at}: fewer than 2 FAQ items`);
}
for (const p of pages) for (const r of p.related) if (!slugs.has(r)) errors.push(`${p.type}/${p.slug}: related slug "${r}" does not exist`);
for (const p of pages) if (p.related.length < 3 || p.related.length > 6) warn.push(`${p.type}/${p.slug}: ${p.related.length} related links (spec asks for 3–6)`);
for (const d of dailyRaw) if (!verses[d.id]) errors.push(`daily: unknown verse id "${d.id}"`);
for (const v of versePages) for (const r of v.related || []) if (!slugs.has(r)) errors.push(`verses/${v.slug}: related "${r}" does not exist`);
for (const g of guides) { for (const r of g.related || []) if (!slugs.has(r)) errors.push(`ministry/${g.slug}: related "${r}" does not exist`); for (const sec of g.sections) for (const r of sec.refs) if (r.page && !slugs.has(r.page)) errors.push(`ministry/${g.slug}: page "${r.page}" does not exist`); }
for (const p of posts) { for (const r of p.related || []) if (!slugs.has(r)) errors.push(`journal/${p.slug}: related "${r}" does not exist`); for (const v of p.versePages || []) if (!versePages.some((x) => x.slug === v)) errors.push(`journal/${p.slug}: verse page "${v}" does not exist`); }
for (const v of versesArr) if (!v.text) errors.push(`verses: "${v.id}" has no text — run \`npm run verses:sync\``);
for (const s of Object.keys(aliases)) if (!slugs.has(s)) warn.push(`aliases: "${s}" has no page`);
// Orphan check: every page must be linked from at least one other page (hub links everything; related links add depth).
const inbound = Object.fromEntries([...slugs].map((s) => [s, 0]));
for (const p of pages) for (const r of p.related) inbound[r]++;
for (const [s, n] of Object.entries(inbound)) if (n === 0) warn.push(`${s}: no inbound related links (reachable via hub only)`);

if (warn.length) console.warn(warn.map((w) => `  warn  ${w}`).join('\n'));
if (errors.length) { console.error(errors.map((e) => `  ERROR ${e}`).join('\n')); process.exit(1); }
console.log(`✓ ${pages.length} topic pages, ${versesArr.length} verses, ${dailyRaw.length} daily entries, ${statics.length} static pages validated`);
if (CHECK) process.exit(0);

// ---------- context ----------
for (const p of pages) p.url = urlFor(p);
const epochDay = Math.floor(Date.now() / 86400000);            // UTC day number at build; the browser swaps to the reader's local day (app.js todayEntry)
const dailyIndex = epochDay % dailyRaw.length;
const dailyPool = dailyRaw.map((d) => ({ ...verses[d.id], context: d.context, question: d.question }));
const daily = { pool: dailyPool, index: dailyIndex, entry: dailyPool[dailyIndex], isoDate: new Date().toISOString().slice(0, 10) };
const ctx = { pages, clusters, verses, daily, aliases, bible, versePages, posts, guides };

// ---------- write ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
const out = [];
function write(path, html) {
  const file = path.endsWith('.html') ? join(DIST, path) : join(DIST, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, relativize(html, path));
  out.push(path);
}
// Root-relative links ("/assets/main.css") become relative ("../../assets/main.css") so the built
// folder also works when opened straight from disk, from a sub-folder, or on any host.
function relativize(html, path) {
  const depth = path.endsWith('.html') ? path.split('/').length - 2 : path.split('/').filter(Boolean).length;
  const prefix = '../'.repeat(depth);
  return html.replace(/\b(href|src|action)="\/(?!\/)([^"]*)"/g, (m, attr, rest) => `${attr}="${rest === '' ? (prefix || './') : prefix + rest}"`);
}

write('/', home(ctx));
write('/search/', searchPage());
write('/topics/', topicsHub(ctx));
write('/today/', today(ctx));
write('/random/', random(ctx));
for (const p of pages) write(p.url, topicPage(p, ctx));
for (const s of statics) write(s.path, staticPage(s));
write('/verses/', versesIndex(ctx));
for (const v of versePages) write(`/verses/${v.slug}/`, versePage(v, ctx));
write('/journal/', journalIndex(ctx));
for (const p of posts) write(`/journal/${p.slug}/`, journalPost(p, ctx));
write('/ministry/', ministryHub(ctx));
for (const g of guides) write(`/ministry/${g.slug}/`, guidePage(g, ctx));
const nf = notFound();
write('/404.html', nf);           // Cloudflare Pages / Netlify / Amplify convention
write('/404/', nf);               // GitHub Pages + direct link fallback

// assets
mkdirSync(join(DIST, 'assets'), { recursive: true });
cpSync(join(ROOT, 'src/styles/main.css'), join(DIST, 'assets/main.css'));
cpSync(join(ROOT, 'src/scripts/app.js'), join(DIST, 'assets/app.js'));
cpSync(join(ROOT, 'src/scripts/search.js'), join(DIST, 'assets/search.js'));
if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), DIST, { recursive: true });

// finder data (used by home search, random page). Small on purpose: ~30 KB.
const finder = {
  verses: Object.fromEntries(versesArr.map((v) => [v.id, { ref: v.reference, text: v.text, jesus: v.jesus, jesusFrom: v.jesusFrom }])),
  redLetter: !!site.redLetter,
  pages: pages.map((p) => ({ slug: p.slug, url: p.url, title: p.title, h1: p.h1, label: p.label, for: p.for, cluster: p.cluster, aliases: aliases[p.slug] || [], verses: p.verses.map((e) => ({ id: e.id, why: e.why })), related: p.related })),
  suggestions: ['worry', 'peace', 'courage', 'hope', 'difficult-decisions', 'overwhelmed'],
  versePages: Object.fromEntries(versePages.map((v) => [v.ref, { url: `/verses/${v.slug}/`, h1: v.h1 }])),
};
mkdirSync(join(DIST, 'data'), { recursive: true });
writeFileSync(join(DIST, 'data/finder.json'), JSON.stringify(finder));
// Full Bible + concept lists for the in-browser search. Loaded as scripts so they also work from a folder on disk.
writeFileSync(join(DIST, 'data/bible.js'), 'window.__BIBLE__=' + JSON.stringify(bible).replace(/</g, '\\u003c') + ';');
writeFileSync(join(DIST, 'data/kjv.js'), 'window.__KJV__=' + JSON.stringify(Object.fromEntries(Object.entries(json('src/data/kjv.json')).filter(([k]) => !k.startsWith('_')))) + ';');
writeFileSync(join(DIST, 'data/sayings.js'), 'window.__SAYINGS__=' + JSON.stringify(json('src/data/sayings.json')) + ';');
writeFileSync(join(DIST, 'data/synonyms.js'), 'window.__SYN__=' + JSON.stringify(json('src/data/synonyms.json')) + ';');
writeFileSync(join(DIST, 'data/finder.js'), 'window.__FINDER__=' + JSON.stringify(finder).replace(/</g, '\\u003c') + ';');

// sitemap: indexable canonical URLs only
const excluded = new Set(site.sitemapExclude);
const urls = out.filter((u) => !u.endsWith('.html') && !excluded.has(u.replace(/^\/|\/$/g, '').split('/').pop() || 'home') && !excluded.has(u.replace(/^\/|\/$/g, '')));
const today_ = new Date().toISOString().slice(0, 10);
const prio = (u) => (u === '/' ? '1.0' : /^\/(topics|today|verses|journal|ministry)\/$/.test(u) ? '0.8' : /^\/(topics|situations|occasions|verses|journal|ministry)\//.test(u) ? '0.7' : '0.3');
const freq = (u) => (u === '/today/' ? 'daily' : u === '/' ? 'weekly' : 'monthly');
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc><lastmod>${today_}</lastmod><changefreq>${freq(u)}</changefreq><priority>${prio(u)}</priority></url>`).join('\n')}\n</urlset>\n`);

// llms.txt (https://llmstxt.org): a Markdown index for AI agents. H1, one-line summary, links by section.
const md = (u, t, d) => `- [${t}](${site.url}${u})${d ? `: ${d}` : ''}`;
const byType = (t) => pages.filter((p) => p.type === t).map((p) => md(p.url, p.h1, p.description));
writeFileSync(join(DIST, 'llms.txt'), `# ${site.name}

> ${site.tagline} ${site.defaultDescription}

Every verse is quoted from the World English Bible (public domain) and comes with a short editorial note explaining who wrote it, to whom, and why it fits the situation. Verses are chosen for their context, not because a line sounds inspirational on its own. The site is a static HTML site with no login; all pages are freely readable. Please attribute quotations of our editorial notes to ${site.name} (${site.url}).

## Start here

${md('/', 'Home', 'Find the right Bible verse to comfort someone you care about; search every verse in plain English or start from the moment they are in')}
${md('/search/', 'Search the Bible', 'The person and the moment, a phrase, a topic, or a reference; runs in the browser')}
${md('/topics/', 'All topics', 'Every page, grouped by feelings, work, family, health, changes, decisions, money, and occasions')}
${md('/today/', 'Verse for today', 'One verse a day, with context and a reflection question')}
${md('/how-we-choose-verses/', 'How we choose verses', 'The selection method')}
${md('/editorial-policy/', 'Editorial policy', 'Who writes the pages, tone, what we never claim')}
${md('/about/', 'About', 'What the site is and is not')}

## Feelings and themes

${byType('topic').join('\n')}

## Situations

${byType('situation').join('\n')}

## Cards and occasions

${byType('occasion').join('\n')}

## Famous verses in context

${md('/verses/', 'Famous verses, in context')}
${versePages.map((v) => md(`/verses/${v.slug}/`, v.h1, v.description)).join('\n')}

## Journal

${md('/journal/', 'Journal')}
${posts.map((p) => md(`/journal/${p.slug}/`, p.title, p.description)).join('\n')}

## For ministry

${md('/ministry/', 'For Ministry', 'Scripture tools for pastors, teachers, and ministry leaders')}
${guides.map((g) => md(`/ministry/${g.slug}/`, g.title, g.description)).join('\n')}

## Optional

${md('/contact/', 'Contact', 'Report a wrong verse or suggest a topic')}
${md('/privacy/', 'Privacy policy')}
${md('/terms/', 'Terms of use')}
${md('/sitemap.xml', 'XML sitemap')}
`);

// robots.txt: generated from config so the sitemap URL is always right
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /404/\n\nSitemap: ${site.url}/sitemap.xml\n`);

// _redirects / _headers for hosts that support them (Cloudflare Pages, Netlify). Harmless elsewhere.
writeFileSync(join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/data/*\n  Cache-Control: public, max-age=3600\n`);
writeFileSync(join(DIST, '_redirects'), `https://www.${site.domain}/* ${site.url}/:splat 301\n`);

// ---------- link check ----------
const internal = new Set(out.map((u) => u.replace(/index\.html$/, '')));
let broken = 0;
for (const u of out) {
  const file = u.endsWith('.html') ? join(DIST, u) : join(DIST, u, 'index.html');
  const html = readFileSync(file, 'utf8');
  const base = u.endsWith('.html') ? u.replace(/[^/]*$/, '') : u;
  for (const m of html.matchAll(/(?:href|src)="([^"#?:]*)"/g)) {
    if (!m[1] || m[1].startsWith('#') || m[1].startsWith('mailto')) continue;
    const h = new URL(m[1], 'http://x' + base).pathname;
    if (/\.(css|js|svg|png|xml|txt|json|woff2|webmanifest|yml|pdf)$/.test(h)) { if (!existsSync(join(DIST, h))) { console.error(`  broken asset ${h} on ${u}`); broken++; } continue; }
    if (!internal.has(h)) { console.error(`  broken link ${h} on ${u}`); broken++; }
  }
}
if (broken) process.exit(1);

const size = (dir) => readdirSync(dir).reduce((n, f) => { const p = join(dir, f); const s = statSync(p); return n + (s.isDirectory() ? size(p) : s.size); }, 0);
console.log(`✓ wrote ${out.length} pages to dist/ (${(size(DIST) / 1024).toFixed(0)} KB), sitemap has ${urls.length} URLs, today's verse index ${dailyIndex}/${dailyRaw.length} (${daily.entry.reference})`);
