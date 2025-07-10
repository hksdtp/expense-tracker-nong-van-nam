#!/usr/bin/env node

/**
 * Setup script for new user - Option B (Shared Resources)
 * Usage: node setup-new-user.js [username]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupNewUser() {
  console.log('🚀 Setting up new user with shared resources...\n');

  // Get user information
  const username = process.argv[2] || await question('Enter username for new user: ');
  const sheetId = await question('Enter new Google Sheet ID: ');
  
  console.log(`\n📋 Setting up for user: ${username}`);
  console.log(`📊 Google Sheet ID: ${sheetId}`);

  // Create .env.local template
  const envTemplate = `# Environment variables for ${username}
# Google Sheets (shared service account)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n[REPLACE_WITH_ACTUAL_PRIVATE_KEY]\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEETS_CLIENT_EMAIL="expense-tracker@expense-tracker-442807.iam.gserviceaccount.com"
GOOGLE_SHEETS_SHEET_ID="${sheetId}"
GOOGLE_SHEETS_SHEET_NAME="Sheet1"

# Cloudinary (shared account with separate folder)
CLOUDINARY_CLOUD_NAME="[REPLACE_WITH_CLOUDINARY_CLOUD_NAME]"
CLOUDINARY_API_KEY="[REPLACE_WITH_CLOUDINARY_API_KEY]"
CLOUDINARY_API_SECRET="[REPLACE_WITH_CLOUDINARY_API_SECRET]"
CLOUDINARY_FOLDER="expense-receipts-${username.toLowerCase().replace(/\s+/g, '-')}"

# App Configuration
NEXT_PUBLIC_APP_NAME="Expense Tracker - ${username}"
`;

  // Write .env.local file
  fs.writeFileSync('.env.local', envTemplate);
  console.log('✅ Created .env.local file');

  // Update package.json name
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.name = `expense-tracker-${username.toLowerCase().replace(/\s+/g, '-')}`;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');

  // Update app metadata
  const layoutPath = 'app/layout.tsx';
  if (fs.existsSync(layoutPath)) {
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    layoutContent = layoutContent.replace(
      /title: ".*?"/g,
      `title: "Expense Tracker - ${username}"`
    );
    layoutContent = layoutContent.replace(
      /description: ".*?"/g,
      `description: "Personal expense tracking for ${username}"`
    );
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('✅ Updated app metadata');
  }

  // Create deployment script
  const deployScript = `#!/bin/bash
# Deployment script for ${username}

echo "🚀 Deploying Expense Tracker for ${username}..."

# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Vercel
vercel --prod --name="expense-tracker-${username.toLowerCase().replace(/\s+/g, '-')}"

echo "✅ Deployment complete!"
`;

  fs.writeFileSync('deploy.sh', deployScript);
  fs.chmodSync('deploy.sh', '755');
  console.log('✅ Created deployment script');

  // Create README for this instance
  const readmeContent = `# Expense Tracker - ${username}

This is a personal expense tracking application for **${username}**.

## 🔧 Setup Status
- ✅ Google Sheets: ${sheetId}
- ✅ Cloudinary Folder: expense-receipts-${username.toLowerCase().replace(/\s+/g, '-')}
- ✅ Environment: Configured

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

And is shared with: \`expense-tracker@expense-tracker-442807.iam.gserviceaccount.com\`

## 🎯 Features
- ✅ Add/Edit transactions
- ✅ Upload receipt images (up to 50MB)
- ✅ Smart image compression
- ✅ Google Sheets integration
- ✅ Mobile responsive design

## 🆘 Support
If you encounter issues, check:
1. Google Sheet permissions
2. Environment variables
3. Cloudinary credentials
4. Console logs for errors
`;

  fs.writeFileSync('README.md', readmeContent);
  console.log('✅ Created custom README');

  console.log('\n🎉 Setup complete! Next steps:');
  console.log('1. Edit .env.local and replace placeholder values');
  console.log('2. Make sure Google Sheet is shared with service account');
  console.log('3. Run: npm run dev (to test locally)');
  console.log('4. Run: ./deploy.sh (to deploy to production)');
  console.log('\n📋 Don\'t forget to:');
  console.log('- Share Google Sheet with: expense-tracker@expense-tracker-442807.iam.gserviceaccount.com');
  console.log('- Set Editor permissions');
  console.log('- Add the correct header row structure');

  rl.close();
}

// Run setup
setupNewUser().catch(console.error);
