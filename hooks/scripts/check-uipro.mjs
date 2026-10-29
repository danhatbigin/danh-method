#!/usr/bin/env node
// Danh Method · check-uipro
// Kiểm tra plugin/skill ui-ux-pro-max (nextlevelbuilder/ui-ux-pro-max-skill) đã có trên máy chưa.
//
//   node check-uipro.mjs            → in kết quả cho người đọc
//   node check-uipro.mjs --json     → {"installed":bool,"locations":[...],"searchScript":path|null,"designSystemSkill":path|null,"cli":bool}
//   node check-uipro.mjs --hook     → dùng cho SessionStart: chỉ in ghi chú ngữ cảnh khi CHƯA cài; đã cài thì im lặng.
//
// Chỉ đọc. Không cài gì, không gọi mạng.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const home = os.homedir();
const cwd = process.cwd();
const exists = p => { try { return fs.existsSync(p); } catch { return false; } };

// Tìm thư mục tên ui-ux-pro-max (hoặc ui-ux-pro-max-skill) trong một gốc, giới hạn độ sâu
function findDirs(root, depth) {
  const out = [];
  const walk = (dir, d) => {
    if (d < 0) return;
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
      const p = path.join(dir, e.name);
      if (/^ui-ux-pro-max(-skill)?$/i.test(e.name)) out.push(p);
      else walk(p, d - 1);
    }
  };
  if (exists(root)) walk(root, depth);
  return out;
}

const roots = [
  [path.join(home, '.claude', 'plugins'), 5],          // Claude Code / Cowork (marketplace, cache, synced)
  [path.join(home, '.claude', 'skills'), 1],
  [path.join(home, '.codex', 'skills'), 1],            // Codex
  [path.join(home, '.gemini'), 4],                     // Antigravity / Gemini
  [path.join(cwd, '.claude', 'skills'), 1],            // cài theo project (uipro init)
  [path.join(cwd, '.codex', 'skills'), 1],
  [path.join(cwd, '.agent', 'skills'), 1],
  [path.join(cwd, '.agents', 'skills'), 1],
  [path.join(cwd, '.gemini'), 3],
];
let locations = [...new Set(roots.flatMap(([r, d]) => findDirs(r, d)))];

// installed_plugins.json của Claude Code
const ip = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
if (exists(ip)) { try { if (/ui-ux-pro-max/.test(fs.readFileSync(ip, 'utf8'))) locations.push(ip); } catch {} }

let cli = false;
try { execSync(process.platform === 'win32' ? 'where uipro' : 'command -v uipro', { stdio: 'ignore' }); cli = true; } catch {}

// Đường dẫn script tra cứu và skill design-system (nếu có)
const candidates = d => [
  path.join(d, '.claude', 'skills', 'ui-ux-pro-max', 'scripts', 'search.py'),
  path.join(d, 'src', 'ui-ux-pro-max', 'scripts', 'search.py'),
  path.join(d, 'scripts', 'search.py'),
  path.join(d, 'skills', 'ui-ux-pro-max', 'scripts', 'search.py'),
];
const dsCandidates = d => [
  path.join(d, '.claude', 'skills', 'design-system'),
  path.join(d, 'skills', 'design-system'),
  path.join(path.dirname(d), 'design-system'),
];
let searchScript = null, designSystemSkill = null;
for (const d of locations) {
  if (!searchScript) searchScript = candidates(d).find(exists) || null;
  if (!designSystemSkill) designSystemSkill = dsCandidates(d).find(p => exists(path.join(p, 'scripts', 'generate-tokens.cjs'))) || null;
}

const installed = locations.length > 0;
const result = { installed, locations, searchScript, designSystemSkill, cli };

const args = process.argv.slice(2);
if (args.includes('--json')) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
if (args.includes('--hook')) {
  if (!installed) {
    console.log([
      '[danh-method] Chưa thấy plugin ui-ux-pro-max trên máy này.',
      'Danh Method dùng nó để: (1) gợi ý hệ màu/font/phong cách theo loại sản phẩm (--design-system), (2) sinh token 3 lớp và xuất CSS (design-system/generate-tokens.cjs), (3) soát token bị viết cứng trong code, (4) tra cứu UX khi audit.',
      'Khi người dùng bắt đầu việc design token, preview hay audit UX: HỎI XIN PHÉP cài trước (nêu lý do trên), không tự cài. Cách cài theo môi trường: xem skill danh-method:design-tokens mục 0.',
      'Người dùng từ chối thì vẫn làm được bằng cách thủ công; ghi rõ trong báo cáo là không có tra cứu ui-ux-pro-max.',
    ].join('\n'));
  }
  process.exit(0);
}
console.log(installed ? `ui-ux-pro-max: ĐÃ CÓ\n- ${locations.join('\n- ')}` : 'ui-ux-pro-max: CHƯA CÓ');
console.log(`search.py: ${searchScript || 'không thấy'}`);
console.log(`design-system skill (generate-tokens.cjs): ${designSystemSkill || 'không thấy'}`);
console.log(`CLI uipro: ${cli ? 'có' : 'không'}`);
