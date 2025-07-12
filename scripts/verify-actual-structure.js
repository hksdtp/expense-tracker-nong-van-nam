#!/usr/bin/env node

/**
 * Script kiểm tra cấu trúc thực tế của cả Sheet1 và Nhật ký
 * Để xác định chính xác mapping
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

async function verifyActualStructure() {
  console.log('🔍 KIỂM TRA CẤU TRÚC THỰC TẾ CỦA SHEET1 VÀ NHẬT KÝ')
  console.log('=' .repeat(70))

  try {
    const { sheets } = await initGoogleAPIs()

    // Kiểm tra cấu trúc Sheet1 thực tế
    console.log('\n📋 Bước 1: Kiểm tra cấu trúc Sheet1 thực tế')
    
    const sheet1Response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!1:1', // Header row
    })

    const sheet1Headers = sheet1Response.data.values?.[0] || []
    console.log(`   📊 Sheet1 có ${sheet1Headers.length} cột`)
    console.log('   📊 Headers Sheet1:')
    sheet1Headers.forEach((header, index) => {
      const letter = String.fromCharCode(65 + index)
      console.log(`      ${letter}. "${header}"`)
    })

    // Kiểm tra cấu trúc Nhật ký thực tế
    console.log('\n📋 Bước 2: Kiểm tra cấu trúc Nhật ký thực tế')
    
    const nhatKyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Nhật ký!1:1', // Header row
    })

    const nhatKyHeaders = nhatKyResponse.data.values?.[0] || []
    console.log(`   📊 Nhật ký có ${nhatKyHeaders.length} cột`)
    console.log('   📊 Headers Nhật ký:')
    nhatKyHeaders.forEach((header, index) => {
      const letter = String.fromCharCode(65 + index)
      console.log(`      ${letter}. "${header}"`)
    })

    // So sánh và tạo mapping mới
    console.log('\n📋 Bước 3: Tạo mapping mới dựa trên cấu trúc thực tế')
    console.log('   📊 Mapping có thể thực hiện:')
    
    const newMapping = []
    
    sheet1Headers.forEach((sheet1Header, sheet1Index) => {
      const sheet1Letter = String.fromCharCode(65 + sheet1Index)
      
      // Tìm cột tương ứng trong Nhật ký
      const matchIndex = nhatKyHeaders.findIndex(nhatKyHeader => {
        const normalized1 = sheet1Header.toLowerCase().trim()
        const normalized2 = nhatKyHeader.toLowerCase().trim()
        
        // Exact matches
        if (normalized1 === normalized2) return true
        
        // Semantic matches
        if (normalized1.includes('ngày') && normalized2.includes('ngày')) return true
        if (normalized1.includes('danh mục') && normalized2.includes('phân loại')) return true
        if (normalized1.includes('mô tả') && normalized2.includes('chi tiết')) return true
        if (normalized1.includes('số tiền') && normalized2.includes('số tiền')) return true
        if (normalized1.includes('loại') && normalized2.includes('loại')) return true
        if (normalized1.includes('link hóa đơn') && normalized2.includes('hình ảnh')) return true
        if (normalized1.includes('url ảnh') && normalized2.includes('hình ảnh')) return true
        if (normalized1.includes('phương thức') && normalized2.includes('nguồn')) return true
        
        return false
      })
      
      if (matchIndex !== -1) {
        const nhatKyLetter = String.fromCharCode(65 + matchIndex)
        const confidence = sheet1Header.toLowerCase() === nhatKyHeaders[matchIndex].toLowerCase() ? 'HIGH' : 'MEDIUM'
        console.log(`      ✅ ${sheet1Letter}. "${sheet1Header}" → ${nhatKyLetter}. "${nhatKyHeaders[matchIndex]}" (${confidence})`)
        
        newMapping.push({
          sheet1: { letter: sheet1Letter, name: sheet1Header, index: sheet1Index },
          nhatKy: { letter: nhatKyLetter, name: nhatKyHeaders[matchIndex], index: matchIndex },
          confidence,
          match: true
        })
      } else {
        console.log(`      ❌ ${sheet1Letter}. "${sheet1Header}" → KHÔNG TÌM THẤY`)
        
        newMapping.push({
          sheet1: { letter: sheet1Letter, name: sheet1Header, index: sheet1Index },
          nhatKy: null,
          confidence: 'NONE',
          match: false
        })
      }
    })

    // Tìm cột trong Nhật ký không được sử dụng
    console.log('\n   📊 Cột trong Nhật ký không được map:')
    nhatKyHeaders.forEach((nhatKyHeader, index) => {
      const isUsed = newMapping.some(m => m.nhatKy && m.nhatKy.index === index)
      if (!isUsed) {
        const letter = String.fromCharCode(65 + index)
        console.log(`      ⚠️ ${letter}. "${nhatKyHeader}" → KHÔNG SỬ DỤNG`)
      }
    })

    // Phân tích impact
    console.log('\n📋 Bước 4: Phân tích impact của sự khác biệt')
    
    const matchedColumns = newMapping.filter(m => m.match).length
    const totalSheet1Columns = sheet1Headers.length
    const matchPercentage = Math.round((matchedColumns / totalSheet1Columns) * 100)
    
    console.log(`   📊 Tỷ lệ mapping: ${matchedColumns}/${totalSheet1Columns} (${matchPercentage}%)`)
    
    if (matchPercentage < 50) {
      console.log('   🚨 CẢNH BÁO: Tỷ lệ mapping thấp - cần xem xét lại chiến lược')
    } else if (matchPercentage < 70) {
      console.log('   ⚠️ CHÚ Ý: Tỷ lệ mapping trung bình - cần xử lý cẩn thận')
    } else {
      console.log('   ✅ TỐT: Tỷ lệ mapping cao - có thể tiến hành migration')
    }

    // Đề xuất giải pháp
    console.log('\n📋 Bước 5: Đề xuất giải pháp')
    
    const unmatchedCritical = newMapping.filter(m => 
      !m.match && 
      (m.sheet1.name.toLowerCase().includes('ngày') ||
       m.sheet1.name.toLowerCase().includes('số tiền') ||
       m.sheet1.name.toLowerCase().includes('loại'))
    )
    
    if (unmatchedCritical.length > 0) {
      console.log('   🚨 CÁC CỘT QUAN TRỌNG KHÔNG MATCH:')
      unmatchedCritical.forEach(col => {
        console.log(`      - ${col.sheet1.name}`)
      })
      console.log('   💡 Cần xem xét lại cấu trúc hoặc tạo mapping thủ công')
    } else {
      console.log('   ✅ Các cột quan trọng đều có thể map')
      console.log('   💡 Có thể tiến hành migration với xử lý cho cột không match')
    }

    return {
      sheet1Headers,
      nhatKyHeaders,
      newMapping,
      matchPercentage,
      success: true
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình kiểm tra:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  verifyActualStructure()
    .then((result) => {
      console.log('\n✅ Kiểm tra cấu trúc hoàn thành!')
      console.log(`📊 Mapping rate: ${result.matchPercentage}%`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Kiểm tra thất bại:', error)
      process.exit(1)
    })
}

module.exports = { verifyActualStructure }
