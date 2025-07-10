// Utility giúp xử lý việc sao chép an toàn mà không gặp vấn đề về Clipboard API
export function copyTextToClipboardFallback(text: string): boolean {
  try {
    // Phương pháp 1: Sử dụng Clipboard API nếu có sẵn
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(error => {
        console.warn('Không thể sử dụng Clipboard API:', error);
        // Nếu phương pháp 1 thất bại, sử dụng phương pháp 2
        fallbackCopyTextToClipboard(text);
      });
      return true;
    } else {
      // Nếu Clipboard API không có sẵn, sử dụng phương pháp 2
      return fallbackCopyTextToClipboard(text);
    }
  } catch (err) {
    console.error('Lỗi khi sao chép:', err);
    return false;
  }
}

// Phương pháp dự phòng sử dụng textarea tạm thời
function fallbackCopyTextToClipboard(text: string): boolean {
  try {
    // Tạo phần tử textarea tạm thời
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Tránh cuộn xuống dưới khi thêm vào DOM
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Sử dụng document.execCommand thay thế cho Clipboard API
    const successful = document.execCommand('copy');
    
    // Xóa textarea tạm thời
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Lỗi khi sao chép dùng phương pháp dự phòng:', err);
    return false;
  }
}
