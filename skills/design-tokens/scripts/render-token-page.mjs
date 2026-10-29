#!/usr/bin/env node
// Danh Method · render-token-page
// Đọc CSS custom properties (globals.css của shadcn/ui, tokens.css sinh từ ui-ux-pro-max, portal-tokens.css…)
// và dựng MỘT trang HTML tự chứa để người dùng xem, so sánh light/dark, kiểm tương phản và duyệt token.
//
// Dùng:
//   node render-token-page.mjs --css <file.css> [--css <file2.css> ...] --out <tokens.html>
//                              [--title "MiVida tokens"] [--note "Nguồn: packages/ui/src/styles"]
//                              [--set "--font-sans=Plus Jakarta Sans, sans-serif"] ...
//   --set: gán giá trị cho biến chỉ có lúc chạy (ví dụ next/font sinh --font-sans). Lặp lại được.
//
// - Light lấy từ :root, html, @theme, @theme inline. Dark lấy từ .dark, [data-theme="dark"], :root.dark,
//   và @media (prefers-color-scheme: dark) { :root { ... } }.
// - Chỉ lấy khai báo biến (--*). Bỏ @import, @tailwind, @apply… nên trang mở offline được (trừ Google Fonts).
// - Không sửa file nguồn. Không cần thư viện ngoài. Node >= 18.

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const many = k => argv.flatMap((a, i) => (a === k && argv[i + 1] ? [argv[i + 1]] : []));
const one = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
if (!many('--css').length || argv.includes('--help')) {
  console.log('node render-token-page.mjs --css <file.css> [--css ...] --out <tokens.html> [--title "..."] [--note "..."] [--set "--name=value" ...]');
  process.exit(argv.includes('--help') ? 0 : 1);
}
const cssFiles = many('--css').map(f => path.resolve(f));
const outFile = path.resolve(one('--out', 'tokens.html'));
const title = one('--title', 'Design tokens');
const note = one('--note', '');

// ---------- 1. Tách khai báo biến theo scope ----------
function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, ''); }

