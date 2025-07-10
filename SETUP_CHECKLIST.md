# Setup Checklist for Nông Văn Năm

## ✅ Completed by Script
- [x] Repository cloned
- [x] Dependencies installed
- [x] Environment file created (.env.local)
- [x] Package.json updated
- [x] App metadata updated
- [x] Deployment script created

## 🔧 Manual Steps Required

### 1. Google Sheets Setup
- [ ] Create new Google Sheet ✅ (Already done: 14_Y-DsQvndhsFHrwb0W12guk36zqtzUnMA5tz9jw1D4)
- [ ] Add header row: `Ngày | Danh mục | Mô tả | Số tiền | Loại | Link hóa đơn | Thời gian | Danh mục phụ | Số lượng | Phương thức thanh toán | Ghi chú`
- [ ] Share with: `expense-tracker@expense-tracker-442807.iam.gserviceaccount.com`
- [ ] Set permission: Editor

### 2. Environment Variables
- [ ] Edit .env.local file
- [ ] Replace GOOGLE_SHEETS_PRIVATE_KEY with actual key
- [ ] Replace CLOUDINARY_CLOUD_NAME with actual name
- [ ] Replace CLOUDINARY_API_KEY with actual key
- [ ] Replace CLOUDINARY_API_SECRET with actual secret

### 3. Testing
- [ ] Run `npm run dev`
- [ ] Test creating a transaction
- [ ] Test uploading an image
- [ ] Verify data appears in Google Sheets
- [ ] Verify images appear in Cloudinary folder: expense-receipts-nong-van-nam

### 4. Deployment
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Run `./deploy.sh`
- [ ] Test production deployment

## 🎯 Success Criteria
- [ ] Can create transactions
- [ ] Can upload images
- [ ] Data saves to Google Sheets
- [ ] Images save to separate Cloudinary folder
- [ ] App is accessible online

## 📋 Next Steps for User
1. Complete Google Sheets setup (add header, share with service account)
2. Get credentials and update .env.local
3. Test locally
4. Deploy to production
