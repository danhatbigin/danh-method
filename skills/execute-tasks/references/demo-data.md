# Dữ liệu demo và đồng hồ (A5.7, A5.8)

1. Báo trước dataset, DB đích, số bản ghi, giữ hay tua đồng hồ và hệ quả; chỉ nạp khi phạm vi được cho phép.
2. `pg_dump` backup trước ghi; giữ dump ngoài Git, không ghi credential vào log.
3. Dry-run seed trên DB tạm độc lập; dữ liệu hư cấu hoàn toàn.
4. Script khẳng định sau nạp: số lượng, quan hệ, trạng thái, ngày/múi giờ và giá trị mẫu theo hợp đồng. Thiếu dữ liệu không biến thành 0.
5. “Dời lịch demo” = nạp lại seed theo mốc đã chốt, không sửa lẻ từng cột ngày.
6. Nghiệm thu ghi rõ giữ hay tua đồng hồ. Chỉ dọn DB tạm khi xác minh tiền tố, chủ sở hữu và phạm vi; không xoá DB không rõ chủ.
