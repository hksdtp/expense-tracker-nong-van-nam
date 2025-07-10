import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/ios-scroll.css" // Import iOS-like scroll effects
import "../styles/animations.css" // Import animations
import ClientLayout from "./client-layout"
import { TestDropdown } from "@/components/test-dropdown"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Báo cáo chi phí",
  description: "", // Removed the description
  openGraph: {
    title: "Báo cáo chi phí",
    description: "", // Empty description for OpenGraph
    images: [],
  },
  twitter: {
    title: "Báo cáo chi phí",
    description: "", // Empty description for Twitter cards
    images: [],
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning className="light" style={{colorScheme: "light"}}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className}>
        {/* Đã tạm thởi vô hiệu hóa TestDropdown để xác định nguyên nhân lỗi */}
        {/*
        {process.env.NODE_ENV !== "production" && (
          <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
            <TestDropdown />
          </div>
        )}
        */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
