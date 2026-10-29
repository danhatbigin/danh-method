import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const isShadcnInstalled = true;

export function ShadcnPreview() {
  const [sliderVal, setSliderVal] = useState([65]);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <div className="space-y-8">
      {/* 1. Alerts */}
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
      </section>

      {/* 2. Dashboard Cards */}
      <section className="space-y-3" aria-labelledby="shadcn-cards">
        <h3 id="shadcn-cards" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Bảng điều khiển (Dashboard Card Set)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <Badge variant="outline">+20.1%</Badge>
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
              <Badge>Mới</Badge>
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
              <Badge variant="secondary">Ổn định</Badge>
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
      </section>

      {/* 3. Buttons & Badges */}
      <section className="space-y-3" aria-labelledby="shadcn-buttons">
        <h3 id="shadcn-buttons" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Nút bấm & Huy hiệu (Buttons & Badges)
        </h3>
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
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
          </div>

          <div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Huy hiệu (Badges):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="default">Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
              <Badge variant="destructive">Red Flag / Danger</Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-3" aria-labelledby="shadcn-forms">
        <h3 id="shadcn-forms" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Biểu mẫu nhập liệu (Form Controls)
        </h3>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="shadcn-input-email" className="text-sm font-medium">
                  Địa chỉ Email
                </label>
                <Input id="shadcn-input-email" type="email" placeholder="nguoidung@example.com" />
                <p className="text-xs text-muted-foreground">Dùng để nhận báo cáo duyệt design token.</p>
              </div>

              <div className="space-y-1.5">
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
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shadcn-terms"
                  checked={checkboxChecked}
                  onCheckedChange={(checked) => setCheckboxChecked(Boolean(checked))}
                />
                <label htmlFor="shadcn-terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                  Tuân thủ quy chuẩn tương phản WCAG 2.1 AA
                </label>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
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
              </div>

              <div className="space-y-2">
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
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Tabs */}
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
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-1">Mục tiêu đợt điều chỉnh token</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tối ưu tỷ lệ tương phản cho cặp màu chính (--primary & --primary-foreground), đồng thời
                căn chỉnh bo góc theo vai card, tile, popover theo chuẩn kiến trúc Danh Method Stage 2.
              </p>
            </Card>
          </TabsContent>
          <TabsContent value="specs">
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-1">Quy định kỹ thuật</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tokens phải khai báo đầy đủ cho hai chế độ light và dark. Không phát sinh token ngoài danh mục đã duyệt.
              </p>
            </Card>
          </TabsContent>
          <TabsContent value="notes">
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-1">Nhật ký TOKENS-NOTES</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                G0 chốt ngày 29/10/2026 bởi người phụ trách. Xuất đề xuất qua toolbar để nạp lại mã nguồn.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* 6. Data Table */}
      <section className="space-y-3" aria-labelledby="shadcn-table">
        <h3 id="shadcn-table" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Bảng dữ liệu (Data Table)
        </h3>
        <Card className="overflow-hidden">
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
                <TableCell><Badge variant="default">Đã duyệt</Badge></TableCell>
                <TableCell>anh Danh</TableCell>
                <TableCell className="text-right font-mono font-semibold text-emerald-600">6.08:1</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-medium">G0-002</TableCell>
                <TableCell>Bo góc Role Card / Tile / Popover</TableCell>
                <TableCell><Badge variant="secondary">Đang duyệt</Badge></TableCell>
                <TableCell>Lead</TableCell>
                <TableCell className="text-right font-mono">16px/12px</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono font-medium">G0-003</TableCell>
                <TableCell>Red-flag Cảnh báo vi phạm</TableCell>
                <TableCell><Badge variant="destructive">Cần chỉnh</Badge></TableCell>
                <TableCell>QA</TableCell>
                <TableCell className="text-right font-mono font-semibold text-emerald-600">5.62:1</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* 7. Dialog & Dropdown Triggers */}
      <section className="space-y-3" aria-labelledby="shadcn-overlays">
        <h3 id="shadcn-overlays" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Cửa sổ nổi & Menu (Dialog & Dropdown)
        </h3>
        <Card className="p-4 flex flex-wrap gap-4 items-center">
          <Dialog>
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
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:bg-secondary/80">
              Tuỳ chọn thao tác ▼
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Sao chép định dạng CSS</DropdownMenuItem>
              <DropdownMenuItem>Tải bản đồ token</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Đặt lại mặc định</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Card>
      </section>
    </div>
  );
}
