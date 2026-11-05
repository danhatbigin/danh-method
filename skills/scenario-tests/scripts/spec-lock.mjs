#!/usr/bin/env node
// Danh Method · spec-lock
// Mở/đóng "cửa sổ Test" cho test khoá (tests/spec/**, tests/spec-manifest.json).
// Hook guard-spec-tests chỉ cho ghi vào vùng khoá khi cửa sổ đang mở và chưa hết hạn.
//
//   node spec-lock.mjs --unlock <feature> --reason "<scenario ID/version được duyệt>" [--minutes 60] [--by <session>]
//   node spec-lock.mjs --lock            đóng cửa sổ (gọi ngay sau khi manifest đã khoá)
//   node spec-lock.mjs --status [--json]
//
// Trạng thái ở <repo>/.danh/spec-lock.json, nhật ký append-only ở <repo>/.danh/spec-lock.log.
// Giới hạn thật: policy-only. Agent có quyền shell vẫn có thể tự mở; mọi lần mở đều ghi log và
// spec-guard vẫn bắt hash đổi. Không quảng cáo đây là khoá tuyệt đối.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function stateFile(root) { return path.join(root, '.danh', 'spec-lock.json'); }
export function readState(root, now = Date.now()) {
  try {
    const s = JSON.parse(fs.readFileSync(stateFile(root), 'utf8'));
    const open = s && s.until && Date.parse(s.until) > now;
    return { open: Boolean(open), ...s };
  } catch { return { open: false }; }
}
function log(root, line) {
  fs.mkdirSync(path.join(root, '.danh'), { recursive: true });
  fs.appendFileSync(path.join(root, '.danh', 'spec-lock.log'), `${new Date().toISOString()} ${line}\n`);
}
export function unlock(root, { feature, reason, minutes = 60, by = 'unknown', now = Date.now() }) {
  if (!feature) throw new Error('--unlock cần tên feature');
  if (!reason) throw new Error('--reason bắt buộc: ghi scenario ID/version đã được duyệt');
  const mins = Math.min(Math.max(Number(minutes) || 60, 5), 240);
  const state = { feature, reason, by, opened: new Date(now).toISOString(), until: new Date(now + mins * 60000).toISOString() };
  fs.mkdirSync(path.join(root, '.danh'), { recursive: true });
  fs.writeFileSync(stateFile(root), `${JSON.stringify(state, null, 2)}\n`);
  log(root, `UNLOCK feature=${feature} minutes=${mins} by=${by} reason=${JSON.stringify(reason)}`);
  return state;
}
export function lock(root) {
  const prev = readState(root);
  try { fs.writeFileSync(stateFile(root), `${JSON.stringify({ closed: new Date().toISOString(), last: prev.feature || null }, null, 2)}\n`); } catch {}
  log(root, `LOCK feature=${prev.feature || '-'}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2); const get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const root = process.cwd();
  try {
    if (a.includes('--unlock')) { const s = unlock(root, { feature: get('--unlock'), reason: get('--reason'), minutes: get('--minutes'), by: get('--by') }); console.log(`spec-lock: OPEN · ${s.feature} · tới ${s.until}`); }
    else if (a.includes('--lock')) { lock(root); console.log('spec-lock: LOCKED'); }
    else { const s = readState(root); console.log(a.includes('--json') ? JSON.stringify(s) : `spec-lock: ${s.open ? `OPEN · ${s.feature} · tới ${s.until}` : 'LOCKED'}`); }
  } catch (e) { console.error(`spec-lock: ${e.message}`); process.exitCode = 1; }
}
