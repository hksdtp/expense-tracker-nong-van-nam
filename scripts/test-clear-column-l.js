#!/usr/bin/env node

/**
 * Script để test clear cột L (URL ảnh) trong Google Sheets
 */

require('dotenv').config({ path: '.env.local' })

async function testClearColumnL() {
  console.log('🧪 Test clear cột L (URL ảnh) trong Google Sheets...')
  console.log('=' .repeat(50))

  try {
    // Test với row giả
    const testRowIndex = 999
    const testImageUrl = 'https://res.cloudinary.com/dgaktc3fb/image/upload/v1752279559/nongvannam/test-image.png'
    
    console.log(`\n📋 Test với row ${testRowIndex}`)
    console.log(`📷 Test image URL: ${testImageUrl}`)

    // Test API DELETE
    const params = new URLSearchParams({
      rowIndex: testRowIndex.toString(),
      imageUrl: testImageUrl
    })

    console.log('\n📤 Gọi API DELETE...')
    const response = await fetch(`http://localhost:3000/api/transactions?${params.toString()}`, {
      method: 'DELETE',
    })

    console.log(`📊 Response status: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ API hoạt động:', result.message)
    } else {
      const error = await response.json()
      console.log('❌ API lỗi:', error.error)
      console.log('📋 Details:', error.details)
    }

    console.log('\n🎉 Test hoàn thành!')
    console.log('\n📊 Kiểm tra server logs để xem chi tiết:')
    console.log('   - Row clearing process')
    console.log('   - Column L explicit clearing')
    console.log('   - Cloudinary deletion attempt')

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testClearColumnL()
    .then(() => {
      console.log('\n✅ Test hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testClearColumnL }
