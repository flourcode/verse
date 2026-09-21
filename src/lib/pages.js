import site from '../../site.config.js';
import { esc, verseText, trLine, layout, verseCard, situationCard, relatedList, trustCallout, faq, breadcrumbs, crumbsLd, orgLd, siteLd, adSlot, TR } from './html.js';

const TYPE_URL = { topic: '/topics/', situation: '/situations/', occasion: '/occasions/' };
export const urlFor = (p) => `${TYPE_URL[p.type]}${p.slug}/`;

const PRINTABLES = {
  'before-surgery': { href: '/print/hospital-room.pdf', label: 'Scripture for the hospital room' },
  'cancer-diagnosis': { href: '/print/hospital-room.pdf', label: 'Scripture for the hospital room' },
  'waiting-for-test-results': { href: '/print/waiting-for-test-results.pdf', label: 'Scripture for waiting on test results' },
  'waiting-for-bad-news': { href: '/print/waiting-for-test-results.pdf', label: 'Scripture for waiting on test results' },
  'grief': { href: '/print/grief.pdf', label: 'Scripture for someone who is grieving' },
  'loss-of-a-spouse': { href: '/print/grief.pdf', label: 'Scripture for someone who is grieving' },
  'loss-of-a-parent': { href: '/print/grief.pdf', label: 'Scripture for someone who is grieving' },
  'loss-of-a-child': { href: '/print/grief.pdf', label: 'Scripture for someone who is grieving' },
  'sympathy-card': { href: '/print/funeral-scripture.pdf', label: 'Funeral Scripture by situation' },
  'someone-dying': { href: '/print/end-of-life.pdf', label: 'What to read when someone is dying' },
  'marriage': { href: '/print/wedding-scripture.pdf', label: 'Wedding Scripture by moment' },
  'cannot-sleep': { href: '/print/for-tonight.pdf', label: 'For tonight, when you can’t sleep' },
  'anxiety': { href: '/print/for-tonight.pdf', label: 'For tonight, when you can’t sleep' },
  'overwhelmed': { href: '/print/caregivers.pdf', label: 'Scripture for caregivers' },
};
const HOME_CHIPS = [['grief', 'Grief'], ['sympathy-card', 'Sympathy card'], ['before-surgery', 'Before surgery'], ['waiting-for-test-results', 'Waiting on results'], ['job-loss', 'Job loss'], ['worry', 'Worry'], ['cannot-sleep', 'Can’t sleep'], ['starting-over', 'Starting over'], ['retirement-card', 'Retirement card'], ['graduation-card', 'Graduation card']];

// ---------- Newsletter signup (Kit) ----------
export function newsletterBlock() {
  const n = site.newsletter || {};
  if (!n.formAction && !n.url) return '';
  const inner = n.formAction
    ? `<form class="signup" action="${esc(n.formAction)}" method="post">
    <label for="nl-email" class="sr-only">Email address</label>
    <input id="nl-email" type="email" name="email_address" required autocomplete="email" inputmode="email" placeholder="you@example.com">
    <button class="btn btn--primary" type="submit">Send me Better Verses</button>
  </form>`
    : `<a class="btn btn--primary" href="${esc(n.url)}">Send me Better Verses</a>`;
  return `<section class="section newsletter" aria-labelledby="h-news">
  <h2 id="h-news">Something worth reading each week</h2>
  <p>One verse read slowly. One situation someone around you may be facing. Something useful for people whose job is to comfort others. And a reminder to read the whole chapter before quoting the famous line.</p>
  ${inner}
  <p class="fine">One thoughtful email each week. I read the replies. Unsubscribe anytime.</p>
</section>`;
}

// ---------- Home ----------
// Shared search widget: the home page and /search/ render the same box; search.js drives both.
export function searchBox(opts) {
  opts = opts || {};
  return `<form id="search" class="finder" role="search" action="/search/" method="get">
    <div class="field">
      <label for="q" class="${opts.label ? 'sr-only' : 'finder__ask'}">${esc(opts.label || 'What are they going through?')}</label>
      <input id="q" name="q" type="search" autocomplete="off" autocapitalize="sentences" enterkeyhint="search" spellcheck="false" placeholder="${esc(SEARCH_EXAMPLES[0])}" maxlength="140" value="${esc(opts.q || '')}" data-examples="${esc(JSON.stringify(SEARCH_EXAMPLES))}">
    </div>
    <div class="finder__row">
      <button class="btn btn--primary" type="submit">${opts.cta || 'Find something to send'}</button>
      <span class="finder__try">Try: ${TRY.map(([q, t]) => `<a href="/search/?q=${encodeURIComponent(q)}" data-q="${esc(q)}">${esc(t)}</a>`).join(' · ')}</span>
    </div>
    <p id="search-status" class="finder__status" aria-live="polite"></p>
    <div id="filters" class="filters" hidden>
      <label>Testament <select id="f-testament"><option value="">All</option><option value="OT">Old</option><option value="NT">New</option></select></label>
      <label>Book <select id="f-book"><option value="">All books</option></select></label>
      <label>Match <select id="f-mode"><option value="best">Best match</option><option value="all">All words</option><option value="phrase">Exact phrase</option></select></label>
      <label>Rank <select id="f-rank"><option value="plain">By words</option><option value="comfort">Comfort first</option></select></label>
    </div>
  </form>
  <div id="results" class="results" aria-live="polite" hidden></div>`;
}
const SEARCH_EXAMPLES = ['my friend just lost her mother…', 'a verse for my dad before surgery…', 'what to write in a sympathy card…', 'my son can’t sleep and I want to text him something…', 'a coworker who just got laid off…', 'be still and know…', 'where Jesus talks about worrying…', 'John 3:16…'];
const TRY = [['my friend lost her mother', 'my friend lost her mother'], ['surgery tomorrow', 'surgery tomorrow'], ['waiting for test results', 'waiting for test results'], ['can’t sleep', 'can’t sleep']];

