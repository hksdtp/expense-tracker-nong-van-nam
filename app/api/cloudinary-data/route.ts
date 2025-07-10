import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface TransactionData {
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

// POST: Save transaction data to Cloudinary
export async function POST(request: NextRequest) {
  try {
    const transactionData: Partial<TransactionData> = await request.json()

    console.log('💾 Saving transaction data to Cloudinary:', transactionData)

    // Generate unique transaction ID
    const transactionId = transactionData.id || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Prepare metadata for Cloudinary
    const metadata = {
      transaction_id: transactionId,
      date: transactionData.date,
      category: transactionData.category,
      description: transactionData.description,
      amount: transactionData.amount?.toString(),
      type: transactionData.type,
      payment_method: transactionData.paymentMethod,
      sub_category: transactionData.subCategory || '',
      note: transactionData.note || '',
      created_at: transactionData.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // If there's an associated image, add tags instead of metadata (free plan limitation)
    if (transactionData.publicId) {
      console.log('🔗 Adding tags to image:', transactionData.publicId)

      try {
        await cloudinary.uploader.add_tag(
          [`txn_${transactionId}`, `cat_${transactionData.category}`, `type_${transactionData.type}`],
          transactionData.publicId
        )
      } catch (tagError) {
        console.log('⚠️ Could not add tags to image:', tagError)
        // Continue anyway
      }
    }

    // Save as a separate data record using Cloudinary raw upload
    const transactionRecord = {
      ...transactionData,
      id: transactionId,
      createdAt: metadata.created_at,
      updatedAt: metadata.updated_at
    }

    const dataRecord = await cloudinary.uploader.upload(
      `data:text/plain;base64,${Buffer.from(JSON.stringify(transactionRecord)).toString('base64')}`,
      {
        resource_type: 'raw',
        public_id: `transactions/${transactionId}`,
        folder: 'transaction-data',
        tags: ['transaction', 'data', transactionData.type || 'expense', `cat_${transactionData.category}`]
      }
    )

    console.log('✅ Transaction data saved to Cloudinary')

    return NextResponse.json({
      success: true,
      transactionId,
      dataUrl: dataRecord.secure_url,
      metadata
    })

  } catch (error) {
    console.error('❌ Failed to save transaction data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save transaction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: Retrieve transaction data from Cloudinary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('📊 Retrieving transaction data from Cloudinary')

    // Build search expression
    let expression = 'folder:transaction-data AND tags:transaction'
    
    if (type) {
      expression += ` AND tags:${type}`
    }
    
    if (category) {
      expression += ` AND context.category:${category}`
    }

    // Search for transaction data
    const searchResult = await cloudinary.search
      .expression(expression)
      .sort_by([['created_at', 'desc']])
      .max_results(limit)
      .execute()

    console.log(`✅ Found ${searchResult.resources.length} transactions`)

    // Process and filter results
    const transactions: TransactionData[] = []

    for (const resource of searchResult.resources) {
      try {
        // Get the actual transaction data
        const dataResponse = await fetch(resource.secure_url)
        const transactionData = await dataResponse.json()

        // Filter by date if specified
        if (month && year) {
          const transactionDate = new Date(transactionData.date)
          if (transactionDate.getMonth() + 1 !== parseInt(month) || 
              transactionDate.getFullYear() !== parseInt(year)) {
            continue
          }
        }

        transactions.push(transactionData)
      } catch (error) {
        console.error('Error processing transaction:', error)
      }
    }

    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length,
      filters: { month, year, category, type }
    })

  } catch (error) {
    console.error('❌ Failed to retrieve transaction data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve transaction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT: Update transaction data
export async function PUT(request: NextRequest) {
  try {
    const { transactionId, ...updateData } = await request.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    console.log('📝 Updating transaction data:', transactionId)

    // Update the data record
    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    await cloudinary.uploader.upload(
      `data:text/plain;base64,${Buffer.from(JSON.stringify(updatedData)).toString('base64')}`,
      {
        resource_type: 'raw',
        public_id: `transactions/${transactionId}`,
        folder: 'transaction-data',
        overwrite: true,
        context: {
          ...updateData,
          updated_at: updatedData.updatedAt
        }
      }
    )

    console.log('✅ Transaction data updated')

    return NextResponse.json({
      success: true,
      transactionId,
      updatedData
    })

  } catch (error) {
    console.error('❌ Failed to update transaction data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update transaction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE: Remove transaction data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Deleting transaction data:', transactionId)

    // Delete the data record
    await cloudinary.uploader.destroy(`transactions/${transactionId}`, {
      resource_type: 'raw'
    })

    console.log('✅ Transaction data deleted')

    return NextResponse.json({
      success: true,
      transactionId
    })

  } catch (error) {
    console.error('❌ Failed to delete transaction data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete transaction data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
