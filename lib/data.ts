// Thêm 'use server' directive để đảm bảo code chỉ chạy ở server-side
"use server"

import type { Transaction } from "@/lib/types"
import { initGoogleAPIs, getSpreadsheetId } from "@/lib/google-service"

const SHEET_NAME = "Sheet1"

// Function to fetch all transactions from Google Sheets
export async function fetchAllTransactions(): Promise<Transaction[]> {
  const { sheets } = await initGoogleAPIs()
  const SPREADSHEET_ID = await getSpreadsheetId()

  try {
    console.log(`Fetching transactions from spreadsheet: ${SPREADSHEET_ID}, sheet: ${SHEET_NAME}`)

    // Fetch all transactions
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:L`, // Mở rộng range để bao gồm cả imageUrl
    })

    const rows = response.data.values || []
    console.log(`Found ${rows.length} transactions in the sheet`)

    // Map the rows to Transaction objects
    const transactions = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Bỏ qua hàng trống
      if (!row || !row[0]) continue

      // Xử lý amount đúng cách - đảm bảo nó là số
      let amount = 0
      try {
        // Loại bỏ dấu phẩy ngăn cách hàng nghìn nếu có
        const amountStr = (row[3] || "0").toString().replace(/,/g, "")
        amount = Number.parseFloat(amountStr)
        if (isNaN(amount)) amount = 0
      } catch (e) {
        console.error("Error parsing amount:", row[3], e)
      }

      // Process receipt link to ensure it's usable
      let receiptLink = row[5] || null

      // If it's a Google Drive link, convert it to use our proxy
      if (receiptLink) {
        let fileId = null

        // Extract file ID from various Google Drive URL formats
        if (receiptLink.includes("drive.google.com/file/d/")) {
          fileId = receiptLink.split("/file/d/")[1].split("/")[0]
        } else if (receiptLink.includes("drive.google.com") && receiptLink.includes("id=")) {
          fileId = receiptLink.split("id=")[1]?.split("&")[0]
        } else if (receiptLink.includes("drive.google.com/thumbnail")) {
          fileId = receiptLink.split("id=")[1]?.split("&")[0]
        }

        // If we extracted a file ID, use our proxy
        if (fileId) {
          receiptLink = `/api/image-proxy/${fileId}`
        }
      }

      // Ensure we have all required fields with proper defaults
      transactions.push({
        id: i.toString(),
        date: row[0] || "",
        category: row[1] || "",
        description: row[2] || "",
        amount: amount,
        type: ((row[4] || "expense").toLowerCase() === "income" ? "income" : "expense") as "income" | "expense",
        receiptLink: receiptLink,
        timestamp: row[6] || new Date().toISOString(),
        subCategory: row[7] || null, // Thêm subCategory nếu có
        fuelLiters: row[8] || null, // Thêm số lượng xăng nếu có
        paymentMethod: row[9] || "transfer", // Giữ nguyên giá trị gốc để logic xử lý đúng
        note: row[10] || null, // Thêm ghi chú nếu có
        imageUrl: row[11] || null, // Thêm URL ảnh từ Google Drive
      })
    }

    console.log(`Processed ${transactions.length} valid transactions`)
    // Log một số giao dịch đầu tiên để debug
    if (transactions.length > 0) {
      console.log("Sample transactions:", transactions.slice(0, 3))
    }

    return transactions
  } catch (error) {
    console.error("Error fetching transactions:", error)
    // Xử lý lỗi an toàn với TypeScript
    const err = error as any; // Type casting cho error
    console.error("Error details:", err.response?.data || (err instanceof Error ? err.message : 'Unknown error'))
    return []
  }
}

// Các hàm khác giữ nguyên
export async function fetchTransactionSummary() {
  try {
    const transactions = await fetchAllTransactions()

    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpense

    return {
      totalIncome,
      totalExpense,
      balance,
    }
  } catch (error) {
    console.error("Error calculating transaction summary:", error)
    return {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    }
  }
}

export async function fetchTopExpenseCategories() {
  try {
    const transactions = await fetchAllTransactions()

    const categoryMap: Record<string, number> = {}

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
      })

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  } catch (error) {
    console.error("Error fetching top expense categories:", error)
    return []
  }
}

export async function fetchRecentTransactions() {
  try {
    const transactions = await fetchAllTransactions()

    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return []
  }
}

export async function fetchFilteredTransactions(filters?: {
  type?: string
  category?: string
  startDate?: string
  endDate?: string
}) {
  try {
    let transactions = await fetchAllTransactions()

    if (filters) {
      if (filters.type && filters.type !== "all") {
        transactions = transactions.filter((t) => t.type === filters.type)
      }

      if (filters.category && filters.category !== "all") {
        transactions = transactions.filter((t) => t.category === filters.category)
      }

      if (filters.startDate) {
        transactions = transactions.filter((t) => new Date(t.date) >= new Date(filters.startDate!))
      }

      if (filters.endDate) {
        transactions = transactions.filter((t) => new Date(t.date) <= new Date(filters.endDate!))
      }
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error fetching filtered transactions:", error)
    return []
  }
}

// Cải thiện hàm parseDate để xử lý nhiều định dạng ngày tháng hơn

// Hàm để phân tích ngày tháng từ chuỗi
function parseDate(dateString: string): { day: number; month: number; year: number } | null {
  try {
    console.log(`Đang phân tích ngày: "${dateString}"`)

    // Nếu là số, có thể là định dạng Excel
    if (!isNaN(Number(dateString))) {
      const excelDate = Number(dateString)
      // Chuyển đổi từ Excel date sang JavaScript date
      const jsDate = new Date((excelDate - 25569) * 86400 * 1000)
      console.log(`  Phân tích Excel date ${excelDate} thành:`, jsDate)
      return {
        day: jsDate.getDate(),
        month: jsDate.getMonth() + 1,
        year: jsDate.getFullYear(),
      }
    }

    // Kiểm tra định dạng DD/MM/YYYY
    if (dateString.includes("/")) {
      const parts = dateString.split("/")
      if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10)
        const month = Number.parseInt(parts[1], 10)
        const year = Number.parseInt(parts[2], 10)

        // Kiểm tra tính hợp lệ
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day > 0 && day <= 31 && month > 0 && month <= 12) {
          console.log(`  Phân tích DD/MM/YYYY thành: ${day}/${month}/${year}`)
          return { day, month, year }
        }
      }
    }

    // Kiểm tra định dạng YYYY-MM-DD
    if (dateString.includes("-")) {
      const parts = dateString.split("-")
      if (parts.length === 3) {
        const year = Number.parseInt(parts[0], 10)
        const month = Number.parseInt(parts[1], 10)
        const day = Number.parseInt(parts[2], 10)

        // Kiểm tra tính hợp lệ
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day > 0 && day <= 31 && month > 0 && month <= 12) {
          console.log(`  Phân tích YYYY-MM-DD thành: ${day}/${month}/${year}`)
          return { day, month, year }
        }
      }
    }

    // Thử phân tích bằng Date constructor
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      console.log(
        `  Phân tích bằng Date constructor thành: ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
      )
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      }
    }

    console.error(`  Không thể phân tích ngày: ${dateString}`)
    return null
  } catch (error) {
    console.error(`Error parsing date ${dateString}:`, error)
    return null
  }
}

