"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, ImageIcon, X, Download, AlertCircle } from "lucide-react"

interface ReceiptViewerProps {
  receiptLink: string | null
  size?: "sm" | "md" | "lg"
}

export function ReceiptViewer({ receiptLink, size = "md" }: ReceiptViewerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const resetImageState = () => {
    setImageLoading(true)
    setImageError(false)
  }

  // Convert Google Drive URL to viewable format
  const getViewableImageUrl = (url: string) => {
    if (!url) return url

    // If it's already a Google Drive thumbnail URL, use it
    if (url.includes('drive.google.com/thumbnail')) {
      return url
    }

    // If it's a Google Drive view URL, convert to thumbnail
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) {
        const fileId = fileIdMatch[1]
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
      }
    }

    // If it's a direct Google Drive ID, convert to thumbnail
    if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) {
      return `https://drive.google.com/thumbnail?id=${url}&sz=w1000`
    }

    return url
  }

  const viewableImageUrl = getViewableImageUrl(receiptLink)

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
            title="Xem ảnh hóa đơn"
            onClick={() => {
              setIsDialogOpen(true)
              resetImageState()
            }}
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
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
              <h2 className="text-lg font-medium">Biên lai</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  title="Mở trong tab mới"
                  onClick={() => window.open(receiptLink, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Image container */}
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
              {imageLoading && (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Đang tải...</p>
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
                      onClick={resetImageState}
                    >
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}

              <img
                src={viewableImageUrl}
                alt="Biên lai"
                className={`max-w-full max-h-[70vh] object-contain ${imageLoading || imageError ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>

            {/* Footer with action buttons */}
            {!imageLoading && !imageError && (
              <div className="flex justify-center gap-3 p-4 bg-white border-t rounded-b-lg">
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
    </div>
  )
}
