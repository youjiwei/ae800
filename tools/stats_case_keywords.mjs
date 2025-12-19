import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES_V2 = path.join(ROOT, 'cases', 'data', 'cases.v2.json');
const OUT_DIR = path.join(ROOT, 'tools', 'output');
const OUT_PATH = path.join(OUT_DIR, 'case_keyword_stats.json');

function asArray(x) {
  return Array.isArray(x) ? x : [];
}

function normStr(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = normStr(x);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function inc(map, key, n = 1) {
  const k = normStr(key);
  if (!k) return;
  map.set(k, (map.get(k) || 0) + n);
}

function topN(map, n = 50) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ key: k, count: v }));
}

// 基础停用词（只用于“正文关键词”统计，不影响 tags_v2 统计）
const STOP = new Set(
  [
    '项目',
    '设计',
    '制作',
    '施工',
    '建设',
    '提升',
    '改造',
    '升级',
    '展陈',
    '展示',
    '展区',
    '展厅',
    '内容',
    '系统',
    '服务',
    '实现',
    '提供',
    '采用',
    '通过',
    '主要',
    '包括',
    '以及',
    '等',
    '一体',
    '打造',
    '全面',
    '整体',
    '围绕',
    '现场',
    '空间',
    '区域',
    '功能',
    '活动'
  ].map((x) => x.toLowerCase())
);

// 站点噪音/营销话术（来自部分 description 的抓取残留），直接排除
const NOISE_PHRASES = [
  '案例地址',
  '专业品质',
  '真材实料',
  '品质出众',
  '全程可控',
  '专属项目经理',
  '专属项目经理1对1服务',
  '为您找到性价比最好的材质',
  '确保按合同材料制作',
  '承诺可以做到全国最好的品质',
  '高空楼体广告字',
  '广告牌',
  '结构质保',
  '专属对接人',
  '可同时对接甲方',
  '装修方',
  '第三方',
  '经验',
  '设计验收如一'
];

const NOISE_CONTAINS = [
  '来源与参考',
  '来源和参考',
  '参考链接',
  '参考资料',
  '相关阅读',
  '原文链接',
  '点击查看',
  '更多详情',
  '后续运行抓取脚本'
];

function isNoiseWord(w) {
  const s = normStr(w);
  if (!s) return true;
  if (NOISE_PHRASES.some((p) => s.includes(p))) return true;
  if (NOISE_CONTAINS.some((p) => s.includes(p))) return true;
  // 过滤常见“字段标签”残留
  if (/^(项目类别|项目时间|项目地点)[:：]?$/.test(s)) return true;
  // 占位/缺省
  if (/(待补充|占位数据|暂无|未提供|敬请期待)/.test(s)) return true;
  // 地址碎片/楼栋
  if (/(\d+号楼|\d+号|号楼|南路|北路|东路|西路|大道|大街|路\d+号|\d+层|\d+号院|\d+单元)/.test(s)) return true;
  // 过滤纯数字/地址碎片
  if (/^\d{1,5}$/.test(s)) return true;
  // 施工/项目过程日志碎片（大量出现在抓取残留里，影响统计）
  if (/(测量|走线|放线|进场|出整体方案|确定方案|开始制作|制作完毕|施工完毕|安装完毕|下单|开工|完工|调试|验收)/.test(s)) return true;
  // 截断营销句常见起始
  if (/(承诺|确保|专属|质保|性价比|按合同材料|全国最好的)/.test(s)) return true;
  // 过长且疑似句子片段（关键词应更短）
  if (s.length >= 10 && /(开始|确定|制作|施工|完毕|方案)/.test(s)) return true;
  return false;
}

function extractChineseKeywords(text) {
  const t = normStr(text);
  if (!t) return [];

  // 规则：抽取 2-8 个中文字符的连续片段，再做切分/过滤
  const chunks = t.match(/[\u4e00-\u9fa5]{2,12}/g) || [];

  const words = [];
  for (const c of chunks) {
    // 常见模式归一
    const normalized = c
      .replace(/博物馆展览馆|博物馆/gu, '博物馆')
      .replace(/纪念馆/gu, '纪念馆')
      .replace(/展览馆/gu, '展览馆')
      .replace(/规划馆/gu, '规划馆')
      .replace(/展陈设计|展陈/gu, '展陈')
      .replace(/导视标识系统|导视标识/gu, '导视标识')
      .replace(/多媒体互动|互动多媒体/gu, '多媒体互动')
      .replace(/沉浸式体验|沉浸体验/gu, '沉浸式')
      .replace(/数字展项|数字化/gu, '数字化');

    // 简单拆分：对“XX系统/XX展/XX馆/XX中心”等保留整体
    // 这里不做复杂分词，避免引入依赖。
    words.push(normalized);
  }

  // 过滤停用词/过短
  const filtered = words
    .map((w) => normStr(w))
    .filter((w) => w.length >= 2)
    .filter((w) => !STOP.has(w.toLowerCase()))
    .filter((w) => !isNoiseWord(w))
    .filter((w) => !/^(我们|客户|甲方|乙方|公司|团队)$/.test(w));

  return filtered;
}

