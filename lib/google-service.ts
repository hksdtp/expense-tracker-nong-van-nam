// Thêm 'use server' directive để đảm bảo code chỉ chạy ở server-side
"use server"

import { google } from "googleapis"
import { JWT } from "google-auth-library"

// Cấu hình ID bảng tính
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1JwFzEMRZsxAuIzMV0XRSI5X98AXeGa9f2cXVkUzXReE" // Fallback for safety, but env var should be primary
// Tên sheet chính xác - thường là "Sheet1" hoặc "Trang tính1"
const SHEET_NAME = "Sheet1"
// ID thư mục Google Drive
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || "1BoiKfWBpriBmdyXhUbpv-GKM2bPmGvRn" // Fallback for safety

// Thông tin xác thực tài khoản dịch vụ
const serviceAccount = {
  type: "service_account",
  project_id: "qlct-455215",
  private_key_id: "6e22661d763b314febfdbff9811bd8553516e27f",
  private_key: process.env.GOOGLE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAcB71mfAwXH5O\nyZzAElL6zuo1J+tO8Ae8gRcFMIkbKKi//MgI+g0tgV0/pCecaEgzn/n2MTnNZl6E\ngripe5h68HN7FYnYdmCIvoSQslja0VGUIzeNQL4tmGetLUZnRxqVc06ch/v4/6qd\naMSXoahieRHl1obI8oT3tZKZs2DEPxi9xWAnHNHMJoCw8UZhvwtI1UHVeBE/94P+\nKWO1kQy33sIxbu2DdKVMuCZ0aYV+3eDdgiSfYzjH9BqDBb+4jBJrv4XyurgeeOnZ\npQRdAoisviU5ytuQ8KN0cx7J08HV+sjJba/vQ92jSjfT5mTnn8O9f7n4bfvzzOyz\nteWcPwlhAgMBAAECggEAL3DUqQ6QsJN0zf6VBqLd0xgElCMptvWkqpuWbcCX5Fqj\nM2VheRkP+5prPx+8ZiotNpDnQgLDsbfdcER7usiOACzcA0l9iKAyTzPMoZFeJ1+4\nAVGnRcrit4HdeUtykk5sptBc3mkFvM5mpNSptonzZYdcWrGG2+4xypF4OS0IG4jW\nhVYDtFEHZYMXrYu4SuRUd4aFIquxBy1znnzboNBQHK1392CyuwaO+YqwRjJ5nfBE\n8oofKrDRofBFgj2lvBdVeR8ti9w/4TpWY45mDVENcvtLneV6srb8iWXv5PDk3aAp\nvnqBX2jJcjjoFoAQ3F0w/LJJCyhl2YoWXjBK7Nci0wKBgQD25VaHgPzJB7UzpJOG\nlqlmr6ntK8yScfDdqrhUEqy0Tsfs6scSyj/7ZBzJ/uFXmkIzqeehAGk43G8eKkM1\nOUn6mOsip6KD19KAGB/uw4znLGhdkP3nocXLVcwgrIzGRp65Ik0pt85a6CfktIfT\nYTr7nmtwASRqhvQ3GKUBKxVPnwKBgQDHiLVO9Vq8lXhfbSQpvT3ybmtr10xh6dmj\nIlabIhKrYApYTw0J+EGiAh9olRVWaPqrU7RYnt+xHFjv+r+8oH/7kI4zH7bRIlJo\nrh76NTrtxU/+s7FJNYQsp5vvpFHdAq/mMS5DpzAIVgV9YfasxYb+VDgYSOn1iPTi\nIDePcHkG/wKBgQDw91Zje/27yr0MgTTG5+a/5PSpGNVZnMEj54pt66gJdtZjoaTX\n7vNRTR1X/F48nL6+I7aBCaCosWP2AfOET7ynS3Y6ZXgUy6CUCneoFc1AlrPplihp\nWRdt4/gNb7sZjTU+pX7AF7fcO7cr3RKvuLbTe4OKVmMPYVWbLH9my4DKKwKBgQCu\nJewQeOXzuATyTICGiWt6ntLUsXkx7/cKgZrTFR70QgNlZcE8lVc7Pd0J2yxfWYqG\nY60At9EGdHZPJSuZRv/MoTLq/eACkZEZWfcha7n98ftKkqzF95Zfnv3jXygv2/uH\nzh7R3yZ18BYkg47W5iNW8ExxLZo8uYb5oSK8525KIwKBgB07DANxVk0oBEGxoUWL\nW4T369z8sg0PhdTX708Pd1JsTdellBQskxMpugyvbyh8CjAF53w1SkqizGai2Uda\nKuGOHpO22AObPOQUNNll6MCfgKw2bTLW7+CJ8V/JWq4ML78/YwEuUgSQm+sqDSOt\nzfkZqlOG3vz4t7yEuAvuIExL\n-----END PRIVATE KEY-----\n",
  client_email: process.env.GOOGLE_CLIENT_EMAIL || "nihreport@qlct-455215.iam.gserviceaccount.com",
  client_id: "105976955157285476068",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/nihreport%40qlct-455215.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
}

