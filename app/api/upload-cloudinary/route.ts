import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== CLOUDINARY UPLOAD API ===')
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary configuration')
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 12MB after compression for high quality)
    const maxSize = 12 * 1024 * 1024 // 12MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size)
      return NextResponse.json(
        { error: 'File size must be less than 12MB after compression' },
        { status: 413 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('File converted to buffer, uploading to Cloudinary...')

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: process.env.CLOUDINARY_FOLDER || 'expense-receipts',
          chunk_size: 8000000, // 8MB chunks for very large files
          timeout: 180000, // 3 minutes timeout for very large files
          transformation: [
            { width: 2400, height: 2400, crop: 'limit' }, // Higher max dimensions for quality
            { quality: 'auto:best' }, // Best quality for important documents
            { format: 'auto' }, // Auto choose best format (WebP/AVIF)
            { fetch_format: 'auto' }, // Auto format for delivery
            { dpr: 'auto' }, // Auto device pixel ratio
            { flags: 'progressive' }, // Progressive loading
            { unsharp_mask: '0.3:0.3:0.3' } // Light sharpening to preserve quality
          ],
          tags: ['receipt', 'expense-tracking', 'auto-optimized'],
          context: {
            purpose: 'expense-receipt',
            uploaded_at: new Date().toISOString()
          },
          // Generate multiple sizes for responsive display
          eager: [
            { width: 300, height: 300, crop: 'fill', quality: 'auto:best', unsharp_mask: '0.3:0.3:0.3' }, // Thumbnail nét
            { width: 800, height: 800, crop: 'limit', quality: 'auto:best', unsharp_mask: '0.4:0.4:0.4' }, // Medium nét
            { width: 2048, height: 2048, crop: 'limit', quality: 'auto:best', unsharp_mask: '0.5:0.5:0.5' } // Full size siêu nét
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('Cloudinary upload success:', result?.public_id)
            resolve(result)
          }
        }
      ).end(buffer)
    })

    console.log('Upload completed successfully')

    const result = uploadResponse as any;

    // Generate optimized URLs for different use cases
    const baseUrl = result.secure_url.split('/upload/')[0] + '/upload/';
    const publicId = result.public_id;

    return NextResponse.json({
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      // Optimized URLs for different sizes
      urls: {
        original: result.secure_url,
        thumbnail: `${baseUrl}w_300,h_300,c_fill,q_auto:good/${publicId}`,
        medium: `${baseUrl}w_600,h_600,c_limit,q_auto:good/${publicId}`,
        large: `${baseUrl}w_1200,h_1200,c_limit,q_auto:best/${publicId}`,
        // WebP versions for modern browsers
        webp: {
          thumbnail: `${baseUrl}w_300,h_300,c_fill,q_auto:good,f_webp/${publicId}`,
          medium: `${baseUrl}w_600,h_600,c_limit,q_auto:good,f_webp/${publicId}`,
          large: `${baseUrl}w_1200,h_1200,c_limit,q_auto:best,f_webp/${publicId}`
        }
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
