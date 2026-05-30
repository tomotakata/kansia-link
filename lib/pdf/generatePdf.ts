import type { Company, PaymentScheduleItem, FamilyMember } from '@/types/database'
import type { Json } from '@/types/database'

function toStr(val: string | null | undefined): string {
  return val ?? ''
}

function toNum(val: number | null | undefined): string {
  if (val == null) return ''
  return String(val)
}

function parseJson<T>(val: Json): T {
  if (Array.isArray(val)) return val as unknown as T
  return [] as unknown as T
}

/**
 * Generate PDF as base64 string using jsPDF with embedded NotoSansJP font
 * Returns Uint8Array buffer
 */
export async function generateCompanyPdf(company: Company): Promise<Uint8Array> {
  // Dynamic import to avoid SSR/bundle issues
  const { jsPDF } = await import('jspdf')
  const { readFileSync } = await import('fs')
  const { join } = await import('path')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Load and embed NotoSansJP font from filesystem (server-side)
  try {
    const fontPath = join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.ttf')
    const fontBuffer = readFileSync(fontPath)
    const fontBase64 = fontBuffer.toString('base64')
    doc.addFileToVFS('NotoSansJP-Regular.ttf', fontBase64)
    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal')
    doc.setFont('NotoSansJP')
  } catch (e) {
    console.warn('NotoSansJP font load failed:', e)
  }

  const margin = 15
  const pageWidth = 210
  const contentWidth = pageWidth - margin * 2
  let y = 15

  // --- Helper functions ---
  function drawLine(yPos: number) {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
  }

  function drawSectionTitle(title: string, yPos: number): number {
    doc.setFillColor(60, 90, 153)
    doc.rect(margin, yPos, contentWidth, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text(title, margin + 2, yPos + 5)
    doc.setTextColor(0, 0, 0)
    return yPos + 9
  }

  function drawField(
    label: string,
    value: string,
    x: number,
    yPos: number,
    labelWidth: number,
    cellWidth: number
  ): number {
    doc.setFillColor(240, 243, 250)
    doc.rect(x, yPos, labelWidth, 6, 'F')
    doc.setDrawColor(200, 200, 200)
    doc.rect(x, yPos, cellWidth, 6)
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)
    doc.text(label, x + 1, yPos + 4)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    const valueX = x + labelWidth + 1
    const maxWidth = cellWidth - labelWidth - 2
    doc.text(value, valueX, yPos + 4, { maxWidth })
    return yPos + 7
  }

  // --- Header ---
  doc.setFillColor(30, 60, 130)
  doc.rect(0, 0, pageWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text('顧客詳細情報', margin, 8)
  doc.setFontSize(8)
  doc.text(`No. ${company.id}`, pageWidth - margin - 20, 8)
  y = 16

  // --- Company Basic Info ---
  y = drawSectionTitle('会社情報', y)
  const halfW = contentWidth / 2

  // Row 1: 会社名 / 更新日・登録日
  drawField(
    '会社名',
    toStr(company.company_name),
    margin,
    y,
    20,
    halfW
  )
  drawField(
    '登録日',
    toStr(company.registered_at),
    margin + halfW,
    y,
    20,
    halfW
  )
  y += 7

  // Row 2: 会社名カナ / 更新日
  drawField(
    '会社名カナ',
    toStr(company.company_name_kana),
    margin,
    y,
    20,
    halfW
  )
  drawField(
    '更新日',
    toStr(company.updated_at?.slice(0, 10)),
    margin + halfW,
    y,
    20,
    halfW
  )
  y += 7

  // Row 3: 電話 / FAX
  drawField('会社電話', toStr(company.company_phone), margin, y, 20, halfW)
  drawField('FAX', toStr(company.company_fax), margin + halfW, y, 20, halfW)
  y += 7

  // ★ Rating
  const stars = company.star_rating ? '★'.repeat(company.star_rating) + '☆'.repeat(5 - company.star_rating) : '-'
  drawField('評価', stars, margin, y, 20, contentWidth)
  y += 9

  // --- Representative Info ---
  y = drawSectionTitle('代表者情報', y)

  const birthStr = company.birth_era
    ? `${company.birth_era}${toNum(company.birth_year)}年${toNum(company.birth_month)}月${toNum(company.birth_day)}日`
    : ''
  const w3 = contentWidth / 3

  drawField('生年月日', birthStr, margin, y, 20, w3)
  drawField('性別', toStr(company.gender), margin + w3, y, 15, w3)
  drawField('代表者名', toStr(company.rep_name), margin + w3 * 2, y, 20, w3)
  y += 7
  drawField('代表者名カナ', toStr(company.rep_name_kana), margin, y, 24, halfW)
  drawField('携帯電話', toStr(company.mobile_phone), margin + halfW, y, 20, halfW)
  y += 7
  drawField('自宅電話', toStr(company.home_phone), margin, y, 20, halfW)
  drawField('メール', toStr(company.email), margin + halfW, y, 20, halfW)
  y += 9

  // --- Company Address ---
  y = drawSectionTitle('会社住所', y)
  drawField('種別', toStr(company.company_address_type), margin, y, 15, w3)
  drawField('名義', toStr(company.company_address_owner), margin + w3, y, 15, w3 * 2)
  y += 7
  drawField('郵便番号', toStr(company.company_postal_code), margin, y, 20, w3)
  drawField('都道府県', toStr(company.company_prefecture), margin + w3, y, 20, w3)
  drawField('市区町村', toStr(company.company_city), margin + w3 * 2, y, 20, w3)
  y += 7
  drawField('番地', toStr(company.company_street), margin, y, 15, contentWidth)
  y += 9

  // --- Representative Address ---
  y = drawSectionTitle('代表住所', y)
  if (company.rep_address_same) {
    doc.setFontSize(8)
    doc.text('（会社住所と同じ）', margin + 2, y + 4)
    y += 9
  } else {
    drawField('種別', toStr(company.rep_address_type), margin, y, 15, w3)
    drawField('名義', toStr(company.rep_address_owner), margin + w3, y, 15, w3 * 2)
    y += 7
    drawField('郵便番号', toStr(company.rep_postal_code), margin, y, 20, w3)
    drawField('都道府県', toStr(company.rep_prefecture), margin + w3, y, 20, w3)
    drawField('市区町村', toStr(company.rep_city), margin + w3 * 2, y, 20, w3)
    y += 7
    drawField('番地', toStr(company.rep_street), margin, y, 15, contentWidth)
    y += 9
  }

  // --- Business Metrics ---
  y = drawSectionTitle('事業情報', y)
  const w4 = contentWidth / 4
  drawField('資本金', company.capital != null ? `${company.capital}万円` : '', margin, y, 18, w4)
  drawField('月商', company.monthly_revenue != null ? `${company.monthly_revenue}万円` : '', margin + w4, y, 15, w4)
  drawField('従業員数', company.employees != null ? `${company.employees}人` : '', margin + w4 * 2, y, 20, w4)
  drawField('設立年', company.founded_year != null ? `${company.founded_year}年` : '', margin + w4 * 3, y, 18, w4)
  y += 7
  drawField('買取希望額', company.purchase_amount != null ? `${company.purchase_amount}万円` : '', margin, y, 22, halfW)
  drawField('買取希望日', toStr(company.purchase_date), margin + halfW, y, 22, halfW)
  y += 7
  drawField('給料日', company.payday != null ? `${company.payday}日` : '', margin, y, 18, w3)
  drawField('給与総支給額', company.total_salary != null ? `${company.total_salary}万円` : '', margin + w3, y, 24, w3)
  drawField('当座口座', toStr(company.current_account), margin + w3 * 2, y, 20, w3)
  y += 7
  if (company.business_description) {
    drawField('事業内容', toStr(company.business_description), margin, y, 20, contentWidth)
    y += 7
  }
  y += 2

  // --- Payment Schedule ---
  const payments = parseJson<PaymentScheduleItem[]>(company.payment_schedule)
  if (payments.length > 0) {
    y = drawSectionTitle('入金予定', y)
    const colWidths = [35, 40, 25, 30, 30]
    const headers = ['会社名', '住所', '入金予定額', '条件1', '条件2']

    // Header row
    let xPos = margin
    colWidths.forEach((w, i) => {
      doc.setFillColor(200, 210, 230)
      doc.rect(xPos, y, w, 6, 'F')
      doc.setDrawColor(180, 180, 180)
      doc.rect(xPos, y, w, 6)
      doc.setFontSize(7)
      doc.setTextColor(40, 40, 40)
      doc.text(headers[i] ?? '', xPos + 1, y + 4)
      xPos += w
    })
    y += 6

    payments.forEach((p) => {
      xPos = margin
      const rowData = [p.company, p.address, p.amount, p.condition1, p.condition2]
      colWidths.forEach((w, i) => {
        doc.setFillColor(255, 255, 255)
        doc.rect(xPos, y, w, 6, 'F')
        doc.setDrawColor(200, 200, 200)
        doc.rect(xPos, y, w, 6)
        doc.setFontSize(7)
        doc.setTextColor(0, 0, 0)
        doc.text(rowData[i] ?? '', xPos + 1, y + 4, { maxWidth: w - 2 })
        xPos += w
      })
      y += 6
    })
    y += 3
  }

  // --- Tax & Others ---
  y = drawSectionTitle('税金・その他', y)
  drawField('税金納付状況', toStr(company.tax_payment_status), margin, y, 24, halfW)
  drawField('他社利用状況', toStr(company.other_companies), margin + halfW, y, 24, halfW)
  y += 7
  if (company.tax_payment_detail) {
    drawField('未納詳細', toStr(company.tax_payment_detail), margin, y, 20, contentWidth)
    y += 7
  }
  if (company.notes) {
    drawField('備考', toStr(company.notes), margin, y, 15, contentWidth)
    y += 7
  }

  // --- Family Members ---
  const family = parseJson<FamilyMember[]>(company.family_members)
  const validFamily = family.filter((f) => f.name)
  if (validFamily.length > 0) {
    y = drawSectionTitle('家族構成', y)
    validFamily.forEach((f) => {
      drawField('氏名', f.name, margin, y, 15, w3)
      drawField('続柄', f.relation, margin + w3, y, 15, w3)
      drawField('備考', f.note, margin + w3 * 2, y, 15, w3)
      y += 7
    })
  }

  // --- Footer ---
  drawLine(y + 2)
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `カンシアリンク  |  出力日: ${new Date().toLocaleDateString('ja-JP')}  |  ID: ${company.id}`,
    margin,
    y + 6
  )

  return doc.output('arraybuffer') as unknown as Uint8Array
}
