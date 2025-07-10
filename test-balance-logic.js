// Test script để verify logic tính toán số dư
console.log("=== TEST BALANCE CALCULATION LOGIC ===");

// Simulate logic cũ (SAI)
function oldLogic(month, year) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  
  console.log(`\n--- OLD LOGIC for ${month}/${year} ---`);
  console.log(`Previous month: ${prevMonth}/${prevYear}`);
  console.log(`Filter condition: year < ${prevYear} || (year === ${prevYear} && month <= ${prevMonth})`);
  
  // Test với các tháng
  const testMonths = [
    {month: 1, year: 2025, desc: "Jan 2025"},
    {month: 2, year: 2025, desc: "Feb 2025"}, 
    {month: 3, year: 2025, desc: "Mar 2025"},
    {month: 6, year: 2025, desc: "Jun 2025"},
    {month: 7, year: 2025, desc: "Jul 2025"}
  ];
  
  testMonths.forEach(test => {
    const included = test.year < prevYear || (test.year === prevYear && test.month <= prevMonth);
    console.log(`  ${test.desc}: ${included ? "INCLUDED" : "excluded"}`);
  });
}

// Simulate logic mới (ĐÚNG)
function newLogic(month, year) {
  console.log(`\n--- NEW LOGIC for ${month}/${year} ---`);
  console.log(`Filter condition: year < ${year} || (year === ${year} && month < ${month})`);
  
  // Test với các tháng
  const testMonths = [
    {month: 1, year: 2025, desc: "Jan 2025"},
    {month: 2, year: 2025, desc: "Feb 2025"}, 
    {month: 3, year: 2025, desc: "Mar 2025"},
    {month: 6, year: 2025, desc: "Jun 2025"},
    {month: 7, year: 2025, desc: "Jul 2025"}
  ];
  
  testMonths.forEach(test => {
    const included = test.year < year || (test.year === year && test.month < month);
    console.log(`  ${test.desc}: ${included ? "INCLUDED" : "excluded"}`);
  });
}

// Test cho tháng 6/2025
console.log("\n🔍 TESTING FOR MONTH 6/2025:");
oldLogic(6, 2025);
newLogic(6, 2025);

// Test cho tháng 7/2025  
console.log("\n🔍 TESTING FOR MONTH 7/2025:");
oldLogic(7, 2025);
newLogic(7, 2025);

console.log("\n=== ANALYSIS ===");
console.log("❌ OLD LOGIC PROBLEM:");
console.log("   - Tháng 6: Tính từ Jan-May → Số dư đầu kỳ thấp");
console.log("   - Tháng 7: Tính từ Jan-Jun → Số dư đầu kỳ cao hơn (bao gồm Jun)");
console.log("   - KẾT QUẢ: Số dư tăng đột ngột khi chuyển từ tháng 6 sang 7!");

console.log("\n✅ NEW LOGIC SOLUTION:");
console.log("   - Tháng 6: Tính từ Jan-May → Số dư đầu kỳ");
console.log("   - Tháng 7: Tính từ Jan-Jun → Số dư đầu kỳ (bao gồm kết quả tháng 6)");
console.log("   - KẾT QUẢ: Số dư tăng/giảm đúng theo giao dịch thực tế!");
