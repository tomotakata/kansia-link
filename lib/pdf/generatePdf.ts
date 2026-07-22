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
 * Generate PDF matching the reference form layout (22-row structure)
 *
 * Row map:
 *  0  ※/番号
 *  1  会社名 / 会社電話番号
 *  2  会社名カナ / 会社FAX
 *  3  和暦 年 月 日 性別
 *  4  代表名 / 携帯電話 / 自宅電話
 *  5  代表名カナ / メールアドレス
 *  6  会社住所ヘッダー
 *  7  郵便番号(会社) / 都道府県 / 区市町村
 *  8  番地(会社)
 *  9  [セパレーター]
 * 10  代表住所ヘッダー
 * 11  郵便番号(代表) / 都道府県 / 区市町村
 * 12  番地(代表)
 * 13  [セパレーター]
 * 14  資本金 / 月商 / 従業員数 / 営業年数
 * 15  事業内容(上) / 当座口座 / 買取希望額 / 買取希望日
 * 16  事業内容(下) / 給料日 / 給与総支給額
 * 17  入金ヘッダー
 * 18  入金行1
 * 19  入金行2
 * 20  入金行3
 * 21  税金納付状況 / 他社利用状況 / 備考
 */
export async function generateCompanyPdf(company: Company): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Load NotoSansJP font ──────────────────────────────────────────────
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
  const R = L + W // right edge = 203

  // Blue color (matches reference image)
  const BLUE: [number, number, number] = [30, 80, 160]

  // ── Drawing helpers ───────────────────────────────────────────────────
  const setStroke = () => { doc.setDrawColor(...BLUE); doc.setLineWidth(0.5) }
  const lbl = (text: string, x: number, y: number) => {
    doc.setFontSize(7); doc.setTextColor(...BLUE)
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
  const vLine = (x: number, ya: number, yb: number) => {
    setStroke(); doc.line(x, ya, x, yb)
  }

  // ── Header (above table) ──────────────────────────────────────────────
  const updatedAt    = toStr(company.updated_at).slice(0, 10)
  const registeredAt = toStr(company.registered_at)
  doc.setFontSize(8); doc.setTextColor(...BLUE)
  doc.text(`更新日  ${updatedAt}    登録日  ${registeredAt}`, R, 10, { align: 'right' })

  // ── Row definitions (22 rows) ─────────────────────────────────────────
  const T = 14  // table top y
  const rowHeights = [
    8,  // 0  ※/番号
    17, // 1  会社名
    17, // 2  会社名カナ
    8,  // 3  和暦
    16, // 4  代表名
    15, // 5  代表名カナ
    8,  // 6  会社住所ヘッダー
    14, // 7  郵便番号(会社)
    15, // 8  番地(会社)
    6,  // 9  セパレーター
    8,  // 10 代表住所ヘッダー
    14, // 11 郵便番号(代表)
    15, // 12 番地(代表)
    6,  // 13 セパレーター
    13, // 14 資本金/月商/従業員/営業年数
    15, // 15 事業内容/当座/買取希望
    14, // 16 事業内容/給料日/給与
    8,  // 17 入金ヘッダー
    8,  // 18 入金行1
    8,  // 19 入金行2
    8,  // 20 入金行3
    28, // 21 税金/他社/備考
  ]

  let cur = T
  const ry: number[] = []
  for (const h of rowHeights) { ry.push(cur); cur += h }
  const tableBottom = cur

  // ── Outer border ──────────────────────────────────────────────────────
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.8)
  doc.rect(L, T, W, tableBottom - T)

  // ── Column x-positions ────────────────────────────────────────────────
  const CD_MAIN  = L + 130  // ※/番号, 会社名, 会社名カナ 右分割
  const CD_REP1  = L + 106  // 代表名 / 携帯電話
  const CD_REP2  = L + 150  // 携帯電話 / 自宅電話
  const CD_POST1 = L + 57   // 郵便番号 / 都道府県
  const CD_POST2 = L + 122  // 都道府県 / 区市町村
  const CD_CAP1  = L + 49   // 資本金 / 月商
  const CD_CAP2  = L + 98   // 月商 / 従業員数
  const CD_CAP3  = L + 147  // 従業員数 / 営業年数
  const CD_BIZ   = L + 56   // 事業内容右端
  const CD_PUR1  = L + 107  // 当座口座 / 買取希望額
  const CD_PUR2  = L + 156  // 買取希望額 / 買取希望日
  const CD_PAY1  = L + 63   // 入金: 会社名 / 住所
  const CD_PAY2  = L + 120  // 入金: 住所 / 入金予定額
  const CD_PAY3  = L + 148  // 入金: 入金予定額 / 取引条件
  const CD_TAX1  = L + 65   // 税金 / 他社利用
  const CD_TAX2  = L + 129  // 他社利用 / 備考

  // ── Typed accessors (avoids TS18048) ─────────────────────────────────
  const Y = (i: number) => ry[i] as number
  const H = (i: number) => rowHeights[i] as number

  // ── Row 0: ※ 評価 | 番号 ─────────────────────────────────────────────
  hLine(L, R, Y(0) + H(0))
  vLine(CD_MAIN, Y(0), Y(0) + H(0))
  lbl('※', L + 1, Y(0) + 5)
  let hnX = L + 6
  if (company.star_rating) {
    doc.setFontSize(8); doc.setTextColor(0, 0, 0)
    doc.text('★'.repeat(company.star_rating), L + 6, Y(0) + 5)
    hnX = L + 6 + company.star_rating * 3.5 + 3
  }
  val(toStr(company.header_note), hnX, Y(0) + 5, CD_MAIN - hnX - 2)
  lbl('番号', CD_MAIN + 1, Y(0) + 3)
  val(toNum(company.id), CD_MAIN + 1, Y(0) + 7)

  // ── Row 1: 会社名 | 会社電話番号 ─────────────────────────────────────
  hLine(L, R, Y(1) + H(1))
  vLine(CD_MAIN, Y(1), Y(1) + H(1))
  lbl('会社名', L + 1, Y(1) + 3)
  val(toStr(company.company_name), L + 1, Y(1) + 10, 124)
  lbl('会社電話番号', CD_MAIN + 1, Y(1) + 3)
  val(toStr(company.company_phone), CD_MAIN + 1, Y(1) + 10)

  // ── Row 2: 会社名カナ | 会社FAX ──────────────────────────────────────
  hLine(L, R, Y(2) + H(2))
  vLine(CD_MAIN, Y(2), Y(2) + H(2))
  lbl('会社名カナ', L + 1, Y(2) + 3)
  val(toStr(company.company_name_kana), L + 1, Y(2) + 10, 124)
  lbl('会社FAX', CD_MAIN + 1, Y(2) + 3)
  val(toStr(company.company_fax), CD_MAIN + 1, Y(2) + 10)

  // ── Row 3: 和暦 年 月 日 性別 ────────────────────────────────────────
  hLine(L, R, Y(3) + H(3))
  {
    const era    = toStr(company.birth_era)
    const byear  = toNum(company.birth_year)
    const bmonth = toNum(company.birth_month)
    const bday   = toNum(company.birth_day)
    const gender = toStr(company.gender)
    let x = L + 1
    lbl('和暦', x, Y(3) + 5); x += 9
    val(era, x, Y(3) + 5); x += Math.max(era.length, 1) * 2.5 + 4
    val(byear, x, Y(3) + 5); x += Math.max(byear.length, 1) * 2.5 + 2
    lbl('年', x, Y(3) + 5); x += 6
    val(bmonth, x, Y(3) + 5); x += Math.max(bmonth.length, 1) * 2.5 + 2
    lbl('月', x, Y(3) + 5); x += 6
    val(bday, x, Y(3) + 5); x += Math.max(bday.length, 1) * 2.5 + 2
    lbl('日', x, Y(3) + 5); x += 10
    lbl('性別', x, Y(3) + 5); x += 9
    doc.setFontSize(9); doc.setTextColor(0, 0, 0)
    doc.setFont('NotoSansJP', 'normal')
    doc.text(gender, x, Y(3) + 5)
  }

  // ── Row 4: 代表名 | 携帯電話 | 自宅電話 ──────────────────────────────
  hLine(L, R, Y(4) + H(4))
  vLine(CD_REP1, Y(4), Y(4) + H(4))
  vLine(CD_REP2, Y(4), Y(4) + H(4))
  lbl('代表名', L + 1, Y(4) + 3)
  val(toStr(company.rep_name), L + 1, Y(4) + 10, 99)
  lbl('携帯電話', CD_REP1 + 1, Y(4) + 3)
  val(toStr(company.mobile_phone), CD_REP1 + 1, Y(4) + 10)
  lbl('自宅電話', CD_REP2 + 1, Y(4) + 3)
  val(toStr(company.home_phone), CD_REP2 + 1, Y(4) + 10)

  // ── Row 5: 代表名カナ | メールアドレス ───────────────────────────────
  hLine(L, R, Y(5) + H(5))
  vLine(CD_REP1, Y(5), Y(5) + H(5))
  lbl('代表名カナ', L + 1, Y(5) + 3)
  val(toStr(company.rep_name_kana), L + 1, Y(5) + 10, 99)
  lbl('メールアドレス', CD_REP1 + 1, Y(5) + 3)
  val(toStr(company.email), CD_REP1 + 1, Y(5) + 10)

  // ── Row 6: 会社住所 未選択 名義 ──────────────────────────────────────
  hLine(L, R, Y(6) + H(6))
  lbl('会社住所', L + 1, Y(6) + 5)
  {
    const addrType = toStr(company.company_address_type) || '未選択'
    doc.setFontSize(9); doc.setTextColor(0, 0, 0)
    doc.text(addrType, L + 18, Y(6) + 5)
  }
  lbl('名義', L + 42, Y(6) + 5)
  val(toStr(company.company_address_owner), L + 52, Y(6) + 5)

  // ── Row 7: 郵便番号 | 都道府県 | 区市町村 (会社) ──────────────────────
  hLine(L, R, Y(7) + H(7))
  vLine(CD_POST1, Y(7), Y(7) + H(7))
  vLine(CD_POST2, Y(7), Y(7) + H(7))
  lbl('郵便番号', L + 1, Y(7) + 3)
  val(toStr(company.company_postal_code), L + 1, Y(7) + 10)
  lbl('都道府県', CD_POST1 + 1, Y(7) + 3)
  val(toStr(company.company_prefecture), CD_POST1 + 1, Y(7) + 10)
  lbl('区市町村', CD_POST2 + 1, Y(7) + 3)
  val(toStr(company.company_city), CD_POST2 + 1, Y(7) + 10)

  // ── Row 8: 番地 (会社) ────────────────────────────────────────────────
  hLine(L, R, Y(8) + H(8))
  lbl('番地', L + 1, Y(8) + 3)
  val(toStr(company.company_street), L + 1, Y(8) + 10, W - 2)

  // ── Row 9: セパレーター ───────────────────────────────────────────────
  hLine(L, R, Y(9) + H(9))

  // ── Row 10: 代表住所 未選択 名義 ─────────────────────────────────────
  hLine(L, R, Y(10) + H(10))
  lbl('代表住所', L + 1, Y(10) + 5)
  {
    const addrType = toStr(company.rep_address_type) || '未選択'
    doc.setFontSize(9); doc.setTextColor(0, 0, 0)
    doc.text(addrType, L + 18, Y(10) + 5)
  }
  lbl('名義', L + 42, Y(10) + 5)
  val(toStr(company.rep_address_owner), L + 52, Y(10) + 5)

  // ── Row 11: 郵便番号 | 都道府県 | 区市町村 (代表) ─────────────────────
  hLine(L, R, Y(11) + H(11))
  vLine(CD_POST1, Y(11), Y(11) + H(11))
  vLine(CD_POST2, Y(11), Y(11) + H(11))
  lbl('郵便番号', L + 1, Y(11) + 3)
  val(toStr(company.rep_postal_code), L + 1, Y(11) + 10)
  lbl('都道府県', CD_POST1 + 1, Y(11) + 3)
  val(toStr(company.rep_prefecture), CD_POST1 + 1, Y(11) + 10)
  lbl('区市町村', CD_POST2 + 1, Y(11) + 3)
  val(toStr(company.rep_city), CD_POST2 + 1, Y(11) + 10)

  // ── Row 12: 番地 (代表) ───────────────────────────────────────────────
  hLine(L, R, Y(12) + H(12))
  lbl('番地', L + 1, Y(12) + 3)
  val(toStr(company.rep_street), L + 1, Y(12) + 10, W - 2)

  // ── Row 13: セパレーター ──────────────────────────────────────────────
  hLine(L, R, Y(13) + H(13))

  // ── Row 14: 資本金 | 月商 | 従業員数 | 営業年数 ──────────────────────
  hLine(L, R, Y(14) + H(14))
  vLine(CD_CAP1, Y(14), Y(14) + H(14))
  vLine(CD_CAP2, Y(14), Y(14) + H(14))
  vLine(CD_CAP3, Y(14), Y(14) + H(14))
  lbl('資本金（万円）', L + 1, Y(14) + 3)
  val(toNum(company.capital), L + 1, Y(14) + 10)
  lbl('月商（万円）', CD_CAP1 + 1, Y(14) + 3)
  val(toNum(company.monthly_revenue), CD_CAP1 + 1, Y(14) + 10)
  lbl('従業員数（人）', CD_CAP2 + 1, Y(14) + 3)
  val(toNum(company.employees), CD_CAP2 + 1, Y(14) + 10)
  lbl('営業年数（年）', CD_CAP3 + 1, Y(14) + 3)
  val(toNum(company.founded_year), CD_CAP3 + 1, Y(14) + 10)

  // ── Rows 15+16: 事業内容(tall) | 当座/買取/給与 ──────────────────────
  // 事業内容 left column spans rows 15+16
  vLine(CD_BIZ, Y(15), Y(16) + H(16))
  // row 15 bottom (right side only)
  hLine(CD_BIZ, R, Y(15) + H(15))
  // row 16 bottom
  hLine(L, R, Y(16) + H(16))
  // right column dividers spanning both rows
  vLine(CD_PUR1, Y(15), Y(16) + H(16))
  vLine(CD_PUR2, Y(15), Y(16) + H(16))

  lbl('事業内容', L + 1, Y(15) + 3)
  val(toStr(company.business_description), L + 1, Y(15) + 10, CD_BIZ - L - 2)

  // Row 15 right side
  lbl('当座口座', CD_BIZ + 1, Y(15) + 3)
  val(toStr(company.current_account) || 'なし', CD_BIZ + 1, Y(15) + 10)
  lbl('買取希望額', CD_PUR1 + 1, Y(15) + 3)
  val(company.purchase_amount != null ? `${company.purchase_amount}万円` : '', CD_PUR1 + 1, Y(15) + 10)
  lbl('買取希望日', CD_PUR2 + 1, Y(15) + 3)
  val(toStr(company.purchase_date), CD_PUR2 + 1, Y(15) + 10)

  // Row 16 right side
  lbl('給料日', CD_PUR1 + 1, Y(16) + 3)
  val(company.payday != null ? `${company.payday}日` : '', CD_PUR1 + 1, Y(16) + 10)
  lbl('給与総支給額', CD_PUR2 + 1, Y(16) + 3)
  val(company.total_salary != null ? `${company.total_salary}万円` : '', CD_PUR2 + 1, Y(16) + 10)

  // ── Rows 17–20: 入金予定テーブル ─────────────────────────────────────
  hLine(L, R, Y(17) + H(17))
  vLine(CD_PAY1, Y(17), Y(20) + H(20))
  vLine(CD_PAY2, Y(17), Y(20) + H(20))
  vLine(CD_PAY3, Y(17), Y(20) + H(20))

  // Header row
  lbl('会社名',    L + 1,        Y(17) + 5)
  lbl('住所',      CD_PAY1 + 1,  Y(17) + 5)
  lbl('入金予定額', CD_PAY2 + 1, Y(17) + 5)
  lbl('取引条件',  CD_PAY3 + 1,  Y(17) + 5)

  // Data rows 18–20
  const payments = parseJson<PaymentScheduleItem[]>(company.payment_schedule)
  ;([18, 19, 20] as const).forEach((ri, i) => {
    hLine(L, R, Y(ri) + H(ri))
    const p = payments[i]
    if (p) {
      val(toStr(p.company),    L + 1,        Y(ri) + 6, 55)
      val(toStr(p.address),    CD_PAY1 + 1,  Y(ri) + 6, 51)
      val(toStr(p.amount),     CD_PAY2 + 1,  Y(ri) + 6, 23)
      const conditions = [toStr(p.condition1), toStr(p.condition2)]
        .filter((s) => s.trim() !== '')
        .join(' / ')
      val(conditions, CD_PAY3 + 1,  Y(ri) + 6, 44)
    }
  })

  // ── Row 21: 税金納付状況 | 他社利用状況 | 備考 ────────────────────────
  vLine(CD_TAX1, Y(21), Y(21) + H(21))
  vLine(CD_TAX2, Y(21), Y(21) + H(21))

  lbl('税金納付状況', L + 1, Y(21) + 3)
  val(toStr(company.tax_payment_status), L + 1, Y(21) + 10)
  if (company.tax_payment_detail) {
    doc.setFontSize(8); doc.setTextColor(0, 0, 0)
    doc.text(toStr(company.tax_payment_detail), L + 1, Y(21) + 16, { maxWidth: 58 })
  }

  lbl('他社利用状況', CD_TAX1 + 1, Y(21) + 3)
  val(toStr(company.other_companies), CD_TAX1 + 1, Y(21) + 10, 58)

  lbl('備考', CD_TAX2 + 1, Y(21) + 3)
  val(toStr(company.notes), CD_TAX2 + 1, Y(21) + 10, 64)

  return doc.output('arraybuffer') as unknown as Uint8Array
}
