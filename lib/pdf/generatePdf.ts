import type { Company, PaymentScheduleItem } from '@/types/database'
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
 * Generate PDF matching the reference form layout
 */
export async function generateCompanyPdf(company: Company): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Load NotoSansJP font
  try {
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const cwd = process.cwd()
    for (const p of [
      join(cwd, 'resources', 'fonts', 'NotoSansJP-Regular.ttf'),
      join(cwd, 'public', 'fonts', 'NotoSansJP-Regular.ttf'),
    ]) {
      try {
        const buf = readFileSync(p)
        const b64 = buf.toString('base64')
        doc.addFileToVFS('NotoSansJP.ttf', b64)
        doc.addFont('NotoSansJP.ttf', 'NotoSansJP', 'normal')
        doc.setFont('NotoSansJP')
        break
      } catch { /* try next */ }
    }
  } catch (e) {
    console.warn('Font load failed:', e)
  }

  // ── Layout constants ──────────────────────────────────────────────────
  const L = 7    // table left x (mm)
  const W = 196  // table width
  const R = L + W // 203

  // ── Drawing helpers ───────────────────────────────────────────────────
  const setStroke = () => { doc.setDrawColor(30, 80, 160); doc.setLineWidth(0.3) }
  const lbl = (text: string, x: number, y: number) => {
    doc.setFontSize(7); doc.setTextColor(30, 80, 160)
    doc.text(text, x, y)
  }
  const val = (text: string, x: number, y: number, maxW?: number) => {
    doc.setFontSize(9); doc.setTextColor(0, 0, 0)
    if (maxW) doc.text(text, x, y, { maxWidth: maxW })
    else doc.text(text, x, y)
  }
  const hLine = (x1: number, x2: number, y: number) => {
    setStroke(); doc.line(x1, y, x2, y)
  }
  const vLine = (x: number, y1: number, y2: number) => {
    setStroke(); doc.line(x, y1, x, y2)
  }

  // ── Header (above table) ──────────────────────────────────────────────
  const updatedAt  = toStr(company.updated_at).slice(0, 10)
  const registeredAt = toStr(company.registered_at)
  doc.setFontSize(8); doc.setTextColor(30, 80, 160)
  doc.text(`更新日  ${updatedAt}    登録日  ${registeredAt}`, R, 10, { align: 'right' })

  // ── Row definitions ───────────────────────────────────────────────────
  const T = 14  // table top y
  const rowHeights = [8, 17, 17, 8, 16, 15, 8, 14, 20, 9, 13, 20, 13, 15, 14, 8, 8, 8, 8, 30]
  let cur = T
  const ry: number[] = []
  for (const h of rowHeights) { ry.push(cur); cur += h }
  const tableBottom = cur

  // Draw outer border
  doc.setDrawColor(30, 80, 160)
  doc.setLineWidth(0.3)
  doc.rect(L, T, W, tableBottom - T)

  // ── Column dividers ───────────────────────────────────────────────────
  const CD_MAIN   = L + 130  // main right-section divider (rows 1–3)
  const CD_REP1   = L + 106  // 代表名 / 携帯電話
  const CD_REP2   = L + 150  // 携帯電話 / 自宅電話
  const CD_POST1  = L + 57   // 郵便番号 / 都道府県
  const CD_POST2  = L + 122  // 都道府県 / 区市町村
  const CD_CAP1   = L + 49   // 資本金 / 月商
  const CD_CAP2   = L + 98   // 月商 / 従業員数
  const CD_CAP3   = L + 147  // 従業員数 / 営業年数
  const CD_BIZ    = L + 56   // 事業内容 右端
  const CD_PUR1   = L + 107  // 当座口座 / 買取希望額
  const CD_PUR2   = L + 156  // 買取希望額 / 買取希望日
  const CD_PAY1   = L + 63   // 入金: 会社名 / 住所
  const CD_PAY2   = L + 120  // 入金: 住所 / 入金予定額
  const CD_PAY3   = L + 148  // 入金: 入金予定額 / 取引条件
  const CD_TAX1   = L + 65   // 税金 / 他社利用
  const CD_TAX2   = L + 129  // 他社利用 / 備考

  // Row y-positions and heights (non-nullable)
  const Y = (i: number) => ry[i] as number
  const H = (i: number) => rowHeights[i] as number
  const y1=Y(0),y2=Y(1),y3=Y(2),y4=Y(3),y5=Y(4),y6=Y(5),y7=Y(6),y8=Y(7),y9=Y(8)
  const y10=Y(9),y11=Y(10),y12=Y(11),y13=Y(12),y14=Y(13),y15=Y(14),y16=Y(15)
  const y17=Y(16),y18=Y(17),y19=Y(18),y20=Y(19)
  const h1=H(0),h2=H(1),h3=H(2),h4=H(3),h5=H(4),h6=H(5),h7=H(6),h8=H(7),h9=H(8)
  const h10=H(9),h11=H(10),h12=H(11),h13=H(12),h14=H(13),h15=H(14),h20=H(19)

  // ── Row 1: ※ 評価 | 番号 ─────────────────────────────────────────────
  hLine(L, R, y1 + h1)
  vLine(CD_MAIN, y1, y1 + h1)
  lbl('※', L + 1, y1 + 5)
  if (company.star_rating) {
    doc.setFontSize(8); doc.setTextColor(0, 0, 0)
    doc.text('★'.repeat(company.star_rating), L + 6, y1 + 5)
  }
  lbl('番号', CD_MAIN + 1, y1 + 3)
  val(toNum(company.id), CD_MAIN + 1, y1 + 7)

  // ── Row 2: 会社名 | 会社電話番号 ──────────────────────────────────────
  hLine(L, R, y2 + h2)
  vLine(CD_MAIN, y2, y2 + h2)
  lbl('会社名', L + 1, y2 + 3)
  val(toStr(company.company_name), L + 1, y2 + 10, 124)
  lbl('会社電話番号', CD_MAIN + 1, y2 + 3)
  val(toStr(company.company_phone), CD_MAIN + 1, y2 + 10)

  // ── Row 3: 会社名カナ | 会社FAX ──────────────────────────────────────
  hLine(L, R, y3 + h3)
  vLine(CD_MAIN, y3, y3 + h3)
  lbl('会社名カナ', L + 1, y3 + 3)
  val(toStr(company.company_name_kana), L + 1, y3 + 10, 124)
  lbl('会社FAX', CD_MAIN + 1, y3 + 3)
  val(toStr(company.company_fax), CD_MAIN + 1, y3 + 10)

  // ── Row 4: 和暦 年 月 日 性別 ────────────────────────────────────────
  hLine(L, R, y4 + h4)
  {
    const era    = toStr(company.birth_era)
    const byear  = toNum(company.birth_year)
    const bmonth = toNum(company.birth_month)
    const bday   = toNum(company.birth_day)
    const gender = toStr(company.gender)
    let x = L + 1
    lbl('和暦', x, y4 + 5); x += 9
    val(era, x, y4 + 5); x += era.length * 2.5 + 3
    val(byear, x, y4 + 5); x += Math.max(byear.length, 1) * 2.5 + 2
    lbl('年', x, y4 + 5); x += 6
    val(bmonth, x, y4 + 5); x += Math.max(bmonth.length, 1) * 2.5 + 2
    lbl('月', x, y4 + 5); x += 6
    val(bday, x, y4 + 5); x += Math.max(bday.length, 1) * 2.5 + 2
    lbl('日', x, y4 + 5); x += 10
    lbl('性別', x, y4 + 5); x += 9
    doc.setFontSize(9); doc.setTextColor(0, 0, 0)
    doc.setFont('NotoSansJP', 'normal')
    doc.text(gender, x, y4 + 5)
  }

  // ── Row 5: 代表名 | 携帯電話 | 自宅電話 ──────────────────────────────
  hLine(L, R, y5 + h5)
  vLine(CD_REP1, y5, y5 + h5)
  vLine(CD_REP2, y5, y5 + h5)
  lbl('代表名', L + 1, y5 + 3)
  val(toStr(company.rep_name), L + 1, y5 + 10, 99)
  lbl('携帯電話', CD_REP1 + 1, y5 + 3)
  val(toStr(company.mobile_phone), CD_REP1 + 1, y5 + 10)
  lbl('自宅電話', CD_REP2 + 1, y5 + 3)
  val(toStr(company.home_phone), CD_REP2 + 1, y5 + 10)

  // ── Row 6: 代表名カナ | メールアドレス ───────────────────────────────
  hLine(L, R, y6 + h6)
  vLine(CD_REP1, y6, y6 + h6)
  lbl('代表名カナ', L + 1, y6 + 3)
  val(toStr(company.rep_name_kana), L + 1, y6 + 10, 99)
  lbl('メールアドレス', CD_REP1 + 1, y6 + 3)
  val(toStr(company.email), CD_REP1 + 1, y6 + 10)

  // ── Row 7: 会社住所 種別 名義 ─────────────────────────────────────────
  hLine(L, R, y7 + h7)
  lbl('会社住所', L + 1, y7 + 5)
  val(toStr(company.company_address_type), L + 18, y7 + 5)
  lbl('名義', L + 32, y7 + 5)
  val(toStr(company.company_address_owner), L + 40, y7 + 5)

  // ── Row 8: 郵便番号 | 都道府県 | 区市町村 ────────────────────────────
  hLine(L, R, y8 + h8)
  vLine(CD_POST1, y8, y8 + h8)
  vLine(CD_POST2, y8, y8 + h8)
  lbl('郵便番号', L + 1, y8 + 3)
  val(toStr(company.company_postal_code), L + 1, y8 + 10)
  lbl('都道府県', CD_POST1 + 1, y8 + 3)
  val(toStr(company.company_prefecture), CD_POST1 + 1, y8 + 10)
  lbl('区市町村', CD_POST2 + 1, y8 + 3)
  val(toStr(company.company_city), CD_POST2 + 1, y8 + 10)

  // ── Row 9: 番地 ──────────────────────────────────────────────────────
  hLine(L, R, y9 + h9)
  lbl('番地', L + 1, y9 + 3)
  val(toStr(company.company_street), L + 1, y9 + 10, W - 2)

  // ── Row 10: 代表住所 種別 名義 ────────────────────────────────────────
  hLine(L, R, y10 + h10)
  lbl('代表住所', L + 1, y10 + 6)
  val(toStr(company.rep_address_type), L + 18, y10 + 6)
  lbl('名義', L + 32, y10 + 6)
  val(toStr(company.rep_address_owner), L + 40, y10 + 6)

  // ── Row 11: 郵便番号 | 都道府県 | 区市町村 ───────────────────────────
  hLine(L, R, y11 + h11)
  vLine(CD_POST1, y11, y11 + h11)
  vLine(CD_POST2, y11, y11 + h11)
  lbl('郵便番号', L + 1, y11 + 3)
  val(toStr(company.rep_postal_code), L + 1, y11 + 10)
  lbl('都道府県', CD_POST1 + 1, y11 + 3)
  val(toStr(company.rep_prefecture), CD_POST1 + 1, y11 + 10)
  lbl('区市町村', CD_POST2 + 1, y11 + 3)
  val(toStr(company.rep_city), CD_POST2 + 1, y11 + 10)

  // ── Row 12: 番地 ─────────────────────────────────────────────────────
  hLine(L, R, y12 + h12)
  lbl('番地', L + 1, y12 + 3)
  val(toStr(company.rep_street), L + 1, y12 + 10, W - 2)

  // ── Row 13: 資本金 | 月商 | 従業員数 | 営業年数 ──────────────────────
  hLine(L, R, y13 + h13)
  vLine(CD_CAP1, y13, y13 + h13)
  vLine(CD_CAP2, y13, y13 + h13)
  vLine(CD_CAP3, y13, y13 + h13)
  lbl('資本金（万円）', L + 1, y13 + 3)
  val(toNum(company.capital), L + 1, y13 + 10)
  lbl('月商（万円）', CD_CAP1 + 1, y13 + 3)
  val(toNum(company.monthly_revenue), CD_CAP1 + 1, y13 + 10)
  lbl('従業員数（人）', CD_CAP2 + 1, y13 + 3)
  val(toNum(company.employees), CD_CAP2 + 1, y13 + 10)
  lbl('営業年数（年）', CD_CAP3 + 1, y13 + 3)
  val(toNum(company.founded_year), CD_CAP3 + 1, y13 + 10)

  // ── Rows 14+15: 事業内容(tall) | 当座口座/買取 | 給料日/給与 ──────────
  // 事業内容 spans rows 14+15
  vLine(CD_BIZ, y14, y15 + h15)
  // horizontal divider between row14 and row15 (right side only)
  hLine(CD_BIZ, R, y14 + h14)
  // row 15 bottom
  hLine(L, R, y15 + h15)
  // right-section column dividers
  vLine(CD_PUR1, y14, y15 + h15)
  vLine(CD_PUR2, y14, y15 + h15)

  lbl('事業内容', L + 1, y14 + 3)
  val(toStr(company.business_description), L + 1, y14 + 10, CD_BIZ - L - 2)

  lbl('当座口座', CD_BIZ + 1, y14 + 3)
  val(toStr(company.current_account), CD_BIZ + 1, y14 + 10)
  lbl('買取希望額', CD_PUR1 + 1, y14 + 3)
  val(company.purchase_amount != null ? `${company.purchase_amount}万円` : '', CD_PUR1 + 1, y14 + 10)
  lbl('買取希望日', CD_PUR2 + 1, y14 + 3)
  val(toStr(company.purchase_date), CD_PUR2 + 1, y14 + 10)

  lbl('給料日', CD_PUR1 + 1, y15 + 3)
  val(company.payday != null ? `${company.payday}日` : '', CD_PUR1 + 1, y15 + 10)
  lbl('給与総支給額', CD_PUR2 + 1, y15 + 3)
  val(company.total_salary != null ? `${company.total_salary}万円` : '', CD_PUR2 + 1, y15 + 10)

  // ── Rows 16–19: 入金予定テーブル ─────────────────────────────────────
  hLine(L, R, y16 + H(15))
  vLine(CD_PAY1, y16, y19 + H(18))
  vLine(CD_PAY2, y16, y19 + H(18))
  vLine(CD_PAY3, y16, y19 + H(18))

  // header
  lbl('会社名',   L + 1,       y16 + 5)
  lbl('住所',     CD_PAY1 + 1, y16 + 5)
  lbl('入金予定額', CD_PAY2 + 1, y16 + 5)
  lbl('取引条件', CD_PAY3 + 1, y16 + 5)

  // data rows
  const payments = parseJson<PaymentScheduleItem[]>(company.payment_schedule)
  ;([y17, y18, y19] as number[]).forEach((rowY, i) => {
    hLine(L, R, rowY + H(16))
    const p = payments[i]
    if (p) {
      val(toStr(p.company),    L + 1,       rowY + 6, 55)
      val(toStr(p.address),    CD_PAY1 + 1, rowY + 6, 51)
      val(toStr(p.amount),     CD_PAY2 + 1, rowY + 6, 23)
      val(toStr(p.condition1), CD_PAY3 + 1, rowY + 6, 44)
    }
  })

  // ── Row 20: 税金 | 他社利用状況 | 備考 ──────────────────────────────
  vLine(CD_TAX1, y20, y20 + h20)
  vLine(CD_TAX2, y20, y20 + h20)

  lbl('税金納付状況', L + 1, y20 + 3)
  val(toStr(company.tax_payment_status), L + 1, y20 + 10)
  if (company.tax_payment_detail) {
    doc.setFontSize(8); doc.setTextColor(0, 0, 0)
    doc.text(toStr(company.tax_payment_detail), L + 1, y20 + 16, { maxWidth: 57 })
  }

  lbl('他社利用状況', CD_TAX1 + 1, y20 + 3)
  val(toStr(company.other_companies), CD_TAX1 + 1, y20 + 10, 58)

  lbl('備考', CD_TAX2 + 1, y20 + 3)
  val(toStr(company.notes), CD_TAX2 + 1, y20 + 10, 64)

  return doc.output('arraybuffer') as unknown as Uint8Array
}
