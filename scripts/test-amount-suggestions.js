#!/usr/bin/env node

/**
 * Script để test tính năng gợi ý số tiền
 */

// Hàm tạo gợi ý số tiền dựa trên input (copy từ component)
function generateAmountSuggestions(input) {
  if (!input || input === "0") return []

  const num = Number.parseInt(input)
  if (isNaN(num) || num <= 0) return []

  const suggestions = []

  // Logic gợi ý thông minh
  if (num < 10) {
    // Với số 1-9: 1.000, 10.000, 100.000, 1.000.000
    suggestions.push(num * 1000)
    suggestions.push(num * 10000)
    suggestions.push(num * 100000)
    suggestions.push(num * 1000000)
  } else if (num < 100) {
    // Với số 10-99: 12.000, 120.000, 1.200.000
    suggestions.push(num * 1000)
    suggestions.push(num * 10000)
    suggestions.push(num * 100000)
  } else if (num < 1000) {
    // Với số 100-999: 123.000, 1.230.000
    suggestions.push(num * 1000)
    suggestions.push(num * 10000)
  } else {
    // Với số >= 1000: chỉ nhân 1000
    suggestions.push(num * 1000)
  }

  // Loại bỏ các số quá lớn (> 100 triệu)
  return suggestions.filter(s => s <= 100000000)
}

// Hàm định dạng số tiền
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount)
}

function testAmountSuggestions() {
  console.log('🧪 Test tính năng gợi ý số tiền...')
  console.log('=' .repeat(50))

  const testCases = [
    '1', '2', '5', '9',           // Số 1-9
    '10', '12', '15', '25', '50', '99',  // Số 10-99
    '100', '123', '250', '500', '999',   // Số 100-999
    '1000', '1500', '2000', '5000'       // Số >= 1000
  ]

  testCases.forEach(input => {
    console.log(`\n📝 Input: "${input}"`)
    const suggestions = generateAmountSuggestions(input)
    
    if (suggestions.length === 0) {
      console.log('   ❌ Không có gợi ý')
    } else {
      console.log('   ✅ Gợi ý:')
      suggestions.forEach((amount, index) => {
        const formatted = formatCurrency(amount)
        const shortForm = amount >= 1000000 
          ? `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`
          : amount >= 1000 
          ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`
          : amount.toString()
        
        console.log(`      ${index + 1}. ${formatted} ₫ (${shortForm})`)
      })
    }
  })

  console.log('\n🎯 Test cases đặc biệt:')
  
  // Test edge cases
  const edgeCases = ['', '0', 'abc', '-5', '0.5']
  edgeCases.forEach(input => {
    console.log(`\n📝 Edge case: "${input}"`)
    const suggestions = generateAmountSuggestions(input)
    console.log(`   Kết quả: ${suggestions.length === 0 ? 'Không có gợi ý (đúng)' : 'Có gợi ý (sai)'}`)
  })

  console.log('\n🎉 Test hoàn thành!')
  console.log('\n📋 Tóm tắt logic:')
  console.log('   • Số 1-9: gợi ý x1K, x10K, x100K, x1M')
  console.log('   • Số 10-99: gợi ý x1K, x10K, x100K')
  console.log('   • Số 100-999: gợi ý x1K, x10K')
  console.log('   • Số ≥1000: gợi ý x1K')
  console.log('   • Giới hạn: ≤100M')
  console.log('   • Edge cases: trả về mảng rỗng')
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testAmountSuggestions()
}

module.exports = { generateAmountSuggestions, formatCurrency }
