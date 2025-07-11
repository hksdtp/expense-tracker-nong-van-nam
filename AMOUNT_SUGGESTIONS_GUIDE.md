# 💰 Hướng dẫn sử dụng tính năng Gợi ý số tiền (Tag Style)

## 🎯 Tính năng mới

Khi nhập số tiền trong form thêm/sửa giao dịch, hệ thống sẽ tự động hiển thị các tag gợi ý số tiền phổ biến ngay dưới ô nhập liệu. Chỉ cần click vào tag để chọn số tiền!

## 🔢 Logic gợi ý thông minh

### Số 1-9 (1 chữ số)
Khi gõ: `1` → Gợi ý:
- 1.000 ₫ (1K)
- 10.000 ₫ (10K) 
- 100.000 ₫ (100K)
- 1.000.000 ₫ (1M)

### Số 10-99 (2 chữ số)
Khi gõ: `12` → Gợi ý:
- 12.000 ₫ (12K)
- 120.000 ₫ (120K)
- 1.200.000 ₫ (1.2M)

### Số 100-999 (3 chữ số)
Khi gõ: `123` → Gợi ý:
- 123.000 ₫ (123K)
- 1.230.000 ₫ (1.2M)

### Số ≥1000 (4+ chữ số)
Khi gõ: `1500` → Gợi ý:
- 1.500.000 ₫ (1.5M)

## 🎮 Cách sử dụng

### 1. Nhập số tiền
- Gõ số bất kỳ vào ô "Số tiền"
- Tags gợi ý sẽ xuất hiện ngay dưới ô nhập

### 2. Chọn gợi ý
- Click vào tag gợi ý bất kỳ
- Số tiền sẽ được điền tự động
- Focus trở lại ô nhập tiền

### 3. Giao diện tag
- **Dạng tag tròn**: Rounded-full với màu xanh
- **Hover effect**: Scale animation khi di chuột
- **Responsive**: Tự động xuống dòng khi hết chỗ

## ✨ Tính năng đặc biệt

### 📊 Hiển thị định dạng
- **Số tiền đầy đủ**: 1.000.000 ₫
- **Dạng rút gọn**: (1M), (500K)
- **Định dạng Việt Nam**: Dấu phẩy ngăn cách hàng nghìn

### 🎯 Gợi ý thông minh
- Chỉ hiển thị khi có input hợp lệ
- Loại bỏ số quá lớn (>100 triệu)
- Không gợi ý cho số âm hoặc không hợp lệ

### 🔄 Tương tác mượt mà
- Hiển thị ngay khi gõ
- Tags luôn hiển thị (không ẩn)
- Animation hover với scale effect
- Focus trở lại input sau khi chọn

## 📱 Ví dụ thực tế

### Mua cà phê
Gõ: `3` → Chọn: `30.000 ₫`

### Đổ xăng
Gõ: `5` → Chọn: `500.000 ₫`

### Mua sắm
Gõ: `12` → Chọn: `1.200.000 ₫`

### Chi phí lớn
Gõ: `1500` → Chọn: `1.500.000 ₫`

## 🛠️ Kỹ thuật

### Component sử dụng
- `AmountInputWithSuggestions` - Component chính
- Tích hợp trong `AddTransactionModal`
- Tích hợp trong `EditTransactionModal`
- Tích hợp trong `TransactionFormEdit`

### Logic core
```javascript
// Hàm tạo gợi ý
generateAmountSuggestions(input)

// Hàm định dạng
formatCurrency(amount)
```

### Test
```bash
# Test logic gợi ý
npm run test:amount-suggestions
```

## 🎨 Giao diện

### Tags gợi ý
- **Background**: bg-blue-50 → bg-blue-100 (hover)
- **Text**: text-blue-700 → text-blue-800 (hover)
- **Border**: border-blue-200 → border-blue-300 (hover)
- **Shape**: rounded-full (tag tròn)
- **Animation**: hover:scale-105 active:scale-95

### Layout
- **Vị trí**: Ngay dưới ô nhập tiền
- **Sắp xếp**: Flex wrap (tự động xuống dòng)
- **Spacing**: gap-2 giữa các tags
- **Responsive**: Phù hợp mọi kích thước màn hình

### Hiển thị số tiền
- **Chính**: Số tiền đầy đủ với ₫
- **Phụ**: Dạng rút gọn (K/M) trong ngoặc
- **Preview**: Số tiền đã format bên dưới input

## 🔧 Cấu hình

### Giới hạn
- **Tối đa**: 100.000.000 ₫ (100 triệu)
- **Tối thiểu**: 1 ₫
- **Bước nhảy**: x10, x100, x1000

### Tùy chỉnh
- Có thể thay đổi logic trong `generateAmountSuggestions()`
- Có thể thay đổi giới hạn tối đa
- Có thể thêm/bớt mức gợi ý

## 🎉 Lợi ích

### Cho người dùng
- ⚡ Nhập liệu nhanh hơn 5x
- 🎯 Chính xác hơn (không gõ nhầm số 0)
- 💡 Gợi ý thông minh theo thói quen VN
- 📱 Trải nghiệm như mobile app native
- 👆 Touch-friendly cho mobile

### Cho hệ thống
- 📊 Dữ liệu chuẩn hóa
- 🔢 Giảm lỗi nhập liệu
- 🎨 Giao diện hiện đại
- ⚡ Hiệu năng tốt
- 📱 Mobile-first design

---

**💡 Tip**: Tính năng tag suggestions này đặc biệt hữu ích cho các giao dịch thường xuyên như mua cà phê (30K), đổ xăng (500K), mua sắm (1-2M). Chỉ cần gõ số đầu và click tag!
