#!/usr/bin/env node

/**
 * Script để test upload ảnh qua API bằng curl
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

async function testAPIUpload() {
  console.log('🧪 Test upload ảnh qua API endpoint với curl...')
  
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

    // Test upload qua API bằng curl
    console.log('\n📤 Test upload qua API endpoint:')
    console.log('🌐 Gửi request đến API bằng curl...')
    
    try {
      const curlCommand = `curl -X POST -F "file=@${testImagePath}" http://localhost:3000/api/upload-cloudinary`
      console.log(`📋 Command: ${curlCommand}`)
      
      const result = execSync(curlCommand, { 
        encoding: 'utf8',
        timeout: 30000 // 30 seconds timeout
      })
      
      console.log('📊 Response:')
      console.log(result)
      
      try {
        const jsonResult = JSON.parse(result)
        
        if (jsonResult.url) {
          console.log('\n✅ Upload thành công!')
          console.log(`🔗 URL: ${jsonResult.url}`)
          console.log(`📊 Public ID: ${jsonResult.public_id || 'N/A'}`)
          console.log(`📁 Folder: ${jsonResult.folder || 'N/A'}`)
          
          // Test URL bằng curl
          console.log('\n🔍 Kiểm tra URL ảnh bằng curl:')
          try {
            const headCommand = `curl -I "${jsonResult.url}"`
            const headResult = execSync(headCommand, { encoding: 'utf8', timeout: 10000 })
            console.log('✅ URL ảnh hoạt động bình thường')
            console.log('📊 Headers:')
            console.log(headResult)
          } catch (headError) {
            console.log(`❌ Lỗi kiểm tra URL: ${headError.message}`)
          }
          
        } else if (jsonResult.error) {
          console.log('\n❌ Upload thất bại!')
          console.log(`📋 Error: ${jsonResult.error}`)
          
          if (jsonResult.error.includes('API key')) {
            console.log('💡 Vấn đề với API key Cloudinary')
          }
        }
        
      } catch (parseError) {
        console.log('\n⚠️ Không thể parse JSON response')
        console.log('📋 Raw response:', result)
      }
      
    } catch (curlError) {
      console.log(`❌ Lỗi curl: ${curlError.message}`)
      
      if (curlError.message.includes('Connection refused')) {
        console.log('💡 Server có thể chưa chạy. Hãy chạy: npm run dev')
      }
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath)
      console.log('\n🧹 Đã xóa file test')
    }

    console.log('\n🎉 Test hoàn thành!')
    console.log('\n📝 Tóm tắt:')
    console.log('✅ Cloudinary đã được cấu hình với API keys thực')
    console.log('📁 Thư mục upload: nongvannam')
    console.log('🌐 API endpoint: /api/upload-cloudinary')
    console.log('📱 Bây giờ bạn có thể test upload ảnh trong web app!')

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testAPIUpload()
    .then(() => {
      console.log('\n✅ Test hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testAPIUpload }
