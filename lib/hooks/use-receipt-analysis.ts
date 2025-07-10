import { useState, useCallback } from 'react'

export interface ReceiptAnalysis {
  merchant?: string
  total?: number
  date?: string
  items?: string[]
  category?: string
  confidence?: number
  rawText?: string
}

export interface AnalysisState {
  isAnalyzing: boolean
  analysis: ReceiptAnalysis | null
  error: string | null
}

export function useReceiptAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    analysis: null,
    error: null
  })

  const analyzeReceipt = useCallback(async (imageUrl: string, publicId?: string) => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null
    }))

    try {
      console.log('🔍 Starting receipt analysis for:', imageUrl)

      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          publicId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      
      console.log('✅ Receipt analysis completed:', result.analysis)

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysis: result.analysis,
        error: null
      }))

      return result.analysis

    } catch (error) {
      console.error('❌ Receipt analysis failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))

      throw error
    }
  }, [])

  const clearAnalysis = useCallback(() => {
    setState({
      isAnalyzing: false,
      analysis: null,
      error: null
    })
  }, [])

  const retryAnalysis = useCallback(async (imageUrl: string, publicId?: string) => {
    console.log('🔄 Retrying receipt analysis...')
    return analyzeReceipt(imageUrl, publicId)
  }, [analyzeReceipt])

  return {
    ...state,
    analyzeReceipt,
    clearAnalysis,
    retryAnalysis
  }
}

// Utility functions for working with analysis results
export function formatAnalysisForForm(analysis: ReceiptAnalysis) {
  const formatted: any = {}

  if (analysis.merchant) {
    formatted.description = analysis.merchant
  }

  if (analysis.total && analysis.total > 0) {
    formatted.amount = analysis.total
  }

  if (analysis.date) {
    // Try to parse and format date
    try {
      const parsedDate = new Date(analysis.date)
      if (!isNaN(parsedDate.getTime())) {
        formatted.date = parsedDate.toISOString().split('T')[0]
      }
    } catch {
      // Keep original date string if parsing fails
      formatted.date = analysis.date
    }
  }

  if (analysis.category && analysis.category !== 'other') {
    formatted.category = analysis.category
  }

  return formatted
}

export function getConfidenceLevel(confidence?: number): 'low' | 'medium' | 'high' {
  if (!confidence) return 'low'
  if (confidence >= 70) return 'high'
  if (confidence >= 40) return 'medium'
  return 'low'
}

export function getConfidenceColor(confidence?: number): string {
  const level = getConfidenceLevel(confidence)
  switch (level) {
    case 'high': return 'text-green-600'
    case 'medium': return 'text-yellow-600'
    case 'low': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

export function shouldAutoFill(confidence?: number): boolean {
  return (confidence || 0) >= 60 // Auto-fill if confidence >= 60%
}
