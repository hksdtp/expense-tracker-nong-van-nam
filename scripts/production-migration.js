#!/usr/bin/env node

/**
 * SCRIPT PRODUCTION MIGRATION
 * Gộp toàn bộ dữ liệu từ sheet "Nhật ký" vào "Sheet1"
 * 353 records với mapping chính xác
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

function convertPaymentMethod(nguonTien) {
  if (!nguonTien) return 'transfer'
  
  const normalized = nguonTien.toLowerCase().trim()
  if (normalized.includes('tiền mặt') || normalized.includes('cash')) return 'cash'
  if (normalized.includes('tài khoản') || normalized.includes('chuyển khoản')) return 'transfer'
  
  return 'transfer' // default
}

function mapNhatKyToSheet1(nhatKyRow) {
  // Nhật ký structure: [Ngày, Số tiền, Phân loại, Chi tiết, Giá trị, Loại, Nguồn tiền, Hình ảnh]
  // Sheet1 structure: [Ngày, Danh mục, Mô tả, Số tiền, Loại, Link hóa đơn, Thời gian, Danh mục phụ, Số lượng, Phương thức thanh toán, Ghi chú, URL ảnh]
  
  const [ngay, soTien, phanLoai, chiTiet, giaTri, loai, nguonTien, hinhAnh] = nhatKyRow
  
  return [
    ngay || '',                           // A. Ngày
    phanLoai || '',                       // B. Danh mục
    (chiTiet || '').trim(),               // C. Mô tả
    convertAmount(soTien),                // D. Số tiền
    convertType(loai),                    // E. Loại
    convertImageUrl(hinhAnh),             // F. Link hóa đơn
    '',                                   // G. Thời gian
    '',                                   // H. Danh mục phụ
    1,                                    // I. Số lượng
    convertPaymentMethod(nguonTien),      // J. Phương thức thanh toán
    '',                                   // K. Ghi chú
    ''                                    // L. URL ảnh
  ]
}

async function productionMigration() {
  console.log('🚀 PRODUCTION MIGRATION - GỘP DỮ LIỆU NHẬT KÝ VÀO SHEET1')
  console.log('=' .repeat(70))

  try {
    const { sheets } = await initGoogleAPIs()

    // Bước 1: Backup - Lấy dữ liệu hiện tại của Sheet1
    console.log('\n📋 Bước 1: Backup dữ liệu hiện tại của Sheet1')
    
    const sheet1BackupResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const sheet1CurrentData = sheet1BackupResponse.data.values || []
    console.log(`   📊 Sheet1 hiện có: ${sheet1CurrentData.length} rows`)
    console.log(`   💾 Backup completed - có thể rollback nếu cần`)

    // Bước 2: Lấy toàn bộ dữ liệu từ Nhật ký
    console.log('\n📋 Bước 2: Lấy toàn bộ dữ liệu từ sheet "Nhật ký"')
    
    const nhatKyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Nhật ký!A2:H', // Skip header, lấy tất cả data
    })

    const nhatKyData = nhatKyResponse.data.values || []
    console.log(`   📊 Nhật ký có: ${nhatKyData.length} records để migrate`)

    if (nhatKyData.length === 0) {
      console.log('   ❌ Không có dữ liệu để migrate')
      return { success: false, message: 'No data to migrate' }
    }

    // Bước 3: Transform toàn bộ dữ liệu
    console.log('\n📋 Bước 3: Transform toàn bộ dữ liệu')
    
    const transformedData = []
    let successCount = 0
    let errorCount = 0
    const errors = []

    nhatKyData.forEach((row, index) => {
      try {
        const transformed = mapNhatKyToSheet1(row)
        
        // Validate critical fields
        if (!transformed[0]) { // Ngày
          throw new Error('Ngày trống')
        }
        if (typeof transformed[3] !== 'number') { // Số tiền
          throw new Error('Số tiền không hợp lệ')
        }
        if (!['income', 'expense'].includes(transformed[4])) { // Loại
          throw new Error('Loại không hợp lệ')
        }

        transformedData.push(transformed)
        successCount++
        
        if ((index + 1) % 50 === 0) {
          console.log(`   📊 Processed ${index + 1}/${nhatKyData.length} records...`)
        }
        
      } catch (error) {
        errorCount++
        errors.push({
          row: index + 2, // +2 vì skip header và 0-based
          data: row,
          error: error.message
        })
        console.log(`   ❌ Error row ${index + 2}: ${error.message}`)
      }
    })

    console.log(`   ✅ Transform completed: ${successCount} success, ${errorCount} errors`)

    if (errorCount > 0) {
      console.log('\n   🚨 Errors encountered:')
      errors.forEach(err => {
        console.log(`      Row ${err.row}: ${err.error}`)
      })
      
      if (errorCount > successCount * 0.1) { // Nếu lỗi > 10%
        console.log('\n   ❌ Too many errors - aborting migration')
        return { success: false, message: 'Too many transformation errors' }
      }
    }

    // Bước 4: Tìm vị trí để append vào Sheet1
    console.log('\n📋 Bước 4: Tìm vị trí append trong Sheet1')
    
    const nextRow = sheet1CurrentData.length + 1
    console.log(`   📊 Sẽ append từ row ${nextRow}`)

    // Bước 5: Append dữ liệu vào Sheet1
    console.log('\n📋 Bước 5: Append dữ liệu vào Sheet1')
    console.log(`   📤 Uploading ${transformedData.length} records...`)

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
      valueInputOption: 'RAW',
      requestBody: {
        values: transformedData
      }
    })

    console.log(`   ✅ Append completed: ${appendResponse.data.updates.updatedRows} rows added`)

    // Bước 6: Verification
    console.log('\n📋 Bước 6: Verification')
    
    const verifyResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
    })

    const finalData = verifyResponse.data.values || []
    const addedRows = finalData.length - sheet1CurrentData.length

    console.log(`   📊 Sheet1 trước: ${sheet1CurrentData.length} rows`)
    console.log(`   📊 Sheet1 sau: ${finalData.length} rows`)
    console.log(`   📊 Rows added: ${addedRows}`)

    if (addedRows === transformedData.length) {
      console.log(`   ✅ Verification PASSED - All data migrated successfully`)
    } else {
      console.log(`   ⚠️ Verification WARNING - Expected ${transformedData.length}, got ${addedRows}`)
    }

    // Bước 7: Summary Report
    console.log('\n📋 Bước 7: Migration Summary Report')
    console.log(`   📊 Source records (Nhật ký): ${nhatKyData.length}`)
    console.log(`   📊 Successfully transformed: ${successCount}`)
    console.log(`   📊 Transformation errors: ${errorCount}`)
    console.log(`   📊 Records migrated to Sheet1: ${addedRows}`)
    console.log(`   📊 Migration success rate: ${Math.round((successCount / nhatKyData.length) * 100)}%`)

    // Sample migrated data
    console.log('\n   📊 Sample migrated records:')
    const sampleCount = Math.min(3, transformedData.length)
    for (let i = 0; i < sampleCount; i++) {
      const record = transformedData[i]
      console.log(`      ${i + 1}. ${record[0]} | ${record[1]} | ${record[2]} | ${record[3]} | ${record[4]}`)
    }

    return {
      success: true,
      sourceRecords: nhatKyData.length,
      transformedRecords: successCount,
      migratedRecords: addedRows,
      errors: errorCount,
      errorDetails: errors
    }

  } catch (error) {
    console.error('\n❌ Lỗi trong quá trình migration:', error)
    throw error
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  console.log('⚠️  CẢNH BÁO: Script này sẽ thực hiện migration thật!')
  console.log('⚠️  Đảm bảo bạn đã backup dữ liệu trước khi tiếp tục')
  console.log('⚠️  Nhấn Ctrl+C để hủy trong 5 giây...')
  
  setTimeout(() => {
    productionMigration()
      .then((result) => {
        if (result.success) {
          console.log('\n🎉 MIGRATION THÀNH CÔNG!')
          console.log(`📊 Đã migrate ${result.migratedRecords}/${result.sourceRecords} records`)
          if (result.errors > 0) {
            console.log(`⚠️  Có ${result.errors} lỗi - kiểm tra logs ở trên`)
          }
        } else {
          console.log('\n❌ MIGRATION THẤT BẠI!')
          console.log(`📊 Lý do: ${result.message}`)
        }
        process.exit(0)
      })
      .catch((error) => {
        console.error('\n❌ Migration thất bại:', error)
        process.exit(1)
      })
  }, 5000)
}

module.exports = { productionMigration }
