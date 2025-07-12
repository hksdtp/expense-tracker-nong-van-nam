"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Receipt,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Edit,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useDate } from "@/lib/date-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Transaction } from "@/lib/types"
import { CategorySelector } from "@/components/category-selector"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ReceiptViewer } from "@/components/receipt-viewer"
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { EditTransactionModal } from "@/components/edit-transaction-modal"
import { useTransactions } from "@/lib/hooks"
import { useToast } from "@/components/ui/use-toast"
import { SimpleImageViewer } from "@/components/simple-image-viewer"
import { CompactImageViewer } from "@/components/image-viewer"
interface TransactionTabsFixedProps {
  transactions?: Transaction[]
  isTransitioning?: boolean
  slideDirection?: 'left' | 'right' | null
}

// Helper: Format currency chỉ phía client
function formatCurrency(amount: number) {
  if (typeof window !== "undefined") {
    return amount.toLocaleString("vi-VN") + " đ"
  }
  // SSR fallback
  return amount + " đ"
}

// Helper: Format date chỉ phía client
function formatDate(date: string) {
  // Tránh sử dụng phát hiện client-side trực tiếp trong render
  if (!date) return "---";
  
  // Kiểm tra nếu đã ở định dạng dd/MM/yyyy
  if (date.includes('/') && date.split('/').length === 3) {
    return date;
  }
  
  try {
    // Dùng cách định dạng an toàn cho cả server và client 
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      // Dùng định dạng thủ công để tránh sai lệch server/client
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    console.error("Lỗi chuyển đổi ngày: ", e);
  }
  
  // Trả về giá trị gốc nếu không xử lý được
  return date || "---";
}

// Chuyển đổi sang định dạng ngày Việt Nam
const formatVietnameseDate = (dateStr: string) => {
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1])
    const year = parseInt(parts[2])
    
    // Kiểm tra nếu là ngày hôm nay
    const today = new Date()
    const todayDate = today.getDate()
    const todayMonth = today.getMonth() + 1
    const todayYear = today.getFullYear()
    
    if (day === todayDate && month === todayMonth && year === todayYear) {
      return `Hôm nay, ${day} Thg ${month}`
    }
    
    return `${day} Thg ${month}`
  }
  return dateStr
}

