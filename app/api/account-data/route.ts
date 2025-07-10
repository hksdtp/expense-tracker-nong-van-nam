import { NextResponse } from "next/server"
import { calculateAccountData } from "@/lib/data"

// Đảm bảo API route này chạy trong Node.js runtime
export const runtime = "nodejs"

// Ngăn chặn caching để luôn lấy dữ liệu mới nhất
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  console.log("=== ACCOUNT DATA API CALLED ===")
  try {
    // Lấy tham số từ URL
    const url = new URL(request.url)
    const month = Number.parseInt(url.searchParams.get("month") || "0")
    const year = Number.parseInt(url.searchParams.get("year") || "0")

    console.log(`API: Lấy dữ liệu tài khoản cho tháng ${month}/${year}`)
    console.log(`URL: ${request.url}`)

    // Nếu không có tháng hoặc năm, trả về lỗi
    if (!month || !year) {
      console.error("Thiếu tham số tháng hoặc năm")
      return NextResponse.json(
        {
          success: false,
          error: "Tháng và năm là bắt buộc",
        },
        { status: 400 },
      )
    }

    try {
      console.log("Bắt đầu tính toán dữ liệu tài khoản...")
      // Tính toán dữ liệu tài khoản
      const data = await calculateAccountData(month, year)
      console.log("API: Dữ liệu tài khoản đã tính toán:", data)

      // Trả về dữ liệu tài khoản - CHÚ Ý: Trả về trực tiếp trong data, không phải accountData
      return NextResponse.json(
        {
          success: true,
          data, // Trả về trực tiếp, không bọc trong accountData
          source: "calculated",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    } catch (err) {
      console.error("Lỗi khi tính toán dữ liệu tài khoản:", err)
      console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace")
      // Xử lý đúng cách error có kiểu unknown
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định khi tính toán dữ liệu tài khoản"
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: err instanceof Error ? err.stack : "No details",
        },
        { status: 500 },
      )
    }
  } catch (err) {
    console.error("Lỗi API:", err)
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace")
    // Xử lý đúng cách error có kiểu unknown
    const errorMessage = err instanceof Error ? err.message : "Lỗi API không xác định"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: err instanceof Error ? err.stack : "No details",
      },
      { status: 500 },
    )
  }
}
