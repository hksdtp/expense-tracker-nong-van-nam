#!/usr/bin/env node

/**
 * Script debug số dư tiền mặt để hiểu tại sao có 15.166.000 đ
 */

require('dotenv').config({ path: '.env.local' })

async function debugCashBalance() {
  console.log('🔍 DEBUG SỐ DƯ TIỀN MẶT')
  console.log('=' .repeat(50))

  try {
    // Gọi API để lấy dữ liệu account
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    
    console.log(`📅 Tháng hiện tại: ${month}/${year}`)
    
    const response = await fetch(`http://localhost:3005/api/account-data?month=${month}&year=${year}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`API failed: ${result.error}`)
    }
    
    const accountData = result.data
    
    console.log('\n📊 KẾT QUẢ TÍNH TOÁN:')
    console.log(`   💰 Số dư hiện có: ${accountData.currentBalance.toLocaleString('vi-VN')} đ`)
    console.log(`   🏦 Tài khoản còn: ${accountData.accountRemaining.toLocaleString('vi-VN')} đ`)
    console.log(`   💵 Tiền mặt còn: ${accountData.cashRemaining.toLocaleString('vi-VN')} đ`)
    console.log(`   📈 Tổng chi tiêu: ${accountData.totalExpense.toLocaleString('vi-VN')} đ`)
    
    console.log('\n📋 CHI TIẾT BREAKDOWN:')
    console.log(`   🏦 Số dư đầu kỳ tài khoản: ${accountData.beginningBalance.toLocaleString('vi-VN')} đ`)
    console.log(`   💰 Tổng đã ứng tháng này: ${accountData.totalAdvanced.toLocaleString('vi-VN')} đ`)
    console.log(`   💸 Chi tiêu tài khoản: ${accountData.accountExpenses.toLocaleString('vi-VN')} đ`)
    console.log(`   💸 Chi tiêu tiền mặt: ${accountData.cashExpenses.toLocaleString('vi-VN')} đ`)
    
    // Gọi API transactions để xem chi tiết
    console.log('\n📋 PHÂN TÍCH GIAO DỊCH TIỀN MẶT:')
    
    const transResponse = await fetch(`http://localhost:3005/api/transactions?month=${month}&year=${year}`)
    
    if (transResponse.ok) {
      const transResult = await transResponse.json()
      const transactions = transResult.transactions || []
      
      console.log(`   📊 Tổng giao dịch tháng ${month}/${year}: ${transactions.length}`)
      
      // Lọc giao dịch tiền mặt
      const cashTransactions = transactions.filter(t => 
        t.paymentMethod === 'cash' || t.paymentMethod === 'Tiền mặt'
      )
      
      console.log(`   💵 Giao dịch tiền mặt: ${cashTransactions.length}`)
      
      // Phân tích giao dịch tiền mặt
      let cashIncome = 0
      let cashExpense = 0
      
      cashTransactions.forEach(t => {
        if (t.type === 'income') {
          cashIncome += t.amount
        } else {
          cashExpense += t.amount
        }
      })
      
      console.log(`   📈 Thu nhập tiền mặt tháng này: ${cashIncome.toLocaleString('vi-VN')} đ`)
      console.log(`   📉 Chi tiêu tiền mặt tháng này: ${cashExpense.toLocaleString('vi-VN')} đ`)
      
      // Hiển thị một số giao dịch tiền mặt mẫu
      console.log('\n📋 MẪU GIAO DỊCH TIỀN MẶT:')
      const sampleCash = cashTransactions.slice(0, 5)
      sampleCash.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.date} | ${t.description} | ${t.amount.toLocaleString('vi-VN')} đ | ${t.type}`)
      })
      
      if (cashTransactions.length > 5) {
        console.log(`   ... và ${cashTransactions.length - 5} giao dịch khác`)
      }
    }
    
    // Phân tích nguồn gốc số tiền 15.166.000
    console.log('\n🔍 PHÂN TÍCH NGUỒN GỐC SỐ TIỀN 15.166.000:')
    
    if (accountData.cashRemaining === 15166000) {
      console.log('   ✅ Đây chính là số "Tiền mặt còn" hiện tại')
      console.log('   📊 Số này được tính từ:')
      console.log('      = Tất cả thu nhập tiền mặt từ trước đến nay')
      console.log('      - Tất cả chi tiêu tiền mặt từ trước đến nay')
      console.log('   💡 Có thể do migration 352 records từ "Nhật ký" có nhiều giao dịch tiền mặt')
    } else {
      console.log(`   ⚠️ Số hiện tại là ${accountData.cashRemaining.toLocaleString('vi-VN')} đ, khác với 15.166.000`)
    }
    
    console.log('\n💡 ĐỀ XUẤT KIỂM TRA:')
    console.log('   1. Xem tất cả giao dịch có paymentMethod = "cash" hoặc "Tiền mặt"')
    console.log('   2. Kiểm tra dữ liệu migration từ "Nhật ký" có đúng không')
    console.log('   3. Xác minh logic tính toán trong lib/data.ts')
    console.log('   4. Có thể cần điều chỉnh số dư đầu kỳ nếu không chính xác')

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình debug:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  debugCashBalance()
    .then(() => {
      console.log('\n✅ Debug hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Debug thất bại:', error)
      process.exit(1)
    })
}

module.exports = { debugCashBalance }
