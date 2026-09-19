# Better Verses

**betterverses.com** — The right verse to comfort someone you care about.

The core promise is comforting someone you care about with the right verse: a friend in grief, a parent before surgery, a coworker starting over. Under that sits a full-Bible search engine that runs entirely in the browser, hand-picked pages by situation, context pages for famous verses, a journal, and tools for ministry. No database, no API, no accounts, no framework. The World English Bible ships as one JSON file; the browser downloads it once (about 1.2 MB compressed), indexes it in a few hundred milliseconds, and answers every query locally. Nothing typed is sent anywhere.

## How search works (`src/scripts/search.js`)

One box, several strategies, every result labelled with why it matched:

| You type | What happens | Label shown |
| --- | --- | --- |
| `John 3:16`, `Psalm 23`, `matt 6 25-34` | Reference lookup (66 books, common abbreviations) | Reference |
| `be still and know`, `"do not be afraid"` | Exact phrase scan; quotes require it | Exact phrase |
| `clay`, `sparrows`, `debt` | Stemmed keyword match against every verse | Matches: clay |
| `worried about tomorrow` | Concept expansion from `src/data/synonyms.json` (anxiety → anxious, troubled, fear…) | Related to: anxiety |
| `Jesus on forgiveness`, `Paul running a race`, `Proverbs about the tongue` | Scope boost for the Gospels, Pauline letters, Psalms, Proverbs… | In the Gospels |
| `whore`, `smite`, `fear not`, `whosoever believeth`, `the LORD Almighty`, `steadfast love` | Wording from other Bibles (King James and modern ones) translated to the WEB's vocabulary (`src/data/kjv.json`, ~230 entries, plus -eth/-est endings) and said so, with a "search for exactly what I typed" link. Vocabulary only; no copyrighted verse text is stored | The WEB says prostitute where other translations say "whore" |
| `God won't give me more than I can handle`, `money root evil`, `lion and the lamb`, `Paul race`, `Moses burning bush`, `water into wine` | Famous lines, misquotes, people, stories, events and things that aren't in the Bible (`src/data/sayings.json`, ~180 entries, every reference validated against the text) | A card: Not in the Bible / Close, but not quite / You're thinking of… with the real verse |
| `shepard`, `frogivness`, `anixety` | Spelling correction against the Bible's own vocabulary (transpositions count as one edit), only after the glossary | No verse contains "shepard"; showing shepherd |
| `starting over`, `can't sleep` | Alias match to a hand-picked topic page; its verses are boosted and the page is offered above the results | Hand-picked for Starting over |

Scoring: exact phrase 100 · each keyword 20–32 (rarer words score higher; a KJV word and its WEB equivalents count once) · synonym 6–10 (never for a verse that already contains the word that triggered the concept) · words appearing close together in the order typed up to 25 · hand-picked 30 · scope 12 · plus up to 50 for matching everything you typed, minus a little for very long verses. There is no content filter of any kind; every verse is searchable. Filters: testament, book, match mode (best / all words / exact phrase). "In context" shows the surrounding seven verses. Results page 25 at a time.

To improve results, edit `synonyms.json` or `kjv.json` (add a concept or widen a list) and rebuild. Keys that are situations rather than ideas (surgery, graduation…) only expand when typed, so they never label unrelated verses; the list is `SITUATION` at the top of `search.js`.

`npm run bible:build` regenerates `src/data/bible.json` from the WEB package (needed only if you change `divineName`).

## Quick start

```bash
npm install          # only dev dependency: the public-domain WEB text, used by verses:sync
npm run build        # validates content and writes dist/
npm run serve        # build + local server at http://localhost:8080/
npm run check        # validate content without writing anything
npm run preview      # build + single-file preview/index.html (home page with CSS/JS/data inlined)
npm run verses:sync  # (re)load verse text from the World English Bible into src/data/verses.json
```

Requires Node 18 or newer. There is no other toolchain.

## What's in the box

