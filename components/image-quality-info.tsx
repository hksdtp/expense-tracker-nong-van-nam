"use client"

import { Info, Zap, Image as ImageIcon, FileText } from "lucide-react"

interface ImageQualityInfoProps {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  quality: number
}

export function ImageQualityInfo({ 
  originalSize, 
  compressedSize, 
  compressionRatio, 
  quality 
}: ImageQualityInfoProps) {
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`
  }

  const getQualityColor = (ratio: number) => {
    if (ratio >= 80) return "text-green-600"
    if (ratio >= 60) return "text-blue-600"
    if (ratio >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getQualityDescription = (qualityPercent: number) => {
    if (qualityPercent >= 85) return "Chất lượng xuất sắc"
    if (qualityPercent >= 75) return "Chất lượng cao"
    if (qualityPercent >= 65) return "Chất lượng tốt"
    if (qualityPercent >= 50) return "Chất lượng trung bình"
    return "Chất lượng cơ bản"
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium text-blue-900">
            Thông tin nén ảnh
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">Gốc:</span>
              <span className="font-medium">{formatSize(originalSize)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-500" />
              <span className="text-gray-600">Nén:</span>
              <span className="font-medium">{formatSize(compressedSize)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-blue-500" />
              <span className="text-gray-600">Giảm:</span>
              <span className={`font-medium ${getQualityColor(compressionRatio)}`}>
                {compressionRatio.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></span>
              <span className="text-gray-600">Chất lượng:</span>
              <span className="font-medium text-green-600">
                {(quality * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          
          <div className="pt-1 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <span className="font-medium">{getQualityDescription(quality * 100)}</span>
              {" - "}
              <span>Phù hợp cho việc lưu trữ và xem hóa đơn</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
