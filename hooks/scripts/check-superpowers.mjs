#!/usr/bin/env node
// Danh Method · check-superpowers
// Kiểm tra companion plugin Superpowers (obra/superpowers) đã có trên máy chưa.
//
//   node check-superpowers.mjs            → in kết quả cho người đọc
//   node check-superpowers.mjs --json     → {"installed":bool,"locations":[...],"skills":[...]}
//   node check-superpowers.mjs --hook     → dùng cho SessionStart: chỉ in ghi chú ngữ cảnh khi CHƯA cài; đã cài thì im lặng.
//
// Chỉ đọc. Không cài gì, không gọi mạng.
// Cho phép override home/cwd qua DANH_HOME / DANH_CWD để kiểm thử độc lập.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const home = process.env.DANH_HOME || os.homedir();
const cwd = process.env.DANH_CWD || process.cwd();
const exists = p => { try { return fs.existsSync(p); } catch { return false; } };

function findDirs(root, depth) {
  const out = [];
  const walk = (dir, d) => {
    if (d < 0) return;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
      const p = path.join(dir, e.name);
      if (/^superpowers$/i.test(e.name)) {
        if (exists(path.join(p, 'skills')) || exists(path.join(p, 'SKILL.md')) || exists(path.join(p, 'package.json'))) {
          out.push(p);
          continue;
        }
        // Subdirectories (e.g. cache/marketplace/superpowers/<version>/skills)
        let subents;
        try { subents = fs.readdirSync(p, { withFileTypes: true }); } catch {}
        let foundSub = false;
        if (subents) {
          for (const se of subents) {
            if (se.isDirectory()) {
              const sp = path.join(p, se.name);
              if (exists(path.join(sp, 'skills')) || exists(path.join(sp, 'SKILL.md'))) {
                out.push(sp);
                foundSub = true;
              }
            }
          }
        }
        if (foundSub) continue;
      }
      if (/^(brainstorming|writing-plans)$/i.test(e.name) && exists(path.join(p, 'SKILL.md'))) {
        out.push(p);
        continue;
      }
      walk(p, d - 1);
    }
  };
  if (exists(root)) walk(root, depth);
  return out;
}

const roots = [
  [path.join(home, '.claude', 'plugins'), 5],
  [path.join(home, '.claude', 'skills'), 2],
  [path.join(home, '.codex'), 4],
  [path.join(home, '.gemini'), 4],
  [path.join(cwd, '.claude'), 3],
  [path.join(cwd, '.agents'), 3],
  [path.join(cwd, '.agent'), 3],
  [path.join(cwd, '.codex'), 3],
  [path.join(cwd, '.gemini'), 3],
];

let locations = [...new Set(roots.flatMap(([r, d]) => findDirs(r, d)))];

// installed_plugins.json của Claude Code
const ip = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
if (exists(ip)) {
  try {
    const raw = fs.readFileSync(ip, 'utf8');
    if (/superpowers/.test(raw)) {
      locations.push(ip);
      const parsed = JSON.parse(raw);
      if (parsed?.plugins) {
        for (const [key, list] of Object.entries(parsed.plugins)) {
          if (/superpowers/i.test(key) && Array.isArray(list)) {
            for (const item of list) {
              if (item.installPath && exists(item.installPath)) {
                locations.push(item.installPath);
              }
            }
          }
        }
      }
    }
  } catch {}
}

locations = [...new Set(locations)];

function findSkillsInLocation(loc) {
  const found = new Set();
  if (!exists(loc)) return found;

  let stat;
  try { stat = fs.statSync(loc); } catch { return found; }
  if (!stat.isDirectory()) return found;

  // 1. Thư mục skills/ con
  const skillsDir = path.join(loc, 'skills');
  if (exists(skillsDir)) {
    try {
      const ents = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const e of ents) {
        if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
        const skillPath = path.join(skillsDir, e.name);
        if (exists(path.join(skillPath, 'SKILL.md'))) {
          found.add(e.name);
        } else {
          found.add(e.name);
        }
      }
    } catch {}
  }

  // 2. Chính loc chứa SKILL.md
  if (exists(path.join(loc, 'SKILL.md'))) {
    try {
      const content = fs.readFileSync(path.join(loc, 'SKILL.md'), 'utf8');
      const m = content.match(/^---\s*\n(?:[\s\S]*?\n)?name:\s*([^\r\n]+)/m);
      if (m && m[1].trim()) {
        found.add(m[1].trim());
      } else {
        found.add(path.basename(loc));
      }
    } catch {
      found.add(path.basename(loc));
    }
  }

  return found;
}

const allSkills = new Set();
for (const loc of locations) {
  for (const s of findSkillsInLocation(loc)) {
    allSkills.add(s);
  }
}
const skills = [...allSkills].sort();

const installed = locations.length > 0;
const result = { installed, locations, skills };

const args = process.argv.slice(2);
if (args.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (args.includes('--hook')) {
  if (!installed) {
    console.log([
      '[danh-method] Chưa thấy plugin Superpowers (obra/superpowers) trên máy này.',
      'Danh Method dùng nó như bộ kỷ luật thi hành: (1) brainstorming trước feature-spec/PRD, (2) writing-plans & executing-plans khi lập và chạy kế hoạch, (3) test-driven-development khi thi hành task, (4) systematic-debugging khi gặp lỗi/test hỏng, (5) subagent-driven-development điều phối subagent theo bề mặt, (6) requesting/receiving-code-review & verification-before-completion trước khi nghiệm thu, (7) using-git-worktrees cô lập không gian làm việc.',
      'Khi bắt đầu dự án hoặc chuẩn bị thi hành: HỎI XIN PHÉP cài trước (nêu lý do trên), không tự cài. Cách cài theo môi trường: xem danh-method/references/install-superpowers.md.',
      'Người dùng từ chối thì vẫn làm tiếp theo quy trình cơ bản; ghi rõ trong báo cáo là "không có Superpowers" và không hỏi lại trong phiên.',
    ].join('\n'));
  }
  process.exit(0);
}

console.log(installed ? `superpowers: ĐÃ CÓ\n- ${locations.join('\n- ')}` : 'superpowers: CHƯA CÓ');
console.log(`skills (${skills.length}): ${skills.length > 0 ? skills.join(', ') : 'không thấy'}`);
