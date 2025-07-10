# 🚀 Cloudinary MCP Server Setup Guide

## ✅ Setup Status: READY FOR CREDENTIALS

Tất cả đã được setup tự động! Chỉ cần Cloudinary API credentials để hoàn thành.

## 📋 Đã Setup Xong

### 1. VSCode Requirements ✅
- **VSCode Version**: 1.101.2 (hỗ trợ MCP)
- **Node.js**: v24.2.0 
- **npm**: 11.3.0

### 2. MCP Configuration ✅
- **File**: `.vscode/mcp.json` 
- **Servers**: 2 Cloudinary MCP servers
  - `cloudinaryMediaFlows`: Official MediaFlows server (advanced)
  - `cloudinaryCommunity`: Community server (basic upload)
- **Input Placeholders**: 3 credential inputs configured

### 3. VSCode Settings ✅
- **MCP Support**: Enabled (`chat.mcp.enabled: true`)
- **MCP Discovery**: Enabled (`chat.mcp.discovery.enabled: true`)

## 🔑 Bước Tiếp Theo: Lấy Cloudinary Credentials

### 1. Truy cập Cloudinary Console
- **URL**: https://console.cloudinary.com/
- **Login** với account của bạn

### 2. Lấy API Credentials
- **Go to**: Settings → API Keys
- **Copy 3 thông tin**:
  - **Cloud Name**: (ví dụ: `dxyz123abc`)
  - **API Key**: (ví dụ: `123456789012345`) 
  - **API Secret**: (click "Reveal" để xem)

### 3. Gửi Credentials
Gửi cho tôi theo format:
```
Cloud Name: your-cloud-name
API Key: your-api-key  
API Secret: your-api-secret
```

## 🚀 Sau Khi Có Credentials

### 1. Restart VSCode
- **Close** VSCode hoàn toàn
- **Reopen** project
- VSCode sẽ prompt cho credentials lần đầu

### 2. Test MCP Servers
- **Command**: `MCP: List Servers`
- **Check**: 2 Cloudinary servers running

### 3. Use in Copilot Chat
- **Open**: Copilot Chat (Ctrl+Alt+I)
- **Select**: Agent mode
- **Click**: Tools button
- **See**: Cloudinary MCP tools

## 🛠️ Available Tools

### MediaFlows MCP Server
- `upload_asset`: Advanced upload với AI processing
- `create_flow`: Tạo automation workflows
- `analyze_image`: AI analysis cho ảnh
- `manage_assets`: Quản lý Cloudinary assets
- `list_flows`: Xem automation flows

### Community MCP Server  
- `upload`: Basic upload functionality

## 🧪 Test Commands

### Basic Upload
```
Upload this image to Cloudinary:
- file: "path/to/receipt.jpg"
- folder: "expense-receipts" 
- tags: ["receipt", "expense-tracking"]
```

### AI Analysis
```
Analyze this receipt image and extract:
- Merchant name
- Total amount
- Date
- Items purchased
```

### Create Automation
```
Create automation flow:
1. When image uploaded to "expense-receipts"
2. Auto-resize to 1200x1200 max
3. Generate thumbnail 300x300
4. Extract text using OCR
5. Add metadata tags
```

## 🎯 Integration với Project

### Enhanced Workflow
```
User Upload → VSCode Copilot → MCP Server → Cloudinary → 
AI Analysis → Enhanced Metadata → Google Sheets → Smart Display
```

### Benefits
- **AI-powered categorization**: Tự động phân loại chi tiêu
- **OCR extraction**: Extract data từ receipt images
- **Quality enhancement**: Auto-improve ảnh quality
- **Batch processing**: Xử lý nhiều ảnh cùng lúc
- **Smart thumbnails**: Generate optimal sizes

## 📞 Support

Nếu có vấn đề:
1. **Run**: `node scripts/test-mcp.js` để check setup
2. **Check**: VSCode Output → MCP Servers
3. **Restart**: VSCode nếu cần thiết

**🎯 Ready for Cloudinary credentials!**
