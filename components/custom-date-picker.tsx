"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface CustomDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

export function CustomDatePicker({ value, onChange, className = "" }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value.getMonth())
  const [currentYear, setCurrentYear] = useState(value.getFullYear())
  const [selectedDate, setSelectedDate] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  // Format date to DD/MM/YYYY
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Get month name in Vietnamese
  const getMonthName = (month: number) => {
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ]
    return months[month]
  }

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const daysInPrevMonth = getDaysInMonth(currentMonth - 1, currentYear)
    
    const days = []
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isNextMonth: false
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isNextMonth: false
      })
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isNextMonth: true
      })
    }
    
    return days
  }

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)
    setSelectedDate(newDate)
  }

  // Handle month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  // Handle today button
  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  // Handle save
  const handleSave = () => {
    onChange(selectedDate)
    setIsOpen(false)
  }

  // Handle cancel
  const handleCancel = () => {
    setSelectedDate(value)
    setCurrentMonth(value.getMonth())
    setCurrentYear(value.getFullYear())
    setIsOpen(false)
  }

  // Handle clear
  const handleClear = () => {
    const today = new Date()
    setSelectedDate(today)
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const calendarDays = generateCalendarDays()
  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear()
  }

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentMonth === selectedDate.getMonth() && 
           currentYear === selectedDate.getFullYear()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={formatDate(value)}
          readOnly
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 cursor-pointer pr-12"
          placeholder="01/07/2025"
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {isOpen && (
        <>
          {/* Standardized Backdrop */}
          <div
            className="fixed inset-0 backdrop-standard backdrop-z-base animate-in fade-in-0 duration-200"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh'
            }}
          />

          {/* Standardized Calendar Modal */}
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-z-modal glass-modal overflow-hidden max-w-[95vw] sm:max-w-none animate-in zoom-in-95 fade-in-0 duration-200"
            style={{
              width: 'min(418px, 95vw)',
              borderRadius: '16px'
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <h3 className="text-base font-semibold text-gray-800">
                {getMonthName(currentMonth)} {currentYear}
              </h3>

              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 p-3 pb-1">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-3 pb-3">
              {calendarDays.map((dayObj, index) => (
                <button
                  key={index}
                  onClick={() => dayObj.isCurrentMonth && handleDateSelect(dayObj.day)}
                  disabled={!dayObj.isCurrentMonth}
                  className={`
                    h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200
                    ${dayObj.isCurrentMonth 
                      ? 'text-gray-800 hover:bg-gray-100' 
                      : 'text-gray-300 cursor-not-allowed'
                    }
                    ${isSelected(dayObj.day) && dayObj.isCurrentMonth
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : ''
                    }
                    ${isToday(dayObj.day) && dayObj.isCurrentMonth && !isSelected(dayObj.day)
                      ? 'bg-blue-100 text-blue-600' 
                      : ''
                    }
                  `}
                >
                  {dayObj.day}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={handleToday}
                  className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Hôm nay
                </button>
                <button
                  onClick={handleClear}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Xóa
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-xs bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