function scopeOf(stack) {
  // Trả về 'light' | 'dark' | 'both' | null
  const media = stack.slice(0, -1).filter(s => s.startsWith('@media') || s.startsWith('@supports'));
  const darkMedia = media.some(m => /prefers-color-scheme\s*:\s*dark/i.test(m));
  // :root nằm trong @media khác (breakpoint, reduced-motion…) là ghi đè theo ngữ cảnh — bỏ qua
  if (media.length && !darkMedia) return null;
  const sel = (stack[stack.length - 1] || '').toLowerCase().trim();
  const parts = sel.split(',').map(x => x.trim());
  const isDark = x => /(^|[\s(:])\.dark\b|^\.dark\b|\[data-theme=["']?dark|\[data-mode=["']?dark|\.theme-dark/.test(x);
  const isRoot = x => /^(:root|html|:host|@theme(\s+inline)?)$/.test(x);
  const hasDark = parts.some(isDark), hasRoot = parts.some(isRoot);
  if (darkMedia) return hasRoot ? 'dark' : null;
  if (hasDark && hasRoot) return 'both';
  if (hasDark) return 'dark';
  if (hasRoot) return 'light';
  return null; // biến khai báo trong selector khác (component) — bỏ qua
}

function parse(css, file, store) {
  css = stripComments(css);
  const stack = [];
  let buf = '';
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') { stack.push(buf.trim()); buf = ''; continue; }
    if (ch === '}') { flush(); stack.pop(); buf = ''; continue; }
    if (ch === ';') { flush(); buf = ''; continue; }
    buf += ch;
  }
  function flush() {
    const m = buf.trim().match(/^(--[A-Za-z0-9_-]+)\s*:\s*([\s\S]+)$/);
    if (!m || !stack.length) return;
    const scope = scopeOf(stack);
    if (!scope) return;
    const name = m[1];
    const value = m[2].trim().replace(/\s*!important$/, '');
    // Tailwind @theme inline hay có "--x: var(--x)" — không ghi đè giá trị thật đã có
    if (new RegExp(`^var\\(\\s*${name}\\s*\\)$`).test(value)) return;
    const t = store.get(name) || { name, light: null, dark: null, file: path.basename(file) };
    if (scope === 'both') { t.light = value; t.dark = value; } else t[scope] = value;
    store.set(name, t);
  }
}

const store = new Map();
for (const f of cssFiles) {
  if (!fs.existsSync(f)) { console.error(`Không thấy file: ${f}`); process.exit(1); }
  parse(fs.readFileSync(f, 'utf8'), f, store);
}
for (const kv of many('--set')) {
  const i = kv.indexOf('='); if (i < 1) continue;
  const name = kv.slice(0, i).trim(), value = kv.slice(i + 1).trim();
  const t = store.get(name) || { name, light: null, dark: null, file: '--set' };
  t.light = value; if (t.dark == null || t.dark === `var(${name})`) t.dark = null; t.file = '--set';
  store.set(name, t);
}
// Biến tự trỏ vào chính nó (kiểu Tailwind @theme inline: --font-sans: var(--font-sans)) là vô hiệu khi nhúng — bỏ giá trị đó
for (const t of store.values()) for (const k of ['light', 'dark']) if (t[k] && new RegExp(`^var\\(\\s*${t.name}\\s*\\)$`).test(t[k])) t[k] = null;
for (const [n, t] of store) if (t.light == null && t.dark == null) store.delete(n);
const tokens = [...store.values()];
if (!tokens.length) { console.error('Không tìm thấy biến CSS (--*) nào ở :root / .dark / @theme.'); process.exit(2); }

// ---------- 2. Phân loại ----------
const COLOR_FN = /^(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|hwb\(|color\(|color-mix\()/i;
const BARE_HSL = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%(\s*\/\s*[\d.]+%?)?$/; // shadcn cũ: "222 47% 11%"
function resolve(name, scope, seen = new Set()) {
  if (seen.has(name)) return null; seen.add(name);
  const t = store.get(name); if (!t) return null;
  let v = t[scope] ?? t.light; if (v == null) return null;
  const m = v.match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*(.+))?\)$/);
  if (m) return resolve(m[1], scope, seen) ?? (m[2] || null);
  return v;
}
function kindOf(t) {
  const n = t.name.toLowerCase();
  const v = resolve(t.name, 'light') || '';
  if (/shadow|elevation/.test(n)) return 'shadow';
  if (COLOR_FN.test(v) || BARE_HSL.test(v)) return 'color';
  if (/font-?family|^--font-(sans|serif|mono|heading|body|display)|-family$/.test(n) && !/^\d/.test(v)) return 'font';
  if (/radius|rounded/.test(n)) return 'radius';
  if (/(^|-)(space|spacing|gap|gutter|inset)(-|$)/.test(n)) return 'spacing';
  if (/font-size|(^--text-)|size-(xs|sm|base|md|lg|xl)/.test(n) && /\d/.test(v)) return 'fontsize';
  if (/weight/.test(n)) return 'weight';
  if (/leading|line-height/.test(n)) return 'leading';
  if (/duration|ease|transition|motion/.test(n)) return 'motion';
  if (/^-?[\d.]+(px|rem|em|%)$/.test(v)) return 'dimension';
  return 'other';
}
for (const t of tokens) {
  t.kind = kindOf(t);
  const lv = resolve(t.name, 'light') || '';
  t.bareHsl = t.kind === 'color' && BARE_HSL.test(lv);
}

// Cặp nền / chữ kiểu shadcn: X + X-foreground (background + foreground)
const names = new Set(tokens.map(t => t.name));
const pairs = [];
for (const t of tokens) {
  if (t.kind !== 'color' || /-foreground$/.test(t.name)) continue;
  const fg = t.name === '--background' ? '--foreground' : `${t.name}-foreground`;
  if (names.has(fg)) pairs.push([t.name, fg]);
}
// Bỏ cặp chỉ là alias của cặp khác (Tailwind: --color-primary: var(--primary))
const aliasOf = n => { const v = store.get(n)?.light || ''; const m = v.match(/^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/); return m ? m[1] : null; };
const pairBgs = new Set(pairs.map(p => p[0]));
for (let i = pairs.length - 1; i >= 0; i--) { const a = aliasOf(pairs[i][0]); if (a && pairBgs.has(a)) pairs.splice(i, 1); }
// Chỉ cảnh báo màu là giá trị cứng (không tham chiếu biến nào) mà không có bản dark
const missingDark = tokens.filter(t => t.kind === 'color' && t.light && !t.dark && !/var\(/.test(t.light)
  && !/-(\d{2,3}|white|black)$/.test(t.name)).map(t => t.name); // bỏ qua thang primitive (gray-500, white…)
const hasShadcn = ['--background', '--foreground', '--primary', '--primary-foreground'].every(n => names.has(n));

// ---------- 3. CSS sạch để nhúng ----------
const decl = scope => tokens.filter(t => t[scope] != null).map(t => `  ${t.name}: ${t[scope]};`).join('\n');
// Khai báo lại ở từng khung [data-scope] để biến alias (var(--x)) tính lại theo theme của khung đó,
// nếu không alias sẽ bị "đóng băng" theo giá trị light ở :root.
const embedded = `:root, [data-scope] {\n${decl('light')}\n}\n.dark, [data-scope].dark {\n${decl('dark')}\n}`;
const fontImports = [...new Set(tokens.filter(t => t.kind === 'font').flatMap(t => (resolve(t.name, 'light') || '').split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))))]
  .filter(f => f && !/^(ui-|system-ui|sans-serif|serif|monospace|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|Apple Color Emoji|Segoe UI Emoji|Segoe UI Symbol|Noto Color Emoji|var\()/i.test(f))
  .slice(0, 4);
const gfonts = fontImports.length
  ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontImports.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap">`
  : '';

const data = { title, note, files: cssFiles.map(f => path.basename(f)), generated: new Date().toISOString(), tokens, pairs, missingDark, hasShadcn };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- 4. HTML ----------
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${gfonts}
<style id="project-tokens">
${embedded}
</style>
<style>
/* Khung trang dùng biến riêng --tk-* để không lẫn với token của dự án */
:root{--tk-bg:#f6f6f4;--tk-panel:#fff;--tk-ink:#1d1d1b;--tk-mute:#6b6b66;--tk-line:#e4e3de;--tk-ok:#1f7a3a;--tk-bad:#b3261e;--tk-chip:#efeee9}
html.tk-dark{--tk-bg:#141514;--tk-panel:#1d1f1d;--tk-ink:#eeede8;--tk-mute:#a3a29c;--tk-line:#2e302d;--tk-ok:#6fd18f;--tk-bad:#ff8a80;--tk-chip:#262826}
*{box-sizing:border-box}
body{margin:0;background:var(--tk-bg);color:var(--tk-ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--tk-bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--tk-line)}
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
.bar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:12px 0}
.bar h1{font-size:18px;margin:0 auto 0 0}
.bar input{min-width:0;width:220px;max-width:100%;padding:8px 12px;border-radius:999px;border:1px solid var(--tk-line);background:var(--tk-panel);color:var(--tk-ink)}
.seg{display:inline-flex;background:var(--tk-chip);border-radius:999px;padding:3px}
.seg button{border:0;background:transparent;color:var(--tk-mute);padding:6px 14px;border-radius:999px;cursor:pointer;font:inherit}
.seg button[aria-pressed=true]{background:var(--tk-panel);color:var(--tk-ink);box-shadow:0 1px 3px rgba(0,0,0,.12)}
nav.toc{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px}
nav.toc a{white-space:nowrap;color:var(--tk-mute);text-decoration:none;padding:4px 10px;border-radius:999px;background:var(--tk-chip);font-size:12px}
main{padding:24px 0 64px}
section{margin:0 0 40px;scroll-margin-top:130px}
section>h2{font-size:15px;margin:0 0 4px}
section>p.sub{color:var(--tk-mute);margin:0 0 14px;font-size:13px}
.meta{color:var(--tk-mute);font-size:12px;padding-bottom:8px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}
.card{background:var(--tk-panel);border:1px solid var(--tk-line);border-radius:14px;overflow:hidden}
.sw{height:72px;display:flex;align-items:flex-end;padding:8px;font-size:12px;font-weight:600}
.info{padding:8px 10px 10px;font-size:12px}
.nm{font-family:ui-monospace,Consolas,monospace;font-weight:600;cursor:copy;word-break:break-all}
.val{color:var(--tk-mute);font-family:ui-monospace,Consolas,monospace;word-break:break-all}
.pairs{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.pair .sw{height:88px;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:2px}
.pair .sw b{font-size:20px}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700}
.ok{background:color-mix(in srgb,var(--tk-ok) 16%,transparent);color:var(--tk-ok)}
.bad{background:color-mix(in srgb,var(--tk-bad) 16%,transparent);color:var(--tk-bad)}
.row{display:flex;align-items:center;gap:14px;padding:10px 12px;border-top:1px solid var(--tk-line)}
.row:first-child{border-top:0}
.list{background:var(--tk-panel);border:1px solid var(--tk-line);border-radius:14px}
.rad{width:64px;height:64px;background:var(--tk-chip);border:2px solid var(--tk-mute)}
.spc{height:14px;background:color-mix(in srgb,var(--tk-ink) 70%,transparent);border-radius:3px}
.shd{width:120px;height:72px;border-radius:12px;background:var(--tk-panel)}
.font-sample{font-size:28px;line-height:1.2;margin:4px 0}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{text-align:left;padding:8px 10px;border-top:1px solid var(--tk-line);vertical-align:top}
th{color:var(--tk-mute);font-weight:600;border-top:0}
td code{font-family:ui-monospace,Consolas,monospace;word-break:break-all}
.dot{display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:6px;border:1px solid var(--tk-line)}
.tablewrap{overflow-x:auto;background:var(--tk-panel);border:1px solid var(--tk-line);border-radius:14px}
.issues li{margin:4px 0}
.demo{padding:24px;border-radius:14px;border:1px solid var(--tk-line)}
.hidden{display:none!important}
.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--tk-ink);color:var(--tk-bg);padding:8px 14px;border-radius:999px;font-size:12px;opacity:0;transition:opacity .2s}
.toast.show{opacity:1}
@media (max-width:520px){.bar input{width:100%}.bar h1{width:100%}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<header><div class="wrap">
  <div class="bar">
    <h1>${esc(title)}</h1>
    <input id="q" type="search" placeholder="Search tokens, e.g. primary" aria-label="Search tokens">
    <div class="seg" role="group" aria-label="Theme">
      <button type="button" data-theme="light" aria-pressed="true">Light</button>
      <button type="button" data-theme="dark" aria-pressed="false">Dark</button>
      <button type="button" data-theme="both" aria-pressed="false">Side by side</button>
    </div>
  </div>
  <nav class="toc" id="toc"></nav>
</div></header>
<main class="wrap">
  <div class="meta" id="meta"></div>
  <div id="root"></div>
</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="data" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script>
(() => {
const D = JSON.parse(document.getElementById('data').textContent);
const $ = (s, el = document) => el.querySelector(s);
const root = $('#root');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const by = k => D.tokens.filter(t => t.kind === k);
const cv = t => t.bareHsl ? 'hsl(var(' + t.name + '))' : 'var(' + t.name + ')';
let theme = 'light';

// Đổi màu bất kỳ (oklch, lab, var…) sang RGB bằng canvas để tính tương phản
const cnv = document.createElement('canvas'); cnv.width = cnv.height = 1;
const ctx = cnv.getContext('2d', { willReadFrequently: true });
function rgbOf(el, prop) {
  const c = getComputedStyle(el)[prop];
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return { r, g, b, a: a / 255 };
}
const lum = ({ r, g, b }) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

function scope(html, mode) { return '<div class="' + (mode === 'dark' ? 'dark' : '') + '" data-scope="' + mode + '" style="color-scheme:' + mode + '">' + html + '</div>'; }
function themed(fn) {
  if (theme === 'both') return '<div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">' +
    '<div><div class="meta">Light</div>' + scope(fn(), 'light') + '</div><div><div class="meta">Dark</div>' + scope(fn(), 'dark') + '</div></div>';
  return scope(fn(), theme);
}

const sections = [];
function section(id, h, sub, body) { if (!body) return; sections.push({ id, h }); root.insertAdjacentHTML('beforeend', '<section id="' + id + '"><h2>' + h + '</h2>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + body + '</section>'); }

function render() {
  root.innerHTML = ''; sections.length = 0;
  const fgs = new Set(D.pairs.map(p => p[1]));
  const colorT = by('color');

  if (D.pairs.length) section('pairs', 'Color pairs', 'Background + foreground as used together. Contrast is measured live; AA needs 4.5:1 for body text.',
    themed(() => '<div class="pairs">' + D.pairs.map(([bg, fg]) => { const tb = D.tokens.find(t => t.name === bg), tf = D.tokens.find(t => t.name === fg);
      return '<div class="card pair" data-search="' + bg + ' ' + fg + '"><div style="background:var(--background, transparent)"><div class="sw" style="background:' + cv(tb) + ';color:' + cv(tf) + '"><b>Aa</b><span>The quick brown fox</span></div></div>' +
        '<div class="info"><div class="nm" data-copy="' + bg + '">' + bg + '</div><div class="nm" data-copy="' + fg + '">' + fg + '</div><div data-contrast="' + bg + '|' + fg + '"></div></div></div>'; }).join('') + '</div>'));

  const rest = colorT.filter(t => !fgs.has(t.name) && !D.pairs.some(p => p[0] === t.name));
  if (rest.length) section('colors', 'Colors', 'All other color tokens. Click a name to copy it.',
    themed(() => '<div class="grid">' + rest.map(t => '<div class="card" data-search="' + t.name + '"><div class="sw" style="background:' + cv(t) + '"></div><div class="info"><div class="nm" data-copy="' + t.name + '">' + t.name + '</div><div class="val">' + esc(t.light) + (t.dark ? '<br>dark: ' + esc(t.dark) : '') + '</div></div></div>').join('') + '</div>'));

  const fonts = by('font');
  if (fonts.length) section('type', 'Typefaces', '', '<div class="list">' + fonts.map(t => '<div class="row" data-search="' + t.name + '" style="display:block"><div class="nm" data-copy="' + t.name + '">' + t.name + '</div><div class="font-sample" style="font-family:var(' + t.name + ')">Aa Bb Cc 0123 — Health that fits your life</div><div class="val">' + esc(t.light) + '</div></div>').join('') + '</div>');

  const sizes = by('fontsize');
  if (sizes.length) section('sizes', 'Type scale', '', '<div class="list">' + sizes.map(t => '<div class="row" data-search="' + t.name + '"><div style="font-size:var(' + t.name + ');line-height:1.2;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">The quick brown fox</div><div><div class="nm" data-copy="' + t.name + '">' + t.name + '</div><div class="val">' + esc(t.light) + '</div></div></div>').join('') + '</div>');

  const rad = by('radius');
  if (rad.length) section('radius', 'Radius', '', '<div class="grid">' + rad.map(t => '<div class="card" data-search="' + t.name + '"><div style="padding:16px"><div class="rad" style="border-radius:var(' + t.name + ')"></div></div><div class="info"><div class="nm" data-copy="' + t.name + '">' + t.name + '</div><div class="val">' + esc(t.light) + '</div></div></div>').join('') + '</div>');

  const spc = by('spacing');
  if (spc.length) section('spacing', 'Spacing', '', '<div class="list">' + spc.map(t => '<div class="row" data-search="' + t.name + '"><div style="width:180px;flex:none"><div class="nm" data-copy="' + t.name + '">' + t.name + '</div><div class="val">' + esc(t.light) + '</div></div><div class="spc" style="width:var(' + t.name + ');max-width:100%"></div></div>').join('') + '</div>');

  const shd = by('shadow');
  if (shd.length) section('shadow', 'Shadows & elevation', '', themed(() => '<div class="grid">' + shd.map(t => '<div class="card" data-search="' + t.name + '" style="overflow:visible"><div style="padding:22px;background:var(--background, transparent)"><div class="shd" style="box-shadow:var(' + t.name + ')"></div></div><div class="info"><div class="nm" data-copy="' + t.name + '">' + t.name + '</div><div class="val">' + esc(t.light) + '</div></div></div>').join('') + '</div>'));

  if (D.hasShadcn) section('demo', 'In context', 'Common shadcn/ui roles applied to sample components. Shown only to judge the tokens together; not a component spec.', themed(() => {
    const v = (n, f) => D.tokens.some(t => t.name === n) ? cv(D.tokens.find(t => t.name === n)) : f;
    const r = D.tokens.some(t => t.name === '--radius') ? 'var(--radius)' : '8px';
    const btn = (bg, fg, label, extra = '') => '<button type="button" style="font:inherit;font-weight:600;padding:9px 16px;border-radius:' + r + ';border:0;background:' + bg + ';color:' + fg + ';' + extra + '">' + label + '</button>';
    return '<div class="demo" style="background:' + v('--background') + ';color:' + v('--foreground') + ';font-family:var(--font-sans, inherit)">' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px">' +
        btn(v('--primary'), v('--primary-foreground'), 'Save changes') +
        btn(v('--secondary', 'transparent'), v('--secondary-foreground', 'inherit'), 'Preview') +
        btn('transparent', v('--foreground'), 'Cancel', 'box-shadow:inset 0 0 0 1px ' + v('--border', 'currentColor')) +
        btn(v('--destructive', '#b3261e'), v('--destructive-foreground', '#fff'), 'Delete anyway') +
      '</div>' +
      '<div style="background:' + v('--card', v('--background')) + ';color:' + v('--card-foreground', v('--foreground')) + ';border-radius:' + r + ';padding:18px;box-shadow:0 0 0 1px ' + v('--border', 'transparent') + ';max-width:420px">' +
        '<div style="font-weight:600;font-size:16px">Weekly check-in</div><div style="color:' + v('--muted-foreground', 'inherit') + ';margin:2px 0 12px">3 of 7 done</div>' +
        '<label style="display:block;font-size:13px;margin-bottom:6px">Weight (lb)</label>' +
        '<input placeholder="e.g. 186.4" style="width:100%;font:inherit;padding:8px 12px;border-radius:' + r + ';border:1px solid ' + v('--input', v('--border', 'currentColor')) + ';background:transparent;color:inherit;outline:2px solid transparent;box-shadow:0 0 0 3px color-mix(in srgb,' + v('--ring', 'transparent') + ' 30%,transparent)">' +
        '<div style="display:flex;gap:8px;margin-top:12px"><span style="padding:2px 10px;border-radius:999px;background:' + v('--accent', v('--muted', 'transparent')) + ';color:' + v('--accent-foreground', 'inherit') + ';font-size:12px">Accent</span>' +
        '<span style="padding:2px 10px;border-radius:999px;background:' + v('--muted', 'transparent') + ';color:' + v('--muted-foreground', 'inherit') + ';font-size:12px">Muted</span></div>' +
      '</div></div>';
  }));

  const issues = [];
  if (D.missingDark.length) issues.push('<li>' + D.missingDark.length + ' fixed color value(s) have no dark override and will look the same in both themes: <code>' + D.missingDark.slice(0, 12).join(', ') + (D.missingDark.length > 12 ? '…' : '') + '</code></li>');
  section('issues', 'Checks', 'Measured in the browser for the theme(s) on screen. Switch theme to check the other one.', '<div class="list" style="padding:6px 14px"><ul class="issues" id="issues">' + (issues.join('') || '') + '</ul></div>');

  section('all', 'All tokens', D.tokens.length + ' tokens from ' + D.files.join(', '), '<div class="tablewrap"><table><thead><tr><th>Token</th><th>Kind</th><th>Light</th><th>Dark</th><th>File</th></tr></thead><tbody>' +
    D.tokens.map(t => '<tr data-search="' + t.name + ' ' + t.kind + '"><td><code class="nm" data-copy="' + t.name + '">' + t.name + '</code></td><td>' + t.kind + '</td><td>' + (t.kind === 'color' ? '<span class="dot" style="background:' + cv(t) + '"></span>' : '') + '<code>' + esc(t.light ?? '—') + '</code></td><td>' + (t.kind === 'color' && t.dark ? '<span class="dot dark" style="background:' + cv(t) + '"></span>' : '') + '<code>' + esc(t.dark ?? '—') + '</code></td><td>' + esc(t.file) + '</td></tr>').join('') + '</tbody></table></div>');

  $('#toc').innerHTML = sections.map(s => '<a href="#' + s.id + '">' + s.h + '</a>').join('');
  measure(); filter();
}

function over(top, base) { const a = top.a; return { r: top.r * a + base.r * (1 - a), g: top.g * a + base.g * (1 - a), b: top.b * a + base.b * (1 - a), a: 1 }; }
function measure() {
  const fails = [];
  document.querySelectorAll('[data-contrast]').forEach(el => {
    const sw = el.closest('.card').querySelector('.sw');
    const scopeEl = el.closest('[data-scope]');
    // Màu trong suốt (rgba 12%…) được trộn lên nền thật của theme (--background, nếu không có thì trắng/đen)
    let base = rgbOf(sw.parentElement, 'backgroundColor');
    if (base.a < 1) base = over(base, scopeEl.dataset.scope === 'dark' ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 });
    const bg = over(rgbOf(sw, 'backgroundColor'), base), fg = over(rgbOf(sw, 'color'), bg);
    const r = ratio(bg, fg), mode = scopeEl.dataset.scope;
    const pass = r >= 4.5, large = r >= 3;
    el.innerHTML = '<span class="badge ' + (pass ? 'ok' : 'bad') + '">' + r.toFixed(2) + ':1 ' + (pass ? 'AA' : large ? 'AA large only' : 'Fail') + '</span>';
    if (!pass) fails.push(el.dataset.contrast.replace('|', ' / ') + ' (' + mode + ', ' + r.toFixed(2) + ':1)');
  });
  const ul = $('#issues'); if (!ul) return;
  ul.querySelectorAll('.cfail').forEach(n => n.remove());
  if (fails.length) ul.insertAdjacentHTML('afterbegin', '<li class="cfail">Below AA 4.5:1 for body text: ' + fails.map(esc).join('; ') + '</li>');
  if (!ul.children.length) ul.innerHTML = '<li>No issues found in the measured pairs.</li>';
}

function filter() {
  const q = $('#q').value.trim().toLowerCase();
  document.querySelectorAll('[data-search]').forEach(el => el.classList.toggle('hidden', !!q && !el.dataset.search.toLowerCase().includes(q)));
}

function setTheme(t) {
  theme = t;
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === t)));
  document.documentElement.classList.toggle('tk-dark', t === 'dark');
  try { localStorage.setItem('tk-theme', t); } catch {}
  render();
}

document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.theme)));
$('#q').addEventListener('input', filter);
document.addEventListener('click', e => {
  const n = e.target.closest('[data-copy]'); if (!n) return;
  navigator.clipboard?.writeText('var(' + n.dataset.copy + ')').catch(() => {});
  const t = $('#toast'); t.textContent = 'Copied var(' + n.dataset.copy + ')'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1400);
});
$('#meta').textContent = D.tokens.length + ' tokens · ' + D.files.join(', ') + ' · generated ' + D.generated.slice(0, 16).replace('T', ' ') + ' UTC' + (D.note ? ' · ' + D.note : '');
const q0 = new URLSearchParams(location.search).get('theme');
let saved = null; try { saved = localStorage.getItem('tk-theme'); } catch {}
setTheme(q0 || saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
if (document.fonts) document.fonts.ready.then(measure);
})();
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
const count = k => tokens.filter(t => t.kind === k).length;
console.log(`Đã tạo ${outFile}`);
console.log(`${tokens.length} token · màu ${count('color')} · cặp nền/chữ ${pairs.length} · font ${count('font')} · radius ${count('radius')} · spacing ${count('spacing')} · shadow ${count('shadow')} · khác ${tokens.length - ['color','font','radius','spacing','shadow'].reduce((a,k)=>a+count(k),0)}`);
if (missingDark.length) console.log(`Cảnh báo: ${missingDark.length} màu chưa có giá trị dark.`);
console.log('Tương phản được đo khi mở trang (mục Checks).');
