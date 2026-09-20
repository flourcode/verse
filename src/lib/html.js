import site from '../../site.config.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const TR = `${site.translation.name} (${site.translation.abbr})`;

/** Verse text with the words of Jesus marked (red-letter), when enabled in site.config.js. */
export function verseText(v) {
  const t = esc(v.text);
  if (!site.redLetter || !v.jesus) return `<q>${t}</q>`;
  if (v.jesus === true) return `<q><span class="rl" title="Words of Jesus">${t}</span></q>`;
  let i = v.text.indexOf(v.jesusFrom || '');
  if (i < 0) return `<q>${t}</q>`;
  if (i > 0 && /[“"]/.test(v.text[i - 1])) i--;
  return `<q>${esc(v.text.slice(0, i))}<span class="rl" title="Words of Jesus">${esc(v.text.slice(i))}</span></q>`;
}
export const trLine = (v) => (site.redLetter && v.jesus ? `${TR} · <span class="rl-key">Words of Jesus in red</span>` : TR);

export const MARK = `<svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M31.32 55.00Q28.28 55.00 24.27 54.74Q20.26 54.48 14.31 54.48Q12.88 52.74 12.88 50.41Q15.08 50.41 15.99 49.66Q16.89 48.92 16.89 47.11V16.70Q16.89 14.89 15.99 14.14Q15.08 13.40 12.88 13.40Q12.88 11.07 14.31 9.32Q18.90 9.32 21.62 9.23Q24.33 9.13 26.24 9.06Q28.15 9.00 30.09 9.00Q35.72 9.00 39.34 10.00Q42.97 11.01 45.00 12.59Q47.04 14.18 47.85 16.08Q48.66 17.99 48.66 19.87Q48.66 23.49 46.78 26.08Q44.91 28.67 40.44 30.54Q46.01 31.71 48.56 34.17Q51.12 36.63 51.12 41.80Q51.12 44.32 50.28 46.69Q49.44 49.05 47.27 50.92Q45.10 52.80 41.22 53.90Q37.34 55.00 31.32 55.00ZM29.51 28.99Q34.23 28.99 36.21 26.92Q38.18 24.85 38.18 21.36Q38.18 17.86 36.27 15.79Q34.36 13.72 30.22 13.72Q29.57 13.72 28.83 13.79Q28.09 13.85 27.57 13.98V28.86Q28.02 28.93 28.54 28.96Q29.06 28.99 29.51 28.99ZM30.29 50.28Q39.34 50.28 39.34 42.45Q39.34 38.05 37.11 35.85Q34.88 33.65 29.70 33.65Q29.19 33.65 28.57 33.68Q27.96 33.71 27.57 33.71V50.08Q28.02 50.15 28.73 50.21Q29.44 50.28 30.29 50.28Z" fill="currentColor"/></svg>`;

const ARROW = `<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

// ---------- structured data ----------
export function jsonld(obj) { return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`; }

export const orgLd = () => ({ '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: site.url + '/', logo: site.url + '/favicon.svg', slogan: site.tagline, email: site.contactEmail });
export const siteLd = () => ({ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, alternateName: 'BetterVerses.com', url: site.url + '/', description: site.defaultDescription, publisher: { '@type': 'Organization', name: site.name } });
export const crumbsLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: site.url + c.url })),
});

// ---------- layout ----------
/**
 * page: { path, title, description, canonical?, noindex?, wide?, nav?, body, ld?: [], og? }
 */
export function layout(page) {
  const canonical = site.url + (page.canonical || page.path);
  const robots = page.noindex ? 'noindex,follow' : 'index,follow';
  const title = page.fullTitle || `${page.title} | ${site.name}`;
  // Analytics lives in /analytics.js (public/analytics.js in the repo): paste the GA4 id there. Loads nothing until you do.
  const ga = '<script src="/analytics.js" defer></script>';
  const ads = site.ads.enabled && site.ads.client
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.ads.client}" crossorigin="anonymous"></script>`
    : '';
  const navItems = [['/search/', 'Search'], ['/topics/', 'Topics'], ['/journal/', 'Journal'], ['/ministry/', 'For Ministry']];
