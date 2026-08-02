'use strict';

/* ================= 工具 ================= */
const $ = (sel) => document.querySelector(sel);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

const state = {
  data: null,
  query: localStorage.getItem('wcity') || 'Shanghai',
  unit: localStorage.getItem('wunit') || 'C',
  fxKind: 'none',
  aqi: null,
  pm25: null,
  pm10: null,
  o3: null,
  aqiSrc: null,      // 'qweather' | 'waqi' | 'estimate' | null
  aqiStation: '',
  aqiTime: '',
  qKey: localStorage.getItem('wqkey') || '',
};

/* ================= 天气代码 -> 中文 / 图标 / 分组 ================= */
const WEATHER = {
  113: { icon: 'sun',      label: '晴',          group: 'sunny' },
  116: { icon: 'partly',   label: '局部多云',     group: 'partly' },
  119: { icon: 'cloud',    label: '多云',         group: 'cloudy' },
  122: { icon: 'overcast', label: '阴',           group: 'overcast' },
  143: { icon: 'mist',     label: '薄雾',         group: 'mist' },
  149: { icon: 'haze',     label: '烟霾',         group: 'haze' },
  150: { icon: 'haze',     label: '烟雾',         group: 'haze' },
  176: { icon: 'rain-light', label: '零星阵雨',   group: 'rain' },
  179: { icon: 'snow-light', label: '零星阵雪',   group: 'snow' },
  182: { icon: 'sleet',    label: '零星雨夹雪',   group: 'sleet' },
  185: { icon: 'sleet',    label: '冻毛毛雨',     group: 'sleet' },
  200: { icon: 'thunder',  label: '雷阵雨',       group: 'thunder' },
  227: { icon: 'snow',     label: '吹雪',         group: 'snow' },
  230: { icon: 'snow',     label: '暴风雪',       group: 'snow' },
  248: { icon: 'fog',      label: '雾',           group: 'fog' },
  260: { icon: 'fog',      label: '冻雾',         group: 'fog' },
  263: { icon: 'rain-light', label: '毛毛雨',     group: 'rain' },
  266: { icon: 'rain-light', label: '小雨',       group: 'rain' },
  281: { icon: 'sleet',    label: '冻雨',         group: 'sleet' },
  284: { icon: 'sleet',    label: '冻雨',         group: 'sleet' },
  293: { icon: 'rain',     label: '小雨',         group: 'rain' },
  296: { icon: 'rain',     label: '小雨',         group: 'rain' },
  299: { icon: 'rain',     label: '中雨',         group: 'rain' },
  302: { icon: 'rain',     label: '中雨',         group: 'rain' },
  305: { icon: 'rain-heavy', label: '大雨',       group: 'rain' },
  308: { icon: 'rain-heavy', label: '暴雨',       group: 'rain' },
  311: { icon: 'sleet',    label: '冻雨',         group: 'sleet' },
  314: { icon: 'sleet',    label: '冻雨',         group: 'sleet' },
  317: { icon: 'sleet',    label: '雨夹雪',       group: 'sleet' },
  320: { icon: 'sleet',    label: '雨夹雪',       group: 'sleet' },
  323: { icon: 'snow-light', label: '小雪',       group: 'snow' },
  326: { icon: 'snow-light', label: '小雪',       group: 'snow' },
  329: { icon: 'snow',     label: '中雪',         group: 'snow' },
  332: { icon: 'snow',     label: '中雪',         group: 'snow' },
  335: { icon: 'snow-heavy', label: '大雪',       group: 'snow' },
  338: { icon: 'snow-heavy', label: '大雪',       group: 'snow' },
  350: { icon: 'sleet',    label: '冰粒',         group: 'sleet' },
  353: { icon: 'rain-light', label: '阵雨',       group: 'rain' },
  356: { icon: 'rain',     label: '阵雨',         group: 'rain' },
  359: { icon: 'rain-heavy', label: '强阵雨',     group: 'rain' },
  362: { icon: 'sleet',    label: '阵雨夹雪',     group: 'sleet' },
  365: { icon: 'sleet',    label: '阵雨夹雪',     group: 'sleet' },
  368: { icon: 'snow-light', label: '阵雪',       group: 'snow' },
  371: { icon: 'snow',     label: '阵雪',         group: 'snow' },
  374: { icon: 'sleet',    label: '冰粒阵',       group: 'sleet' },
  377: { icon: 'sleet',    label: '冰粒阵',       group: 'sleet' },
  386: { icon: 'thunder',  label: '雷阵雨',       group: 'thunder' },
  389: { icon: 'thunder',  label: '雷暴',         group: 'thunder' },
  392: { icon: 'thunder-snow', label: '雷阵雪',   group: 'thunder' },
  395: { icon: 'snow',     label: '暴雪',         group: 'snow' },
};

const groupOf = (code) => WEATHER[code]?.group || 'cloudy';
const labelOf = (code, fallback) => WEATHER[code]?.label || fallback || '未知';

/* ================= 月相 ================= */
const MOON_CN = {
  'New Moon': '新月',
  'Waxing Crescent': '娥眉月',
  'First Quarter': '上弦月',
  'Waxing Gibbous': '盈凸月',
  'Full Moon': '满月',
  'Waning Gibbous': '亏凸月',
  'Last Quarter': '下弦月',
  'Waning Crescent': '残月',
};

