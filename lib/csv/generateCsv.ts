import type { Company } from '@/types/database'

const CSV_HEADERS = [
  'ID',
  '作成日時',
  '会社名',
  '会社名カナ',
  '代表者名',
  '代表者名カナ',
  '住所',
  '連絡先（携帯）',
  '月商（万円）',
  '評価',
  '非表示',
]

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function companyToRow(c: Company): string {
  const address = [c.company_prefecture, c.company_city, c.company_street]
    .filter(Boolean)
    .join('')
  return [
    c.id,
    c.created_at ? new Date(c.created_at).toLocaleString('ja-JP') : '',
    c.company_name,
    c.company_name_kana,
    c.rep_name,
    c.rep_name_kana,
    address,
    c.mobile_phone,
    c.monthly_revenue,
    c.star_rating ? '★'.repeat(c.star_rating) : '',
    c.is_hidden ? '非表示' : '',
  ]
    .map(escapeCsv)
    .join(',')
}

/**
 * Generate CSV with BOM (UTF-8) for Excel compatibility
 * Processes data in batches using cursor-based pagination
 */
export async function generateCsvStream(
  fetchBatch: (lastId: number, limit: number) => Promise<Company[]>
): Promise<string> {
  const BOM = '\uFEFF'
  const rows: string[] = [BOM + CSV_HEADERS.join(',')]

  let lastId = 0
  const batchSize = 1000

  // Cursor-based pagination to handle 12,000+ records efficiently
  while (true) {
    const batch = await fetchBatch(lastId, batchSize)
    if (batch.length === 0) break

    batch.forEach((c) => rows.push(companyToRow(c)))
    const lastItem = batch[batch.length - 1]
    if (!lastItem) break
    lastId = lastItem.id

    if (batch.length < batchSize) break
  }

  return rows.join('\n')
}
