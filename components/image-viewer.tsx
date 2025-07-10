"use client"

import { useState } from 'react';
import { X, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getDirectImageUrl } from '@/lib/image-utils';
import { getOptimizedImageUrl, generateCloudinaryUrls, isCloudinaryUrl } from '@/lib/cloudinary-utils';

interface ImageViewerProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  showZoom?: boolean;
}

export function ImageViewer({ 
  imageUrl, 
  alt = "Receipt image", 
  className = "",
  showZoom = true 
}: ImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use optimized Cloudinary URL if available, otherwise fallback to direct URL
  const directImageUrl = isCloudinaryUrl(imageUrl)
    ? getOptimizedImageUrl(imageUrl, 'medium', true)
    : getDirectImageUrl(imageUrl);

  // For fullscreen, use large size
  const fullscreenImageUrl = isCloudinaryUrl(imageUrl)
    ? getOptimizedImageUrl(imageUrl, 'large', true)
    : directImageUrl;

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Không thể tải ảnh</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
            <div className="animate-pulse">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        )}
        
        <img
          src={directImageUrl}
          alt={alt}
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {showZoom && !isLoading && !imageError && (
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <ZoomIn className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Fullscreen modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <img
              src={fullscreenImageUrl}
              alt={alt}
              className="w-full h-auto max-h-[90vh] object-contain"
              onError={handleImageError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact image viewer for lists
export function CompactImageViewer({
  imageUrl,
  alt = "Receipt",
  size = "w-12 h-12"
}: {
  imageUrl: string;
  alt?: string;
  size?: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Use thumbnail for compact view
  const thumbnailUrl = isCloudinaryUrl(imageUrl)
    ? getOptimizedImageUrl(imageUrl, 'thumbnail', true)
    : getDirectImageUrl(imageUrl);

  // Use large for fullscreen
  const fullscreenUrl = isCloudinaryUrl(imageUrl)
    ? getOptimizedImageUrl(imageUrl, 'large', true)
    : getDirectImageUrl(imageUrl);

  if (imageError) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center ${size}`}>
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative group cursor-pointer ${size} flex-shrink-0`}
        onClick={() => setIsFullscreen(true)}
      >
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
          <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-0">
          <div className="relative">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={fullscreenUrl}
              alt={alt}
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