function moonPhaseSVG(illumination, waxing, size = 96) {
  const u = `mg${++svgUid}`;
  const k = Math.max(0, Math.min(1, (illumination ?? 50) / 100));
  const cx = 50;
  const cy = 50;
  const r = 40;

  let inner;
  if (k < 0.03) {
    inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,.14)"/>`;
  } else if (k > 0.97) {
    inner = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${u}g)"/>`;
  } else {
    const b = r * Math.abs(1 - 2 * k);
    let d;
    if (waxing) {
      // 右侧受光
      d = k <= 0.5
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${b} ${r} 0 0 1 ${cx} ${cy - r} Z`
        : `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${b} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else {
      // 左侧受光
      d = k <= 0.5
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${b} ${r} 0 0 0 ${cx} ${cy - r} Z`
        : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${b} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    }
    inner = `<path d="${d}" fill="url(#${u}g)"/>`;
  }

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="${u}g" cx="42%" cy="38%" r="72%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#d3dcfb"/>
      </radialGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0b1026" opacity=".5"/>
    ${inner}
  </svg>`;
}

function isWaxing(phaseName) {
  if (/waxing|first quarter|^new/i.test(phaseName || '')) return true;
  if (/waning|last quarter|^full/i.test(phaseName || '')) return false;
  return true;
}

/* ================= 温度显示 ================= */
function tempNum(v) {
  const c = num(v);
  if (c === null) return null;
  return state.unit === 'C' ? c : c * 9 / 5 + 32;
}
function tempStr(v) {
  const t = tempNum(v);
  return t === null ? '--' : `${Math.round(t)}°`;
}

/* ================= 空气质量 ================= */
const AQI_LEVELS = [
  [50, '优', '#7ce08a'],
  [100, '良', '#ffd76e'],
  [150, '轻度污染', '#ff9d5c'],
  [200, '中度污染', '#ff6b6b'],
  [300, '重度污染', '#c86bff'],
  [Infinity, '严重', '#9b4dca'],
];

function aqiInfo(aqi) {
  if (aqi === null || aqi === undefined) return null;
  for (const [limit, label, color] of AQI_LEVELS) {
    if (aqi <= limit) return { label, color };
  }
  return null;
}

/* ================= 天气图标（内联 SVG） ================= */
let svgUid = 0;

function iconDefs(u) {
  return `<defs>
    <radialGradient id="${u}s" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#fff9d8"/><stop offset="100%" stop-color="#ffc93c"/>
    </radialGradient>
    <linearGradient id="${u}m" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5f7ff"/><stop offset="100%" stop-color="#cdd7ff"/>
    </linearGradient>
    <linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#cfe3f6"/>
    </linearGradient>
    <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/><stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>`;
}

function rays(cx, cy, r1, r2, color = '#ffd76e', w = 3) {
  let out = '';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    out += `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}"
      x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}"/>`;
  }
  return `<g stroke="${color}" stroke-width="${w}" stroke-linecap="round">${out}</g>`;
}

function cloudShape(u) {
  return `<g fill="url(#${u}c)">
    <circle cx="24" cy="41" r="12"/>
    <circle cx="38" cy="33" r="16"/>
    <circle cx="54" cy="42" r="11"/>
    <rect x="10" y="39" width="46" height="17" rx="8.5"/>
  </g>`;
}

function drops(n, x0 = 20, step = 8) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    out += `<line x1="${x}" y1="55" x2="${x - 2}" y2="62" stroke="#6db3ff" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return `<g opacity=".92">${out}</g>`;
}

function snowDots(n, x0 = 20, step = 8) {
  let out = '';
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${x0 + i * step}" cy="57" r="1.7" fill="#fff" opacity=".9"/>`;
  }
  return out;
}

const ICONS = {
  sun: (u) => `<g>
    <circle cx="32" cy="32" r="12" fill="url(#${u}s)"/>
    ${rays(32, 32, 17, 23)}
  </g>`,
  moon: (u) => `<path d="M38 4 A26 26 0 1 0 38 60 A20 20 0 1 1 38 4 Z" fill="url(#${u}m)"/>`,
  partly: (u) => `<g>
    <circle cx="22" cy="22" r="9" fill="url(#${u}s)"/>
    ${rays(22, 22, 13, 17, '#ffd76e', 2.6)}
    <g transform="translate(6,10) scale(.92)">${cloudShape(u)}</g>
  </g>`,
  cloud: (u) => cloudShape(u),
  overcast: (u) => `<g>
    <g transform="translate(-6,6) scale(.82)">${cloudShape(u)}</g>
    <g transform="translate(10,14) scale(.9)">${cloudShape(u)}</g>
  </g>`,
  'rain-light': (u) => `<g>${cloudShape(u)}${drops(3)}</g>`,
  rain: (u) => `<g>${cloudShape(u)}${drops(4)}</g>`,
  'rain-heavy': (u) => `<g>${cloudShape(u)}${drops(6, 16, 6)}</g>`,
  'snow-light': (u) => `<g>${cloudShape(u)}<g fill="#fff">${snowDots(3)}</g></g>`,
  snow: (u) => `<g>${cloudShape(u)}<g fill="#fff">${snowDots(5)}</g></g>`,
  'snow-heavy': (u) => `<g>${cloudShape(u)}<g fill="#fff">${snowDots(7, 14, 6)}</g></g>`,
  sleet: (u) => `<g>${cloudShape(u)}${drops(2, 22, 8)}<g fill="#fff">${snowDots(2, 38, 8)}</g></g>`,
  thunder: (u) => `<g>${cloudShape(u)}
    <path d="M36 44 L26 55 h7 l-3 9 14-16 h-8 l4-4z" fill="#ffd166"/>
  </g>`,
  'thunder-snow': (u) => `<g>${cloudShape(u)}
    <path d="M36 44 L26 55 h7 l-3 9 14-16 h-8 l4-4z" fill="#ffd166"/>
    <g fill="#fff">${snowDots(3, 20, 9)}</g>
  </g>`,
  fog: (u) => `<g>${cloudShape(u)}
    <g stroke="rgba(255,255,255,.8)" stroke-width="3" stroke-linecap="round">
      <path d="M18 49h28"/><path d="M14 54h36"/><path d="M20 59h24"/>
    </g>
  </g>`,
  mist: (u) => `<g stroke="rgba(255,255,255,.85)" stroke-width="3.4" stroke-linecap="round">
    <path d="M14 22h36"/><path d="M10 32h44"/><path d="M16 42h32"/><path d="M12 52h40"/>
  </g>`,
  haze: (u) => `<g>
    <circle cx="20" cy="18" r="8" fill="url(#${u}s)"/>
    ${rays(20, 18, 12, 16, '#ffd76e', 2.4)}
    <g stroke="rgba(255,255,255,.85)" stroke-width="3.4" stroke-linecap="round">
      <path d="M8 40h48"/><path d="M12 49h40"/><path d="M16 58h32"/>
    </g>
  </g>`,
  wind: (u) => `<g fill="none" stroke="url(#${u}w)" stroke-width="3.4" stroke-linecap="round">
    <path d="M10 22c6 0 8-4 14-4 4 0 6 3 4 6"/>
    <path d="M10 32c6 0 8-4 14-4 4 0 6 3 4 6"/>
    <path d="M10 42c6 0 8-4 14-4 4 0 6 3 4 6"/>
  </g>`,
};

