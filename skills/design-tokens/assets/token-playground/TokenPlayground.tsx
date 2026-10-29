import React, { useState, useEffect, useMemo, useRef } from 'react';
import manifestData from './manifest.json';
import { validateBundle, parseBundle, toMarkdown, TokenBundle } from './token-parameters';
import { ThemeControls, ThemeMode } from './controls/ThemeControls';
import { ShadcnPreview, isShadcnInstalled } from './preview/ShadcnPreview';
import { HeroUIPreview, isHeroUIInstalled } from './preview/HeroUIPreview';
import { ContrastGrid } from './preview/ContrastGrid';
import { TypographyScale } from './preview/TypographyScale';

const baseline: TokenBundle = {
  schemaVersion: 1,
  source: (manifestData as any).source,
  tokens: (manifestData as any).tokens,
};

function tokensToCssRules(selector: string, tokenMap: Record<string, string>): string {
  const entries = Object.entries(tokenMap)
    .filter(([_, v]) => Boolean(v))
    .map(([k, v]) => `  ${k}: ${v} !important;`)
    .join('\n');
  return `${selector} {\n${entries}\n}`;
}

export function TokenPlayground() {
  const [tokens, setTokens] = useState<{ light: Record<string, string>; dark: Record<string, string> }>(() =>
    structuredClone(baseline.tokens)
  );

  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('theme');
      if (q === 'dark' || q === 'light') return q;
      if (document.documentElement.classList.contains('dark')) return 'dark';
    }
    return 'light';
  });

  const [statusMessage, setStatusMessage] = useState<string>('Sẵn sàng điều chỉnh token.');
  const [activeTab, setActiveTab] = useState<'shadcn' | 'heroui' | 'contrast'>(() => {
    if (isShadcnInstalled) return 'shadcn';
    if (isHeroUIInstalled) return 'heroui';
    return 'contrast';
  });

  const [cssModalOpen, setCssModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize CSS overrides with document.head
  useEffect(() => {
    let styleEl = document.getElementById('playground-token-overrides');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'playground-token-overrides';
      document.head.appendChild(styleEl);
    }

    const rootCss = tokensToCssRules(':root', tokens.light);
    const darkCss = tokensToCssRules('.dark', tokens.dark);
    styleEl.textContent = `${rootCss}\n\n${darkCss}`;

    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    } else {
      // Side-by-side mode: root stays light, column handles dark
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [tokens, mode]);

  const activeThemeName: 'light' | 'dark' = mode === 'dark' ? 'dark' : 'light';
  const activeTokens = tokens[activeThemeName];
  const declaredTokens = baseline.tokens[activeThemeName];

  const handleTokenChange = (name: string, value: string) => {
    const nextTokens = structuredClone(tokens);
    nextTokens[activeThemeName][name] = value;

    try {
      validateBundle({ schemaVersion: 1, source: baseline.source, tokens: nextTokens }, baseline);
      setTokens(nextTokens);
      setStatusMessage(`Đã cập nhật ${name} = ${value}`);
    } catch (err: any) {
      setStatusMessage(`Lỗi giá trị token: ${err.message}`);
    }
  };

  const handleReset = () => {
    setTokens(structuredClone(baseline.tokens));
    setStatusMessage('Đã khôi phục về snapshot gốc ban đầu.');
  };

  const handleExportJson = () => {
    try {
      const bundle: TokenBundle = {
        schemaVersion: 1,
        source: baseline.source,
        tokens,
      };
      validateBundle(bundle, baseline);
      const text = JSON.stringify(bundle, null, 2) + '\n';
      downloadFile(text, 'token-parameters.json', 'application/json');
      setStatusMessage('Đã xuất token-parameters.json thành công.');
    } catch (err: any) {
      setStatusMessage(`Lỗi xuất JSON: ${err.message}`);
    }
  };

  const handleExportMd = () => {
    try {
      const bundle: TokenBundle = {
        schemaVersion: 1,
        source: baseline.source,
        tokens,
      };
      const text = toMarkdown(bundle);
      downloadFile(text, 'token-parameters.md', 'text/markdown');
      setStatusMessage('Đã xuất token-parameters.md thành công.');
    } catch (err: any) {
      setStatusMessage(`Lỗi xuất Markdown: ${err.message}`);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = parseBundle(text, baseline);
      setTokens(imported.tokens);
      setStatusMessage(`Đã nạp thành công proposal từ ${file.name}.`);
    } catch (err: any) {
      setStatusMessage(`Lỗi nạp file: ${err.message}`);
    }
    event.target.value = '';
  };

  const generatedCssText = useMemo(() => {
    return `/* Design Tokens · Proposal */\n${tokensToCssRules(':root', tokens.light)}\n\n${tokensToCssRules('.dark', tokens.dark)}`;
  }, [tokens]);

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground antialiased overflow-hidden font-sans">
      {/* Top Navigation & Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 bg-card/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
              D
            </span>
            <h1 className="text-sm font-bold tracking-tight">Design Token Playground</h1>
          </div>
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground border">
            {baseline.source.id}
          </span>
        </div>

        {/* Live Status Output */}
        <div className="hidden md:flex items-center px-2">
          <output
            role="status"
            aria-live="polite"
            className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1 rounded-full border"
          >
            {statusMessage}
          </output>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border bg-background px-2.5 py-1.5 font-medium hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            title="Khôi phục về snapshot ban đầu"
          >
            Khôi phục
          </button>

          <button
            type="button"
            onClick={() => setCssModalOpen(true)}
            className="rounded-md border bg-background px-2.5 py-1.5 font-medium hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            title="Xem và sao chép CSS"
          >
            Xuất CSS
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="rounded-md border bg-background px-2.5 py-1.5 font-medium hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            title="Xuất JSON đề xuất (schemaVersion 1)"
          >
            Xuất JSON
          </button>

          <button
            type="button"
            onClick={handleExportMd}
            className="rounded-md border bg-background px-2.5 py-1.5 font-medium hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            title="Xuất Markdown proposal"
          >
            Xuất MD
          </button>

          <label className="cursor-pointer rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 font-medium hover:bg-primary/90 transition-colors focus-within:ring-2 focus-within:ring-primary">
            Nhập JSON/MD
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.md,application/json,text/markdown"
              onChange={handleImportFile}
              className="sr-only"
            />
          </label>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Controls */}
        <ThemeControls
          mode={mode}
          onModeChange={setMode}
          activeTokens={activeTokens}
          declaredTokens={declaredTokens}
          onTokenChange={handleTokenChange}
          currentTheme={activeThemeName}
        />

        {/* Right Preview Canvas */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Library Selection Tabs */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex gap-2 text-xs font-medium">
                {isShadcnInstalled && (
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 transition-all ${
                      activeTab === 'shadcn'
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'bg-card text-muted-foreground hover:text-foreground border'
                    }`}
                    onClick={() => setActiveTab('shadcn')}
                  >
                    shadcn/ui
                  </button>
                )}
                {isHeroUIInstalled && (
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1.5 transition-all ${
                      activeTab === 'heroui'
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'bg-card text-muted-foreground hover:text-foreground border'
                    }`}
                    onClick={() => setActiveTab('heroui')}
                  >
                    HeroUI
                  </button>
                )}
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 transition-all ${
                    activeTab === 'contrast'
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-card text-muted-foreground hover:text-foreground border'
                  }`}
                  onClick={() => setActiveTab('contrast')}
                >
                  Tương phản & Kiểu chữ
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                Hiển thị: <span className="font-semibold capitalize">{mode}</span>
              </div>
            </div>

            {/* Standard Single View or Side-by-Side View */}
            {mode === 'side-by-side' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Light Side */}
                <div className="space-y-6 rounded-2xl border bg-background p-6 shadow-sm">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <span className="font-bold text-sm">Chế độ Sáng (Light)</span>
                    <span className="text-xs text-muted-foreground font-mono">mode: light</span>
                  </div>
                  {activeTab === 'shadcn' && isShadcnInstalled && <ShadcnPreview />}
                  {activeTab === 'heroui' && isHeroUIInstalled && <HeroUIPreview />}
                  {activeTab === 'contrast' && (
                    <div className="space-y-6">
                      <ContrastGrid tokens={tokens.light} themeName="Light" />
                      <TypographyScale tokens={tokens.light} />
                    </div>
                  )}
                </div>

                {/* Dark Side */}
                <div
                  className="dark space-y-6 rounded-2xl border bg-background text-foreground p-6 shadow-sm"
                  style={{
                    backgroundColor: tokens.dark['--background'] || '#0a0a0a',
                    color: tokens.dark['--foreground'] || '#fafafa',
                  }}
                >
                  <div className="border-b pb-2 flex justify-between items-center">
                    <span className="font-bold text-sm">Chế độ Tối (Dark)</span>
                    <span className="text-xs text-muted-foreground font-mono">mode: dark</span>
                  </div>
                  {activeTab === 'shadcn' && isShadcnInstalled && <ShadcnPreview />}
                  {activeTab === 'heroui' && isHeroUIInstalled && <HeroUIPreview />}
                  {activeTab === 'contrast' && (
                    <div className="space-y-6">
                      <ContrastGrid tokens={tokens.dark} themeName="Dark" />
                      <TypographyScale tokens={tokens.dark} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {activeTab === 'shadcn' && isShadcnInstalled && <ShadcnPreview />}
                {activeTab === 'heroui' && isHeroUIInstalled && <HeroUIPreview />}
                {activeTab === 'contrast' && (
                  <div className="space-y-8">
                    <ContrastGrid tokens={activeTokens} themeName={activeThemeName.toUpperCase()} />
                    <TypographyScale tokens={activeTokens} />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CSS Export Modal */}
      {cssModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base">Xuất CSS Custom Properties (:root & .dark)</h3>
              <button
                type="button"
                onClick={() => setCssModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <textarea
              readOnly
              rows={12}
              className="w-full rounded-md border bg-muted p-3 font-mono text-xs text-foreground focus:outline-none"
              value={generatedCssText}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCssText);
                  setStatusMessage('Đã sao chép CSS vào clipboard.');
                  setCssModalOpen(false);
                }}
                className="rounded-md bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
              >
                Sao chép Clipboard
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadFile(generatedCssText, 'tokens.css', 'text/css');
                  setCssModalOpen(false);
                }}
                className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
              >
                Tải file tokens.css
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenPlayground;
