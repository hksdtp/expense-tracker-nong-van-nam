"use client"

import { useEffect, useState } from "react"
import { X, Tag, Fuel, CreditCard, Calendar, FileText, Camera, DollarSign, Loader2 } from "lucide-react"
import { TransactionTypeTabs } from "./transaction-type-tabs"
import { CategoryDropdown } from "./category-dropdown"
import { SubCategoryDropdown } from "./sub-category-dropdown"
import { PaymentMethodDropdown } from "./payment-method-dropdown"
import { CustomDatePicker } from "./custom-date-picker"
import { MacOSReceiptUpload } from "./macos-receipt-upload"
import { AmountInputWithSuggestions } from "./amount-input-with-suggestions"
import { useToast } from "@/components/ui/use-toast"
import type { Transaction } from "@/lib/types"

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onSuccess?: () => void
}

export function EditTransactionModal({ isOpen, onClose, transaction, onSuccess }: EditTransactionModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense")
  const [category, setCategory] = useState("")
  const [subCategory, setSubCategory] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [fuelLiters, setFuelLiters] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [note, setNote] = useState("")
  const [receiptImageUrl, setReceiptImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const { toast } = useToast()

  // Pre-fill data when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      setActiveTab(transaction.type as "expense" | "income")
      setCategory(transaction.category || "")
      setSubCategory(transaction.subCategory || "")
      setDescription(transaction.description || "")
      setAmount(transaction.amount?.toString() || "")
      setFuelLiters(transaction.fuelLiters || "")
      setPaymentMethod(transaction.paymentMethod || "")
      setNote(transaction.note || "")
      setReceiptImageUrl(transaction.receiptLink || "")
      
      // Parse date
      if (transaction.date) {
        try {
          // Handle different date formats
          let dateObj: Date
          if (transaction.date.includes('/')) {
            // Format: dd/mm/yyyy
            const [day, month, year] = transaction.date.split('/')
            dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          } else {
            dateObj = new Date(transaction.date)
          }
          setSelectedDate(dateObj)
        } catch (error) {
          console.error("Error parsing date:", error)
          setSelectedDate(new Date())
        }
      }
    }
  }, [transaction, isOpen])

  // Handle modal visibility
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
      resetForm()
    }, 300)
  }

  const resetForm = () => {
    setActiveTab("expense")
    setCategory("")
    setSubCategory("")
    setDescription("")
    setAmount("")
    setFuelLiters("")
    setPaymentMethod("")
    setSelectedDate(new Date())
    setNote("")
    setReceiptImageUrl("")
    setIsSubmitting(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleTabChange = (tab: "expense" | "income") => {
    setActiveTab(tab)
    // Reset category when changing tab but keep other fields
    setCategory("")
    setSubCategory("")
    setFuelLiters("")
  }

  const handleSubmit = async () => {
    if (!transaction) return

    // Validation
    if (!category || !description || !amount || !paymentMethod) {
      toast({
        title: "❌ Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
        variant: "destructive"
      })
      return
    }

    if (category === "Chi phí xe ô tô" && !subCategory) {
      toast({
        title: "❌ Thiếu danh mục con", 
        description: "Vui lòng chọn danh mục con cho chi phí xe ô tô",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create FormData for API call
      const formData = new FormData()
      formData.append("type", activeTab)
      formData.append("category", category)
      formData.append("description", description)
      formData.append("amount", amount)
      formData.append("paymentMethod", paymentMethod)
      // Format date as dd/mm/yyyy để consistent với Google Sheets
      const day = selectedDate.getDate().toString().padStart(2, '0')
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0')
      const year = selectedDate.getFullYear()
      const formattedDate = `${day}/${month}/${year}`
      formData.append("date", formattedDate)
      formData.append("note", note)
      formData.append("receiptLink", receiptImageUrl)
      
      if (subCategory) {
        formData.append("subCategory", subCategory)
      }
      
      if (fuelLiters) {
        formData.append("fuelLiters", fuelLiters)
      }

      // Add rowIndex for Google Sheets update
      if (transaction.rowIndex) {
        formData.append("rowIndex", transaction.rowIndex.toString())
      }

      // Call API to update transaction
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to update transaction")
      }

      toast({
        title: "✅ Thành công",
        description: "Giao dịch đã được cập nhật thành công",
      })

      handleClose()
      
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: "❌ Lỗi",
        description: "Không thể cập nhật giao dịch. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div
      className={`
        fixed inset-0 backdrop-z-base flex items-center justify-center p-4
        transition-all duration-300 ease-out
        ${isVisible
          ? "backdrop-standard"
          : "bg-black/0 backdrop-blur-none"
        }
      `}
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div
        className={`
          glass-modal backdrop-z-modal rounded-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto macos-scrollbar
          transition-all duration-300 ease-out
          ${isVisible
            ? "scale-100 opacity-100 translate-x-0 translate-y-0"
            : "scale-75 opacity-0 translate-x-32 translate-y-32"
          }
        `}
        style={{
          transformOrigin: 'bottom right'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Chỉnh sửa giao dịch
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Transaction Type Tabs */}
          <TransactionTypeTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="mb-4"
          />

          {/* Form Fields */}
          <div className="space-y-3">
            {/* Date Field */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Ngày giao dịch <span className="text-red-500 ml-1">*</span>
              </label>
              <CustomDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
              />
            </div>

            {/* Category Field */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                Danh mục <span className="text-red-500 ml-1">*</span>
              </label>
              <CategoryDropdown
                value={category}
                onChange={(value) => {
                  setCategory(value)
                  // Reset sub category và fuel liters khi thay đổi category chính
                  if (value !== "Chi phí xe ô tô") {
                    setSubCategory("")
                    setFuelLiters("")
                  }
                }}
                type={activeTab}
                placeholder="Chọn danh mục"
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                Mô tả <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả giao dịch"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            {/* Amount Field with Suggestions */}
            <AmountInputWithSuggestions
              value={amount}
              onChange={setAmount}
              placeholder="Nhập số tiền"
              required
            />

            {/* Sub Category Field - chỉ hiện khi chọn "Chi phí xe ô tô" */}
            {category === "Chi phí xe ô tô" && (
              <div className="transition-all duration-200">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <Tag className="w-4 h-4 mr-2 text-gray-500" />
                  Danh mục con <span className="text-red-500 ml-1">*</span>
                </label>
                <SubCategoryDropdown
                  value={subCategory}
                  onChange={(value) => {
                    setSubCategory(value)
                    // Reset fuel liters khi thay đổi sub category
                    if (value !== "Xăng") {
                      setFuelLiters("")
                    }
                  }}
                  placeholder="Chọn danh mục con"
                />
              </div>
            )}

            {/* Fuel Liters Field - chỉ hiện khi chọn danh mục con "Xăng" */}
            {category === "Chi phí xe ô tô" && subCategory === "Xăng" && (
              <div className="transition-all duration-200">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <Fuel className="w-4 h-4 mr-2 text-gray-500" />
                  Số lít xăng
                </label>
                <input
                  type="number"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  placeholder="Nhập số lít xăng"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  step="0.1"
                  min="0"
                />
              </div>
            )}

            {/* Payment Method Field */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
                Phương thức thanh toán <span className="text-red-500 ml-1">*</span>
              </label>
              <PaymentMethodDropdown
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder="Chọn phương thức"
              />
            </div>

            {/* Note Field */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú (tùy chọn)"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-200 resize-none"
                rows={2}
              />
            </div>

            {/* Receipt Upload Field */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Camera className="w-4 h-4 mr-2 text-gray-500" />
                Ảnh hóa đơn
              </label>
              <MacOSReceiptUpload
                onImageUpload={setReceiptImageUrl}
                disabled={false}
              />

              {/* Image Preview */}
              {receiptImageUrl && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <img
                        src={receiptImageUrl}
                        alt="Preview hóa đơn"
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        onClick={() => setShowImageViewer(true)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Ảnh hóa đơn hiện tại
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {receiptImageUrl.split('/').pop()?.split('.')[0]}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Click để xem ảnh
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImageUrl("")}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`
                flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${activeTab === "expense"
                  ? "bg-red-500 hover:bg-red-600 disabled:bg-red-400"
                  : "bg-green-500 hover:bg-green-600 disabled:bg-green-400"
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Image Viewer Modal */}
    {showImageViewer && receiptImageUrl && (
      <div
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
        onClick={() => setShowImageViewer(false)}
      >
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={() => setShowImageViewer(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={receiptImageUrl}
            alt="Hóa đơn"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )}
  </>
  )
}
