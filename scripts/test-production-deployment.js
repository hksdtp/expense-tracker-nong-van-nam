#!/usr/bin/env node

/**
 * Script để test chức năng trên production sau khi deploy
 */

const PRODUCTION_URL = 'https://expense-tracker-nong-van-nam.vercel.app'

async function testProductionDeployment() {
  console.log('🚀 TEST CHỨC NĂNG TRÊN PRODUCTION')
  console.log('=' .repeat(60))
  console.log(`🌐 URL: ${PRODUCTION_URL}`)
  
  let testsPassed = 0
  let totalTests = 0
  
  try {
    // Test 1: Kiểm tra ứng dụng có load được không
    console.log('\n🧪 Test 1: Kiểm tra ứng dụng load')
    totalTests++
    if (await testAppLoad()) {
      testsPassed++
      console.log('   ✅ PASS: Ứng dụng load thành công')
    } else {
      console.log('   ❌ FAIL: Ứng dụng không load được')
    }
    
    // Test 2: Test API GET transactions
    console.log('\n🧪 Test 2: Test API GET transactions')
    totalTests++
    if (await testAPIGet()) {
      testsPassed++
      console.log('   ✅ PASS: API GET hoạt động')
    } else {
      console.log('   ❌ FAIL: API GET có vấn đề')
    }
    
    // Test 3: Test API POST (thêm giao dịch)
    console.log('\n🧪 Test 3: Test API POST (thêm giao dịch)')
    totalTests++
    if (await testAPIPost()) {
      testsPassed++
      console.log('   ✅ PASS: API POST hoạt động - Giao dịch được thêm thành công')
    } else {
      console.log('   ❌ FAIL: API POST có vấn đề')
    }
    
    // Test 4: Xác minh dữ liệu được ghi đúng cột
    console.log('\n🧪 Test 4: Xác minh dữ liệu được ghi đúng cột')
    totalTests++
    if (await testDataMapping()) {
      testsPassed++
      console.log('   ✅ PASS: Dữ liệu được ghi đúng vị trí từ cột A')
    } else {
      console.log('   ❌ FAIL: Dữ liệu vẫn bị ghi sai cột')
    }
    
    // Kết quả tổng kết
    console.log('\n' + '=' .repeat(60))
    console.log(`📊 KẾT QUẢ TEST PRODUCTION: ${testsPassed}/${totalTests} tests passed`)
    
    if (testsPassed === totalTests) {
      console.log('🎉 TẤT CẢ TESTS PRODUCTION ĐỀU PASS!')
      console.log('✅ Lỗi ghi dữ liệu vào sai cột đã được khắc phục thành công trên production!')
      return true
    } else {
      console.log('⚠️ CÒN VẤN ĐỀ TRÊN PRODUCTION CẦN KHẮC PHỤC!')
      return false
    }
    
  } catch (error) {
    console.error('\n💥 Lỗi trong quá trình test production:', error)
    return false
  }
}

async function testAppLoad() {
  try {
    const response = await fetch(PRODUCTION_URL)
    
    if (response.ok) {
      const html = await response.text()
      // Kiểm tra xem có chứa title "Báo cáo chi phí" không
      return html.includes('Báo cáo chi phí')
    }
    
    return false

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

async function testAPIGet() {
  try {
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    
    const response = await fetch(`${PRODUCTION_URL}/api/transactions?month=${month}&year=${year}&refresh=true`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`      📊 API trả về: ${data.transactions?.length || 0} giao dịch`)
      return data.success && Array.isArray(data.transactions)
    } else {
      const errorData = await response.json()
      console.log(`      ❌ API Error: ${errorData.error}`)
      return false
    }

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

async function testAPIPost() {
  try {
    const testData = {
      type: 'expense',
      category: 'Production Test',
      description: 'Test giao dịch trên production',
      amount: '77000',
      paymentMethod: 'transfer',
      date: '18/09/2025',
      note: 'Test production deployment',
      receiptLink: '',
      subCategory: 'Production Sub',
      fuelLiters: ''
    }

    console.log('      📋 Thêm giao dịch test trên production...')

    const formData = new FormData()
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch(`${PRODUCTION_URL}/api/transactions`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const result = await response.json()
      console.log('      ✅ Giao dịch production test đã được thêm!')
      return result.success
    } else {
      const errorData = await response.json()
      console.log(`      ❌ Lỗi thêm giao dịch: ${errorData.error}`)
      return false
    }

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

async function testDataMapping() {
  try {
    // Đợi một chút để dữ liệu được ghi vào Google Sheets
    console.log('      ⏳ Đợi 3 giây để dữ liệu được ghi vào Google Sheets...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    
    const response = await fetch(`${PRODUCTION_URL}/api/transactions?month=${month}&year=${year}&refresh=true`)
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.transactions && data.transactions.length > 0) {
        // Tìm giao dịch test vừa thêm
        const testTransaction = data.transactions.find(t => 
          t.description === 'Test giao dịch trên production' && 
          t.category === 'Production Test'
        )
        
        if (testTransaction) {
          console.log('      📋 Tìm thấy giao dịch test:')
          console.log(`         Ngày: ${testTransaction.date}`)
          console.log(`         Danh mục: ${testTransaction.category}`)
          console.log(`         Mô tả: ${testTransaction.description}`)
          console.log(`         Số tiền: ${testTransaction.amount}`)
          console.log(`         Loại: ${testTransaction.type}`)
          
          // Kiểm tra các trường có đúng không
          const isCorrect = 
            testTransaction.date === '18/09/2025' &&
            testTransaction.category === 'Production Test' &&
            testTransaction.description === 'Test giao dịch trên production' &&
            testTransaction.amount === 77000 &&
            testTransaction.type === 'expense'
          
          if (isCorrect) {
            console.log('      ✅ Dữ liệu mapping chính xác!')
            return true
          } else {
            console.log('      ❌ Dữ liệu mapping không chính xác!')
            return false
          }
        } else {
          console.log('      ⚠️ Không tìm thấy giao dịch test trong kết quả API')
          return false
        }
      } else {
        console.log('      ⚠️ Không có giao dịch nào được trả về')
        return false
      }
    } else {
      console.log('      ❌ Không thể lấy dữ liệu để xác minh')
      return false
    }

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testProductionDeployment()
    .then((success) => {
      if (success) {
        console.log('\n🏆 PRODUCTION TEST THÀNH CÔNG!')
        console.log('🎉 Ứng dụng hoạt động hoàn hảo trên production!')
        process.exit(0)
      } else {
        console.log('\n💥 PRODUCTION TEST THẤT BẠI!')
        console.log('⚠️ Cần kiểm tra và khắc phục vấn đề trên production!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 PRODUCTION TEST LỖI:', error)
      process.exit(1)
    })
}

module.exports = { testProductionDeployment }
