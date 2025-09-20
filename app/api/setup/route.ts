import { NextResponse } from "next/server"
import {
  initGoogleAPIs,
  ensureSpreadsheetSetup,
  ensureDriveFolderSetup,
  getSpreadsheetId,
  getDriveFolderId,
} from "@/lib/google-service"

// Đảm bảo API route này chạy trong Node.js runtime
export const runtime = "nodejs"

export async function GET() {
  console.log("Bắt đầu kiểm tra thiết lập Google APIs...")

  try {
    // Kiểm tra kết nối cơ bản trước
    console.log("Kiểm tra kết nối cơ bản...")
    const { sheets, drive } = initGoogleAPIs()

    // Kiểm tra kết nối với Google Sheets
    console.log("Kiểm tra kết nối với Google Sheets...")
    const SPREADSHEET_ID = getSpreadsheetId()
    try {
      const sheetResponse = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      })
      console.log("Kết nối Google Sheets thành công:", sheetResponse.data.properties?.title)
    } catch (sheetError) {
      console.error("Lỗi kết nối Google Sheets:", sheetError)
      return NextResponse.json(
        {
          success: false,
          error: "Không thể kết nối với Google Sheets",
          details: {
            message: sheetError.message,
            code: sheetError.code,
            status: sheetError.response?.status,
            statusText: sheetError.response?.statusText,
            data: sheetError.response?.data,
          },
        },
        { status: 500 },
      )
    }

    // Kiểm tra kết nối với Google Drive
    console.log("Kiểm tra kết nối với Google Drive...")
    const DRIVE_FOLDER_ID = getDriveFolderId()
    try {
      const driveResponse = await drive.files.get({
        fileId: DRIVE_FOLDER_ID,
        fields: "id,name",
      })
      console.log("Kết nối Google Drive thành công:", driveResponse.data.name)
    } catch (driveError) {
      console.error("Lỗi kết nối Google Drive:", driveError)
      return NextResponse.json(
        {
          success: false,
          error: "Không thể kết nối với Google Drive",
          details: {
            message: driveError.message,
            code: driveError.code,
            status: driveError.response?.status,
            statusText: driveError.response?.statusText,
            data: driveError.response?.data,
          },
        },
        { status: 500 },
      )
    }

    // Nếu các kiểm tra cơ bản thành công, tiếp tục với thiết lập đầy đủ
    console.log("Đảm bảo thiết lập Google Sheets...")
    await ensureSpreadsheetSetup()

    console.log("Đảm bảo thiết lập Google Drive...")
    await ensureDriveFolderSetup()

    return NextResponse.json({
      success: true,
      spreadsheetId: getSpreadsheetId(),
      folderId: getDriveFolderId(),
    })
  } catch (error) {
    console.error("Lỗi kiểm tra Google services:", error)

    // Xử lý lỗi chi tiết
    let errorMessage = "Không thể kết nối với Google APIs"
    let errorDetails = {}

    if (error.response) {
      errorMessage = `Lỗi API: ${error.response.status} - ${error.response.statusText}`
      errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      }
    } else if (error.message) {
      errorMessage = error.message
      errorDetails = {
        stack: error.stack,
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  console.log("POST /api/setup - Sửa header và setup sheets...")

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'fix-header') {
      console.log("Thực hiện sửa header...")

      // Khởi tạo Google APIs
      const { sheets } = await initGoogleAPIs()
      const SPREADSHEET_ID = getSpreadsheetId()
      const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Transactions'

      // Sửa header row
      console.log("Cập nhật header row...")
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:L1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [["Ngày", "Danh mục", "Mô tả", "Số tiền", "Loại", "Link hóa đơn", "Thời gian", "Danh mục phụ", "Số lượng", "Phương thức thanh toán", "Ghi chú", "URL ảnh"]],
        },
      })

      console.log("Header đã được cập nhật thành công!")

      return NextResponse.json({
        success: true,
        message: "Header đã được sửa thành công",
        action: "fix-header"
      })
    }

    // Nếu không có action cụ thể, chạy setup mặc định
    console.log("Chạy setup mặc định...")
    await ensureSpreadsheetSetup()
    await ensureDriveFolderSetup()

    return NextResponse.json({
      success: true,
      message: "Setup hoàn thành",
      spreadsheetId: getSpreadsheetId(),
      folderId: getDriveFolderId(),
    })

  } catch (error) {
    console.error("Lỗi POST setup:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi không xác định",
        details: {
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}
