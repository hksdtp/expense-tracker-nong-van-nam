"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AddTransactionFAB } from "@/components/add-transaction-fab"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <div className="fade-in">
        <main
          className="container max-w-md mx-auto py-4 px-4 ios-scroll-container"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            minHeight: '100vh',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            borderRadius: '0.75rem',
          }}
        >
          <div style={{ paddingBottom: '4rem' }}>
            {children}
          </div>
        </main>
        <AddTransactionFAB />
        <Toaster />
      </div>
    </ThemeProvider>
  )
}