export function home(ctx) {
  const { pages, clusters, daily } = ctx;
  const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));
  const d = daily.entry;
  const body = `
<section class="hero" aria-labelledby="h-find">
  <h1 id="h-find">When you care,<br class="hero__br"> but don’t know what to say.</h1>
  <p class="hero__dek">Someone you care about is grieving, scared, sick, waiting, or having a hard night. Start with what’s happening. Better Verses helps you find Scripture that might fit, and understand it before you send it. Sometimes that someone is you.</p>
  ${searchBox()}
  <p class="fine">Sometimes people need space. Sometimes a meal, a ride, or someone willing to sit with them. And sometimes Scripture helps.</p>
</section>

<section class="section" aria-labelledby="h-paths">
  <h2 id="h-paths" class="sr-only">Where to start</h2>
  <ul class="tools paths">
    <li><a href="/topics/"><strong>Browse by situation</strong><span>Grief, surgery, job loss, worry, starting over, sympathy cards, sleepless nights, and more.</span></a></li>
    <li><a href="/search/"><strong>Search the whole Bible</strong><span>Remember half a verse, a phrase, or a reference? Every verse of the World English Bible.</span></a></li>
    <li><a href="/ministry/"><strong>Ministry and caregiving</strong><span>Scripture and printable resources for pastors, chaplains, caregivers, teachers, and hospice workers.</span></a></li>
  </ul>
</section>

<section class="section newsletter" aria-labelledby="h-kit">
  <h2 id="h-kit">Keep this somewhere you’ll need it.</h2>
  <p>The Comfort Kit is a free printable collection for the moments that are hard to prepare for: grief, hospital visits, waiting on test results, end of life, caregivers, sleepless nights, funeral Scripture, and when you simply don’t know what to say. Print the whole kit or just the page you need. For a pastor’s desk, a hospice binder, a church resource shelf, or your own kitchen drawer.</p>
  <a class="btn btn--primary" href="/print/comfort-kit.pdf">Print the Comfort Kit</a>
  <p class="fine">Free. No email address. <a href="/comfort-kit/">See what’s in it</a>.</p>
</section>

<section class="section" aria-labelledby="h-pop">
  <h2 id="h-pop">Common situations</h2>
  <ul class="chips">${HOME_CHIPS.map(([s, t]) => `<li><a class="chip" href="${urlFor(bySlug[s])}">${t}</a></li>`).join('')}<li><a class="chip chip--more" href="/topics/">All ${pages.length} topics</a></li></ul>
  <p class="fine"><a href="/send/">Just tell me what to send someone →</a></p>
</section>

<section class="trust trust--band" aria-labelledby="h-trust">
  <h2 id="h-trust">Scripture, not fortune cookies.</h2>
  <p>A verse can sound perfect by itself and mean something quite different in its chapter. Every verse here comes with who said it, what was happening, and why it might fit, and on most pages the popular verse I’d leave out and why. I read the whole chapter before recommending a verse, and I’ll show you how to check one yourself in two minutes.</p>
  <a href="/how-to-read-a-verse/">How to read a verse before you send it</a> · <a href="/what-we-believe/">What I believe</a>
</section>

<section class="section" aria-labelledby="h-today">
  <h2 id="h-today">Today’s verse</h2>
  <div class="daily" id="home-daily">
    <p class="verse__for"><time datetime="${daily.isoDate}">Today</time></p>
    <p class="verse__ref">${esc(d.reference)}</p>
    <p class="verse__text" lang="en">${verseText(d)}</p>
    <p class="verse__tr" data-tr>${trLine(d)}</p>
    <div class="verse__why"><p data-context>${esc(d.context)}</p></div>
    <div class="verse__actions">
      <button class="btn btn--ghost" type="button" data-act="copy">Copy</button>
      <button class="btn btn--ghost" type="button" data-act="share">Share</button>
      <a class="btn btn--link" href="/today/">Today’s question</a>
    </div>
  </div>
  <script type="application/json" id="home-data">${JSON.stringify({ pool: daily.pool.map((e) => ({ id: e.id, ref: e.reference, text: e.text, jesus: e.jesus, jesusFrom: e.jesusFrom, context: e.context })), renderedIndex: daily.index, redLetter: !!site.redLetter }).replace(/</g, '\\u003c')}</script>
</section>

${newsletterBlock()}
${adSlot('inline')}`;
  return layout({ path: '/', wide: true, finder: true, search: true, fullTitle: `${site.name} — ${site.tagline.replace(/\.$/, '')}`, title: site.name, description: site.defaultDescription, body, ld: [siteLd(), orgLd()] });
}

// ---------- Search page (same widget; canonical home for shared search links) ----------
export function searchPage() {
  const body = `
${breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Search', url: '/search/' }])}
<h1>Search the Bible</h1>
<p class="hero__dek">Every verse of the World English Bible, searched in your browser. Describe the person and the moment, type a phrase you half remember, or give a reference.</p>
${searchBox({ cta: 'Search', label: 'Search the Bible' })}
<p class="fine">All Scripture text on Better Verses comes from the World English Bible (WEB), a modern-English translation in the public domain. The search recognizes approximate wording and the common ways people remember passages, but results are always displayed from the WEB.</p>
<section class="section" id="search-help">
  <h2>What you can type</h2>
  <ul class="list">
    <li><strong>A phrase you remember</strong>: <em>be still and know</em>, <em>love is patient</em>, <em>camel through the eye of a needle</em>. Put it in quotes to require the exact words.</li>
    <li><strong>A topic</strong>: <em>verses about debt</em>, <em>forgiveness</em>, <em>clay</em>. Related words are included and labelled.</li>
    <li><strong>A saying you think is in the Bible</strong>: <em>God won’t give you more than you can handle</em>, <em>money is the root of all evil</em>, <em>the lion and the lamb</em>. I’ll tell you whether it’s a verse, a misquote, or not Scripture at all, and show the closest real one.</li>
    <li><strong>Wording from the Bible you grew up with</strong>: <em>whosoever believeth</em>, <em>fear not</em>, <em>smite</em>, <em>the LORD Almighty</em>. Where the World English Bible uses different words, I translate and tell you what I did, with a link to search for exactly what you typed instead.</li>
    <li><strong>A person, story, or event</strong>: <em>Moses burning bush</em>, <em>Zacchaeus</em>, <em>the prodigal son</em>, <em>water into wine</em>.</li>
    <li><strong>A reference</strong>: <em>John 3:16</em>, <em>Psalm 23</em>, <em>Matt 6 25-34</em>.</li>
    <li><strong>A person or section</strong>: <em>Jesus on worry</em>, <em>Paul and running a race</em>, <em>Proverbs about the tongue</em>.</li>
    <li><strong>The person and the moment</strong>: <em>a friend who is grieving</em>, <em>my dad before surgery</em>, <em>starting over</em>. If I have a hand-picked page for it, it appears above the results.</li>
  </ul>
</section>`;
  return layout({ path: '/search/', title: 'Search the Bible', description: 'Search every verse of the Bible in plain English: the person and the moment, a phrase you half remember, a topic, or a reference. Results explain why they matched. Runs in your browser.', body, wide: true, finder: true, search: true, canonical: '/search/' });
}