```
site.config.js            Site name, canonical URL, contact email, analytics/ads switches, divine-name rendering
build.js                  The whole generator: load → validate → render → sitemap/robots/llms.txt → link check
src/
  content/
    topics.json           Feeling/theme pages        (/topics/{slug}/)
    situations.json       Situation pages            (/situations/{slug}/)
    occasions.json        Card/occasion pages        (/occasions/{slug}/)
    pages/*.js            Static pages: about, how-we-choose-verses, editorial-policy, contact, privacy, terms, affiliate-disclosure
  data/
    bible.json            The whole World English Bible, compact (built by bible:build)
    synonyms.json         Concept → word lists that power plain-English search
    verses.json           Hand-picked verses with WEB text (filled by verses:sync)
    daily.json            The "Today" rotation: verse id + context + one question
    clusters.json         Browse-by-moment groups (feelings, work, family, health, changes, decisions, money, occasions)
    aliases.json          Search phrases per page, used by the home-page finder
  lib/
    html.js               Layout, head/meta, JSON-LD, shared components
    pages.js              Page templates (home, hub, topic, today, random, static, 404)
  styles/main.css         All styles. Light/dark via prefers-color-scheme, reduced-motion aware
  scripts/app.js          All client JS (~9 KB). Progressive enhancement; every page works without it
scripts/
  sync-verses.js          Pulls exact WEB text for each hand-picked verse id
  build-bible.js          Builds the full-Bible JSON
  serve.js                Dev server with clean URLs and a 404
  preview.js              Inlines everything into one HTML file
public/                   Copied as-is: analytics.js (paste GA4 id here), favicon.svg, logo.svg, apple-touch-icon.png, og-default.png, fonts
dist/                     Build output (gitignored). Deploy this folder.
```

Launch set: full-Bible search (home and `/search/`), 31 hand-picked topic pages (12 topics, 16 situations, 3 occasion/card pages), 16 famous-verse context pages (`/verses/`), a journal with 4 launch articles (`/journal/`), a ministry hub with 3 guides (`/ministry/`), topics hub, today, random, seven trust pages, and a 404. 71 pages. 31,098 searchable verses, 156 hand-annotated ones, 31-entry daily rotation.

## The three layers

| Layer | Where | Purpose |
| --- | --- | --- |
| **Find it** | `/`, `/search/`, `/topics/`, `/situations/`, `/occasions/` | The utility and the SEO surface. Grow toward 200–400 exceptional pages, never programmatic ones. |
| **Understand it** | `/verses/`, `/journal/` | Authority: what famous passages actually say. `src/content/verses-pages.json` (one object per verse: ref, context, misread, use, related) and `src/content/journal/*.js` (one file per article; `<blockquote data-ref="Romans 8:28"></blockquote>` is filled with WEB text at build). |
| **Use it** | `/ministry/` | Tools for pastors, chaplains and teachers. `src/content/guides.json`: sections of references with a note each; text is pulled from the full Bible at build, so any reference works. |

Search links into the Understand layer: a hit that has a `/verses/` page shows "Why it's misread", and the sayings card links to the context page.

## Bible text

All verse text is the **World English Bible (WEB)**, which is public domain. `scripts/sync-verses.js` loads it from the `world-english-bible` npm package so nothing is retyped; the synced text is committed in `src/data/verses.json`, so the package is only needed when you add verses.

The WEB renders the divine name as "Yahweh". If you'd rather show the traditional "the LORD" (as the WEB British Edition does), set `divineName: 'the LORD'` in `site.config.js`. Either choice is public domain; the build handles sentence-start capitalization.

## Adding content

Read `CONTENT_GUIDE.md` first; it has the editorial rules and the template. Mechanically:

1. **Add verses** to `src/data/verses.json` with `id`, `book`, `chapter`, `start`, `end` (optional), `genre`. Leave `text` empty and run `npm run verses:sync`. Optional `excerptFrom` starts the quote mid-verse with an ellipsis.
2. **Add a page** object to `topics.json`, `situations.json`, or `occasions.json`. Required fields: `slug, type, cluster, title, h1, label, for, description, intent, intro, verses[{id, why}], related[], faq[{q, a}]`. Optional: `safety`, `howToUse`, and for occasions `picks[{kind, id}]` and `wording[]`.
3. **Add aliases** for the slug in `src/data/aliases.json` so the home-page search can find it.
4. Link to it from 3–6 existing pages' `related[]` lists (the build warns about pages with no inbound links).
5. `npm run build`. The build fails on unknown verse ids, unknown related slugs, or missing text, and warns on short notes, long titles, and thin FAQs.

To change the daily rotation, edit `src/data/daily.json`. The verse shown is `local day number mod pool length`, so it changes at the reader's local midnight; the build renders the UTC day's verse and the browser swaps in the local one if they differ, so a cached page is never stale.

## Configuration

Everything deployment-specific is in `site.config.js`:

