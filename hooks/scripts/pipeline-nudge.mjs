#!/usr/bin/env node
// Danh Method · pipeline-nudge
// SessionStart + UserPromptSubmit hook: nhìn trạng thái thật trên đĩa và nhắc đúng bước tiếp theo.
// Chỉ in khi trạng thái ĐỔI so với lần nhắc trước (lưu ở <code>/.danh/nudge-state.json) để không làm ồn.
// In ra stdout = thêm ngữ cảnh cho agent. Mọi lỗi → im lặng, exit 0.
//
// Tín hiệu:
//  1. Feature có SCENARIOS đã duyệt nhưng ID chưa có trong tests/spec-manifest.json → gọi skill scenario-tests.
//  2. Spec Issue đang mở → mục đó BLOCKED-SPEC, làm việc khác.
//  3. Diff hiện tại xếp tier 3 hoặc chạm đường ghi dữ liệu mà đường khai < Đủ → nâng đường.
//  4. Có diff đang làm mà chưa khai đường (.danh/track.json) → hỏi khai Nhẹ/Vừa/Đủ.
//
//   node pipeline-nudge.mjs [--hook] [--code <repo>] [--spec <repo spec>] [--json] [--force]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ID = /^[A-Z][A-Z0-9]*-[A-Z0-9]+-\d+$/;
const WRITE_PATH = /(^|\/)(migrations?|schema|repositor(y|ies)|domain|actions?|jobs?|services?|db)(\/|\.|$)|\.sql$/i;
const RANK = { 'Nhẹ': 1, 'Nhe': 1, light: 1, 'Vừa': 2, 'Vua': 2, medium: 2, 'Đủ': 3, 'Du': 3, full: 3 };

function git(cwd, args) { const r = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 8000 }); return r.status === 0 ? r.stdout : ''; }
export function findCodeRoot(start) {
  const top = git(start, ['rev-parse', '--show-toplevel']).trim();
  return top ? path.resolve(top) : path.resolve(start);
}
export function findSpecRoot(code, explicit) {
  const c = [explicit, process.env.SPEC_REPO, path.join(path.dirname(code), `${path.basename(code)}-spec`), code].filter(Boolean);
  return c.map((p) => path.resolve(p)).find((p) => fs.existsSync(path.join(p, 'features'))) || null;
}

