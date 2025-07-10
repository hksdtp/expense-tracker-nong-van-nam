import React, { useState, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

interface DirectUploadProps {
  onFileUpload: (fileInfo: {
    fileId: string
    thumbnailLink: string
    directViewLink: string
    downloadLink: string
  }) => void
  onError?: (error: string) => void
}

export function DirectUpload({ onFileUpload, onError }: DirectUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"]
  const MAX_SIZE_CHUNK = 4 * 1024 * 1024 // 4MB chunks để tối ưu cho API giới hạn

  const validateFile = (file: File): boolean => {
    // Kiểm tra loại file
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Loại file không được hỗ trợ",
        description: "Vui lòng chọn file định dạng JPG, PNG, HEIC, HEIF, hoặc WebP",
        variant: "destructive",
      })
      onError?.("Loại file không được hỗ trợ")
      return false
    }

    return true
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileChange({
        target: { files }
      } as any)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!validateFile(file)) return

      try {
        setUploadProgress(0)
        setIsUploading(true)
        
        // Tạo preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Lấy thông tin loại giao dịch để phân loại đúng thư mục
        const transactionTypeFromDOM = document.querySelector('button[data-state="active"]')?.textContent?.trim()
        const transactionType = transactionTypeFromDOM === 'Tiền vào' ? 'income' : 'expense'
        
        // Với file lớn, chia nhỏ thành nhiều chunk và xử lý theo thứ tự
        if (file.size > MAX_SIZE_CHUNK) {
          setUploadProgress(5) // Bắt đầu với 5%
          
          // Bước 1: Khởi tạo phiên tải lên và lấy thông tin upload URL
          const initResponse = await fetch('/api/generate-upload-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type,
              fileSize: file.size,
              transactionType
            }),
          })
          
          if (!initResponse.ok) {
            throw new Error('Không thể khởi tạo phiên tải lên')
          }
          
          const uploadSession = await initResponse.json()
          const { uploadUrl, sessionId } = uploadSession
          
          if (!uploadUrl) {
            throw new Error('Không nhận được URL tải lên')
          }
          
          setUploadProgress(10) // Đã khởi tạo xong
          
          // Bước 2: Chia file thành các phần nhỏ và tải lên từng phần
          const totalChunks = Math.ceil(file.size / MAX_SIZE_CHUNK)
          let uploadedChunks = 0
          
          for (let start = 0; start < file.size; start += MAX_SIZE_CHUNK) {
            const end = Math.min(start + MAX_SIZE_CHUNK, file.size)
            const chunk = file.slice(start, end)
            
            // Tạo header xác định phạm vi byte
            const contentRange = `bytes ${start}-${end-1}/${file.size}`
            
            // Tải lên từng phần
            const chunkResponse = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type,
                'Content-Range': contentRange,
                'X-Upload-Content-Type': file.type
              },
              body: chunk
            })
            
            if (!chunkResponse.ok && chunkResponse.status !== 308) { // 308 là Resume Incomplete
              throw new Error(`Lỗi khi tải lên phần ${uploadedChunks+1}/${totalChunks}`)
            }
            
            uploadedChunks++
            
            // Cập nhật tiến trình: 10% cho khởi tạo, 80% cho quá trình tải lên
            const uploadPercentage = 10 + (uploadedChunks / totalChunks) * 80
            setUploadProgress(uploadPercentage)
          }
          
          // Bước 3: Hoàn tất tải lên và lấy thông tin file
          const finalizeResponse = await fetch('/api/finalize-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              filename: file.name,
              mimeType: file.type,
              transactionType
            }),
          })
          
          if (!finalizeResponse.ok) {
            throw new Error('Không thể hoàn tất quá trình tải lên')
          }
          
          const data = await finalizeResponse.json()
          
          if (data.success) {
            setUploadProgress(100)
            setUploadSuccess(true)
            onFileUpload({
              fileId: data.fileId,
              thumbnailLink: data.thumbnailLink,
              directViewLink: data.directViewLink,
              downloadLink: data.downloadLink,
            })

            toast({
              title: "Tải lên thành công",
              description: "Ảnh hóa đơn đã được tải lên",
            })
          } else {
            throw new Error(data.error || 'Lỗi không xác định')
          }
        } else {
          // Với file nhỏ, sử dụng API hiện tại đã hoạt động tốt
          const formData = new FormData()
          formData.append('file', file)
          formData.append('transactionType', transactionType)
          
          // Giả lập tiến trình upload
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const newProgress = prev + Math.random() * 15
              return newProgress > 90 ? 90 : newProgress
            })
          }, 300)

          // Gửi file lên server
          const response = await fetch('/api/v2/upload-receipt', {
            method: 'POST',
            body: formData,
          })

          clearInterval(progressInterval)

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Lỗi khi tải file')
          }

          const data = await response.json()
          
          if (data.success) {
            setUploadProgress(100)
            setUploadSuccess(true)
            onFileUpload({
              fileId: data.fileId,
              thumbnailLink: data.thumbnailLink,
              directViewLink: data.directViewLink,
              downloadLink: data.downloadLink,
            })

            toast({
              title: "Tải lên thành công",
              description: "Ảnh hóa đơn đã được tải lên",
            })
          } else {
            throw new Error(data.error || 'Lỗi không xác định')
          }
        }
      } catch (error: any) {
        toast({
          title: "Lỗi tải lên",
          description: error.message || "Đã xảy ra lỗi khi tải ảnh lên",
          variant: "destructive",
        })
        setPreviewUrl(null)
        onError?.(error.message || "Đã xảy ra lỗi không xác định")
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setUploadSuccess(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
      />

      {!previewUrl ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center h-32 transition-all duration-300 cursor-pointer bg-gray-50 hover:bg-gray-100",
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center">
            <svg
              className="h-8 w-8 text-gray-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Thả để tải lên" : "Kéo và thả hoặc nhấp để chọn"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Hỗ trợ JPG, PNG, HEIC, HEIF, WebP (cải thiện hỗ trợ file lớn)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-300">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto max-h-72 object-contain"
          />
          
          {isUploading ? (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center">
              <Spinner className="w-6 h-6 text-white" />
              <div className="mt-2 w-full max-w-[80%]">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-white text-xs mt-1 text-center">
                  {uploadProgress.toFixed(0)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                variant="destructive"
                size="icon"
                className="w-8 h-8 rounded-full"
                onClick={handleRemove}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
