#!/usr/bin/env node

/**
 * Script để sửa header row trực tiếp trên production
 */

const PRODUCTION_URL = 'https://expense-tracker-nong-van-nam.vercel.app'

async function fixProductionHeader() {
  console.log('🔧 SỬA HEADER ROW TRÊN PRODUCTION')
  console.log('=' .repeat(60))
  console.log(`🌐 URL: ${PRODUCTION_URL}`)
  
  try {
    // Gọi API để sửa header
    console.log('\n🔧 1. GỌI API SỬA HEADER')
    
    const response = await fetch(`${PRODUCTION_URL}/api/setup-sheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fix-header'
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('   ✅ API setup-sheets thành công!')
      console.log(`   📋 Kết quả: ${JSON.stringify(result, null, 2)}`)
    } else {
      console.log('   ❌ API setup-sheets thất bại')
      const errorText = await response.text()
      console.log(`   💥 Lỗi: ${errorText}`)
      return false
    }

    // Test thêm giao dịch sau khi sửa header
    console.log('\n🔧 2. TEST THÊM GIAO DỊCH SAU KHI SỬA HEADER')
    const timestamp = new Date().getTime()
    const testData = {
      type: 'expense',
      category: 'After Header Fix',
      description: `Test after header fix ${timestamp}`,
      amount: '88888',
      paymentMethod: 'cash',
      date: '20/09/2025',
      note: `After fix timestamp: ${timestamp}`,
      receiptLink: '',
      subCategory: 'After Fix Sub',
      fuelLiters: ''
    }

    console.log('   📋 Thêm giao dịch test sau khi sửa header...')

    const formData = new FormData()
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const postResponse = await fetch(`${PRODUCTION_URL}/api/transactions`, {
      method: 'POST',
      body: formData,
    })

    if (postResponse.ok) {
      const postResult = await postResponse.json()
      console.log('   ✅ Giao dịch test sau khi sửa header đã được thêm!')
    } else {
      const errorData = await postResponse.json()
      console.log(`   ❌ Lỗi thêm giao dịch: ${errorData.error}`)
      return false
    }

    // Kiểm tra lại dữ liệu
    console.log('\n🔧 3. KIỂM TRA LẠI DỮ LIỆU SAU KHI SỬA')
    console.log('   ⏳ Đợi 5 giây để dữ liệu được ghi...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    
    const getResponse = await fetch(`${PRODUCTION_URL}/api/transactions?month=${month}&year=${year}&refresh=true`)
    
    if (getResponse.ok) {
      const data = await getResponse.json()
      console.log(`   📊 Số giao dịch sau khi sửa: ${data.transactions?.length || 0}`)
      
      // Tìm giao dịch test
      const testTransaction = data.transactions?.find(t => 
        t.description && t.description.includes(`Test after header fix ${timestamp}`)
      )
      
      if (testTransaction) {
        console.log('   ✅ TÌM THẤY GIAO DỊCH TEST SAU KHI SỬA HEADER!')
        console.log(`      Ngày: ${testTransaction.date}`)
        console.log(`      Danh mục: ${testTransaction.category}`)
        console.log(`      Mô tả: ${testTransaction.description}`)
        console.log(`      Số tiền: ${testTransaction.amount}`)
        console.log('   🎉 HEADER ĐÃ ĐƯỢC SỬA THÀNH CÔNG!')
        return true
      } else {
        console.log('   ❌ VẪN KHÔNG TÌM THẤY GIAO DỊCH TEST!')
        console.log('   🚨 VẤN ĐỀ VẪN CHƯA ĐƯỢC GIẢI QUYẾT!')
        return false
      }
    } else {
      console.log('   ❌ Không thể lấy dữ liệu để kiểm tra')
      return false
    }

  } catch (error) {
    console.error('\n💥 Lỗi trong quá trình sửa header:', error)
    return false
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  fixProductionHeader()
    .then((success) => {
      if (success) {
        console.log('\n🎉 SỬA HEADER THÀNH CÔNG!')
        console.log('✅ Giao dịch giờ được ghi và đọc đúng cách!')
        process.exit(0)
      } else {
        console.log('\n❌ SỬA HEADER THẤT BẠI!')
        console.log('🚨 Cần kiểm tra thêm để tìm nguyên nhân!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 SỬA HEADER LỖI:', error)
      process.exit(1)
    })
}

module.exports = { fixProductionHeader }
