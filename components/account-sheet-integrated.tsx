"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDate } from "@/lib/date-context"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/number-to-words"
import { ClientOnly } from "@/components/client-only"

interface AccountData {
  currentBalance: number // Số dư hiện có
  totalExpense: number // Tổng chi tiêu tháng (đã điều chỉnh)
  beginningBalance: number // Số dư đầu kỳ tài khoản
  totalAdvanced: number // Tổng đã ứng tháng này (chỉ tài khoản)
  accountRemaining: number // Tài khoản còn (luôn >= 0 do auto-transfer)
  accountExpenses: number // Tài khoản chi (đã điều chỉnh)
  cashRemaining: number // Tiền mặt còn (đã trừ auto-transfer)
  cashExpenses: number // Tiền mặt chi (bao gồm auto-transfer)
  totalFuel?: number // Tổng lít xăng
  // Các trường tracking mới
  rawAccountExpenses?: number // Chi tiêu tài khoản gốc
  rawCashExpenses?: number // Chi tiêu tiền mặt gốc
  totalAutoTransferred?: number // Auto-transfer tháng hiện tại
  totalHistoricalAutoTransfer?: number // Tổng auto-transfer lịch sử
  hasAutoTransfer?: boolean // Flag auto-transfer tháng hiện tại
  hasHistoricalAutoTransfer?: boolean // Flag auto-transfer lịch sử
}

interface AccountSheetIntegratedProps {
  initialData?: AccountData
  className?: string
  onTransitionStart?: (direction: 'left' | 'right') => void
  onTransitionEnd?: () => void
}

