# 🗑️ Hướng dẫn tính năng Xóa giao dịch

## 🎯 Tổng quan

Tính năng xóa giao dịch cho phép xóa hoàn toàn một giao dịch khỏi hệ thống, bao gồm:
- ✅ Xóa dữ liệu khỏi Google Sheets
- ✅ Xóa ảnh hóa đơn khỏi Cloudinary
- ✅ Clear cache và refresh UI

## 🔧 Cách hoạt động

### 1. **UI Flow**
```
Hover vào giao dịch → Hiện nút Trash 🗑️
↓
Click nút Trash → Hiện "Xác nhận?"
↓
Click "Xóa" → Gọi API DELETE
↓
Giao dịch và ảnh bị xóa → UI refresh
```

### 2. **API Flow**
```
DELETE /api/transactions?rowIndex=X&imageUrl=Y
↓
1. Clear toàn bộ row trong Google Sheets
2. Clear riêng cột L (URL ảnh) để đảm bảo
3. Xóa ảnh từ Cloudinary (nếu có)
4. Clear cache
5. Trả về success
```

## 🐛 Vấn đề đã được sửa

### **Vấn đề**: Cột L (URL ảnh) vẫn còn sau khi xóa

**Nguyên nhân:**
- Khi clear row không tồn tại (404 error), code nhảy vào catch block
- Phần clear cột L không được thực thi

**Giải pháp:**
- ✅ Tách logic clear row và clear cột L
- ✅ Luôn thực hiện clear cột L bất kể row có tồn tại hay không
- ✅ Enhanced error handling cho từng bước

## 📊 Code Implementation

### **API DELETE Endpoint**
```typescript
// app/api/transactions/route.ts
export async function DELETE(request: Request) {
  // 1. Parse parameters
  const rowIndex = url.searchParams.get('rowIndex')
  const imageUrl = url.searchParams.get('imageUrl')
  
  // 2. Clear entire row
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `Sheet1!${rowIndex}:${rowIndex}`,
    })
  } catch (error) {
    // Handle 404 gracefully
  }
  
  // 3. Always clear column L explicitly
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `Sheet1!L${rowIndex}`,
    })
  } catch (error) {
    // Handle 404 gracefully
  }
  
  // 4. Delete image from Cloudinary
  if (imageUrl && imageUrl.includes('cloudinary.com')) {
    await cloudinary.uploader.destroy(publicId)
  }
  
  // 5. Clear cache and return success
}
```

### **Frontend Integration**
```typescript
// components/transaction-list.tsx
const handleDelete = async (transaction: any) => {
  const params = new URLSearchParams({
    rowIndex: transaction.rowIndex.toString()
  })
  
  if (transaction.receiptLink) {
    params.append('imageUrl', transaction.receiptLink)
  }

  const response = await fetch(`/api/transactions?${params}`, {
    method: 'DELETE',
  })
  
  // Handle response and refresh UI
}
```

## 🧪 Testing

### **Test Scripts**
```bash
# Test cơ bản
npm run test:delete-transaction

# Test clear cột L
npm run test:clear-column-l

# Test với giao dịch thật
npm run test:real-delete
```

### **Test Cases**
1. ✅ Xóa giao dịch không có ảnh
2. ✅ Xóa giao dịch có ảnh Cloudinary
3. ✅ Xóa giao dịch với row không tồn tại
4. ✅ Xóa với URL ảnh không hợp lệ
5. ✅ Clear cột L trong mọi trường hợp

## 🔍 Debugging

### **Server Logs**
Khi xóa giao dịch, bạn sẽ thấy logs:
```
API: Deleting transaction
Clearing row X from Google Sheets
⚠️ Row X not found or already empty (nếu row không tồn tại)
✅ Row X cleared successfully (nếu row tồn tại)
⚠️ Column LX not found or already empty (nếu cột trống)
✅ Image URL column LX cleared explicitly (nếu có dữ liệu)
Deleting image from Cloudinary: URL
✅ Image deleted from Cloudinary successfully
✅ Transaction deleted successfully
```

### **Common Issues**
1. **Row không tồn tại**: Normal, API vẫn hoạt động
2. **Ảnh không tồn tại trên Cloudinary**: Normal, có thể đã bị xóa trước đó
3. **Cột L vẫn còn dữ liệu**: Đã được sửa với explicit clearing

## 💡 Best Practices

### **Khi sử dụng**
- ✅ Luôn xác nhận trước khi xóa
- ✅ Kiểm tra UI refresh sau khi xóa
- ✅ Backup dữ liệu quan trọng trước khi xóa

### **Khi phát triển**
- ✅ Test với nhiều edge cases
- ✅ Handle errors gracefully
- ✅ Log chi tiết để debug
- ✅ Clear cache sau mọi thay đổi

## 🚀 Deployment

Tính năng đã được deploy và hoạt động ổn định:
- ✅ Production ready
- ✅ Error handling đầy đủ
- ✅ Performance optimized
- ✅ User-friendly UI

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra server logs
2. Chạy test scripts
3. Verify Google Sheets permissions
4. Check Cloudinary configuration

---

**💡 Tip**: Tính năng xóa giao dịch đã được tối ưu để đảm bảo xóa sạch mọi dữ liệu, bao gồm cả URL ảnh trong cột L!
