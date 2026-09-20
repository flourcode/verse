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

export const MARK = `<svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M9.47 10.67Q9.47 10.67 10.96 10.60Q12.46 10.53 14.89 10.43Q17.33 10.32 20.19 10.23Q23.05 10.13 25.83 10.07Q28.62 10.00 30.73 10.00Q38.67 10.00 43.29 11.22Q47.90 12.43 49.88 14.67Q51.86 16.90 51.86 19.98Q51.86 22.92 50.32 24.91Q48.78 26.90 45.63 28.35Q47.85 29.10 49.88 30.49Q51.91 31.88 53.22 34.35Q54.53 36.83 54.53 40.89Q54.53 44.64 53.00 47.07Q51.46 49.51 48.89 50.91Q46.32 52.31 43.17 52.97Q40.01 53.63 36.75 53.81Q33.48 54.00 30.60 54.00Q29.66 54.00 27.53 53.95Q25.41 53.89 22.72 53.81Q20.03 53.73 17.36 53.63Q14.68 53.52 12.55 53.42Q10.43 53.33 9.47 53.28ZM26.18 30.22Q28.46 29.34 30.56 28.34Q32.66 27.33 33.99 26.02Q35.33 24.71 35.33 22.92Q35.33 21.74 34.43 21.18Q33.54 20.62 32.63 20.62Q31.72 20.62 30.62 21.01Q29.53 21.39 28.54 21.90Q27.55 22.41 26.89 22.81Q26.24 23.21 26.18 23.27ZM36.75 36.77Q36.75 35.54 35.99 35.04Q35.22 34.53 34.10 34.53Q32.90 34.53 31.40 35.14Q29.90 35.76 28.51 36.53Q27.12 37.31 26.18 37.76V44.50L27.57 43.97Q30.36 42.93 32.41 42.00Q34.47 41.08 35.61 39.86Q36.75 38.65 36.75 36.77Z" fill="currentColor"/></svg>`;

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
<link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3">
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
