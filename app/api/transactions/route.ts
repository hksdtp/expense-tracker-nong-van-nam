import { NextResponse } from "next/server"
import { initGoogleAPIs, getSpreadsheetId } from "@/lib/google-service"
import { revalidatePath } from "next/cache"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Đảm bảo API route này chạy trong Node.js runtime
export const runtime = "nodejs"

// Ngăn chặn caching để luôn lấy dữ liệu mới nhất
export const dynamic = "force-dynamic"
export const revalidate = 0

// Simple in-memory cache to reduce API calls
const cache = {
  data: new Map<string, any>(),
  timestamp: new Map<string, number>(),
}

// Cache duration in milliseconds (30 seconds để cập nhật nhanh hơn)
const CACHE_DURATION = 30 * 1000

// Hàm chuyển đổi số Excel thành ngày JavaScript
function excelDateToJSDate(excelDate: number) {
  // Excel bắt đầu từ ngày 1/1/1900, nhưng có lỗi năm nhuận nên cần trừ 1
  // JavaScript bắt đầu từ 1/1/1970
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const offsetDays = excelDate - 25569 // 25569 là số ngày từ 1/1/1900 đến 1/1/1970
  return new Date(offsetDays * millisecondsPerDay)
}

// Hàm phân tích ngày tháng từ nhiều định dạng
function parseDate(dateStr: string) {
  // Kiểm tra xem dateStr có phải là số không
  const excelDate = Number(dateStr)
  if (!isNaN(excelDate)) {
    // Nếu là số Excel, chuyển đổi thành đối tượng Date
    const jsDate = excelDateToJSDate(excelDate)
    return {
      day: jsDate.getDate(),
      month: jsDate.getMonth() + 1, // getMonth() trả về 0-11
      year: jsDate.getFullYear(),
    }
  }

  // Nếu không phải số, thử phân tích từ chuỗi DD/MM/YYYY
  const dateParts = dateStr.split("/")
  if (dateParts.length === 3) {
    return {
      day: Number.parseInt(dateParts[0]),
      month: Number.parseInt(dateParts[1]),
      year: Number.parseInt(dateParts[2]),
    }
  }

  // Nếu không phân tích được, trả về null
  return null
}

