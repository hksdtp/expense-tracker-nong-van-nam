#!/usr/bin/env node

/**
 * Script debug để kiểm tra cấu trúc Google Sheets và vị trí dữ liệu
 */

const { google } = require('googleapis')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Transactions'

async function debugSheetsStructure() {
  console.log('🔍 DEBUG GOOGLE SHEETS STRUCTURE')
  console.log('=' .repeat(60))
  
  try {
    // Initialize Google APIs
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`)
    console.log(`📋 Sheet Name: ${SHEET_NAME}`)
    console.log()

    // 1. Kiểm tra metadata của spreadsheet
    console.log('🔍 1. KIỂM TRA METADATA SPREADSHEET')
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })
    
    const sheet = spreadsheetInfo.data.sheets?.find(s => s.properties?.title === SHEET_NAME)
    if (sheet) {
      console.log(`   ✅ Sheet "${SHEET_NAME}" tồn tại`)
      console.log(`   📏 Số cột: ${sheet.properties?.gridProperties?.columnCount || 'N/A'}`)
      console.log(`   📏 Số hàng: ${sheet.properties?.gridProperties?.rowCount || 'N/A'}`)
    } else {
      console.log(`   ❌ Sheet "${SHEET_NAME}" không tồn tại`)
      console.log('   📋 Các sheet có sẵn:')
      spreadsheetInfo.data.sheets?.forEach(s => {
        console.log(`      - ${s.properties?.title}`)
      })
    }

    // 2. Kiểm tra header row (hàng 1)
    console.log('\n🔍 2. KIỂM TRA HEADER ROW (HÀNG 1)')
    try {
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!1:1`,
      })
      
      if (headerResponse.data.values && headerResponse.data.values[0]) {
        const headers = headerResponse.data.values[0]
        console.log(`   📋 Số cột header: ${headers.length}`)
        console.log('   📝 Headers:')
        headers.forEach((header, index) => {
          const column = String.fromCharCode(65 + index) // A, B, C, ...
          console.log(`      ${column}: ${header}`)
        })
      } else {
        console.log('   ⚠️ Không có header row')
      }
    } catch (error) {
      console.log(`   ❌ Lỗi đọc header: ${error.message}`)
    }

    // 3. Kiểm tra dữ liệu trong các cột A-L
    console.log('\n🔍 3. KIỂM TRA DỮ LIỆU TRONG CÁC CỘT A-L')
    try {
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:L`,
      })
      
      if (dataResponse.data.values) {
        const rows = dataResponse.data.values
        console.log(`   📊 Tổng số hàng có dữ liệu: ${rows.length}`)
        
        if (rows.length > 1) {
          console.log('   📝 5 hàng dữ liệu đầu tiên:')
          for (let i = 1; i < Math.min(6, rows.length); i++) {
            const row = rows[i]
            console.log(`      Hàng ${i + 1}: [${row.join(' | ')}]`)
          }
          
          console.log('   📝 5 hàng dữ liệu cuối cùng:')
          for (let i = Math.max(1, rows.length - 5); i < rows.length; i++) {
            const row = rows[i]
            console.log(`      Hàng ${i + 1}: [${row.join(' | ')}]`)
          }
        } else {
          console.log('   ⚠️ Chỉ có header, không có dữ liệu')
        }
      } else {
        console.log('   ⚠️ Không có dữ liệu trong range A:L')
      }
    } catch (error) {
      console.log(`   ❌ Lỗi đọc dữ liệu A:L: ${error.message}`)
    }

    // 4. Kiểm tra dữ liệu trong các cột L trở đi (nơi có thể bị ghi nhầm)
    console.log('\n🔍 4. KIỂM TRA DỮ LIỆU TRONG CÁC CỘT L TRỞ ĐI')
    try {
      const wideDataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!L:Z`,
      })
      
      if (wideDataResponse.data.values) {
        const rows = wideDataResponse.data.values
        console.log(`   📊 Số hàng có dữ liệu từ cột L: ${rows.length}`)
        
        // Tìm hàng có dữ liệu không rỗng
        const nonEmptyRows = rows.filter(row => row.some(cell => cell && cell.trim()))
        
        if (nonEmptyRows.length > 0) {
          console.log(`   ⚠️ PHÁT HIỆN DỮ LIỆU TỪ CỘT L: ${nonEmptyRows.length} hàng`)
          console.log('   📝 Dữ liệu từ cột L:')
          nonEmptyRows.slice(0, 10).forEach((row, index) => {
            const actualRowIndex = rows.findIndex(r => r === row) + 1
            console.log(`      Hàng ${actualRowIndex}: [${row.join(' | ')}]`)
          })
        } else {
          console.log('   ✅ Không có dữ liệu từ cột L trở đi')
        }
      } else {
        console.log('   ✅ Không có dữ liệu từ cột L trở đi')
      }
    } catch (error) {
      console.log(`   ❌ Lỗi đọc dữ liệu L:Z: ${error.message}`)
    }

    // 5. Test thêm một giao dịch debug
    console.log('\n🔍 5. TEST THÊM GIAO DỊCH DEBUG')
    const testData = [
      '20/09/2025',
      'Debug Test',
      'Test debug sheets structure',
      '12345',
      'expense',
      '',
      new Date().toISOString(),
      'Debug Sub',
      '',
      'cash',
      'Debug note',
      ''
    ]

    console.log('   📋 Dữ liệu test sẽ thêm:')
    console.log(`      [${testData.join(' | ')}]`)

    try {
      const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:L`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [testData],
        },
      })

      console.log('   ✅ Thêm giao dịch debug thành công!')
      console.log(`   📍 Vị trí được ghi: ${appendResult.data.updates?.updatedRange}`)
      
      // Kiểm tra lại dữ liệu sau khi thêm
      console.log('\n🔍 6. KIỂM TRA LẠI SAU KHI THÊM')
      const afterAddResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:L`,
      })
      
      if (afterAddResponse.data.values) {
        const lastRow = afterAddResponse.data.values[afterAddResponse.data.values.length - 1]
        console.log(`   📝 Hàng cuối cùng: [${lastRow.join(' | ')}]`)
        
        // Kiểm tra xem có phải là dữ liệu test không
        if (lastRow.includes('Debug Test')) {
          console.log('   ✅ Dữ liệu debug được ghi đúng vào cột A-L')
        } else {
          console.log('   ❌ Dữ liệu debug không được tìm thấy trong A-L')
        }
      }

    } catch (error) {
      console.log(`   ❌ Lỗi thêm giao dịch debug: ${error.message}`)
    }

    console.log('\n' + '=' .repeat(60))
    console.log('🏁 DEBUG HOÀN THÀNH')

  } catch (error) {
    console.error('\n💥 LỖI DEBUG:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  debugSheetsStructure()
    .then(() => {
      console.log('\n✅ Debug script hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Debug script thất bại:', error)
      process.exit(1)
    })
}

module.exports = { debugSheetsStructure }
