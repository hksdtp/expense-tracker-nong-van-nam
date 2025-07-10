# Expense Tracker - Nông Văn Năm

This is a personal expense tracking application for **Nông Văn Năm**.

## 🔧 Setup Status
- ✅ Google Sheets: 14_Y-DsQvndhsFHrwb0W12guk36zqtzUnMA5tz9jw1D4
- ✅ Cloudinary Folder: expense-receipts-nong-van-nam
- ✅ Environment: Configured (needs credentials)

## 🚀 Quick Start

1. **Complete environment setup:**
   ```bash
   # Edit .env.local and replace placeholder values:
   # - GOOGLE_SHEETS_PRIVATE_KEY
   # - CLOUDINARY_CLOUD_NAME
   # - CLOUDINARY_API_KEY  
   # - CLOUDINARY_API_SECRET
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh
   ```

## 📊 Google Sheets Setup

Make sure your Google Sheet has this header structure in row 1:
```
Ngày | Danh mục | Mô tả | Số tiền | Loại | Link hóa đơn | Thời gian | Danh mục phụ | Số lượng | Phương thức thanh toán | Ghi chú
```

And is shared with: `expense-tracker@expense-tracker-442807.iam.gserviceaccount.com` (Editor permission)

## 🎯 Features
- ✅ Add/Edit transactions with modal interface
- ✅ Upload receipt images (up to 50MB with smart compression)
- ✅ Google Sheets integration for data storage
- ✅ Mobile responsive design
- ✅ Date formatting consistency (dd/mm/yyyy)

## 🆘 Troubleshooting
If you encounter issues, check:
1. Google Sheet permissions (shared with service account)
2. Environment variables (all placeholders replaced)
3. Cloudinary credentials (valid and active)
4. Console logs for detailed errors

## 📞 Support
Contact the original developer for assistance with setup or issues.
