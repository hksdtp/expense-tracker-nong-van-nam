#!/usr/bin/env node

/**
 * Script phân tích toàn diện cấu trúc Google Sheets
 * Khám phá sheet "Nhật ký" và đánh giá khả năng migration
 */

require('dotenv').config({ path: '.env.local' })

// Import Google APIs directly
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

async function analyzeSheetStructure() {
  console.log('🔍 PHÂN TÍCH TOÀN DIỆN CẤU TRÚC GOOGLE SHEETS')
  console.log('=' .repeat(60))

  try {
    // Khởi tạo Google APIs
    console.log('\n📋 Bước 1: Khởi tạo Google APIs')
    const { sheets } = await initGoogleAPIs()
    const spreadsheetId = SPREADSHEET_ID
    
    console.log(`   📊 Spreadsheet ID: ${spreadsheetId}`)
    console.log(`   🔑 Service Account: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`)

    // Lấy thông tin spreadsheet và danh sách sheets
    console.log('\n📋 Bước 2: Liệt kê tất cả sheets trong spreadsheet')
    
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const allSheets = spreadsheetInfo.data.sheets || []
    console.log(`   📊 Tổng số sheets: ${allSheets.length}`)
    
    allSheets.forEach((sheet, index) => {
      const sheetName = sheet.properties.title
      const sheetId = sheet.properties.sheetId
      const rowCount = sheet.properties.gridProperties?.rowCount || 0
      const columnCount = sheet.properties.gridProperties?.columnCount || 0
      
      console.log(`   ${index + 1}. "${sheetName}" (ID: ${sheetId}) - ${rowCount}x${columnCount}`)
    })

    // Kiểm tra sheet "Nhật ký" có tồn tại không
    const nhatKySheet = allSheets.find(sheet => 
      sheet.properties.title === 'Nhật ký' || 
      sheet.properties.title === 'Nhat ky' ||
      sheet.properties.title.toLowerCase().includes('nhật ký') ||
      sheet.properties.title.toLowerCase().includes('nhat ky')
    )

    if (!nhatKySheet) {
      console.log('\n❌ KHÔNG TÌM THẤY SHEET "NHẬT KÝ"')
      console.log('   💡 Các sheet có sẵn:')
      allSheets.forEach(sheet => {
        console.log(`      - "${sheet.properties.title}"`)
      })
      return { hasNhatKySheet: false, allSheets }
    }

    const nhatKySheetName = nhatKySheet.properties.title
    console.log(`\n✅ TÌM THẤY SHEET: "${nhatKySheetName}"`)
    console.log(`   📊 Sheet ID: ${nhatKySheet.properties.sheetId}`)
    console.log(`   📐 Kích thước: ${nhatKySheet.properties.gridProperties?.rowCount}x${nhatKySheet.properties.gridProperties?.columnCount}`)

    // Đếm số rows có dữ liệu trong sheet "Nhật ký"
    console.log('\n📋 Bước 3: Đếm số rows có dữ liệu trong sheet "Nhật ký"')
    
    try {
      const dataRange = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${nhatKySheetName}!A:Z`, // Lấy tất cả dữ liệu
      })

      const rows = dataRange.data.values || []
      const nonEmptyRows = rows.filter(row => row && row.some(cell => cell && cell.toString().trim() !== ''))
      
      console.log(`   📊 Tổng số rows: ${rows.length}`)
      console.log(`   📊 Rows có dữ liệu: ${nonEmptyRows.length}`)
      console.log(`   📊 Rows trống: ${rows.length - nonEmptyRows.length}`)

      return {
        hasNhatKySheet: true,
        nhatKySheetName,
        nhatKySheet,
        allSheets,
        totalRows: rows.length,
        dataRows: nonEmptyRows.length,
        rawData: rows
      }

    } catch (dataError) {
      console.log(`   ❌ Lỗi đọc dữ liệu: ${dataError.message}`)
      return {
        hasNhatKySheet: true,
        nhatKySheetName,
        nhatKySheet,
        allSheets,
        error: dataError.message
      }
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình phân tích:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  analyzeSheetStructure()
    .then((result) => {
      console.log('\n✅ Phân tích hoàn thành!')
      if (result.hasNhatKySheet) {
        console.log(`📊 Sheet "${result.nhatKySheetName}" sẵn sàng để phân tích chi tiết`)
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Phân tích thất bại:', error)
      process.exit(1)
    })
}

module.exports = { analyzeSheetStructure }
