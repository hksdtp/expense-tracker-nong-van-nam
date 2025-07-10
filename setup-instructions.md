# Setup Instructions - Option B (Shared Resources)

## Step 1: Google Sheets Setup

### 1.1 Tạo Google Sheet mới
- Vào https://sheets.google.com
- Click "Blank" để tạo sheet mới  
- Đặt tên: "Báo cáo chi tiêu - [Tên người dùng]"

### 1.2 Copy header structure vào row 1:
```
Ngày | Danh mục | Mô tả | Số tiền | Loại | Link hóa đơn | Thời gian | Danh mục phụ | Số lượng | Phương thức thanh toán | Ghi chú
```

### 1.3 Share với Service Account
- Click "Share" button
- Add email: `expense-tracker@expense-tracker-442807.iam.gserviceaccount.com`
- Set permission: "Editor"
- Click "Send"

### 1.4 Lấy Sheet ID
- Copy URL của sheet: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- Lưu lại SHEET_ID để dùng trong .env

## Step 2: Clone Repository

```bash
# Clone repository
git clone https://github.com/hksdtp/v0-bcct-moi.git expense-tracker-person2
cd expense-tracker-person2

# Install dependencies
npm install
```

## Step 3: Environment Variables Setup

### 3.1 Tạo file .env.local
```bash
# Copy từ example hoặc tạo mới
touch .env.local
```

### 3.2 Thêm nội dung vào .env.local:
```env
# Google Sheets (dùng chung service account)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[PRIVATE_KEY_CONTENT]\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL="expense-tracker@expense-tracker-442807.iam.gserviceaccount.com"
GOOGLE_SHEETS_SHEET_ID="[SHEET_ID_MỚI_TỪ_STEP_1.4]"
GOOGLE_SHEETS_SHEET_NAME="Sheet1"

# Cloudinary (dùng chung account)
CLOUDINARY_CLOUD_NAME="[CLOUD_NAME]"
CLOUDINARY_API_KEY="[API_KEY]"
CLOUDINARY_API_SECRET="[API_SECRET]"
```

## Step 4: Code Modifications for Separate Folder

### 4.1 Update Cloudinary folder path
File: `app/api/upload-cloudinary/route.ts`
- Line 67: Change folder name to unique identifier

### 4.2 Optional: Update app branding
- Update app title in `app/layout.tsx`
- Change theme colors if needed

## Step 5: Test & Deploy

### 5.1 Test locally
```bash
npm run dev
# Test tại http://localhost:3000
```

### 5.2 Deploy to Vercel
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel --prod
```

## Step 6: Verification

### 6.1 Test functionality:
- [ ] Tạo giao dịch mới
- [ ] Upload ảnh hóa đơn  
- [ ] Edit giao dịch
- [ ] Kiểm tra data trong Google Sheets
- [ ] Kiểm tra ảnh trong Cloudinary folder riêng

### 6.2 Check Google Sheets:
- Data xuất hiện đúng format
- Ngày tháng format dd/mm/yyyy
- Tất cả cột đúng vị trí

### 6.3 Check Cloudinary:
- Ảnh upload vào folder riêng
- Không conflict với ảnh của user khác

## Troubleshooting

### Common Issues:
1. **Google Sheets permission denied**: Kiểm tra share settings
2. **Cloudinary upload failed**: Kiểm tra API credentials
3. **Date format issues**: Đã fix trong code mới
4. **Column mapping wrong**: Đã fix trong API routes

### Support:
- Check console logs for detailed errors
- Verify all environment variables are set correctly
- Ensure Google Sheet is shared with service account
