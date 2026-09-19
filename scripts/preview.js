#!/usr/bin/env node
// Builds a single self-contained HTML file (CSS, JS and finder data inlined) at preview/index.html.
// Useful for sharing the home page as one file (e.g. a claude.ai artifact). Internal links won't resolve there.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const page = process.argv[2] || '/';
const file = `${root}dist${page}${page.endsWith('/') ? 'index.html' : ''}`;
let html = readFileSync(file, 'utf8');
const css = readFileSync(`${root}dist/assets/main.css`, 'utf8');
const js = readFileSync(`${root}dist/assets/app.js`, 'utf8');
const finder = readFileSync(`${root}dist/data/finder.json`, 'utf8');
const favicon = readFileSync(`${root}dist/favicon.svg`, 'utf8');

html = html
  .replace('<link rel="stylesheet" href="assets/main.css">', `<style>${css}</style>`)
  .replace('<script src="data/finder.js" defer></script>\n', '')
  .replace('<script src="assets/app.js" defer></script>', `<script>window.__FINDER__=${finder.replace(/<\//g, '<\\/')};</script><script defer>${js.replace(/<\/script>/g, '<\\/script>')}</script>`)
  .replace('<link rel="icon" href="favicon.svg" type="image/svg+xml">', `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}">`);
mkdirSync(`${root}preview`, { recursive: true });
writeFileSync(`${root}preview/index.html`, html);
console.log(`preview/index.html (${(html.length / 1024).toFixed(0)} KB) from ${page}`);
