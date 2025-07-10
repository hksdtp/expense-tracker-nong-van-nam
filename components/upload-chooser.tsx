"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

export function UploadChooser({
  onSuccess,
}: {
  onSuccess?: (imageData: any) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setUploadResult(null)

    try {
      // Sử dụng Google Drive endpoint
      const endpoint = "/api/upload"

      // Chuẩn bị FormData để gửi tệp
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Gửi request tải lên
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      setUploadResult(data)

      // Gọi callback nếu upload thành công
      if (data.success && onSuccess) {
        onSuccess(data)
      }
    } catch (error: any) {
      console.error("Lỗi khi tải lên:", error)
      setUploadResult({
        success: false,
        error: "Lỗi tải lên: " + (error.message || "Không xác định"),
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div>
          <Input
            id="file-upload"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="mb-2"
          />
          {selectedFile && (
            <p className="text-xs text-gray-500">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>

        <Button onClick={handleUpload} disabled={isUploading || !selectedFile} className="w-full">
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
      </div>

      {uploadResult && (
        <Alert
          variant={uploadResult.success ? "default" : "destructive"}
          className="mt-4"
        >
          <div className="flex items-center">
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2" />
            )}
            <div className="text-sm">
              {uploadResult.success ? "Upload thành công!" : "Upload thất bại"}
            </div>
          </div>
          {uploadResult.success && (
            <div className="mt-2">
              <a
                href={uploadResult.directViewLink || uploadResult.webViewLink || uploadResult.url || uploadResult.fileId}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Xem ảnh
              </a>
            </div>
          )}
          {!uploadResult.success && (
            <p className="text-sm mt-1">{uploadResult.error}</p>
          )}
        </Alert>
      )}
    </div>
  )
}
