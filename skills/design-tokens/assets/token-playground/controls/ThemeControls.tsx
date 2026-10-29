import React, { useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'side-by-side';

interface ThemeControlsProps {
  mode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  activeTokens: Record<string, string>;
  declaredTokens: Record<string, string>;
  onTokenChange: (name: string, value: string) => void;
  currentTheme: 'light' | 'dark';
}

function resolveRgb(colorStr: string): [number, number, number] | null {
  if (typeof document === 'undefined' || !colorStr) return null;
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

function rgbToHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function mixRgb(base: [number, number, number], target: [number, number, number], weight: number): [number, number, number] {
  return [
    base[0] * (1 - weight) + target[0] * weight,
    base[1] * (1 - weight) + target[1] * weight,
    base[2] * (1 - weight) + target[2] * weight,
  ];
}

export function ThemeControls({
  mode,
  onModeChange,
  activeTokens,
  declaredTokens,
  onTokenChange,
  currentTheme,
}: ThemeControlsProps) {
  const isDeclared = (name: string) => Object.prototype.hasOwnProperty.call(declaredTokens, name);

  // 5 shades calculation for Primary preview
  const primaryShades = useMemo(() => {
    const primaryVal = activeTokens['--primary'] || '';
    const rgb = resolveRgb(primaryVal);
    if (!rgb) {
      return [
        { label: '100 subtle', value: 'rgba(var(--primary), 0.12)' },
        { label: '300 disabled', value: 'rgba(var(--primary), 0.4)' },
        { label: '500 base', value: primaryVal || '#3b82f6' },
        { label: '600 hover', value: 'rgba(var(--primary), 0.85)' },
        { label: '700 active', value: 'rgba(var(--primary), 0.7)' },
      ];
    }
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [0, 0, 0];
    return [
      { label: '100 subtle', value: rgbToHex(mixRgb(rgb, white, 0.85)) },
      { label: '300 disabled', value: rgbToHex(mixRgb(rgb, white, 0.45)) },
      { label: '500 base', value: rgbToHex(rgb) },
      { label: '600 hover', value: rgbToHex(mixRgb(rgb, black, 0.12)) },
      { label: '700 active', value: rgbToHex(mixRgb(rgb, black, 0.25)) },
    ];
  }, [activeTokens['--primary']]);

  // Radius slider value (extract number in px or rem)
  const currentRadiusVal = activeTokens['--radius'] || '0.5rem';
  const radiusInPx = useMemo(() => {
    const m = currentRadiusVal.match(/^([\d.]+)(rem|px)?$/);
    if (!m) return 8;
    const num = parseFloat(m[1]);
    return m[2] === 'rem' ? Math.round(num * 16) : Math.round(num);
  }, [currentRadiusVal]);

  const handleColorInput = (name: string, val: string) => {
    onTokenChange(name, val);
  };

  const handleRadiusSlider = (px: number) => {
    onTokenChange('--radius', `${(px / 16).toFixed(3).replace(/\.?0+$/, '')}rem`);
  };

  const roleRadii = ['--radius-card', '--radius-tile', '--radius-popover', '--radius-item'].filter(isDeclared);

  return (
    <aside className="w-80 shrink-0 border-r bg-card/60 p-4 text-card-foreground overflow-y-auto space-y-6 focus-within:ring-0">
      {/* 1. Theme Mode */}
      <section aria-labelledby="heading-mode" className="space-y-2">
        <h4 id="heading-mode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Chế độ giao diện (Theme)
        </h4>
        <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted p-1 text-xs" role="radiogroup" aria-label="Chế độ giao diện">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'light'}
            className={`rounded-md py-1.5 font-medium transition-all ${
              mode === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onModeChange('light')}
          >
            Light
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'dark'}
            className={`rounded-md py-1.5 font-medium transition-all ${
              mode === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onModeChange('dark')}
          >
            Dark
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'side-by-side'}
            className={`rounded-md py-1.5 font-medium transition-all ${
              mode === 'side-by-side' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onModeChange('side-by-side')}
          >
            Song song
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Đang điều chỉnh giá trị cho theme: <span className="font-semibold">{currentTheme.toUpperCase()}</span>
        </p>
      </section>

      {/* 2. Base / Neutral Color */}
      {(isDeclared('--background') || isDeclared('--foreground')) && (
        <section aria-labelledby="heading-base" className="space-y-3">
          <h4 id="heading-base" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Màu nền tảng (Base / Neutral)
          </h4>
          <div className="space-y-2">
            {isDeclared('--background') && (
              <div className="space-y-1">
                <label htmlFor="token-input-background" className="text-xs font-medium flex justify-between">
                  <span>Nền trang (--background)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="token-input-background"
                    type="text"
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-xs font-mono"
                    value={activeTokens['--background'] || ''}
                    onChange={(e) => handleColorInput('--background', e.target.value)}
                  />
                </div>
              </div>
            )}
            {isDeclared('--foreground') && (
              <div className="space-y-1">
                <label htmlFor="token-input-foreground" className="text-xs font-medium flex justify-between">
                  <span>Chữ chính (--foreground)</span>
                </label>
                <input
                  id="token-input-foreground"
                  type="text"
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs font-mono"
                  value={activeTokens['--foreground'] || ''}
                  onChange={(e) => handleColorInput('--foreground', e.target.value)}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Primary / Accent Color with 5 shades preview */}
      {isDeclared('--primary') && (
        <section aria-labelledby="heading-primary" className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 id="heading-primary" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Màu chủ đạo (Primary · 10%)
            </h4>
            <span className="text-[10px] text-muted-foreground">5 sắc độ Danh Method</span>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="token-input-primary" className="text-xs font-medium flex justify-between">
                <span>--primary</span>
              </label>
              <input
                id="token-input-primary"
                type="text"
                className="w-full rounded-md border bg-background px-2 py-1 text-xs font-mono"
                value={activeTokens['--primary'] || ''}
                onChange={(e) => handleColorInput('--primary', e.target.value)}
              />
            </div>

            {isDeclared('--primary-foreground') && (
              <div className="space-y-1">
                <label htmlFor="token-input-primary-foreground" className="text-xs font-medium flex justify-between">
                  <span>--primary-foreground</span>
                </label>
                <input
                  id="token-input-primary-foreground"
                  type="text"
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs font-mono"
                  value={activeTokens['--primary-foreground'] || ''}
                  onChange={(e) => handleColorInput('--primary-foreground', e.target.value)}
                />
              </div>
            )}

            {/* 5 Shades Preview */}
            <div className="mt-2 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block">Xem trước 5 sắc độ:</span>
              <div className="grid grid-cols-5 gap-1 rounded-md border p-1 bg-background">
                {primaryShades.map((shade) => (
                  <div key={shade.label} className="flex flex-col items-center">
                    <div
                      className="h-7 w-full rounded border shadow-inner"
                      style={{ backgroundColor: shade.value }}
                      title={`${shade.label}: ${shade.value}`}
                    />
                    <span className="mt-1 text-[9px] font-mono text-muted-foreground text-center truncate w-full">
                      {shade.label.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Semantic Colors */}
      <section aria-labelledby="heading-semantics" className="space-y-3">
        <h4 id="heading-semantics" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Màu ngữ nghĩa (Semantics)
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {[
            { name: '--secondary', label: 'Secondary (30%)' },
            { name: '--muted', label: 'Muted (Nền tĩnh)' },
            { name: '--accent', label: 'Accent (Điểm nhấn)' },
            { name: '--destructive', label: 'Destructive / Cảnh báo' },
            { name: '--border', label: 'Border (Viền)' },
            { name: '--ring', label: 'Ring (Focus)' },
          ]
            .filter((item) => isDeclared(item.name))
            .map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <label htmlFor={`token-input-${item.name}`} className="font-mono text-muted-foreground truncate w-24">
                  {item.name}
                </label>
                <input
                  id={`token-input-${item.name}`}
                  type="text"
                  className="flex-1 rounded-md border bg-background px-2 py-1 font-mono text-xs"
                  value={activeTokens[item.name] || ''}
                  onChange={(e) => handleColorInput(item.name, e.target.value)}
                />
              </div>
            ))}
        </div>
      </section>

      {/* 5. Radius Controls */}
      {isDeclared('--radius') && (
        <section aria-labelledby="heading-radius" className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 id="heading-radius" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bo góc gốc (--radius)
            </h4>
            <span className="text-xs font-mono font-medium">{activeTokens['--radius']}</span>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-5 gap-1 text-[10px]">
            {[
              { label: '0', val: '0rem' },
              { label: 'sm', val: '0.3rem' },
              { label: 'md', val: '0.5rem' },
              { label: 'lg', val: '0.75rem' },
              { label: 'xl', val: '1.25rem' },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`rounded border py-1 font-mono ${
                  activeTokens['--radius'] === preset.val
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'bg-background hover:bg-muted'
                }`}
                onClick={() => onTokenChange('--radius', preset.val)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <label htmlFor="radius-slider">Độ cong (0px - 24px)</label>
              <span>{radiusInPx}px</span>
            </div>
            <input
              id="radius-slider"
              type="range"
              min={0}
              max={24}
              value={radiusInPx}
              onChange={(e) => handleRadiusSlider(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Role Radii if present */}
          {roleRadii.length > 0 && (
            <div className="mt-3 space-y-2 border-t pt-2">
              <span className="text-[11px] font-bold text-muted-foreground block">Bo góc theo vai (A3.7):</span>
              {roleRadii.map((role) => (
                <div key={role} className="flex items-center justify-between gap-2 text-xs">
                  <label htmlFor={`role-${role}`} className="font-mono text-muted-foreground truncate">
                    {role}
                  </label>
                  <input
                    id={`role-${role}`}
                    type="text"
                    className="w-24 rounded border bg-background px-1.5 py-0.5 text-xs font-mono"
                    value={activeTokens[role] || ''}
                    onChange={(e) => onTokenChange(role, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. Font Family */}
      {(isDeclared('--font-sans') || isDeclared('--font-heading') || isDeclared('--font-mono')) && (
        <section aria-labelledby="heading-fonts" className="space-y-3">
          <h4 id="heading-fonts" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Kiểu chữ (Font Family)
          </h4>
          <div className="space-y-2">
            {['--font-sans', '--font-heading', '--font-mono'].filter(isDeclared).map((fontToken) => (
              <div key={fontToken} className="space-y-1">
                <label htmlFor={`font-${fontToken}`} className="text-xs font-medium block">
                  {fontToken}
                </label>
                <input
                  id={`font-${fontToken}`}
                  type="text"
                  className="w-full rounded-md border bg-background px-2 py-1 text-xs font-mono"
                  value={activeTokens[fontToken] || ''}
                  onChange={(e) => onTokenChange(fontToken, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Spacing / Density */}
      {isDeclared('--spacing') && (
        <section aria-labelledby="heading-density" className="space-y-2">
          <h4 id="heading-density" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Khoảng cách & Mật độ
          </h4>
          <div className="space-y-1">
            <label htmlFor="spacing-input" className="text-xs font-medium flex justify-between">
              <span>--spacing</span>
              <span className="font-mono text-muted-foreground">{activeTokens['--spacing']}</span>
            </label>
            <input
              id="spacing-input"
              type="text"
              className="w-full rounded-md border bg-background px-2 py-1 text-xs font-mono"
              value={activeTokens['--spacing'] || ''}
              onChange={(e) => onTokenChange('--spacing', e.target.value)}
            />
          </div>
        </section>
      )}
    </aside>
  );
}
