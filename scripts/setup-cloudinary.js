#!/usr/bin/env node

/**
 * Script tự động cài đặt Cloudinary cho web app
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupCloudinary() {
  console.log('🚀 Cài đặt Cloudinary cho Expense Tracker')
  console.log('=' .repeat(50))
  
  console.log('\n📋 Bước 1: Tạo tài khoản Cloudinary')
  console.log('   - Trang đăng ký đã được mở trong trình duyệt')
  console.log('   - Đăng ký tài khoản miễn phí tại: https://cloudinary.com/users/register_free')
  console.log('   - Sau khi đăng ký, đăng nhập và vào Dashboard')
  
  const hasAccount = await question('\n✅ Bạn đã có tài khoản Cloudinary và đang ở Dashboard? (y/n): ')
  
  if (hasAccount.toLowerCase() !== 'y') {
    console.log('\n📝 Hướng dẫn tạo tài khoản:')
    console.log('   1. Điền thông tin đăng ký (email, password)')
    console.log('   2. Xác nhận email')
    console.log('   3. Đăng nhập và vào Dashboard')
    console.log('   4. Chạy lại script này: npm run setup:cloudinary')
    rl.close()
    return
  }
  
  console.log('\n📋 Bước 2: Lấy thông tin API từ Dashboard')
  console.log('   Trong Dashboard, bạn sẽ thấy thông tin như sau:')
  console.log('   ┌─────────────────────────────────────┐')
  console.log('   │ Cloud Name: your-cloud-name         │')
  console.log('   │ API Key: 123456789012345            │')
  console.log('   │ API Secret: abcdef...xyz123         │')
  console.log('   └─────────────────────────────────────┘')
  
  console.log('\n📝 Nhập thông tin từ Dashboard:')
  
  const cloudName = await question('   Cloud Name: ')
  if (!cloudName.trim()) {
    console.log('❌ Cloud Name không được để trống!')
    rl.close()
    return
  }
  
  const apiKey = await question('   API Key: ')
  if (!apiKey.trim()) {
    console.log('❌ API Key không được để trống!')
    rl.close()
    return
  }
  
  const apiSecret = await question('   API Secret: ')
  if (!apiSecret.trim()) {
    console.log('❌ API Secret không được để trống!')
    rl.close()
    return
  }
  
  console.log('\n📋 Bước 3: Cập nhật cấu hình')
  
  // Backup file .env.local
  const envPath = '.env.local'
  const backupPath = '.env.local.backup'
  
  try {
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, backupPath)
      console.log(`   ✅ Đã backup ${envPath} thành ${backupPath}`)
    }
    
    // Đọc file .env.local hiện tại
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Cập nhật các giá trị Cloudinary
    envContent = envContent.replace(
      /CLOUDINARY_CLOUD_NAME="[^"]*"/,
      `CLOUDINARY_CLOUD_NAME="${cloudName}"`
    )
    envContent = envContent.replace(
      /CLOUDINARY_API_KEY="[^"]*"/,
      `CLOUDINARY_API_KEY="${apiKey}"`
    )
    envContent = envContent.replace(
      /CLOUDINARY_API_SECRET="[^"]*"/,
      `CLOUDINARY_API_SECRET="${apiSecret}"`
    )
    
    // Ghi lại file
    fs.writeFileSync(envPath, envContent)
    console.log('   ✅ Đã cập nhật file .env.local')
    
  } catch (error) {
    console.log(`   ❌ Lỗi cập nhật file: ${error.message}`)
    rl.close()
    return
  }
  
  console.log('\n📋 Bước 4: Kiểm tra cấu hình')
  console.log('   Đang test kết nối Cloudinary...')
  
  // Test cấu hình
  try {
    process.env.CLOUDINARY_CLOUD_NAME = cloudName
    process.env.CLOUDINARY_API_KEY = apiKey
    process.env.CLOUDINARY_API_SECRET = apiSecret
    
    const { v2: cloudinary } = require('cloudinary')
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })
    
    const pingResult = await cloudinary.api.ping()
    console.log('   ✅ Kết nối Cloudinary thành công!')
    console.log(`   📊 Status: ${pingResult.status}`)
    
  } catch (testError) {
    console.log(`   ❌ Lỗi kết nối: ${testError.message}`)
    console.log('   💡 Vui lòng kiểm tra lại thông tin API')
    rl.close()
    return
  }
  
  console.log('\n🎉 Cài đặt Cloudinary hoàn thành!')
  console.log('=' .repeat(50))
  console.log('📊 Thông tin cấu hình:')
  console.log(`   Cloud Name: ${cloudName}`)
  console.log(`   API Key: ${apiKey}`)
  console.log(`   Folder: expense-receipts`)
  
  console.log('\n🧪 Bước tiếp theo:')
  console.log('   1. Restart server: npm run dev')
  console.log('   2. Test upload ảnh: npm run test:upload-image')
  console.log('   3. Thử thêm giao dịch với ảnh trong web app')
  
  console.log('\n💾 Backup:')
  console.log(`   File gốc đã được backup tại: ${backupPath}`)
  console.log('   Nếu có vấn đề, có thể khôi phục bằng:')
  console.log(`   cp ${backupPath} ${envPath}`)
  
  rl.close()
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  setupCloudinary()
    .then(() => {
      console.log('\n✅ Script hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Script thất bại:', error)
      process.exit(1)
    })
}

module.exports = { setupCloudinary }