function extractKeyPoints(c) {
  // 关键点：优先 highlights，其次 scope（交付范围），再补 tags_v2.deliverables/experience
  const points = [];

  for (const h of asArray(c.highlights)) {
    const s = normStr(h);
    if (s) points.push(s);
  }

  for (const s of asArray(c.scope)) {
    const t = normStr(s);
    if (t) points.push(t);
  }

  const tv2 = c.tags_v2 && typeof c.tags_v2 === 'object' ? c.tags_v2 : null;
  if (tv2) {
    for (const d of uniq(asArray(tv2.deliverables))) points.push(normStr(d));
    for (const e of uniq(asArray(tv2.experience))) points.push(normStr(e));
    for (const sc of uniq(asArray(tv2.scene))) points.push(normStr(sc));
  }

  return uniq(points).filter(Boolean);
}

function normalizeCityForStats(input) {
  const s = normStr(input);
  if (!s) return '';

  // 明确保留：线上
  if (/^线上/.test(s) || /线上活动/.test(s)) return '线上';

  // 纠正明显误入 city 的机构名
  if (/国家博物馆/.test(s)) return '北京';

  // 省份/城市规则化（按你当前筛选口径：北京 + 省）
  if (/^北京/.test(s)) return '北京';
  if (/^江苏/.test(s)) return '江苏省';
  if (/^陕西/.test(s) || /延安|西安/.test(s)) return '陕西省';
  if (/^云南/.test(s) || /腾冲|昆明/.test(s)) return '云南省';

  // 兜底：保留原始（但尽量短）
  return s.split(/\s|,|，/)[0];
}

async function main() {
  const raw = await fs.readFile(CASES_V2, 'utf8');
  const parsed = JSON.parse(raw);
  const cases = Array.isArray(parsed?.cases) ? parsed.cases : [];

  const kw = new Map();
  const keyPoints = new Map();

  const scenes = new Map();
  const deliverables = new Map();
  const experiences = new Map();
  const cities = new Map();
  const years = new Map();
  const tagsAll = new Map();

  for (const c of cases) {
    const text = [c.title, c.description, ...(asArray(c.highlights) || []), ...(asArray(c.scope) || [])]
      .map(normStr)
      .filter(Boolean)
      .join('\n');

    // 关键词（自由文本）
    for (const w of extractChineseKeywords(text)) {
      inc(kw, w);
    }

    // 关键点（结构化）
    for (const p of extractKeyPoints(c)) {
      inc(keyPoints, p);
    }

    const tv2 = c.tags_v2 && typeof c.tags_v2 === 'object' ? c.tags_v2 : null;
    if (tv2) {
      // 单案例内部去重，避免重复标签刷频次
      for (const s of uniq(asArray(tv2.scene))) inc(scenes, s);
      for (const d of uniq(asArray(tv2.deliverables))) inc(deliverables, d);
      for (const e of uniq(asArray(tv2.experience))) inc(experiences, e);

      const meta = tv2.meta && typeof tv2.meta === 'object' ? tv2.meta : null;
      if (meta?.city) inc(cities, normalizeCityForStats(meta.city));
      if (meta?.year) inc(years, meta.year);

      // 全量标签（包含 tags_v2）
      for (const s of uniq(asArray(tv2.scene))) inc(tagsAll, s);
      for (const d of uniq(asArray(tv2.deliverables))) inc(tagsAll, d);
      for (const e of uniq(asArray(tv2.experience))) inc(tagsAll, e);
    } else {
      // fallback
      if (c.city) inc(cities, normalizeCityForStats(String(c.city).split(/\s|,|，/)[0]));
      if (c.year) inc(years, c.year);
    }

    // legacy tags（如果有）也纳入标签词频；单案例内部去重
    for (const t of uniq(asArray(c.tags))) {
      if (isNoiseWord(t)) continue;
      inc(tagsAll, t);
    }
  }

  const out = {
    generated_at: new Date().toISOString(),
    input: path.relative(ROOT, CASES_V2).replace(/\\/g, '/'),
    total_cases: cases.length,
    top: {
      keywords: topN(kw, 80),
      key_points: topN(keyPoints, 80),
      scenes: topN(scenes, 50),
      deliverables: topN(deliverables, 80),
      experiences: topN(experiences, 80),
      tags: topN(tagsAll, 120),
      cities: topN(cities, 50),
      years: topN(years, 50)
    }
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');

  const show = (title, rows) => {
    console.log(`\n=== ${title} ===`);
    for (const r of rows.slice(0, 20)) {
      console.log(`${String(r.count).padStart(4, ' ')}  ${r.key}`);
    }
  };

  console.log(`Wrote: ${OUT_PATH}`);
  console.log(`Cases: ${cases.length}`);
  show('Top Keywords', out.top.keywords);
  show('Top Key Points', out.top.key_points);
  show('Top Tags (All)', out.top.tags);
  show('Top Scenes', out.top.scenes);
  show('Top Deliverables', out.top.deliverables);
  show('Top Experiences', out.top.experiences);
}

await main();
