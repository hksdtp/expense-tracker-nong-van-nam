# 🚀 Cline-Augment Quick Start Guide

## 📋 Checklist Setup

### ✅ 1. Cài đặt Cline Extension
- [ ] Mở Cursor
- [ ] Extensions (Cmd+Shift+X)
- [ ] Tìm "Cline" → Install
- [ ] Restart Cursor

### ✅ 2. Cấu hình API Keys
```bash
# Thêm vào .env.local hoặc export
export OPENAI_API_KEY="your-openai-api-key"
export AUGMENT_API_KEY="your-augment-api-key"  # Optional
```

### ✅ 3. Start Development Environment
```bash
# Option 1: Với Bridge (Recommended)
npm run dev:with-bridge

# Option 2: Riêng lẻ
npm run dev          # Terminal 1
npm run cline:bridge # Terminal 2
```

## 🎯 Cách Sử Dụng

### Auto-Forwarding (Tự động)
1. **Mở Cline** trong Cursor (Cmd+Shift+P → "Cline: Open")
2. **Gửi request** có keywords:
   - "tạo component"
   - "implement feature"
   - "sửa lỗi"
   - "refactor"
   - "tối ưu"

3. **Cline sẽ tự động** forward sang Augment nếu match pattern

### Manual Forwarding (Thủ công)
```bash
# Forward specific task
npm run cline:forward "Tạo UserProfile component" components/UserProfile.tsx

# Hoặc trong VS Code
Cmd+Shift+P → "Tasks: Run Task" → "Forward Task to Augment"
```

## 🔍 Kiểm tra hoạt động

### Test Integration
```bash
npm run cline:test
```

### Check Task Directory
```bash
ls -la .cline-augment-tasks/
```

### Monitor Bridge Logs
```bash
npm run cline:bridge
# Sẽ hiển thị logs khi có tasks được processed
```

## 🐛 Troubleshooting

### ❌ "OPENAI_API_KEY missing"
```bash
# Kiểm tra API key
echo $OPENAI_API_KEY

# Set nếu chưa có
export OPENAI_API_KEY="sk-..."
```

### ❌ "Augment MCP not available"
```bash
# Kiểm tra endpoint
curl $AUGMENT_MCP_ENDPOINT/health

# Hoặc sử dụng fallback mode (tự động)
```

### ❌ "Bridge not responding"
```bash
# Restart bridge
pkill -f "cline-augment-bridge"
npm run cline:bridge
```

### ❌ "Tasks not processed"
```bash
# Check permissions
chmod +x scripts/*.sh
chmod +x scripts/*.js

# Check task files
ls -la .cline-augment-tasks/
```

## 📊 Workflow Example

1. **User**: "Tạo component UserProfile với avatar và thông tin cơ bản"

2. **Cline**: Nhận request → Detect pattern "tạo component" → Forward to Augment

3. **Bridge**: Tạo task file → Gọi Augment MCP → Nhận response

4. **Augment**: Phân tích codebase → Generate component code → Return

5. **Cline**: Nhận response từ Augment → Implement code → Show to user

## 🎛️ Customization

### Thêm Forwarding Patterns
Edit `.cline/config.json`:
```json
"forwardPatterns": [
  "your-custom-pattern",
  "another-pattern"
]
```

### Thay đổi Augment Endpoint
Edit `.env.local`:
```bash
AUGMENT_MCP_ENDPOINT=http://your-augment-server:8080/mcp
```

### Custom Commands
Edit `.vscode/settings.json`:
```json
"cline.customCommands": {
  "yourCommand": {
    "command": "your-script.js",
    "shortcut": "Cmd+Shift+Y"
  }
}
```

## 🎉 Success Indicators

- ✅ Bridge logs show "👀 Watching for Cline tasks..."
- ✅ Cline extension loaded in Cursor
- ✅ Test command returns success
- ✅ Task files created in `.cline-augment-tasks/`
- ✅ Auto-forwarding works with test patterns

## 📞 Support

- Check console logs khi chạy bridge
- Xem task files để debug workflow
- Test với simple requests trước
- Đọc full documentation trong `docs/CLINE-AUGMENT-INTEGRATION.md`
