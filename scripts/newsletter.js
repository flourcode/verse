#!/usr/bin/env node
/**
 * Better Verses — weekly newsletter generator for Kit (kit.com).
 *
 *   npm run newsletter                 → this week's issue
 *   npm run newsletter -- --date 2026-10-05
 *   npm run newsletter -- --issue 7    → a specific issue number (for previewing ahead)
 *
 * Writes newsletter/<date>/ with:
 *   email.html    paste into a Kit broadcast (HTML editor / "raw HTML" block), or use as a Kit template
 *   email.txt     plain-text version
 *   subject.txt   subject line + preview text
 *
 * Every issue is assembled from content already on the site (the daily pool, situation pages, the
 * ministry guides, the sayings file), so it never drifts from what the site says. Rotation is by
 * issue number, so issue 12 is the same whether you generate it today or next month.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

// ---------- data ----------
const bible = json('src/data/bible.json');
const verses = Object.fromEntries(json('src/data/verses.json').map((v) => [v.id, v]));
const daily = json('src/data/daily.json');
const pages = [...json('src/content/topics.json'), ...json('src/content/situations.json'), ...json('src/content/occasions.json')];
const guides = json('src/content/guides.json');
const sayings = json('src/data/sayings.json').filter((s) => s.status === 'not' || s.status === 'misquote');
const versePages = json('src/content/verses-pages.json');
const posts = readdirSync(join(ROOT, 'src/content/journal')).filter((f) => f.endsWith('.js')).sort();
const TYPE_URL = { topic: '/topics/', situation: '/situations/', occasion: '/occasions/' };
const SHEET = { 'before-surgery': 'hospital-room', 'cancer-diagnosis': 'hospital-room', 'waiting-for-test-results': 'waiting-for-test-results', 'waiting-for-bad-news': 'waiting-for-test-results', 'grief': 'grief', 'loss-of-a-spouse': 'grief', 'loss-of-a-parent': 'grief', 'loss-of-a-child': 'grief', 'sympathy-card': 'funeral-scripture', 'someone-dying': 'end-of-life', 'marriage': 'wedding-scripture', 'cannot-sleep': 'for-tonight', 'anxiety': 'for-tonight', 'overwhelmed': 'caregivers' };
const urlFor = (p) => `${site.url}${TYPE_URL[p.type]}${p.slug}/`;

function passage(ref) {
  const m = /^(.+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref); const bk = bible.books.find((b) => b.n.toLowerCase() === m[1].toLowerCase());
  const ch = bk.c[+m[2] - 1]; const out = []; for (let v = +m[3]; v <= +(m[4] || m[3]); v++) out.push(ch[v - 1]);
  return out.join(' ');
}

// ---------- issue selection ----------
const date = arg('--date') ? new Date(arg('--date') + 'T12:00:00Z') : new Date();
const epochWeek = Math.floor((date.getTime() / 86400000 + 3) / 7);   // Monday-based week number
const issue = arg('--issue') ? +arg('--issue') : epochWeek - 2958;    // issue 1 in the launch week; adjust the constant once and never again
const pick = (arr, salt) => arr[(((issue - 1) + salt) % arr.length + arr.length) % arr.length];

// Rotation: a verse from the daily pool, a situation page for "someone you care about" (situations and occasions first),
// a pastoral-care note, a saying, and the daily entry's question.
const d = pick(daily, 0);
const v = verses[d.id];
const situationPages = pages.filter((p) => p.type !== 'topic').concat(pages.filter((p) => p.type === 'topic'));
const sp = pick(situationPages, 3);
const spLead = sp.verses[0]; const spVerse = verses[spLead.id];
const care = guides.find((g) => g.slug === 'pastoral-care-scripture');
const careItems = care.sections.flatMap((s) => s.refs.map((r) => ({ ...r, section: s.h })));
const ci = pick(careItems, 5);
const sy = pick(sayings, 1);
const vp = pick(versePages, 2);

const fmt = (dt) => dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// What to write: a one-line suggestion for a card or a text, from the page when it has wording, else a plain default
const wording = sp.wording && sp.wording.length ? pick(sp.wording, 4) : `Thinking of you today. This came to mind and I wanted you to have it.`;

// ---------- subject + preview ----------
const subject = `${v.reference}, for ${sp.for}`;
const preview = `${v.text.slice(0, 90).replace(/\s+\S*$/, '')}…`;

// ---------- HTML email (tables + inline styles; renders in Gmail, Apple Mail, Outlook) ----------
const G = '#2E7D32', INK = '#182019', INK2 = '#59635B', LINE = '#D7E1D9', MINT = '#E8F5E9', PALE = '#F5FAF6';
const serif = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const p = (t, extra = '') => `<p style="margin:0 0 14px;font:16px/1.55 ${sans};color:${INK};${extra}">${t}</p>`;
const h2 = (t) => `<p style="margin:28px 0 8px;font:700 12px/1.4 ${sans};letter-spacing:.08em;text-transform:uppercase;color:${G};">${t}</p>`;
const verseBlock = (ref, text, bg = MINT) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 16px;"><tr><td style="background:${bg};border-radius:16px;padding:18px 20px;">
  <p style="margin:0 0 6px;font:600 15px/1.3 ${sans};color:${G};">${esc(ref)}</p>
  <p style="margin:0 0 8px;font:400 21px/1.4 ${serif};color:${INK};">“${esc(text)}”</p>
  <p style="margin:0;font:13px/1.4 ${sans};color:${INK2};">World English Bible (WEB)</p>
</td></tr></table>`;
const btn = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;"><tr><td style="background:${G};border-radius:999px;"><a href="${href}" style="display:inline-block;padding:12px 22px;font:600 15px/1 ${sans};color:#ffffff;text-decoration:none;">${label}</a></td></tr></table>`;
const link = (href, t) => `<a href="${href}" style="color:${G};text-decoration:underline;">${t}</a>`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${PALE};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALE};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;">
<tr><td style="padding:28px 28px 8px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:10px;"><img src="${site.url}/icon-192.png" width="36" height="36" alt="" style="display:block;border-radius:9px;"></td>
    <td style="font:700 17px/1 ${sans};color:${INK};">Better Verses</td>
  </tr></table>
  <p style="margin:22px 0 4px;font:700 12px/1.4 ${sans};letter-spacing:.08em;text-transform:uppercase;color:${INK2};">Weekly · Issue ${issue} · ${fmt(date)}</p>
  <p style="margin:0 0 18px;font:600 26px/1.2 ${serif};color:${INK};">A verse for ${esc(sp.for)}.</p>
  ${p(`Hi {{ subscriber.first_name | default: "there" }}. Once a week: a verse read slowly, something for someone you care about, something for those who comfort others, and a little help separating what the Bible says from what we think it says. Glad you’re here.`)}

  ${h2('This week’s verse')}
  ${verseBlock(v.reference, v.text)}
  ${p(esc(d.context))}
  ${p(`<strong>A question to carry:</strong> ${esc(d.question)}`, `color:${INK2};`)}

  ${h2('For someone you care about')}
  ${p(`<strong>${esc(sp.h1)}.</strong> ${esc(sp.intro)}`)}
  ${verseBlock(spVerse.reference, spVerse.text, PALE)}
  ${p(esc(spLead.why))}
  ${p(`<strong>If you’re writing it in a card or a text:</strong> “${esc(wording)}”`, `color:${INK2};`)}
  ${btn(urlFor(sp), `All the verses for ${esc(sp.for)}`)}
  ${SHEET[sp.slug] ? p(`On paper: ${link(site.url + '/print/' + SHEET[sp.slug] + '.pdf', 'a free one-sheet PDF')} you can print and hand to someone.`, `color:${INK2};font-size:15px;margin-top:-8px;`) : ''}

  ${h2('For those who comfort others')}
  ${p(`<strong>${esc(ci.section)}.</strong> ${esc(ci.why)}`)}
  ${verseBlock(ci.ref, passage(ci.ref), PALE)}
  ${p(`The full quick reference is at ${link(site.url + '/ministry/', 'betterverses.com/ministry')}, and the ${link(site.url + '/print/comfort-kit.pdf', 'Comfort Kit')} is eight care sheets in one PDF for the office drawer.`, `color:${INK2};`)}

  ${h2('Is that in the Bible?')}
  ${p(`<strong>“${esc(sy.say[0].replace(/^\w/, (c) => c.toUpperCase()))}.”</strong> ${esc(sy.note)}`)}
  ${sy.ref ? verseBlock(sy.ref, passage(sy.ref), PALE) : ''}

  ${h2('Read it in context')}
  ${p(`<strong>${esc(vp.h1)}:</strong> ${esc(vp.tagline)} ${link(site.url + '/verses/' + vp.slug + '/', 'Why it’s so often misread →')}`)}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;"><tr><td style="border-top:1px solid ${LINE};padding-top:18px;">
  ${p(`Only remember part of a verse? ${link(site.url + '/search/', 'Search the whole Bible in plain English')}. It understands “my friend just lost her mother” and “that verse about the birds.”`, `color:${INK2};font-size:15px;`)}
  ${p(`Reply to this email and I read it: ${link('mailto:' + site.contactEmail, site.contactEmail)}. If a verse here is out of place, or someone you know needs a page I don’t have yet, say so.`, `color:${INK2};font-size:15px;`)}
  ${p(`Until next week: read the whole chapter first.`, `color:${INK};font-weight:600;`)}
  </td></tr></table>
</td></tr>
<tr><td style="padding:8px 28px 26px;">
  <p style="margin:0;font:13px/1.5 ${sans};color:${INK2};">Better Verses · ${link(site.url + '/', 'betterverses.com')} · Scripture from the World English Bible, public domain.<br><a href="{{ unsubscribe_url }}" style="color:${INK2};">Unsubscribe</a> · {{ subscriber.email_address }}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

// ---------- plain text ----------
const wrap = (s) => s.replace(/(.{1,72})(\s+|$)/g, '$1\n').trim();
const text = `BETTER VERSES — Weekly, Issue ${issue} — ${fmt(date)}
A verse for ${sp.for}.

Once a week: a verse read slowly, something for someone you care about, something for those who comfort others, and a little help separating what the Bible says from what we think it says. Glad you're here.

THIS WEEK'S VERSE
${v.reference}
"${v.text}"
(World English Bible)

${wrap(d.context)}

A question to carry: ${d.question}

FOR SOMEONE YOU CARE ABOUT
${sp.h1}. ${wrap(sp.intro)}

${spVerse.reference}
"${spVerse.text}"

${wrap(spLead.why)}

If you're writing it in a card or a text: "${wording}"
All the verses: ${urlFor(sp)}${SHEET[sp.slug] ? `\nOn paper: ${site.url}/print/${SHEET[sp.slug]}.pdf` : ''}

FOR THOSE WHO COMFORT OTHERS
${ci.section}. ${wrap(ci.why)}

${ci.ref}
"${passage(ci.ref)}"

The full quick reference: ${site.url}/ministry/
The Comfort Kit, eight care sheets in one PDF: ${site.url}/print/comfort-kit.pdf

IS THAT IN THE BIBLE?
"${sy.say[0]}" — ${wrap(sy.note)}
${sy.ref ? `\n${sy.ref}\n"${passage(sy.ref)}"\n` : ''}
READ IT IN CONTEXT
${vp.h1}: ${vp.tagline} ${site.url}/verses/${vp.slug}/

--
Only remember part of a verse? ${site.url}/search/
Reply to this email and I read it: ${site.contactEmail}

Until next week: read the whole chapter first.
Unsubscribe: {{ unsubscribe_url }}
`;

// ---------- write ----------
const stamp = date.toISOString().slice(0, 10);
const dir = join(ROOT, 'newsletter', stamp); mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'email.html'), html);
writeFileSync(join(dir, 'email.txt'), text);
writeFileSync(join(dir, 'subject.txt'), `Subject: ${subject}\nPreview: ${preview}\n`);
console.log(`Issue ${issue} (${stamp}) → newsletter/${stamp}/\n  Subject: ${subject}\n  Verse: ${v.reference} · Situation: ${sp.h1} · Care: ${ci.ref} · Saying: “${sy.say[0]}” · Context: ${vp.h1}`);
