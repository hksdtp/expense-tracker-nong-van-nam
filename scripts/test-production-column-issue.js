#!/usr/bin/env node

/**
 * Script test vấn đề cột trên production
 */

const PRODUCTION_URL = 'https://expense-tracker-nong-van-nam.vercel.app'

async function testProductionColumnIssue() {
  console.log('🔍 TEST VẤN ĐỀ CỘT TRÊN PRODUCTION')
  console.log('=' .repeat(60))
  console.log(`🌐 URL: ${PRODUCTION_URL}`)
  
  try {
    // 1. Lấy dữ liệu hiện tại
    console.log('\n🔍 1. LẤY DỮ LIỆU HIỆN TẠI')
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    
    const getResponse = await fetch(`${PRODUCTION_URL}/api/transactions?month=${month}&year=${year}&refresh=true`)
    
    if (getResponse.ok) {
      const currentData = await getResponse.json()
      console.log(`   📊 Số giao dịch hiện tại: ${currentData.transactions?.length || 0}`)
      
      if (currentData.transactions && currentData.transactions.length > 0) {
        console.log('   📝 5 giao dịch gần nhất:')
        currentData.transactions.slice(-5).forEach((t, index) => {
          console.log(`      ${index + 1}. ${t.date} | ${t.category} | ${t.description} | ${t.amount}`)
        })
      }
    } else {
      console.log('   ❌ Không thể lấy dữ liệu hiện tại')
      return false
    }

    // 2. Thêm giao dịch test với timestamp để dễ nhận diện
    console.log('\n🔍 2. THÊM GIAO DỊCH TEST')
    const timestamp = new Date().getTime()
    const testData = {
      type: 'expense',
      category: 'Column Debug Test',
      description: `Test column issue ${timestamp}`,
      amount: '99999',
      paymentMethod: 'transfer',
      date: '20/09/2025',
      note: `Debug timestamp: ${timestamp}`,
      receiptLink: '',
      subCategory: 'Column Debug Sub',
      fuelLiters: ''
    }

    console.log('   📋 Thêm giao dịch test...')
    console.log(`      Mô tả: ${testData.description}`)
    console.log(`      Số tiền: ${testData.amount}`)

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
      console.log('   ✅ Giao dịch test đã được thêm!')
    } else {
      const errorData = await postResponse.json()
      console.log(`   ❌ Lỗi thêm giao dịch: ${errorData.error}`)
      return false
    }

    // 3. Đợi và kiểm tra lại dữ liệu
    console.log('\n🔍 3. KIỂM TRA LẠI SAU KHI THÊM')
    console.log('   ⏳ Đợi 5 giây để dữ liệu được ghi vào Google Sheets...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    const afterResponse = await fetch(`${PRODUCTION_URL}/api/transactions?month=${month}&year=${year}&refresh=true`)
    
    if (afterResponse.ok) {
      const afterData = await afterResponse.json()
      console.log(`   📊 Số giao dịch sau khi thêm: ${afterData.transactions?.length || 0}`)
      
      // Tìm giao dịch test
      const testTransaction = afterData.transactions?.find(t => 
        t.description && t.description.includes(`Test column issue ${timestamp}`)
      )
      
      if (testTransaction) {
        console.log('   ✅ TÌM THẤY GIAO DỊCH TEST TRONG KẾT QUẢ API!')
        console.log(`      Ngày: ${testTransaction.date}`)
        console.log(`      Danh mục: ${testTransaction.category}`)
        console.log(`      Mô tả: ${testTransaction.description}`)
        console.log(`      Số tiền: ${testTransaction.amount}`)
        console.log(`      Loại: ${testTransaction.type}`)
        console.log('   🎉 GIAO DỊCH ĐƯỢC GHI VÀ ĐỌC THÀNH CÔNG!')
        return true
      } else {
        console.log('   ❌ KHÔNG TÌM THẤY GIAO DỊCH TEST TRONG KẾT QUẢ API!')
        console.log('   🚨 VẤN ĐỀ: Giao dịch được thêm nhưng không hiển thị trong API GET')
        console.log('   💡 Có thể giao dịch được ghi vào sai vị trí (cột L thay vì cột A)')
        
        // Hiển thị tất cả giao dịch để debug
        console.log('\n   📋 TẤT CẢ GIAO DỊCH HIỆN TẠI:')
        if (afterData.transactions && afterData.transactions.length > 0) {
          afterData.transactions.forEach((t, index) => {
            console.log(`      ${index + 1}. ${t.date} | ${t.category} | ${t.description} | ${t.amount}`)
          })
        } else {
          console.log('      Không có giao dịch nào')
        }
        
        return false
      }
    } else {
      console.log('   ❌ Không thể lấy dữ liệu sau khi thêm')
      return false
    }

  } catch (error) {
    console.error('\n💥 Lỗi trong quá trình test:', error)
    return false
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testProductionColumnIssue()
    .then((success) => {
      if (success) {
        console.log('\n✅ TEST THÀNH CÔNG!')
        console.log('🎉 Giao dịch được ghi và đọc đúng cách!')
        process.exit(0)
      } else {
        console.log('\n❌ TEST THẤT BẠI!')
        console.log('🚨 XÁC NHẬN VẤN ĐỀ: Giao dịch không hiển thị sau khi thêm!')
        console.log('💡 Nguyên nhân có thể: Dữ liệu được ghi vào sai cột (L thay vì A)')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 TEST LỖI:', error)
      process.exit(1)
    })
}

module.exports = { testProductionColumnIssue }
