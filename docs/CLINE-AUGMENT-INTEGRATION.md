# Cline-Augment Integration

Hệ thống tích hợp để forward requests từ Cline sang Augment để xử lý.

## 🎯 Mục đích

- **Forward requests** từ Cline sang Augment khi cần xử lý phức tạp
- **Tận dụng** khả năng codebase understanding của Augment
- **Tự động hóa** workflow giữa các AI agents

## 🏗️ Kiến trúc

```
Cline Request → Bridge → Augment MCP → Response → Cline
```

### Components:

1. **Cline-Augment Bridge** (`scripts/cline-augment-bridge.js`)
   - File watcher cho task directory
   - API để tạo tasks
   - MCP client để gọi Augment

2. **Task Directory** (`.cline-augment-tasks/`)
   - Chứa task files (`.task.json`)
   - Chứa response files (`.response.json`)
   - Chứa manual tasks (`.manual.json`)

3. **Cline Extension** (`.cline/extensions/augment-forwarder.js`)
   - Hook vào Cline request processing
   - Auto-detect patterns cần forward
   - Pause Cline khi forward sang Augment

## 🚀 Cài đặt

### 1. Chạy setup script:
```bash
./scripts/setup-cline-augment.sh
```

### 2. Cài đặt dependencies:
```bash
npm install node-fetch  # Nếu Node.js < 18
```

### 3. Cấu hình environment variables:
```bash
export AUGMENT_MCP_ENDPOINT="http://localhost:8080/mcp"
export AUGMENT_API_KEY="your-api-key"
```

## 📋 Sử dụng

### Cách 1: Automatic Forwarding

1. **Start bridge:**
```bash
npm run cline:bridge
```

2. **Sử dụng Cline bình thường** - requests sẽ được auto-forward khi match patterns:
   - "implement component"
   - "create feature"
   - "fix bug"
   - "refactor"
   - "optimize"

### Cách 2: Manual Forwarding

```bash
# Forward specific task
npm run cline:forward "Create user profile component" components/UserProfile.tsx

# Hoặc sử dụng Node.js
node scripts/cline-augment-bridge.js create-task "description" file1.js file2.js
```

### Cách 3: VS Code Tasks

1. **Cmd+Shift+P** → "Tasks: Run Task"
2. Chọn "Start Cline-Augment Bridge" hoặc "Forward Task to Augment"

## 🔧 Cấu hình

### Bridge Configuration (`.cline/config.json`):

```json
{
  "settings": {
    "augmentBridge": {
      "enabled": true,
      "autoForward": true,
      "forwardPatterns": [
        "implement",
        "create component",
        "fix bug"
      ]
    }
  }
}
```

### Environment Variables:

- `AUGMENT_MCP_ENDPOINT`: Augment MCP server URL
- `AUGMENT_API_KEY`: API key cho authentication
- `NODE_ENV`: Set "development" để enable debug logs

## 🧪 Testing

```bash
# Test integration
node scripts/test-cline-augment.js

# Test manual task creation
node scripts/cline-augment-bridge.js create-task "Test task" test.js
```

## 📁 File Structure

```
.cline-augment-tasks/          # Task directory
├── task_123.task.json         # Pending task
├── task_123.response.json     # Completed response
└── task_123.manual.json       # Manual processing needed

.cline/
├── config.json                # Cline configuration
├── extensions/
│   └── augment-forwarder.js   # Auto-forwarding extension
└── prompts/
    └── forward-to-augment.md  # Prompt template

scripts/
├── cline-augment-bridge.js    # Main bridge script
├── setup-cline-augment.sh     # Setup script
└── test-cline-augment.js      # Test script
```

## 🔄 Workflow

1. **Cline receives request** → Check forwarding patterns
2. **If match** → Create task file → Pause Cline processing
3. **Bridge detects** task file → Forward to Augment MCP
4. **Augment processes** → Returns response
5. **Bridge writes** response file → Resume Cline
6. **Cline sends** Augment's response to user

## 🐛 Troubleshooting

### Bridge không start:
```bash
# Check permissions
chmod +x scripts/cline-augment-bridge.js

# Check Node.js version
node --version  # Should be >= 14
```

### Augment MCP connection failed:
```bash
# Check endpoint
curl $AUGMENT_MCP_ENDPOINT/health

# Check API key
echo $AUGMENT_API_KEY
```

### Tasks không được processed:
```bash
# Check task directory
ls -la .cline-augment-tasks/

# Check bridge logs
npm run cline:bridge
```

## 🎯 Next Steps

1. **Configure Augment MCP endpoint** trong bridge script
2. **Customize forwarding patterns** theo nhu cầu
3. **Add custom plugins** cho specific use cases
4. **Monitor performance** và optimize theo cần thiết

## 📞 Support

- Check logs trong console khi chạy bridge
- Xem task files trong `.cline-augment-tasks/` để debug
- Test với simple tasks trước khi dùng complex requests
