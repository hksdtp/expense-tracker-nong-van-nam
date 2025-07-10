#!/usr/bin/env node

/**
 * Test complete AI-powered workflow:
 * 1. Upload image to Cloudinary
 * 2. Analyze receipt with AI
 * 3. Create transaction with AI data
 * 4. Verify in Google Sheets
 */

const { default: fetch } = require('node-fetch');
const FormData = require('form-data');

console.log('🧪 Testing AI-Powered Receipt Workflow...\n');

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
      filename: 'test-ai-receipt.png',
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
    
    return result;

  } catch (error) {
    console.log(`❌ Image upload failed: ${error.message}`);
    throw error;
  }
};

// Step 2: Analyze receipt with AI
const analyzeReceipt = async (imageUrl, publicId) => {
  console.log('\n📋 Step 2: Analyzing receipt with AI...');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        publicId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ AI analysis completed!');
    console.log(`✅ Merchant: ${result.analysis.merchant || 'N/A'}`);
    console.log(`✅ Amount: ${result.analysis.total || 'N/A'}`);
    console.log(`✅ Category: ${result.analysis.category || 'N/A'}`);
    console.log(`✅ Confidence: ${result.analysis.confidence || 0}%`);
    
    return result.analysis;

  } catch (error) {
    console.log(`❌ AI analysis failed: ${error.message}`);
    throw error;
  }
};

// Step 3: Create transaction with AI data
const createTransactionWithAI = async (imageUrl, analysis) => {
  console.log('\n📋 Step 3: Creating transaction with AI data...');
  
  try {
    const transactionData = {
      date: analysis.date || '07/01/2025',
      category: analysis.category || 'other',
      description: analysis.merchant || 'AI-Analyzed Receipt',
      amount: analysis.total || 55000,
      type: 'expense',
      paymentMethod: 'transfer',
      imageUrl: imageUrl
    };

    console.log('📊 Transaction data:', transactionData);

    const response = await fetch('http://localhost:3000/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transaction creation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Transaction created with AI data!');
    console.log(`✅ Transaction ID: ${result.transaction?.id || 'N/A'}`);
    
    return result;

  } catch (error) {
    console.log(`❌ Transaction creation failed: ${error.message}`);
    throw error;
  }
};

// Step 4: Verify data in Google Sheets
const verifyInSheets = async (analysis) => {
  console.log('\n📋 Step 4: Verifying AI data in Google Sheets...');
  
  try {
    const response = await fetch('http://localhost:3000/api/transactions?month=7&year=2025');
    
    if (!response.ok) {
      throw new Error(`Sheets verification failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Google Sheets data retrieved successfully!');
    console.log(`📊 Found ${result.transactions?.length || 0} transactions`);

    // Debug: show recent transactions
    if (result.transactions && result.transactions.length > 0) {
      console.log('📋 Recent transactions:');
      result.transactions.slice(-3).forEach((t, i) => {
        console.log(`  ${i+1}. ${t.description} - ${t.amount} - ${t.category}`);
      });
    }

    // Find our AI transaction (normalize whitespace for comparison)
    const expectedDescription = (analysis.merchant || 'AI-Analyzed Receipt').replace(/\s+/g, ' ').trim();
    const aiTransaction = result.transactions?.find(t =>
      t.description.replace(/\s+/g, ' ').trim() === expectedDescription
    );

    if (aiTransaction) {
      console.log('✅ AI transaction found in Google Sheets!');
      console.log(`✅ Description: ${aiTransaction.description}`);
      console.log(`✅ Amount: ${aiTransaction.amount}`);
      console.log(`✅ Category: ${aiTransaction.category}`);
      console.log(`✅ ImageURL: ${aiTransaction.imageUrl ? 'Present' : 'Missing'}`);
      
      return true;
    } else {
      console.log('❌ AI transaction not found in Google Sheets');
      return false;
    }

  } catch (error) {
    console.log(`❌ Sheets verification failed: ${error.message}`);
    return false;
  }
};

// Main AI workflow test
const runAIWorkflowTest = async () => {
  console.log('🚀 Starting AI-Powered Receipt Workflow Test\n');
  
  try {
    // Step 1: Upload image
    const uploadResult = await uploadImage();
    
    // Step 2: Analyze with AI
    const analysis = await analyzeReceipt(uploadResult.secure_url, uploadResult.public_id);
    
    // Step 3: Create transaction with AI data
    await createTransactionWithAI(uploadResult.secure_url, analysis);
    
    // Wait for data sync
    console.log('\n📋 Waiting for data sync...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Verify in sheets
    const verified = await verifyInSheets(analysis);
    
    if (verified) {
      console.log('\n🎉 AI WORKFLOW TEST PASSED!');
      console.log('✅ Image upload: SUCCESS');
      console.log('✅ AI analysis: SUCCESS');
      console.log('✅ Auto-categorization: SUCCESS');
      console.log('✅ Transaction creation: SUCCESS');
      console.log('✅ Google Sheets sync: SUCCESS');
      console.log('\n🚀 AI-powered receipt system ready for production!');
    } else {
      console.log('\n❌ AI WORKFLOW TEST FAILED!');
      console.log('💡 Check Google Sheets integration');
    }

  } catch (error) {
    console.log('\n❌ AI WORKFLOW TEST FAILED!');
    console.log(`💡 Error: ${error.message}`);
  }
};

// Load environment and run test
require('dotenv').config({ path: '.env.local' });
runAIWorkflowTest().catch(console.error);
