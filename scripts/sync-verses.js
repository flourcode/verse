// Fills `reference` and `text` for every entry in src/data/verses.json using the
// public-domain World English Bible (via the `world-english-bible` npm package,
// which is only a devDependency — the build itself has zero dependencies).
//
// Usage: npm run verses:sync
//
// Add a verse by appending { id, book, chapter, start, end, genre } to verses.json
// and re-running this script. It never overwrites hand-edited fields other than
// `reference` and `text`.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const file = path.resolve('src/data/verses.json');
const verses = JSON.parse(fs.readFileSync(file, 'utf8'));

const cache = new Map();
function loadBook(book) {
  const key = book.toLowerCase().replace(/\s+/g, '');
  if (!cache.has(key)) cache.set(key, require(`world-english-bible/json/${key}.json`));
  return cache.get(key);
}

// Display name: the WEB package uses "Psalms"; references conventionally read "Psalm 23:4".
function displayBook(book) {
  return book === 'Psalms' ? 'Psalm' : book;
}

function verseText(book, chapter, start, end) {
  const data = loadBook(book);
  const parts = data.filter(
    (n) => (n.type === 'paragraph text' || n.type === 'line text') &&
      n.chapterNumber === chapter && n.verseNumber >= start && n.verseNumber <= end
  );
  if (!parts.length) throw new Error(`No text found for ${book} ${chapter}:${start}-${end}`);
  let text = parts.map((p) => p.value).join(' ').replace(/\s+/g, ' ').trim();
  // Drop quotation marks left dangling at the edges of an excerpt (the speech they
  // close or open lives in surrounding verses). Marks inside the text are kept.
  if (!text.includes('“')) text = text.replace(/\s*”\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text.includes('”')) text = text.replace(/\s*“\s*/g, ' ').replace(/\s+/g, ' ').trim();
  text = text.replace(/\s+([,.;:])/g, '$1');
  return text;
}

// Optional excerpting: { "excerptFrom": "Behold, I am" } starts the quoted text at
// that phrase and prefixes an ellipsis, so a long verse can be quoted from a clause.
function applyExcerpt(text, v) {
  if (!v.excerptFrom) return text;
  const i = text.indexOf(v.excerptFrom);
  if (i < 0) throw new Error(`excerptFrom "${v.excerptFrom}" not found in ${v.id}`);
  return '… ' + text.slice(i);
}

let changed = 0;
for (const v of verses) {
  const ref = `${displayBook(v.book)} ${v.chapter}:${v.start}${v.end && v.end !== v.start ? '-' + v.end : ''}`;
  const text = applyExcerpt(verseText(v.book, v.chapter, v.start, v.end || v.start), v);
  if (v.reference !== ref || v.text !== text) changed++;
  v.reference = ref;
  v.text = text;
  v.translation = 'WEB';
}

// Keep a stable key order for readable diffs.
const ordered = verses.map((v) => ({
  id: v.id, book: v.book, chapter: v.chapter, start: v.start, end: v.end,
  reference: v.reference, genre: v.genre, translation: v.translation,
  ...(v.excerptFrom ? { excerptFrom: v.excerptFrom } : {}), text: v.text,
}));
fs.writeFileSync(file, JSON.stringify(ordered, null, 2) + '\n');
console.log(`Synced ${verses.length} verses (${changed} updated) from the World English Bible.`);
