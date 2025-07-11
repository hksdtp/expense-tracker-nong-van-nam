#!/usr/bin/env node

/**
 * Script để xóa toàn bộ dữ liệu chi tiêu trong Google Sheets
 * Chỉ giữ lại header row và xóa tất cả dữ liệu giao dịch
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

async function clearAllTransactionData() {
  console.log('🧹 Bắt đầu xóa toàn bộ dữ liệu chi tiêu...')
  
  try {
    // Khởi tạo Google APIs
    const { sheets } = await initGoogleAPIs()
    const SPREADSHEET_ID = await getSpreadsheetId()
    const SHEET_NAME = "Sheet1"

    console.log(`📊 Đang kết nối với Google Sheets: ${SPREADSHEET_ID}`)

    // Lấy thông tin về sheet hiện tại
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    console.log(`📋 Tìm thấy ${sheetInfo.data.sheets.length} sheet(s)`)

    // Tìm sheet cần xóa dữ liệu
    const targetSheet = sheetInfo.data.sheets.find(sheet => sheet.properties.title === SHEET_NAME)
    
    if (!targetSheet) {
      console.log(`❌ Không tìm thấy sheet "${SHEET_NAME}"`)
      return
    }

    console.log(`🎯 Tìm thấy sheet "${SHEET_NAME}" với ${targetSheet.properties.gridProperties.rowCount} hàng`)

    // Lấy dữ liệu hiện tại để kiểm tra
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    })

    const rows = currentData.data.values || []
    console.log(`📊 Hiện có ${rows.length} hàng dữ liệu (bao gồm header)`)

    if (rows.length <= 1) {
      console.log('✅ Sheet đã trống hoặc chỉ có header, không cần xóa gì')
      return
    }

    // Xóa tất cả dữ liệu từ hàng 2 trở đi (giữ lại header ở hàng 1)
    const rangeToDelete = `${SHEET_NAME}!A2:Z${targetSheet.properties.gridProperties.rowCount}`
    
    console.log(`🗑️ Đang xóa dữ liệu từ range: ${rangeToDelete}`)

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeToDelete,
    })

    console.log('✅ Đã xóa toàn bộ dữ liệu giao dịch thành công!')

    // Kiểm tra lại để xác nhận
    const verifyData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    })

    const remainingRows = verifyData.data.values || []
    console.log(`🔍 Kiểm tra: Còn lại ${remainingRows.length} hàng (chỉ header)`)

    // Đảm bảo header đúng format
    if (remainingRows.length === 0) {
      console.log('📝 Thêm lại header cho sheet...')
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
      console.log('✅ Đã thêm header thành công!')
    }

    console.log('🎉 Hoàn thành! Toàn bộ dữ liệu chi tiêu đã được xóa.')
    console.log('📊 Google Sheets hiện đã sạch và sẵn sàng cho dữ liệu mới.')

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error)
    
    if (error.message.includes('PERMISSION_DENIED')) {
      console.error('🔐 Lỗi quyền truy cập. Vui lòng kiểm tra:')
      console.error('   - Service account có quyền edit Google Sheets')
      console.error('   - GOOGLE_SHEETS_PRIVATE_KEY đã được cấu hình đúng')
      console.error('   - GOOGLE_SHEETS_CLIENT_EMAIL đã được cấu hình đúng')
    }
    
    if (error.message.includes('SPREADSHEET_NOT_FOUND')) {
      console.error('📋 Không tìm thấy Google Sheets. Vui lòng kiểm tra GOOGLE_SHEETS_SHEET_ID')
    }
    
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  clearAllTransactionData()
    .then(() => {
      console.log('✅ Script hoàn thành thành công!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script thất bại:', error)
      process.exit(1)
    })
}

module.exports = { clearAllTransactionData }
