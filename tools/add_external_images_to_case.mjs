import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'cases', 'data', 'cases.v2.json');
const ASSETS_DIR = path.join(ROOT, 'cases', 'assets');

function getArg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return '';
  return process.argv[i + 1] || '';
}

function getArgs(name) {
  const out = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === name) out.push(process.argv[i + 1]);
  }
  return out.filter(Boolean);
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = String(x || '').trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function extFromUrl(u) {
  const s = String(u || '');
  const m = s.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|#|$)/i);
  if (m) return m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  return 'png';
}

async function download(url, outFile) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; AE800Bot/1.0; +https://www.ae800.com/)'
    }
  });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outFile, buf);
  return buf.length;
}

async function main() {
  const id = getArg('--id') || '';
  const imgs = getArgs('--img');
  const prefix = getArg('--prefix') || 'img-ext';
  const write = process.argv.includes('--write');

  if (!id || !imgs.length) {
    console.log('Usage: node tools/add_external_images_to_case.mjs --id case-112 --img <URL> --img <URL> ... [--prefix img-ext] [--write]');
    process.exit(1);
  }

  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const cases = Array.isArray(parsed?.cases) ? parsed.cases : [];
  const idx = cases.findIndex((c) => String(c?.id || '') === id);
  if (idx < 0) throw new Error(`case not found: ${id}`);

  const c = cases[idx];
  const caseDir = path.join(ASSETS_DIR, id);
  await fs.mkdir(caseDir, { recursive: true });

  const downloaded = [];
  for (let i = 0; i < imgs.length; i += 1) {
    const u = imgs[i];
    const ext = extFromUrl(u);
    const fname = `${prefix}-${String(i + 1).padStart(3, '0')}.${ext}`;
    const outFile = path.join(caseDir, fname);
    try {
      const bytes = await download(u, outFile);
      console.log(`Downloaded ${fname} (${bytes} bytes)`);
      downloaded.push(`./assets/${id}/${fname}`);
    } catch (e) {
      console.log(`Skip: ${u} (${e?.message || e})`);
    }
  }

  const merged = uniq([...(Array.isArray(c.images) ? c.images : []), ...downloaded]);

  console.log('Preview:');
  console.log(JSON.stringify({ id, add_count: downloaded.length, images_tail: merged.slice(-Math.min(merged.length, 8)) }, null, 2));

  if (!write) {
    console.log('Dry-run only. Re-run with --write to update cases.v2.json');
    return;
  }

  cases[idx] = { ...c, images: merged };
  await fs.writeFile(DATA_PATH, JSON.stringify({ cases }, null, 2), 'utf8');
  console.log(`Updated ${id} images (+${downloaded.length}) in ${DATA_PATH}`);
}

await main();
