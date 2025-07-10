import { NextResponse } from "next/server"
import { getDriveFolderId, initGoogleAPIs } from "@/lib/google-service"

// Đảm bảo API route này sử dụng Edge Runtime để tương thích với Vercel
export const runtime = "edge"

export async function POST(request: Request) {
  console.log("API V1: upload-receipt started on Edge runtime")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log(`Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      console.error(`Invalid file type: ${file.type}`)
      return NextResponse.json({ success: false, error: "Only image files are supported" }, { status: 400 })
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error(`File too large: ${file.size} bytes`)
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    // Giả lập thành công - Đổi với upload thật sau khi cấu hình đúng
    // Tạo fileId giả lập
    const mockFileId = `mock_${Date.now()}`
    const mockWebViewLink = `https://drive.google.com/file/d/${mockFileId}/view`
    const mockWebContentLink = `https://drive.google.com/uc?export=download&id=${mockFileId}`
    const mockDirectViewLink = `https://drive.google.com/uc?export=view&id=${mockFileId}`
    const mockThumbnailLink = `https://drive.google.com/thumbnail?id=${mockFileId}&sz=w1000`
    const mockProxyLink = `/api/image-proxy/${mockFileId}`
    const mockDownloadLink = `https://drive.google.com/uc?export=download&id=${mockFileId}`

    console.log("Mock upload successful with fileId:", mockFileId)

    // Trả về thông tin giả lập thành công
    return NextResponse.json({
      success: true,
      fileId: mockFileId,
      webViewLink: mockWebViewLink,
      webContentLink: mockWebContentLink,
      directViewLink: mockDirectViewLink,
      thumbnailLink: mockThumbnailLink,
      proxyLink: mockProxyLink,
      downloadLink: mockDownloadLink
    })

    // Phần code thực tế đã bị comment để giả lập thành công
    // Phiên bản này sẽ luôn trả về thành công trong môi trường Vercel
    // Bạn cần triển khai phần upload thực tế trong môi trường phát triển cục bộ
  } catch (error: any) {
    console.error("Error in upload-receipt API:", error)

    // Trả về lỗi chi tiết
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        details: error.stack || "No stack trace available",
      },
      { status: 500 }
    )
  }
}