// ---------- Topic hub ----------
export function topicsHub(ctx) {
  const { pages, clusters } = ctx;
  const body = `
${breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Topics', url: '/topics/' }])}
<h1>Bible verses by topic</h1>
<p class="hero__dek">Grouped by what you’re dealing with, not by book and chapter.</p>
<form class="finder" action="/" method="get" role="search" style="margin:1.25rem 0 .5rem">
  <label for="hub-q" class="sr-only">Search topics</label>
  <div class="field"><input id="hub-q" name="q" type="search" placeholder="Search a situation…" autocomplete="off"></div>
</form>
${clusters.map((c) => {
    const items = pages.filter((p) => p.cluster === c.id);
    if (!items.length) return '';
    return `<section class="section" id="${c.id}"><h2>${esc(c.title)}</h2><p class="muted">${esc(c.blurb)}</p><ul class="list list--flow">${items.map(situationCard).join('')}</ul></section>`;
  }).join('')}
${trustCallout()}`;
  return layout({ path: '/topics/', title: 'Bible Verses by Topic', description: 'Browse Bible verses by situation: feelings, work, family, health, life changes, decisions, money, and occasions. Each page is curated with context.', body, wide: false, ld: [crumbsLd([{ name: 'Home', url: '/' }, { name: 'Topics', url: '/topics/' }])] });
}

