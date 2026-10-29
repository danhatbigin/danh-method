#!/usr/bin/env node
// Danh Method · scaffold-playground.mjs
// Thiết lập trang Playground xem trước và duyệt design token động theo tiêu chuẩn gate G0.
//
// Dùng:
//   node scaffold-playground.mjs --root <product-project> [--css <token.css> ...] [--out-dir <dir>] [--dry] [--force]
//
// Yêu cầu:
//   - Chạy check-ui-packages.mjs; nếu dự án chưa sẵn sàng thì thoát mã khác 0 và không ghi file.
//   - Trích xuất token CSS (:root và .dark) đã khai báo, không tự phát minh token.
//   - Băm SHA-256 các file token và component thật để lập provenance (schemaVersion 1).
//   - Sao chép template source vào --out-dir (mặc định: design-system/playground).
//   - Từ chối ghi đè nếu thư mục đã có file trừ khi có cờ --force.
//   - Không tự cài dependency, in lệnh build/dev phù hợp với tooling có sẵn (Vite / Next.js).

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- 1. Phân tích tham số dòng lệnh ----------
export function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    ui: null,
    css: [],
    outDir: 'design-system/playground',
    dry: false,
    force: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root' && argv[i + 1]) {
      args.root = argv[++i];
    } else if (a.startsWith('--root=')) {
      args.root = a.slice('--root='.length);
    } else if (a === '--ui' && argv[i + 1]) {
      args.ui = argv[++i].toLowerCase();
    } else if (a.startsWith('--ui=')) {
      args.ui = a.slice('--ui='.length).toLowerCase();
    } else if (a === '--css' && argv[i + 1]) {
      args.css.push(argv[++i]);
    } else if (a.startsWith('--css=')) {
      args.css.push(a.slice('--css='.length));
    } else if (a === '--out-dir' && argv[i + 1]) {
      args.outDir = argv[++i];
    } else if (a.startsWith('--out-dir=')) {
      args.outDir = a.slice('--out-dir='.length);
    } else if (a === '--dry') {
      args.dry = true;
    } else if (a === '--force') {
      args.force = true;
    }
  }

  args.root = path.resolve(args.root);
  args.resolvedOutDir = path.resolve(args.root, args.outDir);
  return args;
}

// ---------- 2. Kiểm tra tính sẵn sàng UI (Readiness Check) ----------
export function runReadinessCheck(rootDir, uiTarget = null) {
  if (process.env.DANH_CHECK_UI_RESULT) {
    try {
      const parsed = JSON.parse(process.env.DANH_CHECK_UI_RESULT);
      if (uiTarget) {
        if (uiTarget === 'shadcn') {
          parsed.ready = Boolean(parsed.shadcn?.installed);
        } else if (uiTarget === 'heroui') {
          parsed.ready = Boolean(parsed.heroui?.installed && parsed.heroui?.wired);
        } else if (uiTarget === 'both') {
          parsed.ready = Boolean(parsed.shadcn?.installed && parsed.heroui?.installed && parsed.heroui?.wired);
        }
      }
      return parsed;
    } catch (e) {
      throw new Error(`DANH_CHECK_UI_RESULT không hợp lệ: ${e.message}`);
    }
  }

  const checkScript =
    process.env.DANH_CHECK_UI_BIN ||
    path.join(__dirname, 'check-ui-packages.mjs');

  if (!fs.existsSync(checkScript)) {
    throw new Error(`Không tìm thấy script kiểm tra thư viện UI: ${checkScript}`);
  }

  const checkArgs = [checkScript, '--root', rootDir, '--json'];
  if (uiTarget) {
    checkArgs.push('--ui', uiTarget);
  }

  const proc = spawnSync(process.execPath, checkArgs, {
    encoding: 'utf8',
  });

  if (proc.error) throw proc.error;
  const stdout = (proc.stdout || '').trim();
  if (!stdout) {
    throw new Error(proc.stderr || 'check-ui-packages không trả về kết quả');
  }

  try {
    return JSON.parse(stdout);
  } catch (e) {
    throw new Error(`Lỗi parse output từ check-ui-packages: ${stdout}`);
  }
}

