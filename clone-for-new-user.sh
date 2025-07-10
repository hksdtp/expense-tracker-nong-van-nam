#!/bin/bash

# Clone and setup script for new user
# Usage: ./clone-for-new-user.sh [username] [google-sheet-id]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Cloning Expense Tracker for New User${NC}"
echo "================================================"

# Get parameters
USERNAME=${1:-}
SHEET_ID=${2:-}

if [ -z "$USERNAME" ]; then
    echo -e "${YELLOW}Enter username for new user:${NC}"
    read USERNAME
fi

if [ -z "$SHEET_ID" ]; then
    echo -e "${YELLOW}Enter Google Sheet ID:${NC}"
    read SHEET_ID
fi

# Validate inputs
if [ -z "$USERNAME" ] || [ -z "$SHEET_ID" ]; then
    echo -e "${RED}❌ Username and Sheet ID are required${NC}"
    exit 1
fi

# Create directory name
DIR_NAME="expense-tracker-$(echo $USERNAME | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"
FOLDER_NAME="expense-receipts-$(echo $USERNAME | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"

echo -e "${BLUE}📋 Setup Information:${NC}"
echo "Username: $USERNAME"
echo "Directory: $DIR_NAME"
echo "Sheet ID: $SHEET_ID"
echo "Cloudinary Folder: $FOLDER_NAME"
echo ""

# Clone repository
echo -e "${BLUE}📥 Cloning repository...${NC}"
git clone https://github.com/hksdtp/v0-bcct-moi.git "$DIR_NAME"
cd "$DIR_NAME"

# Remove git history and reinitialize
echo -e "${BLUE}🔄 Setting up new git repository...${NC}"
rm -rf .git
git init
git add .
git commit -m "Initial commit for $USERNAME"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Create .env.local file
echo -e "${BLUE}⚙️ Creating environment configuration...${NC}"
cat > .env.local << EOF
# Environment variables for $USERNAME
# Google Sheets (shared service account)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n[REPLACE_WITH_ACTUAL_PRIVATE_KEY]\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEETS_CLIENT_EMAIL="expense-tracker@expense-tracker-442807.iam.gserviceaccount.com"
GOOGLE_SHEETS_SHEET_ID="$SHEET_ID"
GOOGLE_SHEETS_SHEET_NAME="Sheet1"

# Cloudinary (shared account with separate folder)
CLOUDINARY_CLOUD_NAME="[REPLACE_WITH_CLOUDINARY_CLOUD_NAME]"
CLOUDINARY_API_KEY="[REPLACE_WITH_CLOUDINARY_API_KEY]"
CLOUDINARY_API_SECRET="[REPLACE_WITH_CLOUDINARY_API_SECRET]"
CLOUDINARY_FOLDER="$FOLDER_NAME"

# App Configuration
NEXT_PUBLIC_APP_NAME="Expense Tracker - $USERNAME"
EOF

# Update package.json
echo -e "${BLUE}📝 Updating package.json...${NC}"
node -e "
const pkg = require('./package.json');
pkg.name = '$DIR_NAME';
pkg.description = 'Personal expense tracking for $USERNAME';
require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Update app metadata
echo -e "${BLUE}🎨 Updating app metadata...${NC}"
if [ -f "app/layout.tsx" ]; then
    sed -i.bak "s/title: \".*\"/title: \"Expense Tracker - $USERNAME\"/" app/layout.tsx
    sed -i.bak "s/description: \".*\"/description: \"Personal expense tracking for $USERNAME\"/" app/layout.tsx
    rm app/layout.tsx.bak
fi

# Create deployment script
echo -e "${BLUE}🚀 Creating deployment script...${NC}"
cat > deploy.sh << EOF
#!/bin/bash
# Deployment script for $USERNAME

echo "🚀 Deploying Expense Tracker for $USERNAME..."

# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Vercel
vercel --prod --name="$DIR_NAME"

echo "✅ Deployment complete!"
EOF
chmod +x deploy.sh