// Hàm helper để sắp xếp giao dịch theo thời gian
function sortTransactionsByTime(transactions: any[]) {
  return transactions.sort((a, b) => {
    // Ưu tiên sắp xếp theo date thực tế trước
    const dateInfoA = parseDate(a.date)
    const dateInfoB = parseDate(b.date)

    if (dateInfoA && dateInfoB) {
      // So sánh theo năm, tháng, ngày
      if (dateInfoA.year !== dateInfoB.year) {
        return dateInfoA.year - dateInfoB.year
      }
      if (dateInfoA.month !== dateInfoB.month) {
        return dateInfoA.month - dateInfoB.month
      }
      if (dateInfoA.day !== dateInfoB.day) {
        return dateInfoA.day - dateInfoB.day
      }
    }

    // Nếu cùng ngày hoặc không parse được date, sắp xếp theo timestamp
    const dateA = new Date(a.timestamp || a.date)
    const dateB = new Date(b.timestamp || b.date)
    return dateA.getTime() - dateB.getTime()
  })
}

// Thêm hàm mới để tính toán dữ liệu tài khoản trực tiếp từ Sheet1 với logic tuần tự
export async function calculateAccountData(month: number, year: number) {
  try {
    console.log(`Calculating account data for ${month}/${year}`)
    const transactions = await fetchAllTransactions()
    console.log(`Total transactions for calculation: ${transactions.length}`)

    // Tính toán số dư đầu kỳ (từ tháng trước)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Lọc tất cả giao dịch từ đầu đến hết tháng trước (KHÔNG BAO GỒM tháng hiện tại)
    const prevTransactions = transactions.filter((transaction) => {
      if (!transaction.date) return false
      const dateInfo = parseDate(transaction.date)
      if (!dateInfo) return false
      // Chỉ lấy giao dịch TRƯỚC tháng hiện tại
      return dateInfo.year < year || (dateInfo.year === year && dateInfo.month < month)
    })

    console.log(`Previous transactions count: ${prevTransactions.length}`)
    console.log(`Logic: Lấy giao dịch TRƯỚC tháng ${month}/${year} để tính số dư đầu kỳ`)

    // Tính số dư đầu kỳ từ tất cả giao dịch trước đó (LOGIC ĐƠN GIẢN)
    let beginningAccountBalance = 0
    let beginningCashBalance = 0

    // Sắp xếp giao dịch trước đó theo thời gian
    const sortedPrevTransactions = sortTransactionsByTime(prevTransactions)

    // Xử lý tuần tự các giao dịch trước đó
    for (const transaction of sortedPrevTransactions) {
      const isCash = transaction.paymentMethod === "cash" || transaction.paymentMethod === "Tiền mặt"

      if (isCash) {
        if (transaction.type === "income") {
          beginningCashBalance += transaction.amount
        } else {
          beginningCashBalance -= transaction.amount
        }
      } else {
        if (transaction.type === "income") {
          beginningAccountBalance += transaction.amount
        } else {
          beginningAccountBalance -= transaction.amount
        }
      }
      // BỎ HOÀN TOÀN LOGIC TỰ ĐỘNG CHUYỂN TIỀN
    }

    console.log(`Beginning account balance: ${beginningAccountBalance}`)
    console.log(`Beginning cash balance: ${beginningCashBalance}`)

    // Lọc giao dịch tháng hiện tại
    const currentMonthTransactions = transactions.filter((transaction) => {
      if (!transaction.date) return false
      const dateInfo = parseDate(transaction.date)
      if (!dateInfo) return false
      return dateInfo.month === month && dateInfo.year === year
    })

    console.log(`Current month transactions: ${currentMonthTransactions.length}`)

    // Sắp xếp giao dịch tháng hiện tại theo thời gian
    const sortedCurrentTransactions = sortTransactionsByTime(currentMonthTransactions)

    // Khởi tạo số dư hiện tại từ số dư đầu kỳ (LOGIC ĐƠN GIẢN)
    let currentAccountBalance = beginningAccountBalance
    let currentCashBalance = beginningCashBalance
    let totalFuel = 0

    // Theo dõi các giao dịch để tính toán thống kê
    let totalAdvancedAccount = 0
    let totalAdvancedCash = 0
    let accountExpenses = 0
    let cashExpenses = 0

    // Xử lý tuần tự từng giao dịch tháng hiện tại
    for (const transaction of sortedCurrentTransactions) {
      const isCash = transaction.paymentMethod === "cash" || transaction.paymentMethod === "Tiền mặt"

      console.log(
        `Processing transaction: ${transaction.description}, Amount: ${transaction.amount}, Type: ${transaction.type}, Cash: ${isCash}`,
      )

      // Áp dụng giao dịch vào số dư
      if (isCash) {
        if (transaction.type === "income") {
          currentCashBalance += transaction.amount
          totalAdvancedCash += transaction.amount
        } else {
          currentCashBalance -= transaction.amount
          cashExpenses += transaction.amount
        }
      } else {
        if (transaction.type === "income") {
          currentAccountBalance += transaction.amount
          totalAdvancedAccount += transaction.amount
        } else {
          currentAccountBalance -= transaction.amount
          accountExpenses += transaction.amount
        }
      }

      // BỎ HOÀN TOÀN LOGIC TỰ ĐỘNG CHUYỂN TIỀN
      // Để số dư tài khoản có thể âm nếu cần

      // Tính toán xăng nếu có
      if (
        transaction.category &&
        transaction.category.toLowerCase().includes("chi phí xe") &&
        transaction.subCategory === "Xăng" &&
        transaction.fuelLiters
      ) {
        const fuelAmount = Number.parseFloat(transaction.fuelLiters.toString())
        if (!isNaN(fuelAmount)) {
          totalFuel += fuelAmount
        }
      }
    }

    // Logic đơn giản: Không có điều chỉnh gì
    const finalAccountExpenses = accountExpenses
    const finalCashExpenses = cashExpenses

    // Log chi tiết để kiểm tra số liệu
    console.log("=== CHI TIẾT SỐ LIỆU (LOGIC ĐƠN GIẢN) ===");
    console.log(`Số dư đầu kỳ tài khoản: ${beginningAccountBalance}`);
    console.log(`Số dư đầu kỳ tiền mặt: ${beginningCashBalance}`);
    console.log(`Tổng tiền vào tài khoản tháng này: ${totalAdvancedAccount}`);
    console.log(`Tổng tiền vào tiền mặt tháng này: ${totalAdvancedCash}`);
    console.log(`Chi tiêu tài khoản: ${finalAccountExpenses}`);
    console.log(`Chi tiêu tiền mặt: ${finalCashExpenses}`);
    console.log(`Số dư tài khoản cuối: ${currentAccountBalance}`);
    console.log(`Số dư tiền mặt cuối: ${currentCashBalance}`);
    console.log("================================");

    const result = {
      currentBalance: currentAccountBalance + currentCashBalance,
      totalExpense: finalAccountExpenses + finalCashExpenses,
      beginningBalance: beginningAccountBalance,
      totalAdvanced: totalAdvancedAccount,
      accountRemaining: currentAccountBalance, // Có thể âm
      accountExpenses: finalAccountExpenses, // Chi tiêu tài khoản
      cashRemaining: currentCashBalance, // Số dư tiền mặt
      cashExpenses: finalCashExpenses, // Chi tiêu tiền mặt
      totalFuel,
      // Bỏ tất cả tracking về auto-transfer
      rawAccountExpenses: accountExpenses, // Chi tiêu tài khoản gốc
      rawCashExpenses: cashExpenses, // Chi tiêu tiền mặt gốc
    }

    console.log("Calculated account data:", result)
    return result
  } catch (error) {
    console.error("Error calculating account data:", error)
    return {
      currentBalance: 0,
      totalExpense: 0,
      beginningBalance: 0,
      totalAdvanced: 0,
      accountRemaining: 0,
      accountExpenses: 0,
      cashRemaining: 0,
      cashExpenses: 0,
      totalFuel: 0,
    }
  }
}