| Key | What it does |
| --- | --- |
| `url` | Canonical origin. Used in canonicals, Open Graph, JSON-LD, sitemap, robots. No trailing slash. |
| `contactEmail` | Shown on contact/privacy/terms. **Placeholder until the mailbox exists.** |
| (analytics) | Not in this file. Paste your GA4 id into `public/analytics.js`; it ships to `/analytics.js` and every page loads it. Empty id = no request to Google. |
| `ads.enabled`, `ads.client` | Both must be set for any `.ad-slot` markup or the AdSense script to render. Keep `false` until you have real code and a consent solution where required. |
| `divineName` | `'Yahweh'` (WEB default) or `'the LORD'`. |
| `redLetter` | `true` prints the words of Jesus in red (verses flagged with `jesus` in `verses.json`; `"partial"` + `jesusFrom` for verses that start with narration). |
| `sitemapExclude` | Slugs left out of `sitemap.xml`. Default: privacy, terms, affiliate-disclosure, random, search, 404. |

Header: Search · Topics · Journal · For Ministry, plus a Menu with everything (Today, Verses in context, About). On phones only Search and the Menu show, so nothing scrolls sideways.

Analytics events the client sends (only once an id is in `analytics.js`): `bible_search` (result count and kind: reference / topic / text; never the query), `verse_search`, `topic_selected`, `another_verse`, `copy_verse`, `share_verse`, `related_topic_click`. Every parameter is a classified slug or method name. Free-text search input is never sent anywhere.

## Deploying

The output is `dist/`. Any static host works. Clean URLs (`/topics/worry/`) are served as `dist/topics/worry/index.html`, which every host below does by default.

**Cloudflare Pages** (recommended: free, fast, automatic HTTPS)
- Build command `npm run build`, output directory `dist`, Node 18+.
- `dist/_headers` and `dist/_redirects` are picked up automatically (cache headers, security headers, `www` → apex 301).
- Add the custom domain `betterverses.com`; Cloudflare handles the certificate.

**AWS Amplify Hosting** (this is the setup the repo is configured for)
- Push this whole repo to GitHub and connect it in Amplify. `amplify.yml` tells Amplify to run `npm run build` and serve `dist/`; nothing to configure in the console.
- `customHttp.yml` at the repo root sets security and caching headers.
- The 404 rule and the `www` redirect are set in the Amplify console under Rewrites and redirects (see the README section on go-live).
- Add a rewrite rule `</^[^.]+$|\.(?!(css|js|json|svg|png|xml|txt)$)([^.]+$)/>` → `/404.html` with status 404 so unknown paths return the branded 404.
- Under Domain management, add the apex and `www` and set `www` to redirect to the apex.

**GitHub Pages**
- Commit `dist/` output from a workflow (`actions/upload-pages-artifact` with `path: dist`) or use a `gh-pages` branch.
- `dist/404.html` is used automatically. Set the custom domain in repo settings; enable "Enforce HTTPS".

**Netlify**: publish directory `dist`; `_headers`/`_redirects` work as on Cloudflare.

Whatever host you use, make sure only one origin serves the site: `https://betterverses.com` (no `www`, no `http`). The `_redirects` file covers `www` on hosts that support it; on others, configure it at the DNS/host level.

## Launch checklist: Google Search Console

1. **Verify the domain.** In Search Console, add a *Domain* property for `betterverses.com` and verify with the DNS TXT record. A domain property covers `www`, `http`, and `https` variants together.
2. **Confirm the canonical origin.** Open `https://www.betterverses.com/` and `http://betterverses.com/` in a browser; both must 301 to `https://betterverses.com/`. Check `view-source` on any page: the `<link rel="canonical">` must point at the https apex.
3. **Submit the sitemap.** Sitemaps → add `https://betterverses.com/sitemap.xml`. It lists only indexable canonical pages (privacy, terms, affiliate disclosure, random, and 404 are excluded on purpose).
4. **Check robots.** Visit `https://betterverses.com/robots.txt`; it should allow everything and point at the sitemap. Run URL Inspection on the home page and one topic page; both should report "URL is available to Google" with the canonical you expect.
5. **Request indexing** for the home page, `/topics/`, and three or four of the strongest topic pages. Don't bulk-request; the sitemap does the rest.
6. **Validate structured data.** Run the home page through the Rich Results Test: it should show `WebSite` and `Organization`. A topic page should show `BreadcrumbList`. There is intentionally no FAQ or Review schema.
7. **Set up GA4** (optional). Create a property, paste the `G-` id into `analytics.js` (top of the file), deploy. Link GA4 to Search Console under Admin → Product links.
8. **After 2–4 weeks**, review Pages → "Why pages aren't indexed" and the Performance report. Fix any "Duplicate without user-selected canonical" or "Crawled – currently not indexed" pages by strengthening content or internal links, not by adding pages. Then work through `SEO_CHECKLIST.md`.

