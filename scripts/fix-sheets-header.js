#!/usr/bin/env node

/**
 * Script để sửa header của Google Sheets đảm bảo có đầy đủ 12 cột
 */

require('dotenv').config({ path: '.env.local' })

async function fixSheetsHeader() {
  console.log('🔧 Sửa header Google Sheets...')
  console.log('=' .repeat(50))
  
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

    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`)

    // Bước 1: Kiểm tra header hiện tại
    console.log('\n📋 Bước 1: Kiểm tra header hiện tại')
    const currentResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:L1',
    })

    const currentHeader = currentResponse.data.values?.[0] || []
    console.log(`   📊 Header hiện tại có ${currentHeader.length} cột:`)
    currentHeader.forEach((header, index) => {
      const column = String.fromCharCode(65 + index)
      console.log(`      ${column}: ${header}`)
    })

    // Bước 2: Định nghĩa header đúng
    const correctHeader = [
      "Ngày", 
      "Danh mục", 
      "Mô tả", 
      "Số tiền", 
      "Loại", 
      "Link hóa đơn", 
      "Thời gian", 
      "Danh mục phụ", 
      "Số lượng", 
      "Phương thức thanh toán", 
      "Ghi chú", 
      "URL ảnh"
    ]

    console.log('\n📋 Bước 2: Header đúng cần có:')
    correctHeader.forEach((header, index) => {
      const column = String.fromCharCode(65 + index)
      console.log(`      ${column}: ${header}`)
    })

    // Bước 3: So sánh và quyết định có cần update không
    let needsUpdate = false
    if (currentHeader.length !== correctHeader.length) {
      console.log(`\n⚠️ Số cột không khớp: hiện tại ${currentHeader.length}, cần ${correctHeader.length}`)
      needsUpdate = true
    } else {
      for (let i = 0; i < correctHeader.length; i++) {
        if (currentHeader[i] !== correctHeader[i]) {
          console.log(`\n⚠️ Cột ${String.fromCharCode(65 + i)} không khớp: "${currentHeader[i]}" != "${correctHeader[i]}"`)
          needsUpdate = true
          break
        }
      }
    }

    if (!needsUpdate) {
      console.log('\n✅ Header đã đúng, không cần cập nhật!')
      return
    }

    // Bước 4: Cập nhật header
    console.log('\n📋 Bước 4: Cập nhật header...')
    
    const updateResult = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:L1',
      valueInputOption: 'RAW',
      resource: {
        values: [correctHeader],
      },
    })

    console.log('   ✅ Header đã được cập nhật thành công!')
    console.log(`   📊 Đã cập nhật ${updateResult.data.updatedCells} ô`)

    // Bước 5: Xác minh lại
    console.log('\n📋 Bước 5: Xác minh header sau khi cập nhật')
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:L1',
    })

    const newHeader = verifyResponse.data.values?.[0] || []
    console.log(`   📊 Header mới có ${newHeader.length} cột:`)
    newHeader.forEach((header, index) => {
      const column = String.fromCharCode(65 + index)
      const isCorrect = header === correctHeader[index]
      console.log(`      ${column}: ${header} ${isCorrect ? '✅' : '❌'}`)
    })

    console.log('\n✅ Sửa header hoàn thành!')

  } catch (error) {
    console.error('\n❌ Lỗi khi sửa header:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  fixSheetsHeader()
    .then(() => {
      console.log('\n🎉 Fix header hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Fix header thất bại:', error)
      process.exit(1)
    })
}

module.exports = { fixSheetsHeader }
