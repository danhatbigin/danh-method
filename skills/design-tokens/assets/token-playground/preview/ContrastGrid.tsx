import React, { useMemo } from 'react';

interface ContrastGridProps {
  tokens: Record<string, string>;
  themeName: string;
}

interface PairConfig {
  name: string;
  bgToken: string;
  fgToken: string;
  role: string;
}

const COLOR_PAIRS: PairConfig[] = [
  { name: 'Base Background', bgToken: '--background', fgToken: '--foreground', role: 'Nền trang / chữ chính (60%)' },
  { name: 'Card Surface', bgToken: '--card', fgToken: '--card-foreground', role: 'Bề mặt nổi L1/L2' },
  { name: 'Popover Surface', bgToken: '--popover', fgToken: '--popover-foreground', role: 'Menu / popover / drawer' },
  { name: 'Primary Action', bgToken: '--primary', fgToken: '--primary-foreground', role: 'Hành động chính (10%)' },
  { name: 'Secondary Action', bgToken: '--secondary', fgToken: '--secondary-foreground', role: 'Hành động phụ (30%)' },
  { name: 'Muted Neutral', bgToken: '--muted', fgToken: '--muted-foreground', role: 'Nền tĩnh / chữ phụ' },
  { name: 'Accent Selection', bgToken: '--accent', fgToken: '--accent-foreground', role: 'Hover hàng / mục chọn' },
  { name: 'Destructive / Flag', bgToken: '--destructive', fgToken: '--destructive-foreground', role: 'Lỗi / xoá / red flag' },
];

function resolveColorToRgb(colorStr: string): [number, number, number] | null {
  if (typeof document === 'undefined' || !colorStr) return null;
  // If bare HSL like "222.2 84% 4.9%"
  const bareHsl = colorStr.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  const normalized = bareHsl ? `hsl(${bareHsl[1]} ${bareHsl[2]}% ${bareHsl[3]}%)` : colorStr;

  const temp = document.createElement('div');
  temp.style.color = normalized;
  document.body.appendChild(temp);
  const cs = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);

  const m = cs.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function getLuminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function calculateContrast(bgStr: string, fgStr: string): number {
  const rgbBg = resolveColorToRgb(bgStr);
  const rgbFg = resolveColorToRgb(fgStr);
  if (!rgbBg || !rgbFg) return 1.0;
  const l1 = getLuminance(rgbBg);
  const l2 = getLuminance(rgbFg);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function ContrastGrid({ tokens, themeName }: ContrastGridProps) {
  const pairsWithResults = useMemo(() => {
    return COLOR_PAIRS.map((pair) => {
      const bgVal = tokens[pair.bgToken] || '';
      const fgVal = tokens[pair.fgToken] || '';
      const ratio = bgVal && fgVal ? calculateContrast(bgVal, fgVal) : 0;
      const pass = ratio >= 4.5;
      return {
        ...pair,
        bgVal,
        fgVal,
        ratio: Number(ratio.toFixed(2)),
        pass,
      };
    }).filter((p) => Boolean(p.bgVal && p.fgVal));
  }, [tokens]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-bold tracking-tight">
          Bảng tương phản màu sắc ({themeName}) · Tiêu chuẩn WCAG AA
        </h3>
        <span className="text-xs text-muted-foreground">Chuẩn chữ thường ≥ 4.5:1</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pairsWithResults.map((p) => (
          <div
            key={p.name}
            className="flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-all"
            style={{
              backgroundColor: `var(${p.bgToken}, ${p.bgVal})`,
              color: `var(${p.fgToken}, ${p.fgVal})`,
              borderColor: 'var(--border, #e5e7eb)',
            }}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">{p.name}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    p.pass
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {p.pass ? 'ĐẠT AA' : 'TRƯỢT AA'} ({p.ratio}:1)
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">{p.role}</p>
            </div>

            <div className="mt-4 border-t pt-2 text-[11px] opacity-75 space-y-0.5">
              <div className="truncate">
                <span className="font-mono">{p.bgToken}</span>: {p.bgVal}
              </div>
              <div className="truncate">
                <span className="font-mono">{p.fgToken}</span>: {p.fgVal}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
