"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditIcon, TrashIcon, MoreVertical, EyeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DirectReceiptViewer } from "@/components/direct-receipt-viewer"
import { useDate } from "@/lib/date-context"
import { useTransactions } from "@/lib/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteTransaction } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import { TransactionDetailDialog } from "./transaction-detail-dialog"
import { EditTransactionModal } from "./edit-transaction-modal"
import { Button } from "@/components/ui/button"

export function TransactionList({
  category = "all",
  type = "all",
}: {
  category?: string
  type?: string
}) {
  const { currentDate } = useDate()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const { transactions, isLoading, mutate } = useTransactions(month, year)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [viewingTransaction, setViewingTransaction] = useState<any>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter transactions based on props
  const filteredTransactions = transactions
    .filter((transaction: any) => {
      if (category !== "all" && transaction.category !== category) return false
      if (type !== "all" && transaction.type !== type) return false
      return true
    })
    // Sắp xếp theo thời gian mới nhất (gần nhất ở trên cùng)
    .sort((a: any, b: any) => {
      // Sắp xếp theo thời gian mới nhất, không phân biệt danh mục
      const dateA = new Date(a.timestamp || a.date.split("/").reverse().join("-"))
      const dateB = new Date(b.timestamp || b.date.split("/").reverse().join("-"))
      return dateB.getTime() - dateA.getTime()
    })

  // Nhóm giao dịch theo ngày
  const groupedTransactions = filteredTransactions.reduce((groups: Record<string, any[]>, transaction: any) => {
    const date = transaction.date // Định dạng dd/mm/yyyy
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {})

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
        return `Hôm nay, ${day} Thg ${month}, ${year}`
      }
      
      return `${day} Thg ${month}, ${year}`
    }
    return dateStr
  }

  const handleViewDetail = (transaction: any) => {
    console.log("Viewing transaction details:", transaction)
    setViewingTransaction(transaction)
    setShowDetailDialog(true)
    setActiveMenuId(null)
  }

  const handleEdit = (transaction: any) => {
    console.log("Editing transaction:", transaction)
    setActiveMenuId(null)
    setEditingTransaction(transaction)
    setShowEditModal(true)
  }

  const handleDelete = async (transaction: any) => {
    console.log("Deleting transaction:", transaction)
    setActiveMenuId(null)
    setIsDeletingId(transaction.id)

    try {
      const formData = new FormData()
      formData.append("rowIndex", transaction.rowIndex.toString())

      const result = await deleteTransaction(formData)

      if (result.success) {
        toast({
          title: "Xóa giao dịch thành công",
          description: "Giao dịch đã được xóa khỏi hệ thống",
        })

        // Refresh data
        mutate()
      } else {
        toast({
          title: "Lỗi khi xóa giao dịch",
          description: result.error || "Đã xảy ra lỗi không xác định",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error deleting transaction:", error)
      toast({
        title: "Lỗi khi xóa giao dịch",
        description: error?.message || "Đã xảy ra lỗi không xác định",
        variant: "destructive",
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleEditComplete = () => {
    setEditingTransaction(null)
    setShowEditModal(false)
    try {
      // Refresh data
      mutate()
    } catch (error: unknown) {
      console.error("Error editing transaction:", error)
    }
  }

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Toggle menu for:", id)
    setActiveMenuId(activeMenuId === id ? null : id)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center p-4 border-b">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {Object.keys(groupedTransactions).length === 0 && !isLoading && (
              <div className="py-10 text-center">
                <p className="text-gray-500">Không có giao dịch nào</p>
              </div>
            )}
            
            {Object.keys(groupedTransactions)
              .sort((a, b) => {
                // Sắp xếp ngày theo thứ tự giảm dần (mới nhất lên đầu)
                const [dayA, monthA, yearA] = a.split("/").map(Number)
                const [dayB, monthB, yearB] = b.split("/").map(Number)
                
                const dateA = new Date(yearA, monthA - 1, dayA)
                const dateB = new Date(yearB, monthB - 1, dayB)
                
                return dateB.getTime() - dateA.getTime()
              })
              .map((date) => (
                <div key={date} className="group/date-group py-3">
                  <div className="sticky top-0 z-10 bg-white py-2 mb-2 flex items-center border-b border-gray-50 backdrop-blur-sm bg-opacity-90 transition-all duration-200 group-hover/date-group:border-gray-100">
                    <h3 className="text-sm font-medium text-gray-600 group-hover/date-group:text-gray-800 transition-colors duration-200">
                      {formatVietnameseDate(date)}
                    </h3>
                    <div className="ml-2 w-full h-px bg-gradient-to-r from-gray-100 to-transparent opacity-0 group-hover/date-group:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="space-y-3">
                    {groupedTransactions[date].map((transaction: any) => (
                      <div key={transaction.id} className="relative">
                        <div 
                          className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer group/transaction overflow-hidden transition-all duration-200 hover:border-gray-200"
                          onClick={() => handleViewDetail(transaction)}
                        >
                          {/* Layout chính */}
                          <div className="flex flex-col space-y-3">
                            {/* Phần tiêu đề và danh mục */}
                            <div className="flex justify-between items-start">
                              <div className="flex flex-row items-center gap-3">
                                {/* Icon giao dịch */}
                                <div 
                                  className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-transform group-hover/transaction:scale-110 duration-300",
                                    transaction.type === "income" 
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                      : "bg-gradient-to-r from-rose-500 to-red-500"
                                  )}
                                >
                                  {transaction.type === "income" ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="12" y1="19" x2="12" y2="5"></line>
                                      <polyline points="5 12 12 5 19 12"></polyline>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="12" y1="5" x2="12" y2="19"></line>
                                      <polyline points="19 12 12 19 5 12"></polyline>
                                    </svg>
                                  )}
                                </div>
                                
                                {/* Mô tả và danh mục */}
                                <div className="flex flex-col">
                                  <h3 className="font-semibold text-gray-900 group-hover/transaction:text-black transition-colors duration-200 line-clamp-1">
                                    {transaction.description || transaction.category}
                                  </h3>
                                  {transaction.subCategory && (
                                    <div className="mt-1">
                                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                        {transaction.subCategory}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Số tiền */}
                              <p 
                                className={cn(
                                  "font-bold whitespace-nowrap transition-all duration-300 group-hover/transaction:scale-105",
                                  transaction.type === "income" 
                                    ? "text-emerald-600 group-hover/transaction:text-emerald-700"
                                    : "text-rose-600 group-hover/transaction:text-rose-700"
                                )}
                              >
                                {transaction.type === "income" ? "+" : "-"}
                                {new Intl.NumberFormat("vi-VN").format(transaction.amount)} đ
                              </p>
                            </div>
                            
                            {/* Phần dưới: Biên lai và các hành động (nếu có) */}
                            {transaction.receiptLink && (
                              <div className="flex justify-end mt-1">
                                <DirectReceiptViewer 
                                  receiptLink={transaction.receiptLink} 
                                  size="sm" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Nút hành động */}
                        <div className="absolute right-2 top-2 flex gap-1 z-10">
                          {transaction.id === isDeletingId ? (
                            <div className="flex items-center bg-white shadow-md rounded-full border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150">
                              <div className="px-3 text-sm font-medium text-red-600">Xác nhận?</div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-l-none"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(transaction)
                                }}
                              >
                                Xóa
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 hover:bg-gray-100 rounded-l-none"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setIsDeletingId(null)
                                }}
                              >
                                Hủy
                              </Button>
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover/transaction:opacity-100 transition-opacity duration-300 flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-sm bg-white/90 backdrop-blur-sm hover:scale-110 transition-all duration-200 hover:bg-gray-100 text-gray-600 hover:text-emerald-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(transaction)
                                }}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-sm bg-white/90 backdrop-blur-sm hover:scale-110 transition-all duration-200 hover:bg-gray-100 hover:text-red-600 text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setIsDeletingId(transaction.id)
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {viewingTransaction && (
        <TransactionDetailDialog
          transaction={viewingTransaction}
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open)
            if (!open) setViewingTransaction(null)
          }}
          onEdit={(transaction) => {
            setShowDetailDialog(false)
            setViewingTransaction(null)
            setTimeout(() => handleEdit(transaction), 100)
          }}
          onDelete={(transaction) => {
            setShowDetailDialog(false)
            setViewingTransaction(null)
            setTimeout(() => handleDelete(transaction), 100)
          }}
        />
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        onSuccess={handleEditComplete}
      />
    </>
  )
}
