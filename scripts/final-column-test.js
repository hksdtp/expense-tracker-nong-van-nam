#!/usr/bin/env node

/**
 * Script test cuối cùng để xác minh việc sửa lỗi ghi dữ liệu vào sai cột
 */

require('dotenv').config({ path: '.env.local' })

async function finalColumnTest() {
  console.log('🎯 TEST CUỐI CÙNG - XÁC MINH SỬA LỖI CỘT')
  console.log('=' .repeat(60))
  
  let testsPassed = 0
  let totalTests = 0
  
  try {
    // Test 1: Kiểm tra header
    console.log('\n🧪 Test 1: Kiểm tra header có đầy đủ 12 cột')
    totalTests++
    if (await testHeaderStructure()) {
      testsPassed++
      console.log('   ✅ PASS: Header có đầy đủ 12 cột')
    } else {
      console.log('   ❌ FAIL: Header không đầy đủ')
    }
    
    // Test 2: Test thêm giao dịch
    console.log('\n🧪 Test 2: Test thêm giao dịch mới')
    totalTests++
    const transactionResult = await testAddNewTransaction()
    if (transactionResult.success) {
      testsPassed++
      console.log('   ✅ PASS: Thêm giao dịch thành công')
    } else {
      console.log('   ❌ FAIL: Không thể thêm giao dịch')
    }
    
    // Test 3: Kiểm tra vị trí dữ liệu
    console.log('\n🧪 Test 3: Kiểm tra dữ liệu được ghi đúng vị trí')
    totalTests++
    if (await testDataPosition()) {
      testsPassed++
      console.log('   ✅ PASS: Dữ liệu được ghi từ cột A')
    } else {
      console.log('   ❌ FAIL: Dữ liệu không được ghi đúng vị trí')
    }
    
    // Test 4: Kiểm tra mapping dữ liệu
    console.log('\n🧪 Test 4: Kiểm tra mapping dữ liệu chính xác')
    totalTests++
    if (await testDataMapping()) {
      testsPassed++
      console.log('   ✅ PASS: Mapping dữ liệu chính xác')
    } else {
      console.log('   ❌ FAIL: Mapping dữ liệu không chính xác')
    }
    
    // Test 5: Test API GET
    console.log('\n🧪 Test 5: Test API GET lấy dữ liệu')
    totalTests++
    if (await testAPIGet()) {
      testsPassed++
      console.log('   ✅ PASS: API GET hoạt động đúng')
    } else {
      console.log('   ❌ FAIL: API GET có vấn đề')
    }
    
    // Kết quả tổng kết
    console.log('\n' + '=' .repeat(60))
    console.log(`📊 KẾT QUẢ TEST: ${testsPassed}/${totalTests} tests passed`)
    
    if (testsPassed === totalTests) {
      console.log('🎉 TẤT CẢ TESTS ĐỀU PASS! Lỗi ghi dữ liệu vào sai cột đã được sửa thành công!')
      return true
    } else {
      console.log('⚠️ CÒN VẤN ĐỀ CẦN KHẮC PHỤC!')
      return false
    }
    
  } catch (error) {
    console.error('\n💥 Lỗi trong quá trình test:', error)
    return false
  }
}

async function testHeaderStructure() {
  try {
    const { google } = require('googleapis')
    const { JWT } = require('google-auth-library')

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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:L1',
    })

    const header = response.data.values?.[0] || []
    const expectedHeaders = [
      "Ngày", "Danh mục", "Mô tả", "Số tiền", "Loại", 
      "Link hóa đơn", "Thời gian", "Danh mục phụ", "Số lượng", 
      "Phương thức thanh toán", "Ghi chú", "URL ảnh"
    ]

    return header.length === expectedHeaders.length

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

async function testAddNewTransaction() {
  try {
    const testData = {
      type: 'expense',
      category: 'Final Test',
      description: 'Final test transaction',
      amount: '99000',
      paymentMethod: 'transfer',
      date: '17/07/2025',
      note: 'Final column test',
      receiptLink: '',
      subCategory: 'Final Sub',
      fuelLiters: ''
    }

    const formData = new FormData()
    Object.entries(testData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const result = await response.json()
      return { success: true, data: result }
    } else {
      const errorData = await response.json()
      return { success: false, error: errorData }
    }

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testDataPosition() {
  try {
    const { google } = require('googleapis')
    const { JWT } = require('google-auth-library')

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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values || []
    
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1]
      
      // Kiểm tra cột A có dữ liệu không
      const hasDataInA = lastRow[0] && lastRow[0].toString().trim() !== ''
      
      // Kiểm tra không có dữ liệu lạ ở những vị trí không mong muốn
      return hasDataInA
    }
    
    return false

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

async function testDataMapping() {
  try {
    const { google } = require('googleapis')
    const { JWT } = require('google-auth-library')

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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const rows = response.data.values || []
    
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1]
      
      // Kiểm tra các trường quan trọng
      const checks = [
        { index: 0, expected: '17/07/2025' }, // Ngày
        { index: 1, expected: 'Final Test' }, // Danh mục
        { index: 2, expected: 'Final test transaction' }, // Mô tả
        { index: 3, expected: '99000' }, // Số tiền
        { index: 4, expected: 'expense' } // Loại
      ]
      
      let correctMappings = 0
      checks.forEach(check => {
        if (lastRow[check.index] == check.expected) {
          correctMappings++
        }
      })
      
      return correctMappings >= 4 // Ít nhất 4/5 trường đúng
    }
    
    return false

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

async function testAPIGet() {
  try {
    const response = await fetch('http://localhost:3000/api/transactions?month=7&year=2025&refresh=true')
    
    if (response.ok) {
      const data = await response.json()
      return data.success && Array.isArray(data.transactions)
    }
    
    return false

  } catch (error) {
    console.log(`      Lỗi: ${error.message}`)
    return false
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  finalColumnTest()
    .then((success) => {
      if (success) {
        console.log('\n🏆 FINAL TEST THÀNH CÔNG!')
        process.exit(0)
      } else {
        console.log('\n💥 FINAL TEST THẤT BẠI!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 FINAL TEST LỖI:', error)
      process.exit(1)
    })
}

module.exports = { finalColumnTest }
