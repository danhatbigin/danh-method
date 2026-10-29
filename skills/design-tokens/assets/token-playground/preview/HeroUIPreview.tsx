import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Chip,
  Description,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Slider,
  Switch,
  Table,
  Tabs,
  TextField,
} from '@heroui/react';

export const isHeroUIInstalled = true;

export function HeroUIPreview() {
  const [sliderVal, setSliderVal] = useState([75]);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <div className="space-y-8">
      {/* 1. Alerts */}
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
      </section>

      {/* 2. Dashboard Cards */}
      <section className="space-y-3" aria-labelledby="heroui-cards">
        <h3 id="heroui-cards" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Bảng điều khiển (Cards)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border">
            <Card.Header className="flex justify-between items-center pb-2">
              <Card.Title className="text-sm font-semibold">Tăng trưởng khách hàng</Card.Title>
              <Chip color="default" variant="primary">
                +28.4%
              </Chip>
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
              <Chip color="success" variant="soft">
                Tối ưu
              </Chip>
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
              <Chip color="warning" variant="soft">
                Cần theo dõi
              </Chip>
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
      </section>

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

          <div className="space-y-2 border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground block">Huy hiệu (Chips):</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Chip color="accent" variant="primary">Accent Primary</Chip>
              <Chip color="default" variant="secondary">Default Secondary</Chip>
              <Chip color="success" variant="soft">Success Soft</Chip>
              <Chip color="warning" variant="tertiary">Warning Tertiary</Chip>
              <Chip color="danger" variant="soft">Danger Red Flag</Chip>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-3" aria-labelledby="heroui-forms">
        <h3 id="heroui-forms" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Biểu mẫu nhập liệu (Form Controls)
        </h3>
        <Card className="p-6 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <TextField className="space-y-1.5">
                <Label className="text-sm font-medium">Tên dự án</Label>
                <Input placeholder="Nhập tên dự án hoặc portal" />
                <Description className="text-xs text-muted-foreground">Dùng để định danh dự án trên Token Playground.</Description>
              </TextField>

              <Select defaultSelectedKey="lead" className="space-y-1.5 w-full">
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
              </Select>
            </div>

            <div className="space-y-5">
              <div className="flex items-center space-x-2">
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
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
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
              </div>

              <div className="space-y-2">
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
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Tabs */}
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
      </section>

      {/* 6. Table */}
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
                    <Table.Cell><Chip color="success" variant="soft">Đạt chuẩn</Chip></Table.Cell>
                    <Table.Cell className="font-mono text-xs">var(--accent)</Table.Cell>
                  </Table.Row>
                  <Table.Row id="tx-110">
                    <Table.Cell className="font-mono">#TX-110</Table.Cell>
                    <Table.Cell>--radius</Table.Cell>
                    <Table.Cell><Chip color="default" variant="primary">Khớp vai</Chip></Table.Cell>
                    <Table.Cell className="font-mono text-xs">var(--radius)</Table.Cell>
                  </Table.Row>
                  <Table.Row id="tx-111">
                    <Table.Cell className="font-mono">#TX-111</Table.Cell>
                    <Table.Cell>--danger</Table.Cell>
                    <Table.Cell><Chip color="danger" variant="soft">Kiểm tra lại</Chip></Table.Cell>
                    <Table.Cell className="font-mono text-xs">var(--danger)</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card>
      </section>

      {/* 7. Modal & Dropdown Overlays */}
      <section className="space-y-3" aria-labelledby="heroui-overlays">
        <h3 id="heroui-overlays" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          HeroUI · Cửa sổ nổi & Menu (Modal & Dropdown)
        </h3>
        <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-4 items-center">
          <Modal>
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
          </Modal>

          <Dropdown>
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
          </Dropdown>
        </div>
      </section>
    </div>
  );
}
