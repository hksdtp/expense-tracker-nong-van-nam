"use client"

import { useState, useEffect } from "react"

interface TransactionTypeTabsProps {
  activeTab: "expense" | "income"
  onTabChange: (tab: "expense" | "income") => void
  className?: string
}

export function TransactionTypeTabs({ 
  activeTab, 
  onTabChange, 
  className = "" 
}: TransactionTypeTabsProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleTabClick = (tab: "expense" | "income") => {
    if (tab === activeTab) return
    
    setIsAnimating(true)
    onTabChange(tab)
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="bg-gray-200/60 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-300/30">
        <div className="grid grid-cols-2 gap-1 relative">
          {/* Sliding Background Indicator */}
          <div
            className={`
              absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg transition-all duration-300 ease-out shadow-sm
              ${activeTab === "expense"
                ? "left-1 bg-red-500"
                : "left-[calc(50%+1px)] bg-green-500"
              }
              ${isAnimating ? "scale-[1.02]" : "scale-100"}
            `}
          />

          {/* Tiền ra Tab */}
          <button
            onClick={() => handleTabClick("expense")}
            className={`
              relative z-10 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ease-out
              ${activeTab === "expense"
                ? "text-white"
                : "text-gray-700 hover:text-gray-900"
              }
              active:scale-95 focus:outline-none
            `}
          >
            <span className="font-medium">Tiền ra</span>
          </button>

          {/* Tiền vào Tab */}
          <button
            onClick={() => handleTabClick("income")}
            className={`
              relative z-10 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ease-out
              ${activeTab === "income"
                ? "text-white"
                : "text-gray-700 hover:text-gray-900"
              }
              active:scale-95 focus:outline-none
            `}
          >
            <span className="font-medium">Tiền vào</span>
          </button>
        </div>
      </div>
    </div>
  )
}