function svgIcon(type, size = 64) {
  const u = `g${++svgUid}`;
  const body = (ICONS[type] || ICONS.cloud)(u);
  return `<svg class="wi" viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img">${iconDefs(u)}${body}</svg>`;
}

/* ================= 小图标（详情/胶囊） ================= */
const TINY = {
  droplet: '<path d="M12 3C12 3 4 11.2 4 16a8 8 0 0 0 16 0c0-4.8-8-13-8-13z" fill="currentColor"/>',
  wind: '<path d="M3 8h9a3 3 0 1 0-3-3M3 13h13a3 3 0 1 1-3 3M3 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
  compass: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z" fill="currentColor"/>',
  gauge: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 12l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>',
  uv: '<circle cx="12" cy="12" r="4" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></g>',
  cloud: '<path d="M18 19a5 5 0 0 0-4.6 3A4 4 0 0 0 14 30h9a4 4 0 0 0 0-8 5 5 0 0 0-5-3z" fill="currentColor"/>',
  umbrella: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z" fill="currentColor"/><path d="M12 12v5a3 3 0 0 0 6 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  thermometer: '<path d="M10 13.5V5a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="16" r="1.8" fill="currentColor"/>',
  moon: '<path d="M19.5 4a9 9 0 1 0 6 15.5A7.5 7.5 0 0 1 19.5 4z" fill="currentColor"/>',
  shirt: '<path d="M12 6l-2.5-1.5L6 3 2 7l3 3.5L7 9v12h10V9l2 1.5L22 7l-4-4-3.5 1.5L12 6z" fill="currentColor"/>',
};
function tinyIcon(name) {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${TINY[name] || TINY.cloud}</svg>`;
}

/* ================= 画布特效（雨 / 雪 / 星空） ================= */
const fx = { kind: 'none', parts: [], stars: [], raf: 0 };

function setupCanvas() {
  const canvas = $('#fx');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight * 0.75,
      r: Math.random() * 1.4 + 0.4,
      p: Math.random() * Math.PI * 2,
      s: Math.random() * 0.02 + 0.008,
    }));
  }
  resize();
  addEventListener('resize', resize);

  function spawn() {
    const max = fx.kind === 'rain' ? 150 : fx.kind === 'snow' ? 110 : 0;
    if (fx.parts.length >= max) return;
    const n = Math.min(4, max - fx.parts.length);
    for (let i = 0; i < n; i++) {
      if (fx.kind === 'rain') {
        fx.parts.push({
          x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.3,
          l: 12 + Math.random() * 14, v: 11 + Math.random() * 7, o: 0.25 + Math.random() * 0.4,
        });
      } else if (fx.kind === 'snow') {
        fx.parts.push({
          x: Math.random() * innerWidth, y: -10 - Math.random() * innerHeight * 0.2,
          r: 1.5 + Math.random() * 2.2, v: 0.6 + Math.random() * 1.1,
          w: 0.6 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2, o: 0.5 + Math.random() * 0.5,
        });
      }
    }
  }

  function step() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const t = performance.now() / 1000;

    if (fx.kind === 'stars') {
      for (const st of fx.stars) {
        const a = 0.3 + 0.45 * Math.abs(Math.sin(st.p + t * st.s));
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fill();
      }
    }

    if (fx.kind === 'rain') {
      ctx.lineWidth = 1.6;
      for (const p of fx.parts) {
        p.y += p.v;
        p.x -= p.v * 0.26;
        if (p.y > innerHeight + 20 || p.x < -20) {
          p.y = -20 - Math.random() * 80;
          p.x = Math.random() * innerWidth + 20;
        }
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3.5, p.y - p.l);
        ctx.strokeStyle = `rgba(160,205,255,${p.o.toFixed(3)})`;
        ctx.stroke();
      }
    } else if (fx.kind === 'snow') {
      for (const p of fx.parts) {
        p.ph += 0.02;
        p.y += p.v;
        p.x += Math.sin(p.ph) * 0.8;
        if (p.y > innerHeight + 10) { p.y = -10; p.x = Math.random() * innerWidth; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.o.toFixed(3)})`;
        ctx.fill();
      }
    }

    spawn();
    fx.raf = requestAnimationFrame(step);
  }
  fx.raf = requestAnimationFrame(step);
}

function setFX(kind) {
  if (fx.kind === kind) return;
  fx.kind = kind;
  fx.parts = [];
}

/* ================= 闪电 ================= */
let flashTimer = null;
function scheduleFlash() {
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    document.body.classList.add('flash');
    setTimeout(() => document.body.classList.remove('flash'), 700);
    scheduleFlash();
  }, 3000 + Math.random() * 6000);
}
function stopFlash() {
  clearTimeout(flashTimer);
  document.body.classList.remove('flash');
}

