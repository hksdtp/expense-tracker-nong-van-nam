"use client"

import { useState, useRef, useEffect } from "react"
import { DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface AmountInputWithSuggestionsProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function AmountInputWithSuggestions({
  value,
  onChange,
  placeholder = "Nhập số tiền",
  className,
  required = false
}: AmountInputWithSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Hàm tạo gợi ý số tiền dựa trên input
  const generateAmountSuggestions = (input: string): number[] => {
    if (!input || input === "0") return []

    const num = Number.parseInt(input)
    if (isNaN(num) || num <= 0) return []

    const suggestions = []

    // Logic gợi ý thông minh
    if (num < 10) {
      // Với số 1-9: 1.000, 10.000, 100.000, 1.000.000
      suggestions.push(num * 1000)
      suggestions.push(num * 10000)
      suggestions.push(num * 100000)
      suggestions.push(num * 1000000)
    } else if (num < 100) {
      // Với số 10-99: 12.000, 120.000, 1.200.000
      suggestions.push(num * 1000)
      suggestions.push(num * 10000)
      suggestions.push(num * 100000)
    } else if (num < 1000) {
      // Với số 100-999: 123.000, 1.230.000
      suggestions.push(num * 1000)
      suggestions.push(num * 10000)
    } else {
      // Với số >= 1000: chỉ nhân 1000
      suggestions.push(num * 1000)
    }

    // Loại bỏ các số quá lớn (> 100 triệu)
    return suggestions.filter(s => s <= 100000000)
  }

  // Hàm định dạng số tiền
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN").format(amount)
  }

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)

    // Tạo gợi ý
    const newSuggestions = generateAmountSuggestions(inputValue)
    setSuggestions(newSuggestions)
  }

  // Xử lý chọn gợi ý
  const handleSuggestionClick = (amount: number) => {
    onChange(amount.toString())
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
          <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
          Số tiền {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200",
            className
          )}
          min="0"
          step="1000"
          required={required}
        />

        {/* Hiển thị số tiền đã format */}
        {value && !isNaN(Number(value)) && Number(value) > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {formatCurrency(Number(value))} ₫
          </div>
        )}
      </div>

      {/* Suggestions Tags */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 font-medium">Gợi ý số tiền:</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((amount, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(amount)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-sm font-medium rounded-full border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span>{formatCurrency(amount)} ₫</span>
                <span className="ml-1.5 text-xs opacity-75">
                  ({amount >= 1000000
                    ? `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`
                    : amount >= 1000
                    ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`
                    : amount.toString()
                  })
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
