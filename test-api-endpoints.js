#!/usr/bin/env node

/**
 * Test script to verify API endpoints for file transfer
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEST_CHAT_ID = 'test-chat-123';

// Test files
const testFiles = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'api-test-app',
      version: '1.0.0',
      scripts: { start: 'node index.js' }
    }, null, 2)
  },
  {
    path: 'index.js',
    content: 'console.log("Hello from API test!");'
  }
];

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testDebugFilesAPI() {
  console.log('🔍 Testing Debug Files API...');
  
  try {
    const response = await makeRequest(`/api/debug-files?chatId=${TEST_CHAT_ID}`);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.data);
      console.log('✅ Debug Files API Response:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Target Directory: ${result.targetDirectory}`);
      console.log(`   - File Count: ${result.fileCount}`);
      console.log(`   - Project Directories: ${result.projectDirectories?.join(', ') || 'none'}`);
      
      if (result.fileStructure) {
        console.log('   - Files:');
        Object.keys(result.fileStructure).forEach(key => {
          const file = result.fileStructure[key];
          console.log(`     * ${key} (${file.type}, ${file.size || 0} bytes)`);
        });
      }
      
      return true;
    } else {
      console.log(`❌ Debug Files API failed with status: ${response.statusCode}`);
      console.log(`Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Debug Files API Error: ${error.message}`);
    return false;
  }
}

async function testPersistGeneratedAppAPI() {
  console.log('\n📦 Testing Persist Generated App API...');
  
  try {
    const payload = {
      files: testFiles,
      chatId: TEST_CHAT_ID
    };
    
    const response = await makeRequest('/api/persist-generated-app', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.data);
      console.log('✅ Persist Generated App API Response:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Files Written: ${result.writtenFiles?.length || 0}`);
      
      if (result.writtenFiles) {
        result.writtenFiles.forEach(file => {
          console.log(`     * ${file}`);
        });
      }
      
      return true;
    } else {
      console.log(`❌ Persist Generated App API failed with status: ${response.statusCode}`);
      console.log(`Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Persist Generated App API Error: ${error.message}`);
    return false;
  }
}

async function testStartPreviewAPI() {
  console.log('\n🚀 Testing Start Preview API...');
  
  try {
    const payload = {
      projectDirectory: `/Users/mymac/project/${TEST_CHAT_ID}`
    };
    
    const response = await makeRequest('/api/start-preview', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.data);
      console.log('✅ Start Preview API Response:');
      console.log(`   - Success: ${result.success}`);
      return true;
    } else {
      console.log(`❌ Start Preview API failed with status: ${response.statusCode}`);
      console.log(`Response: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Start Preview API Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing API Endpoints for File Transfer System\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🆔 Test Chat ID: ${TEST_CHAT_ID}\n`);
  
  const results = {
    debugFiles: await testDebugFilesAPI(),
    persistGeneratedApp: await testPersistGeneratedAppAPI(),
    startPreview: await testStartPreviewAPI()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Debug Files API: ${results.debugFiles ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Persist Generated App API: ${results.persistGeneratedApp ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Start Preview API: ${results.startPreview ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 File transfer system is ready for production!');
  } else {
    console.log('\n⚠️  Some issues detected. Check the logs above for details.');
  }
}

// Check if Bolt server is running
async function checkServer() {
  try {
    const response = await makeRequest('/');
    if (response.statusCode < 500) {
      console.log('✅ Bolt server is running\n');
      await runAllTests();
    } else {
      console.log('❌ Bolt server is not responding correctly');
      console.log('Please start the Bolt server with: npm run dev');
    }
  } catch (error) {
    console.log('❌ Cannot connect to Bolt server');
    console.log('Please start the Bolt server with: npm run dev');
    console.log(`Error: ${error.message}`);
  }
}

checkServer();
