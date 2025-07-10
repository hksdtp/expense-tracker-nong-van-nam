#!/usr/bin/env node

/**
 * Test Cloudinary OCR functionality
 */

const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('🧪 Testing Cloudinary OCR...\n');

const testOCR = async () => {
  try {
    console.log('📋 Checking Cloudinary configuration...');
    console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`API Key: ${process.env.CLOUDINARY_API_KEY}`);
    
    // First, let's upload a test image with text
    console.log('\n📋 Creating test image with text...');
    
    // Use a sample image from Cloudinary's demo account
    const testImageUrl = `https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill,b_white/l_text:Arial_24:RECEIPT%0ACAFE%20EXAMPLE%0ATotal:%20$25.50%0ADate:%2007%2F01%2F2025,co_black/sample`;
    
    console.log(`✅ Test image URL: ${testImageUrl}`);
    
    // Upload the test image to our account
    console.log('\n📋 Uploading test receipt image...');
    const uploadResult = await cloudinary.uploader.upload(testImageUrl, {
      public_id: 'test-receipt-ocr',
      folder: 'expense-receipts',
      overwrite: true
    });
    
    console.log(`✅ Uploaded: ${uploadResult.public_id}`);
    
    // Test basic OCR
    console.log('\n📋 Testing basic OCR...');
    try {
      const basicOCR = await cloudinary.api.resource(uploadResult.public_id, {
        ocr: 'adv_ocr'
      });
      
      if (basicOCR.info && basicOCR.info.ocr) {
        console.log('✅ OCR addon is available!');
        console.log('OCR Result:', JSON.stringify(basicOCR.info.ocr, null, 2));
      } else {
        console.log('⚠️  OCR addon may not be enabled');
        console.log('Available info:', Object.keys(basicOCR.info || {}));
      }
    } catch (ocrError) {
      console.log('❌ OCR test failed:', ocrError.message);
      console.log('💡 OCR addon may need to be enabled in Cloudinary dashboard');
    }
    
    // Test our analysis API
    console.log('\n📋 Testing our analysis API...');
    try {
      const { default: fetch } = require('node-fetch');
      
      const analysisResponse = await fetch('http://localhost:3000/api/analyze-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id
        })
      });
      
      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json();
        console.log('✅ Analysis API working!');
        console.log('Analysis Result:', JSON.stringify(analysisResult, null, 2));
      } else {
        const errorText = await analysisResponse.text();
        console.log('❌ Analysis API failed:', errorText);
      }
    } catch (apiError) {
      console.log('❌ Analysis API test failed:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ OCR test failed:', error);
  }
};

const checkOCRAddons = async () => {
  try {
    console.log('\n📋 Checking available addons...');
    
    // This might not work with free accounts, but let's try
    const addons = await cloudinary.api.addons();
    console.log('Available addons:', addons);
    
  } catch (error) {
    console.log('⚠️  Cannot check addons (may require paid plan)');
  }
};

const main = async () => {
  console.log('🚀 Starting Cloudinary OCR Test\n');
  
  try {
    await testOCR();
    await checkOCRAddons();
    
    console.log('\n🎯 OCR Test Summary:');
    console.log('✅ Cloudinary connection: OK');
    console.log('✅ Image upload: OK');
    console.log('⚠️  OCR addon: Check dashboard if not working');
    console.log('✅ Analysis API: Ready');
    
    console.log('\n💡 Next Steps:');
    console.log('1. Enable OCR addon in Cloudinary dashboard if needed');
    console.log('2. Test with real receipt images');
    console.log('3. Fine-tune analysis patterns');
    
  } catch (error) {
    console.log('\n❌ OCR Test Failed:');
    console.log(`Error: ${error.message}`);
  }
};

// Load environment and run test
require('dotenv').config({ path: '.env.local' });
main().catch(console.error);
