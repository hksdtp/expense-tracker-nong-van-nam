"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface TransactionFormEditProps {
  onSubmit?: (formData: FormData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  existingTransaction?: any
  initialType?: "expense" | "income"
}

export function TransactionFormEdit({
  onSubmit,
  onCancel,
  isSubmitting = false,
  existingTransaction,
  initialType = "expense"
}: TransactionFormEditProps) {
  const [type, setType] = useState<"expense" | "income">(initialType)
  const [category, setCategory] = useState(existingTransaction?.category || "")
  const [description, setDescription] = useState(existingTransaction?.description || "")
  const [amount, setAmount] = useState(existingTransaction?.amount?.toString() || "")
  const [paymentMethod, setPaymentMethod] = useState(existingTransaction?.paymentMethod || "Chuyển khoản")
  const [date, setDate] = useState(existingTransaction?.date || "")
  const [note, setNote] = useState(existingTransaction?.note || "")

  const expenseCategories = [
    "Chi phí xe ô tô",
    "Nhà hàng", 
    "Giao nhận đồ",
    "Mua đồ/dịch vụ",
    "Chi phí khác"
  ]

  const incomeCategories = [
    "Ứng tài khoản",
    "Ứng tiền mặt", 
    "Hoàn tiền"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!onSubmit) return

    const formData = new FormData()
    formData.append("type", type)
    formData.append("category", category)
    formData.append("description", description)
    formData.append("amount", amount)
    formData.append("paymentMethod", paymentMethod)
    formData.append("date", date)
    formData.append("note", note)

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "expense" ? "default" : "outline"}
          onClick={() => setType("expense")}
          className="flex-1"
        >
          💸 Tiền ra
        </Button>
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          onClick={() => setType("income")}
          className="flex-1"
        >
          💰 Tiền vào
        </Button>
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Danh mục</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn danh mục" />
          </SelectTrigger>
          <SelectContent>
            {(type === "expense" ? expenseCategories : incomeCategories).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập mô tả giao dịch"
          required
        />
      </div>

      {/* Amount */}
      <div>
        <Label htmlFor="amount">Số tiền</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nhập số tiền"
          required
        />
      </div>

      {/* Payment Method */}
      <div>
        <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Chuyển khoản">Chuyển khoản</SelectItem>
            <SelectItem value="Tiền mặt">Tiền mặt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="date">Ngày</Label>
        <Input
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="dd/mm/yyyy"
          required
        />
      </div>

      {/* Note */}
      <div>
        <Label htmlFor="note">Ghi chú</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú thêm (tùy chọn)"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Hủy
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </div>
    </form>
  )
}
