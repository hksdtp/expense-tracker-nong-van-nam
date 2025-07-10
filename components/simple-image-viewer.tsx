"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogTitle, // Thêm DialogTitle vào imports
} from "@/components/ui/dialog"
import { X } from "lucide-react"

interface SimpleImageViewerProps {
  imageUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SimpleImageViewer({ imageUrl, open, onOpenChange }: SimpleImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [open, imageUrl])

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black">
        <DialogHeader className="p-2 absolute top-0 right-0 z-10">
          <DialogClose className="rounded-full bg-black/50 hover:bg-black/70 p-2 text-white transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        {/* Thêm DialogTitle nhưng ẩn đi để đảm bảo accessible */}
        <DialogTitle className="sr-only">Hình ảnh biên lai</DialogTitle>

        <div className="relative flex items-center justify-center min-h-[300px] w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
              <div className="text-white text-center p-4">
                <p className="text-lg font-medium">Không thể tải ảnh</p>
                <p className="text-sm text-gray-400">Vui lòng thử lại sau</p>
              </div>
            </div>
          )}
          
          <img
            src={imageUrl}
            alt="Hóa đơn"
            className="max-h-[80vh] max-w-full object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: isLoading || hasError ? 'none' : 'block' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
