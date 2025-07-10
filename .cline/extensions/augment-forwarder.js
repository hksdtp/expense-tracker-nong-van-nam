/**
 * Cline Extension: Augment Forwarder
 * Tự động forward các requests từ Cline sang Augment
 */

class AugmentForwarder {
  constructor(cline) {
    this.cline = cline;
    this.bridge = require('../../scripts/cline-augment-bridge.js');
    this.setupHooks();
  }

  setupHooks() {
    // Hook vào Cline's request processing
    this.cline.on('beforeRequest', this.handleBeforeRequest.bind(this));
    this.cline.on('requestReceived', this.handleRequestReceived.bind(this));
  }

  async handleBeforeRequest(request) {
    console.log('🔍 Analyzing request for Augment forwarding...');
    
    if (this.shouldForwardToAugment(request)) {
      console.log('📤 Forwarding to Augment...');
      
      // Tạo task cho Augment
      const taskId = await this.forwardToAugment(request);
      
      // Đánh dấu request đã được forward
      request.forwardedToAugment = true;
      request.augmentTaskId = taskId;
      
      // Tạm dừng Cline processing
      request.pauseClineProcessing = true;
      
      return request;
    }
    
    return request;
  }

  async handleRequestReceived(request) {
    if (request.forwardedToAugment) {
      // Chờ Augment xử lý xong
      const result = await this.waitForAugmentResponse(request.augmentTaskId);
      
      // Trả kết quả về Cline
      this.cline.sendResponse(result);
      
      return true; // Đã xử lý xong
    }
    
    return false; // Để Cline xử lý bình thường
  }

  shouldForwardToAugment(request) {
    const forwardPatterns = [
      /implement.*component/i,
      /create.*feature/i,
      /fix.*bug/i,
      /refactor/i,
      /optimize/i,
      /add.*functionality/i,
      /build.*ui/i,
      /design.*interface/i
    ];

    const text = request.message || request.prompt || '';
    
    return forwardPatterns.some(pattern => pattern.test(text));
  }

  async forwardToAugment(request) {
    const bridge = new this.bridge();
    
    const taskId = bridge.createTask(
      request.message || request.prompt,
      request.files || [],
      request.context || '',
      request.priority || 'normal'
    );

    return taskId;
  }

  async waitForAugmentResponse(taskId, timeout = 30000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkResponse = () => {
        const responseFile = `.cline-augment-tasks/${taskId}.response.json`;
        
        if (require('fs').existsSync(responseFile)) {
          const response = JSON.parse(require('fs').readFileSync(responseFile, 'utf8'));
          resolve(response.response);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Augment response timeout'));
          return;
        }
        
        setTimeout(checkResponse, 1000);
      };
      
      checkResponse();
    });
  }
}

// Export cho Cline
module.exports = AugmentForwarder;