/* ================= 数据获取 ================= */
async function fetchWeather(query) {
  const url = `https://wttr.in/${encodeURIComponent(query)}?format=j1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.status === 429) throw new Error('请求过于频繁（wttr.in 限流），请稍后再试');
  if (!res.ok) throw new Error(`天气服务返回错误（HTTP ${res.status}）`);
  const json = await res.json();
  if (!json || !json.current_condition || !json.weather || !json.weather.length) {
    throw new Error('未找到该地点的天气数据');
  }
  return json;
}

async function load(query) {
  showLoading();
  try {
    const data = await fetchWeather(query);
    state.data = data;
    state.query = query;
    localStorage.setItem('wcity', query);
    render(data);
    loadAQI(data);
  } catch (err) {
    showError(err);
  }
}

/* ================= 主卡建议（穿衣 / 带伞 / 防晒） ================= */
function dressAdvice(cur) {
  const feel = num(cur.FeelsLikeC);
  if (feel === null) return '参考气温';
  if (feel >= 33) return '短袖短裤';
  if (feel >= 28) return '短袖';
  if (feel >= 24) return '短袖/薄衫';
  if (feel >= 20) return '薄长袖';
  if (feel >= 15) return '长袖外套';
  if (feel >= 10) return '外套薄毛衣';
  if (feel >= 5) return '厚外套';
  if (feel >= 0) return '棉服/羽绒服';
  return '羽绒服全套';
}

function umbrellaAdvice(data, cur) {
  const group = groupOf(num(cur.weatherCode));
  const rain = Math.max(...data.weather[0].hourly.map((h) => num(h.chanceofrain) || 0));
  if (group === 'rain' || group === 'thunder' || group === 'sleet') return '下雨，带伞';
  if (rain >= 60) return '建议带伞';
  if (rain >= 30) return '建议备伞';
  return '无需带伞';
}

function sunAdvice(cur) {
  const uv = num(cur.uvIndex) || 0;
  if (uv >= 8) return '强，防晒＋遮阳帽';
  if (uv >= 6) return '建议防晒';
  if (uv >= 3) return '中等防晒';
  return '无需防晒';
}

/* ================= 渲染 ================= */
function render(data) {
  const cur = data.current_condition[0];
  const area = data.nearest_area?.[0] || {};
  const code = num(cur.weatherCode);
  const desc = labelOf(code, cur.weatherDesc?.[0]?.value);
  const today = data.weather[0];

  // 主题与特效
  const phase = sunPhase(data);
  const isNight = phase === 'night';
  const group = groupOf(code);
  document.body.dataset.theme = `${group}-${phase}`;
  let kind = 'none';
  if (group === 'rain' || group === 'sleet' || group === 'thunder') kind = 'rain';
  else if (group === 'snow') kind = 'snow';
  else if (isNight) kind = 'stars';
  setFX(kind);
  if (group === 'thunder') scheduleFlash();
  else stopFlash();
  renderMoon(data);

  // 位置与时间
  const cityName = [area.areaName?.[0]?.value, area.region?.[0]?.value, area.country?.[0]?.value]
    .filter(Boolean).join(' · ');
  $('#location').textContent = cityName || '未知地点';
  const now = new Date();
  $('#date-line').textContent = now.toLocaleDateString('zh-CN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  $('#update-time').textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // 当前天气
  $('#hero-icon').innerHTML = svgIcon(WEATHER[code]?.icon || 'cloud', 128);
  const heroTemp = tempNum(cur.temp_C);
  $('#cur-temp').textContent = heroTemp === null ? '--' : String(Math.round(heroTemp));
  $('#cur-desc').textContent = desc;
  $('#cur-range').textContent = `最高 ${tempStr(today.maxtempC)} ／ 最低 ${tempStr(today.mintempC)}`;

  $('#hero-facts').innerHTML = [
    `穿衣：${dressAdvice(cur)}`,
    `带伞：${umbrellaAdvice(data, cur)}`,
    `防晒：${sunAdvice(cur)}`,
  ].map((f) => `<span>${f}</span>`).join('');

  renderHourly(data);
  renderForecast(data);
  renderChart(data);
  renderSun(data);
  renderRunner(data, state.aqi);

  $('#content').classList.remove('hidden');
  $('#loading').classList.add('hidden');
  $('#error').classList.add('hidden');
}

function collectHours(data) {
  const hours = [];
  for (const day of data.weather.slice(0, 3)) {
    for (const h of day.hourly) hours.push({ ...h, date: day.date });
  }
  return hours;
}

function renderHourly(data) {
  const hours = collectHours(data);
  const todayStr = data.weather[0].date;
  const nowHour = new Date().getHours();
  const nowIdx = hours.findIndex((h) => h.date === todayStr && num(h.time) / 100 === nowHour);

  $('#hourly').innerHTML = hours.slice(0, 24).map((h, i) => {
    const code = num(h.weatherCode);
    const hour = num(h.time) / 100;
    const isNow = i === nowIdx;
    return `<div class="hour-item${isNow ? ' now' : ''}">
      <span class="h-time">${String(hour).padStart(2, '0')}:00</span>
      ${svgIcon(WEATHER[code]?.icon || 'cloud', 34)}
      <span class="h-temp">${tempStr(h.tempC)}</span>
      <span class="h-rain">${num(h.chanceofrain) || 0}%</span>
    </div>`;
  }).join('');
}

function renderForecast(data) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  $('#forecast').innerHTML = data.weather.map((d, i) => {
    const mid = d.hourly[4] || d.hourly[3];
    const code = num(mid.weatherCode);
    const rain = Math.max(...d.hourly.map((h) => num(h.chanceofrain) || 0));
    const dt = new Date(`${d.date}T00:00:00`);
    return `<div class="day-card">
      <span class="d-day">${i === 0 ? '今天' : days[dt.getDay()]}</span>
      <span class="d-date">${d.date.slice(5)}</span>
      ${svgIcon(WEATHER[code]?.icon || 'cloud', 54)}
      <span class="d-desc">${labelOf(code, mid.weatherDesc?.[0]?.value)}</span>
      <span class="d-temps"><span>${tempStr(d.maxtempC)}</span><span class="d-min">${tempStr(d.mintempC)}</span></span>
      <span class="d-rain">${rain ? `降水 ${rain}%` : '无降水'}</span>
    </div>`;
  }).join('');
}

/* ================= 气温曲线 ================= */
const CHART = { W: 720, H: 220, padL: 10, padR: 10, padT: 24, padB: 28 };
const chart = { meta: [] };
const GAUGE_C = 2 * Math.PI * 17;

function scoreColor(s) {
  if (s >= 85) return '#7ce08a';
  if (s >= 70) return '#a5e77a';
  if (s >= 50) return '#ffd76e';
  if (s >= 30) return '#ff9d5c';
  return '#ff6b6b';
}

function smoothPath(pts) {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function renderChart(data) {
  const hours = collectHours(data);
  const { W, H, padL, padR, padT, padB } = CHART;
  const temps = hours.map((h) => num(h.tempC));
  const valid = temps.filter((v) => v !== null);
  if (!valid.length) return;

  let min = Math.min(...valid);
  let max = Math.max(...valid);
  let span = Math.max(max - min, 4);
  min -= span * 0.12;
  max += span * 0.12;

  const X = (i) => padL + i * (W - padL - padR) / (hours.length - 1);
  const Y = (v) => padT + (max - v) / (max - min) * (H - padT - padB);
  const pts = temps.map((v, i) => [X(i), v === null ? Y(min) : Y(v)]);

  let blocks = '';
  for (let d = 0; d < 3; d++) {
    const x0 = X(d * 8);
    const x1 = X(d * 8 + 7);
    blocks += `<rect x="${x0}" y="${padT - 6}" width="${x1 - x0}" height="${H - padT - padB + 8}" rx="10" fill="rgba(255,255,255,.055)"/>`;
    blocks += `<text x="${(x0 + x1) / 2}" y="${padT - 10}" text-anchor="middle" class="chart-date">${hours[d * 8].date.slice(5)}</text>`;
  }

  let grid = '';
  [0.25, 0.5, 0.75].forEach((f) => {
    const y = padT + f * (H - padT - padB);
    grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" class="chart-grid"/>`;
  });

  let labels = '';
  for (let i = 0; i < hours.length; i += 4) {
    const h = num(hours[i].time) / 100;
    labels += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" class="chart-label">${String(h).padStart(2, '0')}:00</text>`;
  }

  const line = smoothPath(pts);
  const area = `${line} L ${X(hours.length - 1).toFixed(1)} ${H - padB} L ${X(0).toFixed(1)} ${H - padB} Z`;

  let dots = '';
  chart.meta = [];
  pts.forEach((p, i) => {
    if (temps[i] === null) return;
    dots += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.4" class="chart-dot"/>`;
    chart.meta.push({ x: p[0], y: p[1], v: temps[i], h: hours[i] });
  });

  $('#chart').innerHTML = `
    <defs>
      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffd76e"/><stop offset="50%" stop-color="#ff9d5c"/><stop offset="100%" stop-color="#ff7ab8"/>
      </linearGradient>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,157,92,.32)"/><stop offset="100%" stop-color="rgba(255,157,92,0)"/>
      </linearGradient>
    </defs>
    ${blocks}${grid}
    <path d="${area}" fill="url(#areaGrad)"/>
    <path d="${line}" fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <g>${dots}</g>
    ${labels}
  `;
}

