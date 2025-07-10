import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { validateImageFile } from '@/lib/image-utils';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy file ảnh' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert to buffer (compression will be handled server-side if needed)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `expense-receipt-${timestamp}-${randomString}.${fileExtension}`;

    // Direct Google Drive upload
    console.log('Starting Google Drive upload...');

    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')) || '';
    const GOOGLE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';

    console.log('Google Drive config check:', {
      hasEmail: !!GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasKey: !!GOOGLE_PRIVATE_KEY,
      hasFolderId: !!GOOGLE_DRIVE_FOLDER_ID
    });

    // Initialize Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Convert buffer to stream for Google Drive API
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null); // End the stream

    console.log('Buffer converted to stream, uploading...');

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: file.type,
        body: bufferStream,
      },
      fields: 'id,name',
    });

    if (!response.data.id) {
      throw new Error('No file ID returned from Google Drive');
    }

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const driveUrl = `https://drive.google.com/file/d/${response.data.id}/view?usp=sharing`;
    console.log('Upload successful, URL:', driveUrl);

    return NextResponse.json({
      success: true,
      imageUrl: driveUrl,
      fileName,
      originalSize: file.size,
      compressedSize: file.size, // No compression for now
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Lỗi khi upload ảnh. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
