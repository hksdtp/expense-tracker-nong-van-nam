"use client"

import { useState, useRef } from "react"
import { Upload, X, Image, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface ReceiptUploadProps {
  onFileUpload: (fileInfo: {
    fileId: string
    thumbnailLink: string
    directViewLink: string
    downloadLink: string
  }) => void
  onError?: (error: string) => void
}

export function ReceiptUpload({ onFileUpload, onError }: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"]

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

        // Tạo FormData để gửi lên server
        const formData = new FormData()
        formData.append('file', file)
        
        // Thêm loại giao dịch vào formData để phân loại đúng thư mục
        const transactionTypeFromDOM = document.querySelector('button[data-state="active"]')?.textContent?.trim()
        const transactionType = transactionTypeFromDOM === 'Tiền vào' ? 'income' : 'expense'
        formData.append('transactionType', transactionType)
        
        console.log(`Đang tải lên ảnh hóa đơn với loại giao dịch: ${transactionType}`)

        // Giả lập tiến trình upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + Math.random() * 15
            return newProgress > 90 ? 90 : newProgress
          })
        }, 300)

        // Gửi file lên Cloudinary
        const response = await fetch('/api/upload-cloudinary', {
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
            fileId: data.public_id,
            thumbnailLink: data.secure_url,
            directViewLink: data.secure_url,
            downloadLink: data.secure_url,
            imageUrl: data.secure_url, // Cloudinary URL cho Google Sheets
          })

          toast({
            title: "Tải lên thành công",
            description: "Ảnh hóa đơn đã được tải lên Cloudinary",
          })
        } else {
          throw new Error(data.error || 'Lỗi không xác định')
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
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center">
            Kéo thả hoặc nhấp để tải ảnh hóa đơn
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, HEIC, HEIF hoặc WebP (không giới hạn dung lượng)
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <div className="aspect-[4/3] bg-gray-100 relative">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <div className="w-3/4 bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-white text-sm">
                  {uploadProgress.toFixed(0)}%
                </p>
              </div>
            )}
            {uploadSuccess && !isUploading && (
              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-white transition-all duration-200"
            disabled={isUploading}
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      )}
    </div>
  )
}