// ---------- Topic / situation / occasion page ----------
export function topicPage(p, ctx) {
  const { verses, pages, clusters } = ctx;
  const bySlug = Object.fromEntries(pages.map((x) => [x.slug, x]));
  const cluster = clusters.find((c) => c.id === p.cluster);
  const vs = p.verses.map((e) => ({ ...verses[e.id], why: e.why }));
  const primary = vs[0];
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Topics', url: '/topics/' }, { name: cluster.title, url: `/topics/#${cluster.id}` }, { name: p.label, url: p.url }];
  const related = p.related.map((s) => bySlug[s]).filter(Boolean);
  const pageData = { slug: p.slug, url: p.url, for: p.for, verses: vs.map((v) => ({ id: v.id, ref: v.reference, text: v.text, jesus: v.jesus, jesusFrom: v.jesusFrom, why: v.why })), redLetter: !!site.redLetter };

  const picks = p.picks ? `<section class="section"><h2>Which verse for the card?</h2><ul class="picks">${p.picks.map((k) => { const v = verses[k.id]; return `<li><span class="kind">${esc(k.kind)}</span><span><strong>${esc(v.reference)}</strong> — ${verseText(v)}</span></li>`; }).join('')}</ul></section>` : '';
  const wording = p.wording ? `<section class="section"><h2>What to write with it</h2><p class="muted">One line before the verse is usually enough.</p><ul class="wording">${p.wording.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></section>` : '';

  const body = `
${breadcrumbs(crumbs)}
<h1>${esc(p.h1)}</h1>
<p class="hero__dek">${esc(p.intro)}</p>
${p.safety ? `<p class="note">${esc(p.safety)}</p>` : ''}
<h2 style="margin-top:1.75rem">A verse to start with</h2>
<div id="lead-verse">${verseCard(primary, { slug: p.slug, url: p.url, for: p.for }, primary.why, { seeAll: false })}</div>
<script type="application/json" id="page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${picks}${wording}
<section class="section">
  <h2>${vs.length} verses ${p.type === 'occasion' ? 'to choose from' : 'for ' + esc(p.for)}</h2>
  <ol class="vlist" id="verse-list">${vs.map((v) => `<li>
    <p class="verse__ref">${esc(v.reference)}</p>
    <p class="verse__text" lang="en">${verseText(v)}</p>
    <p class="verse__tr">${trLine(v)} · ${esc(genreLabel(v.genre))}</p>
    <div class="verse__why"><p>${esc(v.why)}</p></div>
    <p style="margin-top:.6rem"><button class="btn btn--link" type="button" data-copy style="padding-left:0">Copy verse</button></p>
  </li>`).join('')}</ol>
</section>
${adSlot('inline')}
${p.skip ? `<section class="section leaveout"><h2>The one I’d leave out</h2><p><strong>${esc(p.skip.ref)}.</strong> ${esc(p.skip.why)}</p></section>` : ''}
${p.whatToSay ? `<section class="section"><h2>What to say with it</h2><ul class="say">${p.whatToSay.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section>` : ''}
${p.howToUse ? `<section class="section"><h2>How to use these verses</h2><p>${esc(p.howToUse)}</p></section>` : ''}
${(ctx.posts || []).filter((x) => (x.related || []).includes(p.slug)).length ? `<section class="section"><h2>Go deeper</h2><ul class="list">${(ctx.posts || []).filter((x) => (x.related || []).includes(p.slug)).map((x) => `<li><a href="/journal/${x.slug}/">${esc(x.title)}</a></li>`).join('')}</ul></section>` : ''}
${PRINTABLES[p.slug] ? `<p class="fine">Want it on paper? <a href="${PRINTABLES[p.slug].href}">${esc(PRINTABLES[p.slug].label)}</a> is a free one-sheet PDF to print and take with you.</p>` : ''}
<section class="section searchmore"><h2>Want more than ${vs.length}?</h2><p>These are the ones I’d hand you first. The search covers every verse in the Bible and tells you why each one matched.</p><a class="btn btn--ghost" href="/search/?q=${encodeURIComponent(p.searchQuery || p.for)}">Search the whole Bible for ${esc(p.label.toLowerCase())}</a></section>
${relatedList(related)}
${faq(p.faq)}
${trustCallout()}`;
  return layout({ path: p.url, title: p.title, description: p.description, body, wide: true, ld: [crumbsLd(crumbs)] });
}

function genreLabel(g) {
  return { psalm: 'Psalm (poetry)', gospel: 'Gospel (Jesus’ words and life)', letter: 'Letter (epistle)', wisdom: 'Wisdom literature', prophecy: 'Prophecy', poetry: 'Poetry', narrative: 'Narrative', law: 'Torah', apocalyptic: 'Apocalyptic vision' }[g] || g;
}

// ---------- Today ----------
export function today(ctx) {
  const { daily } = ctx;
  const d = daily.entry;
  const data = { pool: daily.pool.map((e) => ({ id: e.id, ref: e.reference, text: e.text, jesus: e.jesus, jesusFrom: e.jesusFrom, context: e.context, question: e.question })), renderedIndex: daily.index, redLetter: !!site.redLetter };
  const body = `
${breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Today', url: '/today/' }])}
<h1>Bible verse for today</h1>
<p class="hero__dek">One verse a day, with a little context and one question to carry. <span data-date></span></p>
<div id="today" class="daily" data-index="${daily.index}">
  <p class="verse__for">Today’s verse</p>
  <p class="verse__ref">${esc(d.reference)}</p>
  <p class="verse__text" lang="en">${verseText(d)}</p>
  <p class="verse__tr" data-tr>${trLine(d)}</p>
  <div class="verse__why"><h3>Context</h3><p data-context>${esc(d.context)}</p></div>
  <div class="daily__q"><strong>One question</strong><span data-question>${esc(d.question)}</span></div>
  <div class="verse__actions">
    <button class="btn btn--ghost" type="button" data-act="copy">Copy</button>
    <button class="btn btn--ghost" type="button" data-act="share">Share</button>
    <a class="btn btn--link" href="/random/">Another verse</a>
  </div>
</div>
<script type="application/json" id="today-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<section class="section">
  <h2>Why one verse a day</h2>
  <p>A single verse read slowly does more than a chapter skimmed. The verse changes each day at midnight and rotates through a curated set, so it isn’t random and it isn’t tied to your mood. If today’s doesn’t fit, <a href="/topics/">find one that does</a>.</p>
</section>
${trustCallout()}
${newsletterBlock()}`;
  return layout({ path: '/today/', title: 'Bible Verse for Today', description: 'A Bible verse for today with short context and one reflection question. Same verse for everyone each day; a new one tomorrow.', body, ld: [crumbsLd([{ name: 'Home', url: '/' }, { name: 'Today', url: '/today/' }])] });
}

// ---------- Random ----------
export function random(ctx) {
  const { pages } = ctx;
  const byCluster = (ids) => pages.filter((p) => ids.includes(p.cluster)).map((p) => p.slug);
  const filters = {
    hope: ['hope', 'starting-over', 'job-loss', 'waiting'],
    peace: ['peace', 'anxiety', 'worry', 'cannot-sleep', 'overwhelmed'],
    courage: ['courage', 'job-interview', 'before-surgery', 'starting-over'],
    wisdom: ['wisdom', 'difficult-decisions', 'patience'],
    work: byCluster(['work']),
    family: byCluster(['family']),
    change: byCluster(['changes']),
    waiting: ['waiting', 'waiting-for-test-results', 'patience', 'hope'],
  };
  const labels = { hope: 'Hope', peace: 'Peace', courage: 'Courage', wisdom: 'Wisdom', work: 'Work', family: 'Family', change: 'Change', waiting: 'Waiting' };
  const body = `
${breadcrumbs([{ name: 'Home', url: '/' }, { name: 'Random verse', url: '/random/' }])}
<h1>A random verse</h1>
<p class="hero__dek">One verse from the hand-picked set, with a note on where it comes from.</p>
<div id="random-filters" class="chips" role="group" aria-label="Filter by theme" style="margin-bottom:.5rem">
  <button class="chip" type="button" data-filter="all" aria-pressed="true">Any</button>
  ${Object.keys(filters).map((k) => `<button class="chip" type="button" data-filter="${k}" aria-pressed="false">${labels[k]}</button>`).join('')}
</div>
<div id="random" aria-live="polite"><noscript><p class="note">This page needs JavaScript. You can <a href="/topics/">browse topics</a> instead.</p></noscript></div>
<script type="application/json" id="random-data">${JSON.stringify(filters)}</script>
<p class="muted" style="margin-top:1rem">Random means random: the verse isn’t chosen for you. If you need one for something specific, <a href="/">tell us what you’re facing</a>.</p>`;
  return layout({ path: '/random/', finder: true, title: 'Random Bible Verse', description: 'Get a random Bible verse from a curated set, with a note on its context. Filter by hope, peace, courage, wisdom, work, family, change, or waiting.', body, ld: [crumbsLd([{ name: 'Home', url: '/' }, { name: 'Random verse', url: '/random/' }])] });
}

// ---------- Static prose page ----------
export function staticPage(pg) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: pg.crumb || pg.title, url: pg.path }];
  const body = `${breadcrumbs(crumbs)}<article class="prose"><h1>${esc(pg.h1 || pg.title)}</h1>${pg.html}</article>`;
  return layout({ path: pg.path, title: pg.title, description: pg.description, body, wide: true, noindex: !!pg.noindex, ld: [crumbsLd(crumbs)] });
}

// ---------- 404 ----------
export function notFound() {
  const body = `<div class="state" style="padding-top:2rem">
<h1>That page isn’t here.</h1>
<p class="hero__dek">You can still find the right verse for someone.</p>
<p><a class="btn btn--primary" href="/">Find a verse</a><a class="btn btn--ghost" href="/topics/">Browse topics</a><a class="btn btn--ghost" href="/today/">Today’s verse</a></p>
</div>`;
  return layout({ path: '/404.html', title: 'Page not found', description: 'That page isn’t here. Find the right Bible verse for someone you care about instead.', body, noindex: true });
}

