#!/usr/bin/env node
// Tiny static server for dist/ with clean-URL handling and a 404 page. Dev only.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.env.PORT) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  let file = join(DIST, path);
  try {
    const s = await stat(file);
    if (s.isDirectory()) { res.writeHead(301, { Location: path + '/' }); return res.end(); }
  } catch { file = join(DIST, '404.html'); res.statusCode = 404; }
  try { res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.statusCode = 500; res.end('error'); }
}).listen(PORT, () => console.log(`serving dist/ at http://localhost:${PORT}/`));
