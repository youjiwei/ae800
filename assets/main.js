const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function show(el, displayClass = 'block') {
  if (!el) return;
  el.classList.remove('hidden');
  if (displayClass) el.classList.add(displayClass);
}

function hide(el, displayClass = 'block') {
  if (!el) return;
  if (displayClass) el.classList.remove(displayClass);
  el.classList.add('hidden');
}

function isValidCNMobile(phone) {
  return /^1\d{10}$/.test(String(phone || '').trim());
}

function initMobileMenu() {
  const btn = $('#mobileMenuBtn');
  const menu = $('#mobileMenu');
  if (!btn || !menu) return;

  const closeMenu = () => {
    hide(menu);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', '打开菜单');
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-bars';
  };

  const openMenu = () => {
    show(menu);
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', '关闭菜单');
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-xmark';
  };

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });

  $$('.mobile-link', menu).forEach((a) => {
    a.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

function initSuiteTabs() {
  const tabsWrap = $('#suiteTabs');
  const tabs = $$('.tab', tabsWrap || document);
  const title = $('#suiteTitle');
  const desc = $('#suiteDesc');
  const pillsWrap = $('#suitePills');
  if (!tabsWrap || !tabs.length || !title || !desc || !pillsWrap) return;

  const getLang = () => localStorage.getItem('ae800_lang') || 'zh';

  const data = {
    zh: {
      lightbox: {
        title: 'LightBox 系列',
        desc: '系统化灯箱结构，适合长期展馆与高频更新场景。支持快维护、快拆装，光源均匀无暗区。',
        pills: ['UltraSlim（超薄）', 'CurveFlex（弧形）', 'MegaWall（大场景）', 'Magnetic Pro（磁吸）', 'ECO 模块化', 'LightWall（光墙）']
      },
      interactive: {
        title: 'Interactive 系列',
        desc: '把数字互动做成稳定可运行的展项：AI 讲解、电子翻书、问答墙、体感与多点触控桌等，支持内容对接与联调。',
        pills: ['AI Guide', 'Digital Flipbook', 'Quiz Wall', 'Shadow Interactive', 'MultiTouch Table', '裸眼 3D 小屏']
      },
      immersive: {
        title: 'Immersive 系列',
        desc: '沉浸式入口与故事区模块：三面投影、氛围灯光与中控联动，适合城市展厅与文化项目的高记忆点空间。',
        pills: ['Mini Immersive Box', 'Immersive Corridor', 'EdgeScreen 半环幕', '氛围灯光', '融合校正', '中控联动']
      }
    },
    en: {
      lightbox: {
        title: 'LightBox Series',
        desc: 'A modular lightbox structure system for long-term venues and frequent content updates. Easy maintenance, fast assembly and uniform lighting.',
        pills: ['UltraSlim', 'CurveFlex', 'MegaWall', 'Magnetic Pro', 'ECO Modular', 'LightWall']
      },
      interactive: {
        title: 'Interactive Series',
        desc: 'Stable, deployable interactive exhibits: AI guide, digital flipbook, quiz wall, gesture interaction and multi-touch table with content integration & commissioning.',
        pills: ['AI Guide', 'Digital Flipbook', 'Quiz Wall', 'Shadow Interactive', 'MultiTouch Table', 'Naked-eye 3D']
      },
      immersive: {
        title: 'Immersive Series',
        desc: 'Immersive entrance and story modules with projection, ambient lighting and control integration, designed for high-impact showroom experiences.',
        pills: ['Mini Immersive Box', 'Immersive Corridor', 'EdgeScreen', 'Ambient Lighting', 'Warp & Blend', 'Control Integration']
      }
    }
  };

  const setActive = (key) => {
    const lang = getLang() === 'en' ? 'en' : 'zh';
    const langData = data[lang];
    const item = langData[key] || langData.lightbox;

    tabs.forEach((t) => {
      const isActive = t.dataset.suite === key;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });

    title.textContent = item.title;
    desc.textContent = item.desc;

    pillsWrap.innerHTML = '';
    item.pills.forEach((p) => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = p;
      pillsWrap.appendChild(span);
    });
  };

  tabs.forEach((t) => {
    t.addEventListener('click', () => setActive(t.dataset.suite || 'lightbox'));
  });

  setActive('lightbox');

  window.addEventListener('ae800:lang', () => {
    const activeBtn = tabs.find((t) => t.classList.contains('is-active'));
    const key = activeBtn?.dataset?.suite || 'lightbox';
    setActive(key);
  });
}

function initHandbookModal() {
  const modal = $('#handbookModal');
  const openBtn = $('#openHandbookModal');
  if (!modal || !openBtn) return;

  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])';
  let lastActive = null;

  const close = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
  };

  const open = () => {
    lastActive = document.activeElement;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector(focusableSelector);
    if (first) first.focus();
  };

  openBtn.addEventListener('click', open);
  $$("[data-modal-close]", modal).forEach((el) => el.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'Tab') {
      const focusables = $$(focusableSelector, modal).filter((n) => n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

function initCountUp() {
  const nodes = $$('[data-countup]');
  if (!nodes.length) return;

  const animate = (el) => {
    const to = Number(el.dataset.to || '0');
    const suffix = String(el.dataset.suffix || '');
    const duration = Number(el.dataset.duration || '900');
    const from = 0;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      el.textContent = `${value}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.dataset.counted === 'true') return;
        el.dataset.counted = 'true';
        animate(el);
      });
    },
    { threshold: 0.6 }
  );

  nodes.forEach((n) => observer.observe(n));
}

function initSolutionSelector() {
  const picker = $('#solutionPicker');
  if (!picker) return;

  const items = $$('.picker-item', picker);
  const title = $('#solutionTitle');
  const copy = $('#solutionCopy');
  const tags = $('#solutionTags');
  const pains = $('#solutionPains');
  const arch = $('#solutionArchitecture');
  const caps = $('#solutionCapabilities');
  const delivers = $('#solutionDeliverables');
  const metrics = $('#solutionMetrics');
  const modules = $('#solutionModules');
  const scenarios = $('#solutionScenarios');
  const radarWrap = $('#solutionRadar');
  const costWrap = $('#solutionCost');
  const costLegend = $('#solutionCostLegend');
  const toContact = $('#solutionToContact');
  const openHandbook = $('#solutionOpenHandbook');
  if (!items.length || !title || !copy || !tags) return;

  const getLang = () => localStorage.getItem('ae800_lang') || 'zh';

  const data = {
    zh: {
      museum: {
        title: '博物馆互动展项方案',
        copy: '推荐组合：展项结构 + 可维护灯箱系统 + AI 讲解/翻书/问答墙 + 氛围光影。目标是“长期稳定运行 + 易维护 + 内容可更新”。',
        tags: ['结构展项', '可维护灯箱', 'AI 讲解', '电子翻书', '互动问答', '氛围光影'],
        radar: { axes: [4, 4, 3, 4, 4] },
        cost: { structure: 35, hardware: 30, content: 20, install: 15 },
        pains: ['内容更新频繁，但结构不可维护', '互动设备不稳定影响体验', '多方供应导致接口不清、返工多', '夜间施工窗口短，进度不可控'],
        architecture: ['结构与灯箱标准化（检修位、备件）', '互动展项按“设备 + 内容 + 联调”交付', '统一氛围灯光与安全策略', '验收口径与运维指南一并交付'],
        capabilities: ['展项结构深化与可维护设计', '设备选型偏稳定与联调能力', '中控/多媒体系统接口对接', '现场统筹与安装计划管理'],
        deliverables: ['方案与点位：清单、点位图、接口说明', '结构/灯箱：制作安装、检修位、备件', '互动：部署联调、稳定性测试记录', '交付资料：参数备份与维护建议（可选）'],
        metrics: ['亮度均匀性抽检与记录', '互动响应延迟与稳定性抽检', '可维护性验证（检修与更换时长）', '用电/结构/材料安全合规'],
        modules: ['AI 讲解屏（多语）', '电子翻书（可更新）', '互动问答墙（可扩展题库）', '体感互动/投影互动（可选）'],
        scenarios: [
          { title: '常设展解说区', desc: '强调稳定与维护，支持季度内容更新。' },
          { title: '教育互动区', desc: '翻书/问答为主，结构可移动复用。' },
          { title: '主题故事展项', desc: '用灯箱 + 小型沉浸/光影增强叙事氛围。' },
          { title: '临时特展模块', desc: '结构与设备可复用，缩短二次搭建周期。' }
        ]
      },
      city: {
        title: '城市展厅沉浸式方案',
        copy: '推荐组合：CurveFlex 入口灯箱 + Mini Immersive Box（故事区）+ 触控桌/问答墙 + 裸眼 3D 小屏（传播点）。',
        tags: ['入口弧形灯箱', 'MiniBox', '触控桌', '问答墙', '裸眼 3D', '中控联动'],
        radar: { axes: [5, 5, 4, 4, 5] },
        cost: { structure: 25, hardware: 35, content: 25, install: 15 },
        pains: ['入口需要强记忆点但预算有限', '沉浸效果依赖场地条件，后期变更风险高', '中控/灯光/多媒体系统割裂，联动困难', '工期紧，需提前锁定设计与设备'],
        architecture: ['入口：弧形灯箱 + 导视统一', '故事区：MiniBox/半环幕 + 声光电联动', '信息区：触控桌/问答墙承载内容', '传播点：裸眼 3D 小屏增强传播'],
        capabilities: ['踏勘与声光电条件评估', '融合校正与参数备份', '灯光与中控联动（场景一键）', '结构、饰面与设备一体化实施'],
        deliverables: ['踏勘报告：尺寸、投射、遮光、走线建议', '方案：分区效果图、设备清单与点位', '实施：安装、校正、调试与稳定性测试', '交付：参数备份、培训与运维建议'],
        metrics: ['沉浸效果：画面拼接/融合无明显接缝', '稳定性：连续运行压力测试', '观众动线：关键节点停留与互动完成率（可选）', '安全：结构承载与用电规范'],
        modules: ['Mini Immersive Box', 'Immersive Corridor', 'EdgeScreen 半环幕', '一键场景中控（可选）'],
        scenarios: [
          { title: '城市规划展示', desc: '入口沉浸 + 触控查询，信息量大但体验流畅。' },
          { title: '产业展厅', desc: '故事区沉浸叙事 + 数据可视化互动。' },
          { title: '招商与发布', desc: '用传播点加强“可拍可传”的记忆点。' },
          { title: '巡展与临时展', desc: '模块化配置，按预算分级复用。' }
        ]
      },
      temp: {
        title: '临展快装数字化方案',
        copy: '推荐组合：ECO 模块化快装灯箱 + 可租赁互动设备 + 可复用沉浸式入口。重点是“快装快拆 + 可复用 + 工期可控”。',
        tags: ['模块化快装', '可复用', '易维护', '租赁设备', '沉浸入口', '工期可控'],
        radar: { axes: [3, 5, 3, 3, 3] },
        cost: { structure: 40, hardware: 20, content: 15, install: 25 },
        pains: ['周期短，场地条件不确定', '预算有限但要求“拍照好看”', '巡展多次搭建，重复成本高', '互动设备要快速部署与撤场'],
        architecture: ['结构：ECO 标准化灯箱模块', '互动：租赁设备（翻书/问答/AI）', '入口：可复用沉浸式/灯光装置（按需）', '包装：标准化清单与安装卡片'],
        capabilities: ['快装结构与运输包装设计', '标准点位与快速联调', '现场工期倒排与统筹', '模块复用维护与备件策略'],
        deliverables: ['清单化报价：结构/画面/电气/互动分项', '结构与灯箱：制作、运输、安装与拆卸', '互动装置：部署、联调、撤场流程', '交付资料：安装指导与维护建议'],
        metrics: ['装配效率：单点位安装时长可控', '复用性：拆装损耗与备件消耗记录', '稳定性：开馆时段无明显故障', '安全：防倾倒/防绊线/用电规范'],
        modules: ['ECO 模块化灯箱', '可租赁互动展项', '可复用入口光影', '移动式展柜/岛台（可选）'],
        scenarios: [
          { title: '临时特展/快闪', desc: '快装快拆，开幕节点优先。' },
          { title: '巡展', desc: '模块复用降低二次搭建成本。' },
          { title: '发布会展示区', desc: '快速入口 + 传播点。' },
          { title: '商场中庭展', desc: '兼顾安全与人流，强调互动引流。' }
        ]
      },
      retail: {
        title: '商业展示互动方案',
        copy: '推荐组合：光影氛围墙（LightWall）+ 品牌互动装置（体感/触控/问答）+ 裸眼 3D 小屏。目标是“引流互动 + 拍照传播点 + 高转化”。',
        tags: ['LightWall 光墙', '品牌互动装置', '体感互动', '多点触控', '裸眼 3D', '传播点'],
        radar: { axes: [4, 4, 5, 3, 4] },
        cost: { structure: 20, hardware: 35, content: 30, install: 15 },
        pains: ['需要快速提升客流与停留时长', '互动装置要“好玩”但必须稳定', '品牌调性统一：灯光/材质/画面一致', '活动周期短，迭代频繁'],
        architecture: ['氛围：LightWall 光影墙（主视觉）', '互动：体感/触控装置（参与点）', '传播：裸眼 3D/小屏（拍照点）', '数据：互动次数与热点统计（可选）'],
        capabilities: ['品牌视觉落地与材质/灯光一致性', '互动玩法设计与内容更新', '结构与设备的安全加固', '快速安装与活动期运维'],
        deliverables: ['方案：动线、互动玩法、点位与设备清单', '制作：结构/面材/灯光与画面', '部署：互动程序与设备联调', '活动运维：巡检、备件与应急预案（可选）'],
        metrics: ['互动参与：触发次数/完成率（可选）', '传播效果：拍照点停留与扫码转化（可选）', '稳定性：峰值人流下无明显卡顿', '安全：边角防护、结构稳固、用电规范'],
        modules: ['LightWall 氛围墙', '体感互动', '多点触控互动桌', '问答/抽奖互动（可选）'],
        scenarios: [
          { title: '品牌快闪店', desc: '引流互动 + 打卡传播点，强调转化。' },
          { title: '商场中庭活动', desc: '互动节奏快，强调稳定与安全。' },
          { title: '新品发布展示区', desc: '裸眼 3D + 氛围墙强化传播。' },
          { title: '长期门店升级', desc: '可维护结构与可更新内容，持续运营。' }
        ]
      }
    },
    en: {
      museum: {
        title: 'Museum Interactive Exhibit Package',
        copy: 'Recommended mix: exhibit structure + maintainable lightbox system + AI guide / digital flipbook / quiz wall + ambient lighting. Built for long-term operations and easy content updates.',
        tags: ['Structure', 'Lightbox', 'AI Guide', 'Flipbook', 'Quiz Wall', 'Ambient Lighting'],
        radar: { axes: [4, 4, 3, 4, 4] },
        cost: { structure: 35, hardware: 30, content: 20, install: 15 },
        pains: ['Frequent content updates but poor maintainability', 'Unstable devices hurt visitor experience', 'Split vendors lead to unclear interfaces and rework', 'Short after-hours window requires fast install & commissioning'],
        architecture: ['Standardized structure & lightbox (service access, spares)', 'Interactive exhibits delivered as device + content + commissioning', 'Unified ambient lighting & safety strategy', 'Acceptance checklist and O&M guide included'],
        capabilities: ['Maintainable exhibit detailing', 'Reliability-first device selection & commissioning', 'Integration with control / media systems', 'On-site coordination and installation planning'],
        deliverables: ['Plan & points: BOM, point layout, interface spec', 'Structure & lightbox: fabrication, install, service access, spares', 'Interactive: deployment, commissioning, stability test notes', 'Handover: parameter backup and maintenance notes (optional)'],
        metrics: ['Brightness & uniformity spot checks with records', 'Interaction response latency & stability sampling', 'Serviceability validation (access and swap time)', 'Safety compliance for power/structure/materials'],
        modules: ['AI guide screen (multi-language)', 'Digital flipbook (updatable)', 'Quiz wall (CMS-backed)', 'Gesture / projection interaction (optional)'],
        scenarios: [
          { title: 'Permanent Exhibit Interpretation', desc: 'Reliability and maintenance first; quarterly content updates supported.' },
          { title: 'Education Zone', desc: 'Flipbook/quiz wall as core with movable structures.' },
          { title: 'Storytelling Exhibit', desc: 'Lightbox + small immersive/lighting to enhance narrative.' },
          { title: 'Temporary Special Exhibit', desc: 'Reusable structure & devices to shorten next build.' }
        ]
      },
      city: {
        title: 'City Showroom Immersive Package',
        copy: 'Recommended mix: CurveFlex entrance lightbox + Mini Immersive Box (story zone) + touch table/quiz wall + naked-eye 3D screen (shareable moment).',
        tags: ['CurveFlex Entrance', 'MiniBox', 'Touch Table', 'Quiz Wall', 'Naked-eye 3D', 'Control Integration'],
        radar: { axes: [5, 5, 4, 4, 5] },
        cost: { structure: 25, hardware: 35, content: 25, install: 15 },
        pains: ['Need a high-impact entrance with limited budget', 'Immersive effect depends on site conditions; late changes are risky', 'Fragmented control/lighting/media systems make linking hard', 'Tight schedule requires early lock-in of design & equipment'],
        architecture: ['Entrance: curved lightbox + unified wayfinding', 'Story zone: MiniBox/edge screen + AV integration', 'Info zone: touch table/quiz wall for content', 'Shareable spot: naked-eye 3D mini screen'],
        capabilities: ['Site survey and AV/power/network assessment', 'Warping & blending with parameter backup', 'Lighting + control integration (one-click scenes)', 'Integrated build of structure, finishes and devices'],
        deliverables: ['Survey notes: dimensions, throw, wiring guidance', 'Design: zone plan, BOM and points', 'Execution: installation, calibration and stability tests', 'Handover: parameter backup, training and O&M notes'],
        metrics: ['Seamless blending and stable visuals', 'Long-run stability stress test', 'Flow: dwell and completion rates (optional)', 'Safety compliance for structure and power'],
        modules: ['Mini Immersive Box', 'Immersive Corridor', 'EdgeScreen', 'One-click control scenes (optional)'],
        scenarios: [
          { title: 'Urban Planning Showroom', desc: 'Immersive entrance + touch query with smooth information flow.' },
          { title: 'Industry Showroom', desc: 'Immersive narrative + interactive data visualization.' },
          { title: 'Investment & Launch', desc: 'Shareable moments to boost memorability and PR.' },
          { title: 'Touring / Temporary', desc: 'Modular tiers by budget for reuse.' }
        ]
      },
      temp: {
        title: 'Pop-up / Temporary Exhibition Package',
        copy: 'Recommended mix: ECO modular quick-setup lightboxes + rentable interactive devices + reusable immersive entry. Optimized for fast build & teardown with controlled schedule.',
        tags: ['Modular Setup', 'Reusable', 'Maintainable', 'Rentable Devices', 'Immersive Entry', 'Schedule Control'],
        radar: { axes: [3, 5, 3, 3, 3] },
        cost: { structure: 40, hardware: 20, content: 15, install: 25 },
        pains: ['Short timeline and uncertain site conditions', 'Limited budget but needs “photo-ready” results', 'Touring builds: high repeated setup cost', 'Interactive devices must deploy and strike fast'],
        architecture: ['Structure: ECO standardized lightbox modules', 'Interactive: rentable devices (flipbook/quiz/AI guide)', 'Entrance: reusable immersive/lighting piece (as needed)', 'Packaging: standardized checklist and build cards'],
        capabilities: ['Fast-build structure and transport packaging', 'Standardized points with quick commissioning', 'On-site schedule control', 'Reusable module maintenance and spares strategy'],
        deliverables: ['Itemized estimate: structure/graphics/electrical/interactive', 'Structure & lightbox: fab, transport, install and teardown', 'Interactive: deployment, commissioning and strike flow', 'Docs: install guide and maintenance notes'],
        metrics: ['Assembly efficiency per point', 'Reusability loss and spares usage tracking', 'Open-hours stability with low downtime', 'Safety: anti-tip, cable management and power compliance'],
        modules: ['ECO modular lightboxes', 'Rentable interactive exhibits', 'Reusable entrance lighting', 'Mobile kiosks/islands (optional)'],
        scenarios: [
          { title: 'Pop-up / Special Exhibit', desc: 'Fast build & teardown with opening deadline first.' },
          { title: 'Touring Exhibition', desc: 'Reusable modules reduce the next build cost.' },
          { title: 'Launch Event Display', desc: 'Quick entrance + shareable spot.' },
          { title: 'Mall Atrium Exhibit', desc: 'Crowd-safe design with interaction-driven footfall.' }
        ]
      },
      retail: {
        title: 'Retail / Brand Activation Package',
        copy: 'Recommended mix: LightWall ambient wall + branded interactive installation (gesture/touch/quiz) + naked-eye 3D screen. Designed for footfall, shareable moments and conversion.',
        tags: ['LightWall', 'Brand Interaction', 'Gesture', 'Multi-touch', 'Naked-eye 3D', 'Shareable Moment'],
        radar: { axes: [4, 4, 5, 3, 4] },
        cost: { structure: 20, hardware: 35, content: 30, install: 15 },
        pains: ['Need to boost footfall and dwell time fast', 'Interactive must be fun but reliable', 'Brand consistency: lighting/material/graphics', 'Short cycles require frequent iteration'],
        architecture: ['Ambient: LightWall as main key visual', 'Interactive: gesture/touch device as engagement point', 'Shareable: naked-eye 3D mini screen', 'Data: interaction counts and heatmap (optional)'],
        capabilities: ['Brand visual execution and consistent lighting', 'Interactive design and content updates', 'Safety reinforcement for structure/devices', 'Fast installation and on-event maintenance'],
        deliverables: ['Plan: flow, interaction, points and BOM', 'Build: structure/finishes/lighting/graphics', 'Deploy: app + device commissioning', 'Ops: inspection, spares and contingency (optional)'],
        metrics: ['Engagement: triggers and completion rate (optional)', 'Share: photo spot dwell & scan conversion (optional)', 'Peak stability with low latency', 'Safety compliance for edges/structure/power'],
        modules: ['LightWall', 'Gesture interaction', 'Multi-touch table', 'Quiz/lottery interaction (optional)'],
        scenarios: [
          { title: 'Brand Pop-up Store', desc: 'Engagement + shareable moments with conversion in mind.' },
          { title: 'Mall Atrium Activation', desc: 'Fast rhythm, stability and safety first.' },
          { title: 'New Product Launch Zone', desc: 'Naked-eye 3D + ambient wall for PR.' },
          { title: 'Long-term Store Upgrade', desc: 'Maintainable structure and updatable content for ops.' }
        ]
      }
    }
  };

  const fillList = (el, arr, { ordered = false } = {}) => {
    if (!el) return;
    el.innerHTML = '';
    (arr || []).forEach((txt) => {
      const li = document.createElement('li');
      li.textContent = txt;
      el.appendChild(li);
    });
    if (ordered) {
      // no-op; list style is controlled in markup
    }
  };

  const renderScenarios = (el, arr) => {
    if (!el) return;
    el.innerHTML = '';
    (arr || []).forEach((s) => {
      const card = document.createElement('div');
      card.className = 'rounded-2xl border border-slate-200 bg-slate-50 p-4';
      const t = document.createElement('div');
      t.className = 'text-sm font-semibold text-slate-900';
      t.textContent = s.title;
      const d = document.createElement('div');
      d.className = 'mt-1 text-sm text-slate-600';
      d.textContent = s.desc;
      card.appendChild(t);
      card.appendChild(d);
      el.appendChild(card);
    });
  };

  const render = (key) => {
    const lang = getLang() === 'en' ? 'en' : 'zh';
    const langData = data[lang];
    const d = langData[key] || langData.museum;
    items.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.solution === key));
    title.textContent = d.title;
    copy.textContent = d.copy;
    tags.innerHTML = '';
    d.tags.forEach((t) => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = t;
      tags.appendChild(span);
    });

    fillList(pains, d.pains);
    fillList(arch, d.architecture, { ordered: true });
    fillList(caps, d.capabilities);
    fillList(delivers, d.deliverables);
    fillList(metrics, d.metrics);
    fillList(modules, d.modules);
    renderScenarios(scenarios, d.scenarios);

    const axisLabels = lang === 'en'
      ? ['Delivery Complexity', 'Schedule Sensitivity', 'Interaction Level', 'Structure Weight', 'Integration Complexity']
      : ['交付复杂度', '工期敏感度', '互动占比', '结构占比', '对接复杂度'];

    const costLabels = lang === 'en'
      ? { structure: 'Structure/Lightbox', hardware: 'Interactive Hardware', content: 'Content & Commissioning', install: 'Install & Logistics' }
      : { structure: '结构/灯箱', hardware: '互动硬件', content: '内容与联调', install: '安装与运输' };

    const renderRadar = () => {
      if (!radarWrap) return;
      const values = (d.radar?.axes || [3, 3, 3, 3, 3]).map((v) => Math.max(0, Math.min(5, Number(v) || 0)));

      const w = 300;
      const h = 260;
      const cx = w / 2;
      const cy = 120;
      const maxR = 90;
      const n = values.length;

      const polar = (i, r) => {
        const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
        return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
      };

      const ringPath = (r) => {
        const pts = Array.from({ length: n }, (_, i) => polar(i, r));
        return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
      };

      const valuePath = () => {
        const pts = values.map((v, i) => polar(i, (v / 5) * maxR));
        return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
      };

      const lines = Array.from({ length: n }, (_, i) => {
        const [x, y] = polar(i, maxR);
        return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1" />`;
      }).join('');

      const rings = [1, 2, 3, 4, 5].map((k) => {
        const r = (k / 5) * maxR;
        return `<path d="${ringPath(r)}" fill="none" stroke="#e2e8f0" stroke-width="1" />`;
      }).join('');

      const labels = axisLabels.map((t, i) => {
        const [x, y] = polar(i, maxR + 24);
        const anchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle';
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="#475569">${t}</text>`;
      }).join('');

      const points = values.map((v, i) => {
        const [x, y] = polar(i, (v / 5) * maxR);
        return `
          <g class="ae800-radar-point" data-i="${i}" data-v="${v}">
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#2563eb" opacity="0.85" />
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="transparent" />
          </g>
        `;
      }).join('');

      const svg = `
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="radar">
          ${rings}
          ${lines}
          <path d="${valuePath()}" fill="rgba(37,99,235,0.18)" stroke="#2563eb" stroke-width="2" />
          ${points}
          ${labels}
        </svg>
      `;

      radarWrap.innerHTML = `${svg}<div class="ae800-radar-tip" style="position:absolute;left:0;top:0;transform:translate(-9999px,-9999px);padding:8px 10px;border-radius:12px;background:#0f172a;color:#fff;font-size:12px;line-height:1.2;box-shadow:0 10px 20px rgba(2,6,23,.18);pointer-events:none;white-space:nowrap;z-index:5;"></div>`;
      radarWrap.style.position = 'relative';

      const tip = radarWrap.querySelector('.ae800-radar-tip');
      const svgEl = radarWrap.querySelector('svg');
      const pointEls = $$('.ae800-radar-point', radarWrap);
      if (!tip || !svgEl || !pointEls.length) return;

      const hide = () => {
        tip.style.transform = 'translate(-9999px,-9999px)';
      };

      const move = (evt) => {
        const rect = radarWrap.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        tip.style.transform = `translate(${Math.round(x + 10)}px, ${Math.round(y + 10)}px)`;
      };

      pointEls.forEach((g) => {
        g.style.cursor = 'default';
        g.addEventListener('mouseenter', (evt) => {
          const idx = Number(g.getAttribute('data-i') || '0');
          const val = Number(g.getAttribute('data-v') || '0');
          const label = axisLabels[idx] || '';
          tip.textContent = `${label}：${val}/5`;
          move(evt);
        });
        g.addEventListener('mousemove', move);
        g.addEventListener('mouseleave', hide);
      });

      svgEl.addEventListener('mouseleave', hide);
    };

    const renderCost = () => {
      if (!costWrap || !costLegend) return;

      const raw = d.cost || { structure: 25, hardware: 25, content: 25, install: 25 };
      const keys = ['structure', 'hardware', 'content', 'install'];
      const sum = keys.reduce((s, k) => s + (Number(raw[k]) || 0), 0) || 1;
      const norm = Object.fromEntries(keys.map((k) => [k, Math.round(((Number(raw[k]) || 0) / sum) * 100)]));

      const colors = {
        structure: 'bg-slate-800',
        hardware: 'bg-blue-600',
        content: 'bg-emerald-600',
        install: 'bg-amber-500'
      };

      costWrap.innerHTML = `
        <div class="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
          ${keys.map((k) => `<div class="${colors[k]}" style="width:${norm[k]}%"></div>`).join('')}
        </div>
      `;

      costLegend.innerHTML = keys
        .map((k) => `
          <div class="flex items-center gap-2">
            <span class="inline-block h-2 w-2 rounded-full ${colors[k]}"></span>
            <span>${costLabels[k]} · ${norm[k]}%</span>
          </div>
        `)
        .join('');
    };

    renderRadar();
    renderCost();
  };

  items.forEach((btn) => {
    btn.addEventListener('click', () => render(btn.dataset.solution || 'museum'));
  });

  if (toContact) {
    toContact.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (openHandbook) {
    openHandbook.addEventListener('click', () => {
      const btn = $('#openHandbookModal');
      if (btn) btn.click();
    });
  }

  render('museum');

  window.addEventListener('ae800:lang', () => {
    const active = items.find((b) => b.classList.contains('is-active'));
    render(active?.dataset?.solution || 'museum');
  });
}

function initProductLanding() {
  const tabsWrap = $('#productTabs');
  if (!tabsWrap) return;

  const tabs = $$('.tab', tabsWrap);
  const title = $('#productTitle');
  const desc = $('#productDesc');
  const usecases = $('#productUsecases');
  const adv = $('#productAdvantages');
  const pills = $('#productPills');
  const delivers = $('#productDeliverables');
  const compareBody = $('#productCompareBody');
  const casesWrap = $('#productCases');
  const radarWrap = $('#productRadar');
  const costWrap = $('#productCost');
  const costLegend = $('#productCostLegend');
  const flowWrap = $('#productFlowAnim');
  if (!tabs.length || !title || !desc || !usecases || !adv || !pills || !delivers || !compareBody) return;

  const getLang = () => localStorage.getItem('ae800_lang') || 'zh';

  let flowTimer = null;

  const renderRadar = (langData, productKey) => {
    if (!radarWrap) return;

    const axisLabels = langData.chartAxes || [];
    const d = langData[productKey] || langData.lightbox;
    const values = (d.radar?.axes || [3, 3, 3, 3, 3]).map((v) => Math.max(0, Math.min(5, Number(v) || 0)));

    const w = 300;
    const h = 240;
    const cx = w / 2;
    const cy = 110;
    const maxR = 80;
    const n = values.length;

    const polar = (i, r) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
    };

    const ringPath = (r) => {
      const pts = Array.from({ length: n }, (_, i) => polar(i, r));
      return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
    };

    const valuePath = () => {
      const pts = values.map((v, i) => polar(i, (v / 5) * maxR));
      return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
    };

    const lines = Array.from({ length: n }, (_, i) => {
      const [x, y] = polar(i, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1" />`;
    }).join('');

    const rings = [1, 2, 3, 4, 5].map((k) => {
      const r = (k / 5) * maxR;
      return `<path d="${ringPath(r)}" fill="none" stroke="#e2e8f0" stroke-width="1" />`;
    }).join('');

    const labels = axisLabels.map((t, i) => {
      const [x, y] = polar(i, maxR + 22);
      const anchor = x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle';
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="#475569">${t}</text>`;
    }).join('');

    const points = values.map((v, i) => {
      const [x, y] = polar(i, (v / 5) * maxR);
      return `
        <g class="ae800-prod-radar-point" data-i="${i}" data-v="${v}">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#2563eb" opacity="0.85" />
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="transparent" />
        </g>
      `;
    }).join('');

    const svg = `
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="radar">
        ${rings}
        ${lines}
        <path d="${valuePath()}" fill="rgba(37,99,235,0.18)" stroke="#2563eb" stroke-width="2" />
        ${points}
        ${labels}
      </svg>
    `;

    radarWrap.innerHTML = `${svg}<div class="ae800-prod-radar-tip" style="position:absolute;left:0;top:0;transform:translate(-9999px,-9999px);padding:8px 10px;border-radius:12px;background:#0f172a;color:#fff;font-size:12px;line-height:1.2;box-shadow:0 10px 20px rgba(2,6,23,.18);pointer-events:none;white-space:nowrap;z-index:5;"></div>`;
    radarWrap.style.position = 'relative';

    const tip = radarWrap.querySelector('.ae800-prod-radar-tip');
    const svgEl = radarWrap.querySelector('svg');
    const pointEls = $$('.ae800-prod-radar-point', radarWrap);
    if (!tip || !svgEl || !pointEls.length) return;

    const hide = () => {
      tip.style.transform = 'translate(-9999px,-9999px)';
    };

    const move = (evt) => {
      const rect = radarWrap.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      tip.style.transform = `translate(${Math.round(x + 10)}px, ${Math.round(y + 10)}px)`;
    };

    pointEls.forEach((g) => {
      g.style.cursor = 'default';
      g.addEventListener('mouseenter', (evt) => {
        const idx = Number(g.getAttribute('data-i') || '0');
        const val = Number(g.getAttribute('data-v') || '0');
        const label = axisLabels[idx] || '';
        tip.textContent = `${label}: ${val}/5`;
        move(evt);
      });
      g.addEventListener('mousemove', move);
      g.addEventListener('mouseleave', hide);
    });

    svgEl.addEventListener('mouseleave', hide);
  };

  const renderCost = (langData, productKey) => {
    if (!costWrap || !costLegend) return;
    const d = langData[productKey] || langData.lightbox;
    const labels = langData.costLabels || {};

    const raw = d.cost || { structure: 25, hardware: 25, content: 25, install: 25 };
    const keys = ['structure', 'hardware', 'content', 'install'];
    const sum = keys.reduce((s, k) => s + (Number(raw[k]) || 0), 0) || 1;
    const norm = Object.fromEntries(keys.map((k) => [k, Math.round(((Number(raw[k]) || 0) / sum) * 100)]));

    const colors = {
      structure: 'bg-slate-800',
      hardware: 'bg-blue-600',
      content: 'bg-emerald-600',
      install: 'bg-amber-500'
    };

    costWrap.innerHTML = `
      <div class="h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
        ${keys.map((k) => `<div class="${colors[k]}" style="width:${norm[k]}%"></div>`).join('')}
      </div>
    `;

    costLegend.innerHTML = keys
      .map((k) => `
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full ${colors[k]}"></span>
          <span>${labels[k] || k} · ${norm[k]}%</span>
        </div>
      `)
      .join('');
  };

  const renderFlowAnim = (langData, productKey) => {
    if (!flowWrap) return;
    const d = langData[productKey] || langData.lightbox;
    const steps = langData.flowSteps || [];
    const focus = d.flowFocus || [];

    const render = (activeIdx) => {
      flowWrap.innerHTML = `
        <div class="flex flex-wrap items-center gap-2">
          ${steps
            .map((t, i) => {
              const isActive = i === activeIdx;
              const isFocus = focus.includes(t);
              const cls = isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : isFocus
                  ? 'bg-white text-slate-900 border-slate-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200';
              return `<span class="px-3 py-1 rounded-full border text-xs ${cls}">${t}</span>`;
            })
            .join('')}
        </div>
      `;
    };

    if (flowTimer) window.clearInterval(flowTimer);
    let idx = 0;
    render(idx);
    flowTimer = window.setInterval(() => {
      idx = (idx + 1) % steps.length;
      render(idx);
    }, 900);
  };

  const data = {
    zh: {
      compareRows: [
        { k: '典型目标', v: ['高质感视觉统一 + 快维护', '互动参与 + 稳定运行', '入口记忆点 + 沉浸叙事'] },
        { k: '适用空间', v: ['展馆导览、走廊、墙面、导视', '展项岛台、互动区、教育区', '入口区、主题故事区、展厅主视觉'] },
        { k: '交付内容', v: ['结构 + 面材 + 光源 + 安装', '硬件 + 软件 + 内容对接/联调', '投影/屏体 + 灯光 + 中控联动'] },
        { k: '维护要点', v: ['快拆快换、备件标准化', '设备巡检、内容可更新', '校正/融合参数固化、稳定供电'] },
        { k: '工期特性', v: ['结构标准化，现场效率高', '需要联调窗口，预留测试', '对场地条件敏感，需早期踏勘'] },
        { k: '主要成本构成', v: ['结构/面材/光源/画面', '设备/软件/内容制作与联调', '屏体/投影/灯光/中控与校正'] },
        { k: '关键依赖', v: ['墙体/龙骨/供电走线条件', '网络/内容接口/现场联调窗口', '投射距离/遮光/供电/设备间'] },
        { k: '验收口径示例', v: ['亮度均匀性、结构稳固、可维护性', '响应延迟、稳定性、内容可更新', '融合无明显接缝、音画同步、场景联动'] }
      ],
      chartAxes: ['交付复杂度', '工期敏感度', '维护友好度', '复用程度', '对接复杂度'],
      costLabels: { structure: '结构/灯箱', hardware: '互动硬件', content: '内容与联调', install: '安装与运输' },
      flowSteps: ['需求澄清', '深化设计', '工厂制作', '现场安装', '联调验收', '质保运维'],
      lightbox: {
        title: 'LightBox（灯箱系统）',
        desc: '系统化灯箱结构体系：超薄/弧形/模块化/光墙。强调视觉一致、快维护、可复用。',
        usecases: ['长期展馆导览墙与信息墙', '城市展厅入口导视与形象墙', '临展快装快拆展墙', '商业展示高亮主视觉位'],
        advantages: ['光源均匀、显色稳定，画面一致性好', '模块化结构，快拆装、快换画面', '可做弧形/异形，满足空间造型', '结构与电气标准化，维护成本可控'],
        pills: ['UltraSlim（超薄）', 'CurveFlex（弧形）', 'MegaWall（大场景）', 'Magnetic Pro（磁吸维护）', 'ECO 模块化', 'LightWall（光墙）'],
        deliverables: ['深化/排版：节点、龙骨、面材、光源布局', '结构制作：金属框架、安装件、预埋件', '电气：电源、走线、开孔与检修位', '现场：安装、通电测试、亮度/均匀性检查', '资料：材料清单、维护说明（可选）'],
        radar: { axes: [4, 4, 5, 5, 3] },
        cost: { structure: 45, hardware: 10, content: 10, install: 35 },
        flowFocus: ['深化设计', '工厂制作', '现场安装', '质保运维']
      },
      interactive: {
        title: 'Interactive（互动装置）',
        desc: '把数字互动做成可长期运行的展项：AI 讲解、电子翻书、问答墙、体感互动、多点触控桌等。',
        usecases: ['博物馆常设展互动解说与教育区', '城市展厅信息查询与互动传播点', '商业展示引流互动与会员转化', '临展可租赁/可复用互动展项'],
        advantages: ['硬件选型偏“稳定可维护”，适合长期运行', '支持内容更新与接口对接（中控/多媒体）', '可提供联调测试与验收口径模板', '结构与设备一体化安装，降低现场返工'],
        pills: ['AI Guide Screen', 'Digital Flipbook', 'Quiz Wall', 'Shadow Interactive', 'MultiTouch Table', 'Naked-eye 3D 小屏'],
        deliverables: ['方案：交互逻辑、设备清单、点位图', '硬件：屏体/主机/传感器/音响等集成', '软件：交互程序部署（按项目）', '内容：接口约定与联调（可选）', '现场：安装、调试、稳定性测试与验收资料'],
        radar: { axes: [4, 5, 4, 3, 5] },
        cost: { structure: 15, hardware: 40, content: 25, install: 20 },
        flowFocus: ['需求澄清', '深化设计', '联调验收', '质保运维']
      },
      immersive: {
        title: 'Immersive（沉浸式场景）',
        desc: '沉浸式入口与故事区模块：多面投影/屏体、氛围灯光、融合校正与中控联动，打造高记忆点空间。',
        usecases: ['城市展厅入口“第一眼”空间', '博物馆主题故事区沉浸叙事', '临展沉浸式快闪打卡区', '品牌展厅新品发布沉浸场景'],
        advantages: ['叙事空间化：更强的记忆点与传播性', '模块化设计可控：可按预算分级配置', '融合校正与中控联动，保证效果一致', '与灯箱/互动组合，形成完整体验链路'],
        pills: ['Mini Immersive Box', 'Immersive Corridor', 'EdgeScreen 半环幕', '氛围灯光', '融合校正', '中控联动'],
        deliverables: ['场地踏勘：尺寸、投影距离、供电网络', '方案：屏幕/投影选型、声光电点位', '实施：安装、融合校正、灯光调试', '联动：中控逻辑与一键场景（可选）', '验收：参数备份、维护建议与交付资料'],
        radar: { axes: [5, 5, 3, 4, 5] },
        cost: { structure: 25, hardware: 35, content: 25, install: 15 },
        flowFocus: ['需求澄清', '深化设计', '联调验收', '质保运维']
      },
      cases: {
        lightbox: [
          { tag: '灯箱/发光字', title: '北京大兴国际机场全国爱国主义教育示范基地基本陈列展览', desc: '承接卡布发光灯箱画面制作及安装、金属立体景观发光字。', href: 'https://www.ae800.com/case/116' },
          { tag: '标识', title: '北平机器 标识', desc: '标识制作与安装案例。', href: 'https://www.ae800.com/case/119' },
          { tag: '标志制作', title: '中国文化遗产 标志制作安装', desc: '标志制作与安装案例。', href: 'https://www.ae800.com/case/115' },
          { tag: '发光字', title: '宜宾大型成就展布展---发光字', desc: '在时间短的情况下完成发光字制作与交付。', href: 'https://www.ae800.com/case/109' }
        ],
        interactive: [
          { tag: '多媒体展项', title: '延安革命纪念馆', desc: '展厅包含多媒体科技展项与艺术装置，强调序列化与叙事呈现。', href: 'https://www.ae800.com/case/130' },
          { tag: '沉浸/互动', title: '淮海战役纪念馆', desc: '展陈面积约12000㎡，含浸入式展项与多段视频内容。', href: 'https://www.ae800.com/case/131' },
          { tag: '联觉设计', title: '中国共产党历史展览馆', desc: '汇聚多专业联觉设计，系统推演到技术实施的综合展陈作品。', href: 'https://www.ae800.com/case/128' },
          { tag: '大型成就展', title: '“伟大的变革”庆祝改革开放40周年大型成就展', desc: '承担多个展区布展实施，融合模型、场景与展示系统。', href: 'https://www.ae800.com/case/102' }
        ],
        immersive: [
          { tag: '国博', title: '中国国家博物馆—复兴之路', desc: '“复兴之路”基本陈列的新时代部分展出，强调叙事与展示系统性。', href: 'https://www.ae800.com/case/129' },
          { tag: '艺术体验展', title: '到梦想里去，“伊利营养2030”公益行动艺术体验展亮相尤伦斯', desc: '在 UCCA 尤伦斯当代艺术中心的艺术体验展案例。', href: 'https://www.ae800.com/case/126' },
          { tag: '摄影展', title: '庆祝中国红十字会成立120周年摄影展 搭建', desc: '北京中华世纪坛开幕的摄影展搭建案例。', href: 'https://www.ae800.com/case/127' },
          { tag: '大型成就展', title: '“砥砺奋进的五年”大型成就展在京开展 圆满完成布展任务', desc: '多种展示手段融合，立体化呈现与任务交付案例。', href: 'https://www.ae800.com/case/77' }
        ]
      }
    },
    en: {
      compareRows: [
        { k: 'Primary Goal', v: ['Premium visual consistency + easy maintenance', 'Participation + reliable operation', 'High-impact entrance + immersive storytelling'] },
        { k: 'Best For', v: ['Wayfinding walls, corridors, key visuals', 'Interactive zones, education areas', 'Entrance zones, main story areas'] },
        { k: 'Deliverables', v: ['Structure + face material + lighting + install', 'Hardware + software + integration', 'Projection/screen + lighting + control'] },
        { k: 'Maintenance', v: ['Fast swap, standardized spare parts', 'Device checks, updatable content', 'Locked calibration params, stable power'] },
        { k: 'Schedule Notes', v: ['Standardized fabrication, fast on-site', 'Needs commissioning window', 'Sensitive to site conditions; early survey'] },
        { k: 'Cost Drivers', v: ['Frames/materials/lighting/graphics', 'Devices/software/content & commissioning', 'Screens/projectors/lighting/control & calibration'] },
        { k: 'Key Dependencies', v: ['Wall structure, power routing, access', 'Network, content interfaces, on-site window', 'Throw distance, blackout, power, rack room'] },
        { k: 'Acceptance Examples', v: ['Uniformity, stability, serviceability', 'Latency, stability, updatable content', 'Seamless blending, AV sync, scene linkage'] }
      ],
      chartAxes: ['Delivery Complexity', 'Schedule Sensitivity', 'Maintainability', 'Reusability', 'Integration Complexity'],
      costLabels: { structure: 'Structure/Lightbox', hardware: 'Interactive Hardware', content: 'Content & Commissioning', install: 'Install & Logistics' },
      flowSteps: ['Brief', 'Detailing', 'Fabrication', 'Installation', 'Commissioning', 'O&M'],
      lightbox: {
        title: 'LightBox (Lightbox Systems)',
        desc: 'Modular lightbox systems: ultra-slim, curved, modular frames and LightWall. Built for consistency and maintenance.',
        usecases: ['Permanent museum wayfinding & info walls', 'Showroom entrances and brand walls', 'Pop-up exhibition quick-build walls', 'Retail high-bright key visuals'],
        advantages: ['Uniform lighting and stable color rendering', 'Modular frames for fast assembly and graphic swaps', 'Curved / custom shapes supported', 'Standardized structure & electrical design'],
        pills: ['UltraSlim', 'CurveFlex', 'MegaWall', 'Magnetic Pro', 'ECO Modular', 'LightWall'],
        deliverables: ['Detailing: nodes, frames, materials, lighting layout', 'Fabrication: metal frames and mounting parts', 'Electrical: PSU, wiring, access panels', 'On-site: installation and lighting checks', 'Docs: bill of materials & maintenance guide (optional)'],
        radar: { axes: [4, 4, 5, 5, 3] },
        cost: { structure: 45, hardware: 10, content: 10, install: 35 },
        flowFocus: ['Detailing', 'Fabrication', 'Installation', 'O&M']
      },
      interactive: {
        title: 'Interactive (Interactive Devices)',
        desc: 'Deployable interactive exhibits: AI guide, flipbook, quiz wall, gesture interaction and multi-touch table.',
        usecases: ['Museum education & interpretation areas', 'Showroom info query & shareable moments', 'Retail activation for footfall & conversion', 'Reusable / rentable interactive modules'],
        advantages: ['Reliability-first hardware selection for long-term operation', 'Updatable content and integration-ready interfaces', 'Commissioning tests and acceptance-ready documentation', 'Integrated structure + devices to reduce on-site rework'],
        pills: ['AI Guide Screen', 'Digital Flipbook', 'Quiz Wall', 'Shadow Interactive', 'MultiTouch Table', 'Naked-eye 3D'],
        deliverables: ['Plan: interaction flow, BOM and point layout', 'Hardware: screens/PC/sensors/audio integration', 'Software: app deployment (project-based)', 'Content integration: interfaces & commissioning (optional)', 'On-site: install, commissioning, stability tests and handover'],
        radar: { axes: [4, 5, 4, 3, 5] },
        cost: { structure: 15, hardware: 40, content: 25, install: 20 },
        flowFocus: ['Brief', 'Detailing', 'Commissioning', 'O&M']
      },
      immersive: {
        title: 'Immersive (Immersive Scenes)',
        desc: 'Immersive entrance/story modules with projection/screen, ambient lighting, warping & blending and control integration.',
        usecases: ['Showroom “first impression” entrance zones', 'Museum story areas with immersive narrative', 'Pop-up immersive photo zones', 'Brand showrooms for product launches'],
        advantages: ['Spatial storytelling with strong memorability', 'Tiered configuration by budget', 'Calibrated warping/blending for consistent effects', 'Combines well with LightBox + Interactive as a full journey'],
        pills: ['Mini Immersive Box', 'Immersive Corridor', 'EdgeScreen', 'Ambient Lighting', 'Warp & Blend', 'Control Integration'],
        deliverables: ['Site survey: dimensions, throw distance, power/network', 'Design: projection/screen spec and AV points', 'Execution: install, calibration, lighting tuning', 'Control: one-click scenes (optional)', 'Handover: parameter backup & maintenance notes'],
        radar: { axes: [5, 5, 3, 4, 5] },
        cost: { structure: 25, hardware: 35, content: 25, install: 15 },
        flowFocus: ['Brief', 'Detailing', 'Commissioning', 'O&M']
      },
      cases: {
        lightbox: [
          { tag: 'Lightbox / Signage', title: 'Beijing Daxing International Airport – Exhibition', desc: 'Fabrication and installation of lightbox graphics and metal illuminated letters.', href: 'https://www.ae800.com/case/116' },
          { tag: 'Signage', title: 'Beiping Machine – Signage', desc: 'Signage fabrication and installation case.', href: 'https://www.ae800.com/case/119' },
          { tag: 'Logo Build', title: 'China Cultural Heritage – Logo Fabrication', desc: 'Logo fabrication and installation case.', href: 'https://www.ae800.com/case/115' },
          { tag: 'Illuminated Letters', title: 'Yibin Achievement Exhibition – Illuminated Letters', desc: 'Illuminated letter fabrication delivered under a tight schedule.', href: 'https://www.ae800.com/case/109' }
        ],
        interactive: [
          { tag: 'Multimedia', title: 'Yan’an Revolution Memorial Hall', desc: 'A mix of multimedia exhibits and installations with strong narrative sequencing.', href: 'https://www.ae800.com/case/130' },
          { tag: 'Immersive Exhibit', title: 'Huaihai Campaign Memorial Hall', desc: 'Large-scale exhibition with immersive exhibits and video segments.', href: 'https://www.ae800.com/case/131' },
          { tag: 'Experience Design', title: 'The CPC History Exhibition Hall', desc: 'A multi-disciplinary, experience-driven exhibition project with systemized delivery.', href: 'https://www.ae800.com/case/128' },
          { tag: 'Large Exhibition', title: 'Reform & Opening-up 40th Anniversary Exhibition', desc: 'Exhibition build integrating models, scenes and systems across multiple zones.', href: 'https://www.ae800.com/case/102' }
        ],
        immersive: [
          { tag: 'National Museum', title: 'National Museum of China – The Road to Rejuvenation', desc: 'A systemized exhibition narrative for the new era section of the permanent exhibition.', href: 'https://www.ae800.com/case/129' },
          { tag: 'Art Experience', title: 'Yili Nutrition 2030 – Art Experience at UCCA', desc: 'An art experience exhibition project at UCCA in Beijing.', href: 'https://www.ae800.com/case/126' },
          { tag: 'Photo Exhibition', title: '120th Anniversary of the Red Cross of China – Build', desc: 'Photo exhibition build at Beijing Millennium Monument.', href: 'https://www.ae800.com/case/127' },
          { tag: 'Large Exhibition', title: '“Amazing 5 Years” Achievement Exhibition – Beijing', desc: 'A multi-zone exhibition delivered with rich media and interactive elements.', href: 'https://www.ae800.com/case/77' }
        ]
      }
    }
  };

  const renderCases = (key) => {
    if (!casesWrap) return;
    const lang = getLang() === 'en' ? 'en' : 'zh';
    const list = data[lang]?.cases?.[key] || data[lang]?.cases?.lightbox || [];
    casesWrap.innerHTML = '';
    list.forEach((c) => {
      const a = document.createElement('a');
      a.className = 'case-card';
      a.href = c.href;
      a.innerHTML = `
        <div class="p-5">
          <div class="text-xs text-slate-500">${c.tag}</div>
          <div class="mt-1 font-semibold">${c.title}</div>
          <div class="mt-2 text-sm text-slate-600">${c.desc}</div>
          <div class="mt-4 text-brand-700 font-medium">${lang === 'en' ? 'View' : '查看'}</div>
        </div>
      `;
      casesWrap.appendChild(a);
    });
  };

  const renderCompare = () => {
    const lang = getLang() === 'en' ? 'en' : 'zh';
    const rows = data[lang].compareRows;
    compareBody.innerHTML = '';
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const tdK = document.createElement('td');
      tdK.textContent = r.k;
      tr.appendChild(tdK);
      r.v.forEach((val) => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
      compareBody.appendChild(tr);
    });
  };

  const render = (key) => {
    const lang = getLang() === 'en' ? 'en' : 'zh';
    const langData = data[lang];
    const d = langData[key] || langData.lightbox;
    tabs.forEach((t) => {
      const active = (t.dataset.product || '') === key;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });

    title.textContent = d.title;
    desc.textContent = d.desc;

    const fillList = (el, arr) => {
      el.innerHTML = '';
      arr.forEach((txt) => {
        const li = document.createElement('li');
        li.textContent = txt;
        el.appendChild(li);
      });
    };

    fillList(usecases, d.usecases);
    fillList(adv, d.advantages);
    fillList(delivers, d.deliverables);

    pills.innerHTML = '';
    d.pills.forEach((p) => {
      const span = document.createElement('span');
      span.className = 'pill';
      span.textContent = p;
      pills.appendChild(span);
    });

    renderCases(key);
    renderRadar(langData, key);
    renderCost(langData, key);
    renderFlowAnim(langData, key);
    renderCompare();
  };

  const scrollToPanelOnMobile = () => {
    if (window.matchMedia && window.matchMedia('(min-width: 1024px)').matches) return;
    const panel = $('#productTitle');
    if (!panel) return;
    const wrap = panel.closest('section') || panel;
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      const key = t.dataset.product || 'lightbox';
      render(key);
      scrollToPanelOnMobile();
    });
  });

  render('lightbox');

  window.addEventListener('ae800:lang', () => {
    const activeBtn = tabs.find((t) => t.classList.contains('is-active'));
    render(activeBtn?.dataset?.product || 'lightbox');
  });
}

function initI18n() {
  const toggles = $$('.lang-btn');
  if (!toggles.length) return;

  const dict = {
    zh: {
      nav_capabilities: '能力',
      nav_solutions: '解决方案',
      nav_services: '服务',
      nav_products: '产品',
      nav_cases: '案例',
      nav_docs: '资料',
      nav_contact: '联系',
      nav_cta: '获取方案',
      nav_cta_mobile: '立即咨询',
      brand_tagline: '数字化展陈 · 灯箱系统 · 互动装置',
      sol_page_title: '行业解决方案',
      sol_page_h1: '行业解决方案',
      sol_page_intro: '将灯箱系统、金属结构与互动装置组合成可复制的方案包，用于不同类型场景快速落地。',
      sol_picker_title: '选择行业',
      sol_picker_museum: '博物馆互动',
      sol_picker_city: '城市展厅沉浸式',
      sol_picker_temp: '临展快装',
      sol_picker_retail: '商业展示互动',
      sol_panel_kicker: '方案概览',
      sol_panel_cta: '提交需求',
      sol_pains_title: '常见痛点',
      sol_arch_title: '方案架构（可复制）',
      sol_cap_title: '关键能力',
      sol_deliver_title: '交付物清单',
      sol_metrics_title: '验收与指标建议',
      sol_modules_title: '可选模块',
      sol_scenarios_title: '典型场景',
      sol_chart_radar_title: '交付画像（示例）',
      sol_chart_cost_title: '成本构成（示例）',
      sol_chart_hint: '说明：为沟通口径示例，实际以项目条件为准。',
      sol_quote_title: '想要更快报价？',
      sol_quote_desc: '建议你提供：城市/场地类型、面积、工期节点、预算区间、交付范围（结构/灯箱/互动/沉浸式）。',
      sol_quote_cta: '提交需求',
      hero_badge: '2001 - 2025 · 产业链协同 · 交付可控',
      hero_title: '数字化展陈 · 灯箱系统 · 互动装置 · 沉浸式体验',
      hero_subtitle: '我们融合灯光结构、金属加工与数字互动，为展览、博物馆、城市展厅与商业展示提供从深化、制作到安装调试的一体化落地服务。',
      hero_primary: '免费获取项目建议',
      hero_secondary: '查看服务手册',
      hero_m1: '结构材质设计经验',
      hero_m2: '专属项目经理',
      hero_m3: '结构质保可选',
      hero_m4: '进度透明可控',
      lead_kicker: '快速咨询',
      lead_title: '30秒提交需求',
      lead_name: '联系人',
      lead_name_ph: '请输入姓名',
      lead_phone: '手机号',
      lead_phone_ph: '用于回访沟通',
      lead_need: '需求简述',
      lead_need_ph: '如：展厅面积/工期/预算/地点/交付范围',
      lead_submit: '提交（本地演示）',
      lead_note: '本模板为静态演示：提交后会在本地生成提示，不会自动发送到服务器。',
      lead_phone_k: '电话',
      lead_more_contact: '更多联系方式',
      svc_kicker: '服务体系',
      svc_title: '从深化到安装调试的一体化交付',
      svc_desc: '灯箱系统定制、展项结构与柜体、互动装置集成、沉浸式场景、工程施工、数字内容对接。',
      svc_link: '进入服务页',
      cases_kicker: '精选案例',
      cases_title: '用结果证明交付能力',
      cases_desc: '从国家级馆展到大型成就展与公共空间项目，支持不同规模与复杂度的展陈落地。下面示例来源于现有站点案例内容整理。',
      cases_link: '进入案例库',
      case_filter_all: '全部',
      case_filter_museum: '博物馆/纪念馆',
      case_filter_exhibition: '大型成就展',
      case_filter_brand: '标识/形象展示',
      adv_kicker: '为什么选择我们',
      adv_title: '把“不确定”变成“可控”',
      adv_desc: '对甲方而言，最难的是多方协作、现场不可控与质量风险。我们把交付拆解为清晰流程和可复用标准，让沟通更省心、验收更顺畅。',
      adv_i1_t: '真材实料 · 按合同执行',
      adv_i1_d: '为您匹配性价比与合规性更优的材质方案，过程留痕。',
      adv_i2_t: '全程可控 · 专属对接',
      adv_i2_d: '对接甲方、装修方及第三方，减少信息损耗与返工。',
      adv_i3_t: '品质出众 · 可验收标准',
      adv_i3_d: '关键节点设定验收口径，交付质量更可预期。',
      scene_kicker: '适用场景',
      scene_title: '你更适合哪种合作方式？',
      scene_hint: '点击卡片查看建议',
      scene_design_t: '只有需求概念，需要方案与预算',
      scene_design_d: '建议：先做需求澄清与概念方案，形成清单与估算区间。',
      scene_build_t: '已有设计图纸，需要深化+施工落地',
      scene_build_d: '建议：做图纸审查与施工深化，排除现场风险点。',
      scene_turnkey_t: '需要设计+施工+多媒体一体化交付',
      scene_turnkey_d: '建议：以里程碑节点管控工期与质量，统一验收口径。',
      scene_event_t: '时间紧，需要活动/开幕执行',
      scene_event_d: '建议：先定关键节点与物料清单，设立现场统筹机制。',
      scene_cta_contact: '把你的项目发给我们',
      scene_cta_products: '查看产品与工艺方向',
      proc_kicker: '交付流程',
      proc_title: '从沟通到验收的标准路径',
      proc_desc: '把复杂项目拆解成可复用流程：需求明确、方案可比、节点可验收。让你能掌握节奏，不被现场“随机事件”牵着走。',
      proc_s1_t: '需求澄清',
      proc_s1_d: '明确目标、受众、空间条件、预算区间与工期节点。',
      proc_s2_t: '方案设计/深化',
      proc_s2_d: '空间叙事、效果图、材料清单与施工图深化，降低落地偏差。',
      proc_s3_t: '制作施工',
      proc_s3_d: '材料进场验收、过程留痕，关键节点对齐验收口径。',
      proc_s4_t: '联调交付',
      proc_s4_d: '设备联调、现场收口与最终验收；交付资料与维护建议。',
      home_faq_kicker: 'FAQ',
      home_faq_title: '甲方常见问题',
      home_faq_desc: '把沟通中最常见的关键问题先说清楚：预算、周期、交付物、验收标准与协作方式。',
      home_faq_q1: '如何快速获得一个可执行的预算范围？',
      home_faq_a1: '建议你提供：城市/场地类型、面积、工期节点、预算区间、交付范围（结构/灯箱/互动/沉浸式）。',
      home_faq_q2: '设计效果如何保证落地一致？',
      home_faq_a2: '通过深化图纸、材料样板确认、关键节点验收口径，以及过程留痕管理，将“效果偏差”提前在图纸和样板阶段消化。',
      home_faq_q3: '工期紧怎么保证现场不失控？',
      home_faq_a3: '优先锁定关键里程碑（进场/隐蔽/安装/联调/验收），提前排程物料与人力，并设置“不可更改节点”。',
      home_faq_q4: '可以只做施工或只做部分展项吗？',
      home_faq_a4: '可以。支持从单项制作安装到整体承包。建议先做技术审查，确保接口边界清晰，降低返工风险。',
      contact_kicker: '联系我们',
      contact_title: '把需求说清楚，我们把方案做落地',
      contact_desc: '你可以通过电话/邮箱/微信联系，也可以提交需求表单。若你希望我们更快评估，请写清：地点、面积、工期、预算区间与交付范围。',
      contact_row_phone: '电话',
      contact_row_email: '邮箱',
      contact_row_wechat: '微信公众号',
      contact_row_addr: '地址',
      contact_tip_title: '下一步建议',
      contact_tip_desc: '如果你现在能提供 4 项信息（面积/工期/地点/预算），我可以把“首页文案”进一步细化成适配你业务的版本，并补齐服务详情页的交付物清单。',
      contact_form_kicker: '需求表单',
      contact_form_title: '快速提交（静态演示）',
      contact_form_link: '进入联系页',
      contact_name: '联系人',
      contact_phone: '手机号',
      contact_email: '邮箱（可选）',
      contact_msg: '需求描述',
      contact_submit: '提交需求',
      footer_brand_desc: '数字化体验 · 展示结构 · 互动装置的整合落地供应商。把灯箱、结构与互动模块化，让空间开口说话。',
      footer_quick: '快速入口',
      footer_docs: '投标与资料',
      footer_services: '服务项目',
      footer_s1: '展示设计 / 装修装饰',
      footer_s2: '数字多媒体 / 活动执行',
      footer_s3: '市场推广 / 企业形象展示',
      footer_contact: '联系',
      footer_note: '新站模板 · 可交互静态演示',
      modal_kicker: '投标与资料',
      modal_title: 'A｜公司服务手册（在线预览）',
      modal_to_docs: '去资料页',
      modal_close: '关闭',
      trust_kicker: '信任背书',
      trust_title: '客户与合作伙伴（展示位）',
      trust_desc: '这里建议放置：国家级馆展/大型展览合作单位/集成商伙伴等 LOGO（可后续替换成真实客户）。',
      trust_link: '查看案例证明',
      assure_kicker: '交付保障',
      assure_title: '质量 · 安全 · 质保 · 响应机制',
      assure_desc: '把投标所需的关键章节放在“资料”里：施工制作方案、工期计划、质量管理、安全文明施工、质保与售后。',
      assure_cta: '查看投标与资料',
      assure_m1k: '结构质保',
      assure_m2k: '互动硬件',
      assure_m3k: '内容维护',
      assure_m4k: '服务响应'
      ,
      suite_kicker: '产品体系',
      suite_title: 'LightBox / Interactive / Immersive',
      suite_desc: '把能力产品化：用可复用的灯箱系统、互动装置与沉浸式模块，快速组合成可落地的展示体验方案。',
      suite_enter_products: '进入产品页',
      suite_cta_scene: '按场景给方案',
      suite_cta_handbook: '预览服务手册',
      suite_view_solutions: '查看行业方案包',
      suite_view_capabilities: '查看核心能力',
      suite_view_docs: '投标与资料',
      picker_kicker: '快速选型',
      picker_title: '选择你的项目类型，我们推荐组合方案',
      picker_desc: '根据场景类型自动推荐：灯箱系统 + 互动装置 + 沉浸式模块的组合打法，并给出下一步行动入口。',
      picker_enter_solutions: '进入解决方案页',
      picker_museum_title: '博物馆互动展项',
      picker_museum_desc: '稳定运行 + 易维护 + 内容可更新',
      picker_city_title: '城市展厅沉浸式',
      picker_city_desc: '入口记忆点 + 故事区沉浸体验',
      picker_temp_title: '临展快装数字化',
      picker_temp_desc: '快装快拆 + 可复用 + 工期可控',
      picker_retail_title: '商业展示互动',
      picker_retail_desc: '引流互动 + 传播点 + 高转化',
      picker_result_kicker: '推荐方案包',
      picker_budget: '可按预算做：入门 / 标准 / 高配',
      picker_cta_contact: '把需求发给我们',
      picker_cta_products: '查看产品体系',
      picker_cta_docs: '查看投标资料',
      prod_nav_title: '产品中心',
      prod_title: '产品中心',
      prod_subtitle: '把能力产品化为三条产品线：LightBox（灯箱系统）、Interactive（互动装置）、Immersive（沉浸式场景）。本页提供选型、对比与交付口径，便于报价与落地。',
      prod_cta: '咨询方案与报价',
      prod_nav_overview: '概览',
      prod_nav_selector: '系列切换',
      prod_nav_compare: '规格对比',
      prod_nav_deliver: '交付范围',
      prod_nav_faq: 'FAQ',
      prod_overview_lightbox: '超薄/弧形/模块化/光墙系统。适合长期展馆、导览与高频内容更换。',
      prod_overview_interactive: 'AI讲解、电子翻书、问答墙、体感与多点触控桌。强调稳定运行与内容对接。',
      prod_overview_immersive: 'MiniBox/沉浸式走廊/半环幕。适合入口记忆点与故事区沉浸叙事。',
      prod_panel_kicker: '当前选择',
      prod_panel_usecases: '适用场景',
      prod_panel_adv: '核心优势',
      prod_panel_cta: '按项目给清单化报价',
      prod_panel_docs: '查看投标与资料',
      prod_panel_modules: '常用模块/型号',
      prod_panel_deliver: '交付范围（默认）',
      prod_compare_kicker: '规格与选型',
      prod_compare_title: '产品线对比（示例模板）',
      prod_compare_desc: '用于投标与沟通的口径模板：可按项目补齐尺寸/材料/功耗/设备型号等明细。',
      prod_compare_col1: '维度',
      prod_deliver_kicker: '交付口径',
      prod_deliver_title: '从深化到安装调试的一体化交付',
      prod_deliver_desc: '默认交付包含：深化设计、结构制作、设备集成、现场安装、联调测试与验收资料。也支持单项分包。',
      prod_deliver_m1: '深化设计',
      prod_deliver_m2: '结构制作',
      prod_deliver_m3: '安装调试',
      prod_deliver_m4: '质保售后',
      prod_faq_kicker: 'FAQ',
      prod_faq_title: '产品常见问题',
      prod_faq_q1: '如何快速获得报价范围？',
      prod_faq_a1: '提供场地类型、面积、工期节点、预算区间与交付范围（灯箱/结构/互动/沉浸式），我们输出清单化估算与风险项。',
      prod_faq_q2: '如何保证长期稳定运行与维护？',
      prod_faq_a2: '通过模块化结构、可维护设计、关键设备选型与联调测试，并提供验收资料与维护建议。',
      prod_faq_q3: '可以只做结构或只做互动吗？',
      prod_faq_a3: '可以。支持单项制作或集成总包。建议先做接口边界与技术审查，降低返工。',
      prod_faq_q4: '投标资料在哪里？',
      prod_faq_a4: '资料页包含：施工制作方案、工期计划、质量管理、安全文明施工、质保与售后等章节，可在线预览并导出PDF。',
      prod_faq_q5: '如何拆分预算？哪些费用最影响总价？',
      prod_faq_a5: '一般可按结构/面材/光源、设备与软件、内容制作与联调、运输与安装等拆分。影响总价最大的通常是尺寸与数量、设备档位、内容复杂度与工期窗口。',
      prod_faq_q6: '甲方/设计方需要提供哪些接口资料？',
      prod_faq_a6: '建议提供平面/立面/点位图、供电与弱电条件、设备间位置、内容/中控接口要求、现场进场与施工窗口。我们也可先做踏勘与接口清单确认。',
      prod_faq_q7: '质保与售后怎么做？坏了谁来修？',
      prod_faq_a7: '我们默认提供结构与关键设备的质保建议，可按项目选择延保。交付时会提供备件建议、维护口径与巡检清单，出现故障可按 SLA 响应，支持远程排障/现场处理。',
      prod_faq_q8: '工期紧怎么控风险？有哪些“必须提前确认”的点？',
      prod_faq_a8: '优先锁定：开幕/验收节点、现场条件（尺寸/供电/遮光/网络）、关键设备到货周期、联调窗口与不可更改节点。我们会提供倒排计划与风险点清单。',
      prod_faq_docs: '进入资料页'
      ,
      prod_chart_title: '系列画像与成本构成（示例）',
      prod_chart_desc: '用于沟通口径：切换系列后，图表与动画会同步更新。实际以项目条件为准。',
      prod_chart_radar: '交付画像（示例）',
      prod_chart_cost: '成本构成（示例）',
      prod_anim_title: '小动画演示：交付流程循环高亮',
      prod_anim_desc: '用于演示“节点可控”的交付节奏；不同系列对流程侧重点略有不同。'
    },
    en: {
      nav_capabilities: 'Capabilities',
      nav_solutions: 'Solutions',
      nav_services: 'Services',
      nav_products: 'Products',
      nav_cases: 'Cases',
      nav_docs: 'Docs',
      nav_contact: 'Contact',
      nav_cta: 'Get Proposal',
      nav_cta_mobile: 'Contact Now',
      brand_tagline: 'Digital Exhibition · Lightbox Systems · Interactive Devices',
      sol_page_title: 'Industry Solutions',
      sol_page_h1: 'Industry Solutions',
      sol_page_intro: 'Combine lightbox systems, metal structures and interactive devices into repeatable solution packages for fast execution across scenarios.',
      sol_picker_title: 'Choose an Industry',
      sol_picker_museum: 'Museum Interactive',
      sol_picker_city: 'City Showroom Immersive',
      sol_picker_temp: 'Pop-up / Temporary',
      sol_picker_retail: 'Retail / Brand Activation',
      sol_panel_kicker: 'Overview',
      sol_panel_cta: 'Send Requirements',
      sol_pains_title: 'Common Pain Points',
      sol_arch_title: 'Solution Architecture (Repeatable)',
      sol_cap_title: 'Key Capabilities',
      sol_deliver_title: 'Deliverables',
      sol_metrics_title: 'Acceptance & Metrics',
      sol_modules_title: 'Optional Modules',
      sol_scenarios_title: 'Typical Scenarios',
      sol_chart_radar_title: 'Delivery Profile (Sample)',
      sol_chart_cost_title: 'Cost Breakdown (Sample)',
      sol_chart_hint: 'Note: For communication only. Actual values depend on project conditions.',
      sol_quote_title: 'Need a faster quote?',
      sol_quote_desc: 'Share city/site type, area, timeline, budget range and scope (structure/lightbox/interactive/immersive).',
      sol_quote_cta: 'Send Request',
      hero_badge: '2001 - 2025 · Integrated Delivery · Controlled Execution',
      hero_title: 'Digital Exhibition · Lightbox Systems · Interactive Devices · Immersive Experience',
      hero_subtitle: 'We combine lighting structures, metal fabrication and digital interaction to deliver end-to-end execution from detailing, fabrication to on-site installation & commissioning.',
      hero_primary: 'Get Project Advice',
      hero_secondary: 'View Handbook',
      hero_m1: 'Years in structure & material design',
      hero_m2: 'Dedicated PM',
      hero_m3: 'Optional structure warranty',
      hero_m4: 'Transparent delivery',
      lead_kicker: 'Quick Inquiry',
      lead_title: 'Submit in 30 seconds',
      lead_name: 'Contact',
      lead_name_ph: 'Your name',
      lead_phone: 'Phone',
      lead_phone_ph: 'For follow-up',
      lead_need: 'Request Summary',
      lead_need_ph: 'e.g., area / timeline / budget / city / scope',
      lead_submit: 'Submit (Local Demo)',
      lead_note: 'This is a static demo: submission is stored locally and not sent to a server.',
      lead_phone_k: 'Phone',
      lead_more_contact: 'More contacts',
      svc_kicker: 'Services',
      svc_title: 'End-to-end Delivery: Detailing to Commissioning',
      svc_desc: 'Lightbox systems, exhibit structures, interactive integration, immersive scenes, on-site construction and content integration.',
      svc_link: 'Open Services',
      cases_kicker: 'Selected Cases',
      cases_title: 'Delivery Proven by Results',
      cases_desc: 'From national museums to large exhibitions and public spaces. Samples are adapted from existing site case content.',
      cases_link: 'Open Case Library',
      case_filter_all: 'All',
      case_filter_museum: 'Museum / Memorial',
      case_filter_exhibition: 'Major Exhibitions',
      case_filter_brand: 'Brand / Signage',
      adv_kicker: 'Why Us',
      adv_title: 'Turn Uncertainty into Control',
      adv_desc: 'Multi-party coordination and on-site risks are the hardest. We standardize delivery into clear steps and reusable modules for smoother communication and acceptance.',
      adv_i1_t: 'Real materials · Contract-driven',
      adv_i1_d: 'We propose compliant, cost-effective materials with traceable process records.',
      adv_i2_t: 'Controlled delivery · Dedicated interface',
      adv_i2_d: 'Coordinate client, decorators and third parties to reduce information loss and rework.',
      adv_i3_t: 'Acceptance-ready quality',
      adv_i3_d: 'Define acceptance criteria at key milestones for predictable delivery quality.',
      scene_kicker: 'Scenarios',
      scene_title: 'Which collaboration mode fits you?',
      scene_hint: 'Click a card to see suggestions',
      scene_design_t: 'Only an idea; need proposal & budget',
      scene_design_d: 'Start with clarification and concept proposal to form a checklist and range estimate.',
      scene_build_t: 'Have drawings; need detailing + execution',
      scene_build_d: 'Review drawings and detail the build to reduce on-site risks.',
      scene_turnkey_t: 'Need turnkey delivery (build + media)',
      scene_turnkey_d: 'Use milestone management and unified acceptance criteria to reduce rework.',
      scene_event_t: 'Tight schedule; need event/opening execution',
      scene_event_d: 'Lock key milestones first and reverse-plan materials and coordination.',
      scene_cta_contact: 'Send us your project',
      scene_cta_products: 'View products & craftsmanship',
      proc_kicker: 'Delivery Process',
      proc_title: 'A Standard Path from Brief to Acceptance',
      proc_desc: 'Turn complex projects into reusable steps: clear requirements, comparable options and acceptance-ready milestones.',
      proc_s1_t: 'Requirement Brief',
      proc_s1_d: 'Define goals, audience, site conditions, budget range and milestones.',
      proc_s2_t: 'Design & Detailing',
      proc_s2_d: 'Narrative, renders, BOM and shop drawings to reduce execution gaps.',
      proc_s3_t: 'Fabrication & Build',
      proc_s3_d: 'Material acceptance, process records and milestone checks.',
      proc_s4_t: 'Commissioning & Handover',
      proc_s4_d: 'Commission devices, close-out and final acceptance with docs.',
      home_faq_kicker: 'FAQ',
      home_faq_title: 'Client FAQs',
      home_faq_desc: 'Key questions answered upfront: budget, timeline, deliverables, acceptance criteria and collaboration.',
      home_faq_q1: 'How do we get an actionable budget range fast?',
      home_faq_a1: 'Share area, milestones, references and scope (design/build/media). We provide an itemized estimate and risk notes.',
      home_faq_q2: 'How do you ensure the design matches the final build?',
      home_faq_a2: 'Through detailing, material samples, milestone acceptance criteria and traceable process records.',
      home_faq_q3: 'How to keep on-site execution controlled on a tight schedule?',
      home_faq_a3: 'Lock key milestones early, schedule materials/manpower ahead and set non-negotiable dates.',
      home_faq_q4: 'Can you deliver partial scope only?',
      home_faq_a4: 'Yes. From single-scope fabrication to turnkey. We recommend a technical review to define interfaces clearly.',
      contact_kicker: 'Contact',
      contact_title: 'Tell us your needs, we make it buildable',
      contact_desc: 'Reach us via phone/email/WeChat or submit the form. For faster evaluation, include location, area, timeline, budget and scope.',
      contact_row_phone: 'Phone',
      contact_row_email: 'Email',
      contact_row_wechat: 'WeChat Official',
      contact_row_addr: 'Address',
      contact_tip_title: 'Next-step suggestion',
      contact_tip_desc: 'If you can share 4 items (area/timeline/location/budget), we can tailor the homepage copy and complete deliverables on the services page.',
      contact_form_kicker: 'Request Form',
      contact_form_title: 'Quick Submit (Static Demo)',
      contact_form_link: 'Open Contact Page',
      contact_name: 'Contact',
      contact_phone: 'Phone',
      contact_email: 'Email (optional)',
      contact_msg: 'Message',
      contact_submit: 'Send Request',
      footer_brand_desc: 'An integrated execution partner for digital experience, structures and interactive devices. Modularize lightboxes, structures and interaction to let the space speak.',
      footer_quick: 'Quick Links',
      footer_docs: 'Bid Docs & Materials',
      footer_services: 'Service Items',
      footer_s1: 'Exhibition Design / Interior Build',
      footer_s2: 'Digital Media / Event Execution',
      footer_s3: 'Marketing / Corporate Showrooms',
      footer_contact: 'Contact',
      footer_note: 'New site template · Interactive static demo',
      modal_kicker: 'Docs',
      modal_title: 'A｜Company Service Handbook (Preview)',
      modal_to_docs: 'Open Docs',
      modal_close: 'Close',
      trust_kicker: 'Trusted By',
      trust_title: 'Clients & Partners (Placeholder)',
      trust_desc: 'Place logos of museums, exhibition partners and integrators here. Replace with real clients later.',
      trust_link: 'See Case Studies',
      assure_kicker: 'Delivery Assurance',
      assure_title: 'Quality · Safety · Warranty · Response',
      assure_desc: 'Bid-ready materials are in “Docs”: fabrication plan, schedule, QA, safety, warranty and after-sales.',
      assure_cta: 'Open Docs',
      assure_m1k: 'Structure Warranty',
      assure_m2k: 'Interactive HW',
      assure_m3k: 'Content Maintenance',
      assure_m4k: 'Service SLA'
      ,
      suite_kicker: 'Product Suites',
      suite_title: 'LightBox / Interactive / Immersive',
      suite_desc: 'Productized capabilities: combine lightbox systems, interactive devices and immersive modules into deployable experience packages.',
      suite_enter_products: 'Open Products',
      suite_cta_scene: 'Get a Package',
      suite_cta_handbook: 'Preview Handbook',
      suite_view_solutions: 'View Solution Packages',
      suite_view_capabilities: 'View Capabilities',
      suite_view_docs: 'Bid Docs',
      picker_kicker: 'Quick Selector',
      picker_title: 'Pick your project type, we recommend a package',
      picker_desc: 'Based on scenario, we recommend a mix of lightbox + interactive + immersive modules with next-step CTAs.',
      picker_enter_solutions: 'Open Solutions',
      picker_museum_title: 'Museum Interactive',
      picker_museum_desc: 'Stable · Maintainable · Updatable',
      picker_city_title: 'City Showroom Immersive',
      picker_city_desc: 'Entrance impact · Immersive story',
      picker_temp_title: 'Pop-up Digital',
      picker_temp_desc: 'Fast build · Reusable · Controlled',
      picker_retail_title: 'Retail Interaction',
      picker_retail_desc: 'Footfall · Shareable · Conversion',
      picker_result_kicker: 'Recommended Package',
      picker_budget: 'Budget tiers: Entry / Standard / Premium',
      picker_cta_contact: 'Send Requirements',
      picker_cta_products: 'View Products',
      picker_cta_docs: 'View Bid Docs',
      prod_nav_title: 'Products',
      prod_title: 'Products',
      prod_subtitle: 'Productized capabilities into three lines: LightBox, Interactive and Immersive. This page helps selection, comparison and delivery scope for quoting and execution.',
      prod_cta: 'Request Quote & Plan',
      prod_nav_overview: 'Overview',
      prod_nav_selector: 'Series',
      prod_nav_compare: 'Comparison',
      prod_nav_deliver: 'Delivery',
      prod_nav_faq: 'FAQ',
      prod_overview_lightbox: 'Ultra-slim / curved / modular frames / LightWall. Best for long-term venues and frequent graphic updates.',
      prod_overview_interactive: 'AI guide, flipbook, quiz wall, gesture and multi-touch. Built for stable operation and integration.',
      prod_overview_immersive: 'MiniBox / corridor / edge screen. Designed for high-impact entrance and immersive story zones.',
      prod_panel_kicker: 'Selected',
      prod_panel_usecases: 'Use Cases',
      prod_panel_adv: 'Key Advantages',
      prod_panel_cta: 'Get Itemized Quote',
      prod_panel_docs: 'Open Docs',
      prod_panel_modules: 'Modules / Models',
      prod_panel_deliver: 'Default Deliverables',
      prod_compare_kicker: 'Selection & Specs',
      prod_compare_title: 'Line Comparison (Template)',
      prod_compare_desc: 'A communication-ready template for bids: fill in dimensions/materials/power/device models per project.',
      prod_compare_col1: 'Dimension',
      prod_deliver_kicker: 'Delivery Scope',
      prod_deliver_title: 'End-to-end Delivery from Detailing to Commissioning',
      prod_deliver_desc: 'Default scope includes detailing, fabrication, integration, on-site installation, commissioning and acceptance docs. Partial outsourcing is supported.',
      prod_deliver_m1: 'Detailing',
      prod_deliver_m2: 'Fabrication',
      prod_deliver_m3: 'Commissioning',
      prod_deliver_m4: 'Warranty',
      prod_faq_kicker: 'FAQ',
      prod_faq_title: 'Product Q&A',
      prod_faq_q1: 'How to get a quick quote range?',
      prod_faq_a1: 'Share scenario type, area, timeline, budget range and scope (lightbox/structure/interactive/immersive). We provide an itemized estimate and risk notes.',
      prod_faq_q2: 'How to ensure long-term stability and maintenance?',
      prod_faq_a2: 'We use maintainable modular design, reliable device selection and commissioning tests, with handover docs and maintenance suggestions.',
      prod_faq_q3: 'Can you deliver structure-only or interactive-only?',
      prod_faq_a3: 'Yes. Single-scope delivery or turnkey integration both work. We recommend interface definition and technical review first to reduce rework.',
      prod_faq_q4: 'Where are the bid documents?',
      prod_faq_a4: 'Docs include fabrication plan, schedule, QA, safety, warranty and after-sales chapters. You can preview online and export to PDF.',
      prod_faq_q5: 'How do you break down the budget? What drives cost most?',
      prod_faq_a5: 'Typical breakdown: structure/materials/lighting, devices & software, content production & commissioning, transport & installation. Biggest drivers are size/quantity, device tier, content complexity and time window.',
      prod_faq_q6: 'What inputs should the client/designer provide?',
      prod_faq_a6: 'Floor/elevation/points drawings, power & low-voltage conditions, rack room location, content/control interface requirements, and site access windows. We can start with a survey and an interface checklist.',
      prod_faq_q7: 'How do warranty and maintenance work?',
      prod_faq_a7: 'We provide warranty recommendations for structure and key devices, with optional extended coverage. Handover includes spare parts suggestions, maintenance checklist and SLA-based response with remote/onsite support.',
      prod_faq_q8: 'How to control risks on a tight schedule?',
      prod_faq_a8: 'Lock opening/acceptance milestones, confirm site conditions (dimensions/power/blackout/network), check lead times for key devices, reserve commissioning windows and set non-negotiable dates. We provide a reverse schedule and risk list.',
      prod_faq_docs: 'Open Docs'
      ,
      prod_cases_kicker: 'Related Cases',
      prod_cases_title: 'Recommended References by Series',
      prod_cases_desc: 'Based on your selected line, we recommend relevant case directions (sample links can be replaced with real projects).',
      prod_cases_cta: 'Open Case Library'
      ,
      prod_chart_title: 'Series Profile & Cost (Sample)',
      prod_chart_desc: 'Communication template: charts and animation update with series switching. Actual values depend on the project.',
      prod_chart_radar: 'Delivery Profile (Sample)',
      prod_chart_cost: 'Cost Breakdown (Sample)',
      prod_anim_title: 'Micro Demo: Delivery Flow Highlight',
      prod_anim_desc: 'A lightweight loop to illustrate controlled milestones; focus differs by series.'
    }
  };

  const apply = (lang) => {
    const d = dict[lang] || dict.zh;
    localStorage.setItem('ae800_lang', lang);

    toggles.forEach((b) => {
      const active = b.dataset.lang === lang;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });

    $$('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;
      if (d[key] == null) return;
      el.textContent = d[key];
    });

    $$('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (!key) return;
      if (d[key] == null) return;
      el.setAttribute('placeholder', d[key]);
    });

    window.dispatchEvent(new Event('ae800:lang'));

    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  };

  const initLang = localStorage.getItem('ae800_lang') || 'zh';
  apply(initLang);

  toggles.forEach((b) => {
    b.addEventListener('click', () => apply(b.dataset.lang || 'zh'));
  });
}

function initHeaderScroll() {
  const headerBar = $('#headerBar');
  if (!headerBar) return;

  const onScroll = () => {
    const scrolled = window.scrollY > 8;
    headerBar.classList.toggle('shadow-sm', scrolled);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  const onScroll = () => {
    btn.classList.toggle('is-visible', window.scrollY > 500);
  };

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initScrollSpy() {
  const links = $$('.nav-link');
  const sectionIds = links
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && h.startsWith('#'))
    .map((h) => h.slice(1));

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const map = new Map();
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) map.set(href.slice(1), a);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((a) => a.classList.remove('is-active'));
        const active = map.get(id);
        if (active) active.classList.add('is-active');
      });
    },
    { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0.01 }
  );

  sections.forEach((s) => observer.observe(s));
}

function initSubnavSpy() {
  const links = $$('.subnav-link');
  const sectionIds = links
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && h.startsWith('#'))
    .map((h) => h.slice(1));

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const map = new Map();
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) map.set(href.slice(1), a);
  });

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((a) => a.classList.remove('is-active'));
        const active = map.get(id);
        if (active) active.classList.add('is-active');
      });
    },
    { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0.01 }
  );

  sections.forEach((s) => observer.observe(s));
}

async function initHomeCases() {
  const grid = $('#caseGrid');
  if (!grid) return;

  try {
    const res = await fetch('./cases/data/cases.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const cases = Array.isArray(data) ? data : Array.isArray(data?.cases) ? data.cases : [];
    if (!cases.length) {
      grid.innerHTML = `
        <div class="md:col-span-2 lg:col-span-3">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700" style="border-radius:var(--radius)">
            案例数据为空：未读取到 cases/data/cases.json 中的 cases 列表。
          </div>
        </div>
      `;
      return;
    }

    const getFirstImage = (c) => {
      const img = Array.isArray(c.images) && c.images.length ? String(c.images[0] || '') : '';
      if (!img) return '';
      const rel = img.replace(/^\.\//, '');
      return `./cases/${rel}`;
    };

    const hasAny = (arr, keywords) => {
      const list = Array.isArray(arr) ? arr : [];
      return keywords.some((k) => list.some((t) => String(t || '').includes(k)));
    };

    const computeTags = (c) => {
      const tags = Array.isArray(c.tags) ? c.tags : [];
      const original = String(c.original_category || '');
      const extra = [];

      const isMuseum = String(c.category || '') === 'museum'
        || original.includes('博物馆')
        || original.includes('纪念馆')
        || hasAny(tags, ['博物馆', '纪念馆']);

      const isNationalMuseum = original.includes('国家博物馆')
        || hasAny(tags, ['国家博物馆', '中国国家博物馆', '国博']);

      const isRedParty = original.includes('红色')
        || original.includes('党建')
        || hasAny(tags, ['红色党建', '红色', '党建', '党史', '革命']);

      const isAchievement = String(c.category || '') === 'achievement'
        || original.includes('成就展')
        || hasAny(tags, ['成就展', '大型成就展', '展览', '改革开放', '伟大变革', '砥砺奋进']);

      const isCityShowroom = String(c.category || '') === 'city'
        || original.includes('城市展厅')
        || original.includes('城市展馆')
        || hasAny(tags, ['城市展厅', '城市展馆', '城市展厅/展馆']);

      const isRetail = String(c.category || '') === 'retail'
        || original.includes('商业')
        || hasAny(tags, ['商业展示', '商业', '零售', '门店', '品牌店']);

      if (isMuseum) extra.push('museum');
      if (isNationalMuseum) extra.push('national_museum');
      if (isRedParty) extra.push('red_party');
      if (isAchievement) extra.push('achievement');
      if (isCityShowroom) extra.push('city_showroom');
      if (isRetail) extra.push('retail');

      if (!extra.length) extra.push('all');
      return extra.join(' ');
    };

    const pickedAll = cases.filter((c) => /^case-\d+$/.test(String(c.id || '')));
    const picked = pickedAll.slice(0, 10);

    if (!pickedAll.length) {
      grid.innerHTML = `
        <div class="md:col-span-2 lg:col-span-3">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700" style="border-radius:var(--radius)">
            案例数据已加载，但没有找到形如 case-123 的 id。
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    picked.forEach((c) => {
      const a = document.createElement('a');
      a.className = 'case-card';
      a.href = `./cases/${c.id}.html`;
      a.dataset.tags = computeTags(c);
      a.style.flex = '0 0 auto';
      a.style.width = '320px';
      a.style.scrollSnapAlign = 'start';

      const coverImg = getFirstImage(c);
      const coverStyle = coverImg ? `background-image:url('${coverImg.replace(/'/g, '%27')}')` : '';
      const title = String(c.title || c.id || '');
      const desc = String(c.description || '').replace(/\s+/g, ' ').trim();
      const shortDesc = desc.length > 66 ? `${desc.slice(0, 66)}…` : (desc || '');

      a.innerHTML = `
        <div class="case-cover" style="${coverStyle}"></div>
        <div class="p-5">
          <div class="text-xs text-slate-500">${String(c.original_category || c.category || '案例')}</div>
          <div class="mt-1 font-semibold">${title}</div>
          <div class="mt-2 text-sm text-slate-600">${shortDesc}</div>
          <div class="mt-4 text-brand-700 font-medium">查看案例详情</div>
        </div>
      `;

      grid.appendChild(a);
    });
  } catch (e) {
    console.error('[home cases] failed to load ./cases/data/cases.json', e);
    grid.innerHTML = `
      <div class="md:col-span-2 lg:col-span-3">
        <div class="rounded-3xl border border-amber-200 bg-amber-50 p-6" style="border-radius:var(--radius)">
          <div class="font-semibold text-amber-900">精选案例加载失败</div>
          <div class="mt-2 text-sm text-amber-900/80">请确认你是通过 http://localhost 访问（不要用 file:// 直接打开），并且 cases/data/cases.json 存在。</div>
          <div class="mt-2 text-xs text-amber-900/80">错误：${String(e?.message || e)}</div>
        </div>
      </div>
    `;
  }
}

function initCaseFilter() {
  const grid = $('#caseGrid');
  if (!grid) return;

  const chips = $$('.filter-chip');

  const apply = (filter) => {
    const cards = $$('.case-card', grid);
    chips.forEach((c) => c.classList.toggle('is-active', c.dataset.filter === filter));
    cards.forEach((card) => {
      const tags = String(card.dataset.tags || '');
      const showCard = filter === 'all' || tags.split(/\s+/).includes(filter);
      card.style.display = showCard ? '' : 'none';
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => apply(chip.dataset.filter || 'all'));
  });

  const initial = chips.find((c) => c.classList.contains('is-active'))?.dataset?.filter || chips[0]?.dataset?.filter || 'all';
  apply(initial);
}

function initLightbox() {
  const selector = '[data-lightbox]';

  let overlay = document.getElementById('ae800Lightbox');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ae800Lightbox';
    overlay.className = 'hidden';
    overlay.innerHTML = `
      <div data-lb-backdrop style="position:fixed;inset:0;background:rgba(2,6,23,.72);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px;">
        <div style="position:relative;max-width:min(1100px, 96vw);max-height:92vh;width:100%;">
          <button type="button" data-lb-close aria-label="关闭" style="position:absolute;right:-4px;top:-44px;height:36px;width:36px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(15,23,42,.65);color:#fff;display:grid;place-items:center;cursor:pointer;">✕</button>
          <button type="button" data-lb-prev aria-label="上一张" style="position:absolute;left:-6px;top:50%;transform:translate(-100%,-50%);height:42px;width:42px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(15,23,42,.65);color:#fff;display:none;place-items:center;cursor:pointer;">‹</button>
          <button type="button" data-lb-next aria-label="下一张" style="position:absolute;right:-6px;top:50%;transform:translate(100%,-50%);height:42px;width:42px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(15,23,42,.65);color:#fff;display:none;place-items:center;cursor:pointer;">›</button>
          <img data-lb-img alt="" style="display:block;max-width:100%;max-height:92vh;margin:0 auto;border-radius:16px;box-shadow:0 18px 40px rgba(2,6,23,.35);background:#0b1220;" />
          <div data-lb-caption style="margin-top:10px;color:rgba(255,255,255,.86);font-size:12px;text-align:center;line-height:1.4;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const img = overlay.querySelector('[data-lb-img]');
  const caption = overlay.querySelector('[data-lb-caption]');
  const btnClose = overlay.querySelector('[data-lb-close]');
  const btnPrev = overlay.querySelector('[data-lb-prev]');
  const btnNext = overlay.querySelector('[data-lb-next]');
  const backdrop = overlay.querySelector('[data-lb-backdrop]');

  let group = [];
  let index = 0;

  const showNav = () => {
    const hasNav = group.length > 1;
    if (btnPrev) btnPrev.style.display = hasNav ? 'grid' : 'none';
    if (btnNext) btnNext.style.display = hasNav ? 'grid' : 'none';
  };

  const openAt = (i) => {
    if (!img) return;
    if (!group.length) return;
    index = Math.max(0, Math.min(group.length - 1, i));
    const el = group[index];
    const src = el.dataset.lbSrc || el.getAttribute('href') || el.getAttribute('src') || '';
    const alt = el.dataset.lbAlt || el.getAttribute('alt') || el.getAttribute('aria-label') || '';
    img.src = src;
    img.alt = alt;
    if (caption) caption.textContent = alt || '';
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    showNav();
  };

  const close = () => {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    if (img) img.src = '';
    group = [];
    index = 0;
  };

  const onPrev = () => {
    if (group.length < 2) return;
    openAt((index - 1 + group.length) % group.length);
  };

  const onNext = () => {
    if (group.length < 2) return;
    openAt((index + 1) % group.length);
  };

  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', onPrev);
  if (btnNext) btnNext.addEventListener('click', onNext);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowLeft') {
      onPrev();
      return;
    }
    if (e.key === 'ArrowRight') {
      onNext();
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const el = target.closest(selector);
    if (!el) return;

    const src = el.dataset.lbSrc || el.getAttribute('href') || '';
    if (!src) return;

    e.preventDefault();
    e.stopPropagation();

    const groupKey = el.dataset.lbGroup || '';
    if (groupKey) {
      group = $$(`${selector}[data-lb-group="${CSS.escape(groupKey)}"]`);
    } else {
      group = [el];
    }
    index = Math.max(0, group.indexOf(el));
    openAt(index);
  });
}

function initFAQ() {
  const list = $('#faqList');
  if (!list) return;

  $$('.faq-item', list).forEach((item) => {
    const q = $('.faq-q', item);
    const a = $('.faq-a', item);
    if (!q || !a) return;

    q.addEventListener('click', () => {
      const expanded = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!expanded));
      a.hidden = expanded;
    });
  });
}

function initScenarios() {
  const result = $('#scenarioResult');
  const cards = $$('.scenario');
  if (!cards.length || !result) return;

  const copy = {
    zh: {
      design: '建议：先做“需求澄清 + 概念方案 + 预算估算”。你提供面积/地点/工期/预算区间后，我们输出可执行清单与风险点。',
      build: '建议：进行“图纸审查 + 施工深化 + 材料样板确认”。重点排除现场接口与隐蔽工程风险。',
      turnkey: '建议：采用“里程碑节点管理”。设计/施工/多媒体统一口径，按节点验收，减少返工。',
      event: '建议：优先锁定开幕/交付节点，倒排物料清单与现场统筹机制，确保节奏可控。'
    },
    en: {
      design: 'Suggestion: start with requirement clarification + concept proposal + budget range. Share area/location/timeline/budget so we can provide a workable checklist and risk notes.',
      build: 'Suggestion: do drawing review + detailing + material sample confirmation. Focus on interfaces and hidden works to reduce on-site risks.',
      turnkey: 'Suggestion: use milestone-based project management. Align design/build/media with clear acceptance gates to reduce rework.',
      event: 'Suggestion: lock opening/delivery milestones first, then reverse-plan materials and on-site coordination to keep schedule controlled.'
    }
  };

  const getLang = () => localStorage.getItem('ae800_lang') || 'zh';

  const setResult = (key) => {
    const lang = getLang() === 'en' ? 'en' : 'zh';
    const text = copy[lang]?.[key] || copy.zh.design;
    result.classList.remove('hidden');
    result.textContent = text;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  cards.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.scenario;
      setResult(key);
    });
  });

  window.addEventListener('ae800:lang', () => {
    if (result.classList.contains('hidden')) return;
    const active = cards.find((c) => c.matches(':focus'));
    const key = active?.dataset?.scenario || 'design';
    setResult(key);
  });
}

function handleForm(form, { nameKey, phoneKey, msgKey, successEl, errorEl }) {
  if (!form) return;

  const getLang = () => localStorage.getItem('ae800_lang') || 'zh';

  const msg = {
    zh: {
      name: '请输入联系人姓名。',
      phone: '请输入正确的手机号（11位，以1开头）。',
      need: '请把需求描述写得更具体一些（至少6个字）。',
      success: (name) => `已提交（本地保存）：${name}，我们会尽快联系你。你也可以直接拨打 010-66169644。`
    },
    en: {
      name: 'Please enter a contact name.',
      phone: 'Please enter a valid CN mobile number (11 digits, starts with 1).',
      need: 'Please describe your request in more detail (at least 6 characters).',
      success: (name) => `Submitted (saved locally): ${name}. We will contact you soon. You can also call +86 010-66169644.`
    }
  };

  const t = () => (getLang() === 'en' ? msg.en : msg.zh);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (successEl) successEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');

    const data = new FormData(form);
    const name = String(data.get(nameKey) || '').trim();
    const phone = String(data.get(phoneKey) || '').trim();
    const msg = String(data.get(msgKey) || '').trim();

    if (!name) {
      if (errorEl) {
        setText(errorEl, t().name);
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (!isValidCNMobile(phone)) {
      if (errorEl) {
        setText(errorEl, t().phone);
        errorEl.classList.remove('hidden');
      }
      return;
    }

    if (!msg || msg.length < 6) {
      if (errorEl) {
        setText(errorEl, t().need);
        errorEl.classList.remove('hidden');
      }
      return;
    }

    const payload = {
      at: new Date().toISOString(),
      name,
      phone,
      msg
    };

    const key = 'ae800_leads';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.unshift(payload);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));

    form.reset();

    if (successEl) {
      setText(successEl, t().success(name));
      successEl.classList.remove('hidden');
    }
  });
}

function initForms() {
  handleForm($('#leadForm'), {
    nameKey: 'name',
    phoneKey: 'phone',
    msgKey: 'need',
    successEl: $('#formSuccess'),
    errorEl: $('#formError')
  });

  handleForm($('#contactForm'), {
    nameKey: 'cname',
    phoneKey: 'cphone',
    msgKey: 'cmsg',
    successEl: $('#contactSuccess'),
    errorEl: $('#contactError')
  });
}

initMobileMenu();
initHeaderScroll();
initBackToTop();
initScrollSpy();
initSubnavSpy();
initHomeCases().then(() => initCaseFilter());
initFAQ();
initScenarios();
initForms();
initSuiteTabs();
initHandbookModal();
initCountUp();
initSolutionSelector();
initI18n();
initProductLanding();
initLightbox();
