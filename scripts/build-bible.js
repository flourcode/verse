// Builds src/data/bible.json: the complete World English Bible (public domain) in a compact shape the
// browser can search. Run once (npm run bible:build); the output is committed.
//
// Shape: { translation, books: [ { n: "Genesis", s: "Gen", t: "OT", c: [ [verse1, verse2, ...], ... ] } ] }
// Chapters are arrays of verse strings, so verse 3:16 is books[i].c[2][15]. Empty strings mark verses the
// WEB leaves out (a handful of textual-variant verses in the Gospels).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import site from '../site.config.js';
const require = createRequire(import.meta.url);

const BOOKS = [
  // [file, display name, short, testament]
  ['genesis', 'Genesis', 'Gen', 'OT'], ['exodus', 'Exodus', 'Exod', 'OT'], ['leviticus', 'Leviticus', 'Lev', 'OT'], ['numbers', 'Numbers', 'Num', 'OT'], ['deuteronomy', 'Deuteronomy', 'Deut', 'OT'],
  ['joshua', 'Joshua', 'Josh', 'OT'], ['judges', 'Judges', 'Judg', 'OT'], ['ruth', 'Ruth', 'Ruth', 'OT'], ['1samuel', '1 Samuel', '1 Sam', 'OT'], ['2samuel', '2 Samuel', '2 Sam', 'OT'],
  ['1kings', '1 Kings', '1 Kgs', 'OT'], ['2kings', '2 Kings', '2 Kgs', 'OT'], ['1chronicles', '1 Chronicles', '1 Chr', 'OT'], ['2chronicles', '2 Chronicles', '2 Chr', 'OT'], ['ezra', 'Ezra', 'Ezra', 'OT'],
  ['nehemiah', 'Nehemiah', 'Neh', 'OT'], ['esther', 'Esther', 'Esth', 'OT'], ['job', 'Job', 'Job', 'OT'], ['psalms', 'Psalm', 'Ps', 'OT'], ['proverbs', 'Proverbs', 'Prov', 'OT'],
  ['ecclesiastes', 'Ecclesiastes', 'Eccl', 'OT'], ['songofsolomon', 'Song of Solomon', 'Song', 'OT'], ['isaiah', 'Isaiah', 'Isa', 'OT'], ['jeremiah', 'Jeremiah', 'Jer', 'OT'], ['lamentations', 'Lamentations', 'Lam', 'OT'],
  ['ezekiel', 'Ezekiel', 'Ezek', 'OT'], ['daniel', 'Daniel', 'Dan', 'OT'], ['hosea', 'Hosea', 'Hos', 'OT'], ['joel', 'Joel', 'Joel', 'OT'], ['amos', 'Amos', 'Amos', 'OT'],
  ['obadiah', 'Obadiah', 'Obad', 'OT'], ['jonah', 'Jonah', 'Jonah', 'OT'], ['micah', 'Micah', 'Mic', 'OT'], ['nahum', 'Nahum', 'Nah', 'OT'], ['habakkuk', 'Habakkuk', 'Hab', 'OT'],
  ['zephaniah', 'Zephaniah', 'Zeph', 'OT'], ['haggai', 'Haggai', 'Hag', 'OT'], ['zechariah', 'Zechariah', 'Zech', 'OT'], ['malachi', 'Malachi', 'Mal', 'OT'],
  ['matthew', 'Matthew', 'Matt', 'NT'], ['mark', 'Mark', 'Mark', 'NT'], ['luke', 'Luke', 'Luke', 'NT'], ['john', 'John', 'John', 'NT'], ['acts', 'Acts', 'Acts', 'NT'],
  ['romans', 'Romans', 'Rom', 'NT'], ['1corinthians', '1 Corinthians', '1 Cor', 'NT'], ['2corinthians', '2 Corinthians', '2 Cor', 'NT'], ['galatians', 'Galatians', 'Gal', 'NT'], ['ephesians', 'Ephesians', 'Eph', 'NT'],
  ['philippians', 'Philippians', 'Phil', 'NT'], ['colossians', 'Colossians', 'Col', 'NT'], ['1thessalonians', '1 Thessalonians', '1 Thess', 'NT'], ['2thessalonians', '2 Thessalonians', '2 Thess', 'NT'], ['1timothy', '1 Timothy', '1 Tim', 'NT'],
  ['2timothy', '2 Timothy', '2 Tim', 'NT'], ['titus', 'Titus', 'Titus', 'NT'], ['philemon', 'Philemon', 'Phlm', 'NT'], ['hebrews', 'Hebrews', 'Heb', 'NT'], ['james', 'James', 'Jas', 'NT'],
  ['1peter', '1 Peter', '1 Pet', 'NT'], ['2peter', '2 Peter', '2 Pet', 'NT'], ['1john', '1 John', '1 John', 'NT'], ['2john', '2 John', '2 John', 'NT'], ['3john', '3 John', '3 John', 'NT'],
  ['jude', 'Jude', 'Jude', 'NT'], ['revelation', 'Revelation', 'Rev', 'NT'],
];

const divine = site.divineName && site.divineName !== 'Yahweh' ? site.divineName : null;
function renderDivineName(text) {
  if (!divine) return text;
  const cap = divine.charAt(0).toUpperCase() + divine.slice(1);
  return text.replace(/\bYahweh\b/g, (m, i, str) => {
    const before = str.slice(0, i).replace(/[“"‘'(\s]+$/, '');
    return before === '' || /[.!?;:]$/.test(before) ? cap : divine;
  });
}

const books = [];
let verses = 0;
for (const [file, n, s, t] of BOOKS) {
  const data = require(`world-english-bible/json/${file}.json`);
  const chapters = [];
  for (const node of data) {
    if (node.type !== 'paragraph text' && node.type !== 'line text') continue;
    const ci = node.chapterNumber - 1, vi = node.verseNumber - 1;
    chapters[ci] ||= [];
    chapters[ci][vi] = (chapters[ci][vi] || '') + node.value;
  }
  const c = chapters.map((ch) => Array.from(ch, (v) => renderDivineName((v || '').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim())));
  verses += c.reduce((a, ch) => a + ch.filter(Boolean).length, 0);
  books.push({ n, s, t, c });
}
const out = { translation: `${site.translation.name} (${site.translation.abbr})`, books };
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/bible.json', JSON.stringify(out));
console.log(`bible.json: ${books.length} books, ${verses} verses, ${(fs.statSync('src/data/bible.json').size / 1048576).toFixed(2)} MB`);