export async function GET(request: Request) {
  try {
    // Lấy tham số từ URL
    const url = new URL(request.url)
    const month = Number.parseInt(url.searchParams.get("month") || "0")
    const year = Number.parseInt(url.searchParams.get("year") || "0")
    const forceRefresh = url.searchParams.get("refresh") === "true"

    console.log(`API: Fetching transactions for ${month}/${year}${forceRefresh ? " (forced refresh)" : ""}`)

    // Nếu không có tháng hoặc năm, trả về lỗi
    if (!month || !year) {
      console.error("Missing month or year parameters")
      return NextResponse.json(
        {
          success: false,
          error: "Month and year are required",
        },
        { status: 400 },
      )
    }

    // Check cache first (unless force refresh is requested)
    const cacheKey = `transactions-${month}-${year}`
    const now = Date.now()

    if (!forceRefresh && cache.data.has(cacheKey) && now - (cache.timestamp.get(cacheKey) || 0) < CACHE_DURATION) {
      console.log(`Using cached data for ${month}/${year}`)
      return NextResponse.json(cache.data.get(cacheKey), {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    try {
      // Lấy dữ liệu từ Google Sheets - Thêm await để đảm bảo xác thực hoàn tất
      const { sheets } = await initGoogleAPIs()
      const SPREADSHEET_ID = await getSpreadsheetId()
      const SHEET_NAME = "Sheet1"

      console.log(`Fetching data from spreadsheet: ${SPREADSHEET_ID}, sheet: ${SHEET_NAME}`)

      try {
        // Lấy tất cả dữ liệu từ sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A2:L`, // Mở rộng range để bao gồm cả imageUrl
        })

        const rows = response.data.values || []
        console.log(`Found ${rows.length} rows in the sheet`)

        // Debug: In ra một số hàng đầu tiên để kiểm tra
        if (rows.length > 0) {
          console.log("First few rows:", JSON.stringify(rows.slice(0, 3)))
        }

        // Chuyển đổi dữ liệu thành mảng giao dịch
        const transactions = []
        const allTransactions = [] // Lưu tất cả giao dịch để debug

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]

          // Bỏ qua hàng trống
          if (!row || !row[0]) {
            console.log(`Skipping empty row at index ${i}`)
            continue
          }

          // Phân tích ngày tháng
          const dateInfo = parseDate(row[0])

          // Nếu không phân tích được ngày, bỏ qua
          if (!dateInfo) {
            console.log(`Cannot parse date at row ${i}: ${row[0]}`)
            continue
          }

          const transactionMonth = dateInfo.month
          const transactionYear = dateInfo.year

          // Định dạng lại ngày tháng để hiển thị
          const formattedDate = `${dateInfo.day.toString().padStart(2, "0")}/${dateInfo.month.toString().padStart(2, "0")}/${dateInfo.year}`

          // Xử lý amount đúng cách - đảm bảo nó là số
          let amount = 0
          try {
            // Loại bỏ dấu phẩy ngăn cách hàng nghìn nếu có
            const amountStr = (row[3] || "0").toString().replace(/,/g, "").replace(/\s/g, "")
            amount = Number.parseFloat(amountStr)
            if (isNaN(amount)) amount = 0
          } catch (e) {
            console.error(`Error parsing amount at row ${i}:`, row[3], e)
          }

          // Xử lý receiptLink
          let receiptLink = row[5] || null
          if (receiptLink) {
            let fileId = null
            // Extract file ID from various Google Drive URL formats
            if (receiptLink.includes("drive.google.com/file/d/")) {
              fileId = receiptLink.split("/file/d/")[1].split("/")[0]
            } else if (receiptLink.includes("drive.google.com") && receiptLink.includes("id=")) {
              fileId = receiptLink.split("id=")[1]?.split("&")[0]
            } else if (receiptLink.includes("drive.google.com/thumbnail")) {
              fileId = receiptLink.split("id=")[1]?.split("&")[0]
            }

            // If we extracted a file ID, use our proxy
            if (fileId) {
              receiptLink = `/api/image-proxy/${fileId}`
            }
          }

          // Xác định loại giao dịch
          let type = "expense"
          if (row[4] && typeof row[4] === "string") {
            const lowerType = row[4].toLowerCase().trim()
            if (
              lowerType === "income" ||
              lowerType === "thu nhập" ||
              lowerType === "thu" ||
              lowerType === "nhập tiền"
            ) {
              type = "income"
            }
          }

          // Lấy phương thức thanh toán (cột 10 - index 9)
          const paymentMethod = row[9] || "transfer"

          // Lấy ghi chú (cột 11 - index 10)
          const note = row[10] || null

          // Tính toán rowIndex thực tế (vị trí hàng trong bảng tính)
          const actualRowIndex = i + 2 // +2 vì hàng đầu tiên là tiêu đề và index bắt đầu từ 0

          const transaction = {
            id: i.toString(),
            rowIndex: actualRowIndex, // Thêm rowIndex thực tế
            date: formattedDate, // Sử dụng định dạng ngày đã chuẩn hóa
            category: row[1] || "",
            description: row[2] || "",
            amount: amount,
            type: type,
            receiptLink: receiptLink,
            timestamp: row[6] || new Date().toISOString(),
            subCategory: row[7] || null, // Danh mục phụ (cột 8)
            fuelLiters: row[8] || null, // Số lượng/lít xăng (cột 9)
            paymentMethod: paymentMethod, // Phương thức thanh toán (cột 10)
            note: note, // Ghi chú (cột 11)
          }

          // Thêm vào danh sách tất cả giao dịch để debug
          allTransactions.push({
            ...transaction,
            parsedMonth: transactionMonth,
            parsedYear: transactionYear,
            matchesFilter: transactionMonth === month && transactionYear === year,
          })

          // Chỉ thêm vào danh sách giao dịch nếu khớp với tháng và năm
          if (transactionMonth === month && transactionYear === year) {
            console.log(`Adding transaction for ${month}/${year}:`, transaction)
            transactions.push(transaction)
          }
        }

        console.log(`Returning ${transactions.length} transactions for ${month}/${year}`)

        // Prepare response data
        const responseData = {
          success: true,
          transactions,
          debug: {
            requestedMonth: month,
            requestedYear: year,
            totalRowsInSheet: rows.length,
            allTransactions: allTransactions.slice(0, 10), // Chỉ gửi 10 giao dịch đầu tiên để tránh quá nhiều dữ liệu
          },
        }

        // Update cache
        cache.data.set(cacheKey, responseData)
        cache.timestamp.set(cacheKey, now)

        // Trả về cả danh sách giao dịch đã lọc và tất cả giao dịch để debug
        return NextResponse.json(responseData, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })
      } catch (sheetsError: unknown) {
        console.error("Error fetching from Google Sheets:", sheetsError)
        return NextResponse.json(
          {
            success: false,
            error: `Error fetching from Google Sheets: ${sheetsError instanceof Error ? sheetsError.message : 'Unknown error'}`,
            details: sheetsError instanceof Error ? sheetsError.stack : String(sheetsError),
          },
          { status: 500 },
        )
      }
    } catch (googleApiError: unknown) {
      console.error("Error initializing Google APIs:", googleApiError)
      return NextResponse.json(
        {
          success: false,
          error: `Error initializing Google APIs: ${googleApiError instanceof Error ? googleApiError.message : 'Unknown error'}`,
          details: googleApiError instanceof Error ? googleApiError.stack : String(googleApiError),
        },
        { status: 500 },
      )
    }
  } catch (error: unknown) {
    console.error("Error in transactions API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    )
  }
}