function setupChartTip() {
  const svg = $('#chart');
  const tip = $('#chart-tip');
  const { W, H } = CHART;

  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const sx = W / r.width;
    const sy = H / r.height;
    const mx = (e.clientX - r.left) * sx;
    const my = (e.clientY - r.top) * sy;
    let best = null;
    let bd = Infinity;
    for (const m of chart.meta) {
      const d = (m.x - mx) ** 2 + (m.y - my) ** 2;
      if (d < bd) { bd = d; best = m; }
    }
    if (best && bd < 30 * 30) {
      const hour = num(best.h.time) / 100;
      const label = `${String(hour).padStart(2, '0')}:00 · ${best.h.date.slice(5)}`;
      tip.innerHTML = `<b>${tempStr(best.v)}</b> ${state.unit}<span>${label} · ${labelOf(num(best.h.weatherCode), '')}</span>`;
      const px = best.x / sx;
      const py = best.y / sy;
      tip.classList.remove('hidden');
      tip.style.left = `${Math.min(Math.max(px - 48, 0), r.width - 110)}px`;
      tip.style.top = `${Math.max(py - 58, 0)}px`;
    } else {
      tip.classList.add('hidden');
    }
  });
  svg.addEventListener('pointerleave', () => tip.classList.add('hidden'));
}

