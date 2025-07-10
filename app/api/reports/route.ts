import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface ReportData {
  summary: {
    totalExpenses: number
    totalIncome: number
    netAmount: number
    transactionCount: number
    period: string
  }
  categoryBreakdown: Record<string, {
    amount: number
    count: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    expenses: number
    income: number
    net: number
  }>
  topExpenses: Array<{
    description: string
    amount: number
    category: string
    date: string
  }>
  transactions: any[]
}

// GET: Generate reports from Cloudinary data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary'
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')

    console.log('📊 Generating report:', { reportType, month, year, startDate, endDate, category })

    // Build search expression for Cloudinary
    let expression = 'folder:transaction-data AND tags:transaction'
    
    if (category) {
      expression += ` AND context.category:${category}`
    }

    // Get all transactions from Cloudinary
    const searchResult = await cloudinary.search
      .expression(expression)
      .sort_by([['created_at', 'desc']])
      .max_results(500) // Increase limit for reports
      .execute()

    console.log(`📋 Found ${searchResult.resources.length} transactions for report`)

    // Fetch and process transaction data
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
        console.error('Error processing transaction for report:', error)
      }
    }

    // Generate report based on type
    let reportData: ReportData

    switch (reportType) {
      case 'summary':
        reportData = generateSummaryReport(transactions, { month, year })
        break
      case 'category':
        reportData = generateCategoryReport(transactions, { month, year })
        break
      case 'monthly':
        reportData = generateMonthlyReport(transactions, { year })
        break
      case 'detailed':
        reportData = generateDetailedReport(transactions, { month, year, category })
        break
      default:
        reportData = generateSummaryReport(transactions, { month, year })
    }

    return NextResponse.json({
      success: true,
      reportType,
      data: reportData,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Failed to generate report:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Generate summary report
function generateSummaryReport(transactions: any[], filters: any): ReportData {
  const expenses = transactions.filter(t => t.type === 'expense')
  const income = transactions.filter(t => t.type === 'income')
  
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
  
  // Category breakdown
  const categoryBreakdown: Record<string, { amount: number; count: number; percentage: number }> = {}
  
  expenses.forEach(t => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = { amount: 0, count: 0, percentage: 0 }
    }
    categoryBreakdown[t.category].amount += t.amount
    categoryBreakdown[t.category].count += 1
  })
  
  // Calculate percentages
  Object.keys(categoryBreakdown).forEach(category => {
    categoryBreakdown[category].percentage = 
      totalExpenses > 0 ? (categoryBreakdown[category].amount / totalExpenses) * 100 : 0
  })
  
  // Top expenses
  const topExpenses = expenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(t => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
      date: t.date
    }))

  return {
    summary: {
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      period: filters.month && filters.year ? 
        `${filters.month}/${filters.year}` : 
        'All time'
    },
    categoryBreakdown,
    monthlyTrends: [], // Will be populated in monthly report
    topExpenses,
    transactions
  }
}

// Generate category report
function generateCategoryReport(transactions: any[], filters: any): ReportData {
  const baseReport = generateSummaryReport(transactions, filters)
  
  // Enhanced category analysis
  const categoryDetails: Record<string, any> = {}
  
  Object.keys(baseReport.categoryBreakdown).forEach(category => {
    const categoryTransactions = transactions.filter(t => t.category === category)
    
    categoryDetails[category] = {
      ...baseReport.categoryBreakdown[category],
      averageAmount: categoryTransactions.length > 0 ? 
        baseReport.categoryBreakdown[category].amount / categoryTransactions.length : 0,
      transactions: categoryTransactions.slice(0, 5) // Top 5 transactions
    }
  })
  
  return {
    ...baseReport,
    categoryBreakdown: categoryDetails
  }
}

// Generate monthly trends report
function generateMonthlyReport(transactions: any[], filters: any): ReportData {
  const baseReport = generateSummaryReport(transactions, filters)
  
  // Group by month
  const monthlyData: Record<string, { expenses: number; income: number; net: number }> = {}
  
  transactions.forEach(t => {
    const date = new Date(t.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { expenses: 0, income: 0, net: 0 }
    }
    
    if (t.type === 'expense') {
      monthlyData[monthKey].expenses += t.amount
    } else {
      monthlyData[monthKey].income += t.amount
    }
    
    monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses
  })
  
  // Convert to array and sort
  const monthlyTrends = Object.keys(monthlyData)
    .sort()
    .map(month => ({
      month,
      ...monthlyData[month]
    }))
  
  return {
    ...baseReport,
    monthlyTrends
  }
}

// Generate detailed report
function generateDetailedReport(transactions: any[], filters: any): ReportData {
  const baseReport = generateSummaryReport(transactions, filters)
  
  // Add more detailed analysis
  const paymentMethodBreakdown: Record<string, number> = {}
  const dailyTrends: Record<string, number> = {}
  
  transactions.forEach(t => {
    // Payment method breakdown
    paymentMethodBreakdown[t.paymentMethod] = 
      (paymentMethodBreakdown[t.paymentMethod] || 0) + t.amount
    
    // Daily trends
    const dateKey = t.date.split('T')[0] // Get date part only
    dailyTrends[dateKey] = (dailyTrends[dateKey] || 0) + t.amount
  })
  
  return {
    ...baseReport,
    paymentMethodBreakdown,
    dailyTrends,
    transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