// POST method để thêm giao dịch mới
export async function POST(request: NextRequest) {
  try {
    console.log("API: Adding new transaction")

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

    console.log("Form data received:", {
      type, category, description, amount, paymentMethod, date, note, receiptLink, subCategory, fuelLiters
    })

    // Validation
    if (!type || !category || !description || !amount || !paymentMethod || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Khởi tạo Google APIs
    const { sheets } = await initGoogleAPIs()
    const SPREADSHEET_ID = await getSpreadsheetId()
    const SHEET_NAME = "Sheet1"

    // Chuẩn bị dữ liệu để thêm vào Google Sheets
    // Cấu trúc: Ngày, Danh mục, Mô tả, Số tiền, Loại, Link hóa đơn, Thời gian, Danh mục phụ, Số lượng, Phương thức thanh toán, Ghi chú, URL ảnh
    const rowData = [
      date, // Ngày
      category, // Danh mục
      description, // Mô tả
      parseInt(amount), // Số tiền
      type, // Loại (expense/income)
      receiptLink, // Link hóa đơn
      new Date().toISOString(), // Thời gian
      subCategory, // Danh mục phụ
      fuelLiters, // Số lượng (lít xăng)
      paymentMethod, // Phương thức thanh toán
      note, // Ghi chú
      receiptLink // URL ảnh (same as receiptLink for now)
    ]

    console.log("Row data to append:", rowData)

    // Thêm dữ liệu vào Google Sheets
    // Sử dụng insertDataOption để đảm bảo dữ liệu được chèn vào hàng mới
    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS", // Đảm bảo chèn hàng mới thay vì ghi đè
      resource: {
        values: [rowData],
      },
    })

    console.log("Transaction added successfully:", appendResult.data)

    // Clear cache để force refresh
    clearTransactionsCache()

    // Revalidate các trang liên quan
    revalidatePath("/")
    revalidatePath("/transactions")

    return NextResponse.json(
      {
        success: true,
        message: "Transaction added successfully",
        data: {
          type, category, description, amount, paymentMethod, date, note, receiptLink, subCategory, fuelLiters
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
    console.error("Error adding transaction:", error)
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

// DELETE method to delete a transaction
export async function DELETE(request: Request) {
  try {
    console.log('API: Deleting transaction')

    const url = new URL(request.url)
    const rowIndex = url.searchParams.get('rowIndex')
    const imageUrl = url.searchParams.get('imageUrl')

    if (!rowIndex) {
      return NextResponse.json(
        { error: 'Row index is required' },
        { status: 400 }
      )
    }

    // Initialize Google APIs
    const { sheets } = await initGoogleAPIs()
    const spreadsheetId = getSpreadsheetId()

    // Delete row from Google Sheets by clearing the data
    console.log(`Clearing row ${rowIndex} from Google Sheets`)

    let rowCleared = false

    try {
      // Clear entire row to ensure all data including images are removed
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Sheet1!${rowIndex}:${rowIndex}`, // Clear entire row
      })
      console.log(`✅ Row ${rowIndex} cleared successfully`)
      rowCleared = true

    } catch (sheetsError: any) {
      if (sheetsError.code === 404) {
        console.log(`⚠️ Row ${rowIndex} not found or already empty`)
        // Continue with deletion even if row doesn't exist
      } else {
        throw sheetsError // Re-throw other errors
      }
    }

    // Always try to explicitly clear the image URL column to be absolutely sure
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Sheet1!L${rowIndex}`, // Explicitly clear image URL column
      })
      console.log(`✅ Image URL column L${rowIndex} cleared explicitly`)
    } catch (imageColumnError: any) {
      if (imageColumnError.code === 404) {
        console.log(`⚠️ Column L${rowIndex} not found or already empty`)
      } else {
        console.log(`⚠️ Could not clear image URL column: ${imageColumnError.message}`)
      }
    }

    // Delete image from Cloudinary if exists
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      try {
        console.log('Deleting image from Cloudinary:', imageUrl)

        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split('/')
        const publicIdWithExtension = urlParts[urlParts.length - 1]
        const publicId = publicIdWithExtension.split('.')[0]
        const folder = process.env.CLOUDINARY_FOLDER || 'nongvannam'
        const fullPublicId = `${folder}/${publicId}`

        console.log('Extracted public_id:', fullPublicId)

        const deleteResult = await cloudinary.uploader.destroy(fullPublicId)
        console.log('Cloudinary delete result:', deleteResult)

        if (deleteResult.result === 'ok') {
          console.log('✅ Image deleted from Cloudinary successfully')
        } else {
          console.log('⚠️ Image may not exist in Cloudinary:', deleteResult.result)
        }
      } catch (cloudinaryError) {
        console.error('❌ Error deleting image from Cloudinary:', cloudinaryError)
        // Continue with transaction deletion even if image deletion fails
      }
    }

    // Clear cache
    clearTransactionsCache()

    console.log('✅ Transaction deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })

  } catch (error) {
    console.error('❌ Error deleting transaction:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Clear cache function for when data is modified
export function clearTransactionsCache(month?: number, year?: number) {
  if (month && year) {
    // Clear specific month/year cache
    const cacheKey = `transactions-${month}-${year}`
    cache.data.delete(cacheKey)
    cache.timestamp.delete(cacheKey)
  } else {
    // Clear all cache
    cache.data.clear()
    cache.timestamp.clear()
  }
}