/* ================= 日照 ================= */
function toMin(s) {
  if (!s) return 0;
  const [t, ap] = s.trim().split(/\s+/);
  let [h, m] = t.split(':').map(Number);
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} 小时 ${m} 分` : `${m} 分钟`;
}

/* ================= 当地时段（晨光 / 白昼 / 黄昏 / 夜晚） ================= */
function sunPhase(data) {
  const astro = data.weather[0]?.astronomy?.[0];
  const iconNight = (data.current_condition[0]?.weatherIconUrl?.[0]?.value || '').includes('night');
  if (!astro || !astro.sunrise || !astro.sunset) return iconNight ? 'night' : 'day';

  const rise = toMin(astro.sunrise);
  const set = toMin(astro.sunset);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();

  if (cur < rise || cur > set) return 'night';
  if (cur < rise + 75) return 'dawn';
  if (cur > set - 75) return 'dusk';
  return 'day';
}

function renderMoon(data) {
  const astro = data.weather[0]?.astronomy?.[0];
  const illum = num(astro?.moon_illumination);
  const waxing = isWaxing(astro?.moon_phase);
  $('#moon').innerHTML = moonPhaseSVG(illum ?? 50, waxing, 104);
}

function renderSun(data) {
  const astro = data.weather[0].astronomy?.[0];
  if (!astro) return;
  $('#run-sunrise').textContent = astro.sunrise;
  $('#run-sunset').textContent = astro.sunset;
  $('#run-daylight').textContent = fmtDur(toMin(astro.sunset) - toMin(astro.sunrise));
  const illum = num(astro.moon_illumination);
  const cn = MOON_CN[astro.moon_phase] || astro.moon_phase || '--';
  $('#run-moon').innerHTML = `${moonPhaseSVG(illum ?? 50, isWaxing(astro.moon_phase), 18)} ${cn}${illum !== null ? ` ${Math.round(illum)}%` : ''}`;

  const rise = toMin(astro.sunrise);
  const set = toMin(astro.sunset);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const fill = $('#sun-track-fill');
  const dot = $('#sun-now');

  if (cur < rise) {
    fill.style.width = '0%';
    dot.style.left = '0%';
  } else if (cur > set) {
    fill.style.width = '100%';
    dot.style.left = '100%';
  } else {
    const p = (cur - rise) / (set - rise);
    fill.style.width = `${(p * 100).toFixed(1)}%`;
    dot.style.left = `${(p * 100).toFixed(1)}%`;
  }
}

/* ================= 跑者台：适宜度 / 建议 / 最佳窗口 ================= */
function runningScore(data, cur, aqi) {
  const feel = num(cur.FeelsLikeC);
  const humidity = num(cur.humidity) || 0;
  const wind = num(cur.windspeedKmph) || 0;
  const rain = Math.max(...data.weather[0].hourly.map((h) => num(h.chanceofrain) || 0));
  const uv = num(cur.uvIndex) || 0;
  const vis = num(cur.visibility);
  const dew = num(cur.DewPointC);
  const notes = [];
  let score = 100;

  if (feel === null) {
    notes.push('缺少体感温度数据');
  } else if (feel >= 8 && feel <= 22) {
    notes.push(`体感 ${Math.round(feel)}°C，正处于舒适的跑步区间`);
  } else if (feel >= 0 && feel < 8) {
    score -= 10;
    notes.push('体感偏凉：充分热身，注意保暖');
  } else if (feel < 0) {
    score -= 18;
    notes.push('体感寒冷：谨防失温，缩短户外时间');
  } else if (feel <= 26) {
    score -= 8;
    notes.push('体感略热：适当降低配速，及时补水');
  } else if (feel <= 28) {
    score -= 14;
    notes.push('体感较热：注意补水，尽量避开正午');
  } else if (feel <= 30) {
    score -= 22;
    notes.push('体感炎热：建议改到清晨或夜晚跑');
  } else {
    score -= 32;
    notes.push('体感酷热：不建议户外长跑');
  }

  if (dew !== null && dew > 20) {
    score -= 8;
    notes.push(`露点 ${Math.round(dew)}°C：空气闷湿，散热困难`);
  } else if (dew !== null && dew < 0) {
    score -= 5;
    notes.push('空气干燥寒冷，注意口鼻保暖');
  }

  if (humidity >= 85) {
    score -= 12;
    notes.push('湿度很高：体感闷热，多补水');
  } else if (humidity >= 70 && (feel ?? 25) > 25) {
    score -= 8;
    notes.push('湿度偏高：排汗散热效率下降');
  }

  if (wind >= 40) {
    score -= 20;
    notes.push('风速很大：顶风路段更费力');
  } else if (wind >= 30) {
    score -= 10;
    notes.push('风力较大：注意配速与衣物');
  } else if (wind >= 15) {
    notes.push(`微风 ${Math.round(wind)} km/h：顺风回程更轻松`);
  }

  if (rain >= 60) {
    score -= 18;
    notes.push('降水概率高：备好防雨方案');
  } else if (rain >= 30) {
    score -= 7;
    notes.push('有降水可能：出发前看一眼雷达');
  }

  if (uv >= 8) {
    score -= 14;
    notes.push('紫外线很强：涂抹防晒、戴帽');
  } else if (uv >= 6) {
    score -= 7;
    notes.push('紫外线较强：建议做好防晒');
  }

  const ai = aqiInfo(aqi);
  if (ai) {
    if (aqi > 200) {
      score -= 35;
      notes.push(`空气质量很差（AQI ${aqi}）：建议改为室内训练`);
    } else if (aqi > 150) {
      score -= 22;
      notes.push(`空气质量不佳（AQI ${aqi}）：敏感人群减少户外运动`);
    } else if (aqi > 100) {
      score -= 12;
      notes.push(`空气质量一般（AQI ${aqi}）：降低强度、缩短时长`);
    } else {
      notes.push(`空气质量${ai.label}（AQI ${aqi}）：适合户外呼吸`);
    }
  }

  if (vis !== null && vis < 5) {
    score -= 8;
    notes.push('能见度较低：注意路况与安全');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade, color;
  if (score >= 85) { grade = '非常适合'; color = '#7ce08a'; }
  else if (score >= 70) { grade = '适宜'; color = '#a5e77a'; }
  else if (score >= 50) { grade = '尚可'; color = '#ffd76e'; }
  else if (score >= 30) { grade = '不太适宜'; color = '#ff9d5c'; }
  else { grade = '不建议户外'; color = '#ff6b6b'; }

  const summary = {
    '非常适合': '状态在线，放心开跑',
    '适宜': '适合跑步，记得补水',
    '尚可': '可以跑，控制好强度',
    '不太适宜': '建议缩短里程或改室内',
    '不建议户外': '建议改为室内训练',
  }[grade];

  return { score, grade, color, summary, notes: notes.slice(0, 6) };
}

function bestWindow(data) {
  const hours = collectHours(data).slice(0, 24);
  if (!hours.length) return null;

  const scored = hours.map((h) => {
    const t = num(h.tempC);
    const p = num(h.chanceofrain) || 0;
    const w = num(h.windspeedKmph) || 0;
    const uv = num(h.uvIndex) || 0;
    const hum = num(h.humidity) || 0;
    let s = 100;
    if (t >= 8 && t <= 22) { /* 理想区间 */ }
    else if (t >= 0 && t < 8) s -= 8;
    else if (t < 0) s -= 18;
    else if (t <= 26) s -= 6;
    else if (t <= 28) s -= 12;
    else if (t <= 30) s -= 20;
    else s -= 30;
    if (hum >= 85) s -= 12;
    else if (hum >= 70 && t > 25) s -= 8;
    if (w >= 40) s -= 20;
    else if (w >= 30) s -= 10;
    if (p >= 60) s -= 20;
    else if (p >= 30) s -= 8;
    if (uv >= 8) s -= 12;
    else if (uv >= 6) s -= 6;
    return { h, s };
  });

  let best = scored[0];
  for (const it of scored) if (it.s > best.s) best = it;

  const h0 = num(best.h.time) / 100;
  const label = best.h.date === data.weather[0].date ? '今天' : '明天';

  return {
    label,
    range: `${String(h0).padStart(2, '0')}:00 – ${String(h0 + 3).padStart(2, '0')}:00`,
    temp: tempStr(best.h.tempC),
    rain: num(best.h.chanceofrain) || 0,
    wind: num(best.h.windspeedKmph) || 0,
    uv: num(best.h.uvIndex) || 0,
    score: best.s,
  };
}

function renderRunner(data, aqi) {
  const cur = data.current_condition[0];
  const res = runningScore(data, cur, aqi);

  const R = 52;
  const C = 2 * Math.PI * R;
  const fg = $('#score-ring-fg');
  fg.style.strokeDasharray = C;
  fg.style.strokeDashoffset = C * (1 - res.score / 100);
  fg.style.stroke = res.color;
  $('#run-score').textContent = res.score;
  $('#run-grade').textContent = res.grade;
  $('#run-grade').style.color = res.color;
  $('#run-summary').textContent = res.summary;

  const feel = num(cur.FeelsLikeC);
  const humidity = num(cur.humidity) || 0;
  const wind = num(cur.windspeedKmph) || 0;
  const rain = Math.max(...data.weather[0].hourly.map((h) => num(h.chanceofrain) || 0));
  const uv = num(cur.uvIndex) || 0;
  const ai = aqiInfo(aqi);

  const metrics = [
    ['cloud', '空气质量', aqi === null ? '查询中…' : `AQI ${aqi}${ai ? ' · ' + ai.label : ''}`],
    ['thermometer', '体感', feel === null ? '--' : `${Math.round(feel)}°`],
    ['droplet', '湿度', `${humidity}%`],
    ['compass', '风向', `${cur.winddir16Point} · ${cur.winddirDegree}°`],
    ['wind', '风速', `${wind} km/h`],
    ['gauge', '气压', `${cur.pressure} hPa`],
    ['eye', '能见度', `${cur.visibility} km`],
    ['umbrella', '降水概率', `${rain}%`],
    ['uv', '紫外线', `${uv}`],
  ];
  const isWaqi = state.aqiSrc === 'waqi';

  $('#runner-metrics').innerHTML = metrics.map(([ic, label, val]) => {
    const colored = ic === 'cloud' && label.startsWith('空气质量') && ai ? ` style="--mcolor:${ai.color}"` : '';
    return `<span class="rm-chip"${colored}>
      <span class="rm-ic">${tinyIcon(ic)}</span>
      <span class="rm-tx"><small>${label}</small><b>${val}</b></span>
    </span>`;
  }).join('');

  let note = '';
  if (aqi !== null) {
    const t = state.aqiTime ? ` · 更新 ${state.aqiTime.slice(5, 16).replace('T', ' ')}` : '';
    const pols = [];
    const polTxt = (v, unit) => `${Math.round(v * 10) / 10} ${unit}`;
    if (state.pm25 !== null) pols.push(`PM2.5 ${polTxt(state.pm25, isWaqi ? '指数' : 'µg/m³')}`);
    if (state.pm10 !== null) pols.push(`PM10 ${polTxt(state.pm10, isWaqi ? '指数' : 'µg/m³')}`);
    if (state.o3 !== null) pols.push(`O₃ ${polTxt(state.o3, isWaqi ? '指数' : 'µg/m³')}`);
    const polLine = pols.length ? ` · ${pols.join(' · ')}` : '';
    if (state.aqiSrc === 'qweather') note = `数据源：${state.aqiStation}（国标 AQI，与国内 App 口径一致）${t}${polLine}`;
    else if (state.aqiSrc === 'waqi') note = `数据源：${state.aqiStation}（aqicn 监测站实测，美标 AQI；国内 App 多用国标，口径不同数值会有差异）${t}${polLine}`;
    else if (state.aqiSrc === 'estimate') note = `暂无监测站数据，AQI 为全球模型估算（国标口径），仅供参考${polLine}`;
  } else {
    note = '空气质量暂时无法获取';
  }
  $('#aqi-note').textContent = note;

  $('#run-advice').innerHTML = res.notes.map((n) => `<li>${n}</li>`).join('');

  const win = bestWindow(data);
  $('#run-window').innerHTML = win
    ? `<div class="win-head">
        <span class="win-badge">${win.label}</span>
        <span class="win-range">${win.range}</span>
        <div class="win-gauge" style="--gcolor:${scoreColor(win.score)}">
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle class="wg-bg" cx="22" cy="22" r="17"/>
            <circle class="wg-fg" cx="22" cy="22" r="17"
              style="stroke-dasharray:${GAUGE_C.toFixed(1)};stroke-dashoffset:${(GAUGE_C * (1 - win.score / 100)).toFixed(1)}"/>
          </svg>
          <span class="wg-num">${win.score}</span>
        </div>
      </div>
      <div class="win-stats">
        <div class="ws"><span class="ws-ic">${tinyIcon('thermometer')}</span><span class="ws-tx"><small>温度</small><b>${win.temp}</b></span></div>
        <div class="ws"><span class="ws-ic">${tinyIcon('umbrella')}</span><span class="ws-tx"><small>降水</small><b>${win.rain}%</b></span></div>
        <div class="ws"><span class="ws-ic">${tinyIcon('wind')}</span><span class="ws-tx"><small>风速</small><b>${win.wind}</b><i>km/h</i></span></div>
        <div class="ws"><span class="ws-ic">${tinyIcon('uv')}</span><span class="ws-tx"><small>紫外线</small><b>${win.uv}</b></span></div>
      </div>`
    : '暂无数据';
}

/* ================= 空气质量（多数据源，按优先级回退） ================= */
let aqiReq = 0;

/* 1) 和风天气（可选 Key）：国标 AQI，来自国控监测站，与国内 App 一致 */
async function fetchQWeather(lat, lon, key) {
  const url = `https://devapi.qweather.com/v7/air/now`
    + `?location=${encodeURIComponent(lon)},${encodeURIComponent(lat)}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  if (j.code !== '200' || !j.now) throw new Error(j.code || 'bad response');
  const n = j.now;
  return {
    aqi: num(n.aqi),
    pm25: num(n.pm2p5),
    pm10: num(n.pm10),
    o3: num(n.o3),
    no2: num(n.no2),
    aqiSrc: 'qweather',
    aqiStation: '和风天气 · 国控监测',
    aqiTime: j.updateTime || '',
  };
}

/* 2) aqicn / WAQI：无 Key 实测（中国国控站数据），美标 AQI */
async function fetchWaqi(lat, lon) {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  const d = j?.data;
  if (j.status !== 'ok' || !d || d.aqi === '-' || num(d.aqi) === null) throw new Error('no waqi data');
  return {
    aqi: num(d.aqi),
    pm25: num(d.iaqi?.pm25?.v),
    pm10: num(d.iaqi?.pm10?.v),
    o3: num(d.iaqi?.o3?.v),
    no2: num(d.iaqi?.no2?.v),
    aqiSrc: 'waqi',
    aqiStation: d.city?.name || '监测站',
    aqiTime: d.time?.s || '',
  };
}

/* 3) 兜底：Open-Meteo 模型浓度，按国标 HJ 633-2012 计算估算 AQI */
const CN_BP = {
  pm25: [[0,35,0,50],[35,75,51,100],[75,115,101,150],[115,150,151,200],[150,250,201,300],[250,350,301,400],[350,500,401,500]],
  pm10: [[0,50,0,50],[50,150,51,100],[150,250,101,150],[250,350,151,200],[350,420,201,300],[420,500,301,400],[500,600,401,500]],
  no2:  [[0,40,0,50],[40,80,51,100],[80,180,101,150],[180,280,151,200],[280,565,201,300],[565,750,301,400],[750,940,401,500]],
  so2:  [[0,50,0,50],[50,150,51,100],[150,475,101,150],[475,800,151,200],[800,1600,201,300],[1600,2100,301,400],[2100,2620,401,500]],
  co:   [[0,2,0,50],[2,4,51,100],[4,14,101,150],[14,24,151,200],[24,36,201,300],[36,48,301,400],[48,60,401,500]],
  o3_1h: [[0,160,0,50],[160,200,51,100],[200,300,101,150],[300,400,151,200],[400,800,201,300],[800,1000,301,400],[1000,1200,401,500]],
  o3_8h: [[0,100,0,50],[100,160,51,100],[160,215,101,150],[215,265,151,200],[265,800,201,300]],
};

function cnIAQI(pol, c) {
  const bp = CN_BP[pol];
  if (c === null || c === undefined || !Number.isFinite(c) || c < 0) return null;
  for (const [cl, ch, al, ah] of bp) {
    if (c <= ch) {
      if (c <= cl) return al;
      return Math.round(((ah - al) / (ch - cl)) * (c - cl) + al);
    }
  }
  return 500;
}

function avgOf(arr) {
  const v = arr.filter((x) => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

async function fetchEstimate(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality`
    + `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    + `&hourly=pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide`
    + `&past_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  const h = j.hourly;
  if (!h || !h.pm2_5 || !h.pm2_5.length) throw new Error('no hourly data');

  const pm25 = avgOf(h.pm2_5.slice(-24));
  const pm10 = avgOf(h.pm10.slice(-24));
  const o3_8h = avgOf(h.ozone.slice(-8));
  const o3_1h = num(h.ozone[h.ozone.length - 1]);
  const no2 = num(h.nitrogen_dioxide[h.nitrogen_dioxide.length - 1]);
  const so2 = num(h.sulphur_dioxide[h.sulphur_dioxide.length - 1]);
  const coVal = num(h.carbon_monoxide[h.carbon_monoxide.length - 1]);
  const co = coVal === null ? null : coVal / 1000; // µg/m³ -> mg/m³

  const iaqis = [cnIAQI('pm25', pm25), cnIAQI('pm10', pm10), cnIAQI('o3_8h', o3_8h),
    cnIAQI('o3_1h', o3_1h), cnIAQI('no2', no2), cnIAQI('so2', so2), cnIAQI('co', co)]
    .filter((v) => v !== null);
  if (!iaqis.length) throw new Error('no iaqi');

  return {
    aqi: Math.max(...iaqis),
    pm25: pm25 === null ? null : Math.round(pm25 * 10) / 10,
    pm10: pm10 === null ? null : Math.round(pm10 * 10) / 10,
    o3: o3_1h,
    no2,
    aqiSrc: 'estimate',
    aqiStation: 'Open-Meteo 模型',
    aqiTime: j.current?.time || '',
  };
}

