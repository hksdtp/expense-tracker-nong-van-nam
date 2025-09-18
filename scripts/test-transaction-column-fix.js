#!/usr/bin/env node

/**
 * Script để test việc sửa lỗi ghi dữ liệu vào sai cột trong Google Sheets
 */

require('dotenv').config({ path: '.env.local' })

async function testTransactionColumnFix() {
  console.log('🔧 Test sửa lỗi ghi dữ liệu vào sai cột...')
  console.log('=' .repeat(60))
  
  try {
    // Bước 1: Kiểm tra cấu trúc header hiện tại
    console.log('\n📋 Bước 1: Kiểm tra cấu trúc header hiện tại')
    await checkCurrentHeader()
    
    // Bước 2: Thêm giao dịch test
    console.log('\n📋 Bước 2: Thêm giao dịch test')
    const testResult = await addTestTransaction()
    
    // Bước 3: Kiểm tra vị trí dữ liệu sau khi thêm
    console.log('\n📋 Bước 3: Kiểm tra vị trí dữ liệu sau khi thêm')
    await checkDataPosition()
    
    // Bước 4: Xác minh dữ liệu được ghi đúng cột
    console.log('\n📋 Bước 4: Xác minh dữ liệu được ghi đúng cột')
    await verifyDataMapping()
    
    console.log('\n✅ Test hoàn thành!')
    
  } catch (error) {
    console.error('\n❌ Test thất bại:', error)
    throw error
  }
}

async function checkCurrentHeader() {
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

    // Lấy header row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:L1',
    })

    const headerRow = response.data.values?.[0] || []
    console.log(`   📊 Header có ${headerRow.length} cột`)
    console.log('   📋 Header hiện tại:')
    headerRow.forEach((header, index) => {
      const column = String.fromCharCode(65 + index) // A, B, C, ...
      console.log(`      ${column}: ${header}`)
    })

    // Kiểm tra xem header có đầy đủ 12 cột không
    const expectedHeaders = [
      "Ngày", "Danh mục", "Mô tả", "Số tiền", "Loại", 
      "Link hóa đơn", "Thời gian", "Danh mục phụ", "Số lượng", 
      "Phương thức thanh toán", "Ghi chú", "URL ảnh"
    ]
    
    if (headerRow.length !== expectedHeaders.length) {
      console.log(`   ⚠️ Header không đầy đủ! Cần ${expectedHeaders.length} cột, hiện có ${headerRow.length} cột`)
    } else {
      console.log('   ✅ Header có đầy đủ 12 cột')
    }

  } catch (error) {
    console.log(`   ❌ Lỗi kiểm tra header: ${error.message}`)
  }
}

async function addTestTransaction() {
  try {
    // Tạo dữ liệu test
    const testTransaction = {
      type: 'expense',
      category: 'Test Category',
      description: 'Test transaction - Column Fix',
      amount: '25000',
      paymentMethod: 'transfer',
      date: '15/07/2025',
      note: 'Test để kiểm tra vị trí cột',
      receiptLink: '',
      subCategory: 'Test Sub',
      fuelLiters: ''
    }

    console.log('   📋 Dữ liệu test:', testTransaction)

    // Tạo FormData
    const formData = new FormData()
    Object.entries(testTransaction).forEach(([key, value]) => {
      formData.append(key, value)
    })

    console.log('   🌐 Gửi request đến API...')

    // Gọi API
    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: formData,
    })

    console.log(`   📊 Response status: ${response.status}`)

    if (response.ok) {
      const result = await response.json()
      console.log('   ✅ Giao dịch đã được thêm thành công!')
      return result
    } else {
      const errorData = await response.json()
      console.log('   ❌ Lỗi khi thêm giao dịch:', errorData)
      throw new Error(errorData.error || 'Unknown error')
    }

  } catch (error) {
    console.log(`   ❌ Lỗi trong addTestTransaction: ${error.message}`)
    throw error
  }
}

async function checkDataPosition() {
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

    // Lấy tất cả dữ liệu
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values || []
    console.log(`   📊 Tổng số hàng: ${rows.length}`)
    
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1]
      console.log('   📋 Hàng cuối cùng (giao dịch vừa thêm):')
      lastRow.forEach((cell, index) => {
        const column = String.fromCharCode(65 + index) // A, B, C, ...
        console.log(`      ${column}: ${cell || '(trống)'}`)
      })
      
      // Kiểm tra xem có dữ liệu ở cột L không
      if (lastRow[11]) { // Index 11 = cột L
        console.log('   ⚠️ Có dữ liệu ở cột L - cần kiểm tra!')
      }
      
      // Kiểm tra xem dữ liệu có bắt đầu từ cột A không
      if (lastRow[0]) { // Index 0 = cột A
        console.log('   ✅ Dữ liệu bắt đầu từ cột A - ĐÚNG!')
      } else {
        console.log('   ❌ Không có dữ liệu ở cột A - SAI!')
      }
    }

  } catch (error) {
    console.log(`   ❌ Lỗi kiểm tra vị trí dữ liệu: ${error.message}`)
  }
}

async function verifyDataMapping() {
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

    // Lấy header và dữ liệu
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values || []
    
    if (rows.length > 1) {
      const headers = rows[0]
      const lastRow = rows[rows.length - 1]
      
      console.log('   📋 Mapping dữ liệu:')
      headers.forEach((header, index) => {
        const column = String.fromCharCode(65 + index)
        const value = lastRow[index] || '(trống)'
        console.log(`      ${column} (${header}): ${value}`)
      })
      
      // Kiểm tra các trường quan trọng
      const checks = [
        { name: 'Ngày', index: 0, expected: '15/07/2025' },
        { name: 'Danh mục', index: 1, expected: 'Test Category' },
        { name: 'Mô tả', index: 2, expected: 'Test transaction - Column Fix' },
        { name: 'Số tiền', index: 3, expected: '25000' },
        { name: 'Loại', index: 4, expected: 'expense' }
      ]
      
      console.log('\n   🔍 Kiểm tra mapping:')
      let allCorrect = true
      checks.forEach(check => {
        const actual = lastRow[check.index]
        const isCorrect = actual == check.expected
        console.log(`      ${check.name}: ${isCorrect ? '✅' : '❌'} (${actual} ${isCorrect ? '==' : '!='} ${check.expected})`)
        if (!isCorrect) allCorrect = false
      })
      
      if (allCorrect) {
        console.log('\n   ✅ Tất cả dữ liệu được mapping đúng cột!')
      } else {
        console.log('\n   ❌ Có dữ liệu bị mapping sai cột!')
      }
    }

  } catch (error) {
    console.log(`   ❌ Lỗi xác minh mapping: ${error.message}`)
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testTransactionColumnFix()
    .then(() => {
      console.log('\n🎉 Test column fix hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test column fix thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testTransactionColumnFix }
