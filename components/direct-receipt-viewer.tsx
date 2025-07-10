"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, ImageIcon, Maximize2, AlertCircle, Download, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DirectReceiptViewerProps {
  receiptLink: string | null
  size?: "sm" | "md" | "lg"
}

export function DirectReceiptViewer({ receiptLink, size = "md" }: DirectReceiptViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  if (!receiptLink) {
    return <span className="text-muted-foreground">Không có</span>
  }

  const iconSize = size === "sm" ? "h-5 w-5" : size === "md" ? "h-6 w-6" : "h-7 w-7"

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group relative"
            title="Xem ảnh hóa đơn"
          >
            <ImageIcon className={`${iconSize} group-hover:scale-110 transition-transform duration-200`} />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="w-full h-full bg-blue-400 rounded-full animate-ping"></div>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0">
          <DialogTitle className="sr-only">Xem ảnh hóa đơn</DialogTitle>
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Image container */}
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 rounded-lg">
              {imageLoading && (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Đang tải ảnh...</p>
                </div>
              )}

              {imageError && (
                <div className="flex flex-col items-center gap-3 p-8">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">Không thể tải ảnh</p>
                    <p className="text-sm text-gray-500 mb-4">Vui lòng thử lại hoặc kiểm tra kết nối mạng</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImageError(false)
                        setImageLoading(true)
                      }}
                    >
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}

              <img
                src={receiptLink}
                alt="Biên lai"
                className={`max-w-full max-h-[80vh] object-contain rounded-lg ${imageLoading || imageError ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>

            {/* Action buttons */}
            {!imageLoading && !imageError && (
              <div className="flex justify-center gap-3 p-4 bg-white border-t">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={receiptLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Mở trong tab mới
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={receiptLink}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Tải xuống
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick view icon */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-green-50 hover:text-green-600 transition-all duration-200 group relative"
        title="Xem nhanh ảnh hóa đơn"
        onClick={() => setIsOpen(true)}
      >
        <Maximize2 className={`${iconSize} group-hover:scale-110 transition-transform duration-200`} />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
        </div>
      </Button>
    </div>
  )
}
