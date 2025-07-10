// Đảm bảo API chạy trên Node.js runtime để hỗ trợ Google Drive API
export const runtime = "nodejs"

// Cấu hình API để hỗ trợ tải lên file lớn
// Lưu ý: Cấu hình này sẽ hoạt động với Next.js khi chạy local
// Trên Vercel, sử dụng cấu hình trong vercel.json và next.config.mjs
export const config = {
  api: {
    bodyParser: false, // Sử dụng phân tích cú pháp thủ công
    responseLimit: '20mb',
  },
};

import { NextRequest, NextResponse } from "next/server"
import { getDriveFolderId, initGoogleAPIs } from "@/lib/google-service"
import { Readable } from "stream"

export async function POST(request: NextRequest) {
  console.log("API V2: upload-receipt started on Node.js runtime")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    
    // Lấy thông tin loại giao dịch nếu có (thu/chi)
    const transactionType = formData.get("transactionType") as string || "expense" // Mặc định là chi
    
    if (!file) {
      console.error("Không có file trong request")
      return NextResponse.json(
        { success: false, error: "Không tìm thấy file" }, 
        { status: 400 }
      )
    }
    
    console.log(`Nhận file: ${file.name}, kích thước: ${file.size} bytes, loại: ${file.type}`)
    
    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      console.error(`Loại file không hợp lệ: ${file.type}`)
      return NextResponse.json(
        { success: false, error: "Chỉ hỗ trợ tệp hình ảnh" }, 
        { status: 400 }
      )
    }
    
    // Cho phép tải lên file lớn - tăng giới hạn lên 20MB
    if (file.size > 20 * 1024 * 1024) {
      console.error(`File quá lớn: ${file.size} bytes (${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
      return NextResponse.json(
        { success: false, error: `File quá lớn (${(file.size / (1024 * 1024)).toFixed(2)}MB). Giới hạn là 20MB.` }, 
        { status: 413 }
      )
    } else if (file.size > 10 * 1024 * 1024) {
      console.log(`Cảnh báo: File có kích thước lớn: ${file.size} bytes (${(file.size / (1024 * 1024)).toFixed(2)}MB)`)
    }
    
    try {
      // Khởi tạo API Google
      const { drive } = await initGoogleAPIs()
      const ROOT_FOLDER_ID = await getDriveFolderId()
      console.log(`Sử dụng thư mục gốc Drive ID: ${ROOT_FOLDER_ID}`)
      
      // Tạo cấu trúc thư mục phân loại
      const currentDate = new Date()
      const year = currentDate.getFullYear().toString()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      
      // Tên thư mục năm (VD: 2025)
      let yearFolderId = await getOrCreateFolder(drive, year, ROOT_FOLDER_ID)
      
      // Tên thư mục tháng (VD: 04-2025)
      const monthFolderName = `${month}-${year}`
      let monthFolderId = await getOrCreateFolder(drive, monthFolderName, yearFolderId)
      
      // Tên thư mục loại giao dịch (VD: Thu hoặc Chi)
      const typeFolderName = transactionType === "income" ? "Thu" : "Chi"
      let typeFolderId = await getOrCreateFolder(drive, typeFolderName, monthFolderId)
      
      console.log(`Cấu trúc thư mục: ${year}/${monthFolderName}/${typeFolderName}`)
      
      // Tạo tên file duy nhất
      const uniqueFilename = `hoa_don_${Date.now()}_${file.name.replace(/\s+/g, "_")}`
      
      // Chuyển file thành ArrayBuffer và Buffer để upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log(`Đã chuyển file thành buffer, kích thước: ${buffer.length} bytes`)
      
      // Upload file lên Drive vào thư mục đã phân loại
      console.log(`Đang tải lên file: ${uniqueFilename} lên thư mục: ${typeFolderId}`)
      const uploadResponse = await drive.files.create({
        requestBody: {
          name: uniqueFilename,
          parents: [typeFolderId],
          mimeType: file.type
        },
        media: {
          mimeType: file.type,
          body: Readable.from(buffer)
        },
        fields: "id,webViewLink,webContentLink"
      })
      
      console.log(`Upload thành công, ID file: ${uploadResponse.data.id}`)
      const fileId = uploadResponse.data.id
      
      // Đặt quyền truy cập công khai
      if (fileId) {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: "reader",
            type: "anyone"
          }
        })
        console.log("Đã cấp quyền công khai cho file")
      }
      
      // Tạo các link truy cập ảnh
      const webViewLink = uploadResponse.data.webViewLink || ""  // Link xem trong Google Drive
      const webContentLink = uploadResponse.data.webContentLink || ""  // Link tải xuống
      const directViewLink = `https://drive.google.com/uc?export=view&id=${fileId}`  // Link trực tiếp xem ảnh
      const thumbnailLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`  // Link thumbnail
      const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`  // Link tải xuống trực tiếp
      
      console.log(`Đã tạo các link: WebView: ${webViewLink}, DirectView: ${directViewLink}`)
      
      // Trả về thông tin thành công
      return NextResponse.json({
        success: true,
        fileId,
        webViewLink,
        webContentLink,
        directViewLink,
        thumbnailLink,
        downloadLink,
        folderPath: `${year}/${monthFolderName}/${typeFolderName}` // Trả về đường dẫn thư mục để lưu trữ
      })
      
    } catch (driveError: any) {
      console.error("Lỗi Google Drive API:", driveError)
      console.error("Chi tiết lỗi:", driveError.response?.data || driveError.message)
      return NextResponse.json({
        success: false,
        error: `Lỗi Google Drive: ${driveError.message || "Không xác định"}`,
        details: driveError.response?.data || driveError.stack
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error("Lỗi tải file lên:", error)
    
    return NextResponse.json({
      success: false,
      error: `Lỗi khi xử lý tải lên: ${error.message || "Không xác định"}`,
      details: error.stack || "Không có thông tin chi tiết"
    }, { status: 500 })
  }
}

// Hàm tìm hoặc tạo thư mục trong Google Drive
async function getOrCreateFolder(drive: any, folderName: string, parentId: string): Promise<string> {
  try {
    // Tìm thư mục nếu đã tồn tại
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    })

    // Nếu đã có thư mục, trả về ID
    if (response.data.files.length > 0) {
      console.log(`Đã tìm thấy thư mục: ${folderName}, ID: ${response.data.files[0].id}`)
      return response.data.files[0].id
    }

    // Nếu chưa có thư mục, tạo mới
    const folderResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id'
    })

    console.log(`Đã tạo thư mục mới: ${folderName}, ID: ${folderResponse.data.id}`)
    return folderResponse.data.id
  } catch (error) {
    console.error(`Lỗi khi tìm/tạo thư mục ${folderName}:`, error)
    throw error
  }
}
