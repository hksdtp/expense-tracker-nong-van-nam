#!/usr/bin/env node

/**
 * Test Cloudinary upload API
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { default: fetch } = require('node-fetch');

console.log('🧪 Testing Cloudinary Upload API...\n');

// Test với một ảnh test nhỏ
const createTestImage = () => {
  // Tạo một ảnh PNG nhỏ (1x1 pixel) để test
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngData;
};

const testUpload = async () => {
  try {
    console.log('📋 Creating test image...');
    const testImageBuffer = createTestImage();
    
    console.log('📋 Preparing form data...');
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test-receipt.png',
      contentType: 'image/png'
    });

    console.log('📋 Sending upload request...');
    const response = await fetch('http://localhost:3000/api/upload-cloudinary', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    console.log(`📋 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Upload failed: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log(`✅ Secure URL: ${result.secure_url}`);
    console.log(`✅ Public ID: ${result.public_id}`);
    console.log(`✅ Dimensions: ${result.width}x${result.height}`);
    console.log(`✅ Format: ${result.format}`);
    console.log(`✅ Size: ${result.bytes} bytes`);
    
    return true;

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
};

const checkEnvironment = () => {
  console.log('📋 Checking environment variables...');
  
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log(`❌ Missing environment variables: ${missing.join(', ')}`);
    console.log('💡 Make sure .env.local has Cloudinary credentials');
    return false;
  }

  console.log('✅ All environment variables present');
  return true;
};

const main = async () => {
  console.log('🚀 Starting Cloudinary Upload Test\n');
  
  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Test upload
  const success = await testUpload();
  
  if (success) {
    console.log('\n🎉 Cloudinary upload test PASSED!');
    console.log('✅ Ready to use in web app!');
  } else {
    console.log('\n❌ Cloudinary upload test FAILED!');
    console.log('💡 Check API configuration and credentials');
  }
};

// Load environment variables
require('dotenv').config({ path: '.env.local' });

main().catch(console.error);
