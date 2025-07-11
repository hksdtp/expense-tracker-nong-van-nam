# Quản lý Dữ liệu Chi Tiêu - Expense Tracker

## Tổng quan

Ứng dụng Expense Tracker của Nông Văn Năm sử dụng Google Sheets làm nguồn dữ liệu chính. Tất cả dữ liệu giao dịch được lưu trữ và đồng bộ từ Google Sheets.

## Cấu hình hiện tại

- **Google Sheets ID**: `14_Y-DsQvndhsFHrwb0W12guk36zqtzUnMA5tz9jw1D4`
- **Sheet Name**: `Sheet1`
- **Service Account**: `nihreport@qlct-455215.iam.gserviceaccount.com`

## Scripts quản lý dữ liệu

### 1. Xóa toàn bộ dữ liệu
```bash
npm run data:clear
```
- Xóa tất cả giao dịch trong Google Sheets
- Giữ lại header row
- Đảm bảo sheet sạch cho dữ liệu mới

### 2. Kiểm tra kết nối Google Sheets
```bash
npm run data:verify
```
- Kiểm tra kết nối với Google Sheets
- Xác minh quyền truy cập
- Tạo sheet mới nếu cần thiết

### 3. Kiểm tra dữ liệu hiện tại
```bash
npm run data:check
```
- Hiển thị tổng quan dữ liệu trong các sheet
- So sánh dữ liệu giữa các sheet khác nhau
- Hiển thị giao dịch mẫu

### 4. Xác minh cuối cùng
```bash
npm run data:final-check
```
- Kiểm tra toàn bộ hệ thống
- Xác minh API hoạt động đúng
- Đảm bảo ứng dụng lấy dữ liệu từ nguồn đúng

## Cấu trúc dữ liệu Google Sheets

### Header (Hàng 1)
| Cột | Tên | Mô tả |
|-----|-----|-------|
| A | Ngày | Ngày giao dịch (DD/MM/YYYY) |
| B | Danh mục | Loại chi tiêu/thu nhập |
| C | Mô tả | Mô tả chi tiết giao dịch |
| D | Số tiền | Số tiền (VND) |
| E | Loại | income/expense |
| F | Link hóa đơn | URL hóa đơn/chứng từ |
| G | Thời gian | Timestamp ISO |
| H | Danh mục phụ | Phân loại chi tiết |
| I | Số lượng | Số lượng (cho xăng, v.v.) |
| J | Phương thức thanh toán | cash/transfer/card |
| K | Ghi chú | Ghi chú thêm |
| L | URL ảnh | Link ảnh chứng từ |

## Quy trình làm việc

### Khi bắt đầu dự án mới:
1. Chạy `npm run data:clear` để xóa dữ liệu cũ
2. Chạy `npm run data:final-check` để xác minh
3. Bắt đầu thêm dữ liệu mới vào Google Sheets

### Khi có vấn đề với dữ liệu:
1. Chạy `npm run data:check` để kiểm tra tình trạng
2. Chạy `npm run data:verify` để kiểm tra kết nối
3. Nếu cần thiết, chạy `npm run data:clear` để reset

### Khi triển khai:
1. Đảm bảo biến môi trường được cấu hình đúng
2. Chạy `npm run data:final-check` để xác minh
3. Kiểm tra ứng dụng hoạt động bình thường

## Biến môi trường

Trong file `.env.local`:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL="nihreport@qlct-455215.iam.gserviceaccount.com"
GOOGLE_SHEETS_SHEET_ID="14_Y-DsQvndhsFHrwb0W12guk36zqtzUnMA5tz9jw1D4"
GOOGLE_SHEETS_SHEET_NAME="Sheet1"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="dgaktc3fb"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## Lưu ý quan trọng

1. **Backup dữ liệu**: Luôn backup Google Sheets trước khi chạy `data:clear`
2. **Quyền truy cập**: Đảm bảo service account có quyền edit Google Sheets
3. **Cache**: API có cache, sử dụng `forceRefresh=true` để lấy dữ liệu mới nhất
4. **Định dạng ngày**: Sử dụng DD/MM/YYYY cho nhất quán
5. **Số tiền**: Lưu dưới dạng số nguyên (VND)

## Troubleshooting

### Lỗi "PERMISSION_DENIED"
- Kiểm tra service account có quyền truy cập Google Sheets
- Chia sẻ Google Sheets với email service account

### Lỗi "SPREADSHEET_NOT_FOUND"
- Kiểm tra GOOGLE_SHEETS_SHEET_ID có đúng không
- Đảm bảo Google Sheets tồn tại và có thể truy cập

### API trả về dữ liệu cũ
- Sử dụng `forceRefresh=true` trong URL
- Restart server để clear cache
- Kiểm tra đang đọc đúng sheet

### Ứng dụng không hiển thị dữ liệu mới
- Kiểm tra format dữ liệu trong Google Sheets
- Xác minh header đúng định dạng
- Chạy `npm run data:final-check` để debug

## Liên hệ

Nếu có vấn đề với quản lý dữ liệu, vui lòng liên hệ team phát triển với thông tin chi tiết về lỗi và các bước đã thực hiện.
