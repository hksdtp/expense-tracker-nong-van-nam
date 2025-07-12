#!/usr/bin/env node

/**
 * Script kiểm tra dữ liệu thô từ Google Sheets
 * Tìm giao dịch tiền mặt và phân tích theo tháng
 */

require('dotenv').config({ path: '.env.local' })
const { google } = require('googleapis')

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID || '14_Y-DsQvndhsFHrwb0W12guk36zqtzUnMA5tz9jw1D4'

async function initGoogleAPIs() {
  const serviceAccountEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google service account credentials')
  }

  const auth = new google.auth.JWT(
    serviceAccountEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  )

  const sheets = google.sheets({ version: 'v4', auth })
  
  return { sheets, auth }
}

function parseDate(dateString) {
  if (!dateString) return null
  
  try {
    // Thử format DD/MM/YYYY trước
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1])
        const year = parseInt(parts[2])
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return { day, month, year }
        }
      }
    }
    
    // Thử Date constructor
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

async function checkRawData() {
  console.log('🔍 KIỂM TRA DỮ LIỆU THÔ TỪ GOOGLE SHEETS')
  console.log('=' .repeat(60))

  try {
    const { sheets } = await initGoogleAPIs()

    // Lấy tất cả dữ liệu từ Sheet1
    console.log('\n📋 Lấy dữ liệu từ Sheet1...')
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values || []
    console.log(`   📊 Tổng rows: ${rows.length}`)
    
    if (rows.length === 0) {
      console.log('   ❌ Không có dữ liệu')
      return
    }

    // Headers
    const headers = rows[0]
    console.log(`   📋 Headers: [${headers.join(', ')}]`)
    
    // Data rows
    const dataRows = rows.slice(1)
    console.log(`   📊 Data rows: ${dataRows.length}`)

    // Phân tích cấu trúc
    console.log('\n📋 Phân tích cấu trúc:')
    headers.forEach((header, index) => {
      const letter = String.fromCharCode(65 + index)
      console.log(`   ${letter}. ${header}`)
    })

    // Tìm index của các cột quan trọng
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('ngày'))
    const amountIndex = headers.findIndex(h => h.toLowerCase().includes('số tiền'))
    const typeIndex = headers.findIndex(h => h.toLowerCase().includes('loại'))
    const paymentIndex = headers.findIndex(h => h.toLowerCase().includes('phương thức'))
    const descIndex = headers.findIndex(h => h.toLowerCase().includes('mô tả'))
    const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('danh mục'))

    console.log('\n📋 Index mapping:')
    console.log(`   Ngày: ${dateIndex} (${headers[dateIndex] || 'N/A'})`)
    console.log(`   Số tiền: ${amountIndex} (${headers[amountIndex] || 'N/A'})`)
    console.log(`   Loại: ${typeIndex} (${headers[typeIndex] || 'N/A'})`)
    console.log(`   Phương thức: ${paymentIndex} (${headers[paymentIndex] || 'N/A'})`)
    console.log(`   Mô tả: ${descIndex} (${headers[descIndex] || 'N/A'})`)
    console.log(`   Danh mục: ${categoryIndex} (${headers[categoryIndex] || 'N/A'})`)

    // Phân tích giao dịch tiền mặt
    console.log('\n📋 Tìm giao dịch tiền mặt...')
    
    const cashTransactions = []
    const monthlyBreakdown = {}

    dataRows.forEach((row, index) => {
      const rowNum = index + 2 // +2 vì skip header và 0-based
      
      const date = row[dateIndex] || ''
      const amount = parseFloat(row[amountIndex]) || 0
      const type = row[typeIndex] || ''
      const paymentMethod = row[paymentIndex] || ''
      const description = row[descIndex] || ''
      const category = row[categoryIndex] || ''

      // Kiểm tra xem có phải tiền mặt không
      const isCash = paymentMethod.toLowerCase().includes('cash') || 
                     paymentMethod.toLowerCase().includes('tiền mặt') ||
                     paymentMethod.toLowerCase().includes('tien mat')

      if (isCash && amount > 0) {
        const dateInfo = parseDate(date)
        
        const transaction = {
          rowNum,
          date,
          dateInfo,
          amount,
          type,
          paymentMethod,
          description,
          category
        }
        
        cashTransactions.push(transaction)
        
        if (dateInfo) {
          const monthKey = `${dateInfo.month}/${dateInfo.year}`
          if (!monthlyBreakdown[monthKey]) {
            monthlyBreakdown[monthKey] = {
              income: 0,
              expense: 0,
              transactions: []
            }
          }
          
          if (type.toLowerCase().includes('income') || type.toLowerCase().includes('thu')) {
            monthlyBreakdown[monthKey].income += amount
          } else {
            monthlyBreakdown[monthKey].expense += amount
          }
          
          monthlyBreakdown[monthKey].transactions.push(transaction)
        }
      }
    })

    console.log(`   💵 Tổng giao dịch tiền mặt: ${cashTransactions.length}`)

    if (cashTransactions.length > 0) {
      console.log('\n📋 BREAKDOWN THEO THÁNG:')
      
      Object.keys(monthlyBreakdown)
        .sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number)
          const [monthB, yearB] = b.split('/').map(Number)
          return yearA - yearB || monthA - monthB
        })
        .forEach(monthKey => {
          const data = monthlyBreakdown[monthKey]
          const net = data.income - data.expense
          console.log(`\n   📅 ${monthKey}:`)
          console.log(`      Thu: ${data.income.toLocaleString('vi-VN')} đ`)
          console.log(`      Chi: ${data.expense.toLocaleString('vi-VN')} đ`)
          console.log(`      Ròng: ${net.toLocaleString('vi-VN')} đ`)
          console.log(`      Giao dịch: ${data.transactions.length}`)
          
          // Hiển thị chi tiết giao dịch
          data.transactions.forEach((t, index) => {
            console.log(`         ${index + 1}. Row ${t.rowNum}: ${t.date} | ${t.description} | ${t.amount.toLocaleString('vi-VN')} đ | ${t.type}`)
          })
        })

      // Tính tổng
      let totalIncome = 0
      let totalExpense = 0
      
      cashTransactions.forEach(t => {
        if (t.type.toLowerCase().includes('income') || t.type.toLowerCase().includes('thu')) {
          totalIncome += t.amount
        } else {
          totalExpense += t.amount
        }
      })
      
      const netBalance = totalIncome - totalExpense
      
      console.log('\n📊 TỔNG CỘNG:')
      console.log(`   Thu nhập: ${totalIncome.toLocaleString('vi-VN')} đ`)
      console.log(`   Chi tiêu: ${totalExpense.toLocaleString('vi-VN')} đ`)
      console.log(`   Số dư ròng: ${netBalance.toLocaleString('vi-VN')} đ`)
      
      if (netBalance === 15166000) {
        console.log(`   ✅ Khớp với "Tiền mặt còn" hiện tại!`)
      } else {
        console.log(`   ⚠️ Không khớp với "Tiền mặt còn" (15.166.000 đ)`)
        console.log(`   🔍 Chênh lệch: ${(netBalance - 15166000).toLocaleString('vi-VN')} đ`)
      }
    } else {
      console.log('   ⚠️ Không tìm thấy giao dịch tiền mặt nào')
      console.log('   💡 Có thể do:')
      console.log('      - Tên cột "Phương thức thanh toán" khác')
      console.log('      - Giá trị không chứa "cash" hoặc "tiền mặt"')
      console.log('      - Dữ liệu migration có format khác')
      
      // Kiểm tra một số sample để debug
      console.log('\n📋 SAMPLE DATA (5 rows đầu):')
      dataRows.slice(0, 5).forEach((row, index) => {
        console.log(`   Row ${index + 2}: [${row.join(' | ')}]`)
      })
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình kiểm tra:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  checkRawData()
    .then(() => {
      console.log('\n✅ Kiểm tra hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Kiểm tra thất bại:', error)
      process.exit(1)
    })
}

module.exports = { checkRawData }
