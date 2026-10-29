import React from 'react';

interface TypographyScaleProps {
  tokens: Record<string, string>;
}

export function TypographyScale({ tokens }: TypographyScaleProps) {
  const fontSans = tokens['--font-sans'] || 'inherit';
  const fontHeading = tokens['--font-heading'] || fontSans;
  const fontMono = tokens['--font-mono'] || 'monospace';

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
      <div className="border-b pb-2">
        <h3 className="text-lg font-bold tracking-tight">Thang đo kiểu chữ (Typography Scale)</h3>
        <p className="text-xs text-muted-foreground">
          Sans: <span className="font-mono">{fontSans}</span> | Heading: <span className="font-mono">{fontHeading}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono text-muted-foreground block mb-1">Heading 1 · text-4xl font-extrabold</span>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ fontFamily: fontHeading }}>
            Hệ thống Design Token Thông minh
          </h1>
        </div>

        <div>
          <span className="text-xs font-mono text-muted-foreground block mb-1">Heading 2 · text-3xl font-semibold</span>
          <h2 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: fontHeading }}>
            Xem trước trực quan và duyệt nhanh chóng
          </h2>
        </div>

        <div>
          <span className="text-xs font-mono text-muted-foreground block mb-1">Heading 3 · text-2xl font-semibold</span>
          <h3 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: fontHeading }}>
            Tương thích đa thư viện UI (shadcn/ui & HeroUI)
          </h3>
        </div>

        <div>
          <span className="text-xs font-mono text-muted-foreground block mb-1">Body Text · text-base font-normal</span>
          <p className="text-base leading-relaxed" style={{ fontFamily: fontSans }}>
            Danh Method giúp các bên liên quan xem trước trực quan các thành phần UI thực tế,
            đo lường độ tương phản màu sắc theo chuẩn WCAG AA và duyệt đề xuất thay đổi trước khi nạp lại mã nguồn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-mono text-muted-foreground block mb-1">Small / UI Label · text-sm font-medium</span>
            <p className="text-sm font-medium" style={{ fontFamily: fontSans }}>
              Nhãn trường dữ liệu, trạng thái giao dịch và tooltip
            </p>
          </div>
          <div>
            <span className="text-xs font-mono text-muted-foreground block mb-1">Muted Text · text-sm text-muted-foreground</span>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: fontSans }}>
              Chú thích phụ, thời gian cập nhật lần cuối
            </p>
          </div>
        </div>

        <div>
          <span className="text-xs font-mono text-muted-foreground block mb-1">Code / Data · text-sm font-mono</span>
          <pre className="rounded bg-muted p-3 text-xs font-mono text-foreground overflow-x-auto" style={{ fontFamily: fontMono }}>
            --primary: {tokens['--primary'] || 'var(--primary)'}; --radius: {tokens['--radius'] || 'var(--radius)'};
          </pre>
        </div>
      </div>
    </div>
  );
}
