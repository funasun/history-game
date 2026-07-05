// 長月十六日から始まる（旧暦の秋・月がほぼ満ちる頃）
const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function toKanji(n: number): string {
  if (n <= 10) return n === 10 ? '十' : DIGITS[n]
  if (n < 20) return '十' + DIGITS[n - 10]
  return DIGITS[Math.floor(n / 10)] + '十' + DIGITS[n % 10]
}

export function dateLabel(day: number): string {
  return `長月${toKanji(15 + day)}日`
}
