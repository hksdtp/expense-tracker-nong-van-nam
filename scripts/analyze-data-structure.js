#!/usr/bin/env node

/**
 * Script phân tích cấu trúc dữ liệu chi tiết của sheet "Nhật ký"
 * So sánh với cấu trúc Sheet1 hiện tại
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

// Cấu trúc hiện tại của Sheet1
const SHEET1_STRUCTURE = [
  'Ngày',           // A - Date
  'Danh mục',       // B - Category  
  'Mô tả',          // C - Description
  'Số tiền',        // D - Amount
  'Loại',           // E - Type (income/expense)
  'Danh mục phụ',   // F - Sub category
  'Lít xăng',       // G - Fuel liters
  'Phương thức thanh toán', // H - Payment method
  'Ghi chú',        // I - Note
  'Tài khoản',      // J - Account
  'Số dư',          // K - Balance
  'Link biên lai'   // L - Receipt link
]

async function analyzeDataStructure() {
  console.log('🔍 PHÂN TÍCH CẤU TRÚC DỮ LIỆU CHI TIẾT')
  console.log('=' .repeat(60))

  try {
    const { sheets } = await initGoogleAPIs()

    // Phân tích cấu trúc Sheet1 hiện tại
    console.log('\n📋 Bước 1: Phân tích cấu trúc Sheet1 hiện tại')
    console.log('   📊 Cấu trúc cột Sheet1:')
    SHEET1_STRUCTURE.forEach((col, index) => {
      const letter = String.fromCharCode(65 + index) // A, B, C, ...
      console.log(`      ${letter}. ${col}`)
    })

    // Đọc headers của sheet "Nhật ký"
    console.log('\n📋 Bước 2: Đọc headers của sheet "Nhật ký"')
    
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Nhật ký!1:1', // Row đầu tiên chứa headers
    })

    const nhatKyHeaders = headersResponse.data.values?.[0] || []
    console.log(`   📊 Số cột trong "Nhật ký": ${nhatKyHeaders.length}`)
    console.log('   📊 Headers "Nhật ký":')
    nhatKyHeaders.forEach((header, index) => {
      const letter = String.fromCharCode(65 + index)
      console.log(`      ${letter}. "${header}"`)
    })

    // So sánh cấu trúc
    console.log('\n📋 Bước 3: So sánh cấu trúc cột')
    console.log('   📊 Mapping giữa Sheet1 và Nhật ký:')
    
    const mapping = []
    SHEET1_STRUCTURE.forEach((sheet1Col, index) => {
      const sheet1Letter = String.fromCharCode(65 + index)
      
      // Tìm cột tương ứng trong Nhật ký
      const matchIndex = nhatKyHeaders.findIndex(nhatKyCol => {
        const normalized1 = sheet1Col.toLowerCase().trim()
        const normalized2 = nhatKyCol.toLowerCase().trim()
        
        // Exact match
        if (normalized1 === normalized2) return true
        
        // Partial matches
        if (normalized1.includes('ngày') && normalized2.includes('ngày')) return true
        if (normalized1.includes('danh mục') && normalized2.includes('danh mục') && !normalized1.includes('phụ') && !normalized2.includes('phụ')) return true
        if (normalized1.includes('mô tả') && normalized2.includes('mô tả')) return true
        if (normalized1.includes('số tiền') && normalized2.includes('tiền')) return true
        if (normalized1.includes('loại') && normalized2.includes('loại')) return true
        if (normalized1.includes('danh mục phụ') && normalized2.includes('phụ')) return true
        if (normalized1.includes('xăng') && normalized2.includes('xăng')) return true
        if (normalized1.includes('thanh toán') && normalized2.includes('thanh toán')) return true
        if (normalized1.includes('ghi chú') && normalized2.includes('ghi chú')) return true
        if (normalized1.includes('tài khoản') && normalized2.includes('tài khoản')) return true
        if (normalized1.includes('số dư') && normalized2.includes('dư')) return true
        if (normalized1.includes('biên lai') && normalized2.includes('biên lai')) return true
        
        return false
      })
      
      if (matchIndex !== -1) {
        const nhatKyLetter = String.fromCharCode(65 + matchIndex)
        console.log(`      ✅ ${sheet1Letter}. "${sheet1Col}" → ${nhatKyLetter}. "${nhatKyHeaders[matchIndex]}"`)
        mapping.push({
          sheet1: { letter: sheet1Letter, name: sheet1Col, index },
          nhatKy: { letter: nhatKyLetter, name: nhatKyHeaders[matchIndex], index: matchIndex },
          match: true
        })
      } else {
        console.log(`      ❌ ${sheet1Letter}. "${sheet1Col}" → KHÔNG TÌM THẤY`)
        mapping.push({
          sheet1: { letter: sheet1Letter, name: sheet1Col, index },
          nhatKy: null,
          match: false
        })
      }
    })

    // Tìm cột trong Nhật ký không có trong Sheet1
    console.log('\n   📊 Cột trong "Nhật ký" không có trong Sheet1:')
    nhatKyHeaders.forEach((nhatKyCol, index) => {
      const isUsed = mapping.some(m => m.nhatKy && m.nhatKy.index === index)
      if (!isUsed) {
        const letter = String.fromCharCode(65 + index)
        console.log(`      ⚠️ ${letter}. "${nhatKyCol}" → KHÔNG SỬ DỤNG`)
      }
    })

    return {
      sheet1Headers: SHEET1_STRUCTURE,
      nhatKyHeaders,
      mapping,
      success: true
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình phân tích:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  analyzeDataStructure()
    .then((result) => {
      console.log('\n✅ Phân tích cấu trúc hoàn thành!')
      console.log(`📊 Tìm thấy ${result.mapping.filter(m => m.match).length}/${result.sheet1Headers.length} cột khớp`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Phân tích thất bại:', error)
      process.exit(1)
    })
}

module.exports = { analyzeDataStructure }
