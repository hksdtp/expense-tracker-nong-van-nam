#!/bin/bash

echo "=== Git Commit and Push Script ==="

# Check git status
echo "📋 Checking git status..."
git status

# Add all changes
echo "➕ Adding all changes..."
git add .

# Show what will be committed
echo "📝 Changes to be committed:"
git diff --cached --name-only

# Commit with detailed message
echo "💾 Committing changes..."
git commit -m "🐛 Fix: Sửa lỗi logic tính toán số dư khi chuyển tháng

✅ Fixes:
- Fixed balance calculation logic in calculateAccountData()
- Resolved issue where balance increased when switching from month 6 to 7
- Changed filter logic to only include transactions BEFORE current month
- Added comprehensive logging for debugging

🔧 Changes:
- lib/data.ts: Fixed prevTransactions filter logic (line 313)
- app/api/upload-image/route.ts: Fixed Google Drive upload with stream conversion
- Added client-safe image utilities in lib/image-utils.ts
- Enhanced error handling and logging

📊 Impact:
- Balance calculation now works correctly across months
- No more unexpected balance increases when switching months
- Image upload functionality ready for production
- Google Sheets API working perfectly

🎯 Technical Details:
- OLD: dateInfo.year < prevYear || (dateInfo.year === prevYear && dateInfo.month <= prevMonth)
- NEW: dateInfo.year < year || (dateInfo.year === year && dateInfo.month < month)
- This ensures beginning balance only includes transactions BEFORE current month"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Commit and push completed!"
echo "🔗 Check your repository on GitHub to verify the changes."
