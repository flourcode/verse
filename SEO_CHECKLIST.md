# SEO checklist

Technical SEO is handled by the build; this list is what to verify and what to keep doing.

## Built in (verify once after deploy)

- [ ] Every page has a unique `<title>` (≤ 60 chars) and `<meta name="description">` (120–160 chars). The build warns when a page is outside those ranges.
- [ ] Every page has a self-referencing `<link rel="canonical">` on the https apex origin.
- [ ] `<meta name="robots">` is `index,follow` on content pages and `noindex,follow` on the 404. Nothing else is noindexed.
- [ ] Only one origin serves the site. `www.` and `http://` both 301 to `https://betterverses.com`.
- [ ] `/sitemap.xml` lists home, hub, today, all topic/situation/occasion pages, and the four indexable trust pages. It excludes privacy, terms, affiliate disclosure, random, and 404.
- [ ] `/robots.txt` allows everything, disallows `/404/`, and points to the sitemap.
- [ ] `/llms.txt` is generated from the page list: H1, summary, and a link to every page with its description (llmstxt.org format).
- [ ] JSON-LD: `WebSite` + `Organization` on the home page; `BreadcrumbList` on every deep page. **No** `FAQPage`, `Review`, `AggregateRating`, or `Article` schema. Adding those to pages that don't warrant them is a manual-action risk.
- [ ] Breadcrumbs on every non-home page match the JSON-LD.
- [ ] Open Graph tags and `og-default.png` (1200×630) render correctly in a link preview (test with a messaging app or a preview tool).
- [ ] No orphan pages. Every topic page is linked from the hub and from at least one other page's Related list (the build warns if not).
- [ ] Unknown URLs return HTTP 404 (not 200) with the branded 404 page.
- [ ] Search results are client-side only. `/search/?q=…` URLs canonicalise to `/search/`, which is excluded from the sitemap; Google should index the hand-picked topic pages, not searches.
- [ ] Every topic page links to `/search/?q=<topic>` ("Search the whole Bible for…"), so SEO landing pages feed the tool.

## Performance

- [ ] Lighthouse mobile ≥ 95 on Performance, Accessibility, Best Practices, SEO for the home page and one topic page.
- [ ] No render-blocking third-party scripts. GA4 loads `async` from `/analytics.js` only once an id is pasted in; AdSense only when configured.
- [ ] `/assets/*` served with a long `Cache-Control` (the `_headers` file does this on Cloudflare/Netlify; configure it manually elsewhere).
- [ ] Fonts are self-hosted and preloaded with `font-display: swap`; text is visible before they arrive. No third-party requests on any page.
- [ ] Verify Core Web Vitals in Search Console after 28 days of data.

## Content quality (the part that actually ranks)

- [ ] Each topic page's first screen answers the query on its own: H1, a plain intro, and the primary verse with a specific note.
- [ ] Every why-note is 50–120 words and specific to the verse *and* the page. No note would work under a different verse.
- [ ] FAQs are questions people ask, with answers you'd want. Delete any FAQ that exists to hold a keyword.
- [ ] No page targets a query the site can't serve well. Fewer, better pages beat more, thinner ones. See `CONTENT_GUIDE.md`.
- [ ] Trust pages (about, how we choose verses, editorial policy, contact) are complete and all `TODO` markers are resolved.
- [ ] Safety lines are present on health, grief, abuse, and money pages and don't read as legal boilerplate.

## Launch (Search Console)

1. Add a Domain property and verify via DNS TXT.
2. Submit `https://betterverses.com/sitemap.xml`.
3. URL Inspection on `/`, `/topics/`, and one topic page: confirm "available to Google" and the expected canonical.
4. Request indexing for the home page, the hub, and 3–4 strong topic pages. Don't bulk-request.
5. Rich Results Test on the home page (WebSite, Organization) and a topic page (BreadcrumbList).
6. Link GA4 (if enabled) to Search Console.

## Ongoing

**Monthly**
- [ ] Search Console → Pages: look at "Why pages aren't indexed." Fix by improving the page or its internal links, not by adding pages.
- [ ] Search Console → Performance: sort queries by impressions with low CTR. Improve the title/description of the matching page, or, if the query is a real situation we don't cover, add it to the content roadmap.
- [ ] Check for queries landing on the wrong page (e.g., "verses for surgery" landing on `/topics/courage/`). Add aliases and strengthen the correct page's intro.
- [ ] Re-run `npm run build` and confirm zero warnings after any content change.

**Quarterly**
- [ ] Re-read the ten highest-traffic pages as a stranger. Rewrite anything that reads as filler.
- [ ] Review Related links: are the strongest pages linked from enough places? Are weak pages leaning on strong ones without returning the link?
- [ ] Check the daily rotation for entries that have drifted in tone.
- [ ] Verify all external links (privacy page opt-out links, etc.) still resolve.

**When adding a page**
- [ ] Slug will never change. Title ≤ 60, description 120–160.
- [ ] 7–10 verses, first is the primary, genres varied.
- [ ] 3–6 related links out, at least 1 in (edit other pages).
- [ ] Aliases added.
- [ ] Build passes clean. Deploy. Sitemap updates automatically; no need to resubmit.

**Never**
- Add FAQ, Review, or Rating schema.
- Create pages for crisis keywords.
- Buy links, syndicate content, or spin variants of an existing page.
- Enable ads before the privacy page and any required consent banner are in place.
