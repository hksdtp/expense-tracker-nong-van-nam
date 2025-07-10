"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface GoogleDriveUploaderProps {
  onSuccess?: (imageData: any) => void
}

export function GoogleDriveUploader({ onSuccess }: GoogleDriveUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      return
    }

    setIsUploading(true)

    try {
      // Chuẩn bị FormData để gửi tệp
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Gửi request tải lên
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success && onSuccess) {
        onSuccess(data)
        toast({
          title: "Thành công",
          description: "Đã tải lên ảnh hóa đơn",
        })
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setSelectedFile(null)
      } else {
        throw new Error(data.error || "Lỗi không xác định")
      }
    } catch (error: any) {
      console.error("Lỗi khi tải lên:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải ảnh lên",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
        disabled={isUploading}
      >
        {selectedFile ? selectedFile.name : "Chọn ảnh"}
      </Button>

      {selectedFile && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-pink-100 border border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload ảnh
            </>
          )}
        </Button>
      )}
    </div>
  )
}
