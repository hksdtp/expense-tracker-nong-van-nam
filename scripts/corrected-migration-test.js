#!/usr/bin/env node

/**
 * Script migration CHÍNH XÁC với mapping đã sửa
 * Dựa trên cấu trúc thực tế của Sheet1 và Nhật ký
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

// Conversion functions
function convertAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return 0
  
  // Remove "đ" and spaces, convert dots to empty for Vietnamese format
  const cleanAmount = amountStr.replace(/đ/g, '').replace(/\s/g, '').replace(/\./g, '')
  const amount = parseInt(cleanAmount) || 0
  
  return amount
}

function convertType(loaiStr) {
  if (!loaiStr) return 'expense'
  
  const normalized = loaiStr.toLowerCase().trim()
  if (normalized === 'thu') return 'income'
  if (normalized === 'chi') return 'expense'
  
  return 'expense' // default
}

function convertImageUrl(googleDriveId) {
  if (!googleDriveId || googleDriveId.trim() === '') return ''
  
  // Convert Google Drive file ID to viewable URL
  return `https://drive.google.com/file/d/${googleDriveId}/view`
}

function extractTime(dateStr) {
  // Extract time from date, for now just return empty
  // Could be enhanced to extract time if available
  return ''
}

function convertPaymentMethod(nguonTien) {
  if (!nguonTien) return 'transfer'
  
  const normalized = nguonTien.toLowerCase().trim()
  if (normalized.includes('tiền mặt') || normalized.includes('cash')) return 'cash'
  if (normalized.includes('tài khoản') || normalized.includes('chuyển khoản')) return 'transfer'
  
  return 'transfer' // default
}

function mapNhatKyToSheet1Correct(nhatKyRow) {
  // Nhật ký structure: [Ngày, Số tiền, Phân loại, Chi tiết, Giá trị, Loại, Nguồn tiền, Hình ảnh]
  // Sheet1 structure: [Ngày, Danh mục, Mô tả, Số tiền, Loại, Link hóa đơn, Thời gian, Danh mục phụ, Số lượng, Phương thức thanh toán, Ghi chú, URL ảnh]
  
  const [ngay, soTien, phanLoai, chiTiet, giaTri, loai, nguonTien, hinhAnh] = nhatKyRow
  
  return [
    ngay || '',                           // A. Ngày
    phanLoai || '',                       // B. Danh mục (từ C. Phân loại)
    (chiTiet || '').trim(),               // C. Mô tả (từ D. Chi tiết)
    convertAmount(soTien),                // D. Số tiền (từ B. Số tiền)
    convertType(loai),                    // E. Loại (từ F. Loại - QUAN TRỌNG!)
    convertImageUrl(hinhAnh),             // F. Link hóa đơn (từ H. Hình ảnh)
    extractTime(ngay),                    // G. Thời gian (extract từ ngày)
    '',                                   // H. Danh mục phụ (trống)
    1,                                    // I. Số lượng (default = 1)
    convertPaymentMethod(nguonTien),      // J. Phương thức thanh toán (từ G. Nguồn tiền)
    '',                                   // K. Ghi chú (trống)
    ''                                    // L. URL ảnh (trống - tránh duplicate)
  ]
}

async function correctedMigrationTest() {
  console.log('🔧 TEST MIGRATION VỚI MAPPING CHÍNH XÁC')
  console.log('=' .repeat(60))

  try {
    const { sheets } = await initGoogleAPIs()

    // Lấy 3 records đầu tiên từ Nhật ký (skip header)
    console.log('\n📋 Bước 1: Lấy test data từ sheet "Nhật ký"')
    
    const sourceResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Nhật ký!A2:H4', // 3 rows sau header
    })

    const sourceRows = sourceResponse.data.values || []
    console.log(`   📊 Lấy được ${sourceRows.length} records để test`)

    if (sourceRows.length === 0) {
      console.log('   ❌ Không có dữ liệu để test')
      return
    }

    // Show source structure
    console.log('\n📋 Bước 2: Hiển thị cấu trúc source data')
    console.log('   📊 Nhật ký structure: [Ngày, Số tiền, Phân loại, Chi tiết, Giá trị, Loại, Nguồn tiền, Hình ảnh]')
    
    sourceRows.forEach((row, index) => {
      console.log(`\n   📊 Source record ${index + 1}:`)
      console.log(`      A. Ngày: "${row[0] || ''}"`)
      console.log(`      B. Số tiền: "${row[1] || ''}"`)
      console.log(`      C. Phân loại: "${row[2] || ''}"`)
      console.log(`      D. Chi tiết: "${row[3] || ''}"`)
      console.log(`      E. Giá trị: "${row[4] || ''}"`)
      console.log(`      F. Loại: "${row[5] || ''}"`)
      console.log(`      G. Nguồn tiền: "${row[6] || ''}"`)
      console.log(`      H. Hình ảnh: "${row[7] || ''}"`)
    })

    // Transform data với mapping chính xác
    console.log('\n📋 Bước 3: Transform với mapping CHÍNH XÁC')
    console.log('   📊 Sheet1 structure: [Ngày, Danh mục, Mô tả, Số tiền, Loại, Link hóa đơn, Thời gian, Danh mục phụ, Số lượng, Phương thức thanh toán, Ghi chú, URL ảnh]')
    
    const transformedRows = sourceRows.map((row, index) => {
      console.log(`\n   📊 Transform record ${index + 1}:`)
      
      const transformed = mapNhatKyToSheet1Correct(row)
      
      console.log(`      A. Ngày: "${transformed[0]}"`)
      console.log(`      B. Danh mục: "${transformed[1]}" ← từ C. Phân loại`)
      console.log(`      C. Mô tả: "${transformed[2]}" ← từ D. Chi tiết`)
      console.log(`      D. Số tiền: ${transformed[3]} ← từ B. Số tiền (converted)`)
      console.log(`      E. Loại: "${transformed[4]}" ← từ F. Loại (converted)`)
      console.log(`      F. Link hóa đơn: "${transformed[5]}" ← từ H. Hình ảnh (converted)`)
      console.log(`      G. Thời gian: "${transformed[6]}"`)
      console.log(`      H. Danh mục phụ: "${transformed[7]}"`)
      console.log(`      I. Số lượng: ${transformed[8]}`)
      console.log(`      J. Phương thức thanh toán: "${transformed[9]}" ← từ G. Nguồn tiền`)
      console.log(`      K. Ghi chú: "${transformed[10]}"`)
      console.log(`      L. URL ảnh: "${transformed[11]}"`)
      
      return transformed
    })

    // Validation
    console.log('\n📋 Bước 4: Validation chi tiết')
    
    transformedRows.forEach((row, index) => {
      console.log(`\n   📊 Validation record ${index + 1}:`)
      
      // Check critical fields
      const issues = []
      if (!row[0]) issues.push('Ngày trống')
      if (!row[1]) issues.push('Danh mục trống')
      if (typeof row[3] !== 'number') issues.push('Số tiền không phải number')
      if (!['income', 'expense'].includes(row[4])) issues.push('Loại không hợp lệ')
      
      if (issues.length > 0) {
        console.log(`      ❌ Issues: ${issues.join(', ')}`)
      } else {
        console.log(`      ✅ Validation PASSED`)
      }
    })

    console.log('\n📋 Bước 5: Summary')
    console.log(`   ✅ Source records: ${sourceRows.length}`)
    console.log(`   ✅ Transformed records: ${transformedRows.length}`)
    console.log(`   ✅ Mapping: CORRECTED`)
    console.log(`   ✅ Key fixes:`)
    console.log(`      - E. Loại sử dụng F. Loại (Thu/Chi) thay vì C. Phân loại`)
    console.log(`      - F. Link hóa đơn từ H. Hình ảnh`)
    console.log(`      - L. URL ảnh để trống (tránh duplicate)`)

    return {
      sourceRows,
      transformedRows,
      success: true
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test migration:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  correctedMigrationTest()
    .then((result) => {
      console.log('\n✅ Test migration với mapping chính xác hoàn thành!')
      console.log('💡 Mapping conflicts đã được giải quyết')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test migration thất bại:', error)
      process.exit(1)
    })
}

module.exports = { correctedMigrationTest }
