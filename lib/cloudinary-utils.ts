/**
 * Cloudinary utilities for optimized image handling
 */

export interface CloudinaryUrls {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  webp: {
    thumbnail: string;
    medium: string;
    large: string;
  };
}

export interface CloudinaryUploadResponse {
  success: boolean;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  urls?: CloudinaryUrls;
}

/**
 * Generate optimized Cloudinary URLs from a base URL
 */
export function generateCloudinaryUrls(secureUrl: string): CloudinaryUrls {
  if (!secureUrl || !secureUrl.includes('cloudinary.com')) {
    // Return original URL for all sizes if not a Cloudinary URL
    return {
      original: secureUrl,
      thumbnail: secureUrl,
      medium: secureUrl,
      large: secureUrl,
      webp: {
        thumbnail: secureUrl,
        medium: secureUrl,
        large: secureUrl
      }
    };
  }

  const baseUrl = secureUrl.split('/upload/')[0] + '/upload/';
  const publicId = secureUrl.split('/upload/')[1];

  return {
    original: secureUrl,
    thumbnail: `${baseUrl}w_300,h_300,c_fill,q_auto:good/${publicId}`,
    medium: `${baseUrl}w_600,h_600,c_limit,q_auto:good/${publicId}`,
    large: `${baseUrl}w_1200,h_1200,c_limit,q_auto:best/${publicId}`,
    webp: {
      thumbnail: `${baseUrl}w_300,h_300,c_fill,q_auto:good,f_webp/${publicId}`,
      medium: `${baseUrl}w_600,h_600,c_limit,q_auto:good,f_webp/${publicId}`,
      large: `${baseUrl}w_1200,h_1200,c_limit,q_auto:best,f_webp/${publicId}`
    }
  };
}

/**
 * Get the best image URL for a given size and browser support
 */
export function getOptimizedImageUrl(
  secureUrl: string, 
  size: 'thumbnail' | 'medium' | 'large' = 'medium',
  preferWebP: boolean = true
): string {
  const urls = generateCloudinaryUrls(secureUrl);
  
  if (preferWebP && supportsWebP()) {
    return urls.webp[size];
  }
  
  return urls[size];
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Upload image to Cloudinary with optimization
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-cloudinary', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(secureUrl: string): string {
  const urls = generateCloudinaryUrls(secureUrl);
  
  return [
    `${urls.thumbnail} 300w`,
    `${urls.medium} 600w`,
    `${urls.large} 1200w`
  ].join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(): string {
  return [
    '(max-width: 300px) 300px',
    '(max-width: 600px) 600px',
    '1200px'
  ].join(', ');
}

/**
 * Component props for optimized image display
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  size?: 'thumbnail' | 'medium' | 'large';
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

/**
 * Get image props for Next.js Image component
 */
export function getImageProps(
  secureUrl: string,
  alt: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
) {
  const urls = generateCloudinaryUrls(secureUrl);
  
  return {
    src: urls[size],
    alt,
    srcSet: generateSrcSet(secureUrl),
    sizes: generateSizes(),
    loading: 'lazy' as const,
    decoding: 'async' as const
  };
}

/**
 * Validate if URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(secureUrl: string): string | null {
  if (!isCloudinaryUrl(secureUrl)) return null;
  
  try {
    const parts = secureUrl.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathPart = parts[1];
    // Remove version and transformations
    const cleanPath = pathPart.replace(/^v\d+\//, '');
    // Remove file extension
    return cleanPath.replace(/\.[^.]+$/, '');
  } catch {
    return null;
  }
}
