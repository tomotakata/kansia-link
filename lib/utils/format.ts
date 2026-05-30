// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-'
  return n.toLocaleString('ja-JP')
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return '-'
  return `${n.toLocaleString('ja-JP')}万円`
}
