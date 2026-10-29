import React from 'react';
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
      {/* 1. Dashboard Cards */}
      <section className="space-y-3" aria-labelledby="heroui-cards">
        <h3 id="heroui-cards" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Bảng điều khiển (Cards)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border">
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-semibold">Tăng trưởng khách hàng</CardTitle>
              <Chip color="default" variant="primary">
                +28.4%
              </Chip>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">14,820</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Khách hàng kích hoạt</CardDescription>
            </CardContent>
            <CardFooter className="pt-0 text-[11px] text-muted-foreground">
              Mục tiêu Q4 đạt 100%
            </CardFooter>
          </Card>

          <Card className="border">
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-semibold">Thời gian phản hồi</CardTitle>
              <Chip color="success" variant="soft">
                Tối ưu
              </Chip>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">120ms</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Giảm 35ms so với tuần trước</CardDescription>
            </CardContent>
            <CardFooter className="pt-0 text-[11px] text-muted-foreground">
              SLA đạt 99.98%
            </CardFooter>
          </Card>

          <Card className="border">
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-semibold">Tỷ lệ thanh toán</CardTitle>
              <Chip color="warning" variant="soft">
                Cần theo dõi
              </Chip>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-2xl font-bold">94.2%</div>
              <CardDescription className="text-xs text-muted-foreground mt-1">Cổng thanh toán tự động</CardDescription>
            </CardContent>
            <CardFooter className="pt-0 text-[11px] text-muted-foreground">
              0.8% giao dịch treo
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 2. Buttons & Chips */}
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
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="tertiary">Tertiary</Button>
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

          <div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Huy hiệu (Chips):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Chip color="default" variant="primary">Primary Chip</Chip>
              <Chip color="default" variant="secondary">Secondary Chip</Chip>
              <Chip color="success" variant="soft">Success Soft</Chip>
              <Chip color="danger" variant="soft">Red Flag</Chip>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Form Controls */}
      <section className="space-y-3" aria-labelledby="heroui-forms">
        <h3 id="heroui-forms" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Biểu mẫu nhập liệu (Form Controls)
        </h3>
        <Card className="p-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Tên dự án</label>
                <Input placeholder="Nhập tên dự án hoặc portal" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Mã định danh token</label>
                <Input placeholder="--primary-500" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center space-x-2">
                <Checkbox defaultSelected>
                  Xác nhận kiểm thử trên trình duyệt headless
                </Checkbox>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium">Bật thông báo duyệt nhanh</span>
                  <p className="text-xs text-muted-foreground">Gửi thông báo qua kênh chat điều phối</p>
                </div>
                <Switch defaultSelected />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Mức độ hoàn thành Gate G0</span>
                </div>
                <Slider defaultValue={75} />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Table */}
      <section className="space-y-3" aria-labelledby="heroui-table">
        <h3 id="heroui-table" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Bảng dữ liệu (Table)
        </h3>
        <Card className="border overflow-hidden">
          <Table aria-label="HeroUI Review Table">
            <TableHeader>
              <TableColumn>MÃ GIAO DỊCH</TableColumn>
              <TableColumn>LOẠI TOKEN</TableColumn>
              <TableColumn>TRẠNG THÁI</TableColumn>
              <TableColumn>GIÁ TRỊ HIỆN TẠI</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell className="font-mono">#TX-109</TableCell>
                <TableCell>--primary</TableCell>
                <TableCell><Chip color="success" variant="soft">Đạt chuẩn</Chip></TableCell>
                <TableCell className="font-mono text-xs">var(--primary)</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell className="font-mono">#TX-110</TableCell>
                <TableCell>--radius-card</TableCell>
                <TableCell><Chip color="default" variant="primary">Khớp vai</Chip></TableCell>
                <TableCell className="font-mono text-xs">var(--radius-card)</TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell className="font-mono">#TX-111</TableCell>
                <TableCell>--destructive</TableCell>
                <TableCell><Chip color="danger" variant="soft">Kiểm tra lại</Chip></TableCell>
                <TableCell className="font-mono text-xs">var(--destructive)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
