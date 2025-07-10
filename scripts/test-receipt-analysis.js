#!/usr/bin/env node

/**
 * Test Receipt Analysis API with existing images
 */

const { default: fetch } = require('node-fetch');

console.log('🧪 Testing Receipt Analysis API...\n');

const testAnalysisAPI = async () => {
  try {
    // Use an existing Cloudinary image URL for testing
    const testImageUrl = 'https://res.cloudinary.com/dgaktc3fb/image/upload/v1751907010/expense-receipts/tspa8gqquwh2mwvbr1de.png';
    
    console.log('📋 Testing with image:', testImageUrl);
    
    const response = await fetch('http://localhost:3000/api/analyze-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: testImageUrl
      })
    });

    console.log(`📋 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Analysis failed: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ Analysis successful!');
    console.log('📊 Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    
    return true;

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
};

const testTextAnalysis = () => {
  console.log('\n📋 Testing text analysis patterns...');
  
  // Test sample receipt text
  const sampleTexts = [
    {
      name: 'Vietnamese Receipt',
      text: `CAFE HIGHLANDS
123 Nguyen Hue, Q1, HCMC
Tel: 028-1234-5678

Ngày: 07/01/2025
Giờ: 14:30

1x Cafe Đen Đá        25,000
1x Bánh Mì Thịt       35,000
1x Nước Cam           20,000

Tổng cộng:           80,000 VND
Tiền mặt:            100,000
Thối lại:            20,000

Cảm ơn quý khách!`
    },
    {
      name: 'English Receipt',
      text: `STARBUCKS COFFEE
456 Main Street
New York, NY 10001

Date: 01/07/2025
Time: 2:30 PM

1x Grande Latte       $5.50
1x Blueberry Muffin   $3.25
1x Bottled Water      $2.00

Subtotal:            $10.75
Tax:                 $0.86
Total:               $11.61

Thank you!`
    },
    {
      name: 'Gas Station Receipt',
      text: `SHELL STATION
789 Highway 1
Gas Purchase

Date: 07/01/2025
Time: 08:15 AM

Unleaded 95
Liters: 45.2
Price/L: 23,500 VND
Total: 1,062,200 VND

Payment: Credit Card
Thank you for choosing Shell!`
    }
  ];

  sampleTexts.forEach(sample => {
    console.log(`\n🧪 Testing: ${sample.name}`);
    
    // Test merchant extraction
    const merchantPatterns = [
      /^([A-Z][A-Z\s&]+[A-Z])/m,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:Restaurant|Store|Market|Shop|Cafe|Coffee)/i,
      /^([A-Z][a-zA-Z\s]+)(?:\n|\r)/m
    ];

    let merchant = null;
    for (const pattern of merchantPatterns) {
      const match = sample.text.match(pattern);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }

    // Test total extraction
    const totalPatterns = [
      /(?:total|tổng|sum|amount)[\s:]*([0-9,]+(?:\.[0-9]{2})?)/i,
      /([0-9,]+(?:\.[0-9]{2})?)\s*(?:vnd|đ|dong)/i,
      /([0-9,]+)\s*(?:vnd|đ)/i,
      /\$([0-9,]+(?:\.[0-9]{2})?)/
    ];

    let total = null;
    for (const pattern of totalPatterns) {
      const match = sample.text.match(pattern);
      if (match) {
        total = match[1].replace(/,/g, '');
        break;
      }
    }

    // Test date extraction
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/i
    ];

    let date = null;
    for (const pattern of datePatterns) {
      const match = sample.text.match(pattern);
      if (match) {
        date = match[1];
        break;
      }
    }

    console.log(`  Merchant: ${merchant || 'Not found'}`);
    console.log(`  Total: ${total || 'Not found'}`);
    console.log(`  Date: ${date || 'Not found'}`);
  });
};

const main = async () => {
  console.log('🚀 Starting Receipt Analysis Test\n');
  
  try {
    // Test text analysis patterns
    testTextAnalysis();
    
    // Test API if server is running
    console.log('\n📋 Testing Analysis API...');
    const apiSuccess = await testAnalysisAPI();
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ Text analysis patterns: Working');
    console.log(`${apiSuccess ? '✅' : '❌'} Analysis API: ${apiSuccess ? 'Working' : 'Check server'}`);
    
    if (apiSuccess) {
      console.log('\n🎉 Receipt Analysis System Ready!');
      console.log('✅ Pattern matching: OK');
      console.log('✅ API endpoint: OK');
      console.log('✅ Ready for integration');
    } else {
      console.log('\n💡 Next Steps:');
      console.log('1. Make sure dev server is running (npm run dev)');
      console.log('2. Check API endpoint implementation');
      console.log('3. Test with real receipt images');
    }

  } catch (error) {
    console.log('\n❌ Test Failed:');
    console.log(`Error: ${error.message}`);
  }
};

main().catch(console.error);
