#!/usr/bin/env node

/**
 * Test script cho Cline-Augment integration
 */

const ClineAugmentBridge = require('./cline-augment-bridge.js');
const fs = require('fs');
const path = require('path');

async function testIntegration() {
  console.log('🧪 Testing Cline-Augment Integration...\n');

  const bridge = new ClineAugmentBridge();

  // Test 1: Tạo task
  console.log('📋 Test 1: Creating task...');
  const taskId = bridge.createTask(
    'Create a new React component for user profile',
    ['components/UserProfile.tsx', 'styles/UserProfile.css'],
    'This component should display user avatar, name, and basic info',
    'high'
  );
  console.log('✅ Task created:', taskId);

  // Test 2: Kiểm tra task file
  console.log('\n📄 Test 2: Checking task file...');
  const taskFile = path.join('.cline-augment-tasks', `${taskId}.task.json`);
  
  if (fs.existsSync(taskFile)) {
    const taskData = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
    console.log('✅ Task file exists:', taskData);
  } else {
    console.log('❌ Task file not found');
  }

  // Test 3: Simulate Augment response
  console.log('\n🤖 Test 3: Simulating Augment response...');
  const responseData = {
    taskId,
    response: `
// UserProfile.tsx
import React from 'react';
import './UserProfile.css';

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    avatar: string;
    email: string;
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} className="avatar" />
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  );
};

/* UserProfile.css */
.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f5f5f5;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h3 {
  margin: 0;
  font-size: 1.2rem;
}

.user-info p {
  margin: 0.5rem 0 0 0;
  color: #666;
}
    `,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };

  const responseFile = path.join('.cline-augment-tasks', `${taskId}.response.json`);
  fs.writeFileSync(responseFile, JSON.stringify(responseData, null, 2));
  console.log('✅ Response file created');

  // Test 4: Cleanup
  console.log('\n🧹 Test 4: Cleanup...');
  setTimeout(() => {
    if (fs.existsSync(taskFile)) {
      fs.unlinkSync(taskFile);
      console.log('✅ Task file cleaned up');
    }
    
    if (fs.existsSync(responseFile)) {
      fs.unlinkSync(responseFile);
      console.log('✅ Response file cleaned up');
    }
    
    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Configure Augment CLI/API endpoint in bridge script');
    console.log('2. Install Cline extension in VS Code/Cursor');
    console.log('3. Start the bridge: npm run cline:bridge');
    console.log('4. Test with real Cline requests');
    
  }, 2000);
}

// Chạy test
if (require.main === module) {
  testIntegration().catch(console.error);
}

module.exports = { testIntegration };
