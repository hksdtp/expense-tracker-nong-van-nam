# Hướng dẫn cấu hình Cloudinary

## Tại sao cần Cloudinary?

Cloudinary được sử dụng để lưu trữ ảnh hóa đơn/chứng từ khi thêm giao dịch. Hiện tại ứng dụng đã cấu hình sẵn nhưng cần API keys thực để hoạt động.

## Bước 1: Tạo tài khoản Cloudinary (MIỄN PHÍ)

1. Truy cập: https://cloudinary.com/
2. Nhấn "Sign Up for Free"
3. Đăng ký với email của bạn
4. Xác nhận email và đăng nhập

## Bước 2: Lấy thông tin API

1. Sau khi đăng nhập, vào **Dashboard**
2. Bạn sẽ thấy thông tin:
   ```
   Cloud Name: your-cloud-name
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz123456
   ```

## Bước 3: Cập nhật file .env.local

Mở file `.env.local` và thay thế:

```env
# Cloudinary (shared account with separate folder)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123456"
CLOUDINARY_FOLDER="expense-receipts"
```

**Thay thế:**
- `your-cloud-name` → Cloud Name từ Dashboard
- `123456789012345` → API Key từ Dashboard  
- `abcdefghijklmnopqrstuvwxyz123456` → API Secret từ Dashboard

## Bước 4: Kiểm tra cấu hình

Chạy lệnh để kiểm tra:

```bash
npm run test:cloudinary
```

Nếu thành công, bạn sẽ thấy:
```
✅ Cloudinary SDK kết nối thành công
📊 Status: ok
```

## Bước 5: Test upload ảnh

1. Khởi động server: `npm run dev`
2. Mở ứng dụng: http://localhost:3000
3. Thêm giao dịch mới
4. Thử upload ảnh hóa đơn
5. Kiểm tra ảnh được lưu thành công

## Giải pháp tạm thời (nếu không muốn cấu hình Cloudinary)

Nếu bạn không muốn cấu hình Cloudinary ngay, có thể:

1. **Bỏ qua upload ảnh** - Thêm giao dịch mà không upload ảnh
2. **Sử dụng Google Drive** - Có sẵn API upload lên Google Drive (nhưng chậm hơn)

## Lưu ý bảo mật

- **KHÔNG** commit file `.env.local` lên Git
- **KHÔNG** chia sẻ API Secret với ai
- API keys này chỉ dành cho development, production cần keys riêng

## Troubleshooting

### Lỗi "Invalid API key"
- Kiểm tra lại API Key từ Dashboard
- Đảm bảo không có khoảng trắng thừa

### Lỗi "Invalid cloud name"  
- Kiểm tra lại Cloud Name từ Dashboard
- Cloud Name không có dấu cách hoặc ký tự đặc biệt

### Lỗi "Upload failed"
- Kiểm tra kết nối internet
- Thử upload ảnh nhỏ hơn (< 5MB)
- Restart server sau khi cập nhật .env.local

## Giới hạn tài khoản miễn phí

Cloudinary miễn phí cho phép:
- 25 GB storage
- 25 GB bandwidth/tháng  
- 1000 transformations/tháng

Đủ cho việc sử dụng cá nhân lâu dài.

## Liên hệ

Nếu gặp khó khăn trong việc cấu hình, hãy liên hệ để được hỗ trợ.
