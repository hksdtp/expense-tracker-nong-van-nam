"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TransactionFormEdit } from "@/components/transaction-form-edit"
import { useRouter } from "next/navigation"
import { editTransaction } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import { getTransaction, revalidateData } from "@/lib/api-services"
import { Skeleton } from "@/components/ui/skeleton"

// Trang chỉnh sửa giao dịch
export default function EditTransactionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transaction, setTransaction] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  
  useEffect(() => {
    async function fetchTransactionData() {
      try {
        setIsLoading(true)
        const decodedId = decodeURIComponent(params.id)
        
        // Lấy dữ liệu giao dịch từ localStorage nếu có
        const storedData = localStorage.getItem(`edit_transaction_${decodedId}`)
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          setTransaction(parsedData)
          localStorage.removeItem(`edit_transaction_${decodedId}`) // Xóa sau khi đã lấy
          setIsLoading(false)
          return
        }
        
        // Nếu không có trong localStorage, có thể triển khai hàm getTransaction để lấy từ API
        // const data = await getTransaction(decodedId)
        // setTransaction(data)
        // Hoặc hiển thị thông báo lỗi nếu không tìm thấy dữ liệu
        if (!storedData) {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy thông tin giao dịch",
            variant: "destructive"
          })
          setTimeout(() => window.close(), 1500)
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu giao dịch:', error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin giao dịch",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTransactionData()
  }, [params.id, toast])
  
  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)
      
      // Thêm rowIndex vào formData
      if (transaction?.rowIndex) {
        formData.append("rowIndex", transaction.rowIndex.toString())
      }
      
      // Debug dữ liệu gửi đi
      const formEntries = Array.from(formData.entries())
      console.log('FORM DATA:', formEntries.map(([key, value]) => `${key}: ${value}`))
      
      // Lọc trường rỗng
      formEntries.forEach(([key, value]) => {
        if (value === '') {
          formData.delete(key)
        }
      })
      
      // Thực hiện gọi API
      const result = await editTransaction(formData)
      console.log('Kết quả cập nhật giao dịch:', result)
      
      if (result.success) {
        // Revalidate dữ liệu để cập nhật ngay lập tức
        try {
          await fetch('/api/revalidate?path=/&path=/transactions', { method: 'POST' })
          console.log('Đã revalidate dữ liệu thành công')
        } catch (revalidateError) {
          console.error('Lỗi khi revalidate dữ liệu:', revalidateError)
        }
        
        toast({
          title: "Thành công",
          description: "Đã cập nhật giao dịch thành công",
        })
        
        // Đóng tab sau khi hoàn thành
        setTimeout(() => {
          try {
            window.close()
            // Focus lại tab chính (nếu cần)
            if (window.opener) {
              window.opener.focus()
              // Reload trang chính để cập nhật dữ liệu
              if (window.opener.location) {
                window.opener.location.reload()
              }
            }
          } catch (err) {
            console.error("Lỗi khi đóng tab:", err)
          }
        }, 1000)
      } else {
        console.error('Lỗi khi cập nhật giao dịch:', result.error)
        toast({
          title: "Lỗi",
          description: result.error || "Không thể cập nhật giao dịch",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật giao dịch:', error)
      toast({
        title: "Lỗi",
        description: error?.message || "Đã xảy ra lỗi khi cập nhật giao dịch",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 page-enter-active">
      <div className="container max-w-lg mx-auto py-8 px-4 stagger-container">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 scale-in card-hover-effect">
          {/* Header */}
          <div className="bg-gradient-animate p-5 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.close()}
              disabled={isSubmitting}
              className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white btn-hover-effect ripple"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-white slide-in-left">
              Chỉnh sửa giao dịch
            </h1>
          </div>
          
          {/* Form Container */}
          <div className="p-6 fade-in">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="w-full h-10 rounded-lg" />
                <Skeleton className="w-full h-24 rounded-lg" />
                <Skeleton className="w-full h-10 rounded-lg" />
                <Skeleton className="w-full h-10 rounded-lg" />
                <div className="flex gap-3 mt-6">
                  <Skeleton className="w-1/2 h-10 rounded-lg" />
                  <Skeleton className="w-1/2 h-10 rounded-lg" />
                </div>
              </div>
            ) : transaction ? (
              <TransactionFormEdit
                initialType={transaction.type}
                existingTransaction={transaction}
                onSubmit={handleSubmit}
                onCancel={() => window.close()}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="p-4 text-center text-gray-500">
                Không tìm thấy thông tin giao dịch
              </div>
            )}
          </div>
        </div>
        
        {/* Nút đóng dưới cùng */}
        <div className="mt-6 text-center slide-up">
          <Button
            variant="outline"
            onClick={() => window.close()}
            disabled={isSubmitting}
            className="rounded-full px-6 border-gray-300 hover:bg-gray-100 transition-all duration-300 btn-hover-effect ripple"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
