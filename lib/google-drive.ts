import { google } from 'googleapis';
import sharp from 'sharp';
import { Readable } from 'stream';

// Google Drive configuration - sử dụng cùng credentials với Google Sheets
const GOOGLE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')) || '';

// Initialize Google Drive API
function getGoogleDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

// Compress image using Sharp
async function compressImage(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  try {
    let sharpInstance = sharp(imageBuffer);

    // Get image metadata
    const metadata = await sharpInstance.metadata();
    const { width, height } = metadata;

    // Resize if image is too large
    if (width && height && (width > 1920 || height > 1920)) {
      sharpInstance = sharpInstance.resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Compress based on format
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      sharpInstance = sharpInstance.jpeg({ quality: 85 });
    } else if (mimeType.includes('png')) {
      sharpInstance = sharpInstance.png({ quality: 85 });
    } else if (mimeType.includes('webp')) {
      sharpInstance = sharpInstance.webp({ quality: 85 });
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original buffer if compression fails
    return imageBuffer;
  }
}

// Simplified upload function for testing
export async function uploadImageToDrive(
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  try {
    console.log('Starting Google Drive upload...');
    console.log('File name:', fileName);
    console.log('MIME type:', mimeType);
    console.log('Buffer size:', imageBuffer.length);

    const drive = getGoogleDriveClient();

    // Create file metadata
    const fileMetadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    console.log('File metadata:', fileMetadata);

    // Simple upload without compression for now
    console.log('Attempting file upload...');
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: imageBuffer,
      },
      fields: 'id,name',
    });

    console.log('Upload response:', response.data);

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Failed to get file ID from Google Drive');
    }

    // Make file publicly viewable
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return shareable link
    const shareableLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    return shareableLink;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    throw new Error(`Failed to upload image to Google Drive: ${error.message}`);
  }
}

// Get direct image URL for display
export function getDirectImageUrl(driveUrl: string): string {
  try {
    // Extract file ID from Google Drive URL
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) {
      throw new Error('Invalid Google Drive URL');
    }
    
    const fileId = fileIdMatch[1];
    // Return direct image URL for display
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Error getting direct image URL:', error);
    return driveUrl; // Fallback to original URL
  }
}

// Delete image from Google Drive
export async function deleteImageFromDrive(driveUrl: string): Promise<boolean> {
  try {
    const drive = getGoogleDriveClient();
    
    // Extract file ID from URL
    const fileIdMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) {
      throw new Error('Invalid Google Drive URL');
    }
    
    const fileId = fileIdMatch[1];
    
    // Delete file
    await drive.files.delete({
      fileId,
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    return false;
  }
}

// Note: validateImageFile moved to lib/image-utils.ts for client-side use
