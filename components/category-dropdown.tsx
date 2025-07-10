"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Car, UtensilsCrossed, Truck, ShoppingBag, MoreHorizontal, Wallet, CreditCard, RotateCcw } from "lucide-react"

interface CategoryDropdownProps {
  value: string
  onChange: (value: string) => void
  type: "expense" | "income"
  placeholder?: string
  className?: string
}

export function CategoryDropdown({ 
  value, 
  onChange, 
  type, 
  placeholder = "Chọn danh mục",
  className = ""
}: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Danh mục chi tiêu với icon
  const expenseCategories = [
    { name: "Chi phí xe ô tô", icon: Car },
    { name: "Nhà hàng", icon: UtensilsCrossed },
    { name: "Giao nhận đồ", icon: Truck },
    { name: "Mua đồ/dịch vụ", icon: ShoppingBag },
    { name: "Chi phí khác", icon: MoreHorizontal }
  ]

  // Danh mục thu nhập với icon
  const incomeCategories = [
    { name: "Ứng tài khoản", icon: Wallet },
    { name: "Ứng tiền mặt", icon: CreditCard },
    { name: "Hoàn tiền", icon: RotateCcw }
  ]

  const categories = type === "expense" ? expenseCategories : incomeCategories

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelect = (categoryName: string) => {
    onChange(categoryName)
    setIsOpen(false)
  }

  const displayValue = value || placeholder

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-xl
          flex items-center justify-between
          transition-all duration-300 ease-out
          ${isOpen
            ? "border-red-400 shadow-lg ring-2 ring-red-500/10 scale-[1.02]"
            : "hover:border-gray-400 hover:shadow-sm hover:scale-[1.01]"
          }
          ${!value ? "text-gray-500" : "text-gray-900"}
          focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
          active:scale-[0.98]
        `}
      >
        <span className="font-medium">{displayValue}</span>
        <ChevronDown
          className={`
            w-5 h-5 text-gray-400 transition-all duration-300 ease-out
            ${isOpen ? "rotate-180 text-red-500" : "rotate-0"}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-2 z-50
            bg-white border border-gray-200 rounded-xl shadow-lg
            backdrop-blur-sm
            transition-all duration-300 ease-out
            animate-in slide-in-from-top-2 fade-in-0
            ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2"}
          `}
          style={{
            transformOrigin: 'top center'
          }}
        >
          <div className="py-2">
            {categories.map((category, index) => {
              const IconComponent = category.icon
              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => handleSelect(category.name)}
                  className={`
                    w-full px-4 py-3 text-left text-gray-700
                    transition-all duration-200 ease-out
                    hover:bg-gray-50 hover:translate-x-1
                    flex items-center gap-3
                    ${value === category.name ? "bg-red-50 text-red-700 font-medium border-l-2 border-red-500" : ""}
                    ${index === 0 ? "rounded-t-xl" : ""}
                    ${index === categories.length - 1 ? "rounded-b-xl" : ""}
                    focus:outline-none focus:bg-gray-50 focus:translate-x-1
                    active:scale-95
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <IconComponent className="w-4 h-4 text-gray-500" />
                  <span>{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