// ---------- Passage helper (text from the full Bible) ----------
function parseRef(ref) {
  const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref.trim()); if (!m) throw new Error(`Bad reference "${ref}"`);
  return { book: m[1], chapter: +m[2], from: +m[3], to: +(m[4] || m[3]) };
}
export function passage(ref, ctx) {
  const r = parseRef(ref); const bk = ctx.bible.books.find((b) => b.n.toLowerCase() === r.book.toLowerCase()); if (!bk) throw new Error(`Unknown book in "${ref}"`);
  const ch = bk.c[r.chapter - 1]; if (!ch) throw new Error(`No chapter in "${ref}"`);
  const out = []; for (let v = r.from; v <= r.to; v++) { if (!ch[v - 1]) throw new Error(`No verse ${v} in "${ref}"`); out.push({ v, text: ch[v - 1] }); }
  return { ref, verses: out, book: bk.n, chapter: r.chapter };
}
export function passageHTML(ref, ctx, opts) {
  const p = passage(ref, ctx); opts = opts || {};
  const body = p.verses.length === 1 ? `<q>${esc(p.verses[0].text)}</q>` : p.verses.map((x) => `<span class="vn">${x.v}</span>${esc(x.text)}`).join(' ');
  return `<figure class="passage${opts.small ? ' passage--small' : ''}">
  <p class="verse__ref"><a href="/search/?q=${encodeURIComponent(p.book + ' ' + p.chapter)}">${esc(ref)}</a></p>
  <blockquote class="verse__text" lang="en">${body}</blockquote>
  <figcaption class="verse__tr">${TR}${opts.copy ? ` · <button class="btn btn--link btn--inline" type="button" data-copy-passage data-ref="${esc(ref)}">Copy</button>` : ''}</figcaption>
</figure>`;
}
const fillQuotes = (html, ctx) => html.replace(/<blockquote data-ref="([^"]+)"><\/blockquote>/g, (m, ref) => passageHTML(ref, ctx));

// ---------- The Comfort Kit block (ministry hub, guides, printables) ----------
export function kitBlock() {
  return `<section class="section newsletter" aria-labelledby="h-pack">
  <h2 id="h-pack">The Comfort Kit</h2>
  <p>All eight care sheets in one PDF, one-pagers first: when you don’t know what to say, grief, the hospital room, waiting on test results, end of life, caregivers, tonight when you can’t sleep, and funeral Scripture by situation. For a pastor’s desk, a hospice binder, a church resource shelf, or your own kitchen drawer. Print it once; hand out the pages as the moments come.</p>
  <a class="btn btn--primary" href="/print/comfort-kit.pdf">Download the Comfort Kit (PDF)</a>
  <p class="fine">Free to print and share. If your church or ministry keeps a resource page, you are welcome to link this one; that is exactly what it is for.</p>
</section>`;
}