async function loadAQI(data) {
  const id = ++aqiReq;
  const area = data.nearest_area?.[0];
  const lat = area?.latitude;
  const lon = area?.longitude;

  const finish = (r) => {
    if (id !== aqiReq) return;
    Object.assign(state, r);
    renderRunner(state.data, state.aqi);
  };
  const fail = () => {
    if (id !== aqiReq) return;
    Object.assign(state, { aqi: null, pm25: null, pm10: null, o3: null, aqiSrc: null, aqiStation: '', aqiTime: '' });
    renderRunner(state.data, null);
  };

  if (!lat || !lon) return fail();

  if (state.qKey) {
    try { finish(await fetchQWeather(lat, lon, state.qKey)); return; } catch { /* 回退下一数据源 */ }
  }
  try { finish(await fetchWaqi(lat, lon)); return; } catch { /* 回退 */ }
  try { finish(await fetchEstimate(lat, lon)); return; } catch { /* 回退 */ }
  fail();
}

/* ================= 加载 / 错误 / 单位 ================= */
function showLoading() {
  $('#content').classList.add('hidden');
  $('#error').classList.add('hidden');
  $('#loading').classList.remove('hidden');
}

function showError(err) {
  $('#content').classList.add('hidden');
  $('#loading').classList.add('hidden');
  $('#error').classList.remove('hidden');
  $('#error-msg').textContent = err?.message || '加载失败，请检查网络后重试';
}

