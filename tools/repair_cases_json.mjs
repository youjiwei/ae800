import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'cases', 'data', 'cases.json');

function extractObject(text, start) {
  let i = start;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return { end: i + 1, json: text.slice(start, i + 1) };
      }
    }
  }

  return null;
}

function scoreCase(c) {
  const imgs = Array.isArray(c.images) ? c.images.length : 0;
  const desc = String(c.description || '').length;
  const tags = Array.isArray(c.tags) ? c.tags.length : 0;
  return imgs * 10000 + desc * 10 + tags;
}

async function main() {
  const raw = await fs.readFile(JSON_PATH, 'utf8');

  const re = /"id"\s*:\s*"(case-\d+)"/g;
  const bestById = new Map();

  let m;
  while ((m = re.exec(raw))) {
    const id = m[1];

    // Find the start "{" for this object by scanning backwards.
    let start = raw.lastIndexOf('{', m.index);
    if (start < 0) continue;

    const extracted = extractObject(raw, start);
    if (!extracted) continue;

    let obj;
    try {
      obj = JSON.parse(extracted.json);
    } catch {
      continue;
    }

    if (!obj || typeof obj !== 'object') continue;
    if (String(obj.id || '') !== id) continue;

    const prev = bestById.get(id);
    if (!prev || scoreCase(obj) > scoreCase(prev)) {
      bestById.set(id, obj);
    }
  }

  const cases = Array.from(bestById.values());
  cases.sort((a, b) => {
    const ya = Number(String(a.year || '').match(/\d{4}/)?.[0] || 0);
    const yb = Number(String(b.year || '').match(/\d{4}/)?.[0] || 0);
    if (ya !== yb) return yb - ya;
    return String(a.title || '').localeCompare(String(b.title || ''), 'zh-Hans-CN');
  });

  const out = { cases };
  await fs.writeFile(JSON_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Repaired cases.json: ${cases.length} cases -> ${JSON_PATH}`);
}

await main();