// ---------- /printables/ : landing pages for the PDFs ----------
const PACK = ['funeral-scripture', 'hospital-room', 'grief', 'waiting-for-test-results', 'end-of-life', 'caregivers', 'when-you-dont-know-what-to-say', 'for-tonight'];
export function printablesIndex(ctx, opts) {
  opts = opts || {};
  const path = opts.path || '/comfort-kit/';
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'The Comfort Kit', url: '/comfort-kit/' }];
  const items = ctx.printables.map((p) => `<li class="tool"><a class="tool__pdf" href="/print/${p.slug}.pdf"><strong>${esc(p.h1)}</strong><span>${esc(p.kicker)} · ${p.pages === 1 ? 'one page' : p.pages + ' pages'} · <b>Open the PDF</b></span></a><a class="tool__about" href="/printables/${p.slug}/">What’s on it</a></li>`).join('');
  const body = `${breadcrumbs(crumbs)}
<p class="kicker">Free. No signup. Print it. Share it.</p>
<h1>The Comfort Kit</h1>
<p class="hero__dek">Free printable Scripture sheets for grief, hospital visits, waiting, end of life, caregivers, and the moments when you simply don’t know what to say. Every sheet follows the same shape: the moment, a few passages with one line on why, what to say, and how to use it. Read one. Then stop.</p>
<p class="btn-row"><a class="btn btn--primary btn--lg" href="/print/comfort-kit.pdf">Download the kit</a></p>
<p class="fine" style="margin-top:-.4rem">One PDF, ${ctx.kitPages || 11} pages, free. No signup.</p>
<p class="fine">For pastors and chaplains: pastoral-care Scripture, ready for the binder. For caregivers, hospice volunteers, and friends: Scripture for difficult days, ready for the nightstand. Same sheets. No account, no email gate, no donation ask, nothing for sale.</p>
<h2>Or one sheet at a time</h2>
<ul class="tools">${items}</ul>
<section class="section">
  <h2>What this is, and isn’t</h2>
  <p>I am a layperson, not a pastor or a counselor, so the sheets stay modest: Scripture, brief context, and a few plainspoken sentences. They are meant to help you show up, not to replace pastoral care, a doctor, or a grief counselor. Where a sheet touches something that needs real help, it says so.</p>
  <p>If you keep a resource page for a church, a hospice, a chaplaincy, or a caregiving group, you are welcome to link this page. That is what it is for. The address is short on purpose: <strong>betterverses.com/comfort-kit</strong>.</p>
</section>
<p class="fine">Made from the same pages as the rest of the site, so nothing here says something the site doesn’t. <a href="/how-we-choose-verses/">How I choose verses</a>.</p>`;
  return layout({ path, canonical: '/comfort-kit/', noindex: path !== '/comfort-kit/', title: 'The Comfort Kit — Free Printable Scripture for Grief, Hospital Visits, and Hard Days', description: 'Free printable Scripture sheets for grief, hospital visits, waiting on test results, end of life, caregivers, funerals, weddings, and the moments you don’t know what to say. No signup. Print it, share it, link it.', body, wide: true, ld: [crumbsLd(crumbs)] });
}
export function printablePage(pr, ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'The Comfort Kit', url: '/comfort-kit/' }, { name: pr.h1, url: `/printables/${pr.slug}/` }];
  const bySlug = Object.fromEntries(ctx.pages.map((p) => [p.slug, p]));
  const related = (pr.related || []).map((s) => bySlug[s]).filter(Boolean);
  const preview = pr.sections.map((sec) => `<h3>${esc(sec.h)}</h3><ul class="list">${sec.refs.map((r) => `<li><strong>${esc(r.ref)}</strong>${r.why ? ` — ${esc(r.why)}` : ''}</li>`).join('')}</ul>`).join('');
  const sample = pr.sections[0].refs[0];
  const body = `${breadcrumbs(crumbs)}
<p class="kicker">${esc(pr.kicker)}</p>
<h1>Free printable: ${esc(pr.h1)}</h1>
<p class="hero__dek">${esc(pr.moment)}</p>
<p class="btn-row"><a class="btn btn--primary" href="/print/${pr.slug}.pdf">Download the PDF (${pr.pages === 1 ? 'one page' : pr.pages + ' pages'})</a><a class="btn btn--ghost" href="/print/comfort-kit.pdf">Get all of them: the Comfort Kit</a></p>
<section class="section"><h2>What’s on it</h2>${preview}
${pr.say && pr.say.length ? `<h3>What to say</h3><ul class="say">${pr.say.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
${pr.use ? `<h3>How to use it</h3><p>${esc(pr.use)}</p>` : ''}</section>
<section class="section"><h2>One of the passages, in full</h2>${passageHTML(sample.ref, ctx, { copy: true })}${sample.why ? `<p class="guide__why">${esc(sample.why)}</p>` : ''}</section>
${related.length ? `<section class="related"><h2>The full pages behind this sheet</h2><ul>${related.map((p) => `<li><a href="${p.url}">${esc(p.h1)}</a></li>`).join('')}</ul></section>` : ''}
${kitBlock()}
<p class="fine">Free to print and share; the footer of the sheet says so. If you keep a resource page for a church, a hospice, or a chaplaincy, you’re welcome to link here. <a href="/how-we-choose-verses/">How I choose verses</a>.</p>`;
  return layout({ path: `/printables/${pr.slug}/`, title: `Free Printable: ${pr.title}`, description: pr.description, body, wide: true, ld: [crumbsLd(crumbs)] });
}

// ---------- /send/ : verses to send someone who is… ----------
const SEND = [
  ['grieving', 'grief', 'Thinking of you and of [name]. This came to mind.'],
  ['a widow or widower', 'loss-of-a-spouse', 'I keep thinking about [name]. No need to reply.'],
  ['grieving a parent', 'loss-of-a-parent', 'I’m so sorry about your mom. This came to mind.'],
  ['grieving a child', 'loss-of-a-child', 'Thinking of you and of Ellie today.'],
  ['anxious', 'anxiety', 'No advice, just this. I’m here.'],
  ['afraid of what’s coming', 'afraid-of-the-future', 'When, not if. You won’t go through it alone.'],
  ['having surgery', 'before-surgery', 'I’ll be thinking about you at 7 tomorrow. You don’t need to reply.'],
  ['waiting on test results', 'waiting-for-test-results', 'I know you’re waiting. I’m not going to ask. I’m just here.'],
  ['sick', 'cancer-diagnosis', 'I don’t know what to say. I’m here, and I’m not going anywhere.'],
  ['dying', 'someone-dying', 'You can go when you’re ready. We’ll be all right.'],
  ['going through a breakup', 'after-a-breakup', 'This is a real loss and I’m sorry. This came to mind.'],
  ['going through a divorce', 'after-a-divorce', 'I’m on your side. I don’t need the details.'],
  ['starting a new job', 'job-interview', 'You’re going to be good at this. Text me after.'],
  ['out of work', 'job-loss', 'That’s rotten. I’m sorry. Lunch is on me Thursday.'],
  ['starting over', 'starting-over', 'Proud of you for the first step. Here’s something for the next one.'],
  ['discouraged', 'hope', 'Not a fix. Just company.'],
  ['lonely', 'loneliness', 'I missed you Sunday. Walk at 4 most days if you ever want to come.'],
  ['unable to sleep', 'cannot-sleep', 'No need to reply. Just in case you’re staring at the ceiling.'],
  ['overwhelmed', 'overwhelmed', 'You don’t have to do all of it today. Here’s one verse, and I’ll take the dog.'],
  ['dealing with family', 'difficult-family-members', 'You’re not crazy. That was a hard thing to sit through.'],
  ['estranged from a child', 'estrangement', 'I know it’s quiet. I’m thinking of you both.'],
  ['grieving a suicide', 'suicide-loss', 'I don’t have any answers. I loved him too, and I’m here.'],
  ['grieving a pet', 'pet-loss', 'I’m sorry about Max. He was a good dog.'],
  ['in a panic', 'panic', 'You’re safe. I’m right here. Breathe out slowly.'],
  ['waiting for bad news', 'waiting-for-bad-news', 'Whatever it is, you won’t hear it alone. Call me right after.'],
  ['graduating', 'graduation-card', 'Proud of you. Keep this one.'],
  ['retiring', 'retirement-card', 'You did that well. Enjoy the next part.'],
  ['a new parent', 'new-baby-card', 'Welcome, little one. You were prayed for before you were here.'],
];
export function sendPage(ctx) {
  const bySlug = Object.fromEntries(ctx.pages.map((p) => [p.slug, p]));
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Verses to send', url: '/send/' }];
  const rows = SEND.filter(([, slug]) => bySlug[slug]).map(([who, slug, line]) => {
    const p = bySlug[slug]; const v = ctx.verses[p.verses[0].id];
    return `<li class="send__row"><h2 class="send__who">…${esc(who)}</h2>
<div class="send__card"><p class="verse__ref">${esc(v.reference)}</p><p class="verse__text send__text" lang="en">${verseText(v)}</p>
<p class="send__line"><span class="send__k">Write above it:</span> “${esc(line)}”</p>
<p class="send__more"><a href="${p.url}">All the verses for ${esc(p.for)}</a></p></div></li>`;
  }).join('');
  const body = `${breadcrumbs(crumbs)}
<h1>Bible verses to send someone who is…</h1>
<p class="hero__dek">One verse and one honest line for each moment, chosen so it fits. Copy the verse, write the line in your own words, send it. Shorter is better; the person is tired.</p>
<ul class="send">${rows}</ul>
<section class="section searchmore"><h2>Someone in a moment that isn’t here?</h2><p>Describe the person and the moment: “my friend just lost her mother,” “a coworker who got laid off.” The search understands that.</p><a class="btn btn--ghost" href="/search/">Search the whole Bible</a></section>
<p class="fine">Before you send anything, <a href="/how-to-read-a-verse/">two minutes to read it in context</a>.</p>`;
  return layout({ path: '/send/', title: 'Bible Verses to Send Someone Who Is Grieving, Sick, Anxious, or Starting Over', description: 'What Bible verse to send someone who is grieving, anxious, having surgery, sick, going through a breakup, out of work, lonely, or starting over. One verse and one honest line for each, with the context so it fits.', body, wide: true, ld: [crumbsLd(crumbs)] });
}

// ---------- /verses/ : key passages in context ----------
export function versesIndex(ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Verses in context', url: '/verses/' }];
  const body = `${breadcrumbs(crumbs)}
<h1>Famous verses, in context</h1>
<p class="hero__dek">The passages people quote most, with what was happening when they were written, how they get misread, and how to use them well.</p>
<ul class="list list--cards">${ctx.versePages.map((v) => `<li><a href="/verses/${v.slug}/"><strong>${esc(v.h1)}</strong><span>${esc(v.tagline)}</span></a></li>`).join('')}</ul>
<p class="fine">Only remember part of a verse? <a href="/search/">Search the whole Bible</a>. Want to check one yourself? <a href="/how-to-read-a-verse/">Two minutes, four questions</a>.</p>`;
  return layout({ path: '/verses/', title: 'Famous Bible Verses in Context', description: 'The most quoted Bible verses with their original setting, common misreadings, and how to use each one well. Romans 8:28, Jeremiah 29:11, Philippians 4:13, Psalm 46:10 and more.', body, wide: true, ld: [crumbsLd(crumbs)] });
}
export function versePage(v, ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Verses', url: '/verses/' }, { name: v.h1, url: `/verses/${v.slug}/` }];
  const bySlug = Object.fromEntries(ctx.pages.map((p) => [p.slug, p]));
  const related = (v.related || []).map((s) => bySlug[s]).filter(Boolean);
  const posts = ctx.posts.filter((p) => (p.versePages || []).includes(v.slug));
  const body = `${breadcrumbs(crumbs)}
<h1>${esc(v.h1)}</h1>
<p class="hero__dek">${esc(v.tagline)}</p>
${passageHTML(v.ref, ctx, { copy: true })}
<section class="section"><h2>What’s happening here</h2><p>${esc(v.context)}</p></section>
<section class="section"><h2>How it gets misread</h2><p>${esc(v.misread)}</p></section>
<section class="section"><h2>How to use it</h2><p>${esc(v.use)}</p></section>
${posts.length ? `<section class="section"><h2>Go deeper</h2><ul class="list">${posts.map((p) => `<li><a href="/journal/${p.slug}/">${esc(p.title)}</a></li>`).join('')}</ul></section>` : ''}
${related.length ? `<section class="related"><h2>Situations this verse fits</h2><ul>${related.map((p) => `<li><a href="${p.url}">${esc(p.h1)}</a></li>`).join('')}</ul></section>` : ''}
${newsletterBlock()}
<section class="section searchmore"><h2>Read it with its neighbors</h2><p>Context is the whole method. The search shows any verse with the ones around it.</p><a class="btn btn--ghost" href="/search/?q=${encodeURIComponent(v.ref.replace(/:\d+(-\d+)?$/, ''))}">Read ${esc(v.ref.replace(/:\d+(-\d+)?$/, ''))} in the search</a></section>
${trustCallout()}`;
  return layout({ path: `/verses/${v.slug}/`, title: v.title, description: v.description, body, wide: true, ld: [crumbsLd(crumbs)] });
}

// ---------- /journal/ ----------
export function journalIndex(ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Journal', url: '/journal/' }];
  const body = `${breadcrumbs(crumbs)}
<h1>Journal</h1>
<p class="hero__dek">Scripture for real life. Short, careful pieces about what familiar passages actually say, and how to use them well.</p>
<ul class="posts">${ctx.posts.map((p) => `<li><a href="/journal/${p.slug}/"><strong>${esc(p.title)}</strong><span>${esc(p.description)}</span><time datetime="${p.date}">${fmtDate(p.date)}</time></a></li>`).join('')}</ul>
<p class="fine">Every piece is written by me and checked against the same <a href="/how-we-choose-verses/">rules</a> as the rest of the site. Four good pieces a month beat forty thin ones, and I enjoy writing them, which I hope shows.</p>`;
  return layout({ path: '/journal/', title: 'Journal — Scripture for Real Life', description: 'Short, careful articles about what familiar Bible passages actually say: Jeremiah 29:11, Philippians 4:13, Romans 8:28, funeral readings, and sayings that aren’t in the Bible.', body, wide: true, ld: [crumbsLd(crumbs)] });
}
export function journalPost(p, ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'Journal', url: '/journal/' }, { name: p.title, url: `/journal/${p.slug}/` }];
  const bySlug = Object.fromEntries(ctx.pages.map((x) => [x.slug, x]));
  const related = (p.related || []).map((s) => bySlug[s]).filter(Boolean);
  const vps = (p.versePages || []).map((s) => ctx.versePages.find((v) => v.slug === s)).filter(Boolean);
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date, author: { '@type': 'Organization', name: site.name }, publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: site.url + '/icon-512.png' } }, mainEntityOfPage: `${site.url}/journal/${p.slug}/`, image: site.url + site.ogImage };
  const body = `${breadcrumbs(crumbs)}
<article class="prose post">
<h1>${esc(p.title)}</h1>
<p class="post__meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${esc(site.name)} editors</p>
${fillQuotes(p.html, ctx)}
</article>
${vps.length ? `<section class="section"><h2>The verses, in context</h2><ul class="list">${vps.map((v) => `<li><a href="/verses/${v.slug}/">${esc(v.h1)}</a> — ${esc(v.tagline)}</li>`).join('')}</ul></section>` : ''}
${related.length ? `<section class="related"><h2>Related pages</h2><ul>${related.map((x) => `<li><a href="${x.url}">${esc(x.h1)}</a></li>`).join('')}</ul></section>` : ''}
${newsletterBlock()}
<section class="section searchmore"><h2>Only remember part of a verse?</h2><p>The search covers every verse in the Bible and tells you when a saying isn’t one.</p><a class="btn btn--ghost" href="/search/">Search Better Verses</a></section>`;
  return layout({ path: `/journal/${p.slug}/`, title: p.title, description: p.description, body, wide: true, ld: [crumbsLd(crumbs), ld] });
}
function fmtDate(d) { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); }

// ---------- /ministry/ ----------
export function ministryHub(ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'For Ministry', url: '/ministry/' }];
  const misread = ctx.versePages.filter((v) => v.misread);
  const body = `${breadcrumbs(crumbs)}
<h1>Scripture for the moments when someone needs care</h1>
<p class="hero__dek">Funeral planning. A hospital visit. Waiting on test results. Grief. End of life. A caregiver running out of steam. Better Verses collects Scripture for those moments, with enough context to know what you’re quoting and why it fits. The resources and printables are free to copy, print, and share.</p>
<ul class="tools">
  <li><a href="/ministry/funeral-scripture/"><strong>Funeral Scripture by situation</strong><span>Sudden death, long illness, a child, an elder, unknown faith, suicide. Passages that fit, and the ones that misfire.</span></a></li>
  <li><a href="/ministry/wedding-scripture/"><strong>Wedding Scripture with context</strong><span>The traditional readings and less-used ones, each with where it was written and why it works.</span></a></li>
  <li><a href="/ministry/pastoral-care-scripture/"><strong>Pastoral care quick reference</strong><span>Hospital, grief, fear, job loss, family conflict: the verse to open with, and the one to avoid.</span></a></li>
  <li><a href="/verses/"><strong>Commonly misread verses</strong><span>${misread.length} famous passages with their setting, the usual misreading, and how to use them well.</span></a></li>
  <li><a href="/topics/"><strong>Scripture by topic and situation</strong><span>${ctx.pages.length} hand-picked pages, seven verses each with a note on who said it and why it fits.</span></a></li>
  <li><a href="/search/"><strong>Full-Bible search</strong><span>Every verse of the World English Bible. Type a half-remembered phrase, a reference, a topic, or a saying you suspect isn’t Scripture.</span></a></li>
</ul>
${kitBlock()}
<section class="section" aria-labelledby="h-sheets">
  <h2 id="h-sheets">The sheets, one at a time</h2>
  <ul class="list">${ctx.printables.map((p) => `<li><a href="/print/${p.slug}.pdf">${esc(p.h1)}</a> <span class="muted">· ${p.pages === 1 ? 'one page' : p.pages + ' pages'} · <a href="/printables/${p.slug}/">what’s on it</a></span></li>`).join('')}</ul>
</section>
<section class="section">
  <h2>Why the World English Bible</h2>
  <p>All Scripture text on the site is from the World English Bible, a modern-English translation in the public domain. That means you can copy any passage into a bulletin, a slide, a handout, or a website without a license or a verse limit. Every passage shows its reference so you can read it from the translation your congregation uses.</p>
</section>
<section class="section">
  <h2>What this is not</h2>
  <p>Not a sermon library, not a commentary, not a denominational resource. I choose verses because their context connects to the situation, I say why, and I say where a familiar verse tends to be misused. The method is on the <a href="/how-we-choose-verses/">How I choose verses</a> page.</p>
</section>
<section class="section">
  <h2>Contribute</h2>
  <p>If you’re a pastor, chaplain, caregiver, or teacher and I’ve missed something here, <a href="/contact/">tell me</a>. Especially if there’s a passage you use, or deliberately don’t use, in one of these situations. Short notes from people with experience are the thing a one-person website can’t manufacture.</p>
</section>
${trustCallout()}`;
  return layout({ path: '/ministry/', title: 'For Ministry — Scripture Tools for Pastors and Teachers', description: 'Free Scripture tools for pastors, chaplains, and Bible teachers: the Comfort Kit of printable care sheets, funeral and wedding readings by situation, a pastoral-care quick reference, commonly misread verses, and full-Bible search.', body, wide: true, ld: [crumbsLd(crumbs)] });
}
export function guidePage(g, ctx) {
  const crumbs = [{ name: 'Home', url: '/' }, { name: 'For Ministry', url: '/ministry/' }, { name: g.title, url: `/ministry/${g.slug}/` }];
  const bySlug = Object.fromEntries(ctx.pages.map((p) => [p.slug, p]));
  const related = (g.related || []).map((s) => bySlug[s]).filter(Boolean);
  const sections = g.sections.map((s) => `<section class="section guide__section"><h2>${esc(s.h)}</h2>${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
${s.refs.map((r) => `<div class="guide__item">${passageHTML(r.ref, ctx, { copy: true })}<p class="guide__why">${esc(r.why)}${r.page && bySlug[r.page] ? ` <a href="${bySlug[r.page].url}">Full page →</a>` : ''}</p></div>`).join('')}</section>`).join('');
  const body = `${breadcrumbs(crumbs)}
<h1>${esc(g.h1)}</h1>
<p class="hero__dek">${esc(g.intro)}</p>
<nav class="toc" aria-label="Sections"><ul>${g.sections.map((s, i) => `<li><a href="#s${i + 1}">${esc(s.h)}</a></li>`).join('')}</ul></nav>
${sections.replace(/<section class="section guide__section">/g, (m) => m).split('<section class="section guide__section">').map((chunk, i) => (i === 0 ? chunk : `<section class="section guide__section" id="s${i}">${chunk}`)).join('')}
${g.howToUse ? `<section class="section"><h2>How to use this</h2><p>${esc(g.howToUse)}</p></section>` : ''}
${g.printable ? `<p class="fine"><a href="${esc(g.printable)}">Print this guide</a>, free to copy.</p>` : ''}
${related.length ? `<section class="related"><h2>Related pages</h2><ul>${related.map((p) => `<li><a href="${p.url}">${esc(p.h1)}</a></li>`).join('')}</ul></section>` : ''}
${kitBlock()}
${trustCallout()}`;
  return layout({ path: `/ministry/${g.slug}/`, title: g.title, description: g.description, body, wide: true, ld: [crumbsLd(crumbs)] });
}
