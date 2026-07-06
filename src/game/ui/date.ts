// 漢数字（時代パックの日付表記が使う）
const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

export function toKanji(n: number): string {
  if (n <= 10) return n === 10 ? '十' : DIGITS[n]
  if (n < 20) return '十' + DIGITS[n - 10]
  return DIGITS[Math.floor(n / 10)] + '十' + DIGITS[n % 10]
}
