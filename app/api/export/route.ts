import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import * as XLSX from 'xlsx'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// GET: Export data in various formats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // csv, excel, json
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('📤 Exporting data:', { format, month, year, category, type })

    // Get transactions from Cloudinary
    let expression = 'folder:transaction-data AND tags:transaction'
    
    if (type) {
      expression += ` AND tags:${type}`
    }
    
    if (category) {
      expression += ` AND context.category:${category}`
    }

    const searchResult = await cloudinary.search
      .expression(expression)
      .sort_by([['created_at', 'desc']])
      .max_results(1000) // High limit for exports
      .execute()

    console.log(`📋 Found ${searchResult.resources.length} transactions for export`)

    // Fetch and filter transaction data
    const transactions = []
    for (const resource of searchResult.resources) {
      try {
        const dataResponse = await fetch(resource.secure_url)
        const transactionData = await dataResponse.json()
        
        // Apply date filters
        const transactionDate = new Date(transactionData.date)
        
        if (month && year) {
          if (transactionDate.getMonth() + 1 !== parseInt(month) || 
              transactionDate.getFullYear() !== parseInt(year)) {
            continue
          }
        }
        
        if (startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          if (transactionDate < start || transactionDate > end) {
            continue
          }
        }
        
        transactions.push(transactionData)
      } catch (error) {
        console.error('Error processing transaction for export:', error)
      }
    }

    // Sort by date
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`✅ Processed ${transactions.length} transactions for export`)

    // Generate export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        return exportCSV(transactions)
      case 'excel':
        return exportExcel(transactions)
      case 'json':
        return exportJSON(transactions)
      default:
        return exportCSV(transactions)
    }

  } catch (error) {
    console.error('❌ Failed to export data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Export as CSV
function exportCSV(transactions: any[]) {
  const headers = [
    'Date',
    'Description', 
    'Category',
    'Sub Category',
    'Amount',
    'Type',
    'Payment Method',
    'Note',
    'Image URL',
    'Created At'
  ]

  const csvRows = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.category,
      t.subCategory || '',
      t.amount,
      t.type,
      t.paymentMethod,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.imageUrl || '',
      t.createdAt
    ].join(','))
  ]

  const csvContent = csvRows.join('\n')
  const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

// Export as Excel
function exportExcel(transactions: any[]) {
  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Prepare data for Excel
  const excelData = transactions.map(t => ({
    'Ngày': t.date,
    'Mô tả': t.description,
    'Danh mục': t.category,
    'Danh mục con': t.subCategory || '',
    'Số tiền': t.amount,
    'Loại': t.type === 'expense' ? 'Chi tiêu' : 'Thu nhập',
    'Phương thức': t.paymentMethod,
    'Ghi chú': t.note || '',
    'Link ảnh': t.imageUrl || '',
    'Tạo lúc': t.createdAt
  }))

  // Create main sheet
  const mainSheet = XLSX.utils.json_to_sheet(excelData)
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Giao dịch')

  // Create summary sheet
  const summary = generateSummaryForExcel(transactions)
  const summarySheet = XLSX.utils.json_to_sheet(summary)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng kết')

  // Create category breakdown sheet
  const categoryBreakdown = generateCategoryBreakdownForExcel(transactions)
  const categorySheet = XLSX.utils.json_to_sheet(categoryBreakdown)
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Theo danh mục')

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `bao_cao_chi_tieu_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

// Export as JSON
function exportJSON(transactions: any[]) {
  const exportData = {
    exportDate: new Date().toISOString(),
    totalTransactions: transactions.length,
    summary: {
      totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      categories: [...new Set(transactions.map(t => t.category))]
    },
    transactions
  }

  const filename = `transactions_${new Date().toISOString().split('T')[0]}.json`

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

// Generate summary for Excel
function generateSummaryForExcel(transactions: any[]) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const income = transactions.filter(t => t.type === 'income')
  
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)

  return [
    { 'Chỉ số': 'Tổng chi tiêu', 'Giá trị': totalExpenses, 'Đơn vị': 'VND' },
    { 'Chỉ số': 'Tổng thu nhập', 'Giá trị': totalIncome, 'Đơn vị': 'VND' },
    { 'Chỉ số': 'Số dư', 'Giá trị': totalIncome - totalExpenses, 'Đơn vị': 'VND' },
    { 'Chỉ số': 'Số giao dịch chi tiêu', 'Giá trị': expenses.length, 'Đơn vị': 'giao dịch' },
    { 'Chỉ số': 'Số giao dịch thu nhập', 'Giá trị': income.length, 'Đơn vị': 'giao dịch' },
    { 'Chỉ số': 'Chi tiêu trung bình', 'Giá trị': expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0, 'Đơn vị': 'VND' }
  ]
}

// Generate category breakdown for Excel
function generateCategoryBreakdownForExcel(transactions: any[]) {
  const categoryBreakdown: Record<string, { amount: number; count: number }> = {}
  
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = { amount: 0, count: 0 }
    }
    categoryBreakdown[t.category].amount += t.amount
    categoryBreakdown[t.category].count += 1
  })

  const totalExpenses = Object.values(categoryBreakdown).reduce((sum, cat) => sum + cat.amount, 0)

  return Object.keys(categoryBreakdown)
    .sort((a, b) => categoryBreakdown[b].amount - categoryBreakdown[a].amount)
    .map(category => ({
      'Danh mục': category,
      'Tổng tiền': categoryBreakdown[category].amount,
      'Số giao dịch': categoryBreakdown[category].count,
      'Tỷ lệ %': totalExpenses > 0 ? Math.round((categoryBreakdown[category].amount / totalExpenses) * 100 * 100) / 100 : 0,
      'Trung bình': Math.round(categoryBreakdown[category].amount / categoryBreakdown[category].count)
    }))
}
