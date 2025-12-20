import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'cases', 'data', 'cases.json');
const OUT_DIR = path.join(ROOT, 'cases');

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absCaseUrl(rel) {
  if (!rel) return 'https://www.ae800.com/logo/logo.png';
  return `https://www.ae800.com/cases/${rel.replace(/^\.\//, '')}`;
}

function pickCover(images) {
  const imgs = Array.isArray(images) ? images.filter(Boolean) : [];
  return imgs[0] || '../logo/logo.png';
}

function tagChip(t) {
  const s = escHtml(t);
  return `<span class="pill">${s}</span>`;
}

function tagLink(catKey, t) {
  const label = escHtml(t);
  const params = new URLSearchParams();
  if (catKey && catKey !== 'all') params.set('cat', catKey);
  if (t) params.set('tag', t);
  const href = `./index.html?${params.toString()}`;
  return `<a class="pill" href="${href}">${label}</a>`;
}

function normalizeTags(tags) {
  const arr = Array.isArray(tags) ? tags.filter(Boolean).map((x) => String(x).trim()).filter(Boolean) : [];
  const seen = new Set();
  const out = [];
  for (const t of arr) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function headerHtml() {
  // Use the site-wide header structure so assets/main.js can control mobile menu.
  return `
  <header class="fixed top-0 inset-x-0 z-50" id="siteHeader">
    <div class="bg-white/80 backdrop-blur border-b border-slate-200" id="headerBar">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="flex items-center justify-between h-16">
          <a class="flex items-center gap-3" href="../index.html" aria-label="返回首页">
            <div class="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">AE</div>
            <div class="leading-tight">
              <div class="font-semibold">AE800</div>
              <div class="text-xs text-slate-500" data-i18n="brand_tagline">数字化展陈 · 灯箱系统 · 互动装置</div>
            </div>
          </a>

          <nav class="hidden md:flex items-center gap-6" aria-label="主导航">
            <a class="nav-link" href="../capabilities/index.html" data-i18n="nav_capabilities">能力</a>
            <a class="nav-link" href="../solutions/index.html" data-i18n="nav_solutions">解决方案</a>
            <a class="nav-link" href="../services/index.html" data-i18n="nav_services">服务</a>
            <a class="nav-link" href="../products/index.html" data-i18n="nav_products">产品</a>
            <a class="nav-link" href="./index.html" data-i18n="nav_cases">案例</a>
            <a class="nav-link" href="../docs/index.html" data-i18n="nav_docs">资料</a>
            <a class="nav-link" href="../contact/index.html" data-i18n="nav_contact">联系</a>
            <a class="btn btn-filled" href="../contact/index.html" data-cta="top">
              <i class="fa-solid fa-comment-dots"></i>
              <span data-i18n="nav_cta">获取方案</span>
            </a>
          </nav>

          <button class="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 bg-white" id="mobileMenuBtn" aria-label="打开菜单" aria-expanded="false" aria-controls="mobileMenu">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>

      <div class="md:hidden hidden" id="mobileMenu">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 pb-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <a class="mobile-link" href="../capabilities/index.html" data-i18n="nav_capabilities">能力</a>
            <a class="mobile-link" href="../solutions/index.html" data-i18n="nav_solutions">解决方案</a>
            <a class="mobile-link" href="../services/index.html" data-i18n="nav_services">服务</a>
            <a class="mobile-link" href="../products/index.html" data-i18n="nav_products">产品</a>
            <a class="mobile-link" href="./index.html" data-i18n="nav_cases">案例</a>
            <a class="mobile-link" href="../docs/index.html" data-i18n="nav_docs">资料</a>
            <a class="mobile-link" href="../contact/index.html" data-i18n="nav_contact">联系</a>
            <div class="pt-2">
              <a class="btn btn-filled w-full" href="../contact/index.html" data-cta="mobile">
                <i class="fa-solid fa-phone"></i>
                <span data-i18n="nav_cta_mobile">立即咨询</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

function buildRelated(cases, current, max = 6) {
  const curId = String(current.id || '');
  const curCat = String(current.category || 'all');
  const curTags = new Set(normalizeTags(current.tags));

  const scored = [];
  for (const c of cases) {
    const id = String(c.id || '');
    if (!/^case-\d+$/.test(id)) continue;
    if (id === curId) continue;

    let score = 0;
    if (String(c.category || 'all') === curCat) score += 3;

    const tags = normalizeTags(c.tags);
    for (const t of tags) {
      if (curTags.has(t)) score += 1;
    }

    const yearA = Number(String(current.year || '').match(/\d{4}/)?.[0] || 0);
    const yearB = Number(String(c.year || '').match(/\d{4}/)?.[0] || 0);
    if (yearA && yearB) score += Math.max(0, 2 - Math.min(2, Math.abs(yearA - yearB)));

    scored.push({ c, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((x) => x.c);
}

function buildCasePage(allCases, c) {
  const id = String(c.id || '');
  const titleRaw = String(c.title || id);
  const title = escHtml(titleRaw);

  const canonical = `https://www.ae800.com/cases/${id}.html`;

  const city = escHtml(c.city || '');
  const year = escHtml(c.year || '');
  const cat = escHtml(c.category || 'all');
  const originalCat = escHtml(c.original_category || '');

  const tags = normalizeTags(c.tags);
  const tagHtml = tags.length ? tags.map((t) => tagLink(String(c.category || 'all'), t)).join('') : '<span class="pill">暂无</span>';

  const images = Array.isArray(c.images) ? c.images.filter(Boolean) : [];
  const cover = pickCover(images);
  const coverCss = `background-image:url('${String(cover).replace(/'/g, '%27')}')`;
  const ogImageAbs = absCaseUrl(images[0] || '');

  const descShort = escHtml((c.description || '案例详情（本地化模板）。').toString().slice(0, 140));
  const descFull = escHtml(c.description || '');

  const pills = [
    city && `<span class="pill">${city}</span>`,
    year && `<span class="pill">${year}</span>`,
    cat && `<span class="pill">${cat}</span>`,
    originalCat && `<span class="pill">${originalCat}</span>`
  ].filter(Boolean).join('');

  const scope = Array.isArray(c.scope) ? c.scope.filter(Boolean).map(escHtml) : [];
  const scopeLi = scope.map((s) => `<li>${s}</li>`).join('');
  const scopeBlock = scopeLi
    ? `<ul class="mt-3 list-disc pl-5 text-slate-700">${scopeLi}</ul>`
    : `<div class="mt-3 text-sm text-slate-600">暂无（建议你后续补充：结构/灯箱/互动/中控/安装/运维）。</div>`;

  const highs = Array.isArray(c.highlights) ? c.highlights.filter(Boolean).map(escHtml) : [];
  const highLi = highs.map((h) => `<li>${h}</li>`).join('');
  const highBlock = highLi
    ? `<ul class="mt-3 list-disc pl-5 text-slate-700">${highLi}</ul>`
    : `<div class="mt-3 text-sm text-slate-600">暂无（建议你后续补充：工期、稳定性、可维护性、验收口径）。</div>`;

  const gallery = images
    .slice(0, 18)
    .map((rel) => {
      const safe = String(rel);
      const alt = title;
      return `<a href="${safe}" data-lightbox data-lb-src="${safe}" data-lb-alt="${alt}" data-lb-group="${escHtml(id)}" class="block" aria-label="查看大图"><img loading="lazy" src="${safe}" alt="${alt}" class="w-full h-44 object-cover rounded-2xl border border-slate-200" style="border-radius:var(--radius)" /></a>`;
    })
    .join('');

  const sourceUrl = c.source_url ? String(c.source_url) : '';
  const sourceLink = sourceUrl
    ? `<div class="mt-3"><a class="footer-link" href="${sourceUrl}" target="_blank" rel="noopener">查看原站案例：${escHtml(sourceUrl)}</a></div>`
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.ae800.com/' },
          { '@type': 'ListItem', position: 2, name: '案例库', item: 'https://www.ae800.com/cases/' },
          { '@type': 'ListItem', position: 3, name: titleRaw, item: canonical }
        ]
      },
      {
        '@type': 'Article',
        headline: titleRaw,
        description: c.description || '',
        inLanguage: 'zh-CN',
        image: [ogImageAbs]
      }
    ]
  };

  const summaryLine = [city, year, originalCat || cat].filter(Boolean).join(' · ');

  const related = buildRelated(allCases, c, 6);
  const relatedHtml = related
    .map((r) => {
      const rid = String(r.id || '');
      const rtitle = escHtml(r.title || rid);
      const rcover = pickCover(r.images);
      const rcoverCss = `background-image:url('${String(rcover).replace(/'/g, '%27')}')`;
      const rmeta = [escHtml(r.year || ''), escHtml(r.original_category || r.category || '')].filter(Boolean).join(' · ');
      return `
        <a class="case-card" href="./${rid}.html">
          <div class="case-cover" style="${rcoverCss}"></div>
          <div class="p-5">
            <div class="text-xs text-slate-500">${rmeta}</div>
            <div class="mt-1 font-semibold">${rtitle}</div>
            <div class="mt-3 text-brand-700 font-medium">查看</div>
          </div>
        </a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - 案例 - AE800</title>
  <meta name="description" content="${descShort}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title} - 案例 - AE800" />
  <meta property="og:description" content="${descShort}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${ogImageAbs}" />
  <link rel="icon" href="data:," />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="../assets/styles.css" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body class="font-sans text-slate-900 bg-slate-50">
${headerHtml()}

  <main class="mx-auto max-w-6xl px-4 sm:px-6 py-10 pt-16">
    <nav class="text-sm text-slate-500">
      <a class="hover:underline" href="../index.html">首页</a>
      <span class="mx-2">/</span>
      <a class="hover:underline" href="./index.html">案例库</a>
      <span class="mx-2">/</span>
      <span class="text-slate-700">${title}</span>
    </nav>

    <section class="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white" style="border-radius:var(--radius)">
      <div class="relative">
        <div class="h-56 sm:h-72 md:h-80 bg-slate-200 bg-center bg-cover" style="${coverCss}"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/35 to-transparent"></div>
        <div class="absolute inset-0 flex items-end">
          <div class="w-full p-5 sm:p-6">
            <div class="text-white/80 text-sm">${summaryLine}</div>
            <h1 class="mt-1 text-white text-2xl sm:text-3xl font-extrabold">${title}</h1>
            <p class="mt-2 text-white/90 text-sm sm:text-base max-w-3xl">${descShort}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <a class="btn btn-filled" href="../contact/index.html">获取同类方案与报价</a>
              <a class="btn btn-outlined" href="./index.html">返回案例库</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-6 grid lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8">
        <div class="rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-brand-700 font-medium">项目要点</div>
              <div class="mt-2 flex flex-wrap gap-2 text-sm">${pills}</div>
              <div class="mt-3 flex flex-wrap gap-2">${tagHtml}</div>
            </div>
            <div class="text-sm text-slate-500">${escHtml(id)}</div>
          </div>
        </div>

        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-brand-700 font-medium">项目图片（本地化）</div>
              <div class="mt-1 text-sm text-slate-600">已下载到本地：cases/assets/${escHtml(id)}/</div>
            </div>
            <div class="text-sm text-slate-500">共 ${images.length} 张</div>
          </div>
          <div class="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${gallery}</div>
        </div>

        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="text-brand-700 font-medium">项目概述</div>
          <p class="mt-3 text-slate-700" style="white-space:pre-wrap">${descFull}</p>
        </div>

        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="text-brand-700 font-medium">交付范围</div>
          ${scopeBlock}
        </div>

        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="text-brand-700 font-medium">亮点与验收口径（建议）</div>
          ${highBlock}
        </div>

        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="text-brand-700 font-medium">来源与参考</div>
          <div class="mt-2 text-sm text-slate-600">本页面由 cases/data/cases.json 自动生成，便于 SEO 与站内检索。</div>
          ${sourceLink}
        </div>
      </div>

      <aside class="lg:col-span-4">
        <div class="rounded-3xl bg-slate-50 border border-slate-200 p-6" style="border-radius:var(--radius)">
          <div class="font-semibold">咨询与报价</div>
          <p class="mt-2 text-sm text-slate-600">如果你希望我们快速给出清单化报价，请提供：城市/场地类型、面积、工期节点、预算区间、交付范围（结构/灯箱/互动/沉浸）。</p>
          <div class="mt-4 grid gap-2">
            <a class="btn btn-filled w-full" href="../contact/index.html">提交需求</a>
            <a class="btn btn-outlined w-full" href="./index.html">返回案例库</a>
          </div>
        </div>

        <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6" style="border-radius:var(--radius)">
          <div class="font-semibold">相关案例推荐</div>
          <div class="mt-4 grid gap-4">${relatedHtml || '<div class="text-sm text-slate-600">暂无</div>'}</div>
        </div>
      </aside>
    </section>
  </main>

  <footer class="py-12">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div class="font-semibold">AE800</div>
          <div class="mt-3 text-sm text-slate-600" data-i18n="footer_brand_desc">数字化体验 · 展示结构 · 互动装置的整合落地供应商。把灯箱、结构与互动模块化，让空间开口说话。</div>
        </div>
        <div>
          <div class="font-semibold" data-i18n="footer_quick">快速入口</div>
          <div class="mt-3 space-y-2 text-sm">
            <a class="footer-link" href="../capabilities/index.html">能力</a>
            <a class="footer-link" href="../solutions/index.html">解决方案</a>
            <a class="footer-link" href="../services/index.html">服务</a>
            <a class="footer-link" href="../products/index.html">产品</a>
            <a class="footer-link" href="./index.html">案例</a>
            <a class="footer-link" href="../docs/index.html" data-i18n="footer_docs">投标与资料</a>
            <a class="footer-link" href="../contact/index.html">联系</a>
          </div>
        </div>
        <div>
          <div class="font-semibold" data-i18n="footer_services">服务项目</div>
          <div class="mt-3 space-y-2 text-sm">
            <div class="text-slate-600" data-i18n="footer_s1">展示设计 / 装修装饰</div>
            <div class="text-slate-600" data-i18n="footer_s2">数字多媒体 / 活动执行</div>
            <div class="text-slate-600" data-i18n="footer_s3">市场推广 / 企业形象展示</div>
          </div>
        </div>
        <div>
          <div class="font-semibold" data-i18n="footer_contact">联系</div>
          <div class="mt-3 space-y-2 text-sm text-slate-600">
            <div>电话：010-66169644</div>
            <div>邮箱：139965886@qq.com</div>
            <div>公众号：ae800com</div>
          </div>
        </div>
      </div>

      <div class="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <div class="text-sm text-slate-500">Copyright © 2001 - 2025 ae800.com</div>
        <div class="text-sm text-slate-500" data-i18n="footer_note">新站模板 · 可交互静态演示</div>
      </div>
    </div>
  </footer>

  <script src="../assets/main.js"></script>
</body>
</html>`;
}

async function main() {
  const raw = await fs.readFile(JSON_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const cases = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cases) ? parsed.cases : [];

  await fs.mkdir(OUT_DIR, { recursive: true });

  let count = 0;
  for (const c of cases) {
    const id = String(c.id || '');
    if (!/^case-\d+$/.test(id)) continue;
    const html = buildCasePage(cases, c);
    const out = path.join(OUT_DIR, `${id}.html`);
    await fs.writeFile(out, html, 'utf8');
    count += 1;
  }

  console.log(`Generated ${count} case pages -> ${OUT_DIR}`);
}

await main();
