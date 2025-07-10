"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TransactionHeaderProps {
  title: string
  onBack?: () => void
  showBackButton?: boolean
  className?: string
}

export function TransactionHeader({ 
  title, 
  onBack, 
  showBackButton = true,
  className = ""
}: TransactionHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className={`bg-white border-b border-gray-200 sticky top-0 z-10 ${className}`}>
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          )}
          
          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900 flex-1">
            {title}
          </h1>
        </div>
      </div>
    </div>
  )
}
