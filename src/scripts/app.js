/* Better Verses — client script. No framework, no build step. ~6 KB minified.
   Everything here progressively enhances static HTML; every page works without it. */
(function () {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SITE = document.documentElement.dataset.site || location.origin;
  // Folder the site lives in, derived from this script's URL, so data loads work at any path or from disk.
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/assets\/app(\.[0-9a-f]+)?\.js.*$/, '') || '/';
  const LOCAL = location.protocol === 'file:';
  // Opened from disk: make "/topics/worry/" and "../topics/worry/" links open the index.html inside.
  if (LOCAL) document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a) return; let h = a.getAttribute('href');
    if (/^(https?:|mailto:|#)/.test(h)) return;
    if (h.startsWith('/')) h = BASE + h.slice(1);
    h = h.replace(/\/(\?|#|$)/, '/index.html$1');
    e.preventDefault(); location.href = h;
  });
  const TR = 'World English Bible (WEB)';

  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('is-on'), 1800);
  }

  // Analytics: never send free-text. Only classified topics and action names.
  function track(name, params) {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* noop */ }
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
    }
  }

  function verseString(v) { return `“${v.text}” — ${v.ref} (${TR})`; }

  // Red-letter markup, mirrors verseText() in src/lib/html.js
  let RED = false;
  function verseHTML(v) {
    const t = esc(v.text);
    if (!RED || !v.jesus) return `<q>${t}</q>`;
    if (v.jesus === true) return `<q><span class="rl" title="Words of Jesus">${t}</span></q>`;
    let i = v.text.indexOf(v.jesusFrom || ''); if (i < 0) return `<q>${t}</q>`;
    if (i > 0 && /[“"]/.test(v.text[i - 1])) i--;
    return `<q>${esc(v.text.slice(0, i))}<span class="rl" title="Words of Jesus">${esc(v.text.slice(i))}</span></q>`;
  }
  const trLine = (v) => (RED && v.jesus ? `${TR} · <span class="rl-key">Words of Jesus in red</span>` : TR);

  async function shareVerse(v, url, topic) {
    if (v.id && url && url.indexOf('#') < 0) url += '#' + v.id;   // deep link straight to this verse
    const text = verseString(v);
    if (navigator.share) {
      try { await navigator.share({ title: v.ref, text, url }); track('share_verse', { topic, method: 'native' }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const ok = await copyText(`${text}\n${url}`);
    toast(ok ? 'Link copied' : 'Couldn’t copy');
    track('share_verse', { topic, method: 'copy_link' });
  }

  // ---------- verse card ----------
  // Renders a card for {ref,text} within a page context {for,url,label,slug}. `why` optional.
  function cardHTML(v, ctx, why, opts) {
    opts = opts || {};
    return `
      <article class="verse verse--result" data-slug="${esc(ctx.slug || '')}">
        ${ctx.for ? `<p class="verse__for">For ${esc(ctx.for)}</p>` : ''}
        <p class="verse__ref">${esc(v.ref)}</p>
        <p class="verse__text" lang="en">${verseHTML(v)}</p>
        <p class="verse__tr">${trLine(v)}</p>
        ${why ? `<div class="verse__why"><h3>Why this fits</h3><p>${esc(why)}</p></div>` : ''}
        <div class="verse__actions">
          ${opts.another !== false ? `<button class="btn btn--primary" type="button" data-act="another">Another verse</button>` : ''}
          <button class="btn btn--ghost" type="button" data-act="copy">Copy</button>
          <button class="btn btn--ghost" type="button" data-act="share">Share</button>
        </div>
        ${ctx.url && opts.seeAll !== false ? `<p class="verse__more"><a href="${esc(ctx.url)}">See all verses for ${esc(ctx.for || ctx.label)}</a></p>` : ''}
      </article>`;
  }

  // Wires copy/share/another on any container holding a .verse card.
  function wireCard(root, getVerse, ctx, onAnother) {
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const v = getVerse(); const act = b.dataset.act;
      if (act === 'copy') { const ok = await copyText(verseString(v)); toast(ok ? 'Verse copied' : 'Couldn’t copy'); track('copy_verse', { topic: ctx.slug }); }
      if (act === 'share') shareVerse(v, ctx.url ? SITE + ctx.url : location.href, ctx.slug);
      if (act === 'another' && onAnother) { onAnother(); track('another_verse', { topic: ctx.slug }); }
    });
  }

  // ---------- data ----------
  let finderData = null, finderPromise = null;
  function loadFinder() {
    if (finderData) return Promise.resolve(finderData);
    if (window.__FINDER__) { finderData = window.__FINDER__; RED = !!finderData.redLetter; return Promise.resolve(finderData); }
    if (!finderPromise) {
      // Share one download with the search script: both use data/finder.js through window.__loadFinder.
      window.__loadFinder = window.__loadFinder || (() => window.__finderP || (window.__finderP = new Promise((res, rej) => { if (window.__FINDER__) return res(window.__FINDER__); const s = document.createElement('script'); s.src = BASE + 'data/finder.js'; s.onload = () => res(window.__FINDER__); s.onerror = rej; document.head.appendChild(s); })));
      finderPromise = window.__loadFinder().then((d) => { RED = !!d.redLetter; return (finderData = d); });
    }
    return finderPromise;
  }

  // ---------- matching ----------
  const norm = (s) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set(['i', 'im', "i'm", 'me', 'my', 'a', 'an', 'the', 'and', 'or', 'to', 'for', 'of', 'in', 'on', 'at', 'is', 'am', 'are', 'be', 'so', 'it', 'its', 'this', 'that', 'with', 'about', 'need', 'want', 'verse', 'verses', 'bible', 'help', 'feel', 'feeling', 'feels', 'have', 'has', 'just', 'really', 'very', 'please', 'today', 'right', 'now']);

  function match(q, data) {
    const n = ' ' + norm(q) + ' ';
    if (!n.trim()) return { best: null, candidates: [] };
    const tokens = n.trim().split(' ').filter((t) => t && !STOP.has(t));
    const scored = data.pages.map((p) => {
      let score = 0, hits = 0;
      for (const a of p.aliases) {
        const an = ' ' + norm(a) + ' ';
        if (n.includes(an)) { score += 3 + an.trim().split(' ').length * 2; hits++; }
        else { // single-token partial (e.g. "worrying" vs "worry")
          const at = an.trim();
          if (!at.includes(' ') && at.length >= 4) for (const t of tokens) if (t.startsWith(at) || at.startsWith(t) && t.length >= 4) { score += 1.5; hits++; break; }
        }
      }
      if (n.includes(' ' + norm(p.label) + ' ')) score += 4;
      return { p, score, hits };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    if (!scored.length) return { best: null, candidates: [] };
    const top = scored[0];
    const close = scored.filter((x) => x.score >= top.score * 0.75).slice(0, 4);
    // Ambiguous: several pages score nearly the same and the query matched only weakly.
    let ambiguous = close.length > 1 && top.score < 6;
    // "worried about surgery" ties Worry with Before surgery. The feeling word is a modifier; the
    // concrete situation is what they're facing. Prefer the one non-feelings page when exactly one exists.
    if (ambiguous) { const specific = close.filter((x) => x.p.cluster !== 'feelings'); if (specific.length === 1) return { best: specific[0].p, candidates: close.map((x) => x.p) }; }
    return { best: ambiguous ? null : top.p, candidates: close.map((x) => x.p) };
  }

  // ---------- home finder ----------
  function initFinder() {
    const form = $('#finder'); if (!form) return;
    const input = $('#q', form), result = $('#result'), status = $('#finder-status');
    let current = null, order = [], idx = 0;

    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    idle(() => loadFinder());

    // Example placeholders rotate until the person starts typing. Never a pre-filled value: the box is theirs.
    try {
      const ex = JSON.parse(input.dataset.examples || '[]');
      if (ex.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let i = Math.floor(Math.random() * ex.length); input.placeholder = ex[i];
        const t = setInterval(() => { if (input.value || document.activeElement === input) return; i = (i + 1) % ex.length; input.placeholder = ex[i]; }, 3200);
        input.addEventListener('input', () => clearInterval(t), { once: true });
      }
    } catch (e) { /* keep server placeholder */ }

    function show(page, data, opts) {
      current = page; order = page.verses.map((_, i) => i); idx = 0;
      // Shuffle everything after the primary so "Another verse" feels fresh without hiding the best pick.
      if (opts && opts.random) { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
      else { const rest = order.slice(1); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; } order = [order[0]].concat(rest); }
      render(data);
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function verseAt() { const e = current.verses[order[idx]]; return Object.assign({ why: e.why }, finderData.verses[e.id]); }
    function render() {
      const v = verseAt();
      const related = current.related.map((s) => finderData.pages.find((p) => p.slug === s)).filter(Boolean).slice(0, 5);
      result.innerHTML = cardHTML(v, current, v.why) +
        (related.length ? `<p class="chips__label">Related</p><ul class="chips">${related.map((r) => `<li><a class="chip" href="${esc(r.url)}" data-related>${esc(r.label)}</a></li>`).join('')}</ul>` : '');
    }
    wireCard(result, verseAt, { get slug() { return current && current.slug; }, get url() { return current && current.url; } }, () => { idx = (idx + 1) % order.length; render(); });
    result.addEventListener('click', (e) => { if (e.target.closest('[data-related]')) track('related_topic_click', { from: current && current.slug }); });

    function noResult(candidates, data) {
      const sug = (candidates.length ? candidates : data.suggestions.map((s) => data.pages.find((p) => p.slug === s)).filter(Boolean));
      result.innerHTML = `
        <div class="verse verse--result state">
          <h2 style="margin-top:0">${candidates.length ? 'Which sounds closest?' : 'We don’t have that exact topic yet.'}</h2>
          <p class="muted">${candidates.length ? 'Pick one and we’ll find a verse.' : 'Try one of these related themes, or let us pick a verse for you.'}</p>
          <ul class="chips">${sug.map((p) => `<li><button class="chip" type="button" data-pick="${esc(p.slug)}">${esc(p.label)}</button></li>`).join('')}</ul>
          <p style="margin-top:1rem"><button class="btn btn--ghost" type="button" data-surprise>Give me a random verse</button> <a class="btn btn--link" href="/topics/">Browse all topics</a></p>
        </div>`;
    }
    result.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]'); if (pick) { const p = finderData.pages.find((x) => x.slug === pick.dataset.pick); if (p) { track('topic_selected', { topic: p.slug, via: 'suggestion' }); show(p, finderData); } }
      if (e.target.closest('[data-surprise]')) surprise();
    });

    async function search(q) {
      status.textContent = 'Finding a verse…';
      const data = await loadFinder();
      const m = match(q, data);
      status.textContent = '';
      if (m.best) { track('verse_search', { topic: m.best.slug, matched: true }); show(m.best, data); }
      else { track('verse_search', { topic: m.candidates[0] ? m.candidates[0].slug : 'none', matched: false }); noResult(m.candidates, data); }
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); if (q) search(q); else input.focus(); });

    $$('[data-topic]', form.parentElement).forEach((chip) => chip.addEventListener('click', async (e) => {
      e.preventDefault(); const data = await loadFinder(); const p = data.pages.find((x) => x.slug === chip.dataset.topic);
      if (p) { input.value = chip.textContent.trim(); track('topic_selected', { topic: p.slug, via: 'chip' }); show(p, data); }
    }));

    async function surprise() {
      const data = await loadFinder(); const p = data.pages[Math.floor(Math.random() * data.pages.length)];
      input.value = ''; track('topic_selected', { topic: p.slug, via: 'surprise' }); show(p, data, { random: true });
    }
    $$('[data-surprise]').forEach((b) => b.addEventListener('click', surprise));

    // Deep links: /?topic=worry or /?q=text (not indexable; canonical stays /)
    const params = new URLSearchParams(location.search);
    const t = params.get('topic'), q0 = params.get('q');
    if (t) loadFinder().then((d) => { const p = d.pages.find((x) => x.slug === t); if (p) show(p, d); });
    else if (q0) { input.value = q0; search(q0); }
  }

  // ---------- topic page ----------
  function initTopic() {
    const holder = $('#page-data'); const card = $('#lead-verse'); if (!holder || !card) return;
    const data = JSON.parse(holder.textContent); let idx = 0; RED = !!data.redLetter;
    const ctx = { slug: data.slug, url: data.url, for: data.for };
    const at = () => Object.assign({ why: data.verses[idx].why }, data.verses[idx]);
    // Arriving from a shared link (#verse-id): show that verse first.
    const want = location.hash.slice(1); const wi = want ? data.verses.findIndex((v) => v.id === want) : -1;
    if (wi > 0) { idx = wi; card.innerHTML = cardHTML(at(), ctx, at().why, { seeAll: false }); }
    wireCard(card, at, ctx, () => {
      idx = (idx + 1) % data.verses.length;
      card.innerHTML = cardHTML(at(), ctx, at().why, { seeAll: false });
    });
    // Copy buttons on the long list
    const list = $('#verse-list'); if (list) list.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      const li = b.closest('li'); const v = { ref: $('.verse__ref', li).textContent, text: $('.verse__text', li).textContent };
      const ok = await copyText(verseString(v)); toast(ok ? 'Verse copied' : 'Couldn’t copy'); track('copy_verse', { topic: data.slug, via: 'list' });
    });
  }

  // ---------- today ----------
  // The day changes at local midnight, so everyone in a time zone sees the same verse all day.
  // The page is built with the UTC day; if the reader's day differs, the card is swapped in place.
  function todayEntry(d) {
    const now = new Date();
    const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
    const i = ((day % d.pool.length) + d.pool.length) % d.pool.length;
    return { i, entry: d.pool[i] };
  }
  function initToday() {
    const holder = $('#today-data'); const box = $('#today'); if (!holder || !box) return;
    const d = JSON.parse(holder.textContent); // { pool: [{id,ref,text,context,question}], renderedIndex }
    const { i, entry } = todayEntry(d);
    if (i !== d.renderedIndex) {
      RED = !!d.redLetter; $('.verse__ref', box).textContent = entry.ref; $('.verse__text', box).innerHTML = verseHTML(entry); $('[data-tr]', box).innerHTML = trLine(entry);
      $('[data-context]', box).textContent = entry.context; $('[data-question]', box).textContent = entry.question;
      box.dataset.index = i;
    }
    wireCard(box, () => ({ ref: $('.verse__ref', box).textContent, text: $('.verse__text q', box).textContent }), { slug: 'today', url: '/today/' });
    const date = $('[data-date]'); if (date) date.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  // ---------- random ----------
  function initRandom() {
    const box = $('#random'); if (!box) return;
    const filters = $('#random-filters'); let active = 'all'; let cur = null;
    const FILTERS = JSON.parse($('#random-data').textContent); // { key: [slugs] }
    const at = () => cur;
    function pick() {
      const pool = finderData.pages.filter((p) => active === 'all' || FILTERS[active].includes(p.slug));
      const page = pool[Math.floor(Math.random() * pool.length)];
      const e = page.verses[Math.floor(Math.random() * page.verses.length)];
      cur = Object.assign({ why: e.why }, finderData.verses[e.id]);
      box.innerHTML = cardHTML(cur, page, e.why).replace('Another verse', 'Give me another');
      track('another_verse', { topic: page.slug, via: 'random' });
    }
    wireCard(box, at, { get slug() { return cur && cur.slug; }, get url() { return null; } }, pick);
    if (filters) filters.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      $$('[data-filter]', filters).forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true'); active = b.dataset.filter; pick();
    });
    loadFinder().then(pick);
  }

  function initHomeDaily() {
    const box = $('#home-daily'); if (!box) return;
    const holder = $('#home-data');
    if (holder) { const d = JSON.parse(holder.textContent); const { i, entry } = todayEntry(d); if (i !== d.renderedIndex) { RED = !!d.redLetter; $('.verse__ref', box).textContent = entry.ref; $('.verse__text', box).innerHTML = verseHTML(entry); $('[data-tr]', box).innerHTML = trLine(entry); $('[data-context]', box).textContent = entry.context; } }
    wireCard(box, () => ({ ref: $('.verse__ref', box).textContent, text: $('.verse__text', box).textContent }), { slug: 'today', url: '/today/' });
  }

  function initMenu() {
    const m = $('details.menu'); if (!m) return;
    document.addEventListener('click', (e) => { if (m.open && !m.contains(e.target)) m.open = false; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.open) { m.open = false; $('summary', m).focus(); } });
  }
  // "Text it": opens Messages with the verse and reference filled in. Shown only where sms: links work.
  function initTextIt() {
    const ok = /iPhone|iPad|iPod|Android|Macintosh/.test(navigator.userAgent);
    const show = () => { if (ok) document.querySelectorAll('[data-text-it][hidden]').forEach((b) => { b.hidden = false; }); };
    show(); new MutationObserver(show).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-text-it]'); if (!b) return;
      const box = b.closest('.pick, .hit, li, .card, .daily, .verse, article, figure') || document;
      const ref = (box.querySelector('.verse__ref, .hit__ref') || {}).textContent || '';
      const text = ((box.querySelector('.verse__text, .hit__text, .pick__text') || {}).textContent || '').trim().replace(/^[“"]+|[”"]+$/g, '');
      if (!text) return;
      const body = `“${text}” — ${ref.trim()} (${TR})`;
      track('text_verse', { ref: ref.trim() });
      location.href = (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? 'sms:&body=' : 'sms:?body=') + encodeURIComponent(body);
    });
  }
  // Seasonal chips on the home page: the occasion that's coming up, first.
  function initSeason() {
    const list = document.querySelector('#h-pop') && document.querySelector('#h-pop').parentElement.querySelector('.chips'); if (!list) return;
    const now = new Date(); const y = now.getFullYear(); const d = (m, day) => new Date(y, m - 1, day);
    const nth = (m, dow, n) => { const f = d(m, 1); return d(m, 1 + ((dow - f.getDay() + 7) % 7) + (n - 1) * 7); };
    const last = (m, dow) => { const e = d(m + 1, 0); return d(m, e.getDate() - ((e.getDay() - dow + 7) % 7)); };
    const easter = (() => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return d(mo, da); })();
    const days = (x) => x * 864e5; const between = (a, b) => now >= a && now <= new Date(+b + days(1));
    const S = [
      [new Date(+easter - days(21)), easter, 'easter-card', 'Easter card'],
      [new Date(+nth(5, 0, 2) - days(18)), nth(5, 0, 2), 'mothers-day-card', 'Mother’s Day card'],
      [new Date(+last(5, 1) - days(10)), last(5, 1), 'memorial-day', 'Memorial Day'],
      [d(5, 1), d(6, 20), 'graduation-card', 'Graduation card'],
      [new Date(+nth(6, 0, 3) - days(18)), nth(6, 0, 3), 'fathers-day-card', 'Father’s Day card'],
      [d(11, 1), d(11, 11), 'memorial-day', 'Veterans Day'],
      [d(11, 1), nth(11, 4, 4), 'thanksgiving', 'Thanksgiving'],
      [d(11, 25), d(12, 31), 'christmas-card', 'Christmas card'],
    ].filter(([a, b]) => between(a, b)).slice(0, 2);
    S.reverse().forEach(([, , slug, label]) => { const li = document.createElement('li'); li.innerHTML = `<a class="chip chip--season" href="${BASE}occasions/${slug}/">${label}</a>`; list.prepend(li); });
  }
  function initPrintables() {
    document.addEventListener('click', (e) => { const a = e.target.closest('a[href$=".pdf"]'); if (!a) return; track('printable_open', { sheet: a.getAttribute('href').split('/').pop().replace('.pdf', '') }); });
  }
  function initPassages() {
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-copy-passage]'); if (!b) return;
      const fig = b.closest('.passage'); const text = fig.querySelector('.verse__text').textContent.replace(/\s+/g, ' ').trim();
      toast((await copyText(`“${text}” — ${b.dataset.ref} (${TR})`)) ? 'Passage copied' : 'Couldn’t copy'); track('copy_verse', { topic: b.dataset.ref.replace(/\s+/g, '-').toLowerCase() });
    });
  }
  document.addEventListener('DOMContentLoaded', () => { initMenu(); initPassages(); initPrintables(); initTextIt(); initSeason(); initFinder(); initHomeDaily(); initTopic(); initToday(); initRandom(); });
})();
