"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useReceiptAnalysis, formatAnalysisForForm, getConfidenceLevel, getConfidenceColor, shouldAutoFill } from '@/lib/hooks/use-receipt-analysis'

interface ReceiptAnalysisProps {
  imageUrl?: string
  publicId?: string
  onAnalysisComplete?: (formData: any) => void
  autoAnalyze?: boolean
  className?: string
}

export function ReceiptAnalysis({
  imageUrl,
  publicId,
  onAnalysisComplete,
  autoAnalyze = false,
  className = ""
}: ReceiptAnalysisProps) {
  const { isAnalyzing, analysis, error, analyzeReceipt, clearAnalysis, retryAnalysis } = useReceiptAnalysis()
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false)

  // Auto-analyze when image is provided
  useEffect(() => {
    if (autoAnalyze && (imageUrl || publicId) && !hasAutoAnalyzed && !isAnalyzing) {
      setHasAutoAnalyzed(true)
      handleAnalyze()
    }
  }, [imageUrl, publicId, autoAnalyze, hasAutoAnalyzed, isAnalyzing])

  const handleAnalyze = async () => {
    if (!imageUrl && !publicId) return

    try {
      const result = await analyzeReceipt(imageUrl!, publicId)
      
      // Auto-fill form if confidence is high enough
      if (shouldAutoFill(result.confidence) && onAnalysisComplete) {
        const formData = formatAnalysisForForm(result)
        onAnalysisComplete(formData)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  const handleRetry = async () => {
    if (!imageUrl && !publicId) return
    
    try {
      await retryAnalysis(imageUrl!, publicId)
    } catch (error) {
      console.error('Retry failed:', error)
    }
  }

  const handleApplyToForm = () => {
    if (analysis && onAnalysisComplete) {
      const formData = formatAnalysisForForm(analysis)
      onAnalysisComplete(formData)
    }
  }

  if (!imageUrl && !publicId) {
    return null
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-blue-600" />
          AI Receipt Analysis
          {analysis && (
            <Badge 
              variant="outline" 
              className={getConfidenceColor(analysis.confidence)}
            >
              {analysis.confidence}% confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Analysis Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Receipt
              </>
            )}
          </Button>
          
          {error && (
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="text-orange-600"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {analysis.merchant && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Merchant</label>
                  <p className="text-sm font-medium">{analysis.merchant}</p>
                </div>
              )}
              
              {analysis.total && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Amount</label>
                  <p className="text-sm font-medium">{analysis.total.toLocaleString()} VND</p>
                </div>
              )}
              
              {analysis.date && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Date</label>
                  <p className="text-sm font-medium">{analysis.date}</p>
                </div>
              )}
              
              {analysis.category && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Category</label>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.category}
                  </Badge>
                </div>
              )}
            </div>

            {analysis.items && analysis.items.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">Items</label>
                <div className="mt-1 space-y-1">
                  {analysis.items.slice(0, 3).map((item, index) => (
                    <p key={index} className="text-xs text-gray-600 truncate">
                      {item}
                    </p>
                  ))}
                  {analysis.items.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{analysis.items.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Confidence Indicator */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  getConfidenceLevel(analysis.confidence) === 'high' ? 'bg-green-500' :
                  getConfidenceLevel(analysis.confidence) === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {getConfidenceLevel(analysis.confidence)} confidence
                </span>
              </div>
              
              {onAnalysisComplete && (
                <Button
                  onClick={handleApplyToForm}
                  size="sm"
                  variant="default"
                  className="text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Apply to Form
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Analyzing receipt...</p>
              <p className="text-xs text-gray-400">This may take a few seconds</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
