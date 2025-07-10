"use client"

import { useState, useRef } from 'react';
import { Camera, FolderOpen, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { validateImageFile } from '@/lib/image-utils';
import { MacOSReceiptUpload } from './macos-receipt-upload';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onImageRemoved?: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  onImageUploaded,
  currentImageUrl,
  onImageRemoved,
  disabled = false
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (imageUrl: string) => {
    onImageUploaded(imageUrl);

    toast({
      title: "Thành công",
      description: "Đã tải lên ảnh hóa đơn thành công",
    });
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemoved?.();
  };

  if (currentImageUrl || previewUrl) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Ảnh hóa đơn</label>
        <div className="relative">
          <div className="relative w-full h-32 bg-gray-50/80 border border-gray-200/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            {currentImageUrl || previewUrl ? (
              <img
                src={currentImageUrl || previewUrl || ''}
                alt="Receipt preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm">
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Không thể tải ảnh</span>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500/90 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Ảnh hóa đơn</label>

      {/* macOS Style Upload Dropdown */}
      <MacOSReceiptUpload
        onImageUpload={handleImageUpload}
        disabled={disabled}
      />
    </div>
  );
}
