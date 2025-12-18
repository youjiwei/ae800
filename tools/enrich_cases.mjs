import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'cases', 'data', 'cases.json');

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const k = String(x || '').trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function cityShort(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  const m = t.match(/^(北京|上海|天津|重庆|深圳|广州|南京|杭州|苏州|成都|武汉|西安|长沙|郑州|青岛|厦门|大连|沈阳|济南|合肥|福州|昆明|南昌|宁波|东莞|佛山|无锡|常州|徐州|南通|太原|石家庄|乌鲁木齐|呼和浩特|兰州|银川|海口|三亚|贵阳|南宁|长春|哈尔滨)/);
  return m ? m[1] : t.split(/\s|,|，/)[0];
}

function tagsFromText(c) {
  const title = String(c.title || '');
  const oc = String(c.original_category || '');
  const desc = String(c.description || '');
  const city = cityShort(c.city);
  const year = String(c.year || '');
  const text = `${title}\n${oc}\n${desc}\n${city}\n${year}`;

  const tags = [];

  if (city) tags.push(city);
  if (year && /\d{4}/.test(year)) tags.push(year.match(/\d{4}/)?.[0]);

  const addIf = (re, tag) => {
    if (re.test(text)) tags.push(tag);
  };

  // 场景/主题
  addIf(/博物馆|文物|专题特色馆|展览馆|纪念馆|陈列馆/i, '博物馆');
  addIf(/红色|党建|党史|共产党|爱国主义/i, '红色党建');
  addIf(/成就展|大型成就展|砥砺奋进|改革开放/i, '成就展');
  addIf(/城市展厅|规划馆|展厅|城市|产业展/i, '城市展厅');
  addIf(/机场|航站楼/i, '机场');
  addIf(/商业|商场|店|快闪|品牌/i, '商业展示');

  // 工艺/技术
  addIf(/灯箱|发光|光影|背光|透光/i, '灯箱');
  addIf(/互动|触控|电子翻书|问答|体感|投影互动|多媒体/i, '互动');
  addIf(/沉浸|环幕|投影|融合|三面|全景/i, '沉浸式');
  addIf(/导视|标识|导向|发光字|形象墙/i, '导视标识');
  addIf(/金属|钢结构|铝型材|柜体|木作|亚克力|喷绘/i, '结构与面材');

  // 主类（更短口语）
  const cat = String(c.category || 'all');
  const catMap = {
    museum: '博物馆',
    achievement: '成就展',
    city: '城市展厅',
    brand: '标识形象',
    retail: '商业展示',
    all: '其他'
  };
  tags.push(catMap[cat] || '其他');

  return uniq(tags);
}

async function main() {
  const raw = await fs.readFile(JSON_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const cases = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cases) ? parsed.cases : [];

  let changed = 0;
  for (const c of cases) {
    const autoTags = tagsFromText(c);
    const before = JSON.stringify(Array.isArray(c.tags) ? c.tags : []);
    const after = JSON.stringify(autoTags);
    if (before !== after) {
      c.tags = autoTags;
      changed += 1;
    }
  }

  await fs.writeFile(JSON_PATH, JSON.stringify({ cases }, null, 2), 'utf8');
  console.log(`Enriched tags for ${changed} cases -> ${JSON_PATH}`);
}

await main();
