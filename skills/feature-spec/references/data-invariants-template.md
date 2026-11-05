# Bất biến khi ghi dữ liệu (mẫu trung lập)

Chép vào repo code (`docs/engineering/data-invariants.md`) hoặc GUIDANCE của feature, rồi điều chỉnh theo stack. Owner kỹ thuật duyệt; PO duyệt nghiệp vụ. Đây là **chuẩn để quét và để test**, không phải khẳng định code hiện tại đã tuân thủ.

**Vì sao cần viết ra:** khi spec không có bất biến kỹ thuật, agent sửa theo từng finding (điểm), review trả về từng trường hợp, và một bất biến có thể mất nhiều vòng mới lan hết các hàm ghi. Có bất biến + bản đồ ghi thì một lượt sửa quét được cả nhóm writer.

## INV-01 · Thứ tự khoá và đọc lại
Mỗi giao dịch ghi dữ liệu thuộc một chủ thể (khách hàng, tài khoản…) lấy khoá chủ thể trước khoá dòng; nhiều chủ thể thì khoá theo ID đã sắp xếp. Sau khoá **đọc lại** và kiểm trạng thái/quyền trước khi ghi; không quyết định dựa trên snapshot đọc trước khoá.

## INV-02 · Token phiên bản bắt buộc ở tầng domain
UI → action → domain truyền token của đúng bản người dùng đã thấy. Domain **từ chối** token thiếu hoặc cũ; không khai báo tham số tuỳ chọn. Độ chính xác token phân biệt được hai lần ghi trong cùng giây. Tạo mới (không có bản trước) ghi rõ tiền điều kiện/idempotency thay token.
*Lý do:* chỉ ép ở server action mà domain để tuỳ chọn thì mọi đường gọi khác (job, helper, test) lách được.

## INV-03 · Phủ mọi đường ghi
Bản đồ bảng → hàm tính cả helper nhận repository, hành động người dùng, chuyển đổi dữ liệu giữa thực thể và **job nền**. Mỗi nhánh của job khoá rồi đọc lại điều kiện, kể cả nhánh chỉ mở việc cần làm hay gửi thông báo.
*Lý do:* job nền là nơi dễ sót nhất vì không có màn hình nào dẫn tới nó.

## INV-04 · Đổi quan hệ 1→N
Đổi quan hệ thì rà schema, unique/FK, migration/backfill, repository, service, reader và UI/test phụ thuộc. Không sửa service rồi giữ unique cũ. Migration mới sinh trong vòng review phải đối chiếu số thứ tự với các nhánh song song.

## INV-05 · Ngân sách quy mô
GUIDANCE chốt trần dòng SQL đọc, dòng hydrate, số bind và bytes payload theo màn hình; kiểm trên tập lớn. Số câu truy vấn không đổi **không** chứng minh chi phí bị chặn. Không tự bịa ngân sách chưa được duyệt.

## INV-06 · Vai trò × trạng thái × dữ liệu nhạy cảm
Liệt kê vai trò × trạng thái × thao tác × trường được đọc. Server kiểm quyền và trạng thái **sau khoá**, không chỉ ẩn nút. Reader lọc dữ liệu nhạy cảm trước khi trả, kể cả trường phụ và bộ lọc có thể làm lộ dữ liệu.

## INV-07 · Bằng chứng test
Tranh chấp: ép xen kẽ bằng hai giao dịch có điểm dừng xác định (giữ A tại một điểm, chờ tới khi B thật sự đợi khoá). Chạy song song hay ngủ **không** chứng minh có khoá. Test sửa lỗi đỏ khi bỏ bản sửa, xanh khi khôi phục; không assertion luôn đúng. Quy mô đo dòng/bind/payload. Quyền kiểm đủ ma trận INV-06.

## Bản đồ ghi (điền cho từng feature)

| Bảng | Writer | Loại (action/domain/job/helper/seed) | Khoá | Đọc lại | Token | INV |
|---|---|---|---|---|---|---|
