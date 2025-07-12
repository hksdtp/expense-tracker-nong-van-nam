#!/usr/bin/env node

/**
 * Script test function chuyển số thành chữ
 */

// Hàm chuyển đổi số thành chữ tiếng Việt (copy từ lib)
function amountToWords(amount) {
  if (amount === 0) return "không đồng"
  if (amount < 0) return "âm " + amountToWords(-amount)

  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
  const positions = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"]

  // Hàm đọc số có 3 chữ số
  const readThreeDigits = (num) => {
    const hundred = Math.floor(num / 100)
    const ten = Math.floor((num % 100) / 10)
    const unit = num % 10

    let result = ""

    if (hundred > 0) {
      result += units[hundred] + " trăm "
    }

    if (ten > 0) {
      if (ten === 1) {
        result += "mười "
      } else {
        result += units[ten] + " mươi "
      }

      if (unit === 1 && ten > 1) {
        result += "mốt"
      } else if (unit === 5 && ten > 0) {
        result += "lăm"
      } else if (unit > 0) {
        result += units[unit]
      }
    } else if (unit > 0) {
      // Chỉ thêm "lẻ" khi có hàng trăm và không có hàng chục
      if (hundred > 0) {
        result += "lẻ " + units[unit]
      } else {
        // Nếu không có hàng trăm, chỉ đọc đơn vị
        result += units[unit]
      }
    }

    return result.trim()
  }

  // Chuyển số thành chuỗi và chia thành các nhóm 3 chữ số
  const amountStr = Math.floor(amount).toString()
  const groups = []

  for (let i = amountStr.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3)
    groups.unshift(parseInt(amountStr.substring(start, i)))
  }

  // Đọc từng nhóm và thêm đơn vị vị trí
  let result = ""
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    const position = positions[groups.length - i - 1]

    if (group > 0) {
      result += readThreeDigits(group) + " " + position + " "
    }
  }

  // Làm sạch và viết hoa chữ cái đầu
  const finalResult = result.trim()
  return finalResult.charAt(0).toUpperCase() + finalResult.slice(1) + " đồng"
}

function testNumberToWords() {
  console.log('🧪 Test chuyển số thành chữ tiếng Việt...')
  console.log('=' .repeat(50))

  const testCases = [
    1000,
    10000,
    100000,
    1000000,
    12000,
    120000,
    1200000,
    123000,
    1230000,
    1500000,
    5000000,
    15000000,
    50000000,
    100000000
  ]

  testCases.forEach(amount => {
    try {
      const words = amountToWords(amount)
      const formatted = new Intl.NumberFormat("vi-VN").format(amount)
      console.log(`\n💰 ${formatted} ₫`)
      console.log(`   📝 ${words}`)
    } catch (error) {
      console.log(`\n❌ Lỗi với số ${amount}: ${error.message}`)
    }
  })

  console.log('\n🎯 Test cases đặc biệt:')
  
  const specialCases = [0, -1000, 1, 5, 15, 25, 50, 99, 101, 999]
  specialCases.forEach(amount => {
    try {
      const words = amountToWords(amount)
      const formatted = new Intl.NumberFormat("vi-VN").format(amount)
      console.log(`\n💰 ${formatted} ₫ → ${words}`)
    } catch (error) {
      console.log(`\n❌ Lỗi với số ${amount}: ${error.message}`)
    }
  })

  console.log('\n✅ Test hoàn thành!')
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  testNumberToWords()
}

module.exports = { testNumberToWords }