export function AccountSheetIntegrated({
  initialData,
  className,
  onTransitionStart,
  onTransitionEnd
}: AccountSheetIntegratedProps) {
  const { currentDate, setCurrentDate } = useDate()
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [modalOrigin, setModalOrigin] = useState({ x: 0, y: 0 })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)


  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string | null>(null)
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [clientBalance, setClientBalance] = useState<string>("---")
  const [clientCashRemaining, setClientCashRemaining] = useState<string>("---")
  const [totalBalance, setTotalBalance] = useState<string>("---")

  // Đánh dấu component đã mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Cập nhật clientBalance khi accountData thay đổi
  useEffect(() => {
    if (accountData) {
      // Chỉ lấy giá trị accountRemaining cho số dư tài khoản
      setClientBalance(formatCurrency(accountData.accountRemaining) + " đ")
      setClientCashRemaining(formatCurrency(accountData.cashRemaining) + " đ")
      
      // Tính tổng cho mục đích tham khảo (không hiển thị)
      const total = accountData.accountRemaining + accountData.cashRemaining;
      setTotalBalance(formatCurrency(total) + " đ")
    } else {
      setClientBalance("--- đ")
      setClientCashRemaining("--- đ")
      setTotalBalance("--- đ")
    }
  }, [accountData])

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ]

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i)

  // Lấy dữ liệu tài khoản từ sheet Vi khi tháng thay đổi
  const fetchAccountData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      console.log(`Lấy dữ liệu số dư cho tháng ${month}/${year} từ Sheet1`)

      // Gọi API để lấy dữ liệu tính toán từ Sheet1
      const response = await fetch(`/api/account-data?month=${month}&year=${year}&timestamp=${Date.now()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Không thể lấy dữ liệu tài khoản")
      }

      // Cập nhật state với dữ liệu từ API - CHÚ Ý: Dữ liệu nằm trong result.data, không phải result.accountData
      setAccountData(result.data)
      console.log("Dữ liệu tài khoản:", result.data)
    } catch (error: unknown) {
      console.error("Lỗi khi lấy dữ liệu số dư:", error)
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi khi lấy dữ liệu"
      setError(errorMessage)

      // Trong trường hợp lỗi, hiển thị dữ liệu mẫu để kiểm tra giao diện
      setAccountData({
        currentBalance: 0,
        totalExpense: 0,
        beginningBalance: 0,
        totalAdvanced: 0,
        accountRemaining: 0,
        accountExpenses: 0,
        cashRemaining: 0,
        cashExpenses: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Lắng nghe sự thay đổi của tháng
  useEffect(() => {
    fetchAccountData()
  }, [currentDate])

  // Hàm đồng bộ dữ liệu tài khoản
  const syncAccountData = async () => {
    setIsSyncing(true)
    setError(null)

    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()

      console.log(`Đồng bộ dữ liệu tài khoản cho tháng ${month}/${year}`)

      const response = await fetch("/api/sync-account-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, year }),
      })

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Không thể đồng bộ dữ liệu tài khoản")
      }

      // Hiển thị thông báo thành công
      toast({
        title: "Đồng bộ thành công",
        description: `Đã cập nhật dữ liệu tài khoản cho tháng ${month}/${year}`,
      })

      // Tải lại dữ liệu
      await fetchAccountData()
    } catch (error: unknown) {
      console.error("Lỗi khi đồng bộ dữ liệu tài khoản:", error)
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi khi đồng bộ dữ liệu"
      setError(errorMessage)

      // Hiển thị thông báo lỗi
      toast({
        title: "Đồng bộ thất bại",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  const previousMonth = () => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setSlideDirection('right') // Slide right when going to previous month
    onTransitionStart?.('right')

    setTimeout(() => {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      setCurrentDate(newDate)

      setTimeout(() => {
        setIsTransitioning(false)
        setSlideDirection(null)
        onTransitionEnd?.()
      }, 150) // Half of transition duration
    }, 150)
  }

  const nextMonth = () => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setSlideDirection('left') // Slide left when going to next month
    onTransitionStart?.('left')

    setTimeout(() => {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      setCurrentDate(newDate)

      setTimeout(() => {
        setIsTransitioning(false)
        setSlideDirection(null)
        onTransitionEnd?.()
      }, 150) // Half of transition duration
    }, 150)
  }

  // Modal functions
  const openModal = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    setModalOrigin({ x: centerX, y: centerY })
    setSelectedMonth(currentDate.getMonth() + 1)
    setSelectedYear(currentDate.getFullYear())
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalClosing(true)
    setTimeout(() => {
      setIsModalOpen(false)
      setIsModalClosing(false)
      document.body.style.overflow = 'auto'
    }, 300) // Match animation duration
  }

  const applySelection = () => {
    const newDate = new Date(selectedYear, selectedMonth - 1)
    setCurrentDate(newDate)
    closeModal()
  }



  // Handle ESC key and body scroll lock
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])



  // Helper functions để get display values
  const getDisplayMonth = () => {
    return currentDate ? currentDate.getMonth() + 1 : new Date().getMonth() + 1
  }

  const getDisplayYear = () => {
    return currentDate ? currentDate.getFullYear() : new Date().getFullYear()
  }



  // Xác định màu sắc dựa trên giá trị
  const getValueColor = (value: number, isExpense = false) => {
    if (isExpense) {
      return value > 0 ? "text-techcom-red" : "text-techcom-text"
    }
    return value > 0 ? "text-techcom-blue" : value < 0 ? "text-techcom-red" : "text-techcom-text"
  }

  return (
    <Card className={cn("overflow-hidden rounded-lg shadow-md", className)} suppressHydrationWarning>
      {/* Phần hiển thị tháng/năm đơn giản */}
      <div className="bg-white border-b p-3 flex items-center justify-between">
        <button
          onClick={previousMonth}
          disabled={isTransitioning}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100/80 hover:bg-gray-200/80 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        <button
          onClick={openModal}
          className="flex flex-col items-center justify-center min-w-[140px] px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
        >
          <div className="text-lg font-medium text-gray-800 group-hover:text-red-500 transition-colors duration-200" suppressHydrationWarning>
            Tháng {getDisplayMonth()}
          </div>
          <div className="text-sm text-gray-500 group-hover:text-red-400 transition-colors duration-200 mt-0.5" suppressHydrationWarning>
            {getDisplayYear()}
          </div>
        </button>

        <button
          onClick={nextMonth}
          disabled={isTransitioning}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100/80 hover:bg-gray-200/80 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Modal chọn tháng/năm */}
      {isModalOpen && createPortal(
        <>
          {/* Backdrop - Phủ toàn màn hình */}
          <div
            onClick={closeModal}
            className={`fixed inset-0 bg-black/30 backdrop-blur-xl z-[9998] transition-all duration-300 ${
              isModalClosing ? 'opacity-0 backdrop-blur-none' : 'opacity-100'
            }`}
          />

          {/* Modal Container - Căn giữa */}
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm mx-4"
            style={{
              animation: isModalClosing
                ? 'modalOriginScaleOut 0.3s cubic-bezier(0.4, 0, 0.6, 1)'
                : 'modalOriginScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: `${modalOrigin.x}px ${modalOrigin.y}px`
            }}
          >
            {/* Modal Content */}
            <div
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
              style={{
                boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Chọn tháng và năm</h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-6">
              {/* Chọn năm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Năm</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-gray-50/80 border border-gray-200/60 rounded-2xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 focus:bg-white transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-100/80"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px'
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Chọn tháng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tháng</label>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1
                    const isSelected = month === selectedMonth
                    const isCurrent = month === currentDate.getMonth() + 1 && selectedYear === currentDate.getFullYear()

                    return (
                      <button
                        key={month}
                        onClick={() => setSelectedMonth(month)}
                        className={`
                          relative py-3 px-2 text-center rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95
                          ${isSelected
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                            : isCurrent
                            ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300'
                            : 'bg-gray-50/80 text-gray-700 border border-gray-200/60 hover:bg-gray-100/80 hover:border-gray-300/80'
                          }
                        `}
                      >
                        <span className="text-sm">{month}</span>
                        {isSelected && (
                          <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

              {/* Nút áp dụng */}
              <div className="pt-2">
                <button
                  onClick={applySelection}
                  className="w-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-2xl font-semibold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-0.5"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Phần header - Số dư hiện có */}
      <div className="bg-techcom-red text-white p-5 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Số dư tài khoản hiện có</p>
            {isLoading ? (
              <div className="h-8 w-28 bg-white/20 animate-pulse rounded-md mt-1"></div>
            ) : (
              <p className="text-2xl font-bold mt-1" suppressHydrationWarning>
                {clientBalance}
              </p>
            )}
          </div>
          {/* Giữ nguyên bố cục nhưng ẩn nút đồng bộ */}
          <div className="h-8 w-8"></div>
        </div>

        <div
          className="absolute -bottom-3 right-5 bg-white rounded-lg p-1 shadow-techcom cursor-pointer"
          onClick={toggleDetails}
        >
          {showDetails ? (
            <ChevronUp className="h-5 w-5 text-techcom-red" />
          ) : (
            <ChevronDown className="h-5 w-5 text-techcom-red" />
          )}
        </div>
      </div>

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
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-techcom-lighttext" suppressHydrationWarning>
                Tổng chi tiêu tháng {getDisplayMonth()}
              </p>
              {isLoading ? (
                <div className="h-6 w-24 bg-gray-100 animate-pulse rounded-md mt-1"></div>
              ) : (
                <ClientOnly fallback={<p className="text-lg font-semibold text-techcom-red">--- đ</p>}>
                  <p className="text-lg font-semibold text-techcom-red">
                    {accountData ? formatCurrency(accountData.totalExpense) : "---"} đ
                  </p>
                </ClientOnly>
              )}
            </div>
            <div
              className="bg-techcom-lightblue text-techcom-blue rounded-lg px-3 py-1 text-xs font-medium cursor-pointer hover:bg-techcom-blue hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
              onClick={toggleDetails}
            >
              {showDetails ? "Ẩn chi tiết" : "Chi tiết"}
            </div>
          </div>

          {error && !isLoading && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          {showDetails && !isLoading && accountData && (
            <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 transition-all duration-300 ${
              isTransitioning
                ? slideDirection === 'left'
                  ? 'transform -translate-x-full opacity-0'
                  : 'transform translate-x-full opacity-0'
                : 'transform translate-x-0 opacity-100'
            }`}>
            <div className="bg-card-lighter p-3 rounded-lg">
              <div className="text-sm text-techcom-lighttext">Số dư tài khoản đầu kỳ</div>
              <div className="font-bold flex items-baseline text-techcom-text">
                <ClientOnly fallback={<span>---</span>}>
                  <span>{formatCurrency(accountData.beginningBalance)}</span>
                </ClientOnly>
                <span className="text-techcom-lighttext ml-1 text-xs">đ</span>
              </div>
            </div>
            <div className="bg-card-lighter p-3 rounded-lg">
              <div className="text-sm text-techcom-lighttext">Tổng đã ứng tài khoản tháng này</div>
              <div className={cn("font-bold flex items-baseline", getValueColor(accountData.totalAdvanced))}>
                <ClientOnly fallback={<span>---</span>}>
                  <span>{formatCurrency(accountData.totalAdvanced)}</span>
                </ClientOnly>
                <span className="text-techcom-lighttext ml-1 text-xs">đ</span>
              </div>
            </div>
            <div className="bg-card-lighter p-3 rounded-lg">
              <div className="text-sm text-techcom-lighttext">Tài khoản còn</div>
              <div className={cn("font-bold flex items-baseline text-techcom-blue")}>
                <ClientOnly fallback={<span>---</span>}>
                  <span>{formatCurrency(accountData.accountRemaining)}</span>
                </ClientOnly>
                <span className="text-techcom-lighttext ml-1 text-xs">đ</span>
              </div>
            </div>
            <div className="bg-card-lighter p-3 rounded-lg">
              <div className="text-sm text-techcom-lighttext">Tài khoản đã chi</div>
              <div className={cn("font-bold flex items-baseline", getValueColor(accountData.accountExpenses, true))}>
                <ClientOnly fallback={<span>---</span>}>
                  <span>{formatCurrency(accountData.accountExpenses)}</span>
                </ClientOnly>
                <span className="text-techcom-lighttext ml-1 text-xs">đ</span>
              </div>
            </div>
            <div className="bg-card-lighter p-3 rounded-lg">
              <div className="text-sm text-techcom-lighttext">Tiền mặt còn</div>
              <div className={cn("font-bold flex items-baseline", "text-emerald-500")}>
                <ClientOnly fallback={<span>---</span>}>
                  <span data-component-name="AccountSheetIntegrated">{formatCurrency(accountData.cashRemaining)}</span>
                </ClientOnly>
                <span className="text-techcom-lighttext ml-1 text-xs">đ</span>
              </div>
            </div>
            <div className="bg-card-lighter p-3 rounded-lg">
              <div className="text-sm text-techcom-lighttext">Tiền mặt đã chi</div>
              <div className={cn("font-bold flex items-baseline", getValueColor(accountData.cashExpenses, true))}>
                <ClientOnly fallback={<span>---</span>}>
                  <span>{formatCurrency(accountData.cashExpenses)}</span>
                </ClientOnly>
                <span className="text-techcom-lighttext ml-1 text-xs">đ</span>
              </div>
            </div>
          </div>
        )}

          {showDetails && isLoading && (
            <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 transition-all duration-300 ${
              isTransitioning
                ? slideDirection === 'left'
                  ? 'transform -translate-x-full opacity-0'
                  : 'transform translate-x-full opacity-0'
                : 'transform translate-x-0 opacity-100'
            }`}>
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="bg-gray-100 animate-pulse h-16 rounded-lg"></div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AccountSheetIntegrated