const menuItems = [['/search/', 'Search'], ['/topics/', 'Topics'], ['/today/', 'Today’s verse'], ['/verses/', 'Verses in context'], ['/journal/', 'Journal'], ['/ministry/', 'For Ministry'], ['/about/', 'About']];
  return `<!doctype html>
<html lang="en" data-site="${site.url}" data-tr="${esc(TR)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${robots}${page.noindex ? '' : ',max-snippet:-1,max-image-preview:large'}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1511" media="(prefers-color-scheme: dark)">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(page.fullTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${site.url}${site.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.name)}: ${esc(site.tagline)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.fullTitle || page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${site.url}${site.ogImage}">
<meta name="twitter:image:alt" content="${esc(site.name)}: ${esc(site.tagline)}">
<link rel="icon" href="/favicon.svg?v=6" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=6">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/source-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/main.css">
${page.finder ? '<script src="/data/finder.js" defer></script>' : ''}
${page.search ? '<script src="/assets/search.js" defer></script>' : ''}
${ga}
<script src="/assets/app.js" defer></script>
${(page.ld || []).map(jsonld).join('\n')}
${ads}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
  <div class="wrap bar__in">
    <a class="brand" href="/" aria-label="${esc(site.name)} home">${MARK}<span>${esc(site.name)}</span></a>
    <nav class="nav" aria-label="Main">${navItems.map(([h, l]) => `<a href="${h}"${page.path.startsWith(h) ? ' aria-current="page"' : ''}>${l}</a>`).join('')}<details class="menu"><summary aria-label="Menu"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Menu</span></summary><ul class="menu__list">${menuItems.map(([h, l]) => `<li><a href="${h}"${page.path.startsWith(h) ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}</ul></details></nav>
  </div>
</header>
<main id="main" class="${page.wide ? 'wrap' : 'wrap wrap--narrow'}">
${page.body}
</main>
<footer class="foot">
  <div class="wrap">
    <ul>
      ${site.newsletter && site.newsletter.url ? `<li><a href="${esc(site.newsletter.url)}">Weekly email</a></li>` : ''}
      <li><a href="/verses/">Verses in context</a></li>
      <li><a href="/journal/">Journal</a></li>
      <li><a href="/ministry/">For Ministry</a></li>
      <li><a href="/about/">About</a></li>
      <li><a href="/what-we-believe/">What I believe</a></li>
      <li><a href="/how-we-choose-verses/">How I choose verses</a></li>
      <li><a href="/how-to-read-a-verse/">How to read a verse</a></li>
      <li><a href="/editorial-policy/">Editorial policy</a></li>
      <li><a href="/contact/">Contact</a></li>
      <li><a href="/privacy/">Privacy</a></li>
      <li><a href="/terms/">Terms</a></li>
      <li><a href="/affiliate-disclosure/">Affiliate disclosure</a></li>
    </ul>
    <p>Bible text: ${esc(site.translation.name)} (${esc(site.translation.note)})</p>
    <p>© ${esc(site.name)}</p>
  </div>
</footer>
${adSlot('footer')}
</body>
</html>`;
}

// ---------- components ----------
export function adSlot(kind) {
  if (!site.ads.enabled || !site.ads.client) return '';
  const cls = kind === 'inline' ? 'ad-slot ad-slot-inline' : kind === 'footer' ? 'ad-slot ad-slot-footer' : 'ad-slot';
  return `<div class="${cls}"><ins class="adsbygoogle" style="display:block" data-ad-client="${site.ads.client}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>`;
}

export function breadcrumbs(items) {
  return `<ol class="crumbs" aria-label="Breadcrumb">${items.map((c, i) => i === items.length - 1
    ? `<li aria-current="page">${esc(c.name)}</li>`
    : `<li><a href="${c.url}">${esc(c.name)}</a></li>`).join('')}</ol>`;
}

/** Verse card. Same markup the client script produces, so JS swaps are seamless. */
export function verseCard(v, ctx, why, opts = {}) {
  return `<article class="verse" data-slug="${esc(ctx.slug || '')}">
  ${ctx.for ? `<p class="verse__for">For ${esc(ctx.for)}</p>` : ''}
  <p class="verse__ref">${esc(v.reference)}</p>
  <p class="verse__text" lang="en">${verseText(v)}</p>
  <p class="verse__tr">${trLine(v)}</p>
  ${why ? `<div class="verse__why"><h3>Why this fits</h3><p>${esc(why)}</p></div>` : ''}
  <div class="verse__actions">
    ${opts.another !== false ? `<button class="btn btn--primary" type="button" data-act="another">Another verse</button>` : ''}
    <button class="btn btn--ghost" type="button" data-act="copy">Copy</button>
    <button class="btn btn--ghost" type="button" data-act="share">Share</button>
  </div>
  ${ctx.url && opts.seeAll !== false ? `<p class="verse__more"><a href="${ctx.url}">See all verses for ${esc(ctx.for || ctx.label)}</a></p>` : ''}
</article>`;
}

export function situationCard(p) {
  return `<li><a class="card card--sit" href="${p.url}"><strong>${esc(p.label)}</strong></a></li>`;
}

export function relatedList(pages) {
  if (!pages.length) return '';
  return `<section class="related"><h2>Related</h2><ul>${pages.map((p) => `<li><a href="${p.url}">${esc(p.h1)}</a></li>`).join('')}</ul></section>`;
}

export function trustCallout() {
  return `<aside class="trust"><strong>Context matters.</strong> I pick verses because their setting connects to the moment, not because a line sounds inspiring on its own. <a href="/how-we-choose-verses/">How I choose verses</a> · <a href="/how-to-read-a-verse/">Check one yourself in two minutes</a></aside>`;
}

export function faq(items) {
  if (!items || !items.length) return '';
  return `<section class="faq"><h2>Common questions</h2>${items.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>`;
}
