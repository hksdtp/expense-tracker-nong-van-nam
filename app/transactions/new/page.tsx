"use client"

import { useState } from "react"
import { TransactionHeader } from "@/components/transaction-header"
import { TransactionTypeTabs } from "@/components/transaction-type-tabs"

export default function NewTransactionPage() {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense")

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <TransactionHeader title="Thêm Giao Dịch Mới" />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Transaction Type Tabs */}
        <TransactionTypeTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Form Content Placeholder */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">
              {activeTab === "expense" ? "Chi tiêu" : "Thu nhập"}
            </p>
            <p className="text-sm">
              Form {activeTab === "expense" ? "Tiền ra" : "Tiền vào"} sẽ được thêm ở đây
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
