"use client"

import { Suspense, useState } from "react"
import { AccountSheetIntegrated } from "@/components/account-sheet-integrated" // Thay thế CurrentBalance và MonthSelector
import { TransactionTabsFixed } from "@/components/transaction-tabs-fixed"
import { Skeleton } from "@/components/ui/skeleton"
import { DateProvider } from "@/lib/date-context"

function DashboardContent() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  return (
    <div className="flex flex-col gap-4 stagger-container">
      <div className="animate-in stagger-1 scale-in">
        <AccountSheetIntegrated
          onTransitionStart={(direction: 'left' | 'right') => {
            setIsTransitioning(true)
            setSlideDirection(direction)
          }}
          onTransitionEnd={() => {
            setIsTransitioning(false)
            setSlideDirection(null)
          }}
        />
      </div>

      <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
        <div className="animate-in stagger-3 fade-in">
          <TransactionTabsFixed
            isTransitioning={isTransitioning}
            slideDirection={slideDirection}
          />
        </div>
      </Suspense>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DateProvider>
      <DashboardContent />
    </DateProvider>
  )
}
