#!/usr/bin/env node

/**
 * Script để test upload ảnh thật qua API endpoint
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

async function testRealUpload() {
  console.log('🧪 Test upload ảnh thật qua API endpoint...')
  
  try {
    // Tạo một ảnh test đơn giản (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ])

    const testImagePath = path.join(__dirname, 'test-upload.png')
    fs.writeFileSync(testImagePath, testImageBuffer)
    console.log('✅ Đã tạo ảnh test PNG')

    // Test upload qua API
    console.log('\n📤 Test upload qua API endpoint:')
    
    const FormData = require('form-data')
    const fetch = require('node-fetch')
    
    const form = new FormData()
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-receipt.png',
      contentType: 'image/png'
    })

    console.log('🌐 Gửi request đến API...')
    
    const response = await fetch('http://localhost:3000/api/upload-cloudinary', {
      method: 'POST',
      body: form,
    })

    console.log(`📊 Response status: ${response.status}`)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Upload thành công!')
      console.log(`🔗 URL: ${result.url}`)
      console.log(`📊 Public ID: ${result.public_id}`)
      console.log(`📁 Folder: ${result.folder}`)
      
      // Kiểm tra URL có hoạt động không
      console.log('\n🔍 Kiểm tra URL ảnh:')
      try {
        const imageResponse = await fetch(result.url)
        if (imageResponse.ok) {
          console.log('✅ URL ảnh hoạt động bình thường')
          console.log(`📐 Content-Type: ${imageResponse.headers.get('content-type')}`)
          console.log(`📊 Content-Length: ${imageResponse.headers.get('content-length')} bytes`)
        } else {
          console.log(`❌ URL ảnh lỗi: ${imageResponse.status}`)
        }
      } catch (urlError) {
        console.log(`❌ Lỗi kiểm tra URL: ${urlError.message}`)
      }
      
    } else {
      const errorData = await response.json()
      console.log('❌ Upload thất bại!')
      console.log(`📋 Error: ${errorData.error}`)
      
      if (errorData.error && errorData.error.includes('API key')) {
        console.log('💡 Vấn đề với API key Cloudinary')
      }
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath)
      console.log('\n🧹 Đã xóa file test')
    }

    console.log('\n🎉 Test hoàn thành!')
    
    if (response.ok) {
      console.log('✅ Cloudinary upload đã hoạt động!')
      console.log('📱 Bây giờ bạn có thể upload ảnh trong web app')
      console.log('📁 Ảnh sẽ được lưu trong thư mục "nongvannam"')
    } else {
      console.log('❌ Cần kiểm tra lại cấu hình Cloudinary')
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testRealUpload()
    .then(() => {
      console.log('\n✅ Test hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testRealUpload }
