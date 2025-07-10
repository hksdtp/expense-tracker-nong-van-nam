"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, CreditCard, Banknote } from "lucide-react"

interface PaymentMethodDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function PaymentMethodDropdown({ 
  value, 
  onChange, 
  placeholder = "Chọn phương thức",
  className = ""
}: PaymentMethodDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Phương thức thanh toán với icon
  const paymentMethods = [
    { name: "Chuyển khoản", icon: CreditCard },
    { name: "Tiền mặt", icon: Banknote }
  ]

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

  const handleSelect = (methodName: string) => {
    onChange(methodName)
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
            ? "border-green-400 shadow-lg ring-2 ring-green-500/10 scale-[1.02]"
            : "hover:border-gray-400 hover:shadow-sm hover:scale-[1.01]"
          }
          ${!value ? "text-gray-500" : "text-gray-900"}
          focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
          active:scale-[0.98]
        `}
      >
        <span className="font-medium">{displayValue}</span>
        <ChevronDown
          className={`
            w-5 h-5 text-gray-400 transition-all duration-300 ease-out
            ${isOpen ? "rotate-180 text-green-500" : "rotate-0"}
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
            {paymentMethods.map((method, index) => {
              const IconComponent = method.icon
              return (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => handleSelect(method.name)}
                  className={`
                    w-full px-4 py-3 text-left text-gray-700
                    transition-all duration-200 ease-out
                    hover:bg-gray-50 hover:translate-x-1
                    flex items-center gap-3
                    ${value === method.name ? "bg-green-50 text-green-700 font-medium border-l-2 border-green-500" : ""}
                    ${index === 0 ? "rounded-t-xl" : ""}
                    ${index === paymentMethods.length - 1 ? "rounded-b-xl" : ""}
                    focus:outline-none focus:bg-gray-50 focus:translate-x-1
                    active:scale-95
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <IconComponent className="w-4 h-4 text-gray-500" />
                  <span>{method.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