function setUnit(u) {
  state.unit = u;
  localStorage.setItem('wunit', u);
  $('#unit-c').classList.toggle('active', u === 'C');
  $('#unit-f').classList.toggle('active', u === 'F');
  if (state.data) render(state.data);
}

function locate() {
  if (!navigator.geolocation) {
    showError(new Error('当前浏览器不支持定位'));
    return;
  }
  $('#locate-btn').classList.add('busy');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $('#locate-btn').classList.remove('busy');
      load(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
    },
    (err) => {
      $('#locate-btn').classList.remove('busy');
      showError(new Error(`无法获取位置：${err.message || '未知错误'}`));
    },
    { timeout: 10000 }
  );
}

/* ================= 初始化 ================= */
function init() {
  setupCanvas();
  setupChartTip();

  $('#unit-c').classList.toggle('active', state.unit === 'C');
  $('#unit-f').classList.toggle('active', state.unit === 'F');

  $('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#city-input').value.trim();
    if (v) load(v);
  });
  $('#locate-btn').addEventListener('click', locate);
  $('#refresh-btn').addEventListener('click', () => load(state.query));
  $('#retry-btn').addEventListener('click', () => load(state.query));
  $('#unit-c').addEventListener('click', () => setUnit('C'));
  $('#unit-f').addEventListener('click', () => setUnit('F'));
  $('#aqi-gear').addEventListener('click', () => $('#aqi-settings').classList.toggle('hidden'));
  $('#qkey-save').addEventListener('click', () => {
    const k = $('#qkey-input').value.trim();
    state.qKey = k;
    localStorage.setItem('wqkey', k);
    $('#aqi-settings').classList.add('hidden');
    if (state.data) loadAQI(state.data);
  });
  $('#qkey-clear').addEventListener('click', () => {
    state.qKey = '';
    localStorage.removeItem('wqkey');
    $('#qkey-input').value = '';
    $('#aqi-settings').classList.add('hidden');
    if (state.data) loadAQI(state.data);
  });
  $('#qkey-input').value = state.qKey;

  const saved = localStorage.getItem('wcity');
  if (saved) $('#city-input').value = saved;
  load(state.query);
}

init();
