#!/usr/bin/env node

const { google } = require('googleapis')
const { JWT } = require('google-auth-library')
require('dotenv').config({ path: '.env.local' })

async function checkSheetsData() {
  try {
    console.log('🔍 Kiểm tra dữ liệu trong các sheet...')
    
    // Khởi tạo Google APIs
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    const auth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SHEET_ID

    console.log(`📊 Spreadsheet ID: ${SPREADSHEET_ID}`)

    // Lấy thông tin tất cả sheets
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    console.log(`📋 Tìm thấy ${sheetInfo.data.sheets.length} sheet(s):`)
    sheetInfo.data.sheets.forEach(sheet => {
      console.log(`   - ${sheet.properties.title}`)
    })

    // Kiểm tra sheet 'Sheet1'
    console.log('\n=== KIỂM TRA SHEET1 ===')
    try {
      const response1 = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1:L10',
      })
      const rows1 = response1.data.values || []
      console.log(`📊 Sheet1 có ${rows1.length} hàng`)
      if (rows1.length > 0) {
        console.log('📋 Header:', JSON.stringify(rows1[0]))
        if (rows1.length > 1) {
          console.log('📋 Dữ liệu mẫu:', JSON.stringify(rows1.slice(1, 3)))
        }
      }
    } catch (e) {
      console.log('❌ Lỗi đọc Sheet1:', e.message)
    }

    // Kiểm tra sheet 'Nhật ký'
    console.log('\n=== KIỂM TRA NHẬT KÝ ===')
    try {
      const response2 = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Nhật ký!A1:L10',
      })
      const rows2 = response2.data.values || []
      console.log(`📊 Nhật ký có ${rows2.length} hàng`)
      if (rows2.length > 0) {
        console.log('📋 Header:', JSON.stringify(rows2[0]))
        if (rows2.length > 1) {
          console.log('📋 Dữ liệu mẫu:', JSON.stringify(rows2.slice(1, 3)))
        }
      }
    } catch (e) {
      console.log('❌ Lỗi đọc Nhật ký:', e.message)
    }

    // Kiểm tra toàn bộ dữ liệu trong Nhật ký
    console.log('\n=== TỔNG QUAN NHẬT KÝ ===')
    try {
      const responseAll = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Nhật ký!A:L',
      })
      const allRows = responseAll.data.values || []
      console.log(`📊 Tổng cộng ${allRows.length} hàng trong Nhật ký`)
      
      if (allRows.length > 1) {
        console.log('📋 5 giao dịch cuối:')
        allRows.slice(-5).forEach((row, index) => {
          console.log(`   ${allRows.length - 5 + index}. ${row[0]} - ${row[1]} - ${row[2]} - ${row[3]}`)
        })
      }
    } catch (e) {
      console.log('❌ Lỗi đọc toàn bộ Nhật ký:', e.message)
    }

  } catch (error) {
    console.error('❌ Lỗi:', error)
  }
}

checkSheetsData()
