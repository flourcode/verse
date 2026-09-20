#!/usr/bin/env node
// Builds a single self-contained HTML file (CSS, JS and finder data inlined) at preview/index.html.
// Useful for sharing the home page as one file (e.g. a claude.ai artifact). Internal links won't resolve there.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const page = process.argv[2] || '/';
const file = `${root}dist${page}${page.endsWith('/') ? 'index.html' : ''}`;
let html = readFileSync(file, 'utf8');
import { readdirSync } from 'node:fs';
const A = readdirSync(`${root}dist/assets`); const cssName = A.find((f) => f.startsWith('main.')); const jsName = A.find((f) => f.startsWith('app.'));
const css = readFileSync(`${root}dist/assets/${cssName}`, 'utf8');
const js = readFileSync(`${root}dist/assets/${jsName}`, 'utf8');
const finder = readFileSync(`${root}dist/data/finder.json`, 'utf8');
const favicon = readFileSync(`${root}dist/favicon.svg`, 'utf8');

html = html
  .replace(`<link rel="stylesheet" href="assets/${cssName}">`, `<style>${css}</style>`)
  .replace('<script src="data/finder.js" defer></script>\n', '')
  .replace(`<script src="assets/${jsName}" defer></script>`, `<script>window.__FINDER__=${finder.replace(/<\//g, '<\\/')};</script><script defer>${js.replace(/<\/script>/g, '<\\/script>')}</script>`)
  .replace('<link rel="icon" href="favicon.svg" type="image/svg+xml">', `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}">`);
mkdirSync(`${root}preview`, { recursive: true });
writeFileSync(`${root}preview/index.html`, html);
console.log(`preview/index.html (${(html.length / 1024).toFixed(0)} KB) from ${page}`);
