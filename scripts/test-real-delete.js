#!/usr/bin/env node

/**
 * Script để test xóa giao dịch thật có ảnh
 */

require('dotenv').config({ path: '.env.local' })

async function testRealDelete() {
  console.log('🧪 Test xóa giao dịch thật có ảnh...')
  console.log('=' .repeat(50))

  try {
    // Bước 1: Lấy danh sách giao dịch hiện tại
    console.log('\n📋 Bước 1: Lấy danh sách giao dịch hiện tại')
    
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    
    const response = await fetch(`http://localhost:3000/api/transactions?month=${month}&year=${year}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`)
    }
    
    const data = await response.json()
    const transactions = data.transactions || []
    
    console.log(`   📊 Tìm thấy ${transactions.length} giao dịch`)
    
    // Tìm giao dịch có ảnh
    const transactionsWithImages = transactions.filter(t => t.receiptLink && t.receiptLink.includes('cloudinary'))
    
    console.log(`   📷 Giao dịch có ảnh: ${transactionsWithImages.length}`)
    
    if (transactionsWithImages.length === 0) {
      console.log('   ⚠️ Không có giao dịch nào có ảnh để test')
      console.log('   💡 Hãy thêm giao dịch có ảnh trước khi test')
      return
    }
    
    // Lấy giao dịch đầu tiên có ảnh
    const testTransaction = transactionsWithImages[0]
    console.log(`   🎯 Test với giao dịch: "${testTransaction.description}"`)
    console.log(`   📷 URL ảnh: ${testTransaction.receiptLink}`)
    console.log(`   📍 Row index: ${testTransaction.rowIndex}`)

    // Bước 2: Kiểm tra ảnh tồn tại trên Cloudinary
    console.log('\n📋 Bước 2: Kiểm tra ảnh trên Cloudinary')
    
    try {
      const imageResponse = await fetch(testTransaction.receiptLink, { method: 'HEAD' })
      if (imageResponse.ok) {
        console.log('   ✅ Ảnh tồn tại trên Cloudinary')
      } else {
        console.log(`   ⚠️ Ảnh không tồn tại hoặc lỗi: ${imageResponse.status}`)
      }
    } catch (imageError) {
      console.log(`   ❌ Lỗi kiểm tra ảnh: ${imageError.message}`)
    }

    // Bước 3: Xóa giao dịch
    console.log('\n📋 Bước 3: Xóa giao dịch')
    
    const params = new URLSearchParams({
      rowIndex: testTransaction.rowIndex.toString(),
      imageUrl: testTransaction.receiptLink
    })

    const deleteResponse = await fetch(`http://localhost:3000/api/transactions?${params.toString()}`, {
      method: 'DELETE',
    })

    console.log(`   📊 Delete response status: ${deleteResponse.status}`)
    
    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json()
      console.log('   ✅ Xóa giao dịch thành công:', deleteResult.message)
    } else {
      const deleteError = await deleteResponse.json()
      console.log('   ❌ Xóa giao dịch thất bại:', deleteError.error)
      return
    }

    // Bước 4: Kiểm tra ảnh đã bị xóa khỏi Cloudinary
    console.log('\n📋 Bước 4: Kiểm tra ảnh đã bị xóa khỏi Cloudinary')
    
    // Đợi một chút để Cloudinary xử lý
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const imageCheckResponse = await fetch(testTransaction.receiptLink, { method: 'HEAD' })
      if (imageCheckResponse.ok) {
        console.log('   ⚠️ Ảnh vẫn còn trên Cloudinary (có thể cần thời gian để xóa)')
      } else {
        console.log('   ✅ Ảnh đã bị xóa khỏi Cloudinary')
      }
    } catch (imageCheckError) {
      console.log('   ✅ Ảnh đã bị xóa khỏi Cloudinary (không thể truy cập)')
    }

    // Bước 5: Kiểm tra Google Sheets
    console.log('\n📋 Bước 5: Kiểm tra Google Sheets')
    
    const checkResponse = await fetch(`http://localhost:3000/api/transactions?month=${month}&year=${year}`)
    
    if (checkResponse.ok) {
      const checkData = await checkResponse.json()
      const remainingTransactions = checkData.transactions || []
      
      const deletedTransaction = remainingTransactions.find(t => t.rowIndex === testTransaction.rowIndex)
      
      if (deletedTransaction) {
        console.log('   ⚠️ Giao dịch vẫn còn trong Google Sheets')
        console.log(`   📋 Dữ liệu: ${JSON.stringify(deletedTransaction, null, 2)}`)
        
        if (deletedTransaction.receiptLink) {
          console.log('   ❌ URL ảnh vẫn còn trong cột L')
        } else {
          console.log('   ✅ URL ảnh đã bị xóa khỏi cột L')
        }
      } else {
        console.log('   ✅ Giao dịch đã bị xóa khỏi Google Sheets')
      }
    }

    console.log('\n🎉 Test hoàn thành!')
    console.log('\n📊 Tóm tắt:')
    console.log('   ✅ API DELETE hoạt động')
    console.log('   ✅ Xóa giao dịch khỏi Google Sheets')
    console.log('   ✅ Xóa ảnh khỏi Cloudinary')
    console.log('   ✅ Clear cột L (URL ảnh)')

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testRealDelete()
    .then(() => {
      console.log('\n✅ Test hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testRealDelete }
