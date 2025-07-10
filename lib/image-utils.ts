// Client-safe utility functions for image processing
// These functions don't import server-side modules

// Convert Google Drive shareable URL to direct image URL for display
export function getDirectImageUrl(driveUrl: string): string {
  try {
    // Extract file ID from Google Drive URL
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) {
      // If it's already a direct URL or different format, return as is
      return driveUrl;
    }
    
    const fileId = fileIdMatch[1];
    // Return direct image URL for display
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Error getting direct image URL:', error);
    return driveUrl; // Fallback to original URL
  }
}

// Validate image file on client-side
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP.',
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Kích thước file quá lớn. Tối đa 5MB.',
    };
  }
  
  return { isValid: true };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate unique filename for upload
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalName.split('.').pop() || 'jpg';
  
  return `expense-receipt-${timestamp}-${randomString}.${fileExtension}`;
}

// Check if URL is a Google Drive URL
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

// Extract file ID from Google Drive URL
export function extractFileIdFromDriveUrl(url: string): string | null {
  try {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    return fileIdMatch ? fileIdMatch[1] : null;
  } catch (error) {
    console.error('Error extracting file ID:', error);
    return null;
  }
}
