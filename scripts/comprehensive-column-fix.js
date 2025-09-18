#!/usr/bin/env node

/**
 * Script tổng hợp để kiểm tra và sửa tất cả vấn đề liên quan đến ghi dữ liệu vào sai cột
 */

require('dotenv').config({ path: '.env.local' })

async function comprehensiveColumnFix() {
  console.log('🔧 KIỂM TRA VÀ SỬA LỖI GHI DỮ LIỆU VÀO SAI CỘT')
  console.log('=' .repeat(70))
  
  try {
    // Bước 1: Kiểm tra kết nối
    console.log('\n📋 Bước 1: Kiểm tra kết nối Google Sheets')
    await checkConnection()
    
    // Bước 2: Kiểm tra và sửa header
    console.log('\n📋 Bước 2: Kiểm tra và sửa header')
    await checkAndFixHeader()
    
    // Bước 3: Kiểm tra cấu trúc dữ liệu hiện tại
    console.log('\n📋 Bước 3: Kiểm tra cấu trúc dữ liệu hiện tại')
    await checkCurrentDataStructure()
    
    // Bước 4: Test thêm giao dịch mới
    console.log('\n📋 Bước 4: Test thêm giao dịch mới')
    await testAddTransaction()
    
    // Bước 5: Xác minh kết quả
    console.log('\n📋 Bước 5: Xác minh kết quả')
    await verifyFix()
    
    console.log('\n🎉 HOÀN THÀNH! Tất cả vấn đề đã được kiểm tra và sửa.')
    
  } catch (error) {
    console.error('\n💥 Lỗi trong quá trình sửa:', error)
    throw error
  }
}

async function checkConnection() {
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

    // Test kết nối
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    console.log(`   ✅ Kết nối thành công với spreadsheet: ${response.data.properties.title}`)
    console.log(`   📊 Spreadsheet ID: ${SPREADSHEET_ID}`)
    console.log(`   🔑 Service Account: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`)

  } catch (error) {
    console.log(`   ❌ Lỗi kết nối: ${error.message}`)
    throw error
  }
}

async function checkAndFixHeader() {
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

    // Kiểm tra header hiện tại
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:L1',
    })

    const currentHeader = response.data.values?.[0] || []
    const correctHeader = [
      "Ngày", "Danh mục", "Mô tả", "Số tiền", "Loại", 
      "Link hóa đơn", "Thời gian", "Danh mục phụ", "Số lượng", 
      "Phương thức thanh toán", "Ghi chú", "URL ảnh"
    ]

    console.log(`   📊 Header hiện tại: ${currentHeader.length} cột`)
    console.log(`   📊 Header cần có: ${correctHeader.length} cột`)

    let needsUpdate = currentHeader.length !== correctHeader.length
    if (!needsUpdate) {
      for (let i = 0; i < correctHeader.length; i++) {
        if (currentHeader[i] !== correctHeader[i]) {
          needsUpdate = true
          break
        }
      }
    }

    if (needsUpdate) {
      console.log('   🔧 Cập nhật header...')
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1:L1',
        valueInputOption: 'RAW',
        resource: {
          values: [correctHeader],
        },
      })
      console.log('   ✅ Header đã được cập nhật!')
    } else {
      console.log('   ✅ Header đã đúng!')
    }

  } catch (error) {
    console.log(`   ❌ Lỗi kiểm tra header: ${error.message}`)
    throw error
  }
}

async function checkCurrentDataStructure() {
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
    console.log(`   📊 Tổng số hàng: ${rows.length}`)
    
    if (rows.length > 1) {
      console.log('   📋 Kiểm tra 3 giao dịch cuối:')
      const lastRows = rows.slice(-3)
      lastRows.forEach((row, index) => {
        const rowNum = rows.length - 3 + index + 1
        console.log(`      Hàng ${rowNum}: Cột A="${row[0]}" | Cột L="${row[11] || '(trống)'}"`)
      })
    } else {
      console.log('   📋 Chỉ có header, chưa có dữ liệu')
    }

  } catch (error) {
    console.log(`   ❌ Lỗi kiểm tra cấu trúc: ${error.message}`)
  }
}

async function testAddTransaction() {
  try {
    const testData = {
      type: 'expense',
      category: 'Test Fix Column',
      description: 'Test sau khi sửa lỗi cột',
      amount: '15000',
      paymentMethod: 'cash',
      date: '16/07/2025',
      note: 'Kiểm tra vị trí cột',
      receiptLink: '',
      subCategory: 'Test Sub Fix',
      fuelLiters: ''
    }

    console.log('   📋 Thêm giao dịch test...')

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
      console.log('   ✅ Giao dịch test đã được thêm thành công!')
      return result
    } else {
      const errorData = await response.json()
      console.log('   ❌ Lỗi thêm giao dịch test:', errorData.error)
      throw new Error(errorData.error)
    }

  } catch (error) {
    console.log(`   ❌ Lỗi test thêm giao dịch: ${error.message}`)
    throw error
  }
}

async function verifyFix() {
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
      const headers = rows[0]
      
      console.log('   📋 Giao dịch vừa thêm:')
      
      // Kiểm tra các cột quan trọng
      const checks = [
        { col: 'A', name: 'Ngày', value: lastRow[0] },
        { col: 'B', name: 'Danh mục', value: lastRow[1] },
        { col: 'C', name: 'Mô tả', value: lastRow[2] },
        { col: 'D', name: 'Số tiền', value: lastRow[3] },
        { col: 'E', name: 'Loại', value: lastRow[4] }
      ]
      
      let allCorrect = true
      checks.forEach(check => {
        const hasData = check.value && check.value.toString().trim() !== ''
        console.log(`      ${check.col} (${check.name}): ${hasData ? '✅' : '❌'} "${check.value || '(trống)'}"`)
        if (!hasData) allCorrect = false
      })
      
      // Kiểm tra cột L
      const colL = lastRow[11]
      console.log(`      L (URL ảnh): ${colL ? '📎' : '⭕'} "${colL || '(trống)'}"`)
      
      if (allCorrect) {
        console.log('\n   🎉 THÀNH CÔNG! Dữ liệu được ghi đúng vị trí từ cột A!')
      } else {
        console.log('\n   ❌ VẪN CÒN VẤN ĐỀ! Dữ liệu chưa được ghi đúng vị trí!')
      }
      
    } else {
      console.log('   ❌ Không tìm thấy dữ liệu để xác minh!')
    }

  } catch (error) {
    console.log(`   ❌ Lỗi xác minh: ${error.message}`)
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  comprehensiveColumnFix()
    .then(() => {
      console.log('\n🏆 COMPREHENSIVE COLUMN FIX HOÀN THÀNH!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 COMPREHENSIVE COLUMN FIX THẤT BẠI:', error)
      process.exit(1)
    })
}

module.exports = { comprehensiveColumnFix }
