'use client'

import React, { useState, useRef, useEffect } from 'react'


import { useToast } from '@/components/ui/use-toast'

interface MacOSReceiptUploadProps {
  onImageUpload: (imageUrl: string) => void
  disabled?: boolean
}

export function MacOSReceiptUpload({ onImageUpload, disabled = false }: MacOSReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // High-quality compression for very large files (up to 50MB+)
  const compressImage = (file: File, targetSizeMB: number = 6): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const fileSizeMB = file.size / (1024 * 1024)

        // Smart sizing strategy - preserve quality for large files
        let maxSize = 2400 // Higher default for better quality
        let quality = 0.85 // Start with high quality

        if (fileSizeMB > 40) {
          // Very large files (40MB+): Smart compression
          maxSize = 2200 // Still high resolution
          quality = 0.8
        } else if (fileSizeMB > 25) {
          // Large files (25-40MB): Moderate compression
          maxSize = 2300
          quality = 0.82
        } else if (fileSizeMB > 15) {
          // Medium-large files (15-25MB): Light compression
          maxSize = 2400
          quality = 0.85
        }

        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        const originalRatio = width / height

        // Only resize if image is actually larger than maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            width = maxSize
            height = maxSize / originalRatio
          } else {
            height = maxSize
            width = maxSize * originalRatio
          }
        }

        // Ensure dimensions are integers
        width = Math.round(width)
        height = Math.round(height)

        canvas.width = width
        canvas.height = height

        // High-quality rendering
        if (ctx) {
          // Enable high-quality image smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // Optional: Apply slight sharpening filter
          ctx.filter = 'contrast(1.02) brightness(1.01)'

          ctx.drawImage(img, 0, 0, width, height)
        }

        // Progressive compression with quality preservation
        const tryCompress = (currentQuality: number, attempt: number = 1) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })

                const compressedSizeMB = compressedFile.size / (1024 * 1024)
                const compressionRatio = ((fileSizeMB - compressedSizeMB) / fileSizeMB * 100).toFixed(1)

                console.log(`Compression attempt ${attempt}: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${compressionRatio}% reduction, quality: ${(currentQuality * 100).toFixed(0)}%)`)

                // More lenient size check - allow larger files for better quality
                if (compressedSizeMB > targetSizeMB && currentQuality > 0.5 && attempt < 8) {
                  // Reduce quality more gradually for better results
                  const qualityReduction = fileSizeMB > 30 ? 0.05 : 0.08
                  tryCompress(currentQuality - qualityReduction, attempt + 1)
                } else {
                  // Accept the result
                  console.log(`Final compression: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB`)
                  resolve(compressedFile)
                }
              } else {
                console.error('Failed to create blob')
                resolve(file)
              }
            },
            'image/jpeg',
            currentQuality
          )
        }

        tryCompress(quality)
      }

      img.onerror = () => {
        console.error('Error loading image for compression')
        resolve(file)
      }

      // Handle very large files with increased memory
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "❌ File không hợp lệ",
        description: "Vui lòng chọn file ảnh (JPG, PNG, WebP)",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Handle very large files with high-quality compression
      let fileToUpload = file
      const fileSizeMB = file.size / (1024 * 1024)

      if (fileSizeMB > 1) { // Compress files larger than 1MB
        let compressionMessage = "Đang tối ưu ảnh để tải lên nhanh hơn"

        if (fileSizeMB > 30) {
          compressionMessage = "Đang xử lý ảnh rất lớn... Vui lòng đợi trong giây lát"
        } else if (fileSizeMB > 15) {
          compressionMessage = "Đang nén ảnh lớn với chất lượng cao... Có thể mất vài giây"
        } else if (fileSizeMB > 5) {
          compressionMessage = "Đang tối ưu ảnh để giữ chất lượng tốt nhất"
        }

        toast({
          title: "🔄 Đang xử lý ảnh...",
          description: compressionMessage,
        })

        // Smart target size based on original size - allow larger compressed files for quality
        let targetSizeMB = 6 // Default target
        if (fileSizeMB > 40) {
          targetSizeMB = 8 // Allow larger for very big files
        } else if (fileSizeMB > 25) {
          targetSizeMB = 7
        } else if (fileSizeMB > 15) {
          targetSizeMB = 6
        }

        fileToUpload = await compressImage(file, targetSizeMB)

        const compressedSizeMB = fileToUpload.size / (1024 * 1024)
        const compressionRatio = ((fileSizeMB - compressedSizeMB) / fileSizeMB * 100).toFixed(1)

        console.log(`Final result: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${compressionRatio}% reduction)`)

        // Show compression success
        toast({
          title: "✅ Ảnh đã được tối ưu",
          description: `Giảm ${compressionRatio}% dung lượng, giữ chất lượng cao`,
        })
      }

      // Final size check after compression (allow up to 12MB for high quality)
      if (fileToUpload.size > 12 * 1024 * 1024) {
        toast({
          title: "❌ File vẫn quá lớn",
          description: "Không thể nén ảnh xuống dưới 12MB. Vui lòng chọn ảnh có độ phân giải thấp hơn.",
          variant: "destructive"
        })
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append('file', fileToUpload)

      const response = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('File quá lớn. Vui lòng chọn ảnh nhỏ hơn.')
        }
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)
      
      setTimeout(() => {
        onImageUpload(data.secure_url)
        setIsOpen(false)
        setIsUploading(false)
        setUploadProgress(0)

        toast({
          title: "✅ Tải lên thành công",
          description: "Ảnh hóa đơn đã được lưu trữ an toàn",
        })
      }, 500)

    } catch (error) {
      console.error('Upload error:', error)
      setIsUploading(false)
      setUploadProgress(0)

      toast({
        title: "❌ Tải lên thất bại",
        description: error instanceof Error ? error.message : "Không thể tải lên ảnh hóa đơn. Vui lòng thử lại.",
        variant: "destructive"
      })
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
    setIsOpen(false)
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
    setIsOpen(false)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isUploading}
        className="w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-left text-sm sm:text-base"
      >
        {isUploading ? (
          <span className="flex items-center text-gray-700">
            <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Đang tải lên... {uploadProgress}%
          </span>
        ) : (
          <span className="flex items-center text-gray-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Tải Lên Hóa Đơn
          </span>
        )}
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">

          {isUploading ? (
            // Hiển thị tiến trình tải lên
            <div className="px-3 py-2 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-4 h-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-700">Đang tải lên... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Tùy chọn chụp ảnh */}
              <div
                onClick={() => {
                  handleTakePhoto()
                  setIsOpen(false)
                }}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              >
                <span className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Chụp Ảnh
                </span>
              </div>

              {/* Tùy chọn chọn ảnh */}
              <div
                onClick={() => {
                  handleChooseFile()
                  setIsOpen(false)
                }}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <span className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Chọn ảnh
                </span>
              </div>
            </>
          )}
        </div>
      )}


      {/* Input ẩn cho file */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
