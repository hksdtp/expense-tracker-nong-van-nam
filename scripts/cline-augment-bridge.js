#!/usr/bin/env node

/**
 * Cline-Augment Bridge
 * Middleware để forward requests từ Cline sang Augment
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Polyfill fetch cho Node.js cũ
if (!global.fetch) {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('⚠️  node-fetch not available, using fallback');
  }
}

class ClineAugmentBridge {
  constructor() {
    this.taskDir = path.join(process.cwd(), '.cline-augment-tasks');
    this.setupTaskDirectory();
    this.startWatching();
  }

  setupTaskDirectory() {
    if (!fs.existsSync(this.taskDir)) {
      fs.mkdirSync(this.taskDir, { recursive: true });
      console.log('📁 Created task directory:', this.taskDir);
    }
  }

  startWatching() {
    console.log('👀 Watching for Cline tasks...');
    
    fs.watch(this.taskDir, (eventType, filename) => {
      if (eventType === 'rename' && filename && filename.endsWith('.task.json')) {
        const taskFile = path.join(this.taskDir, filename);
        
        // Đợi file được ghi xong
        setTimeout(() => {
          this.processTask(taskFile);
        }, 100);
      }
    });
  }

  async processTask(taskFile) {
    try {
      if (!fs.existsSync(taskFile)) return;

      const taskData = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
      console.log('📝 Processing task:', taskData.id);

      // Forward sang Augment
      await this.forwardToAugment(taskData);

      // Xóa task file sau khi xử lý
      fs.unlinkSync(taskFile);
      
    } catch (error) {
      console.error('❌ Error processing task:', error);
    }
  }

  async forwardToAugment(taskData) {
    return new Promise((resolve, reject) => {
      // Tạo prompt cho Augment
      const augmentPrompt = this.createAugmentPrompt(taskData);

      // Gọi Augment MCP thay vì CLI
      this.callAugmentMCP(augmentPrompt)
        .then(response => {
          console.log('✅ Augment MCP response received');
          this.writeResponse(taskData.id, response);
          resolve(response);
        })
        .catch(error => {
          console.error('❌ Augment MCP error:', error);

          // Fallback: Ghi task vào file để manual processing
          this.writeManualTask(taskData);
          reject(error);
        });
    });
  }

  async callAugmentMCP(prompt) {
    // Simulate Augment MCP call
    // Trong thực tế, đây sẽ là HTTP request đến Augment MCP server

    const augmentEndpoint = process.env.AUGMENT_MCP_ENDPOINT || 'http://localhost:8080/mcp';

    try {
      // Sử dụng fetch hoặc axios để gọi Augment MCP
      const response = await fetch(augmentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUGMENT_API_KEY || ''}`
        },
        body: JSON.stringify({
          prompt,
          context: 'cline-forwarded-task',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Augment MCP error: ${response.status}`);
      }

      const result = await response.json();
      return result.response || result.content || 'Task processed by Augment';

    } catch (error) {
      // Fallback: Return simulated response for testing
      console.log('🔄 Using fallback response (Augment MCP not available)');
      return `
Task processed by Augment (simulated):
${prompt}

Implementation will be provided by Augment when MCP connection is established.
      `;
    }
  }

  writeManualTask(taskData) {
    const manualFile = path.join(this.taskDir, `${taskData.id}.manual.json`);
    fs.writeFileSync(manualFile, JSON.stringify(taskData, null, 2));
    console.log('📝 Manual task written for processing:', manualFile);
  }

  createAugmentPrompt(taskData) {
    return `
Task from Cline: ${taskData.description}
Files involved: ${taskData.files?.join(', ') || 'N/A'}
Context: ${taskData.context || 'N/A'}
Priority: ${taskData.priority || 'normal'}

Please process this request and provide implementation.
    `.trim();
  }

  writeResponse(taskId, response) {
    const responseFile = path.join(this.taskDir, `${taskId}.response.json`);
    const responseData = {
      taskId,
      response,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    fs.writeFileSync(responseFile, JSON.stringify(responseData, null, 2));
    console.log('📄 Response written:', responseFile);
  }

  // API để Cline gọi
  createTask(description, files = [], context = '', priority = 'normal') {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const taskData = {
      id: taskId,
      description,
      files,
      context,
      priority,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    const taskFile = path.join(this.taskDir, `${taskId}.task.json`);
    fs.writeFileSync(taskFile, JSON.stringify(taskData, null, 2));
    
    console.log('📋 Created task:', taskId);
    return taskId;
  }
}

// CLI interface
if (require.main === module) {
  const bridge = new ClineAugmentBridge();
  
  // Xử lý command line arguments
  const args = process.argv.slice(2);
  
  if (args[0] === 'create-task') {
    const description = args[1] || 'No description provided';
    const files = args.slice(2);
    bridge.createTask(description, files);
  } else {
    console.log('🌉 Cline-Augment Bridge started');
    console.log('Usage: node cline-augment-bridge.js create-task "description" file1.js file2.js');
  }
}

module.exports = ClineAugmentBridge;
