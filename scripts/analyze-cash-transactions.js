#!/usr/bin/env node

/**
 * Script phân tích chi tiết giao dịch tiền mặt theo tháng
 * Kiểm tra tháng 5, 6, 7 để xác minh số dư
 */

require('dotenv').config({ path: '.env.local' })

async function analyzeCashTransactions() {
  console.log('🔍 PHÂN TÍCH CHI TIẾT GIAO DỊCH TIỀN MẶT')
  console.log('=' .repeat(60))

  try {
    // Kiểm tra 3 tháng: 5, 6, 7
    const months = [
      { month: 5, year: 2025, name: 'Tháng 5/2025' },
      { month: 6, year: 2025, name: 'Tháng 6/2025' },
      { month: 7, year: 2025, name: 'Tháng 7/2025' }
    ]

    for (const period of months) {
      console.log(`\n📅 === ${period.name} ===`)
      
      // Lấy dữ liệu account cho tháng này
      const accountResponse = await fetch(`http://localhost:3005/api/account-data?month=${period.month}&year=${period.year}`)
      
      if (accountResponse.ok) {
        const accountResult = await accountResponse.json()
        const accountData = accountResult.data
        
        console.log(`   💵 Tiền mặt còn: ${accountData.cashRemaining.toLocaleString('vi-VN')} đ`)
        console.log(`   💸 Chi tiêu tiền mặt: ${accountData.cashExpenses.toLocaleString('vi-VN')} đ`)
      }
      
      // Lấy giao dịch chi tiết cho tháng này
      const transResponse = await fetch(`http://localhost:3005/api/transactions?month=${period.month}&year=${period.year}`)
      
      if (transResponse.ok) {
        const transResult = await transResponse.json()
        const transactions = transResult.transactions || []
        
        console.log(`   📊 Tổng giao dịch: ${transactions.length}`)
        
        // Lọc giao dịch tiền mặt
        const cashTransactions = transactions.filter(t => 
          t.paymentMethod === 'cash' || 
          t.paymentMethod === 'Tiền mặt' ||
          t.paymentMethod === 'tiền mặt'
        )
        
        console.log(`   💵 Giao dịch tiền mặt: ${cashTransactions.length}`)
        
        if (cashTransactions.length > 0) {
          // Phân tích thu chi tiền mặt
          let cashIncome = 0
          let cashExpense = 0
          const incomeTransactions = []
          const expenseTransactions = []
          
          cashTransactions.forEach(t => {
            if (t.type === 'income') {
              cashIncome += t.amount
              incomeTransactions.push(t)
            } else {
              cashExpense += t.amount
              expenseTransactions.push(t)
            }
          })
          
          console.log(`   📈 Thu nhập tiền mặt: ${cashIncome.toLocaleString('vi-VN')} đ (${incomeTransactions.length} giao dịch)`)
          console.log(`   📉 Chi tiêu tiền mặt: ${cashExpense.toLocaleString('vi-VN')} đ (${expenseTransactions.length} giao dịch)`)
          
          // Hiển thị chi tiết giao dịch thu nhập tiền mặt
          if (incomeTransactions.length > 0) {
            console.log(`\n   📈 CHI TIẾT THU NHẬP TIỀN MẶT:`)
            incomeTransactions.forEach((t, index) => {
              console.log(`      ${index + 1}. ${t.date} | ${t.description || 'Không có mô tả'} | ${t.amount.toLocaleString('vi-VN')} đ | ${t.category || 'Không có danh mục'}`)
            })
          }
          
          // Hiển thị chi tiết giao dịch chi tiêu tiền mặt (top 5)
          if (expenseTransactions.length > 0) {
            console.log(`\n   📉 CHI TIẾT CHI TIÊU TIỀN MẶT (Top 5):`)
            const topExpenses = expenseTransactions
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
            
            topExpenses.forEach((t, index) => {
              console.log(`      ${index + 1}. ${t.date} | ${t.description || 'Không có mô tả'} | ${t.amount.toLocaleString('vi-VN')} đ | ${t.category || 'Không có danh mục'}`)
            })
            
            if (expenseTransactions.length > 5) {
              console.log(`      ... và ${expenseTransactions.length - 5} giao dịch khác`)
            }
          }
        } else {
          console.log(`   ⚠️ Không có giao dịch tiền mặt nào`)
        }
      }
    }
    
    // Phân tích tổng quan từ đầu đến nay
    console.log(`\n📊 === TỔNG QUAN TỪ ĐẦU ĐẾN NAY ===`)
    
    // Lấy tất cả giao dịch
    const allTransResponse = await fetch(`http://localhost:3005/api/transactions`)
    
    if (allTransResponse.ok) {
      const allTransResult = await allTransResponse.json()
      const allTransactions = allTransResult.transactions || []
      
      console.log(`   📊 Tổng tất cả giao dịch: ${allTransactions.length}`)
      
      // Lọc tất cả giao dịch tiền mặt
      const allCashTransactions = allTransactions.filter(t => 
        t.paymentMethod === 'cash' || 
        t.paymentMethod === 'Tiền mặt' ||
        t.paymentMethod === 'tiền mặt'
      )
      
      console.log(`   💵 Tổng giao dịch tiền mặt: ${allCashTransactions.length}`)
      
      // Phân tích theo tháng
      const monthlyBreakdown = {}
      
      allCashTransactions.forEach(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`
        
        if (!monthlyBreakdown[monthKey]) {
          monthlyBreakdown[monthKey] = {
            income: 0,
            expense: 0,
            incomeCount: 0,
            expenseCount: 0
          }
        }
        
        if (t.type === 'income') {
          monthlyBreakdown[monthKey].income += t.amount
          monthlyBreakdown[monthKey].incomeCount++
        } else {
          monthlyBreakdown[monthKey].expense += t.amount
          monthlyBreakdown[monthKey].expenseCount++
        }
      })
      
      console.log(`\n   📅 BREAKDOWN THEO THÁNG:`)
      Object.keys(monthlyBreakdown)
        .sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number)
          const [monthB, yearB] = b.split('/').map(Number)
          return yearA - yearB || monthA - monthB
        })
        .forEach(monthKey => {
          const data = monthlyBreakdown[monthKey]
          const net = data.income - data.expense
          console.log(`      ${monthKey}: Thu ${data.income.toLocaleString('vi-VN')} đ (${data.incomeCount}) - Chi ${data.expense.toLocaleString('vi-VN')} đ (${data.expenseCount}) = ${net.toLocaleString('vi-VN')} đ`)
        })
      
      // Tính tổng cộng
      let totalCashIncome = 0
      let totalCashExpense = 0
      
      allCashTransactions.forEach(t => {
        if (t.type === 'income') {
          totalCashIncome += t.amount
        } else {
          totalCashExpense += t.amount
        }
      })
      
      const netCashBalance = totalCashIncome - totalCashExpense
      
      console.log(`\n   💰 TỔNG CỘNG:`)
      console.log(`      Thu nhập tiền mặt: ${totalCashIncome.toLocaleString('vi-VN')} đ`)
      console.log(`      Chi tiêu tiền mặt: ${totalCashExpense.toLocaleString('vi-VN')} đ`)
      console.log(`      Số dư ròng: ${netCashBalance.toLocaleString('vi-VN')} đ`)
      
      if (netCashBalance === 15166000) {
        console.log('      ✅ Khớp với "Tiền mặt còn" hiện tại!')
      } else {
        console.log(`      ⚠️ Không khớp với "Tiền mặt còn" (${(15166000).toLocaleString('vi-VN')} đ)`)
      }
    }
    
    console.log(`\n💡 KẾT LUẬN:`)
    console.log(`   1. Kiểm tra xem có giao dịch tiền mặt nào trong tháng 5-6 không`)
    console.log(`   2. Xác minh logic tính toán số dư tiền mặt`)
    console.log(`   3. Đề xuất đồng bộ sang tháng 7 nếu cần`)

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình phân tích:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  analyzeCashTransactions()
    .then(() => {
      console.log('\n✅ Phân tích hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Phân tích thất bại:', error)
      process.exit(1)
    })
}

module.exports = { analyzeCashTransactions }
