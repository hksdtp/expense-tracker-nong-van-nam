import { NextResponse } from "next/server"
import { initGoogleAPIs, getSpreadsheetId } from "@/lib/google-service"

// Đảm bảo API route này chạy trong Node.js runtime
export const runtime = "nodejs"

// Ngăn chặn caching để luôn lấy dữ liệu mới nhất
export const dynamic = "force-dynamic"
export const revalidate = 0

// PUT method để cập nhật giao dịch
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id
    console.log(`API: Updating transaction with ID: ${transactionId}`)

    // Lấy dữ liệu từ FormData
    const formData = await request.formData()

    const type = formData.get("type") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const amount = formData.get("amount") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const date = formData.get("date") as string
    const note = formData.get("note") as string || ""
    const receiptLink = formData.get("receiptLink") as string || ""
    const subCategory = formData.get("subCategory") as string || ""
    const fuelLiters = formData.get("fuelLiters") as string || ""
    const rowIndex = formData.get("rowIndex") as string

    console.log("Update data:", {
      type, category, description, amount, paymentMethod, date, note, receiptLink, subCategory, fuelLiters, rowIndex
    })

    // Khởi tạo Google APIs
    const { sheets } = await initGoogleAPIs()
    const SPREADSHEET_ID = await getSpreadsheetId()
    const SHEET_NAME = "Sheet1"

    // Trước tiên, lấy tất cả dữ liệu để tìm giao dịch cần cập nhật
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:K`,
    })

    const rows = response.data.values || []
    console.log(`Found ${rows.length} rows in the sheet`)

    // Validation
    if (!type || !category || !description || !amount || !paymentMethod || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Sử dụng rowIndex từ FormData nếu có, nếu không thì dùng transactionId
    let actualRowNumber: number
    if (rowIndex) {
      actualRowNumber = parseInt(rowIndex)
    } else {
      // Fallback: tìm theo ID
      const transactionRowIndex = parseInt(transactionId)
      if (isNaN(transactionRowIndex) || transactionRowIndex < 0 || transactionRowIndex >= rows.length) {
        return NextResponse.json(
          {
            success: false,
            error: `Transaction with ID ${transactionId} not found`,
          },
          { status: 404 }
        )
      }
      actualRowNumber = transactionRowIndex + 2 // +2 vì header và 0-based index
    }

    console.log(`Updating row ${actualRowNumber} in Google Sheets`)

    // Chuẩn bị dữ liệu để cập nhật Google Sheets
    // Cấu trúc: Ngày, Danh mục, Mô tả, Số tiền, Loại, Link hóa đơn, Thời gian, Danh mục phụ, Số lượng, Phương thức thanh toán, Ghi chú
    const updatedRowData = [
      date, // Ngày
      category, // Danh mục
      description, // Mô tả
      parseInt(amount), // Số tiền
      type, // Loại (expense/income)
      receiptLink, // Link hóa đơn
      new Date().toISOString(), // Thời gian cập nhật
      subCategory, // Danh mục phụ
      fuelLiters, // Số lượng (lít xăng)
      paymentMethod, // Phương thức thanh toán
      note // Ghi chú
    ]

    console.log("Updated row data:", updatedRowData)

    // Tính toán range cho hàng cụ thể
    const updateRange = `${SHEET_NAME}!A${actualRowNumber}:K${actualRowNumber}`
    console.log(`Updating range: ${updateRange}`)

    // Cập nhật dữ liệu trong Google Sheets
    const updateResult = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [updatedRowData],
      },
    })

    console.log("Transaction updated successfully:", updateResult.data)

    // Clear cache để force refresh
    const { clearTransactionsCache } = await import("../route")
    clearTransactionsCache() // Clear tất cả cache

    return NextResponse.json(
      {
        success: true,
        message: `Transaction ${transactionId} updated successfully`,
        updatedData: {
          id: transactionId,
          rowIndex: actualRowNumber,
          updatedFields: { type, category, description, amount, paymentMethod, date, note, receiptLink, subCategory, fuelLiters },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    )
  } catch (error: unknown) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    )
  }
}