# Create custom README
echo -e "${BLUE}📖 Creating custom README...${NC}"
cat > README.md << EOF
# Expense Tracker - $USERNAME

This is a personal expense tracking application for **$USERNAME**.

## 🔧 Setup Status
- ✅ Google Sheets: $SHEET_ID
- ✅ Cloudinary Folder: $FOLDER_NAME
- ✅ Environment: Configured (needs credentials)

## 🚀 Quick Start

1. **Complete environment setup:**
   \`\`\`bash
   # Edit .env.local and replace placeholder values:
   # - GOOGLE_SHEETS_PRIVATE_KEY
   # - CLOUDINARY_CLOUD_NAME
   # - CLOUDINARY_API_KEY  
   # - CLOUDINARY_API_SECRET
   \`\`\`

2. **Run locally:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Deploy:**
   \`\`\`bash
   ./deploy.sh
   \`\`\`

## 📊 Google Sheets Setup

Make sure your Google Sheet has this header structure in row 1:
\`\`\`
Ngày | Danh mục | Mô tả | Số tiền | Loại | Link hóa đơn | Thời gian | Danh mục phụ | Số lượng | Phương thức thanh toán | Ghi chú
\`\`\`

And is shared with: \`expense-tracker@expense-tracker-442807.iam.gserviceaccount.com\` (Editor permission)

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
EOF

# Create setup checklist
echo -e "${BLUE}📋 Creating setup checklist...${NC}"
cat > SETUP_CHECKLIST.md << EOF
# Setup Checklist for $USERNAME

## ✅ Completed by Script
- [x] Repository cloned
- [x] Dependencies installed
- [x] Environment file created (.env.local)
- [x] Package.json updated
- [x] App metadata updated
- [x] Deployment script created

## 🔧 Manual Steps Required

### 1. Google Sheets Setup
- [ ] Create new Google Sheet
- [ ] Add header row: \`Ngày | Danh mục | Mô tả | Số tiền | Loại | Link hóa đơn | Thời gian | Danh mục phụ | Số lượng | Phương thức thanh toán | Ghi chú\`
- [ ] Share with: \`expense-tracker@expense-tracker-442807.iam.gserviceaccount.com\`
- [ ] Set permission: Editor
- [ ] Verify Sheet ID: $SHEET_ID

### 2. Environment Variables
- [ ] Edit .env.local file
- [ ] Replace GOOGLE_SHEETS_PRIVATE_KEY with actual key
- [ ] Replace CLOUDINARY_CLOUD_NAME with actual name
- [ ] Replace CLOUDINARY_API_KEY with actual key
- [ ] Replace CLOUDINARY_API_SECRET with actual secret

### 3. Testing
- [ ] Run \`npm run dev\`
- [ ] Test creating a transaction
- [ ] Test uploading an image
- [ ] Verify data appears in Google Sheets
- [ ] Verify images appear in Cloudinary folder: $FOLDER_NAME

### 4. Deployment
- [ ] Install Vercel CLI: \`npm i -g vercel\`
- [ ] Run \`./deploy.sh\`
- [ ] Test production deployment

## 🎯 Success Criteria
- [ ] Can create transactions
- [ ] Can upload images
- [ ] Data saves to Google Sheets
- [ ] Images save to separate Cloudinary folder
- [ ] App is accessible online
EOF

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "================================================"
echo -e "${YELLOW}📁 Project created in: $DIR_NAME${NC}"
echo -e "${YELLOW}📊 Google Sheet ID: $SHEET_ID${NC}"
echo -e "${YELLOW}☁️ Cloudinary Folder: $FOLDER_NAME${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. cd $DIR_NAME"
echo "2. Edit .env.local and replace placeholder values"
echo "3. Follow SETUP_CHECKLIST.md"
echo "4. Run: npm run dev (to test)"
echo "5. Run: ./deploy.sh (to deploy)"
echo ""
echo -e "${GREEN}✅ Ready to use!${NC}"
