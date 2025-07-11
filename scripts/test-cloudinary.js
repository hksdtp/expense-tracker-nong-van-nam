#!/usr/bin/env node

/**
 * Script để kiểm tra cấu hình Cloudinary
 */

require('dotenv').config({ path: '.env.local' })

async function testCloudinary() {
  console.log('🔍 Kiểm tra cấu hình Cloudinary...')
  
  try {
    // Kiểm tra biến môi trường
    console.log('\n📋 1. Kiểm tra biến môi trường:')
    console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME}`)
    console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'Đã cấu hình' : 'Chưa cấu hình'}`)
    console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'Đã cấu hình' : 'Chưa cấu hình'}`)
    console.log(`   CLOUDINARY_FOLDER: ${process.env.CLOUDINARY_FOLDER}`)

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('\n❌ Cloudinary chưa được cấu hình đầy đủ!')
      console.log('\n📝 Hướng dẫn cấu hình:')
      console.log('1. Truy cập https://cloudinary.com/')
      console.log('2. Đăng ký/đăng nhập tài khoản')
      console.log('3. Vào Dashboard để lấy thông tin:')
      console.log('   - Cloud Name')
      console.log('   - API Key') 
      console.log('   - API Secret')
      console.log('4. Cập nhật file .env.local với thông tin thực')
      return
    }

    // Kiểm tra API endpoint
    console.log('\n🌐 2. Kiểm tra API endpoint:')
    
    try {
      const response = await fetch('http://localhost:3000/api/upload-cloudinary', {
        method: 'POST',
        body: new FormData() // Empty form data để test
      })
      
      console.log(`   Status: ${response.status}`)
      
      if (response.status === 400) {
        console.log('   ✅ API endpoint hoạt động (trả về 400 do không có file)')
      } else if (response.status === 500) {
        const errorData = await response.json()
        console.log(`   ❌ API lỗi: ${errorData.error}`)
        
        if (errorData.error === 'Cloudinary not configured') {
          console.log('   💡 Cần cấu hình Cloudinary credentials')
        }
      } else {
        console.log('   ⚠️ Phản hồi không mong đợi')
      }
    } catch (apiError) {
      console.log(`   ❌ Không thể kết nối API: ${apiError.message}`)
      console.log('   💡 Đảm bảo server đang chạy trên http://localhost:3000')
    }

    // Kiểm tra với Cloudinary SDK
    console.log('\n☁️ 3. Kiểm tra Cloudinary SDK:')
    
    try {
      const { v2: cloudinary } = require('cloudinary')
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      })

      // Test ping
      const pingResult = await cloudinary.api.ping()
      console.log('   ✅ Cloudinary SDK kết nối thành công')
      console.log(`   📊 Status: ${pingResult.status}`)
      
    } catch (cloudinaryError) {
      console.log(`   ❌ Cloudinary SDK lỗi: ${cloudinaryError.message || cloudinaryError}`)

      const errorMessage = cloudinaryError.message || String(cloudinaryError)
      if (errorMessage.includes('Invalid API key')) {
        console.log('   💡 API Key không hợp lệ')
      } else if (errorMessage.includes('Invalid API secret')) {
        console.log('   💡 API Secret không hợp lệ')
      } else if (errorMessage.includes('Invalid cloud name')) {
        console.log('   💡 Cloud Name không hợp lệ')
      } else {
        console.log('   💡 Có thể do API credentials chưa đúng hoặc mạng không ổn định')
      }
    }

    console.log('\n📝 4. Tóm tắt:')
    if (process.env.CLOUDINARY_CLOUD_NAME === 'dgaktc3fb' && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      console.log('   ✅ Cloudinary đã được cấu hình cơ bản')
      console.log('   💡 Hãy test upload ảnh để đảm bảo hoạt động đúng')
    } else {
      console.log('   ❌ Cloudinary cần được cấu hình đầy đủ')
      console.log('   📋 Cập nhật .env.local với thông tin thực từ Cloudinary Dashboard')
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình kiểm tra:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testCloudinary()
    .then(() => {
      console.log('\n✅ Kiểm tra hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Kiểm tra thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testCloudinary }
