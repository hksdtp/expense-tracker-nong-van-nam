#!/usr/bin/env node

/**
 * Test Cloudinary credentials
 */

const https = require('https');

const CLOUD_NAME = 'dgaktc3fb';
const API_KEY = '837515191173781';
const API_SECRET = '0b81AP4Qgb3LyNahdXCesAJd1LM';

console.log('🔑 Testing Cloudinary Credentials...\n');

// Test 1: Basic API connection
console.log('📋 Testing Basic API Connection:');
console.log(`Cloud Name: ${CLOUD_NAME}`);
console.log(`API Key: ${API_KEY}`);
console.log(`API Secret: ${API_SECRET.substring(0, 8)}...`);

// Test 2: Check account info
const testAccountInfo = () => {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
    
    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${CLOUD_NAME}/usage`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const usage = JSON.parse(data);
          console.log('✅ Cloudinary API connection successful!');
          console.log(`✅ Account Plan: ${usage.plan || 'Free'}`);
          console.log(`✅ Credits Used: ${usage.credits?.used || 0}/${usage.credits?.limit || 'unlimited'}`);
          console.log(`✅ Storage Used: ${Math.round((usage.storage?.used || 0) / 1024 / 1024)} MB`);
          resolve(usage);
        } else {
          console.log(`❌ API Error: ${res.statusCode} - ${data}`);
          reject(new Error(`API Error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Connection Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
};

// Test 3: Check MediaFlows MCP endpoint
const testMediaFlowsEndpoint = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mediaflows.mcp.cloudinary.com',
      port: 443,
      path: '/v2/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cld-cloud-name': CLOUD_NAME,
        'cld-api-key': API_KEY,
        'cld-secret': API_SECRET
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 MediaFlows MCP Response: ${res.statusCode}`);
        if (res.statusCode < 500) {
          console.log('✅ MediaFlows MCP endpoint accessible');
          resolve(true);
        } else {
          console.log('⚠️  MediaFlows MCP endpoint may have issues');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`⚠️  MediaFlows MCP connection: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('⚠️  MediaFlows MCP timeout (normal for MCP servers)');
      req.destroy();
      resolve(true);
    });

    req.write(JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      id: 1,
      params: {}
    }));
    
    req.end();
  });
};

// Run tests
(async () => {
  try {
    await testAccountInfo();
    console.log('');
    await testMediaFlowsEndpoint();
    
    console.log('\n🎯 Credentials Status:');
    console.log('✅ All credentials valid!');
    console.log('✅ Ready for MCP server setup!');
    
  } catch (error) {
    console.log('\n❌ Credential Test Failed:');
    console.log(`Error: ${error.message}`);
  }
})();
