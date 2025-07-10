// Simple test for Google Drive connection
const { google } = require('googleapis');

async function testGoogleDrive() {
  try {
    console.log('Testing Google Drive connection...');
    
    // Get environment variables
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
    const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')) || '';
    const GOOGLE_DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';

    console.log('Service Account Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Private Key Length:', GOOGLE_PRIVATE_KEY.length);
    console.log('Folder ID:', GOOGLE_DRIVE_FOLDER_ID);
    console.log('Private Key starts with:', GOOGLE_PRIVATE_KEY.substring(0, 50));

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
    console.log('Attempting to list files in folder...');
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      pageSize: 5,
      fields: 'files(id, name)',
    });

    console.log('Success! Files in folder:', response.data.files);
    
    // Test creating a simple text file
    console.log('Testing file creation...');
    const testFileResponse = await drive.files.create({
      requestBody: {
        name: 'test-file.txt',
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'text/plain',
        body: 'This is a test file',
      },
      fields: 'id',
    });

    console.log('Test file created with ID:', testFileResponse.data.id);
    
    // Generate shareable link
    const shareResponse = await drive.permissions.create({
      fileId: testFileResponse.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const shareableUrl = `https://drive.google.com/file/d/${testFileResponse.data.id}/view?usp=sharing`;
    console.log('Shareable URL:', shareableUrl);

    return {
      success: true,
      fileId: testFileResponse.data.id,
      shareableUrl
    };

  } catch (error) {
    console.error('Google Drive test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testGoogleDrive().then(result => {
  console.log('Test result:', result);
  process.exit(result.success ? 0 : 1);
});