// ---------- 3. Trích xuất CSS Tokens ----------
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function scopeOf(stack) {
  const media = stack.slice(0, -1).filter((s) => s.startsWith('@media') || s.startsWith('@supports'));
  const darkMedia = media.some((m) => /prefers-color-scheme\s*:\s*dark/i.test(m));
  if (media.length && !darkMedia) return null;

  const sel = (stack[stack.length - 1] || '').toLowerCase().trim();
  const parts = sel.split(',').map((x) => x.trim());
  const isDark = (x) =>
    /(^|[\s(:])\.dark\b|^\.dark\b|\[data-theme=["']?dark|\[data-mode=["']?dark|\.theme-dark/.test(x);
  const isRoot = (x) => /^(:root|html|:host|@theme(\s+inline)?)$/.test(x);

  const hasDark = parts.some(isDark);
  const hasRoot = parts.some(isRoot);

  if (darkMedia) return hasRoot ? 'dark' : null;
  if (hasDark && hasRoot) return 'both';
  if (hasDark) return 'dark';
  if (hasRoot) return 'light';
  return null;
}

export function parseCssTokens(cssContent, fileName, store = new Map()) {
  const clean = stripComments(cssContent);
  const stack = [];
  let buf = '';

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
      continue;
    }
    if (ch === '}') {
      flush();
      stack.pop();
      buf = '';
      continue;
    }
    if (ch === ';') {
      flush();
      buf = '';
      continue;
    }
    buf += ch;
  }

  function flush() {
    const m = buf.trim().match(/^(--[A-Za-z0-9_-]+)\s*:\s*([\s\S]+)$/);
    if (!m || !stack.length) return;
    const scope = scopeOf(stack);
    if (!scope) return;
    const name = m[1];
    const value = m[2].trim().replace(/\s+/g, ' ').replace(/\s*!important$/, '');
    if (new RegExp(`^var\\(\\s*${name}\\s*\\)$`).test(value)) return;

    const t = store.get(name) || { name, light: null, dark: null, file: fileName };
    if (scope === 'both') {
      t.light = value;
      t.dark = value;
    } else {
      t[scope] = value;
    }
    store.set(name, t);
  }

  return store;
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

// ---------- 4. Trình tạo code xem trước Shadcn và HeroUI động ----------
function buildHeroUIV2PreviewCode() {
  return `import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Checkbox,
  Switch,
  Slider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';

export const isHeroUIInstalled = true;

export function HeroUIPreview() {
  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-labelledby="heroui-v2-cards">
        <h3 id="heroui-v2-cards" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI v2 · Bảng điều khiển
        </h3>
        <Card className="border p-4">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-semibold">HeroUI v2 Preview</CardTitle>
            <Chip color="default">v2</Chip>
          </CardHeader>
          <CardContent><p className="text-sm">Hiển thị component HeroUI phiên bản v2.</p></CardContent>
          <CardFooter className="flex gap-2">
            <Button color="primary">Primary</Button>
            <Button variant="bordered">Bordered</Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
`;
}

export function buildHeroUIPreviewCode(herouiInfo = {}) {
  const majorVersion = herouiInfo?.majorVersion;
  if (majorVersion === 2) {
    return buildHeroUIV2PreviewCode();
  }

  const comps = Array.isArray(herouiInfo?.components) ? herouiInfo.components : [];
  const has = (name) => comps.length === 0 || comps.includes(name);

  const herouiImports = ['Button'];
  if (has('card')) herouiImports.push('Card');
  if (has('chip')) herouiImports.push('Chip');
  if (has('alert')) herouiImports.push('Alert');
  if (has('textfield')) herouiImports.push('TextField');
  if (has('label')) herouiImports.push('Label');
  if (has('input')) herouiImports.push('Input');
  if (has('description')) herouiImports.push('Description');
  if (has('select')) herouiImports.push('Select');
  if (has('list-box')) herouiImports.push('ListBox');
  if (has('checkbox')) herouiImports.push('Checkbox');
  if (has('switch')) herouiImports.push('Switch');
  if (has('slider')) herouiImports.push('Slider');
  if (has('tabs')) herouiImports.push('Tabs');
  if (has('table')) herouiImports.push('Table');
  if (has('modal')) herouiImports.push('Modal');
  if (has('dropdown')) herouiImports.push('Dropdown');

  return `import React, { useState } from 'react';
import {
  ${herouiImports.join(',\n  ')},
} from '@heroui/react';

export const isHeroUIInstalled = true;

export function HeroUIPreview() {
  const [sliderVal, setSliderVal] = useState([75]);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <div className="space-y-8">
      ${
        has('alert')
          ? `{/* 1. Alerts */}
      <section className="space-y-3" aria-labelledby="heroui-alerts">
        <h3 id="heroui-alerts" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Thông báo (Alerts)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert status="accent">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="font-semibold">Hệ thống đồng bộ thành công</Alert.Title>
              <Alert.Description>
                Các token visual đã được kết nối với toàn bộ component HeroUI trong dự án.
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title className="font-semibold">Cảnh báo Gate G0</Alert.Title>
              <Alert.Description>
                Thay đổi thông số màu sắc cần được xuất ra proposal và phê duyệt trước khi commit.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      </section>`
          : ''
      }

      ${
        has('card')
          ? `{/* 2. Dashboard Cards */}
      <section className="space-y-3" aria-labelledby="heroui-cards">
        <h3 id="heroui-cards" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Bảng điều khiển (Cards)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border">
            <Card.Header className="flex justify-between items-center pb-2">
              <Card.Title className="text-sm font-semibold">Tăng trưởng khách hàng</Card.Title>
              ${has('chip') ? `<Chip color="default" variant="primary">+28.4%</Chip>` : ''}
            </Card.Header>
            <Card.Content className="py-2">
              <div className="text-2xl font-bold">14,820</div>
              <Card.Description className="text-xs text-muted-foreground mt-1">Khách hàng kích hoạt</Card.Description>
            </Card.Content>
            <Card.Footer className="pt-0 text-[11px] text-muted-foreground">
              Mục tiêu Q4 đạt 100%
            </Card.Footer>
          </Card>

          <Card className="border">
            <Card.Header className="flex justify-between items-center pb-2">
              <Card.Title className="text-sm font-semibold">Thời gian phản hồi</Card.Title>
              ${has('chip') ? `<Chip color="success" variant="soft">Tối ưu</Chip>` : ''}
            </Card.Header>
            <Card.Content className="py-2">
              <div className="text-2xl font-bold">120ms</div>
              <Card.Description className="text-xs text-muted-foreground mt-1">Giảm 35ms so với tuần trước</Card.Description>
            </Card.Content>
            <Card.Footer className="pt-0 text-[11px] text-muted-foreground">
              SLA đạt 99.98%
            </Card.Footer>
          </Card>

          <Card className="border">
            <Card.Header className="flex justify-between items-center pb-2">
              <Card.Title className="text-sm font-semibold">Tỷ lệ thanh toán</Card.Title>
              ${has('chip') ? `<Chip color="warning" variant="soft">Cần theo dõi</Chip>` : ''}
            </Card.Header>
            <Card.Content className="py-2">
              <div className="text-2xl font-bold">94.2%</div>
              <Card.Description className="text-xs text-muted-foreground mt-1">Cổng thanh toán tự động</Card.Description>
            </Card.Content>
            <Card.Footer className="pt-0 text-[11px] text-muted-foreground">
              0.8% giao dịch treo
            </Card.Footer>
          </Card>
        </div>
      </section>`
          : ''
      }

      {/* 3. Buttons & Chips */}
      <section className="space-y-3" aria-labelledby="heroui-buttons">
        <h3 id="heroui-buttons" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Nút bấm & Huy hiệu (Buttons & Chips)
        </h3>
        <Card className="p-4 space-y-4 border">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">Biến thể (Variants):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Kích thước (Sizes):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="primary">Small</Button>
              <Button size="md" variant="primary">Medium</Button>
              <Button size="lg" variant="primary">Large</Button>
            </div>
          </div>

          ${
            has('chip')
              ? `<div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Huy hiệu (Chips):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Chip color="accent" variant="primary">Accent Primary</Chip>
              <Chip color="default" variant="secondary">Default Secondary</Chip>
              <Chip color="success" variant="soft">Success Soft</Chip>
              <Chip color="warning" variant="tertiary">Warning Tertiary</Chip>
              <Chip color="danger" variant="soft">Danger Red Flag</Chip>
            </div>
          </div>`
              : ''
          }
        </Card>
      </section>

      ${
        has('textfield') || has('input') || has('select') || has('checkbox') || has('switch') || has('slider')
          ? `{/* 4. Form Controls */}
      <section className="space-y-3" aria-labelledby="heroui-forms">
        <h3 id="heroui-forms" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Biểu mẫu nhập liệu (Form Controls)
        </h3>
        <Card className="p-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              ${
                has('textfield') && has('label') && has('input')
                  ? `<TextField className="space-y-1.5">
                <Label className="text-sm font-medium">Tên dự án</Label>
                <Input placeholder="Nhập tên dự án hoặc portal" />
                <Description className="text-xs text-muted-foreground">Dùng để định danh dự án trên Token Playground.</Description>
              </TextField>`
                  : ''
              }

              ${
                has('select') && has('list-box')
                  ? `<Select defaultSelectedKey="lead" className="space-y-1.5 w-full">
                <Label className="text-sm font-medium">Vai trò người dùng</Label>
                <Select.Trigger className="w-full">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="lead">
                      Product Lead (Người duyệt G0)
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="designer">
                      Design System Engineer
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="developer">
                      Developer
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>`
                  : ''
              }
            </div>

            <div className="space-y-5">
              ${
                has('checkbox')
                  ? `<div className="flex items-center space-x-2">
                <Checkbox
                  isSelected={checkboxChecked}
                  onChange={setCheckboxChecked}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label className="text-sm font-medium leading-none">
                      Xác nhận kiểm thử trên trình duyệt headless
                    </Label>
                  </Checkbox.Content>
                </Checkbox>
              </div>`
                  : ''
              }

              ${
                has('switch')
                  ? `<div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium">Bật thông báo duyệt nhanh</span>
                  <p className="text-xs text-muted-foreground">Gửi thông báo qua kênh chat điều phối</p>
                </div>
                <Switch
                  isSelected={switchChecked}
                  onChange={setSwitchChecked}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label className="sr-only">Bật thông báo duyệt nhanh</Label>
                  </Switch.Content>
                </Switch>
              </div>`
                  : ''
              }

              ${
                has('slider')
                  ? `<div className="space-y-2">
                <Slider
                  value={sliderVal}
                  onChange={(val: any) => setSliderVal(Array.isArray(val) ? val : [val])}
                  maxValue={100}
                  minValue={0}
                  step={1}
                >
                  <div className="flex justify-between text-xs">
                    <Label className="font-medium">Mức độ hoàn thành Gate G0</Label>
                    <Slider.Output />
                  </div>
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
              </div>`
                  : ''
              }
            </div>
          </div>
        </Card>
      </section>`
          : ''
      }

      ${
        has('tabs')
          ? `{/* 5. Tabs */}
      <section className="space-y-3" aria-labelledby="heroui-tabs">
        <h3 id="heroui-tabs" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Điều hướng & Phân vùng (Tabs)
        </h3>
        <Tabs defaultSelectedKey="overview" className="w-full">
          <Tabs.ListContainer>
            <Tabs.List>
              <Tabs.Tab id="overview">Tổng quan</Tabs.Tab>
              <Tabs.Tab id="specs">Quy chuẩn kỹ thuật</Tabs.Tab>
              <Tabs.Tab id="notes">Ghi chú duyệt</Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="overview">
            <div className="rounded-xl border bg-card p-4 mt-2">
              <h4 className="text-sm font-semibold mb-1">Mục tiêu đợt điều chỉnh token</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tối ưu tỷ lệ tương phản cho cặp màu chính (--accent & --surface), đồng thời
                căn chỉnh bo góc theo vai card, tile, popover theo chuẩn kiến trúc Danh Method Stage 2.
              </p>
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="specs">
            <div className="rounded-xl border bg-card p-4 mt-2">
              <h4 className="text-sm font-semibold mb-1">Quy định kỹ thuật</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tokens phải khai báo đầy đủ cho hai chế độ light và dark. Không phát sinh token ngoài danh mục đã duyệt.
              </p>
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="notes">
            <div className="rounded-xl border bg-card p-4 mt-2">
              <h4 className="text-sm font-semibold mb-1">Nhật ký TOKENS-NOTES</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                G0 chốt ngày 29/10/2026 bởi người phụ trách. Xuất đề xuất qua toolbar để nạp lại mã nguồn.
              </p>
            </div>
          </Tabs.Panel>
        </Tabs>
      </section>`
          : ''
      }

      ${
        has('table')
          ? `{/* 6. Table */}
      <section className="space-y-3" aria-labelledby="heroui-table">
        <h3 id="heroui-table" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Bảng dữ liệu (Table)
        </h3>
        <Card className="border overflow-hidden">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="HeroUI Review Table">
                <Table.Header>
                  <Table.Column isRowHeader>MÃ GIAO DỊCH</Table.Column>
                  <Table.Column>LOẠI TOKEN</Table.Column>
                  <Table.Column>TRẠNG THÁI</Table.Column>
                  <Table.Column>GIÁ TRỊ HIỆN TẠI</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Row id="tx-109">
                    <Table.Cell className="font-mono">#TX-109</Table.Cell>
                    <Table.Cell>--accent</Table.Cell>
                    <Table.Cell>${has('chip') ? `<Chip color="success" variant="soft">Đạt chuẩn</Chip>` : 'Đạt chuẩn'}</Table.Cell>
                    <Table.Cell className="font-mono text-xs">var(--accent)</Table.Cell>
                  </Table.Row>
                  <Table.Row id="tx-110">
                    <Table.Cell className="font-mono">#TX-110</Table.Cell>
                    <Table.Cell>--radius</Table.Cell>
                    <Table.Cell>${has('chip') ? `<Chip color="default" variant="primary">Khớp vai</Chip>` : 'Khớp vai'}</Table.Cell>
                    <Table.Cell className="font-mono text-xs">var(--radius)</Table.Cell>
                  </Table.Row>
                  <Table.Row id="tx-111">
                    <Table.Cell className="font-mono">#TX-111</Table.Cell>
                    <Table.Cell>--danger</Table.Cell>
                    <Table.Cell>${has('chip') ? `<Chip color="danger" variant="soft">Kiểm tra lại</Chip>` : 'Kiểm tra lại'}</Table.Cell>
                    <Table.Cell className="font-mono text-xs">var(--danger)</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card>
      </section>`
          : ''
      }

      ${
        has('modal') || has('dropdown')
          ? `{/* 7. Modal & Dropdown Overlays */}
      <section className="space-y-3" aria-labelledby="heroui-overlays">
        <h3 id="heroui-overlays" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Cửa sổ nổi & Menu (Modal & Dropdown)
        </h3>
        <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-4 items-center">
          ${
            has('modal')
              ? `<Modal>
            <Modal.Trigger>
              <Button variant="outline">Mở Modal xác nhận</Button>
            </Modal.Trigger>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Header>
                    <Modal.Heading>Xác nhận áp dụng đề xuất token?</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-sm text-muted-foreground">
                      Bản đề xuất JSON/Markdown sẽ được lưu và chuyển sang task nạp lại Design System.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary">Đồng ý</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>`
              : ''
          }

          ${
            has('dropdown')
              ? `<Dropdown>
            <Dropdown.Trigger>
              Tuỳ chọn thao tác ▼
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="Tùy chọn thao tác">
                <Dropdown.Item id="copy">Sao chép định dạng CSS</Dropdown.Item>
                <Dropdown.Item id="download">Tải bản đồ token</Dropdown.Item>
                <Dropdown.Item id="reset" className="text-danger">Đặt lại mặc định</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>`
              : ''
          }
        </div>
      </section>`
          : ''
      }
    </div>
  );
}
`;
}
function buildShadcnPreviewCode(installedComponents = [], uiAlias = '@/components/ui') {
  const baseNames = installedComponents.map((c) => c.replace(/\.(tsx|jsx)$/i, ''));
  const has = (name) => baseNames.includes(name);

  // If no shadcn components at all
  if (baseNames.length === 0) {
    return `import React from 'react';
export const isShadcnInstalled = true;
export function ShadcnPreview() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
      <p className="font-semibold text-sm">Chưa có component shadcn/ui nào được cài đặt trong thư mục components/ui.</p>
      <p className="text-xs mt-1">Dùng lệnh <code className="font-mono bg-muted px-1 py-0.5 rounded">npx shadcn@latest add button card input</code> để bổ sung.</p>
    </div>
  );
}
`;
  }

  const imports = ["import React, { useState } from 'react';"];
  if (has('button')) imports.push(`import { Button } from '${uiAlias}/button';`);
  if (has('badge')) imports.push(`import { Badge } from '${uiAlias}/badge';`);
  if (has('card'))
    imports.push(
      `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '${uiAlias}/card';`
    );
  if (has('input')) imports.push(`import { Input } from '${uiAlias}/input';`);
  if (has('select'))
    imports.push(
      `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '${uiAlias}/select';`
    );
  if (has('checkbox')) imports.push(`import { Checkbox } from '${uiAlias}/checkbox';`);
  if (has('switch')) imports.push(`import { Switch } from '${uiAlias}/switch';`);
  if (has('slider')) imports.push(`import { Slider } from '${uiAlias}/slider';`);
  if (has('tabs')) imports.push(`import { Tabs, TabsContent, TabsList, TabsTrigger } from '${uiAlias}/tabs';`);
  if (has('table'))
    imports.push(
      `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '${uiAlias}/table';`
    );
  if (has('dialog'))
    imports.push(
      `import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '${uiAlias}/dialog';`
    );
  if (has('dropdown-menu'))
    imports.push(
      `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '${uiAlias}/dropdown-menu';`
    );
  if (has('alert')) imports.push(`import { Alert, AlertDescription, AlertTitle } from '${uiAlias}/alert';`);

  return `${imports.join('\n')}

export const isShadcnInstalled = true;

export function ShadcnPreview() {
  const [sliderVal, setSliderVal] = useState([65]);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <div className="space-y-8">
      ${
        has('alert')
          ? `{/* 1. Alerts */}
      <section className="space-y-3" aria-labelledby="shadcn-alerts">
        <h3 id="shadcn-alerts" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Thông báo (Alerts)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert>
            <AlertTitle className="font-semibold">Hệ thống đồng bộ thành công</AlertTitle>
            <AlertDescription>
              Các token visual đã được kết nối với toàn bộ component shadcn/ui trong dự án.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle className="font-semibold">Cảnh báo Gate G0</AlertTitle>
            <AlertDescription>
              Thay đổi thông số màu sắc cần được xuất ra proposal và phê duyệt trước khi commit.
            </AlertDescription>
          </Alert>
        </div>
      </section>`
          : ''
      }

      ${
        has('card')
          ? `{/* 2. Dashboard Cards */}
      <section className="space-y-3" aria-labelledby="shadcn-cards">
        <h3 id="shadcn-cards" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Bảng điều khiển (Dashboard Card Set)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              ${has('badge') ? `<Badge variant="outline">+20.1%</Badge>` : ''}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground mt-1">So với tháng trước</p>
            </CardContent>
            <CardFooter className="pt-0">
              <span className="text-[11px] text-muted-foreground">Mục tiêu: $50,000</span>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
              ${has('badge') ? `<Badge>Mới</Badge>` : ''}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2,350</div>
              <p className="text-xs text-muted-foreground mt-1">+180.1% tuần qua</p>
            </CardContent>
            <CardFooter className="pt-0">
              <span className="text-[11px] text-muted-foreground">87% tỷ lệ giữ chân</span>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ chuyển đổi</CardTitle>
              ${has('badge') ? `<Badge variant="secondary">Ổn định</Badge>` : ''}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5%</div>
              <p className="text-xs text-muted-foreground mt-1">+4.2% so với quý trước</p>
            </CardContent>
            <CardFooter className="pt-0">
              <span className="text-[11px] text-muted-foreground">Phễu đăng ký SaaS</span>
            </CardFooter>
          </Card>
        </div>
      </section>`
          : ''
      }

      ${
        has('button') || has('badge')
          ? `{/* 3. Buttons & Badges */}
      <section className="space-y-3" aria-labelledby="shadcn-buttons">
        <h3 id="shadcn-buttons" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Nút bấm & Huy hiệu (Buttons & Badges)
        </h3>
        <div className="rounded-xl border bg-card p-4 space-y-4">
          ${
            has('button')
              ? `<div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">Biến thể (Variants):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="default">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link text</Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Kích thước (Sizes):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm">Small (sm)</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large (lg)</Button>
            </div>
          </div>`
              : ''
          }

          ${
            has('badge')
              ? `<div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Huy hiệu (Badges):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="default">Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
              <Badge variant="destructive">Red Flag / Danger</Badge>
            </div>
          </div>`
              : ''
          }
        </div>
      </section>`
          : ''
      }

      ${
        has('input') || has('select') || has('checkbox') || has('switch') || has('slider')
          ? `{/* 4. Form Controls */}
      <section className="space-y-3" aria-labelledby="shadcn-forms">
        <h3 id="shadcn-forms" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Biểu mẫu nhập liệu (Form Controls)
        </h3>
        <div className="rounded-xl border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              ${
                has('input')
                  ? `<div className="space-y-1.5">
                <label htmlFor="shadcn-input-email" className="text-sm font-medium">
                  Địa chỉ Email
                </label>
                <Input id="shadcn-input-email" type="email" placeholder="nguoidung@example.com" />
                <p className="text-xs text-muted-foreground">Dùng để nhận báo cáo duyệt design token.</p>
              </div>`
                  : ''
              }

              ${
                has('select')
                  ? `<div className="space-y-1.5">
                <label className="text-sm font-medium">Vai trò người dùng</label>
                <Select defaultValue="lead">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Product Lead (Người duyệt G0)</SelectItem>
                    <SelectItem value="designer">Design System Engineer</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>`
                  : ''
              }
            </div>

            <div className="space-y-5">
              ${
                has('checkbox')
                  ? `<div className="flex items-center space-x-2">
                <Checkbox
                  id="shadcn-terms"
                  checked={checkboxChecked}
                  onCheckedChange={(checked) => setCheckboxChecked(Boolean(checked))}
                />
                <label htmlFor="shadcn-terms" className="text-sm font-medium leading-none">
                  Tuân thủ quy chuẩn tương phản WCAG 2.1 AA
                </label>
              </div>`
                  : ''
              }

              ${
                has('switch')
                  ? `<div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <label htmlFor="shadcn-switch" className="text-sm font-medium">
                    Tự động đồng bộ Dark Mode
                  </label>
                  <p className="text-xs text-muted-foreground">Chuyển sắc độ neutral khi hệ thống đổi chế độ</p>
                </div>
                <Switch
                  id="shadcn-switch"
                  checked={switchChecked}
                  onCheckedChange={setSwitchChecked}
                />
              </div>`
                  : ''
              }

              ${
                has('slider')
                  ? `<div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <label htmlFor="shadcn-slider" className="font-medium">
                    Mức độ ưu tiên kiểm thử
                  </label>
                  <span className="font-mono text-muted-foreground">{sliderVal[0]}%</span>
                </div>
                <Slider
                  id="shadcn-slider"
                  value={sliderVal}
                  onValueChange={(val: any) => setSliderVal(Array.isArray(val) ? val : [val])}
                  max={100}
                  step={1}
                />
              </div>`
                  : ''
              }
            </div>
          </div>
        </div>
      </section>`
          : ''
      }

      ${
        has('tabs')
          ? `{/* 5. Tabs */}
      <section className="space-y-3" aria-labelledby="shadcn-tabs">
        <h3 id="shadcn-tabs" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Điều hướng & Phân vùng (Tabs)
        </h3>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="specs">Quy chuẩn kỹ thuật</TabsTrigger>
            <TabsTrigger value="notes">Ghi chú duyệt</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="rounded-xl border bg-card p-4">
              <h4 className="text-sm font-semibold mb-1">Mục tiêu đợt điều chỉnh token</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tối ưu tỷ lệ tương phản cho cặp màu chính (--primary & --primary-foreground), đồng thời
                căn chỉnh bo góc theo vai card, tile, popover theo chuẩn kiến trúc Danh Method Stage 2.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="specs">
            <div className="rounded-xl border bg-card p-4">
              <h4 className="text-sm font-semibold mb-1">Quy định kỹ thuật</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tokens phải khai báo đầy đủ cho hai chế độ light và dark. Không phát sinh token ngoài danh mục đã duyệt.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="notes">
            <div className="rounded-xl border bg-card p-4">
              <h4 className="text-sm font-semibold mb-1">Nhật ký TOKENS-NOTES</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                G0 chốt ngày 29/10/2026 bởi người phụ trách. Xuất đề xuất qua toolbar để nạp lại mã nguồn.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </section>`
          : ''
      }

      ${
        has('table')
          ? `{/* 6. Data Table */}
      <section className="space-y-3" aria-labelledby="shadcn-table">
        <h3 id="shadcn-table" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Bảng dữ liệu (Data Table)
        </h3>
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Mã phiên</TableHead>
                <TableHead>Tên nhiệm vụ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người duyệt</TableHead>
                <TableHead className="text-right">Tương phản</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono font-medium">G0-001</TableCell>
                <TableCell>Duyệt Brand Primary 5 sắc độ</TableCell>
                <TableCell>${has('badge') ? `<Badge variant="default">Đã duyệt</Badge>` : 'Đã duyệt'}</TableCell>
                <TableCell>anh Danh</TableCell>
                <TableCell className="text-right font-mono font-semibold text-emerald-600">6.08:1</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-medium">G0-002</TableCell>
                <TableCell>Bo góc Role Card / Tile / Popover</TableCell>
                <TableCell>${has('badge') ? `<Badge variant="secondary">Đang duyệt</Badge>` : 'Đang duyệt'}</TableCell>
                <TableCell>Lead</TableCell>
                <TableCell className="text-right font-mono">16px/12px</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-medium">G0-003</TableCell>
                <TableCell>Red-flag Cảnh báo vi phạm</TableCell>
                <TableCell>${has('badge') ? `<Badge variant="destructive">Cần chỉnh</Badge>` : 'Cần chỉnh'}</TableCell>
                <TableCell>QA</TableCell>
                <TableCell className="text-right font-mono font-semibold text-emerald-600">5.62:1</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>`
          : ''
      }

      ${
        has('dialog') || has('dropdown-menu')
          ? `{/* 7. Dialog & Dropdown Triggers */}
      <section className="space-y-3" aria-labelledby="shadcn-overlays">
        <h3 id="shadcn-overlays" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Cửa sổ nổi & Menu (Dialog & Dropdown)
        </h3>
        <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-4 items-center">
          ${
            has('dialog')
              ? `<Dialog>
            <DialogTrigger className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              Mở Dialog xác nhận
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Xác nhận áp dụng đề xuất token?</DialogTitle>
                <DialogDescription>
                  Bản đề xuất JSON/Markdown sẽ được lưu và chuyển sang task nạp lại Design System.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="default">Đồng ý</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>`
              : ''
          }

          ${
            has('dropdown-menu')
              ? `<DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:bg-secondary/80">
              Tuỳ chọn thao tác ▼
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Sao chép định dạng CSS</DropdownMenuItem>
              <DropdownMenuItem>Tải bản đồ token</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Đặt lại mặc định</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>`
              : ''
          }
        </div>
      </section>`
          : ''
      }
    </div>
  );
}
`;
}

