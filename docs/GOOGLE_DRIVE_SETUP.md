# Google Drive API Setup for Image Upload

## Hướng dẫn thiết lập Google Drive API để upload ảnh hóa đơn

### 1. Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Ghi nhớ Project ID

### 2. Kích hoạt Google Drive API

1. Trong Google Cloud Console, vào **APIs & Services** > **Library**
2. Tìm kiếm "Google Drive API"
3. Click **Enable** để kích hoạt API

### 3. Tạo Service Account

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Điền thông tin:
   - Service account name: `expense-tracker-drive`
   - Service account ID: `expense-tracker-drive`
   - Description: `Service account for expense tracker image uploads`
4. Click **Create and Continue**
5. Gán role **Editor** hoặc **Storage Admin**
6. Click **Done**

### 4. Tạo Service Account Key

1. Trong danh sách Service Accounts, click vào service account vừa tạo
2. Vào tab **Keys**
3. Click **Add Key** > **Create new key**
4. Chọn **JSON** format
5. Click **Create** - file JSON sẽ được download

### 5. Tạo Google Drive Folder

1. Truy cập [Google Drive](https://drive.google.com/)
2. Tạo folder mới với tên `Expense Receipts`
3. Right-click folder > **Share**
4. Thêm email của service account (từ file JSON) với quyền **Editor**
5. Copy Folder ID từ URL (phần sau `/folders/`)

### 6. Cấu hình Environment Variables

Thêm vào file `.env.local`:

```env
# Google Drive Configuration for Image Upload
GOOGLE_DRIVE_FOLDER_ID=your-google-drive-folder-id-here
GOOGLE_SERVICE_ACCOUNT_EMAIL=expense-tracker-drive@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key from JSON file here\n-----END PRIVATE KEY-----"
```

### 7. Lấy thông tin từ Service Account JSON

Từ file JSON đã download, copy các giá trị:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "expense-tracker-drive@your-project-id.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 8. Cập nhật Environment Variables

```env
GOOGLE_DRIVE_FOLDER_ID=1ABC123DEF456GHI789JKL  # Folder ID từ bước 5
GOOGLE_SERVICE_ACCOUNT_EMAIL=expense-tracker-drive@your-project-id.iam.gserviceaccount.com  # client_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"  # private_key
```

### 9. Test Setup

Restart development server và test upload ảnh:

```bash
npm run dev
```

### 10. Troubleshooting

#### Lỗi "Permission denied"
- Kiểm tra service account đã được share folder chưa
- Kiểm tra role của service account

#### Lỗi "Invalid credentials"
- Kiểm tra GOOGLE_PRIVATE_KEY có đúng format không
- Kiểm tra GOOGLE_SERVICE_ACCOUNT_EMAIL có đúng không

#### Lỗi "Folder not found"
- Kiểm tra GOOGLE_DRIVE_FOLDER_ID có đúng không
- Kiểm tra folder có tồn tại và được share không

### 11. Security Notes

- **Không commit** file JSON service account vào git
- **Không share** private key với ai
- **Sử dụng** environment variables cho production
- **Định kỳ rotate** service account keys

### 12. File Structure

```
project/
├── .env.local                 # Environment variables (không commit)
├── lib/
│   ├── google-drive.ts       # Google Drive API functions
│   └── image-utils.ts        # Client-side image utilities
├── app/api/
│   └── upload-image/
│       └── route.ts          # Upload API endpoint
└── components/
    ├── image-upload.tsx      # Image upload component
    └── image-viewer.tsx      # Image viewer component
```

### 13. API Usage

Upload endpoint: `POST /api/upload-image`

Request:
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload-image', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
// result.imageUrl contains Google Drive shareable link
```

Response:
```json
{
  "success": true,
  "imageUrl": "https://drive.google.com/file/d/FILE_ID/view?usp=sharing",
  "fileName": "expense-receipt-1234567890-abc123.jpg",
  "originalSize": 1024000,
  "compressedSize": 512000
}
```
