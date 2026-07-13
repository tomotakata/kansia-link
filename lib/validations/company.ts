import { z } from 'zod'

// Full-width (zenkaku) -> half-width (hankaku) for numbers/symbols/space.
// Desktop IME often leaves phone/postal input in full-width, which would fail
// the half-width regex below. Normalize before validation.
const toHalfWidth = (s: string) =>
  s
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')

const normStr = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' ? toHalfWidth(v).trim() : v), schema)

// Optional enum where an unselected <select> yields '' (empty string).
// Treat '' / null / undefined as null so leaving it blank is always valid.
const optionalEnum = <T extends [string, ...string[]]>(vals: T) =>
  z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.enum(vals).nullable().optional()
  )

const PaymentScheduleSchema = z.object({
  company: z.string().max(200).default(''),
  address: z.string().max(300).default(''),
  amount: z.string().max(50).default(''),
  condition1: z.string().max(100).default(''),
  condition2: z.string().max(100).default(''),
})

export const CompanySchema = z.object({
  is_hidden: z.boolean().default(false),
  registered_at: z.string().nullable().optional(),
  star_rating: z.number().int().min(1).max(5).nullable().optional(),
  company_name: z.string().max(200).optional().default(''),
  company_name_kana: z.string().max(200).nullable().optional(),
  company_phone: normStr(
    z
      .string()
      .max(20)
      .regex(/^[0-9\-+() ]*$/, '電話番号の形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  company_fax: normStr(
    z
      .string()
      .max(20)
      .regex(/^[0-9\-+() ]*$/, 'FAX番号の形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  birth_era: optionalEnum(['西暦', 'S', 'H']),
  birth_year: z.number().int().min(1800).max(2100).nullable().optional(),
  birth_month: z.number().int().min(1).max(12).nullable().optional(),
  birth_day: z.number().int().min(1).max(31).nullable().optional(),
  gender: optionalEnum(['男性', '女性']),
  rep_name: z.string().max(100).nullable().optional(),
  rep_name_kana: z.string().max(100).nullable().optional(),
  mobile_phone: normStr(
    z
      .string()
      .max(20)
      .regex(/^[0-9\-+() ]*$/, '携帯番号の形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  home_phone: normStr(
    z
      .string()
      .max(20)
      .regex(/^[0-9\-+() ]*$/, '電話番号の形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  email: normStr(
    z
      .string()
      .email('メールアドレスの形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  company_address_type: optionalEnum(['賃貸', '所有']),
  company_address_owner: z.string().max(100).nullable().optional(),
  company_postal_code: normStr(
    z
      .string()
      .max(8)
      .regex(/^[0-9\-]*$/, '郵便番号の形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  company_prefecture: z.string().max(10).nullable().optional(),
  company_city: z.string().max(100).nullable().optional(),
  company_street: z.string().max(300).nullable().optional(),
  rep_address_same: z.boolean().default(false),
  rep_address_type: optionalEnum(['賃貸', '所有']),
  rep_address_owner: z.string().max(100).nullable().optional(),
  rep_postal_code: normStr(
    z
      .string()
      .max(8)
      .regex(/^[0-9\-]*$/, '郵便番号の形式が正しくありません')
      .nullable()
      .optional()
      .or(z.literal(''))
  ),
  rep_prefecture: z.string().max(10).nullable().optional(),
  rep_city: z.string().max(100).nullable().optional(),
  rep_street: z.string().max(300).nullable().optional(),
  capital: z.number().nonnegative('0以上の値を入力してください').nullable().optional(),
  monthly_revenue: z.number().nonnegative('0以上の値を入力してください').nullable().optional(),
  employees: z.number().int().nonnegative().nullable().optional(),
  founded_year: z.number().int().min(1800).max(2100).nullable().optional(),
  purchase_amount: z.number().nonnegative().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  payday: z.number().int().min(1).max(31).nullable().optional(),
  total_salary: z.number().nonnegative().nullable().optional(),
  business_description: z.string().max(2000).nullable().optional(),
  current_account: z.enum(['なし', 'あり']).default('なし'),
  payment_schedule: z.array(PaymentScheduleSchema).max(3).default([]),
  tax_payment_status: optionalEnum(['未納', '完納']),
  tax_payment_detail: z.string().max(1000).nullable().optional(),
  other_companies: z.string().max(1000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
}).refine(
  (data) => Boolean((data.company_name ?? '').trim() || (data.rep_name ?? '').trim()),
  { message: '会社名または代表者名のいずれかを入力してください', path: ['company_name'] }
)

export type CompanyFormData = z.infer<typeof CompanySchema>

export const CompanySearchSchema = z.object({
  company_name: z.string().optional(),
  company_name_kana: z.string().optional(),
  rep_name: z.string().optional(),
  rep_name_kana: z.string().optional(),
  mobile_phone: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  monthly_revenue_min: z.coerce.number().nonnegative().optional(),
  monthly_revenue_max: z.coerce.number().nonnegative().optional(),
  star_rating: z.enum(['all', '1', '2', '3', '4', '5']).default('all'),
  show_hidden: z.coerce.boolean().default(false),
  sort: z.enum(['registered', 'newest']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type CompanySearchParams = z.infer<typeof CompanySearchSchema>
