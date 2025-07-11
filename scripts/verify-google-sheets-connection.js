#!/usr/bin/env node

/**
 * Script để kiểm tra kết nối Google Sheets và xác minh dữ liệu
 */

// Import trực tiếp từ googleapis và google-auth-library
const { google } = require('googleapis')
const { JWT } = require('google-auth-library')
require('dotenv').config({ path: '.env.local' })

// Khởi tạo Google APIs
async function initGoogleAPIs() {
  try {
    console.log("Khởi tạo Google APIs...")

    // Lấy private key từ env và format đúng
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY
    if (!privateKey) {
      throw new Error('GOOGLE_SHEETS_PRIVATE_KEY không được cấu hình')
    }

    // Clean và format private key đúng cách
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    // Đảm bảo private key có format đúng
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format')
    }

    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL
    if (!clientEmail) {
      throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL không được cấu hình')
    }

    // Tạo JWT client
    const auth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const drive = google.drive({ version: "v3", auth })

    return { auth, sheets, drive }
  } catch (error) {
    console.error("Lỗi khởi tạo Google APIs:", error)
    throw error
  }
}

async function getSpreadsheetId() {
  return process.env.GOOGLE_SHEETS_SHEET_ID || "14_Y-DsQvndhsFHrwb0W12guk36zqtzUnMA5tz9jw1D4"
}

async function verifyGoogleSheetsConnection() {
  console.log('🔍 Kiểm tra kết nối Google Sheets...')
  
  try {
    // Kiểm tra biến môi trường
    console.log('📋 Kiểm tra biến môi trường...')
    
    const requiredEnvVars = [
      'GOOGLE_SHEETS_PRIVATE_KEY',
      'GOOGLE_SHEETS_CLIENT_EMAIL', 
      'GOOGLE_SHEETS_SHEET_ID',
      'GOOGLE_SHEETS_SHEET_NAME'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('❌ Thiếu các biến môi trường:')
      missingVars.forEach(varName => console.error(`   - ${varName}`))
      throw new Error('Thiếu biến môi trường cần thiết')
    }
    
    console.log('✅ Tất cả biến môi trường đã được cấu hình')

    // Khởi tạo Google APIs
    console.log('🔗 Đang kết nối với Google APIs...')
    const { sheets } = await initGoogleAPIs()
    const SPREADSHEET_ID = await getSpreadsheetId()
    const SHEET_NAME = "Sheet1"

    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`)
    console.log(`📋 Sheet Name: ${SHEET_NAME}`)

    // Kiểm tra quyền truy cập spreadsheet
    console.log('🔐 Kiểm tra quyền truy cập...')
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    console.log(`✅ Kết nối thành công! Spreadsheet: "${sheetInfo.data.properties.title}"`)
    console.log(`📊 Tìm thấy ${sheetInfo.data.sheets.length} sheet(s):`)
    
    sheetInfo.data.sheets.forEach(sheet => {
      console.log(`   - ${sheet.properties.title} (${sheet.properties.gridProperties.rowCount} hàng, ${sheet.properties.gridProperties.columnCount} cột)`)
    })

    // Kiểm tra sheet cụ thể
    const targetSheet = sheetInfo.data.sheets.find(sheet => sheet.properties.title === SHEET_NAME)
    
    if (!targetSheet) {
      console.log(`⚠️ Không tìm thấy sheet "${SHEET_NAME}". Tạo sheet mới...`)
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: SHEET_NAME,
              },
            },
          }],
        },
      })
      
      console.log(`✅ Đã tạo sheet "${SHEET_NAME}" thành công`)
    }

    // Lấy dữ liệu hiện tại
    console.log('📊 Đang lấy dữ liệu hiện tại...')
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
    })

    const rows = response.data.values || []
    console.log(`📋 Tìm thấy ${rows.length} hàng dữ liệu`)

    if (rows.length === 0) {
      console.log('📝 Sheet trống, thêm header...')
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:L1`,
        valueInputOption: "RAW",
        resource: {
          values: [[
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
          ]],
        },
      })
      console.log('✅ Đã thêm header thành công')
    } else {
      console.log('📊 Header hiện tại:', rows[0])
      console.log(`💰 Số giao dịch: ${rows.length - 1}`)
      
      if (rows.length > 1) {
        console.log('📋 Giao dịch mẫu (5 giao dịch đầu):')
        rows.slice(1, 6).forEach((row, index) => {
          console.log(`   ${index + 1}. ${row[0]} - ${row[1]} - ${row[2]} - ${row[3]}`)
        })
      }
    }

    // Test API endpoint
    console.log('🧪 Kiểm tra API endpoint...')
    try {
      const apiResponse = await fetch('http://localhost:3000/api/transactions?month=7&year=2025')
      if (apiResponse.ok) {
        const apiData = await apiResponse.json()
        console.log(`✅ API hoạt động bình thường. Trả về ${apiData.transactions?.length || 0} giao dịch`)
      } else {
        console.log(`⚠️ API trả về status: ${apiResponse.status}`)
      }
    } catch (apiError) {
      console.log('⚠️ Không thể kiểm tra API (server có thể chưa chạy)')
    }

    console.log('🎉 Tất cả kiểm tra đã hoàn thành!')
    console.log('📊 Google Sheets đã sẵn sàng làm nguồn dữ liệu chính')

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error)
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.error('🔐 Lỗi quyền truy cập. Hướng dẫn khắc phục:')
      console.error('   1. Kiểm tra service account có quyền edit Google Sheets')
      console.error('   2. Chia sẻ Google Sheets với email service account')
      console.error('   3. Kiểm tra GOOGLE_SHEETS_PRIVATE_KEY và CLIENT_EMAIL')
    }
    
    if (error.message.includes('SPREADSHEET_NOT_FOUND')) {
      console.error('📋 Không tìm thấy Google Sheets. Hướng dẫn khắc phục:')
      console.error('   1. Kiểm tra GOOGLE_SHEETS_SHEET_ID có đúng không')
      console.error('   2. Đảm bảo Google Sheets tồn tại và có thể truy cập')
    }
    
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  verifyGoogleSheetsConnection()
    .then(() => {
      console.log('✅ Kiểm tra hoàn thành!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Kiểm tra thất bại:', error)
      process.exit(1)
    })
}

module.exports = { verifyGoogleSheetsConnection }