## Before going live

The trust pages assume: contact mailbox `hello@betterverses.com`, hosting on AWS Amplify (mailbox `hello@betterverses.com` must exist), policies dated September 19, 2026, no affiliate links yet, and a generic governing-law clause. Edit `src/content/pages/*.js` (or the built HTML directly) if any of those aren't true.

## Design notes

Mobile first, ~544px interactive width, ~704px reading width, Inter 17px for the interface and Source Serif for Scripture, both self-hosted variable woff2 files with `font-display: swap`, verse text 22–28px with a fluid clamp. Palette: white canvas, one confident leafy green (`#2F7D4B`) for the primary action, active nav and links, pale-green and mint containers, near-black text, and a celery accent (`#D8ED9B`) used only for tiny moments (the search-match highlight, the Today tag). Roughly 70% white, 15% very pale green, 10% mint, 5% strong green. Scripture is always near-black; the app is green, the Word is the content. Auto dark mode with a tonal equivalent. Tokens are named as roles (surface / on-surface / primary / outline) and every text/background pairing clears WCAG AA 4.5:1 in both themes. 48px touch targets, visible focus, reduced-motion respected. Words of Jesus in red (toggle `redLetter` in the config). Automatic dark mode via `prefers-color-scheme` with a `[data-theme]` override hook. Tap targets 44px. `prefers-reduced-motion` disables the one animation. No images on content pages, no third-party scripts unless you turn them on.

## Logo

The mark is the letter B from Rammetto One (SIL Open Font License), converted to an outline so no font file is needed to display it. It's inline in the header (`MARK` in `src/lib/html.js`, colored by `currentColor`), and `public/favicon.svg`, `public/logo.svg`, `apple-touch-icon.png` and `og-default.png` all use the same path. `scripts/og-template.html` is the social-card layout; render it at 1200×630 to regenerate the PNG.

## Newsletter (Kit)

**Every Monday**, the GitHub Action in `.github/workflows/newsletter.yml` generates the week's issue and saves it in the repo under `newsletter/<date>/`. Nothing is sent. Open that folder on GitHub, copy `email.html` into a Kit broadcast (HTML editor), paste the subject from `subject.txt`, and send. You can also run the Action any time from the repo's Actions tab, optionally with an issue number to preview ahead.

**By hand:** `npm run newsletter` writes this week's issue to `newsletter/<date>/`: `email.html` (paste into a Kit broadcast using the HTML editor, or save it as a Kit template), `email.txt` (plain-text version), and `subject.txt` (subject line and preview text). `--issue N` previews a future issue; `--date YYYY-MM-DD` generates for a given week.

Each issue is assembled from the site's own content, so the newsletter can't say something the site doesn't: this week's verse and question (from the daily pool), a situation page with its lead verse, note and a suggested line to write in a card, a pastoral-care note for those who comfort others, one "Is that in the Bible?" saying, and one famous verse in context. The rotation is by issue number and runs 31 weeks before any verse repeats.

Kit merge tags used: `{{ subscriber.first_name | default: "there" }}`, `{{ unsubscribe_url }}`, `{{ subscriber.email_address }}`. Send from `hello@betterverses.com`; the footer invites replies and a person should read them.

To show the signup on the site, paste your Kit landing-page or form URL into `site.config.js` → `newsletter.url`. The block appears on the home page after Today's verse and as a footer link; until the URL is set, nothing renders.

## Printables

`npm run printables` writes `src/print/hospital-room.html` and `src/print/funeral-scripture.html` from the site's data. Render them to PDF with any browser (File → Print → Save as PDF, Letter, background graphics on) into `public/print/`; the PDFs are committed and served at `/print/*.pdf`. They are linked from the Ministry hub, the funeral guide, and the surgery, test-results, grief, and sympathy-card pages. Free to print and copy; the footer says so.

## Voice

The site speaks in the first person: one person of quiet faith who reads the whole chapter and tells you plainly what to send and what to skip. Every hand-picked page can carry a `skip` (the popular verse I'd leave out, and why) and a `whatToSay` list (a few honest lines to say or write with the verse, including one thing not to say). `/how-to-read-a-verse/` teaches the reader the four questions so they need the site less over time. Cheerfulness is allowed where the reader is not in pain (retirement, graduation, the journal, the newsletter), never on grief or illness pages. The newsletter ends the same way every week: "Until next week: read the whole chapter first."
