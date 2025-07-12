#!/usr/bin/env node

/**
 * Script lấy mẫu dữ liệu thực từ sheet "Nhật ký" để phân tích
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

async function sampleDataAnalysis() {
  console.log('🔍 PHÂN TÍCH MẪU DỮ LIỆU THỰC TỪ SHEET "NHẬT KÝ"')
  console.log('=' .repeat(60))

  try {
    const { sheets } = await initGoogleAPIs()

    // Lấy 10 rows đầu tiên (bao gồm header)
    console.log('\n📋 Bước 1: Lấy mẫu dữ liệu từ sheet "Nhật ký"')
    
    const sampleResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Nhật ký!A1:H11', // Header + 10 rows dữ liệu
    })

    const rows = sampleResponse.data.values || []
    
    if (rows.length === 0) {
      console.log('   ❌ Không có dữ liệu trong sheet "Nhật ký"')
      return
    }

    const headers = rows[0]
    const dataRows = rows.slice(1)

    console.log(`   📊 Headers: [${headers.join(', ')}]`)
    console.log(`   📊 Số mẫu dữ liệu: ${dataRows.length}`)

    // Phân tích từng mẫu dữ liệu
    console.log('\n📋 Bước 2: Phân tích chi tiết từng mẫu dữ liệu')
    
    dataRows.forEach((row, index) => {
      console.log(`\n   📊 Mẫu ${index + 1}:`)
      headers.forEach((header, colIndex) => {
        const value = row[colIndex] || ''
        const letter = String.fromCharCode(65 + colIndex)
        console.log(`      ${letter}. ${header}: "${value}"`)
      })
    })

    // Phân tích format dữ liệu
    console.log('\n📋 Bước 3: Phân tích format dữ liệu')
    
    headers.forEach((header, colIndex) => {
      console.log(`\n   📊 Cột ${String.fromCharCode(65 + colIndex)}. "${header}":`)
      
      const columnValues = dataRows.map(row => row[colIndex] || '').filter(val => val.trim() !== '')
      console.log(`      📊 Số giá trị không rỗng: ${columnValues.length}`)
      
      if (columnValues.length > 0) {
        // Phân tích kiểu dữ liệu
        const sampleValues = columnValues.slice(0, 5)
        console.log(`      📊 Mẫu giá trị: [${sampleValues.join(', ')}]`)
        
        // Kiểm tra format ngày
        if (header.toLowerCase().includes('ngày')) {
          const dateFormats = sampleValues.map(val => {
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return 'DD/MM/YYYY'
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'YYYY-MM-DD'
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(val)) return 'DD-MM-YYYY'
            return 'UNKNOWN'
          })
          console.log(`      📅 Format ngày: [${dateFormats.join(', ')}]`)
        }
        
        // Kiểm tra format tiền
        if (header.toLowerCase().includes('tiền') || header.toLowerCase().includes('giá trị')) {
          const numberFormats = sampleValues.map(val => {
            const cleanVal = val.replace(/[,.\s]/g, '')
            if (/^\d+$/.test(cleanVal)) return 'NUMBER'
            if (/^-?\d+[,.]?\d*$/.test(val)) return 'DECIMAL'
            return 'TEXT'
          })
          console.log(`      💰 Format tiền: [${numberFormats.join(', ')}]`)
        }
        
        // Kiểm tra unique values cho categorical data
        if (header.toLowerCase().includes('loại') || header.toLowerCase().includes('phân loại')) {
          const uniqueValues = [...new Set(columnValues)]
          console.log(`      📋 Unique values: [${uniqueValues.join(', ')}]`)
        }
      }
    })

    // Mapping suggestions
    console.log('\n📋 Bước 4: Đề xuất mapping cột')
    console.log('   📊 Mapping có thể thực hiện:')
    
    const mappingSuggestions = [
      { nhatKy: 'Ngày', sheet1: 'Ngày', confidence: 'HIGH', note: 'Exact match' },
      { nhatKy: 'Số tiền', sheet1: 'Số tiền', confidence: 'HIGH', note: 'Exact match' },
      { nhatKy: 'Phân loại', sheet1: 'Loại', confidence: 'MEDIUM', note: 'Có thể cần mapping giá trị' },
      { nhatKy: 'Chi tiết', sheet1: 'Mô tả', confidence: 'MEDIUM', note: 'Có thể dùng làm mô tả' },
      { nhatKy: 'Nguồn tiền', sheet1: 'Tài khoản', confidence: 'LOW', note: 'Cần kiểm tra format' },
      { nhatKy: 'Hình ảnh', sheet1: 'Link biên lai', confidence: 'LOW', note: 'Cần kiểm tra format URL' }
    ]
    
    mappingSuggestions.forEach(suggestion => {
      const confidence = suggestion.confidence === 'HIGH' ? '✅' : 
                        suggestion.confidence === 'MEDIUM' ? '⚠️' : '❌'
      console.log(`      ${confidence} "${suggestion.nhatKy}" → "${suggestion.sheet1}" (${suggestion.confidence}) - ${suggestion.note}`)
    })

    return {
      headers,
      sampleData: dataRows,
      mappingSuggestions,
      success: true
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình phân tích:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  sampleDataAnalysis()
    .then((result) => {
      console.log('\n✅ Phân tích mẫu dữ liệu hoàn thành!')
      console.log(`📊 Đã phân tích ${result.sampleData.length} mẫu dữ liệu`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Phân tích thất bại:', error)
      process.exit(1)
    })
}

module.exports = { sampleDataAnalysis }
