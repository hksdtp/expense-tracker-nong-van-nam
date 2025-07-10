import { useState, useCallback } from 'react'

export interface CloudinaryTransaction {
  id: string
  date: string
  category: string
  description: string
  amount: number
  type: 'expense' | 'income'
  paymentMethod: string
  subCategory?: string
  note?: string
  imageUrl?: string
  publicId?: string
  createdAt: string
  updatedAt: string
}

export interface CloudinaryDataState {
  isLoading: boolean
  isSaving: boolean
  transactions: CloudinaryTransaction[]
  error: string | null
  total: number
}

export function useCloudinaryData() {
  const [state, setState] = useState<CloudinaryDataState>({
    isLoading: false,
    isSaving: false,
    transactions: [],
    error: null,
    total: 0
  })

  // Save transaction to Cloudinary
  const saveTransaction = useCallback(async (transactionData: Partial<CloudinaryTransaction>) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      console.log('💾 Saving transaction to Cloudinary:', transactionData)

      const response = await fetch('/api/cloudinary-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save transaction')
      }

      const result = await response.json()
      
      console.log('✅ Transaction saved to Cloudinary:', result.transactionId)

      setState(prev => ({
        ...prev,
        isSaving: false,
        error: null
      }))

      return result

    } catch (error) {
      console.error('❌ Failed to save transaction:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }))

      throw error
    }
  }, [])

  // Load transactions from Cloudinary
  const loadTransactions = useCallback(async (filters?: {
    month?: number
    year?: number
    category?: string
    type?: 'expense' | 'income'
    limit?: number
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('📊 Loading transactions from Cloudinary:', filters)

      const params = new URLSearchParams()
      if (filters?.month) params.append('month', filters.month.toString())
      if (filters?.year) params.append('year', filters.year.toString())
      if (filters?.category) params.append('category', filters.category)
      if (filters?.type) params.append('type', filters.type)
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/cloudinary-data?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load transactions')
      }

      const result = await response.json()
      
      console.log(`✅ Loaded ${result.transactions.length} transactions from Cloudinary`)

      setState(prev => ({
        ...prev,
        isLoading: false,
        transactions: result.transactions,
        total: result.total,
        error: null
      }))

      return result.transactions

    } catch (error) {
      console.error('❌ Failed to load transactions:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Load failed'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))

      throw error
    }
  }, [])

  // Update transaction in Cloudinary
  const updateTransaction = useCallback(async (transactionId: string, updateData: Partial<CloudinaryTransaction>) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      console.log('📝 Updating transaction in Cloudinary:', transactionId)

      const response = await fetch('/api/cloudinary-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          ...updateData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update transaction')
      }

      const result = await response.json()
      
      console.log('✅ Transaction updated in Cloudinary')

      // Update local state
      setState(prev => ({
        ...prev,
        isSaving: false,
        transactions: prev.transactions.map(t => 
          t.id === transactionId ? { ...t, ...updateData } : t
        ),
        error: null
      }))

      return result

    } catch (error) {
      console.error('❌ Failed to update transaction:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }))

      throw error
    }
  }, [])

  // Delete transaction from Cloudinary
  const deleteTransaction = useCallback(async (transactionId: string) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      console.log('🗑️ Deleting transaction from Cloudinary:', transactionId)

      const response = await fetch(`/api/cloudinary-data?transactionId=${transactionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete transaction')
      }

      console.log('✅ Transaction deleted from Cloudinary')

      // Update local state
      setState(prev => ({
        ...prev,
        isSaving: false,
        transactions: prev.transactions.filter(t => t.id !== transactionId),
        total: prev.total - 1,
        error: null
      }))

    } catch (error) {
      console.error('❌ Failed to delete transaction:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }))

      throw error
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Get summary statistics
  const getSummary = useCallback((transactions: CloudinaryTransaction[] = state.transactions) => {
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const categoryBreakdown = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

    return {
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      categoryBreakdown
    }
  }, [state.transactions])

  return {
    ...state,
    saveTransaction,
    loadTransactions,
    updateTransaction,
    deleteTransaction,
    clearError,
    getSummary
  }
}
