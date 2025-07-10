#!/usr/bin/env node

/**
 * Test complete Cloudinary data system:
 * 1. Upload image to Cloudinary
 * 2. Save transaction data to Cloudinary
 * 3. Retrieve data from Cloudinary
 * 4. Generate reports
 * 5. Export data
 */

const { default: fetch } = require('node-fetch');
const FormData = require('form-data');

console.log('🧪 Testing Cloudinary Data System...\n');

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
      filename: 'test-cloudinary-data.png',
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
    console.log(`✅ Public ID: ${result.public_id}`);
    
    return result;

  } catch (error) {
    console.log(`❌ Image upload failed: ${error.message}`);
    throw error;
  }
};

// Step 2: Save transaction data to Cloudinary
const saveTransactionData = async (imageUrl, publicId) => {
  console.log('\n📋 Step 2: Saving transaction data to Cloudinary...');
  
  try {
    const transactionData = {
      date: '07/01/2025',
      category: 'food',
      description: 'Test Cloudinary Data System',
      amount: 75000,
      type: 'expense',
      paymentMethod: 'transfer',
      subCategory: 'restaurant',
      note: 'Testing Cloudinary data storage',
      imageUrl: imageUrl,
      publicId: publicId
    };

    console.log('📊 Transaction data:', transactionData);

    const response = await fetch('http://localhost:3000/api/cloudinary-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Data save failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Transaction data saved to Cloudinary!');
    console.log(`✅ Transaction ID: ${result.transactionId}`);
    console.log(`✅ Data URL: ${result.dataUrl}`);
    
    return result;

  } catch (error) {
    console.log(`❌ Data save failed: ${error.message}`);
    throw error;
  }
};

// Step 3: Retrieve data from Cloudinary
const retrieveData = async () => {
  console.log('\n📋 Step 3: Retrieving data from Cloudinary...');
  
  try {
    const response = await fetch('http://localhost:3000/api/cloudinary-data?month=7&year=2025&limit=10');
    
    if (!response.ok) {
      throw new Error(`Data retrieval failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Data retrieved from Cloudinary!');
    console.log(`✅ Found ${result.transactions.length} transactions`);
    
    if (result.transactions.length > 0) {
      const testTransaction = result.transactions.find(t => 
        t.description === 'Test Cloudinary Data System'
      );
      
      if (testTransaction) {
        console.log('✅ Test transaction found in Cloudinary data!');
        console.log(`✅ Description: ${testTransaction.description}`);
        console.log(`✅ Amount: ${testTransaction.amount}`);
        console.log(`✅ Category: ${testTransaction.category}`);
        return true;
      } else {
        console.log('❌ Test transaction not found in Cloudinary data');
        return false;
      }
    }
    
    return result.transactions.length > 0;

  } catch (error) {
    console.log(`❌ Data retrieval failed: ${error.message}`);
    return false;
  }
};

// Step 4: Generate reports
const generateReports = async () => {
  console.log('\n📋 Step 4: Generating reports from Cloudinary data...');
  
  try {
    const response = await fetch('http://localhost:3000/api/reports?type=summary&month=7&year=2025');
    
    if (!response.ok) {
      throw new Error(`Report generation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Report generated successfully!');
    console.log(`✅ Total Expenses: ${result.data.summary.totalExpenses.toLocaleString()} VND`);
    console.log(`✅ Total Income: ${result.data.summary.totalIncome.toLocaleString()} VND`);
    console.log(`✅ Transaction Count: ${result.data.summary.transactionCount}`);
    console.log(`✅ Categories: ${Object.keys(result.data.categoryBreakdown).length}`);
    
    return true;

  } catch (error) {
    console.log(`❌ Report generation failed: ${error.message}`);
    return false;
  }
};

// Step 5: Test data export
const testExport = async () => {
  console.log('\n📋 Step 5: Testing data export...');
  
  try {
    // Test CSV export
    const csvResponse = await fetch('http://localhost:3000/api/export?format=csv&month=7&year=2025');
    
    if (!csvResponse.ok) {
      throw new Error(`CSV export failed: ${csvResponse.status}`);
    }

    const csvContent = await csvResponse.text();
    console.log('✅ CSV export successful!');
    console.log(`✅ CSV size: ${csvContent.length} characters`);
    console.log(`✅ CSV lines: ${csvContent.split('\n').length}`);
    
    // Test JSON export
    const jsonResponse = await fetch('http://localhost:3000/api/export?format=json&month=7&year=2025');
    
    if (!jsonResponse.ok) {
      throw new Error(`JSON export failed: ${jsonResponse.status}`);
    }

    const jsonData = await jsonResponse.json();
    console.log('✅ JSON export successful!');
    console.log(`✅ JSON transactions: ${jsonData.transactions.length}`);
    console.log(`✅ JSON summary: ${JSON.stringify(jsonData.summary)}`);
    
    return true;

  } catch (error) {
    console.log(`❌ Export test failed: ${error.message}`);
    return false;
  }
};

// Main test function
const runCloudinaryDataSystemTest = async () => {
  console.log('🚀 Starting Cloudinary Data System Test\n');
  
  try {
    // Step 1: Upload image
    const uploadResult = await uploadImage();
    
    // Step 2: Save transaction data
    const saveResult = await saveTransactionData(uploadResult.secure_url, uploadResult.public_id);
    
    // Wait for data to be processed
    console.log('\n📋 Waiting for data processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Retrieve data
    const retrieveSuccess = await retrieveData();
    
    // Step 4: Generate reports
    const reportSuccess = await generateReports();
    
    // Step 5: Test export
    const exportSuccess = await testExport();
    
    // Summary
    console.log('\n🎯 TEST SUMMARY:');
    console.log(`✅ Image Upload: ${uploadResult ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Data Save: ${saveResult ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Data Retrieval: ${retrieveSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Report Generation: ${reportSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Data Export: ${exportSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    if (uploadResult && saveResult && retrieveSuccess && reportSuccess && exportSuccess) {
      console.log('\n🎉 CLOUDINARY DATA SYSTEM TEST PASSED!');
      console.log('✅ Image storage: Working');
      console.log('✅ Data storage: Working');
      console.log('✅ Data retrieval: Working');
      console.log('✅ Report generation: Working');
      console.log('✅ Data export: Working');
      console.log('\n🚀 Cloudinary data system ready for production!');
    } else {
      console.log('\n❌ CLOUDINARY DATA SYSTEM TEST FAILED!');
      console.log('💡 Check individual components for issues');
    }

  } catch (error) {
    console.log('\n❌ CLOUDINARY DATA SYSTEM TEST FAILED!');
    console.log(`💡 Error: ${error.message}`);
  }
};

// Load environment and run test
require('dotenv').config({ path: '.env.local' });
runCloudinaryDataSystemTest().catch(console.error);
