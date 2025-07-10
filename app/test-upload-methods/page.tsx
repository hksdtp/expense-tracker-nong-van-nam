"use client"

import { UploadChooser } from "@/components/upload-chooser"

export default function TestUploadMethods() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Kiểm tra các phương thức tải ảnh lên</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg mb-8 shadow-md">
          <h2 className="text-lg font-semibold text-rose-800 mb-2">Hướng dẫn sử dụng</h2>
          <ul className="list-disc pl-5 text-rose-700 space-y-1">
            <li>Component <code>UploadChooser</code> cho phép sử dụng song song cả Google Drive và Vercel Blob</li>
            <li>Chọn phương thức tải lên bằng cách chuyển đổi giữa các tab</li>
            <li>Tải ảnh lên và so sánh tốc độ, độ tin cậy giữa các phương thức</li>
            <li>Xem kết quả hiển thị sau khi tải lên</li>
          </ul>
        </div>

        <UploadChooser 
          onSuccess={(imageData) => {
            console.log("Tải lên thành công:", imageData)
          }}
        />
        
        <div className="mt-8 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-emerald-800 mb-2">Cách tích hợp vào ứng dụng</h2>
          <p className="text-emerald-700 mb-3">Thêm component vào form giao dịch hiện tại:</p>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
{`// Trong transaction-form-fixed.tsx
import { UploadChooser } from "@/components/upload-chooser"

// Thêm vào giao diện
<UploadChooser
  defaultMethod="drive" 
  onSuccess={(imageData) => {
    setReceiptImage({
      fileId: imageData.fileId,
      thumbnailLink: imageData.thumbnailLink || imageData.url,
      directViewLink: imageData.directViewLink || imageData.url,
      downloadLink: imageData.downloadLink || imageData.url,
    })
  }}
/>`}
          </pre>
        </div>
      </div>
    </div>
  )
}