// ---------- 5. Hàm thực thi Scaffold chính ----------
export function runScaffold(argv = process.argv) {
  const args = parseArgs(argv);

  if (args.ui && args.ui !== 'shadcn' && args.ui !== 'heroui') {
    console.error(
      `Mục tiêu UI không hợp lệ "${args.ui}". Chỉ được chọn 1 trong 2 thư viện UI: --ui shadcn hoặc --ui heroui (không được chọn cả 2).`
    );
    process.exit(1);
  }

  // 1. Kiểm tra tính sẵn sàng của thư viện UI
  let checkResult;
  try {
    checkResult = runReadinessCheck(args.root, args.ui);
  } catch (err) {
    console.error(`Lỗi kiểm tra tính sẵn sàng UI: ${err.message}`);
    process.exit(1);
  }

  if (!checkResult || !checkResult.ready) {
    const targetMsg = args.ui ? `cho mục tiêu UI "${args.ui}"` : '(cần chọn 1 trong 2: --ui shadcn hoặc --ui heroui)';
    console.error(
      checkResult?.error || `Dự án chưa sẵn sàng thư viện UI ${targetMsg}. Vui lòng chạy check-ui-packages để kiểm tra.`
    );
    process.exit(1);
  }

  // Determine which single UI library to enable (strictly 1 of 2: shadcn OR heroui)
  let enableShadcn = false;
  let enableHeroUI = false;
  if (args.ui === 'shadcn') {
    enableShadcn = true;
  } else if (args.ui === 'heroui') {
    enableHeroUI = true;
  } else if (checkResult.shadcn?.installed && !checkResult.heroui?.installed) {
    enableShadcn = true;
  } else if (checkResult.heroui?.installed && !checkResult.shadcn?.installed) {
    enableHeroUI = true;
  } else {
    console.error('Chỉ được chọn 1 trong 2 thư viện UI: vui lòng truyền rõ --ui shadcn hoặc --ui heroui.');
    process.exit(1);
  }

  // 2. Kiểm tra tồn tại thư mục đích (nếu không có --force)
  if (fs.existsSync(args.resolvedOutDir) && !args.force) {
    const files = fs.readdirSync(args.resolvedOutDir);
    if (files.length > 0) {
      console.error(
        `Thư mục đích đã tồn tại file: ${args.resolvedOutDir}. Vui lòng dùng --force để ghi đè.`
      );
      process.exit(1);
    }
  }

  // 3. Tìm và đọc các file CSS
  let cssFilePaths = args.css.map((f) => path.resolve(args.root, f));
  if (cssFilePaths.length === 0) {
    const commonCssCandidates = [
      path.join(args.root, 'src', 'index.css'),
      path.join(args.root, 'src', 'globals.css'),
      path.join(args.root, 'app', 'globals.css'),
    ];
    for (const c of commonCssCandidates) {
      if (fs.existsSync(c)) {
        cssFilePaths.push(c);
        break;
      }
    }
  }

  if (cssFilePaths.length === 0) {
    console.error('Không tìm thấy file token CSS nào trong dự án. Dùng --css <file.css>.');
    process.exit(1);
  }

  const tokenStore = new Map();
  const sourceHashes = {};

  // When HeroUI is enabled and checkResult.heroui.stylesCssPath exists, parse variables.css first
  if (enableHeroUI && checkResult.heroui?.stylesCssPath && fs.existsSync(checkResult.heroui.stylesCssPath)) {
    const heroCssContent = fs.readFileSync(checkResult.heroui.stylesCssPath, 'utf8');
    const relHeroCss = path.relative(args.root, checkResult.heroui.stylesCssPath).replace(/\\/g, '/');
    sourceHashes[relHeroCss] = sha256(heroCssContent);
    parseCssTokens(heroCssContent, '@heroui/styles/variables.css', tokenStore);
  }

  for (const cssPath of cssFilePaths) {
    if (!fs.existsSync(cssPath)) {
      console.error(`Không thấy file CSS: ${cssPath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(cssPath, 'utf8');
    const rel = path.relative(args.root, cssPath).replace(/\\/g, '/');
    sourceHashes[rel] = sha256(content);
    parseCssTokens(content, path.basename(cssPath), tokenStore);
  }

  // Chuẩn hóa token: Ensure all declared tokens exist in both light & dark
  const tokensLight = {};
  const tokensDark = {};

  for (const [name, entry] of tokenStore) {
    const lightVal = entry.light || entry.dark;
    const darkVal = entry.dark || entry.light;
    if (lightVal && darkVal) {
      tokensLight[name] = lightVal;
      tokensDark[name] = darkVal;
    }
  }

  if (Object.keys(tokensLight).length === 0) {
    console.error('Không tìm thấy biến CSS (--*) nào trong các file CSS đã chỉ định.');
    process.exit(1);
  }

  // 4. Băm source component được dùng (shadcn)
  if (enableShadcn && checkResult.shadcn?.installed && Array.isArray(checkResult.shadcn.components)) {
    const uiDirCandidates = [
      path.join(args.root, 'src', 'components', 'ui'),
      path.join(args.root, 'components', 'ui'),
    ];
    let matchedUiDir = null;
    for (const cand of uiDirCandidates) {
      if (fs.existsSync(cand)) {
        matchedUiDir = cand;
        break;
      }
    }

    if (matchedUiDir) {
      for (const compFile of checkResult.shadcn.components) {
        const fullCompPath = path.join(matchedUiDir, compFile);
        if (fs.existsSync(fullCompPath)) {
          const compContent = fs.readFileSync(fullCompPath, 'utf8');
          const relComp = path.relative(args.root, fullCompPath).replace(/\\/g, '/');
          sourceHashes[relComp] = sha256(compContent);
        }
      }
    }
  }

  // 5. Project ID
  let projectId = 'project-ds@0.1.0';
  const pkgJsonPath = path.join(args.root, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkg.name) {
        projectId = `${pkg.name}@${pkg.version || '0.1.0'}`;
      }
    } catch {}
  }

  const manifest = {
    schemaVersion: 1,
    source: {
      id: projectId,
      hashes: sourceHashes,
    },
    tokens: {
      light: tokensLight,
      dark: tokensDark,
    },
    ui: {
      target: args.ui || null,
      shadcn: {
        installed: enableShadcn,
        components: enableShadcn ? (checkResult.shadcn?.components || []) : [],
      },
      heroui: {
        installed: enableHeroUI,
        version: enableHeroUI ? checkResult.heroui?.version : null,
        majorVersion: enableHeroUI ? checkResult.heroui?.majorVersion : null,
        mode: enableHeroUI ? checkResult.heroui?.mode : null,
        components: enableHeroUI ? (checkResult.heroui?.components || []) : [],
        anatomy: enableHeroUI ? (checkResult.heroui?.anatomy || {}) : {},
      },
      framework: checkResult.framework || 'vite',
      tailwind: checkResult.tailwind || 4,
    },
  };

  // 6. Xử lý cờ --dry
  if (args.dry) {
    console.log(`[DRY RUN] Đã kiểm tra sẵn sàng: Framework=${manifest.ui.framework}, Ready=true`);
    console.log(`[DRY RUN] Trích xuất thành công ${Object.keys(tokensLight).length} tokens từ ${cssFilePaths.length} file CSS.`);
    console.log(`[DRY RUN] Băm provenance: ${Object.keys(sourceHashes).length} file nguồn.`);
    console.log(`[DRY RUN] Sẽ tạo cấu trúc Playground tại: ${args.resolvedOutDir}`);
    process.exit(0);
  }

  // 7. Ghi các file template vào --out-dir
  const templateDir = path.join(__dirname, '..', 'assets', 'token-playground');
  if (!fs.existsSync(templateDir)) {
    console.error(`Không tìm thấy thư mục template: ${templateDir}`);
    process.exit(1);
  }

  fs.mkdirSync(args.resolvedOutDir, { recursive: true });
  fs.mkdirSync(path.join(args.resolvedOutDir, 'controls'), { recursive: true });
  fs.mkdirSync(path.join(args.resolvedOutDir, 'preview'), { recursive: true });

  // Ghi manifest.json
  fs.writeFileSync(
    path.join(args.resolvedOutDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  // Copy standard template files
  const filesToCopy = [
    'token-parameters.ts',
    'TokenPlayground.tsx',
    'main.tsx',
    'index.html',
    'controls/ThemeControls.tsx',
    'preview/ContrastGrid.tsx',
    'preview/TypographyScale.tsx',
  ];

  for (const relFile of filesToCopy) {
    const src = path.join(templateDir, relFile);
    const dest = path.join(args.resolvedOutDir, relFile);
    if (fs.existsSync(src)) {
      fs.writeFileSync(dest, fs.readFileSync(src, 'utf8'), 'utf8');
    }
  }

  // Sinh preview/ShadcnPreview.tsx tuỳ theo tình trạng cài đặt
  const destShadcn = path.join(args.resolvedOutDir, 'preview', 'ShadcnPreview.tsx');
  if (manifest.ui.shadcn.installed) {
    const shadcnCode = buildShadcnPreviewCode(manifest.ui.shadcn.components);
    fs.writeFileSync(destShadcn, shadcnCode, 'utf8');
  } else {
    fs.writeFileSync(
      destShadcn,
      `import React from 'react';\nexport const isShadcnInstalled = false;\nexport function ShadcnPreview() { return null; }\n`,
      'utf8'
    );
  }

  // Sinh preview/HeroUIPreview.tsx tuỳ theo tình trạng cài đặt
  const destHeroUI = path.join(args.resolvedOutDir, 'preview', 'HeroUIPreview.tsx');
  if (manifest.ui.heroui.installed) {
    const heroCode = buildHeroUIPreviewCode(checkResult.heroui);
    fs.writeFileSync(destHeroUI, heroCode, 'utf8');
  } else {
    fs.writeFileSync(
      destHeroUI,
      `import React from 'react';\nexport const isHeroUIInstalled = false;\nexport function HeroUIPreview() { return null; }\n`,
      'utf8'
    );
  }

  // 8. In hướng dẫn chạy và build tương ứng với tooling của dự án
  const relOutDir = path.relative(args.root, args.resolvedOutDir).replace(/\\/g, '/');
  console.log('\n======================================================');
  console.log('✓ Scaffold Token Playground thành công!');
  console.log(`  Thư mục đích : ${args.resolvedOutDir}`);
  console.log(`  Tokens bóc tách: ${Object.keys(tokensLight).length} biến (--*)`);
  console.log(
    `  Thư viện UI  : shadcn/ui (${manifest.ui.shadcn.installed ? 'Có' : 'Không'}, ${manifest.ui.shadcn.components.length} comps), HeroUI (${manifest.ui.heroui.installed ? 'Có' : 'Không'})`
  );
  console.log(`  Framework    : ${manifest.ui.framework} (Tailwind v${manifest.ui.tailwind})`);
  console.log('======================================================\n');

  console.log('Lệnh chạy và build với tooling có sẵn của dự án:');
  if (manifest.ui.framework === 'next') {
    console.log('[Next.js App Router]');
    console.log(`  1. Tạo route dev tại: app/(design-system)/token-playground/page.tsx:`);
    console.log(`     import { TokenPlayground } from '@/${relOutDir}/TokenPlayground';`);
    console.log(`     export default function TokenPlaygroundPage() { return <TokenPlayground />; }`);
    console.log(`  2. Khởi chạy dev: npx next dev (truy cập /token-playground)`);
    console.log(`  3. Xuất tĩnh / build: npx next build`);
  } else {
    console.log('[Vite]');
    console.log(`  1. Chạy dev độc lập:`);
    console.log(`     npx vite ${relOutDir}`);
    console.log(`     hoặc import { TokenPlayground } from './${relOutDir}/TokenPlayground' vào App.tsx và chạy: npm run dev`);
    console.log(`  2. Build thư mục tĩnh:`);
    console.log(`     npx vite build --base=./ ${relOutDir} --outDir dist-playground`);
    console.log(`     hoặc build chung qua App.tsx bằng: npm run build`);
  }
  console.log('\nĐể chụp ảnh review gate G0:');
  console.log(`  node skills/design-prototype/scripts/capture-screens.mjs <url-hoặc-html> <out-dir> --states "tokens:"`);
  console.log('');
}

// Chạy trực tiếp qua CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runScaffold();
}
