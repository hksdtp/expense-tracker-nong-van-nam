#!/usr/bin/env node

/**
 * Test complete upload workflow:
 * 1. Upload image to Cloudinary
 * 2. Create transaction with imageUrl
 * 3. Verify data in Google Sheets
 */

const { default: fetch } = require('node-fetch');
const FormData = require('form-data');

console.log('🧪 Testing Complete Upload Workflow...\n');

// Create test image
const createTestImage = () => {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
    0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  return pngData;
};

// Step 1: Upload image to Cloudinary
const uploadImage = async () => {
  console.log('📋 Step 1: Uploading image to Cloudinary...');
  
  try {
    const testImageBuffer = createTestImage();
    const formData = new FormData();
    formData.append('file', testImageBuffer, {
      filename: 'test-receipt-workflow.png',
      contentType: 'image/png'
    });

    const response = await fetch('http://localhost:3000/api/upload-cloudinary', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Image uploaded successfully!');
    console.log(`✅ Cloudinary URL: ${result.secure_url}`);
    
    return result.secure_url;

  } catch (error) {
    console.log(`❌ Image upload failed: ${error.message}`);
    throw error;
  }
};

// Step 2: Create transaction with imageUrl
const createTransaction = async (imageUrl) => {
  console.log('\n📋 Step 2: Creating transaction with imageUrl...');
  
  try {
    const transactionData = new FormData();
    transactionData.append('date', '07/01/2025');
    transactionData.append('category', 'food');
    transactionData.append('description', 'Test Receipt Upload - Cloudinary');
    transactionData.append('amount', '50000');
    transactionData.append('type', 'expense');
    transactionData.append('paymentMethod', 'transfer');
    transactionData.append('imageUrl', imageUrl);

    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: '07/01/2025',
        category: 'food',
        description: 'Test Receipt Upload - Cloudinary',
        amount: 50000,
        type: 'expense',
        paymentMethod: 'transfer',
        imageUrl: imageUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transaction creation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Transaction created successfully!');
    console.log(`✅ Transaction ID: ${result.transaction?.id || 'N/A'}`);
    
    return result;

  } catch (error) {
    console.log(`❌ Transaction creation failed: ${error.message}`);
    throw error;
  }
};

// Step 3: Verify data in Google Sheets
const verifyInSheets = async () => {
  console.log('\n📋 Step 3: Verifying data in Google Sheets...');
  
  try {
    const response = await fetch('http://localhost:3000/api/transactions?month=1&year=2025');
    
    if (!response.ok) {
      throw new Error(`Sheets verification failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Google Sheets data retrieved successfully!');
    
    // Find our test transaction
    const testTransaction = result.transactions?.find(t => 
      t.description === 'Test Receipt Upload - Cloudinary'
    );

    if (testTransaction) {
      console.log('✅ Test transaction found in Google Sheets!');
      console.log(`✅ Description: ${testTransaction.description}`);
      console.log(`✅ Amount: ${testTransaction.amount}`);
      console.log(`✅ ImageURL: ${testTransaction.imageUrl ? 'Present' : 'Missing'}`);
      
      if (testTransaction.imageUrl) {
        console.log(`✅ Image URL: ${testTransaction.imageUrl}`);
        return true;
      } else {
        console.log('❌ ImageURL missing in Google Sheets');
        return false;
      }
    } else {
      console.log('❌ Test transaction not found in Google Sheets');
      return false;
    }

  } catch (error) {
    console.log(`❌ Sheets verification failed: ${error.message}`);
    return false;
  }
};

// Main workflow test
const runWorkflowTest = async () => {
  console.log('🚀 Starting Complete Workflow Test\n');
  
  try {
    // Step 1: Upload image
    const imageUrl = await uploadImage();
    
    // Step 2: Create transaction
    await createTransaction(imageUrl);
    
    // Wait a bit for data to sync
    console.log('\n📋 Waiting for data sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Verify in sheets
    const verified = await verifyInSheets();
    
    if (verified) {
      console.log('\n🎉 COMPLETE WORKFLOW TEST PASSED!');
      console.log('✅ Image upload: SUCCESS');
      console.log('✅ Transaction creation: SUCCESS');
      console.log('✅ Google Sheets integration: SUCCESS');
      console.log('✅ ImageURL preservation: SUCCESS');
      console.log('\n🚀 Ready for production use!');
    } else {
      console.log('\n❌ WORKFLOW TEST FAILED!');
      console.log('💡 Check Google Sheets integration');
    }

  } catch (error) {
    console.log('\n❌ WORKFLOW TEST FAILED!');
    console.log(`💡 Error: ${error.message}`);
  }
};

// Load environment and run test
require('dotenv').config({ path: '.env.local' });
runWorkflowTest().catch(console.error);
