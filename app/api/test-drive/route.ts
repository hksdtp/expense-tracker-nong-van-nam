import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Test Google Drive connection
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')) || '';
    const GOOGLE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';

    console.log('Testing Google Drive connection...');
    console.log('Service Account Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Private Key Length:', GOOGLE_PRIVATE_KEY.length);
    console.log('Folder ID:', GOOGLE_DRIVE_FOLDER_ID);

    // Initialize Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Test connection by listing files in the folder
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      pageSize: 5,
      fields: 'files(id, name)',
    });

    // Test simple file upload
    const testBuffer = Buffer.from('This is a test file for Google Drive upload', 'utf8');
    const testResponse = await drive.files.create({
      requestBody: {
        name: 'test-upload.txt',
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'text/plain',
        body: testBuffer,
      },
      fields: 'id,name',
    });

    return NextResponse.json({
      success: true,
      message: 'Google Drive connection and upload test successful',
      folderFiles: response.data.files,
      testUpload: testResponse.data,
      config: {
        hasEmail: !!GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasPrivateKey: !!GOOGLE_PRIVATE_KEY,
        hasFolderId: !!GOOGLE_DRIVE_FOLDER_ID,
        privateKeyFormat: GOOGLE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----') ? 'valid' : 'invalid'
      }
    });

  } catch (error) {
    console.error('Google Drive test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    }, { status: 500 });
  }
}
