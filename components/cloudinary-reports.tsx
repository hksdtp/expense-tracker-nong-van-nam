"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Download, FileText, FileSpreadsheet, Database, TrendingUp, PieChart, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface CloudinaryReportsProps {
  className?: string
}

export function CloudinaryReports({ className = "" }: CloudinaryReportsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [reportType, setReportType] = useState('summary')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const { toast } = useToast()

  // Load report data
  const loadReport = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      })

      const response = await fetch(`/api/reports?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load report')
      }

      const result = await response.json()
      setReportData(result.data)
      
      toast({
        title: "Báo cáo đã tải",
        description: `Đã tải báo cáo ${reportType} cho ${selectedMonth}/${selectedYear}`,
      })

    } catch (error) {
      console.error('Failed to load report:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải báo cáo",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Export data
  const exportData = async (format: 'csv' | 'excel' | 'json') => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        format,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      })

      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 
                     `export_${format}_${Date.now()}.${format}`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Xuất dữ liệu thành công",
        description: `Đã xuất dữ liệu định dạng ${format.toUpperCase()}`,
      })

    } catch (error) {
      console.error('Failed to export data:', error)
      toast({
        title: "Lỗi",
        description: "Không thể xuất dữ liệu",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Auto-load report when filters change
  useEffect(() => {
    loadReport()
  }, [reportType, selectedMonth, selectedYear])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Báo cáo Cloudinary</h2>
          <p className="text-gray-600">Dữ liệu được lưu trữ trên Cloudinary</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <Badge variant="outline">Cloudinary Storage</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Bộ lọc báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Loại báo cáo</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Tổng quan</SelectItem>
                  <SelectItem value="category">Theo danh mục</SelectItem>
                  <SelectItem value="monthly">Xu hướng tháng</SelectItem>
                  <SelectItem value="detailed">Chi tiết</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tháng</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Tháng {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Năm</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={loadReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Tải báo cáo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Xuất dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => exportData('csv')}
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportData('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportData('json')}
              disabled={isExporting}
            >
              <Database className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>
          
          {isExporting && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xuất dữ liệu...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Tổng quan {reportData.summary.period}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {reportData.summary.totalExpenses.toLocaleString()} VND
                  </p>
                  <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.summary.totalIncome.toLocaleString()} VND
                  </p>
                  <p className="text-sm text-gray-600">Tổng thu nhập</p>
                </div>
                
                <div className="text-center">
                  <p className={`text-2xl font-bold ${reportData.summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.summary.netAmount.toLocaleString()} VND
                  </p>
                  <p className="text-sm text-gray-600">Số dư</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.summary.transactionCount}
                  </p>
                  <p className="text-sm text-gray-600">Giao dịch</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {Object.keys(reportData.categoryBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Phân tích theo danh mục</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.categoryBreakdown)
                    .sort(([,a]: any, [,b]: any) => b.amount - a.amount)
                    .slice(0, 10)
                    .map(([category, data]: any) => (
                      <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{category}</span>
                          <span className="text-sm text-gray-600 ml-2">({data.count} giao dịch)</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{data.amount.toLocaleString()} VND</div>
                          <div className="text-sm text-gray-600">{data.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Expenses */}
          {reportData.topExpenses && reportData.topExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiêu lớn nhất</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topExpenses.slice(0, 5).map((expense: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-gray-600">{expense.category} • {expense.date}</div>
                      </div>
                      <div className="font-bold text-red-600">
                        {expense.amount.toLocaleString()} VND
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