export function approvedScenarios(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const cells = line.split('|').map((x) => x.trim());
    if (!ID.test(cells[1] || '')) continue;
    const approval = (cells[3] || '').toLowerCase();
    if (!approval || /chờ|cho duyet|pending|draft/.test(approval)) continue;
    out.push({ id: cells[1], version: Number(cells[4]) || 1 });
  }
  return out;
}
export function openIssues(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^SI-\d+\.md$/.test(f)).filter((f) => {
    const t = fs.readFileSync(path.join(dir, f), 'utf8');
    const line = t.split(/\r?\n/).find((l) => /Trạng thái:/i.test(l)) || '';
    const inParen = line.match(/\((?:hiện tại:\s*)?(open|decided|closed)\b/i)?.[1];
    const tail = line.replace(/\(.*$/, '').match(/(open|decided|closed)\s*$/i)?.[1];
    const cur = (inParen || tail || 'open').toLowerCase();
    return cur !== 'closed';
  }).map((f) => path.basename(f, '.md'));
}

export function collect({ code, spec }) {
  const notes = [];
  let manifest = [];
  try { manifest = JSON.parse(fs.readFileSync(path.join(code, 'tests', 'spec-manifest.json'), 'utf8').replace(/^\uFEFF/, '')); } catch {}
  const locked = new Set((Array.isArray(manifest) ? manifest : []).map((e) => e?.id));
  if (spec) {
    const fdir = path.join(spec, 'features');
    for (const f of fs.readdirSync(fdir).sort()) {
      const sc = path.join(fdir, f, 'SCENARIOS.md');
      if (fs.existsSync(sc)) {
        const missing = approvedScenarios(sc).filter((s) => !locked.has(s.id));
        if (missing.length) notes.push({ kind: 'scenario-tests', feature: f, text: `Feature ${f}: ${missing.length} kịch bản đã duyệt chưa có test khoá (${missing.slice(0, 5).map((s) => `${s.id} v${s.version}`).join(', ')}${missing.length > 5 ? ', …' : ''}). Gọi skill scenario-tests, giao test-translator TRƯỚC khi implementer làm.` });
      }
      const si = openIssues(path.join(fdir, f, 'spec-issues'));
      if (si.length) notes.push({ kind: 'blocked-spec', feature: f, text: `Feature ${f}: Spec Issue đang mở ${si.join(', ')} → các mục liên quan là BLOCKED-SPEC; không sửa test/manifest để xanh, làm phần độc lập.` });
    }
  }
  const changed = [...new Set([
    ...git(code, ['diff', '--name-only', 'HEAD']).split('\n'),
    ...git(code, ['ls-files', '--others', '--exclude-standard']).split('\n'),
  ].map((s) => s.trim()).filter(Boolean))].filter((f) => !f.startsWith('.danh/'));
  if (changed.length) {
    let track = null;
    try { track = JSON.parse(fs.readFileSync(path.join(code, '.danh', 'track.json'), 'utf8')); } catch {}
    let tier = null;
    if (fs.existsSync(path.join(code, '.verify', 'verify.mjs'))) {
      const r = spawnSync(process.execPath, ['.verify/verify.mjs', '--classify'], { cwd: code, encoding: 'utf8', timeout: 20000 });
      try { tier = JSON.parse(r.stdout).tier; } catch {}
    }
    const writes = changed.filter((f) => WRITE_PATH.test(f));
    const need = tier === 3 || writes.length ? 3 : tier === 2 ? 2 : 1;
    const label = ['', 'Nhẹ', 'Vừa', 'Đủ'][need];
    if (!track?.track) notes.push({ kind: 'declare-track', text: `Có ${changed.length} file đang đổi nhưng task chưa khai đường. Khai Nhẹ/Vừa/Đủ vào .danh/track.json (gợi ý theo diff: ${label}${tier !== null ? `, tier ${tier}` : ''}). Xem skill subagent-orchestration §Chọn đường.` });
    else if ((RANK[track.track] || 0) < need) notes.push({ kind: 'raise-track', text: `Đường khai "${track.track}" thấp hơn diff thật (${tier !== null ? `tier ${tier}` : 'chưa có verifier'}${writes.length ? `; chạm đường ghi dữ liệu: ${writes.slice(0, 3).join(', ')}` : ''}). Nâng lên ${label} và làm bù các bước còn thiếu. Chỉ được nâng, không hạ.` });
  }
  return notes;
}

function parse(argv) {
  const o = { hook: false, json: false, force: false, code: null, spec: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--hook') o.hook = true; else if (a === '--json') o.json = true; else if (a === '--force') o.force = true;
    else if (a === '--code') o.code = argv[++i]; else if (a === '--spec') o.spec = argv[++i];
  }
  return o;
}

async function main() {
  const o = parse(process.argv.slice(2));
  let cwd = process.cwd();
  if (o.hook) { try { const raw = fs.readFileSync(0, 'utf8'); const inp = JSON.parse(raw || '{}'); if (inp.cwd) cwd = inp.cwd; } catch {} }
  const code = findCodeRoot(o.code || cwd);
  const spec = findSpecRoot(code, o.spec);
  if (!spec && !fs.existsSync(path.join(code, '.danh'))) return; // không phải dự án danh-method
  const notes = collect({ code, spec });
  if (o.json) { console.log(JSON.stringify({ code, spec, notes }, null, 2)); return; }
  const digest = crypto.createHash('sha1').update(JSON.stringify(notes.map((n) => n.text))).digest('hex');
  const stateFile = path.join(code, '.danh', 'nudge-state.json');
  let prev = null; try { prev = JSON.parse(fs.readFileSync(stateFile, 'utf8')).digest; } catch {}
  if (!o.force && prev === digest) return;
  try { fs.mkdirSync(path.dirname(stateFile), { recursive: true }); fs.writeFileSync(stateFile, JSON.stringify({ digest, at: new Date().toISOString() })); } catch {}
  if (!notes.length) return;
  console.log(`[danh-method] Bước tiếp theo theo trạng thái thật:\n${notes.map((n) => `- ${n.text}`).join('\n')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {}).finally(() => { process.exitCode = 0; });
}
