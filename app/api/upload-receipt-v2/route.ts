import { NextResponse } from "next/server"
import { getDriveFolderId, initGoogleAPIs } from "@/lib/google-service"
import { google } from "googleapis"
import { randomUUID } from "crypto"

// Đảm bảo API route này chạy trong Node.js runtime
export const runtime = "nodejs"

// Định nghĩa các loại file được phép
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  console.log("API: upload-receipt-v2 started")

  try {
    // Log thông tin request
    console.log("Receipt upload started", {
      contentType: request.headers.get("content-type"),
      contentLength: request.headers.get("content-length"),
    })

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    // Lấy thông tin giao dịch nếu có
    const transactionType = formData.get("transactionType") as string || "expense" // mặc định là chi
    const transactionDate = formData.get("transactionDate") as string || new Date().toISOString()
    
    // Tạo đối tượng Date từ chuỗi ngày (hỗ trợ nhiều định dạng)
    let dateObj: Date
    if (transactionDate) {
      // Kiểm tra nếu là định dạng dd/mm/yyyy
      if (transactionDate.includes('/')) {
        const parts = transactionDate.split('/')
        if (parts.length === 3) {
          dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        } else {
          dateObj = new Date()
        }
      } else {
        dateObj = new Date(transactionDate)
      }
    } else {
      dateObj = new Date()
    }
    
    // Trích xuất năm và tháng
    const year = dateObj.getFullYear()
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0') // tháng 01-12

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json(
        {
          success: false,
          error: "Không có file được cung cấp",
        },
        { status: 400 },
      )
    }

    console.log(`Received file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Kiểm tra loại file
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`)
      return NextResponse.json(
        {
          success: false,
          error: "Định dạng file không được hỗ trợ. Vui lòng sử dụng JPEG, PNG hoặc PDF.",
        },
        { status: 400 },
      )
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    if (file.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${file.size} bytes`)
      return NextResponse.json(
        {
          success: false,
          error: "Kích thước file vượt quá 5MB",
        },
        { status: 400 },
      )
    }

    // Lấy thông tin từ biến môi trường
    const DRIVE_FOLDER_ID = await getDriveFolderId()
    
    // Sử dụng hàm khởi tạo Google APIs từ lib thay vì tạo mới
    console.log("Initializing Google Drive API")
    const { drive } = await initGoogleAPIs()

    // Tìm hoặc tạo thư mục cho năm
    console.log(`Checking for year folder: ${year}`)
    const yearFolderPromise = findOrCreateFolder(drive, DRIVE_FOLDER_ID, year.toString())
    const yearFolderId = await yearFolderPromise
    
    // Tìm hoặc tạo thư mục cho tháng
    console.log(`Checking for month folder: ${month}`)
    const monthFolderPromise = findOrCreateFolder(drive, yearFolderId, month)
    const monthFolderId = await monthFolderPromise
    
    // Tìm hoặc tạo thư mục cho loại giao dịch
    const transactionTypeName = transactionType === 'income' ? 'Tiền vào' : 'Tiền ra'
    console.log(`Checking for transaction type folder: ${transactionTypeName}`)
    const typeFolderPromise = findOrCreateFolder(drive, monthFolderId, transactionTypeName)
    const typeFolderId = await typeFolderPromise

    // Chuyển file thành ArrayBuffer và Buffer
    console.log("Converting file to buffer")
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`Converted file to buffer, size: ${buffer.length} bytes`)

    // Xử lý file theo loại
    console.log(`Processing file of type: ${file.type}`)

    // Tạo tên file duy nhất với UUID
    const fileExtension =
      file.name.split(".").pop() ||
      (file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "application/pdf"
            ? "pdf"
            : "bin")

    const uniqueFilename = `receipt_${Date.now()}_${randomUUID()}.${fileExtension}`
    console.log(`Generated unique filename: ${uniqueFilename}`)

    // Tạo metadata cho file
    const fileMetadata = {
      name: uniqueFilename,
      parents: [typeFolderId], // Lưu vào thư mục loại giao dịch
      mimeType: file.type,
    }

    // Tải lên file với metadata và dữ liệu nhị phân
    console.log("Uploading to Google Drive using direct buffer...")
    try {
      const uploadResponse = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: file.type,
          body: buffer, // Sử dụng buffer trực tiếp thay vì base64
        },
        fields: "id,webViewLink,webContentLink",
      })

      console.log(`File uploaded successfully, ID: ${uploadResponse.data.id}`)
      const fileId = uploadResponse.data.id || ""

      if (fileId) {
        // Đặt quyền truy cập công khai
        console.log("Setting file permissions to public...")
        try {
          await drive.permissions.create({
            fileId: fileId,
            requestBody: {
              role: "reader",
              type: "anyone",
            },
          })
          console.log("File permissions updated to be publicly accessible")

          // Kiểm tra lại quyền truy cập
          try {
            const permissionsResponse = await drive.permissions.list({
              fileId: fileId,
            })
            
            if (permissionsResponse && permissionsResponse.data && permissionsResponse.data.permissions) {
              console.log("Current permissions:", JSON.stringify(permissionsResponse.data.permissions))
            }
          } catch (permError: any) {
            console.warn("Could not verify permissions, but continuing:", permError.message)
          }
        } catch (permError: any) {
          console.warn("Error setting permissions, but continuing with upload:", permError.message)
        }

        // Tạo các URL khác nhau để truy cập ảnh
        const webViewLink = uploadResponse.data.webViewLink || "" // Link xem trong Google Drive
        const webContentLink = uploadResponse.data.webContentLink || "" // Link tải xuống
        const directViewLink = `https://drive.google.com/uc?export=view&id=${fileId}` // Link trực tiếp để xem ảnh
        const thumbnailLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` // Link thumbnail
        const proxyLink = `/api/image-proxy/${fileId}` // Link qua proxy của ứng dụng

        console.log("Generated links:", {
          webViewLink,
          webContentLink,
          directViewLink,
          thumbnailLink,
          proxyLink,
        })

        return NextResponse.json({
          success: true,
          fileId: fileId,
          webViewLink: webViewLink,
          webContentLink: webContentLink,
          directViewLink: directViewLink,
          thumbnailLink: thumbnailLink,
          proxyLink: proxyLink,
          folderInfo: {
            year: year,
            month: month,
            type: transactionTypeName
          }
        })
      } else {
        throw new Error("Upload succeeded but file ID was not returned")
      }
    } catch (uploadError: any) {
      console.error("Error during file upload to Google Drive:", uploadError)
      console.error("Error details:", uploadError.response?.data || uploadError.message || "Unknown error")
      throw uploadError
    }
  } catch (error: any) {
    console.error("Error uploading file:", error)
    console.error("Error stack:", error.stack || "No stack trace available")
    console.error("Error details:", error.response?.data || error.message || "Unknown error")

    // Trả về thông báo lỗi thân thiện với người dùng
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi xử lý hóa đơn. Vui lòng thử lại.",
        technicalDetails: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Hàm tìm hoặc tạo thư mục trong Google Drive
async function findOrCreateFolder(drive: any, parentId: string, folderName: string): Promise<string> {
  try {
    // Kiểm tra xem thư mục đã tồn tại chưa
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    // Nếu thư mục đã tồn tại, trả về ID
    if (response.data.files.length > 0) {
      console.log(`Folder "${folderName}" already exists with ID: ${response.data.files[0].id}`)
      return response.data.files[0].id
    }

    // Nếu chưa có, tạo thư mục mới
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    }

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    })

    console.log(`Created new folder "${folderName}" with ID: ${folder.data.id}`)
    return folder.data.id
  } catch (error: any) {
    console.error(`Error finding/creating folder "${folderName}":`, error)
    throw error
  }
}