export function TransactionTabsFixed({
  transactions: initialTransactions,
  isTransitioning = false,
  slideDirection = null,
}: TransactionTabsFixedProps) {
  const { currentDate } = useDate()
  const [activeCategory, setActiveCategory] = useState("total")
  const [isMobile, setIsMobile] = useState(false)
  const [activeSubCategory, setActiveSubCategory] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const transactionsEndRef = useRef<HTMLDivElement>(null)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // Add a refresh key to force re-fetch
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isDebugOpen, setIsDebugOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { rowIndex?: number }) | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManualRefresh, setIsManualRefresh] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<(Transaction & { rowIndex?: number }) | null>(null)
  const { toast } = useToast()

  // Thêm state cho việc hiển thị tháng và năm để tránh lỗi hydration
  const [displayMonth, setDisplayMonth] = useState<string>("")

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [displayYear, setDisplayYear] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false)

  // Cập nhật displayMonth và displayYear sau khi component mount
  useEffect(() => {
    setIsMounted(true)
    setDisplayMonth(String(currentDate.getMonth() + 1))
    setDisplayYear(String(currentDate.getFullYear()))
  }, [currentDate])

  // State cho trình xem ảnh đơn giản
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState("")

  // Sử dụng hook useTransactions
  const { transactions, isLoading, isError, errorMessage, mutate } = useTransactions(
    currentDate.getMonth() + 1,
    currentDate.getFullYear(),
  )

  // Danh mục chi tiêu
  const expenseCategories = [
    { id: "total", name: "Tổng" },
    { id: "car", name: "Chi phí xe ô tô" },
    { id: "restaurant", name: "Nhà hàng" },
    { id: "delivery", name: "Giao nhận đồ" },
    { id: "services", name: "Mua đồ/ dịch vụ" },
    { id: "other", name: "Chi phí khác" },
  ]

  // Danh mục con cho chi phí xe ô tô
  const carSubCategories = [
    { id: "all", name: "Tất cả chi phí xe" },
    { id: "gas", name: "Xăng" },
    { id: "repair", name: "Sửa chữa" },
    { id: "wash", name: "Rửa xe" },
    { id: "parking", name: "Vé đỗ xe ô tô" },
    { id: "insurance", name: "Đăng kiểm / Bảo hiểm" },
    { id: "maintenance", name: "Bảo dưỡng" },
    { id: "toll", name: "Vé cầu đường" },
    { id: "other", name: "Khác" },
  ]

  // Danh mục thu nhập
  const incomeCategories = [
    { id: "total", name: "Tổng" },
    { id: "account", name: "Ứng tài khoản" },
    { id: "cash", name: "Ứng tiền mặt" },
    { id: "refund", name: "Hoàn tiền" },
  ]

  // Cập nhật error state khi có lỗi từ hook
  useEffect(() => {
    if (errorMessage && !isManualRefresh) {
      setError(errorMessage)
    }
  }, [errorMessage, isManualRefresh])

  // Tính toán số dư hiện tại khi transactions thay đổi
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const totalIncome = transactions
        .filter((t: Transaction) => t.type === "income")
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)

      const totalExpense = transactions
        .filter((t: Transaction) => t.type === "expense")
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)

      setCurrentBalance(totalIncome - totalExpense)
    }
  }, [transactions])



  // Hàm làm mới dữ liệu
  const refreshData = () => {
    setIsManualRefresh(true)
    setError(null)

    try {
      mutate()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsManualRefresh(false)
    }
  }

  // Xử lý khi tab thay đổi
  const handleTabChange = (value: string) => {
    setActiveTab(value as "expense" | "income")
    setExpandedCategory(null)
    setActiveCategory("total") // Reset về tổng khi chuyển tab
  }

  // Xử lý khi chỉnh sửa giao dịch
  const handleEditTransaction = (transaction: Transaction, rowIndex: number) => {
    try {
      const transactionWithRowIndex = { ...transaction, rowIndex };
      setEditingTransaction(transactionWithRowIndex);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error opening edit modal:", error);
      toast({
        title: "Lỗi",
        description: "Không thể mở form chỉnh sửa giao dịch",
        variant: "destructive",
      });
    }
  }

  // Xử lý khi xóa giao dịch
  const handleDeleteTransaction = async (transaction: Transaction & { rowIndex?: number }) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmOpen(true);
  };

  // Thực hiện xóa giao dịch sau khi xác nhận
  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      const formData = new FormData();
      formData.append("rowIndex", (transactionToDelete.rowIndex ?? "").toString());
      // Gọi hàm xóa giao dịch từ actions
      const result = await import("@/lib/actions").then(mod => mod.deleteTransaction(formData));
      if (result.success) {
        // Hiển thị thông báo thành công
        console.log("Xóa giao dịch thành công", transactionToDelete);
        // Tải lại dữ liệu
        refreshData();
      } else {
        console.error("Lỗi khi xóa giao dịch:", result.error);
      }
    } catch (error: any) {
      console.error("Lỗi khi xóa giao dịch:", error.message);
    } finally {
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Lọc và nhóm giao dịch theo ngày thay vì danh mục
  const getFilteredTransactions = (): Record<string, Transaction[]> => {
    const result: Record<string, Transaction[]> = {}

    if (activeTab === "expense") {
      // Lọc giao dịch chi tiêu
      const expenseTransactions = transactions.filter((t: Transaction) => t.type === "expense")
      
      // Lọc theo danh mục nếu cần
      let filteredTransactions = expenseTransactions
      if (activeCategory !== "total") {
        const categoryName = expenseCategories.find((c) => c.id === activeCategory)?.name || ""
        filteredTransactions = expenseTransactions.filter((t: Transaction) => t.category === categoryName)
        
        // Lọc theo danh mục con nếu cần
        if (activeCategory === "car" && activeSubCategory !== "all") {
          const subCategoryName = carSubCategories.find((c) => c.id === activeSubCategory)?.name || ""
          filteredTransactions = filteredTransactions.filter((t: Transaction) => t.subCategory === subCategoryName)
        }
      }
      
      // Nhóm theo ngày
      filteredTransactions.forEach((transaction) => {
        const date = transaction.date // Định dạng dd/mm/yyyy
        if (!result[date]) {
          result[date] = []
        }
        result[date].push(transaction)
      })
      
      // Sắp xếp giao dịch trong mỗi ngày theo thời gian gần nhất
      Object.keys(result).forEach((date) => {
        result[date].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.date.split("/").reverse().join("-"))
          const dateB = new Date(b.timestamp || b.date.split("/").reverse().join("-"))
          return dateB.getTime() - dateA.getTime()
        })
      })
    } else {
      // Lọc giao dịch thu nhập
      const incomeTransactions = transactions.filter((t: Transaction) => t.type === "income")
      
      // Lọc theo danh mục nếu cần
      let filteredTransactions = incomeTransactions
      if (activeCategory !== "total") {
        const categoryName = incomeCategories.find((c) => c.id === activeCategory)?.name || ""
        filteredTransactions = incomeTransactions.filter((t: Transaction) => t.category === categoryName)
      }
      
      // Nhóm theo ngày
      filteredTransactions.forEach((transaction) => {
        const date = transaction.date // Định dạng dd/mm/yyyy
        if (!result[date]) {
          result[date] = []
        }
        result[date].push(transaction)
      })
      
      // Sắp xếp giao dịch trong mỗi ngày theo thời gian gần nhất
      Object.keys(result).forEach((date) => {
        result[date].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.date.split("/").reverse().join("-"))
          const dateB = new Date(b.timestamp || b.date.split("/").reverse().join("-"))
          return dateB.getTime() - dateA.getTime()
        })
      })
    }

    // Trả về đối tượng với các ngày được sắp xếp theo thứ tự mới nhất
    const sortedResult: Record<string, Transaction[]> = {}
    Object.keys(result)
      .sort((a, b) => {
        // Sắp xếp ngày theo thứ tự giảm dần (mới nhất trước)
        const dateA = new Date(a.split("/").reverse().join("-"))
        const dateB = new Date(b.split("/").reverse().join("-"))
        return dateB.getTime() - dateA.getTime()
      })
      .forEach((date) => {
        sortedResult[date] = result[date]
      })

    return sortedResult
  }

  // Lấy tổng số giao dịch cho danh mục đã chọn
  const getFilteredTransactionsCount = () => {
    if (activeTab === "expense") {
      const expenseTransactions = transactions.filter((t: Transaction) => t.type === "expense")

      if (activeCategory === "total") {
        return expenseTransactions.length
      } else if (activeCategory === "car" && activeSubCategory !== "all") {
        const categoryName = "Chi phí xe ô tô"
        const subCategoryName = carSubCategories.find((c) => c.id === activeSubCategory)?.name || ""

        return expenseTransactions.filter((t: Transaction) => t.category === categoryName && t.subCategory === subCategoryName)
          .length
      } else {
        const categoryName = expenseCategories.find((c) => c.id === activeCategory)?.name || ""
        return expenseTransactions.filter((t: Transaction) => t.category === categoryName).length
      }
    } else {
      const incomeTransactions = transactions.filter((t: Transaction) => t.type === "income")

      if (activeCategory === "total") {
        return incomeTransactions.length
      } else {
        const categoryName = incomeCategories.find((c) => c.id === activeCategory)?.name || ""
        return incomeTransactions.filter((t: Transaction) => t.category === categoryName).length
      }
    }
  }

  // Lấy tổng tiền cho danh mục đã chọn
  const getTotalAmount = () => {
    if (activeTab === "expense") {
      const expenseTransactions = transactions.filter((t: Transaction) => t.type === "expense")

      if (activeCategory === "total") {
        return expenseTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
      } else if (activeCategory === "car" && activeSubCategory !== "all") {
        const categoryName = "Chi phí xe ô tô"
        const subCategoryName = carSubCategories.find((c) => c.id === activeSubCategory)?.name || ""

        return expenseTransactions
          .filter((t: Transaction) => t.category === categoryName && t.subCategory === subCategoryName)
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
      } else {
        const categoryName = expenseCategories.find((c) => c.id === activeCategory)?.name || ""
        return expenseTransactions.filter((t: Transaction) => t.category === categoryName).reduce((sum: number, t: Transaction) => sum + t.amount, 0)
      }
    } else {
      const incomeTransactions = transactions.filter((t: Transaction) => t.type === "income")

      if (activeCategory === "total") {
        return incomeTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
      } else {
        const categoryName = incomeCategories.find((c) => c.id === activeCategory)?.name || ""
        return incomeTransactions.filter((t: Transaction) => t.category === categoryName).reduce((sum: number, t: Transaction) => sum + t.amount, 0)
      }
    }
  }

  // Lấy màu cho danh mục
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Chi phí xe ô tô": "bg-blue-100 text-blue-800",
      "Nhà hàng": "bg-orange-100 text-orange-800",
      "Giao nhận đồ": "bg-purple-100 text-purple-800",
      "Mua đồ/ dịch vụ": "bg-green-100 text-green-800",
      "Chi phí khác": "bg-gray-100 text-gray-800",
      "Ứng tài khoản": "bg-emerald-100 text-emerald-800",
      "Ứng tiền mặt": "bg-cyan-100 text-cyan-800",
      "Hoàn tiền": "bg-amber-100 text-amber-800",
    }

    return colors[category] || "bg-gray-100 text-gray-800"
  }

  // Lấy màu cho danh mục con
  const getSubCategoryColor = (subCategory: string) => {
    const colors: Record<string, string> = {
      Xăng: "bg-red-100 text-red-800",
      "Vé đỗ xe ô tô": "bg-blue-100 text-blue-800",
      VETC: "bg-yellow-100 text-yellow-800",
      "Rửa xe": "bg-cyan-100 text-cyan-800",
      "Bảo dưỡng": "bg-orange-100 text-orange-800",
      "Sửa chữa": "bg-purple-100 text-purple-800",
      "Đăng kiểm / Bảo hiểm": "bg-green-100 text-green-800",
      "Vé cầu đường": "bg-red-100 text-red-800",
      "Khác": "bg-gray-100 text-gray-800",
    }

    return colors[subCategory] || "bg-gray-100 text-gray-800"
  }

  // Lấy danh sách giao dịch đã lọc và nhóm
  const filteredTransactions = getFilteredTransactions()
  const filteredTransactionsCount = getFilteredTransactionsCount()
  const totalAmount = getTotalAmount()

  // Lấy tiêu đề cho phần tổng tiền
  const getTotalAmountTitle = () => {
    if (activeTab === "expense") {
      if (activeCategory === "total") {
        return "Tổng tiền Chi tiêu"
      } else if (activeCategory === "car" && activeSubCategory !== "all") {
        return `Tổng tiền ${carSubCategories.find((c) => c.id === activeSubCategory)?.name || ""}`
      } else {
        return `Tổng tiền ${expenseCategories.find((c) => c.id === activeCategory)?.name || ""}`
      }
    } else {
      if (activeCategory === "total") {
        return "Tổng tiền Nhập tiền"
      } else {
        return `Tổng tiền ${incomeCategories.find((c) => c.id === activeCategory)?.name || ""}`
      }
    }
  }

  // Xem chi tiết giao dịch
  const handleViewTransactionDetail = (transaction: Transaction, index: number) => {
    console.log("View transaction detail:", transaction)
    
    // Nếu có hình ảnh hóa đơn, hiển thị ảnh trong popup
    if (transaction.imageUrl) {
      // Ưu tiên imageUrl từ Cloudinary
      setCurrentImageUrl(transaction.imageUrl)
      setIsImageViewerOpen(true)
    } else if (transaction.receiptLink) {
      let fileId = ""
      let imageUrl = ""
      
      try {
        // Xác định fileId từ các loại link khác nhau
        if (transaction.receiptLink.includes("drive.google.com/uc?export=view")) {
          fileId = transaction.receiptLink.split("id=")[1]?.split("&")[0] || ""
        } else if (transaction.receiptLink.includes("drive.google.com/thumbnail")) {
          fileId = transaction.receiptLink.split("id=")[1]?.split("&")[0] || ""
        } else if (transaction.receiptLink.includes("drive.google.com/file/d/")) {
          fileId = transaction.receiptLink.split("/file/d/")[1].split("/")[0]
        } else if (transaction.receiptLink.startsWith("/api/image-proxy/")) {
          fileId = transaction.receiptLink.split("/api/image-proxy/")[1]
        } else if (transaction.receiptLink.includes("id=")) {
          fileId = transaction.receiptLink.split("id=")[1]?.split("&")[0] || ""
        }

        if (fileId) {
          // Sử dụng thumbnail với kích thước lớn để hiển thị ảnh tốt hơn
          imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
          setCurrentImageUrl(imageUrl)
          setIsImageViewerOpen(true)
        } else {
          // Nếu không xác định được fileId, sử dụng link gốc
          setCurrentImageUrl(transaction.receiptLink)
          setIsImageViewerOpen(true)
        }
      } catch (error) {
        console.error("Error processing receipt image:", error)
        
        // Nếu có lỗi, vẫn thử hiển thị link gốc
        setCurrentImageUrl(transaction.receiptLink)
        setIsImageViewerOpen(true)
      }
    } else {
      // Nếu không có ảnh, không làm gì cả
      console.log("Giao dịch không có ảnh hóa đơn, không hiển thị gì")
      // Hiển thị thông báo nhỏ
      toast({
        title: "Không có ảnh hóa đơn",
        description: "Giao dịch này không có ảnh hóa đơn để hiển thị",
        variant: "default",
        duration: 3000,
      })
    }
  }

  return (
    <Card className="rounded-lg overflow-hidden bg-white shadow-md mt-2">
      <Tabs defaultValue="expense" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-2">
          <TabsList className="w-full grid grid-cols-2 p-0 bg-white">
            <TabsTrigger
              value="expense"
              className="py-3 border-b-2 data-[state=active]:border-techcom-red data-[state=active]:text-techcom-red data-[state=inactive]:border-transparent rounded-none"
            >
              Chi Tiêu
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="py-3 border-b-2 data-[state=active]:border-techcom-red data-[state=active]:text-techcom-red data-[state=inactive]:border-transparent rounded-none"
            >
              Nhập Tiền
            </TabsTrigger>
          </TabsList>

        </div>



        <TabsContent value="expense" className="m-0">
          <CardContent className="p-4">
            <div
              className={`transition-all duration-300 ${
                isTransitioning
                  ? slideDirection === 'left'
                    ? 'transform -translate-x-full opacity-0'
                    : 'transform translate-x-full opacity-0'
                  : 'transform translate-x-0 opacity-100'
              }`}
            >
              <div className="text-sm font-medium mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                <span>
                  {isMounted ? `Chi tiêu - Tháng ${displayMonth} ${displayYear}` : "Chi tiêu"}
                </span>
              </div>

              <CategorySelector
              onCategoryChange={(mainCategory: string, subCategory?: string) => {
                // Ánh xạ từ ID danh mục sang tên danh mục
                const categoryMap: Record<string, string> = {
                  tong: "total",
                  "xe-oto": "car",
                  "nha-hang": "restaurant",
                  "giao-nhan": "delivery",
                  "mua-do": "services",
                  khac: "other",
                }

                // Ánh xạ từ ID danh mục con sang tên danh mục con
                const subCategoryMap: Record<string, string> = {
                  "tat-ca": "all",
                  xang: "gas",
                  "ve-do-xe": "parking",
                  vetc: "vetc",
                  "rua-xe": "wash",
                  "bao-duong": "maintenance",
                  "sua-chua": "repair",
                  "dang-kiem-bh": "insurance",
                  "ve-cau-duong": "toll",
                  khac: "other",
                }

                setActiveCategory(categoryMap[mainCategory] || mainCategory)
                setActiveSubCategory(subCategory ? subCategoryMap[subCategory] || subCategory : "all")
                setExpandedCategory(null)
              }}
              className="mb-4"
            />

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Hiển thị tổng chi tiêu cho danh mục đã chọn */}
            {!isLoading && transactions.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{getTotalAmountTitle()}</p>
                    <p className="text-sm text-gray-500">{filteredTransactionsCount} giao dịch</p>
                  </div>
                  <div className="text-xl font-bold text-techcom-red">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
            )}

            <div className="text-center py-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-techcom-red mb-4" />
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : transactions.some((t: Transaction) => t.type === "expense") ? (
                <div className="w-full space-y-3">
                  {/* Hiển thị danh sách giao dịch theo nhóm ngày */}
                  {Object.keys(filteredTransactions).length > 0 ? (
                    Object.entries(filteredTransactions).map(([date, dateTransactions]) => (
                      <Collapsible
                        key={date}
                        open={expandedCategory === date}
                        onOpenChange={(open) => {
                          if (open) {
                            setExpandedCategory(date)
                          } else if (expandedCategory === date) {
                            setExpandedCategory(null)
                          }
                        }}
                        className="w-full mb-3"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="bg-white border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all duration-300">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-800 mr-2">
                                {formatVietnameseDate(date)}
                              </span>
                              <span className="text-sm text-gray-500">{dateTransactions.length} giao dịch</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-techcom-red mr-2">
                                {formatCurrency(
                                  dateTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0),
                                )}
                              </span>
                              {expandedCategory === date ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 pl-2 transition-all duration-300">
                          {dateTransactions.map((transaction, index) => (
                            <div
                              key={transaction.id || index}
                              className={cn(
                                "bg-white p-3 rounded-lg flex items-start justify-between border-l-4 transition-all duration-300 animate-in hover:shadow-md",
                                transaction.type === "income" 
                                  ? "border-emerald-400" 
                                  : "border-rose-400",
                                index < 3 ? `stagger-${index + 1}` : "",
                              )}
                              ref={index === 0 && expandedCategory === date ? transactionsEndRef : null}
                              onClick={() => {
                                // Không làm gì khi click vào giao dịch
                              }}
                            >
                              <div className="flex items-center">
                                {/* Đã xóa icon theo yêu cầu */}
                                <div>
                                  <p className="font-medium text-gray-900 text-left">{transaction.description}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge className={cn(getCategoryColor(transaction.category))}>
                                      {transaction.category}
                                    </Badge>
                                    {transaction.subCategory && (
                                      <Badge className={cn(getSubCategoryColor(transaction.subCategory))}>
                                        {transaction.subCategory}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {transaction.receiptLink && (
                                  <ReceiptViewer receiptLink={transaction.receiptLink} size="sm" />
                                )}
                                {transaction.imageUrl && (
                                  <CompactImageViewer
                                    imageUrl={transaction.imageUrl}
                                    alt={`Receipt for ${transaction.description}`}
                                    size="w-10 h-10"
                                  />
                                )}
                                <div className={cn(
                                  "font-medium text-right",
                                  transaction.type === "income" 
                                    ? "text-emerald-600" 
                                    : "text-rose-600"
                                )}>
                                  {transaction.type === "income" ? "+" : "-"}
                                  {formatCurrency(transaction.amount)}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full transition-all duration-200 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTransaction(transaction, transaction.rowIndex || index);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full transition-all duration-200 hover:bg-gray-100 text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTransaction({ ...transaction, rowIndex: transaction.rowIndex || index });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-gray-500">Không có giao dịch nào trong danh mục này</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-gray-100 rounded-lg p-4 mb-3">
                    <Receipt className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    Không có dữ liệu giao dịch cho tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
                  </p>
                </div>
              )}
            </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="income" className="m-0">
          <CardContent className="p-4">
            <div
              className={`transition-all duration-300 ${
                isTransitioning
                  ? slideDirection === 'left'
                    ? 'transform -translate-x-full opacity-0'
                    : 'transform translate-x-full opacity-0'
                  : 'transform translate-x-0 opacity-100'
              }`}
            >
              <div className="text-sm font-medium mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                <span>
                  Nhập Tiền - Tháng {currentDate.getMonth() + 1} {currentDate.getFullYear()}
                </span>
              </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {incomeCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  onClick={() => {
                    setActiveCategory(category.id)
                    setExpandedCategory(null)
                  }}
                  className={
                    activeCategory === category.id
                      ? "bg-techcom-red text-white rounded-lg border-0 transition-all duration-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border-0 transition-all duration-300"
                  }
                  size="sm"
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Hiển thị tổng thu nhập cho danh mục đã chọn */}
            {!isLoading && transactions.some((t: Transaction) => t.type === "income") && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{getTotalAmountTitle()}</p>
                    <p className="text-sm text-gray-500">{filteredTransactionsCount} giao dịch</p>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
            )}

            <div className="text-center py-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-techcom-red mb-4" />
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : transactions.some((t: Transaction) => t.type === "income") ? (
                <div className="w-full space-y-3">
                  {/* Hiển thị danh sách giao dịch theo nhóm ngày */}
                  {Object.keys(filteredTransactions).length > 0 ? (
                    Object.entries(filteredTransactions).map(([date, dateTransactions]) => (
                      <Collapsible
                        key={date}
                        open={expandedCategory === date}
                        onOpenChange={(open) => {
                          if (open) {
                            setExpandedCategory(date)
                          } else if (expandedCategory === date) {
                            setExpandedCategory(null)
                          }
                        }}
                        className="w-full mb-3"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="bg-white border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all duration-300">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-800 mr-2">
                                {formatVietnameseDate(date)}
                              </span>
                              <span className="text-sm text-gray-500">{dateTransactions.length} giao dịch</span>
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-green-600 mr-2">
                                {formatCurrency(
                                  dateTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0),
                                )}
                              </span>
                              {expandedCategory === date ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2 pl-2 transition-all duration-300">
                          {dateTransactions.map((transaction, index) => (
                            <div
                              key={transaction.id || index}
                              className={cn(
                                "bg-white p-3 rounded-lg flex items-start justify-between border-l-4 border-green-400 transition-all duration-300 animate-in hover:shadow-md",
                                index < 3 ? `stagger-${index + 1}` : "",
                              )}
                              ref={index === 0 && expandedCategory === date ? transactionsEndRef : null}
                              onClick={() => {
                                // Không làm gì khi click vào giao dịch
                              }}
                            >
                              <div className="flex items-center">
                                <div>
                                  <p className="font-medium text-gray-900 text-left">{transaction.description}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <Badge className={cn(getCategoryColor(transaction.category))}>
                                      {transaction.category}
                                    </Badge>
                                    {transaction.subCategory && (
                                      <Badge className={cn(getSubCategoryColor(transaction.subCategory))}>
                                        {transaction.subCategory}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {transaction.receiptLink && (
                                  <ReceiptViewer receiptLink={transaction.receiptLink} size="sm" />
                                )}
                                {transaction.imageUrl && (
                                  <CompactImageViewer
                                    imageUrl={transaction.imageUrl}
                                    alt={`Receipt for ${transaction.description}`}
                                    size="w-10 h-10"
                                  />
                                )}
                                <div className={cn(
                                  "font-medium text-right",
                                  transaction.type === "income" 
                                    ? "text-emerald-600" 
                                    : "text-rose-600"
                                )}>
                                  {transaction.type === "income" ? "+" : "-"}
                                  {formatCurrency(transaction.amount)}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full transition-all duration-200 hover:bg-gray-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTransaction(transaction, transaction.rowIndex || index);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full transition-all duration-200 hover:bg-gray-100 text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTransaction({ ...transaction, rowIndex: transaction.rowIndex || index });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-gray-500">Không có giao dịch nào trong danh mục này</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-gray-100 rounded-lg p-4 mb-3">
                    <Receipt className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    Không có dữ liệu giao dịch cho tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
                  </p>
                </div>
              )}
            </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      {/* Debug Dialog */}
      <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[80vh] overflow-auto transition-all duration-300 animate-in fade-in-90 slide-in-from-bottom-10">
          <DialogHeader>
            <DialogTitle>Debug Information</DialogTitle>
          </DialogHeader>
          <div className="text-xs font-mono bg-gray-100 p-4 rounded overflow-auto">
            <h3 className="font-bold mb-2">Current Date:</h3>
            <p>
              Month: {currentDate.getMonth() + 1}, Year: {currentDate.getFullYear()}
            </p>

            <h3 className="font-bold mt-4 mb-2">API Response:</h3>
            {debugInfo ? <pre>{JSON.stringify(debugInfo, null, 2)}</pre> : <p>No debug information available</p>}

            <h3 className="font-bold mt-4 mb-2">Current Transactions:</h3>
            <p>Count: {transactions.length}</p>
            {transactions.length > 0 && <pre>{JSON.stringify(transactions.slice(0, 3), null, 2)}</pre>}
          </div>
          <Button onClick={() => setIsDebugOpen(false)} className="transition-all duration-200">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa giao dịch */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] mx-4">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center text-red-600 text-lg">
              <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
              Xác nhận xóa giao dịch
            </DialogTitle>
            <DialogDescription className="text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {transactionToDelete && (
            <div className="bg-gray-50 p-4 rounded-xl my-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900 text-lg">{transactionToDelete.category || "Không có danh mục"}</p>
                  <p className="text-sm text-gray-500">{formatDate(transactionToDelete.date)}</p>
                </div>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(transactionToDelete.amount)}
                </p>
              </div>
              {transactionToDelete.description && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-600 break-words">
                    {transactionToDelete.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex flex-row gap-3 pt-6" data-dialog-footer>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1 min-h-[48px] text-base gap-2 font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Xóa giao dịch
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 min-h-[48px] text-base font-medium"
            >
              Hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Image Viewer để hiển thị ảnh hóa đơn */}
      <SimpleImageViewer
        imageUrl={currentImageUrl}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        onSuccess={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
          // Refresh data
          setRefreshKey(prev => prev + 1)
          toast({
            title: "✅ Thành công",
            description: "Giao dịch đã được cập nhật",
          })
        }}
      />

    </Card>
  )
}
