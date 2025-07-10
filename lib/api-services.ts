/**
 * API Service cho các thao tác với giao dịch
 */

/**
 * Lấy thông tin một giao dịch theo ID
 * @param id ID của giao dịch cần lấy
 * @returns Thông tin giao dịch hoặc null nếu không tìm thấy
 */
export async function getTransaction(id: string): Promise<any> {
  try {
    // Trong thực tế, đây sẽ là API call
    // Ví dụ: const response = await fetch(`/api/transactions/${id}`)
    
    // Hiện tại chúng ta sẽ ưu tiên sử dụng localStorage cho đơn giản
    const storedData = localStorage.getItem(`edit_transaction_${id}`)
    if (storedData) {
      return JSON.parse(storedData)
    }
    
    // Nếu không có trong localStorage, trả về null
    return null
  } catch (error) {
    console.error("Lỗi khi lấy thông tin giao dịch:", error)
    throw new Error("Không thể lấy thông tin giao dịch")
  }
}

/**
 * Revalidate dữ liệu trang
 * @param paths Danh sách các đường dẫn cần revalidate
 */
export async function revalidateData(paths: string[] = ["/", "/transactions"]): Promise<void> {
  try {
    // Tạo query string từ mảng paths
    const queryString = paths.map(path => `path=${encodeURIComponent(path)}`).join("&")
    await fetch(`/api/revalidate?${queryString}`, { method: 'POST' })
    console.log('Đã revalidate dữ liệu thành công')
  } catch (error) {
    console.error('Lỗi khi revalidate dữ liệu:', error)
    throw error
  }
}