// Khởi tạo Google APIs - Chuyển thành async function
export async function initGoogleAPIs() {
  try {
    console.log("Khởi tạo Google APIs với tài khoản:", serviceAccount.client_email)

    // Clean và format private key đúng cách
    let privateKey = serviceAccount.private_key;

    // Nếu private key từ environment variable, cần decode properly
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Đảm bảo private key có format đúng
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format');
    }

    // Luôn tạo mới JWT client để tránh vấn đề với biến toàn cục trong môi trường serverless
    const auth = new JWT({
      email: serviceAccount.client_email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const drive = google.drive({ version: "v3", auth })

    return { auth, sheets, drive }
  } catch (error) {
    console.error("Lỗi khởi tạo Google APIs:", error)
    console.error("Private key preview:", serviceAccount.private_key.substring(0, 50) + "...")
    throw error
  }
}

// Hàm lấy token xác thực - Đã là async function
export async function getAccessToken() {
  try {
    // Luôn tạo mới JWT client để tránh vấn đề với biến toàn cục
    const { auth } = await initGoogleAPIs()

    // Lấy token mới
    const token = await auth.getAccessToken()
    if (!token || !token.token) {
      throw new Error("Không thể lấy access token: Token không hợp lệ")
    }

    return token.token
  } catch (error) {
    console.error("Lỗi lấy access token:", error)
    throw new Error(`Không thể lấy access token: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Lấy ID bảng tính - Chuyển thành async function
export async function getSpreadsheetId() {
  return SPREADSHEET_ID
}

// Lấy ID thư mục Drive - Chuyển thành async function
export async function getDriveFolderId() {
  return DRIVE_FOLDER_ID
}

// Đảm bảo bảng tính tồn tại và có đúng tiêu đề - Đã là async function
export async function ensureSpreadsheetSetup() {
  const { sheets } = await initGoogleAPIs()

  try {
    console.log(`Kiểm tra bảng tính ID: ${SPREADSHEET_ID}`)

    // Kiểm tra bảng tính tồn tại
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    console.log(`Bảng tính tồn tại: ${spreadsheetResponse.data.properties?.title}`)

    // Kiểm tra sheet Transactions tồn tại
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    })

    // Lấy danh sách tất cả các sheet
    const allSheets = response.data.sheets ? response.data.sheets.map((s: any) => s.properties.title) : []
    console.log("Danh sách sheet:", allSheets)

    const sheetExists = response.data.sheets ? response.data.sheets.some((sheet: any) => sheet.properties.title === SHEET_NAME) : false
    console.log(`Sheet "${SHEET_NAME}" tồn tại: ${sheetExists}`)

    if (!sheetExists) {
      console.log(`Tạo sheet mới: ${SHEET_NAME}`)
      // Tạo sheet Transactions
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEET_NAME,
                },
              },
            },
          ],
        },
      })

      // Thêm tiêu đề
      console.log("Thêm tiêu đề cho sheet")
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["Date", "Category", "Description", "Amount", "Type", "ReceiptLink", "Timestamp", "SubCategory"]],
        },
      })

      console.log("Đã tạo sheet và thêm tiêu đề thành công")
    }

    return SPREADSHEET_ID
  } catch (error) {
    console.error("Lỗi thiết lập bảng tính:", error)
    throw error
  }
}

// Đảm bảo thư mục Drive tồn tại - Đã là async function
export async function ensureDriveFolderSetup() {
  const { drive } = await initGoogleAPIs()

  try {
    console.log(`Kiểm tra thư mục Drive ID: ${DRIVE_FOLDER_ID}`)

    // Kiểm tra thư mục tồn tại
    const folderResponse = await drive.files.get({
      fileId: DRIVE_FOLDER_ID,
      fields: "id,name,mimeType",
    })

    console.log(`Thư mục tồn tại: ${folderResponse.data.name}, loại: ${folderResponse.data.mimeType}`)

    return DRIVE_FOLDER_ID
  } catch (error) {
    console.error("Lỗi kiểm tra thư mục Drive:", error)
    throw error
  }
}

export async function getGoogleSheetClient() {
  const { sheets } = await initGoogleAPIs()
  return sheets
}
