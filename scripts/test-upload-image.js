#!/usr/bin/env node

/**
 * Script để test upload ảnh lên Cloudinary với thư mục nongvannam
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function testUploadImage() {
  console.log('🧪 Test upload ảnh lên Cloudinary...')
  console.log('📁 Thư mục: nongvannam')
  
  try {
    // Kiểm tra cấu hình
    console.log('\n📋 1. Kiểm tra cấu hình:')
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? 'Đã cấu hình' : 'Chưa cấu hình'}`)
    console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Đã cấu hình' : 'Chưa cấu hình'}`)
    console.log(`   Folder: ${process.env.CLOUDINARY_FOLDER}`)

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('\n❌ Cloudinary chưa được cấu hình đầy đủ!')
      console.log('💡 Vui lòng cập nhật file .env.local với thông tin thực từ Cloudinary Dashboard')
      return
    }

    // Test kết nối Cloudinary
    console.log('\n☁️ 2. Test kết nối Cloudinary:')
    const { v2: cloudinary } = require('cloudinary')
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    try {
      const pingResult = await cloudinary.api.ping()
      console.log('   ✅ Kết nối thành công!')
      console.log(`   📊 Status: ${pingResult.status}`)
    } catch (pingError) {
      console.log(`   ❌ Lỗi kết nối: ${pingError.message}`)
      return
    }

    // Tạo ảnh test đơn giản
    console.log('\n🖼️ 3. Tạo ảnh test:')
    const testImagePath = path.join(__dirname, 'test-image.txt')
    const testContent = `Test upload từ Expense Tracker
Thời gian: ${new Date().toISOString()}
Thư mục: nongvannam
User: Nông Văn Năm`

    fs.writeFileSync(testImagePath, testContent)
    console.log(`   ✅ Đã tạo file test: ${testImagePath}`)

    // Upload lên Cloudinary
    console.log('\n📤 4. Upload lên Cloudinary:')
    try {
      const uploadResult = await cloudinary.uploader.upload(testImagePath, {
        folder: process.env.CLOUDINARY_FOLDER || 'nongvannam',
        public_id: `test-${Date.now()}`,
        resource_type: 'raw' // Upload as raw file
      })

      console.log('   ✅ Upload thành công!')
      console.log(`   📊 Public ID: ${uploadResult.public_id}`)
      console.log(`   🔗 URL: ${uploadResult.secure_url}`)
      console.log(`   📁 Folder: ${uploadResult.folder}`)

      // Test với ảnh thật (nếu có)
      console.log('\n🖼️ 5. Test với ảnh thật:')
      
      // Tìm file ảnh trong thư mục hiện tại
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const currentDir = process.cwd()
      const files = fs.readdirSync(currentDir)
      
      const imageFile = files.find(file => 
        imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
      )

      if (imageFile) {
        console.log(`   📷 Tìm thấy ảnh: ${imageFile}`)
        
        const imageUploadResult = await cloudinary.uploader.upload(path.join(currentDir, imageFile), {
          folder: process.env.CLOUDINARY_FOLDER || 'nongvannam',
          public_id: `receipt-${Date.now()}`,
        })

        console.log('   ✅ Upload ảnh thành công!')
        console.log(`   📊 Public ID: ${imageUploadResult.public_id}`)
        console.log(`   🔗 URL: ${imageUploadResult.secure_url}`)
        console.log(`   📐 Kích thước: ${imageUploadResult.width}x${imageUploadResult.height}`)
        
      } else {
        console.log('   ℹ️ Không tìm thấy file ảnh để test')
        console.log('   💡 Bạn có thể copy file ảnh vào thư mục dự án để test')
      }

    } catch (uploadError) {
      console.log(`   ❌ Lỗi upload: ${uploadError.message}`)
      
      if (uploadError.message.includes('Invalid API key')) {
        console.log('   💡 API Key không hợp lệ')
      } else if (uploadError.message.includes('Invalid API secret')) {
        console.log('   💡 API Secret không hợp lệ')
      }
      return
    }

    // Test API endpoint
    console.log('\n🌐 6. Test API endpoint:')
    try {
      // Tạo FormData để test
      const FormData = require('form-data')
      const fetch = require('node-fetch')
      
      const form = new FormData()
      form.append('file', fs.createReadStream(testImagePath))
      
      const response = await fetch('http://localhost:3000/api/upload-cloudinary', {
        method: 'POST',
        body: form,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('   ✅ API endpoint hoạt động!')
        console.log(`   🔗 URL: ${result.url}`)
      } else {
        const errorData = await response.json()
        console.log(`   ❌ API lỗi: ${errorData.error}`)
      }
      
    } catch (apiError) {
      console.log(`   ⚠️ Không thể test API: ${apiError.message}`)
      console.log('   💡 Đảm bảo server đang chạy: npm run dev')
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath)
      console.log('\n🧹 Đã xóa file test')
    }

    console.log('\n🎉 Test hoàn thành!')
    console.log('📊 Cloudinary đã sẵn sàng sử dụng với thư mục "nongvannam"')
    console.log('💡 Bây giờ bạn có thể upload ảnh trong web app!')

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testUploadImage()
    .then(() => {
      console.log('\n✅ Test hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testUploadImage }
