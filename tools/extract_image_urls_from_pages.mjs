import fs from 'node:fs/promises';
import path from 'node:path';

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

function toAbs(base, u) {
  try {
    return new URL(u, base).toString();
  } catch {
    return '';
  }
}

function parseSrcset(srcset) {
  const s = String(srcset || '').trim();
  if (!s) return [];
  return s
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function isImageUrl(u) {
  return /\.(jpe?g|png|webp|gif|bmp|tiff)(\?|#|$)/i.test(String(u || ''));
}

function looksLikeNoise(u) {
  const s = String(u || '').toLowerCase();
  if (!s) return true;
  if (s.includes('sprite')) return true;
  if (s.includes('icon')) return true;
  if (s.includes('logo')) return true;
  if (s.includes('favicon')) return true;
  if (s.includes('avatar')) return true;
  if (s.includes('qr')) return true;
  if (s.includes('wechat')) return true;
  if (s.includes('wx')) return true;
  if (s.includes('data:image/')) return true;
  return false;
}

function scoreUrl(u) {
  const s = String(u || '').toLowerCase();
  let score = 0;
  if (/(upload|uploads|images|img|picture|photo|news|content)/.test(s)) score += 2;
  if (/(banner|hero|cover)/.test(s)) score += 1;
  if (/(thumb|small|icon|logo|sprite)/.test(s)) score -= 3;
  if (/\b1600px\b/.test(s)) score += 2;
  if (/\b1200px\b/.test(s)) score += 1;
  if (/\b800px\b/.test(s)) score += 1;
  return score;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; AE800Bot/1.0; +https://www.ae800.com/)'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function extractImageCandidates(html, baseUrl) {
  const out = [];

  // meta og:image
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (og?.[1]) out.push(toAbs(baseUrl, og[1]));

  // img tags: src / data-src / data-original / srcset
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const dsrc = tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1];
    const orig = tag.match(/\bdata-original=["']([^"']+)["']/i)?.[1];
    const srcset = tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1];

    for (const u of [src, dsrc, orig]) {
      if (u) out.push(toAbs(baseUrl, u));
    }
    if (srcset) {
      for (const u of parseSrcset(srcset)) out.push(toAbs(baseUrl, u));
    }
  }

  return uniq(out)
    .filter(Boolean)
    .filter((u) => isImageUrl(u))
    .filter((u) => !looksLikeNoise(u))
    .sort((a, b) => scoreUrl(b) - scoreUrl(a));
}

async function main() {
  const urls = getArgs('--url');
  const outJson = process.argv.includes('--json');
  const save = process.argv.includes('--save');

  if (!urls.length) {
    console.log('Usage: node tools/extract_image_urls_from_pages.mjs --url <URL1> --url <URL2> [--json] [--save]');
    process.exit(1);
  }

  const results = {};

  for (const u of urls) {
    try {
      console.log(`\n=== ${u} ===`);
      const html = await fetchHtml(u);
      const imgs = extractImageCandidates(html, u);
      results[u] = imgs;
      for (let i = 0; i < Math.min(imgs.length, 30); i += 1) {
        console.log(`${String(i + 1).padStart(2, '0')}. ${imgs[i]}`);
      }
      console.log(`Total: ${imgs.length}`);
    } catch (e) {
      console.log(`\n=== ${u} ===`);
      console.log(`Failed: ${e?.message || e}`);
      results[u] = [];
    }
  }

  if (outJson) {
    console.log('\n--- JSON ---');
    console.log(JSON.stringify(results, null, 2));
  }

  if (save) {
    const outPath = path.join(process.cwd(), 'tmp_image_url_candidates.json');
    await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`Saved: ${outPath}`);
  }
}

await main();
