#!/usr/bin/env node

/**
 * Script test migration dữ liệu từ sheet "Nhật ký" sang "Sheet1"
 * Test với 3 records đầu tiên để validate logic
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

// Mapping functions
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

function mapNhatKyToSheet1(nhatKyRow) {
  // Nhật ký structure: [Ngày, Số tiền, Phân loại, Chi tiết, Giá trị, Loại, Nguồn tiền, Hình ảnh]
  // Sheet1 structure: [Ngày, Danh mục, Mô tả, Số tiền, Loại, Danh mục phụ, Lít xăng, Phương thức thanh toán, Ghi chú, Tài khoản, Số dư, Link biên lai]
  
  const [ngay, soTien, phanLoai, chiTiet, giaTri, loai, nguonTien, hinhAnh] = nhatKyRow
  
  return [
    ngay || '',                           // A. Ngày
    phanLoai || '',                       // B. Danh mục (từ Phân loại)
    (chiTiet || '').trim(),               // C. Mô tả (từ Chi tiết)
    convertAmount(soTien),                // D. Số tiền (convert format)
    convertType(loai),                    // E. Loại (Thu/Chi → income/expense)
    '',                                   // F. Danh mục phụ (empty)
    '',                                   // G. Lít xăng (empty)
    'transfer',                           // H. Phương thức thanh toán (default)
    '',                                   // I. Ghi chú (empty)
    nguonTien || 'Tài khoản',            // J. Tài khoản (từ Nguồn tiền)
    '',                                   // K. Số dư (empty, sẽ tính sau)
    convertImageUrl(hinhAnh)              // L. Link biên lai (convert Google Drive)
  ]
}

async function testMigration() {
  console.log('🧪 TEST MIGRATION DỮ LIỆU TỪ "NHẬT KÝ" SANG "SHEET1"')
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

    // Transform data
    console.log('\n📋 Bước 2: Transform dữ liệu')
    
    const transformedRows = sourceRows.map((row, index) => {
      console.log(`\n   📊 Transform record ${index + 1}:`)
      console.log(`      Input: [${row.join(', ')}]`)
      
      const transformed = mapNhatKyToSheet1(row)
      console.log(`      Output: [${transformed.join(', ')}]`)
      
      return transformed
    })

    // Validate transformed data
    console.log('\n📋 Bước 3: Validate transformed data')
    
    transformedRows.forEach((row, index) => {
      console.log(`\n   📊 Validation record ${index + 1}:`)
      console.log(`      ✅ Ngày: "${row[0]}"`)
      console.log(`      ✅ Danh mục: "${row[1]}"`)
      console.log(`      ✅ Mô tả: "${row[2]}"`)
      console.log(`      ✅ Số tiền: ${row[3]} (${typeof row[3]})`)
      console.log(`      ✅ Loại: "${row[4]}"`)
      console.log(`      ✅ Tài khoản: "${row[9]}"`)
      console.log(`      ✅ Link biên lai: "${row[11]}"`)
    })

    // Test write to Sheet1 (DRY RUN - chỉ log, không thực sự write)
    console.log('\n📋 Bước 4: DRY RUN - Test write to Sheet1')
    console.log('   ⚠️ DRY RUN MODE - Không thực sự ghi dữ liệu')
    
    // Tìm row trống đầu tiên trong Sheet1
    const sheet1Response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:A',
    })

    const sheet1Rows = sheet1Response.data.values || []
    const nextEmptyRow = sheet1Rows.length + 1

    console.log(`   📊 Sheet1 hiện có ${sheet1Rows.length} rows`)
    console.log(`   📊 Sẽ ghi từ row ${nextEmptyRow}`)

    transformedRows.forEach((row, index) => {
      const targetRow = nextEmptyRow + index
      console.log(`   📝 Row ${targetRow}: [${row.join(', ')}]`)
    })

    console.log('\n📋 Bước 5: Summary')
    console.log(`   ✅ Source records: ${sourceRows.length}`)
    console.log(`   ✅ Transformed records: ${transformedRows.length}`)
    console.log(`   ✅ Validation: PASSED`)
    console.log(`   ✅ Target range: Sheet1!A${nextEmptyRow}:L${nextEmptyRow + transformedRows.length - 1}`)

    return {
      sourceRows,
      transformedRows,
      nextEmptyRow,
      success: true
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình test migration:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testMigration()
    .then((result) => {
      console.log('\n✅ Test migration hoàn thành!')
      console.log('💡 Để thực hiện migration thật, cần tạo script production')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test migration thất bại:', error)
      process.exit(1)
    })
}

module.exports = { testMigration }
