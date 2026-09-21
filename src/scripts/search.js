/* Better Verses — full-Bible search, entirely in the browser.
   Loads the World English Bible (data/bible.js, ~1.2 MB compressed, cached after the first visit), builds a
   word index, and answers plain-English queries with exact phrase, keyword, fuzzy, synonym/concept, reference
   and curated-topic matching. Every result says why it matched. No backend, no API, nothing sent anywhere. */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/assets\/search(\.[0-9a-f]+)?\.js.*$/, '') || '/';
  const SITE = document.documentElement.dataset.site || location.origin;
  const TR = document.documentElement.dataset.tr || 'World English Bible (WEB)';

  // ---------- text normalisation ----------
  const STOP = new Set(('a an the and or of to in on for with by from at as is are was were be been being it its this that these those there here ' +
    'i me my we our you your he him his she her they them their who whom whose which what when where why how do does did done doing have has had ' +
    'not no nor so than too very can could will would shall should may might must into onto over under about above after before between out up down off ' +
    'all any some each every both few more most other such only own same then once again also just ever never always ' +
    'verse verses bible scripture scriptures passage passages chapter say says said saying talk talks talked talking speak speaks spoke speaking mention mentions mentioned mentioning ' +
    'find show tell give get where part parts place places story stories something anything someone anyone people person one thing things way like really ' +
    'about regarding concerning re around cant dont wont didnt doesnt isnt arent wasnt werent im ive youre theyre couldnt shouldnt wouldnt hasnt havent ' +
    't s d ll ve m re don won isn aren wasn weren didn doesn couldn shouldn wouldn hasn haven am been text texting send sending write writing card message note just got get gets getting went gone came come feel feeling feels felt need needs want wants keep going right now today').split(/\s+/));
  const norm = (s) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9'\s-]/g, ' ').replace(/'s\b/g, '').replace(/[-']/g, ' ').replace(/\s+/g, ' ').trim();
  function stem(w) {
    if (w.length <= 3) return w;
    w = w.replace(/ies$/, 'i').replace(/sses$/, 'ss').replace(/([^s])s$/, '$1');
    if (w.length > 4) w = w.replace(/(ed|ing|ly|ness|ful|ment|est|er)$/, (m) => (w.length - m.length >= 3 ? '' : m));
    w = w.replace(/y$/, 'i').replace(/(.)\1$/, '$1');
    return w;
  }
  const tokens = (s) => norm(s).split(' ').filter((w) => w.length > 1 || /\d/.test(w));

  // ---------- data ----------
  let B = null;            // window.__BIBLE__
  let V = null;            // verse table: { text, book, chap, vs, lower, toks } arrays
  let INDEX = null;        // Map stem -> Uint32Array of verse ids
  let VOCAB = null;        // Map stem -> [freq, sampleWord]
  let CURATED = null;      // finder.json (topic pages) mapped to verse ids
  let SYN = null;          // synonyms.json
  let KJV = null;          // kjv.json: KJV wording → WEB wording
  let KJV_PRESENT = null;  // multi-word KJV phrases the WEB also contains
  let SAYINGS = null;      // sayings.json: famous lines, misquotes, and things that aren't in the Bible
  let CANON = null;        // concept key -> canonical label (aliases share one)
  let loading = null;
  const BOOK_ALIASES = {};

  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function loadJSON(src) { return fetch(src).then((r) => r.json()); }
  function loadAll(onStatus) {
    if (loading) return loading;
    onStatus && onStatus('Loading the Bible… (once, then it’s cached)');
    loading = Promise.all([
      window.__BIBLE__ ? Promise.resolve() : loadScript(BASE + 'data/bible.js'),
      window.__SYN__ ? Promise.resolve() : loadScript(BASE + 'data/synonyms.js'),
      window.__FINDER__ ? Promise.resolve() : loadScript(BASE + 'data/finder.js'),
      window.__KJV__ ? Promise.resolve() : loadScript(BASE + 'data/kjv.js'),
      window.__SAYINGS__ ? Promise.resolve() : loadScript(BASE + 'data/sayings.js'),
    ]).then(() => { onStatus && onStatus('Indexing…'); return new Promise((r) => setTimeout(r, 10)); }).then(() => { buildIndex(); onStatus && onStatus(''); });
    return loading;
  }
  window.__prefetchBible = () => { if (!loading) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = BASE + 'data/bible.js'; document.head.appendChild(l); } };

  function buildIndex() {
    B = window.__BIBLE__; SYN = window.__SYN__ || {}; KJV = window.__KJV__ || {};
    SAYINGS = (window.__SAYINGS__ || []).map((e) => ({ ...e, keys: e.say.map((a) => ({ text: ' ' + norm(a) + ' ', toks: tokens(a).filter((w) => !STOP.has(w)) })) }));
    CANON = {}; const byList = new Map();
    for (const [k, list] of Object.entries(SYN)) { const sig = JSON.stringify(list); if (!byList.has(sig)) byList.set(sig, k); CANON[k] = byList.get(sig); }
    V = { text: [], book: [], chap: [], vs: [], lower: [], n: [] };
    INDEX = new Map(); VOCAB = new Map();
    const tmp = new Map();
    B.books.forEach((bk, bi) => {
      [bk.n, bk.s].forEach((a) => { BOOK_ALIASES[norm(a)] = bi; });
      bk.c.forEach((ch, ci) => ch.forEach((t, vi) => {
        if (!t) return;
        const id = V.text.length; V.text.push(t); V.book.push(bi); V.chap.push(ci + 1); V.vs.push(vi + 1);
        const low = norm(t); V.lower.push(' ' + low + ' ');
        const toks = low.split(' ').filter(Boolean); V.n.push(toks.length);
        const seen = new Set();
        for (const w of toks) { const s = stem(w); if (seen.has(s)) continue; seen.add(s); let arr = tmp.get(s); if (!arr) tmp.set(s, arr = []); arr.push(id); const vo = VOCAB.get(s); if (vo) { vo[0]++; if (w.length < vo[1].length) vo[1] = w; } else VOCAB.set(s, [1, w]); }
      }));
    });
    for (const [k, arr] of tmp) INDEX.set(k, Uint32Array.from(arr));
    // KJV phrases that the WEB also uses verbatim need no translating
    KJV_PRESENT = new Set(); for (const k of Object.keys(KJV)) if (k.indexOf(' ') > 0) { const p = ' ' + norm(k) + ' '; let n = 0; for (const t of V.lower) if (t.includes(p) && ++n >= 5) break; if (n >= 5) KJV_PRESENT.add(k); }
    // extra book aliases
    Object.assign(BOOK_ALIASES, Object.fromEntries(Object.entries({
      gen: 0, ex: 1, exo: 1, lev: 2, num: 3, deut: 4, dt: 4, josh: 5, judg: 6, jdg: 6, ru: 7, '1 sam': 8, '1sam': 8, '2 sam': 9, '2sam': 9, '1 kgs': 10, '1 ki': 10, '2 kgs': 11, '2 ki': 11, '1 chr': 12, '2 chr': 13, ezr: 14, neh: 15, est: 16, ps: 18, psa: 18, psalms: 18, pss: 18, prov: 19, pr: 19, eccl: 20, ecc: 20, qoh: 20, song: 21, 'song of songs': 21, sos: 21, canticles: 21, isa: 22, is: 22, jer: 23, lam: 24, ezek: 25, eze: 25, dan: 26, hos: 27, joe: 28, am: 29, ob: 30, obad: 30, jon: 31, mic: 32, nah: 33, hab: 34, zeph: 35, zep: 35, hag: 36, zech: 37, zec: 37, mal: 38,
      mt: 39, matt: 39, mat: 39, mk: 40, mr: 40, lk: 41, luk: 41, jn: 42, joh: 42, ac: 43, rom: 44, ro: 44, '1 cor': 45, '1cor': 45, '2 cor': 46, '2cor': 46, gal: 47, eph: 48, phil: 49, php: 49, col: 50, '1 thess': 51, '1 th': 51, '2 thess': 52, '2 th': 52, '1 tim': 53, '2 tim': 54, tit: 55, phlm: 56, philem: 56, heb: 57, jas: 58, jam: 58, '1 pet': 59, '1 pe': 59, '2 pet': 60, '2 pe': 60, '1 jn': 61, '1 john': 61, '2 jn': 62, '3 jn': 63, jud: 64, rev: 65, re: 65, apocalypse: 65,
    }).map(([k, v]) => [norm(k), v])));
    // curated topic pages -> verse ids
    CURATED = [];
    const F = window.__FINDER__; if (!F) return;
    const refToId = new Map(); V.text.forEach((t, id) => refToId.set(`${B.books[V.book[id]].n} ${V.chap[id]}:${V.vs[id]}`, id));
    for (const p of F.pages) {
      const ids = [];
      for (const e of p.verses) {
        const ref = F.verses[e.id] && F.verses[e.id].ref; if (!ref) continue;
        const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref); if (!m) continue;
        for (let v = +m[3]; v <= +(m[4] || m[3]); v++) { const id = refToId.get(`${m[1]} ${m[2]}:${v}`); if (id != null) ids.push(id); }
      }
      CURATED.push({ page: p, ids: new Set(ids), aliases: p.aliases.map(norm), label: p.label, url: p.url, h1: p.h1 });
    }
  }

  // ---------- query understanding ----------
  // Comfort-first ranking. Turns on when the query sounds like a hard moment (a hand-picked page matched, or the
  // words below appear). Verses that comfort rank up; law codes, genealogies, and verses about punishment or
  // sexual sin rank down. Nothing is removed, the reader is told, and it can be switched off.
  const COMFORT_INTENT = /\b(griev|grief|mourn|comfort|hurt|hurting|scared|afraid|fear|sad|lonely|alone|anxious|anxiety|worried|worry|panic|dying|died|death|dead|lost|loss|sick|ill|cancer|hospital|surgery|struggling|hard time|broken|heartbroken|crying|tears|estranged|cut me off|no contact|divorce|breakup|laid off|fired|overwhelmed|depress|despair|hopeless|suicid|can t sleep|cant sleep|encourag|hope|peace|strength|carry|help me|help my|for my (mom|dad|mother|father|son|daughter|friend|wife|husband|sister|brother))\b/;
  const COMFORT_PLUS = ['comfort','near','heal','refuge','peace','rest','hope','merci','loving kindness','carri','uphold','strengthen','help','deliver','shelter','fear not','don t be afraid','with you','never leave','forsake you','light','joy','still','trust','shepherd','wipe','tears','broken heart','crushed','weari','burden','courage','hold','hand','love','grace','new'];
  const COMFORT_MINUS = ['nakedness','put to death','shall die','abomination','uncleanness','unclean','whore','prostitut','curse','cursed','iniquity','wrath','slay','slain','sword','destroy','vengeance','plague','leprosy','sacrifice','burnt offering','genealog','begat','father of','son of','sons of','cubits'];
  const LAW_BOOKS = new Set([2, 3, 4, 12, 13, 14, 15, 25]);
  function comfortScore(id) {
    const t = V.lower[id]; let sc = 0;
    for (const w of COMFORT_PLUS) if (t.includes(' ' + w)) sc += 6;
    for (const w of COMFORT_MINUS) if (t.includes(' ' + w)) sc -= 30;
    if (LAW_BOOKS.has(V.book[id])) sc -= 12;
    if (V.book[id] === 18 || (V.book[id] >= 39 && V.book[id] <= 42) || (V.book[id] >= 44 && V.book[id] <= 65)) sc += 8;
    if (t.includes(' you ') || t.includes(' your ')) sc += 3;
    return Math.max(-60, Math.min(40, sc));
  }
  const SITUATION = new Set(['retirement', 'graduation', 'surgery', 'job loss', 'interview', 'moving', 'exam', 'coworkers', 'boss', 'pregnancy', 'divorce', 'wedding', 'starting over', 'fresh start', 'stress', 'overwhelmed', 'depression', 'single', 'elderly', 'aging', 'youth', 'travel', 'home', 'change', 'new beginnings', 'identity', 'purpose', 'body', 'nature', 'animals', 'sleep problems', 'insomnia']);
  const SCOPES = {
    jesus: { label: 'In the Gospels', books: [39, 40, 41, 42], term: 'jesus' },
    paul: { label: 'Pauline letter', books: [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], term: null },
    david: { label: 'David’s writing', books: [18, 8, 9], term: 'david' },
    moses: { label: 'Books of Moses', books: [1, 2, 3, 4], term: 'moses' },
    solomon: { label: 'Solomon’s writing', books: [19, 20, 21], term: 'solomon' },
    peter: { label: 'Peter', books: [59, 60], term: 'peter' },
    psalm: { label: 'Psalms', books: [18], term: null },
    psalms: { label: 'Psalms', books: [18], term: null },
    proverb: { label: 'Proverbs', books: [19], term: null },
    proverbs: { label: 'Proverbs', books: [19], term: null },
    gospel: { label: 'In the Gospels', books: [39, 40, 41, 42], term: null },
    gospels: { label: 'In the Gospels', books: [39, 40, 41, 42], term: null },
  };
  function parseReference(q) {
    const s = q.toLowerCase().replace(/[^a-z0-9:.\- ]/g, ' ').replace(/\bchapter\b|\bverses?\b/g, '').replace(/\s+/g, ' ').trim();
    const m = /^((?:[1-3] ?)?[a-z]+(?: [a-z]+)*?) ?(\d+)?(?:\s*[: .]\s*(\d+)(?:\s*(?:-|–|to|through)\s*(\d+))?)?$/.exec(s);
    if (!m) return null;
    const bi = BOOK_ALIASES[norm(m[1])]; if (bi == null) return null;
    if (m[2] == null) return { book: bi };
    return { book: bi, chapter: +m[2], from: m[3] ? +m[3] : null, to: m[4] ? +m[4] : (m[3] ? +m[3] : null) };
  }
  function fuzzyFix(s, word) {
    // closest vocabulary entry within edit distance 1–2 (transpositions count as one), preferring common words
    let best = null, bestD = 3, bestF = 0;
    const maxD = s.length <= 4 ? 1 : 2; const w = word || s;
    for (const [k, [f, sample]] of VOCAB) {
      if (k[0] !== s[0] && !(k[1] === s[0] && k[0] === s[1])) continue;
      let d = Math.min(Math.abs(k.length - s.length) <= maxD ? dlev(s, k, maxD) : 9, Math.abs(sample.length - w.length) <= maxD ? dlev(w, sample, maxD) : 9);
      if (d > maxD) continue;
      if (d < bestD || (d === bestD && f > bestF)) { best = k; bestD = d; bestF = f; }
    }
    return best;
  }
  function dlev(a, b, max) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > max) return max + 1;
    const d = []; for (let i = 0; i <= m; i++) { d[i] = [i]; } for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) { let rowMin = 9; for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      if (d[i][j] < rowMin) rowMin = d[i][j]; } if (rowMin > max) return max + 1; }
    return d[m][n];
  }
  function search(rawQuery, opts) {
    opts = opts || {}; const out = { query: rawQuery, hits: [], total: 0, reference: null, corrections: [], curated: null, scope: null, terms: [] };
    const q = norm(rawQuery); if (!q) return out;

    // 1. Reference ("john 3:16", "psalm 23", "matt 6 25-34")
    const ref = parseReference(rawQuery);
    if (ref && (ref.chapter || /^(\d )?[a-z]+$/.test(q) && q.length > 2 && !STOP.has(q))) {
      const ids = [];
      V.book.forEach((b, id) => { if (b !== ref.book) return; if (ref.chapter && V.chap[id] !== ref.chapter) return; if (ref.from && (V.vs[id] < ref.from || V.vs[id] > ref.to)) return; ids.push(id); });
      if (ids.length) { out.reference = { label: `${B.books[ref.book].n}${ref.chapter ? ' ' + ref.chapter : ''}${ref.from ? ':' + ref.from + (ref.to !== ref.from ? '-' + ref.to : '') : ''}` }; out.hits = ids.map((id) => ({ id, score: 0, reasons: ['Reference'] })); out.total = ids.length; return out; }
    }

    // 1b. Famous sayings, misquotes, and things people think are in the Bible ("God won't give you more than you can handle")
    out.saying = null;
    { const qs = ' ' + q + ' ', qt = new Set(tokens(q).filter((w) => !STOP.has(w))); let best = null, bestN = 0;
      for (const e of SAYINGS) for (const k of e.keys) {
        let n = 0;
        if (qs.includes(k.text)) n = k.toks.length + 1;
        else if (k.toks.length >= 2 && k.toks.every((t) => qt.has(t))) n = k.toks.length;   // all its words, any order
        if (n > bestN) { bestN = n; best = e; }
      }
      if (best) { const id = refId(best.ref); out.saying = { status: best.status, note: best.note, ref: best.ref, id, text: id != null ? V.text[id] : null }; }
    }

    // 2. Terms, scope, phrase
    const quoted = /"([^"]+)"/.exec(rawQuery); let phraseOverride = null;
    let words = tokens(q);
    let testament = opts.testament || null;
    if (/\b(old testament|hebrew bible)\b/.test(q)) { testament = 'OT'; words = words.filter((w) => !/^(old|testament|hebrew)$/.test(w)); }
    if (/\bnew testament\b/.test(q)) { testament = 'NT'; words = words.filter((w) => !/^(new|testament)$/.test(w)); }
    let scope = null;
    for (const w of words) if (SCOPES[w] && !scope) { scope = SCOPES[w]; }
    const content = words.filter((w) => !STOP.has(w) && !(scope && SCOPES[w] === scope && !scope.term));
    // KJV wording → WEB wording. "whore" isn't in the World English Bible (it says "prostitute"); "smite" is "strike".
    // Say so rather than silently fuzzy-matching to "where" or "spite". Multi-word entries are checked on the whole query.
    out.translated = [];
    const strict = !!opts.strict;
    let fullQ = ' ' + q + ' ';
    if (!strict) {
      // longest multi-word entries first, on the whole query, so "I shall not want" → "I shall lack nothing"
      const multi = Object.keys(KJV).filter((k) => k.indexOf(' ') > 0).sort((a, b) => b.length - a.length);
      for (const k of multi) if (!KJV_PRESENT.has(k) && fullQ.includes(' ' + k + ' ')) { out.translated.push({ from: k, to: KJV[k][0] }); fullQ = fullQ.split(' ' + k + ' ').join(' ' + norm(KJV[k][0]) + ' '); }
    }
    // Everyday phrases that describe a situation but whose words mean something else in the text ("laid off" → coals laid on a fire)
    for (const ph of [' laid off ', ' let go ', ' got fired ', ' passed away ', ' going through ', ' dealing with ', ' struggling with ', ' having a hard time ', ' hard time ']) if (fullQ.includes(ph)) fullQ = fullQ.split(ph).join(' ');
    if (fullQ.trim() !== q) { phraseOverride = fullQ.trim(); }
    const PERSON = /^(friend|friends|dad|mom|mother|father|mum|son|daughter|sister|brother|husband|wife|coworker|colleague|neighbor|grandma|grandpa|grandmother|grandfather|aunt|uncle|cousin|boss|pastor|someone|somebody|him|her|them|kid|kids|child|children|family|girlfriend|boyfriend|partner|roommate|teammate|student|teacher|nurse|patient)$/;
    const namesMoment = CURATED && CURATED.some((c) => c.aliases.some((al) => al.split(' ').length >= 2 && (' ' + q + ' ').includes(' ' + al + ' ')));
    let expandedWords = tokens(fullQ).filter((w) => !STOP.has(w) && !(scope && SCOPES[w] === scope && !scope.term) && !(namesMoment && PERSON.test(w)));
    const exact = []; // [{ word, stem, soft, from }]
    for (const w of expandedWords) {
      if (scope && SCOPES[w] === scope && scope.term) { exact.push({ word: w, stem: stem(w), soft: true }); continue; }
      let s = stem(w);
      if (!strict && !INDEX.has(s) && KJV[w]) {
        // one KJV word may map to several WEB words ("hell" → sheol, hades, gehenna): all of them count as the same term
        const alts = KJV[w].flatMap((t) => tokens(t)).filter((t) => !STOP.has(t)).map(stem).filter((t) => INDEX.has(t));
        out.translated.push({ from: w, to: KJV[w].join(', ') });
        if (alts.length) alts.forEach((a, i) => exact.push({ word: KJV[w][Math.min(i, KJV[w].length - 1)], stem: a, group: w }));
        continue; // "thou" → "you" is a stop word: the word simply drops out
      }
      if (!strict && INDEX.has(s) && KJV[w]) {
        // the word exists in the WEB too, but the KJV sense may be rendered differently ("suffer the children" → "allow"): count both
        const alts = KJV[w].flatMap((t) => tokens(t)).filter((t) => !STOP.has(t)).map(stem).filter((t) => INDEX.has(t) && t !== s);
        if (alts.length) { exact.push({ word: w, stem: s, group: w }); alts.forEach((a, i) => exact.push({ word: KJV[w][Math.min(i, KJV[w].length - 1)], stem: a, group: w, alt: true })); continue; }
      }
      if (!strict && !INDEX.has(s) && /(eth|est)$/.test(w) && w.length > 5) {
        // archaic verb endings: believeth → believes, comest → comes
        const base = w.slice(0, -3); const cand = [base + 'es', base + 's', base, base + 'e'].find((c) => INDEX.has(stem(c)));
        if (cand) { out.translated.push({ from: w, to: cand }); exact.push({ word: cand, stem: stem(cand) }); continue; }
      }
      if (!strict && !INDEX.has(s) && !SYN[w]) { const fix = fuzzyFix(s, w); if (fix) { if (STOP.has(VOCAB.get(fix)[1])) continue; out.corrections.push({ from: w, to: VOCAB.get(fix)[1] }); s = fix; } }
      if (strict && !INDEX.has(s)) out.absent = (out.absent || []).concat(w);
      exact.push({ word: w, stem: s });
    }
    out.terms = exact.map((e) => e.word);
    // synonyms / concepts: a query word that is a concept key, or appears in a concept's list, expands to that list
    const synStems = new Map(); // stem -> concept
    const synPhrases = [];      // multi-word entries
    const seenConcepts = new Set();
    const termConcepts = new Map(); // term stem -> Set(concept labels it triggered)
    const conceptTriggers = new Map(); // concept label -> [term stems that triggered it]
    const wholeQ = ' ' + q + ' ';
    for (const [concept, list] of Object.entries(SYN)) {
      const keyWords = concept.split(' ').map(stem);
      const keyHit = wholeQ.includes(' ' + concept + ' ') || exact.some((e) => keyWords.length === 1 && keyWords[0] === e.stem);
      // Situation concepts (surgery, graduation…) expand only when named; otherwise their word lists would label unrelated verses.
      const listHit = !keyHit && !SITUATION.has(concept) && exact.some((e) => list.some((l) => !l.includes(' ') && stem(l) === e.stem));
      if (!keyHit && !listHit) continue;
      const label = CANON[concept] || concept;
      for (const e of exact) if (keyWords.includes(e.stem) || list.some((l) => !l.includes(' ') && stem(l) === e.stem)) { let cs = termConcepts.get(e.stem); if (!cs) termConcepts.set(e.stem, cs = new Set()); cs.add(label); let ts = conceptTriggers.get(label); if (!ts) conceptTriggers.set(label, ts = []); if (!ts.includes(e.stem)) ts.push(e.stem); }
      if (seenConcepts.has(label)) continue; seenConcepts.add(label);
      for (const l of list) { if (l.includes(' ')) synPhrases.push({ p: ' ' + norm(l) + ' ', concept: label }); else { const s = stem(norm(l)); if (!exact.some((e) => e.stem === s)) synStems.set(s, label); } }
      // concept key itself may be a multi-word phrase to catch (e.g. "new beginnings")
    }
    // curated topic pages matched by alias
    let curated = null;
    if (CURATED) { let best = 0; for (const c of CURATED) { let sc = 0; for (const a of c.aliases) if (a && wholeQ.includes(' ' + a + ' ')) sc = Math.max(sc, a.split(' ').length * 2 + a.length / 20); if (sc > best) { best = sc; curated = c; } } }
    if (curated) out.curated = { label: curated.label, url: curated.url, h1: curated.h1, page: curated.page };
    const comfort = opts.comfort === 'on' ? true : opts.comfort === 'off' ? false : !!(curated || COMFORT_INTENT.test(q));
    out.comfort = comfort;

    // 3. Candidates & scoring
    const scores = new Map(); const why = new Map();
    const add = (id, s, r) => { scores.set(id, (scores.get(id) || 0) + s); if (r) { let a = why.get(id); if (!a) why.set(id, a = []); if (!a.includes(r)) a.push(r); } };
    const N = V.text.length;
    const hard = exact.filter((e) => !e.soft);
    const ideas = [...new Set(hard.map((e) => e.group || e.stem))].length;
    const credited = new Map(); // group -> Set(verse ids already scored for that group)
    for (const e of exact) {
      const arr = INDEX.get(e.stem); if (!arr) continue;
      const idf = Math.log(N / arr.length); const w = e.soft ? 6 : 20 + Math.min(idf, 6) * 2;
      if (!e.group) { for (const id of arr) add(id, w, null); continue; }
      let seen = credited.get(e.group); if (!seen) credited.set(e.group, seen = new Set());
      for (const id of arr) if (!seen.has(id)) { seen.add(id); add(id, w, null); }
    }
    const already = (id, concept) => (conceptTriggers.get(concept) || []).some((t) => hasStem(id, t));
    for (const [s, concept] of synStems) { const arr = INDEX.get(s); if (!arr) continue; const idf = Math.log(N / arr.length); for (const id of arr) if (!already(id, concept)) add(id, 6 + Math.min(idf, 4), 'Related to: ' + concept); }
    if (synPhrases.length) for (let id = 0; id < N; id++) { const t = V.lower[id]; for (const sp of synPhrases) if (t.includes(sp.p) && !already(id, sp.concept)) add(id, 14, 'Related to: ' + sp.concept); }
    let phraseHits = 0;
    const phrase = quoted ? norm(quoted[1]) : (phraseOverride || q);
    if (phrase && phrase.split(' ').length >= 2) { const p = ' ' + phrase + ' '; for (let id = 0; id < N; id++) if (V.lower[id].includes(p)) { add(id, 100, 'Exact phrase'); phraseHits++; } }
    let mode = opts.mode || 'best';
    if (quoted) { if (phraseHits) mode = 'phrase'; else out.note = `No verse has the exact words “${quoted[1]}”. Showing the closest matches.`; }
    if (curated) for (const id of curated.ids) add(id, 60, 'Hand-picked for ' + curated.label);   // when the query names a situation we curated for, those verses lead
    if (scope) for (const [id] of scores) if (scope.books.includes(V.book[id])) add(id, 12, scope.label);

    // 4. Filter, finalise
    const hits = [];
    for (const [id, base] of scores) {
      if (testament && B.books[V.book[id]].t !== testament) continue;
      if (opts.book != null && V.book[id] !== opts.book) continue;
      const low = V.lower[id];
      const matched = hard.filter((e) => hasStem(id, e.stem));
      const reasons = why.get(id) || [];
      const related = hard.filter((e) => !matched.includes(e) && termConcepts.has(e.stem) && [...termConcepts.get(e.stem)].some((c) => reasons.includes('Related to: ' + c)));
      if (mode === 'phrase' && !reasons.includes('Exact phrase')) continue;
      if (mode === 'all' && matched.length + related.length < hard.length) continue;
      if (!matched.length && !related.length && !reasons.length) continue;
      const mIdeas = new Set(matched.map((e) => e.group || e.stem)).size, rIdeas = new Set(related.map((e) => e.group || e.stem)).size;
      const covered = mIdeas + rIdeas * 0.75;
      const coverage = ideas ? covered / ideas : 1;
      const full = ideas ? mIdeas + rIdeas >= ideas : true;
      let score = base + coverage * 40 + (full ? 10 : 0) - Math.min(V.n[id], 60) * 0.15;
      if (comfort) { score += comfortScore(id); if (!full && ideas > 1) score -= 25; }
      const r = reasons.slice();
      // Words appearing close together in the order typed ("lord … shepherd" within a few words) beat scattered matches.
      if (full && matched.length >= 2 && !reasons.includes('Exact phrase')) {
        const vt = V.lower[id].trim().split(' ').map(stem); const want = matched.map((e) => e.stem);
        let pos = -1, ok = true, span = 0, first = -1;
        for (const st of want) { const i = vt.indexOf(st, pos + 1); if (i < 0) { ok = false; break; } if (first < 0) first = i; pos = i; }
        if (ok) { span = pos - first; if (span <= want.length + 3) { score += 25 - span; r.push('Words in order'); } }
      }
      if (matched.length) { const seenG = new Set(); r.unshift('Matches: ' + matched.filter((e) => !e.group || !seenG.has(e.group) && seenG.add(e.group)).map((e) => e.word).join(' · ')); }
      if (!full && ideas > 1) r.push(`${mIdeas + rIdeas} of ${ideas} ideas`);
      hits.push({ id, score, full, reasons: r, matched: matched.map((e) => e.stem), syn: [...synStems.keys()] });
    }
    hits.sort((a, b) => b.score - a.score || a.id - b.id);
    out.full = hits.filter((h) => h.full).length;
    out.hits = hits; out.total = hits.length; out.scope = scope && scope.label; return out;
  }
  window.__bvSearch = (q, o) => loadAll().then(() => { const r = search(q, o || {}); return r.hits.slice(0, 8).map((h) => [refOf(h.id), Math.round(h.score), h.reasons.join(' | ')]); });
  function refId(ref) {
    if (!ref) return null; const m = /^(.+?) (\d+):(\d+)$/.exec(ref); if (!m) return null;
    const bi = BOOK_ALIASES[norm(m[1])]; if (bi == null) return null;
    for (let id = 0; id < V.text.length; id++) if (V.book[id] === bi && V.chap[id] === +m[2] && V.vs[id] === +m[3]) return id;
    return null;
  }
  function hasStem(id, s) { const arr = INDEX.get(s); if (!arr) return false; let lo = 0, hi = arr.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] === id) return true; if (arr[m] < id) lo = m + 1; else hi = m - 1; } return false; }

  // ---------- rendering ----------
  const refOf = (id) => `${B.books[V.book[id]].n} ${V.chap[id]}:${V.vs[id]}`;
  const slugOf = (id) => `${B.books[V.book[id]].n.toLowerCase().replace(/\s+/g, '-')}-${V.chap[id]}-${V.vs[id]}`;
  function highlight(text, stems) {
    if (!stems.length) return esc(text);
    return esc(text).replace(/[A-Za-z][A-Za-z’']*/g, (w) => (stems.includes(stem(norm(w))) ? `<mark>${w}</mark>` : w));
  }
  const versePageFor = (id) => { const F = window.__FINDER__; if (!F || !F.versePages) return null; const ref = refOf(id); return F.versePages[ref] || F.versePages[ref.replace(/:\d+$/, ':1')] && null; };
  function hitHTML(h, showAll) {
    const id = h.id; const stems = showAll ? [] : h.matched.concat(h.syn); const vp = versePageFor(id);
    return `<article class="hit" data-id="${id}">
  <h3 class="hit__ref"><a href="${BASE}search/?q=${encodeURIComponent(refOf(id).replace(/:\d+$/, ''))}" title="Read ${esc(B.books[V.book[id]].n)} ${V.chap[id]}">${esc(refOf(id))}</a></h3>
  <p class="hit__text" lang="en">${highlight(V.text[id], stems)}</p>
  ${h.reasons.length ? `<p class="hit__why">${h.reasons.map((r) => `<span>${esc(r)}</span>`).join('')}</p>` : ''}
  <div class="hit__actions">
    <button class="btn btn--link" type="button" data-act="context">In context</button>
    <button class="btn btn--link" type="button" data-act="copy">Copy</button>
    <button class="btn btn--link" type="button" data-act="share">Share</button>
    ${vp ? `<a class="btn btn--link hit__vp" href="${BASE}${vp.url.replace(/^\//, '')}">Why it’s misread</a>` : ''}
  </div>
  <div class="hit__ctx" hidden></div>
</article>`;
  }
  function contextHTML(id) {
    const bi = V.book[id], ch = V.chap[id], v = V.vs[id]; const verses = B.books[bi].c[ch - 1];
    const from = Math.max(1, v - 3), to = Math.min(verses.length, v + 3);
    let html = `<p class="hit__ctxhead">${esc(B.books[bi].n)} ${ch}:${from}–${to}</p>`;
    for (let i = from; i <= to; i++) { const t = verses[i - 1]; if (!t) continue; html += `<p class="ctx${i === v ? ' ctx--hit' : ''}"><sup>${i}</sup> ${esc(t)}</p>`; }
    html += `<p class="hit__ctxfoot"><a href="${BASE}search/?q=${encodeURIComponent(B.books[bi].n + ' ' + ch)}">Read all of ${esc(B.books[bi].n)} ${ch}</a> · <a href="${BASE}how-to-read-a-verse/">How to read a verse before you send it</a></p>`;
    return html;
  }
  function verseString(id) { return `“${V.text[id]}” — ${refOf(id)} (${TR})`; }
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 1800); }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-999px'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok; } }
  const track = (name, params) => { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); };

  // ---------- page wiring ----------
  function init() {
    const form = $('#search'); if (!form) return;
    const input = $('#q', form), results = $('#results'), status = $('#search-status');
    const fTest = $('#f-testament'), fBook = $('#f-book'), fMode = $('#f-mode'), filters = $('#filters');
    const isSearchPage = /\/search\/?$/.test(location.pathname);
    let last = null, shown = 0, current = '', strict = false, comfortPref = null;
    const fRank = $('#f-rank');
    if (fRank) fRank.addEventListener('change', () => { comfortPref = fRank.value === 'comfort' ? 'on' : 'off'; if (current) run(current, false); });
    const showAll = new URLSearchParams(location.search).get('all') === '1';
    const PAGE = 25;

    const setStatus = (m) => { if (status) status.textContent = m; };
    const examples = (() => { try { return JSON.parse(input.dataset.examples || '[]'); } catch (e) { return []; } })();
    if (examples.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let i = Math.floor(Math.random() * examples.length); input.placeholder = examples[i];
      const t = setInterval(() => { if (input.value || document.activeElement === input) return; i = (i + 1) % examples.length; input.placeholder = examples[i]; }, 3200);
      input.addEventListener('input', () => clearInterval(t), { once: true });
    }
    input.addEventListener('focus', () => window.__prefetchBible(), { once: true });
    input.addEventListener('input', () => loadAll(setStatus), { once: true });

    function render(more) {
      if (!last) return;
      if (!more) { shown = 0; results.innerHTML = ''; }
      const head = $('.results__head', results) || (() => { const d = document.createElement('div'); d.className = 'results__head'; results.prepend(d); return d; })();
      let h = '';
      if (last.translated && last.translated.length) h += `<p class="results__note">The ${esc(TR)} says <strong>${last.translated.map((c) => esc(c.to)).join('</strong>, <strong>')}</strong> where other translations say ${last.translated.map((c) => `“${esc(c.from)}”`).join(', ')}. Searching for that instead. <a href="#" data-strict="1">Search for exactly what I typed</a></p>`;
      if (last.corrections.length) h += `<p class="results__note">No verse contains ${last.corrections.map((c) => `“${esc(c.from)}”`).join(', ')}; showing <strong>${last.corrections.map((c) => esc(c.to)).join(', ')}</strong> instead. <a href="#" data-strict="1">Search for exactly what I typed</a></p>`;
      if (last.absent && last.absent.length) h += `<p class="results__note">The ${esc(TR)} never uses the word${last.absent.length > 1 ? 's' : ''} ${last.absent.map((w) => `“${esc(w)}”`).join(', ')}. Other translations may; try the wording you remember from another version, or <a href="#" data-strict="0">let us translate it</a>.</p>`;
      if (last.reference) h += `<p class="results__count">${esc(last.reference.label)} · ${last.total} verse${last.total === 1 ? '' : 's'}</p>`;
      else if (!last.total) h += `<p class="results__count">No verses match yet</p>`;
      else if (last.curated && last.curated.page) h += '';
      else if (last.terms.length > 1 && !last.full) h += `<p class="results__count">No verse matches everything you typed · ${last.total.toLocaleString()} match part of it${last.scope ? ` · ${esc(last.scope)}` : ''}</p>`;
      else if (last.terms.length > 1 && last.full < last.total) h += `<p class="results__count">${last.full.toLocaleString()} verse${last.full === 1 ? '' : 's'} match everything you typed · ${(last.total - last.full).toLocaleString()} more match part of it${last.scope ? ` · ${esc(last.scope)}` : ''}</p>`;
      else h += `<p class="results__count">${last.total.toLocaleString()} verse${last.total === 1 ? '' : 's'} match${last.scope ? ` · ${esc(last.scope)}` : ''}</p>`;
      if (last.note) h += `<p class="results__note">${esc(last.note)}</p>`;
      const comfortNote = last.comfort && !last.reference ? `<p class="results__note results__note--soft">Ranked for comfort first, because this sounds like a hard moment. Law codes and genealogies are still here, further down. <a href="#" data-rank="plain">Rank by words alone</a></p>` : '';
      if (!(last.curated && last.curated.page)) h += comfortNote;
      if (last.saying && !more) {
        const sy = last.saying; const head = { not: 'Not in the Bible', misquote: 'Close, but not quite', verse: 'You’re thinking of ' + esc(sy.ref), story: 'That story is in ' + esc(sy.ref).replace(/:\d+$/, '') }[sy.status];
        h += `<div class="saying saying--${sy.status}"><p class="saying__k">${head}</p><p class="saying__note">${esc(sy.note)}</p>${sy.id != null ? `<p class="saying__ref">${esc(refOf(sy.id))}</p><p class="saying__text" lang="en">${esc(sy.text)}</p><p class="saying__more"><a href="${BASE}search/?q=${encodeURIComponent(refOf(sy.id).replace(/:\d+$/, ''))}" data-q="${esc(refOf(sy.id).replace(/:\d+$/, ''))}">Read the whole chapter</a>${versePageFor(sy.id) ? ` · <a href="${BASE}${versePageFor(sy.id).url.replace(/^\//, '')}">${esc(versePageFor(sy.id).h1)} in context</a>` : ''}</p>` : ''}</div>`;
      }
      let collapsed = false;
      if (last.curated && !more) {
        const pg = last.curated.page; const F = window.__FINDER__;
        const cards = pg && pg.verses ? pg.verses.map((e, i) => { const v = F.verses[e.id]; if (!v) return ''; return `<article class="pick${i === 0 ? ' pick--lead' : ''}">
<p class="verse__ref">${esc(v.ref)}</p>
<p class="verse__text pick__text" lang="en"><q>${esc(v.text)}</q></p>
<p class="pick__why">${esc(e.why)}</p>
<div class="hit__actions"><button class="btn btn--link" type="button" data-act="copy" data-cid="${esc(e.id)}">Copy</button><button class="btn btn--link" type="button" data-act="share" data-cid="${esc(e.id)}">Share</button></div>
</article>`; }).join('') : '';
        if (cards) {
          h += `<section class="answer"><p class="answer__k">Hand-picked for ${esc(pg.for)}</p>
<p class="answer__lead">${pg.count || pg.verses.length} verses I’d look at, each with why it fits. Read them slowly; you only need one.</p>
${cards}
${pg.skip ? `<div class="verse__why answer__skip"><h3>The one I’d leave out</h3><p><strong>${esc(pg.skip.ref)}.</strong> ${esc(pg.skip.why)}</p></div>` : ''}
<p class="answer__more"><a href="${esc(pg.url)}">What to say with it, and more on ${esc(pg.for)} →</a> · <a href="${BASE}how-to-read-a-verse/">Check one yourself in two minutes</a></p>
</section>`;
          if (!showAll) { collapsed = true; h += `<p class="results__divider"><button class="btn btn--ghost btn--block" type="button" data-expand>Search the whole Bible for this too (${last.total.toLocaleString()} verses match)</button></p>`; }
          else h += `<p class="results__divider">More from the whole Bible</p>${comfortNote}`;
        } else {
          h += `<a class="curated" href="${esc(last.curated.url)}"><span class="curated__k">Hand-picked</span><strong>${esc(last.curated.h1)}</strong><span>Verses chosen for their context, each with a note on why it fits.</span></a>`;
        }
      } else if (!more && !last.reference && !last.saying) {
        h += `<p class="results__note results__note--soft">I don’t have a hand-picked page for that yet, so these are from the whole Bible. <a href="${BASE}send/">See the moments I’ve written for</a>, or <a href="mailto:${esc(document.documentElement.dataset.email || 'hello@betterverses.com')}">tell me what you were looking for</a>.</p>`;
      }
      if (!last.total && !more) h += `<div class="state"><p>Try fewer words, a phrase you remember in quotes, or a reference like <em>Psalm 23</em>.</p><p class="muted">Search covers every verse of the ${esc(TR)}.</p></div>`;
      head.innerHTML = h;
      const slice = last.hits.slice(shown, shown + PAGE); shown += slice.length;
      let bin = $('.results__hits', results); if (!bin) { bin = document.createElement('div'); bin.className = 'results__hits'; results.appendChild(bin); }
      if (!more) bin.hidden = collapsed;
      const frag = document.createElement('div'); frag.innerHTML = slice.map((x) => hitHTML(x, !!last.reference)).join('');
      while (frag.firstChild) bin.appendChild(frag.firstChild);
      const old = $('.results__more', results); if (old) old.remove();
      if (shown < last.total) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--ghost btn--block results__more'; b.textContent = `Show more (${last.total - shown} left)`; b.addEventListener('click', () => render(true)); bin.appendChild(b); }
    }
    function run(q, push) {
      q = (q || '').trim(); if (!q) return;
      current = q; input.value = q; results.hidden = false; filters && (filters.hidden = false);
      const url = BASE.replace(/\/$/, '') + '/search/?q=' + encodeURIComponent(q);
      if (push && /^https?:$/.test(location.protocol)) { try { if (isSearchPage) history.replaceState({ q }, '', url); else history.pushState({ q }, '', url); } catch (e) { /* file:// or sandboxed */ } }
      loadAll(setStatus).then(() => {
        if (fBook && fBook.options.length <= 1) { for (let i = 0; i < B.books.length; i++) { const o = document.createElement('option'); o.value = i; o.textContent = B.books[i].n; fBook.appendChild(o); } }
        last = search(q, { testament: fTest && fTest.value || null, book: fBook && fBook.value !== '' ? +fBook.value : null, mode: fMode && fMode.value, strict, comfort: comfortPref });
        if (fRank) fRank.value = last.comfort ? 'comfort' : 'plain';
        render(false); setStatus('');
        track('bible_search', { results: last.total, kind: last.reference ? 'reference' : (last.curated ? 'topic' : 'text') });
        const y = results.getBoundingClientRect().top + window.scrollY - 72; if (window.scrollY < y - 40) window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }).catch((err) => { console.error(err); setStatus('The Bible text didn’t load. Check your connection and try again.'); });
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); strict = false; comfortPref = null; run(input.value, true); });
    results.addEventListener('click', (e) => { const a = e.target.closest('[data-strict]'); if (!a) return; e.preventDefault(); strict = a.dataset.strict === '1'; run(current, false); });
    results.addEventListener('click', (e) => { const btn = e.target.closest('[data-expand]'); if (!btn) return; const bin = $('.results__hits', results); if (bin) bin.hidden = false; btn.closest('.results__divider').innerHTML = 'More from the whole Bible'; track('bible_search', { results: last.total, kind: 'expand' }); });
    results.addEventListener('click', (e) => { const a = e.target.closest('[data-rank]'); if (!a) return; e.preventDefault(); comfortPref = a.dataset.rank === 'plain' ? 'off' : 'on'; run(current, false); });
    [fTest, fBook, fMode].forEach((el) => el && el.addEventListener('change', () => current && run(current, false)));
    document.addEventListener('click', (e) => { const el = e.target.closest('[data-q]'); if (!el) return; e.preventDefault(); strict = false; run(el.dataset.q, true); });
    results.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]'); if (!btn) return;
      if (btn.dataset.cid) { const F = window.__FINDER__; const v = F.verses[btn.dataset.cid]; const text = `“${v.text}” — ${v.ref} (${TR})`; const url = SITE + last.curated.url + '#' + btn.dataset.cid;
        if (btn.dataset.act === 'copy') { toast((await copyText(text)) ? 'Verse copied' : 'Couldn’t copy'); track('copy_verse', { topic: last.curated.label }); }
        if (btn.dataset.act === 'share') { if (navigator.share) { try { await navigator.share({ title: v.ref, text, url }); track('share_verse', { method: 'native' }); return; } catch (err) { if (err && err.name === 'AbortError') return; } } toast((await copyText(text + '\n' + url)) ? 'Link copied' : 'Couldn’t share'); track('share_verse', { method: 'copy' }); }
        return; }
      const art = btn.closest('.hit'); const id = +art.dataset.id;
      if (btn.dataset.act === 'context') { const box = $('.hit__ctx', art); if (box.hidden) { box.innerHTML = contextHTML(id); box.hidden = false; btn.textContent = 'Hide context'; } else { box.hidden = true; btn.textContent = 'In context'; } }
      if (btn.dataset.act === 'copy') { toast((await copyText(verseString(id))) ? 'Verse copied' : 'Couldn’t copy'); track('copy_verse', { topic: slugOf(id) }); }
      if (btn.dataset.act === 'share') { const url = SITE + '/search/?q=' + encodeURIComponent(refOf(id)); const text = verseString(id); if (navigator.share) { try { await navigator.share({ title: refOf(id), text, url }); track('share_verse', { method: 'native' }); return; } catch (err) { if (err && err.name === 'AbortError') return; } } toast((await copyText(text + '\n' + url)) ? 'Link copied' : 'Couldn’t share'); track('share_verse', { method: 'copy' }); }
    });
    window.addEventListener('popstate', (e) => { const q = new URLSearchParams(location.search).get('q'); if (q) run(q, false); else { results.hidden = true; results.innerHTML = ''; input.value = ''; } });
    const q0 = new URLSearchParams(location.search).get('q'); if (q0) run(q0, false);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
