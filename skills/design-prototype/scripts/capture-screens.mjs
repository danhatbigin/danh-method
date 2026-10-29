#!/usr/bin/env node
// Chụp ảnh review cho prototype HTML: 1440 / 768 / 390 × light / dark, và kiểm tràn ngang.
//
// Dùng:
//   node capture-screens.mjs <file.html> <thư-mục-ra> [--states "S1:role=coach,S3:role=coach&drawer=D1"]
//                            [--viewports 1440,768,390] [--themes light,dark] [--full]
//
// - Mỗi state dạng "<tên>:<query string>" (query không có dấu ?). Không truyền --states thì chụp trang mặc định với tên "page".
// - Theme được gửi qua query `theme=<light|dark>` VÀ giả lập prefers-color-scheme, nên prototype dùng cách nào cũng được.
// - Kết quả: <tên>-<viewport>-<theme>.png và overflow-report.json trong thư mục ra. Thoát mã 2 nếu có màn tràn ngang.
// Cần Playwright (require('playwright') hoặc import 'playwright').

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
if (args.length < 2 || args.includes('--help')) {
  console.log('node capture-screens.mjs <file.html> <out-dir> [--states "name:query,..."] [--viewports 1440,768,390] [--themes light,dark] [--full]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const [htmlArg, outArg] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const full = args.includes('--full');
const viewports = opt('--viewports', '1440,768,390').split(',').map(Number);
const themes = opt('--themes', 'light,dark').split(',');
const states = opt('--states', 'page:').split(',').map(s => {
  const i = s.indexOf(':');
  return i < 0 ? { name: s.trim(), query: '' } : { name: s.slice(0, i).trim(), query: s.slice(i + 1).trim() };
});
const heights = { 1440: 900, 1024: 768, 768: 1024, 390: 844, 320: 640 };

// Tìm Playwright: import thường → thư mục hiện tại → NODE_PATH → npm global.
async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const { createRequire } = await import('node:module');
  const { execSync } = await import('node:child_process');
  const dirs = [process.cwd(), ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)];
  try { dirs.push(execSync('npm root -g', { encoding: 'utf8' }).trim()); } catch {}
  for (const d of dirs) {
    try { return createRequire(path.join(d, 'noop.js'))('playwright'); } catch {}
  }
  return null;
}
const playwright = await loadPlaywright();
if (!playwright) {
  console.error('Không tìm thấy Playwright. Cài: npm i -D playwright (hoặc dùng bản đã cài sẵn trên máy).');
  process.exit(3);
}

const htmlPath = path.resolve(htmlArg);
if (!fs.existsSync(htmlPath)) { console.error(`Không thấy file: ${htmlPath}`); process.exit(1); }
const outDir = path.resolve(outArg);
fs.mkdirSync(outDir, { recursive: true });
const baseUrl = pathToFileURL(htmlPath).href;

const browser = await playwright.chromium.launch();
const report = [];
let overflowCount = 0;
try {
  for (const theme of themes) {
    for (const vw of viewports) {
      const ctx = await browser.newContext({
        viewport: { width: vw, height: heights[vw] || 900 },
        colorScheme: theme === 'dark' ? 'dark' : 'light',
        deviceScaleFactor: vw <= 390 ? 2 : 1,
      });
      const page = await ctx.newPage();
      for (const st of states) {
        const q = new URLSearchParams(st.query);
        q.set('theme', theme);
        const url = `${baseUrl}?${q.toString()}`;
        await page.goto(url, { waitUntil: 'networkidle' }).catch(() => page.goto(url));
        await page.waitForTimeout(300);
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        const overflow = m.sw > m.iw;
        if (overflow) overflowCount++;
        const file = `${st.name}-${vw}-${theme}.png`;
        await page.screenshot({ path: path.join(outDir, file), fullPage: full });
        report.push({ state: st.name, viewport: vw, theme, file, scrollWidth: m.sw, innerWidth: m.iw, overflow });
        console.log(`${overflow ? 'TRÀN' : 'ok  '}  ${file}${overflow ? `  (scrollWidth ${m.sw} > ${m.iw})` : ''}`);
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(outDir, 'overflow-report.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.length} ảnh · ${overflowCount} màn tràn ngang · báo cáo: overflow-report.json`);
process.exit(overflowCount ? 2 : 0);
