#!/usr/bin/env node

/**
 * Script để test việc thêm giao dịch mới
 */

require('dotenv').config({ path: '.env.local' })

async function testAddTransaction() {
  console.log('🧪 Test thêm giao dịch mới...')
  
  try {
    // Tạo dữ liệu test
    const testTransaction = {
      type: 'expense',
      category: 'Chi phí khác',
      description: 'Test transaction từ script',
      amount: '50000',
      paymentMethod: 'transfer',
      date: '10/07/2025',
      note: 'Đây là giao dịch test',
      receiptLink: '',
      subCategory: '',
      fuelLiters: ''
    }

    console.log('\n📋 Dữ liệu test:', testTransaction)

    // Tạo FormData
    const formData = new FormData()
    Object.entries(testTransaction).forEach(([key, value]) => {
      formData.append(key, value)
    })

    console.log('\n🌐 Gửi request đến API...')

    // Gọi API
    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: formData,
    })

    console.log(`📊 Response status: ${response.status}`)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Giao dịch đã được thêm thành công!')
      console.log('📋 Response data:', JSON.stringify(result, null, 2))
      
      // Kiểm tra trong Google Sheets
      console.log('\n🔍 Kiểm tra trong Google Sheets...')
      await checkGoogleSheets()
      
    } else {
      const errorData = await response.json()
      console.log('❌ Lỗi khi thêm giao dịch:')
      console.log('📋 Error data:', JSON.stringify(errorData, null, 2))
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test:', error)
    throw error
  }
}

async function checkGoogleSheets() {
  try {
    const { google } = require('googleapis')
    const { JWT } = require('google-auth-library')

    // Khởi tạo Google APIs
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    const auth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID

    // Lấy dữ liệu từ Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values || []
    console.log(`📊 Google Sheets hiện có ${rows.length} hàng`)
    
    if (rows.length > 1) {
      console.log('📋 Giao dịch cuối cùng:')
      const lastRow = rows[rows.length - 1]
      console.log(`   Ngày: ${lastRow[0]}`)
      console.log(`   Danh mục: ${lastRow[1]}`)
      console.log(`   Mô tả: ${lastRow[2]}`)
      console.log(`   Số tiền: ${lastRow[3]}`)
      console.log(`   Loại: ${lastRow[4]}`)
      console.log(`   Thời gian: ${lastRow[6]}`)
    }

    // Test API GET để xem có lấy được dữ liệu không
    console.log('\n🔍 Test API GET transactions...')
    const getResponse = await fetch('http://localhost:3000/api/transactions?month=7&year=2025&forceRefresh=true')
    
    if (getResponse.ok) {
      const getData = await getResponse.json()
      console.log(`📊 API GET trả về ${getData.transactions?.length || 0} giao dịch`)
      
      if (getData.transactions?.length > 0) {
        console.log('📋 Giao dịch mới nhất từ API:')
        const latestTransaction = getData.transactions[getData.transactions.length - 1]
        console.log(`   ID: ${latestTransaction.id}`)
        console.log(`   Ngày: ${latestTransaction.date}`)
        console.log(`   Mô tả: ${latestTransaction.description}`)
        console.log(`   Số tiền: ${latestTransaction.amount}`)
      }
    } else {
      console.log(`❌ API GET lỗi: ${getResponse.status}`)
    }

  } catch (error) {
    console.log(`❌ Lỗi kiểm tra Google Sheets: ${error.message}`)
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testAddTransaction()
    .then(() => {
      console.log('\n✅ Test hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testAddTransaction }
