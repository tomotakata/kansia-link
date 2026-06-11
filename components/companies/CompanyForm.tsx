'use client'

import { useCallback, useEffect } from 'react'
import { useFormState } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CompanySchema, type CompanyFormData } from '@/lib/validations/company'
import { createCompany, updateCompany } from '@/app/(dashboard)/companies/actions'
import ErrorMessage from '@/components/ui/ErrorMessage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Company, PaymentScheduleItem, Json } from '@/types/database'

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

function parsePayment(val: Json): PaymentScheduleItem[] {
  if (Array.isArray(val)) return val as unknown as PaymentScheduleItem[]
  return [
    { company: '', address: '', amount: '', condition1: '', condition2: '' },
    { company: '', address: '', amount: '', condition1: '', condition2: '' },
    { company: '', address: '', amount: '', condition1: '', condition2: '' },
  ]
}

interface CompanyFormProps {
  company?: Company
}

export default function CompanyForm({ company }: CompanyFormProps) {
  const isEdit = !!company

  const defaultValues: CompanyFormData = {
    is_hidden: company?.is_hidden ?? false,
    registered_at: company?.registered_at ?? new Date().toISOString().slice(0, 10),
    star_rating: company?.star_rating ?? null,
    company_name: company?.company_name ?? '',
    company_name_kana: company?.company_name_kana ?? '',
    company_phone: company?.company_phone ?? '',
    company_fax: company?.company_fax ?? '',
    birth_era: (company?.birth_era as 'S' | 'H' | '西暦') ?? '西暦',
    birth_year: company?.birth_year ?? null,
    birth_month: company?.birth_month ?? null,
    birth_day: company?.birth_day ?? null,
    gender: (company?.gender as '男性' | '女性') ?? '男性',
    rep_name: company?.rep_name ?? '',
    rep_name_kana: company?.rep_name_kana ?? '',
    mobile_phone: company?.mobile_phone ?? '',
    home_phone: company?.home_phone ?? '',
    email: company?.email ?? '',
    company_address_type: (company?.company_address_type as '賃貸' | '所有') ?? null,
    company_address_owner: company?.company_address_owner ?? '',
    company_postal_code: company?.company_postal_code ?? '',
    company_prefecture: company?.company_prefecture ?? '',
    company_city: company?.company_city ?? '',
    company_street: company?.company_street ?? '',
    rep_address_same: company?.rep_address_same ?? false,
    rep_address_type: (company?.rep_address_type as '賃貸' | '所有') ?? null,
    rep_address_owner: company?.rep_address_owner ?? '',
    rep_postal_code: company?.rep_postal_code ?? '',
    rep_prefecture: company?.rep_prefecture ?? '',
    rep_city: company?.rep_city ?? '',
    rep_street: company?.rep_street ?? '',
    capital: company?.capital ?? null,
    monthly_revenue: company?.monthly_revenue ?? null,
    employees: company?.employees ?? null,
    founded_year: company?.founded_year ?? null,
    purchase_amount: company?.purchase_amount ?? null,
    purchase_date: company?.purchase_date ?? '',
    payday: company?.payday ?? null,
    total_salary: company?.total_salary ?? null,
    business_description: company?.business_description ?? '',
    current_account: (company?.current_account as 'なし' | 'あり') ?? 'なし',
    payment_schedule: parsePayment(company?.payment_schedule ?? []),
    tax_payment_status: (company?.tax_payment_status as '未納' | '完納') ?? null,
    tax_payment_detail: company?.tax_payment_detail ?? '',
    other_companies: company?.other_companies ?? '',
    notes: company?.notes ?? '',
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CompanySchema) as any,
    defaultValues,
  })

  const repAddressSame = watch('rep_address_same')
  const companyPrefecture = watch('company_prefecture')
  const companyCity = watch('company_city')
  const companyStreet = watch('company_street')
  const companyPostalCode = watch('company_postal_code')
  const companyAddressOwner = watch('company_address_owner')
  const companyAddressType = watch('company_address_type')

  useEffect(() => {
    if (repAddressSame) {
      setValue('rep_prefecture', companyPrefecture ?? '')
      setValue('rep_city', companyCity ?? '')
      setValue('rep_street', companyStreet ?? '')
      setValue('rep_postal_code', companyPostalCode ?? '')
      setValue('rep_address_owner', companyAddressOwner ?? '')
      setValue('rep_address_type', companyAddressType ?? null)
    }
  }, [repAddressSame, companyPrefecture, companyCity, companyStreet, companyPostalCode, companyAddressOwner, companyAddressType, setValue])

  // Build the bound action for useFormState
  const boundAction = useCallback(
    (state: { error: string | null; success: boolean }, fd: FormData) => {
      if (isEdit && company) {
        return updateCompany(company.id, state, fd)
      }
      return createCompany(state, fd)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEdit, company?.id]
  )

  const [serverState, formAction] = useFormState(boundAction, { error: null, success: false })

  async function onSubmit(data: CompanyFormData): Promise<void> {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v == null) return
      if (k === 'payment_schedule') {
        fd.append(k, JSON.stringify(v))
      } else {
        fd.append(k, String(v))
      }
    })
    await formAction(fd)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" {...register('is_hidden')} className="h-4 w-4" />
          <span className="font-medium">非表示</span>
        </label>
        <div className="flex items-center gap-3">
          <label htmlFor="registered_at" className="text-sm font-medium text-gray-700">登録日</label>
          <input
            id="registered_at"
            type="date"
            {...register('registered_at')}
            className="form-input w-44"
          />
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            {isSubmitting && <LoadingSpinner size="sm" />}
            登録
          </button>
        </div>
      </div>

      {serverState.error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">
          {serverState.error}
        </div>
      )}

      {/* ★ Rating */}
      <div className="section-card">
        <p className="section-title">※ 評価</p>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex items-center gap-1 text-sm cursor-pointer">
              <Controller
                name="star_rating"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value === n}
                    onChange={() => field.onChange(field.value === n ? null : n)}
                  />
                )}
              />
              {n}
            </label>
          ))}
        </div>
        <ErrorMessage message={errors.star_rating?.message} />
      </div>

      {/* Company Info */}
      <div className="section-card">
        <p className="section-title">会社情報</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="company_name" className="form-label">会社名 <span className="text-red-500">*</span></label>
            <input id="company_name" {...register('company_name')} className="form-input" placeholder="会社名" />
            <ErrorMessage message={errors.company_name?.message} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="company_name_kana" className="form-label">会社名カナ</label>
            <input id="company_name_kana" {...register('company_name_kana')} className="form-input" placeholder="会社名カナ" />
            <ErrorMessage message={errors.company_name_kana?.message} />
          </div>
          <div>
            <label htmlFor="company_phone" className="form-label">会社電話番号</label>
            <input id="company_phone" {...register('company_phone')} className="form-input" placeholder="会社電話番号" />
            <ErrorMessage message={errors.company_phone?.message} />
          </div>
          <div>
            <label htmlFor="company_fax" className="form-label">FAX</label>
            <input id="company_fax" {...register('company_fax')} className="form-input" placeholder="会社FAX" />
            <ErrorMessage message={errors.company_fax?.message} />
          </div>
        </div>
      </div>

      {/* Representative Info */}
      <div className="section-card">
        <p className="section-title">代表者情報</p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            {(['西暦', 'S', 'H'] as const).map((era) => (
              <label key={era} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" value={era} {...register('birth_era')} />
                {era}
              </label>
            ))}
          </div>
          <Controller
            name="birth_year"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="form-input w-20"
                  placeholder="年号"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                />
                <span className="text-sm">年</span>
              </div>
            )}
          />
          <Controller
            name="birth_month"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-1">
                <select className="form-select w-20" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">--</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-sm">月</span>
              </div>
            )}
          />
          <Controller
            name="birth_day"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-1">
                <select className="form-select w-20" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">--</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="text-sm">日</span>
              </div>
            )}
          />
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm font-medium">性別</span>
            {(['男性', '女性'] as const).map((g) => (
              <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" value={g} {...register('gender')} />
                {g}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rep_name" className="form-label">代表者名</label>
            <input id="rep_name" {...register('rep_name')} className="form-input" placeholder="代表者名" />
          </div>
          <div>
            <label htmlFor="mobile_phone" className="form-label">携帯番号</label>
            <input id="mobile_phone" {...register('mobile_phone')} className="form-input" placeholder="携帯番号" />
            <ErrorMessage message={errors.mobile_phone?.message} />
          </div>
          <div>
            <label htmlFor="home_phone" className="form-label">自宅電話番号</label>
            <input id="home_phone" {...register('home_phone')} className="form-input" placeholder="自宅電話番号" />
            <ErrorMessage message={errors.home_phone?.message} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="rep_name_kana" className="form-label">代表者名カナ</label>
            <input id="rep_name_kana" {...register('rep_name_kana')} className="form-input" placeholder="代表者名カナ" />
          </div>
          <div>
            <label htmlFor="email" className="form-label">メールアドレス</label>
            <input id="email" type="email" {...register('email')} className="form-input" placeholder="メールアドレス" />
            <ErrorMessage message={errors.email?.message} />
          </div>
        </div>
      </div>

      {/* Company Address */}
      <div className="section-card">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <p className="section-title mb-0">会社住所</p>
          <div className="flex items-center gap-3">
            {(['賃貸', '所有'] as const).map((t) => (
              <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" value={t} {...register('company_address_type')} />
                {t}
              </label>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-sm">名義</span>
              <input {...register('company_address_owner')} className="form-input w-40" placeholder="名義" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="company_postal_code" className="form-label">郵便番号</label>
            <input id="company_postal_code" {...register('company_postal_code')} className="form-input" placeholder="郵便番号" />
            <ErrorMessage message={errors.company_postal_code?.message} />
          </div>
          <div>
            <label htmlFor="company_prefecture" className="form-label">都道府県</label>
            <select id="company_prefecture" {...register('company_prefecture')} className="form-select">
              <option value="">-- 選択してください --</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="company_city" className="form-label">市町村</label>
            <input id="company_city" {...register('company_city')} className="form-input" placeholder="市町村" />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="company_street" className="form-label">番地</label>
          <textarea id="company_street" {...register('company_street')} className="form-input h-16 resize-none" placeholder="住所" />
        </div>
      </div>

      {/* Representative Address */}
      <div className="section-card">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <p className="section-title mb-0">代表住所</p>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" {...register('rep_address_same')} />
            同上
          </label>
          {!repAddressSame && (
            <>
              {(['賃貸', '所有'] as const).map((t) => (
                <label key={t} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" value={t} {...register('rep_address_type')} />
                  {t}
                </label>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-sm">名義</span>
                <input {...register('rep_address_owner')} className="form-input w-40" placeholder="名義" />
              </div>
            </>
          )}
        </div>
        {!repAddressSame && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="rep_postal_code" className="form-label">郵便番号</label>
                <input id="rep_postal_code" {...register('rep_postal_code')} className="form-input" placeholder="郵便番号" />
                <ErrorMessage message={errors.rep_postal_code?.message} />
              </div>
              <div>
                <label htmlFor="rep_prefecture" className="form-label">都道府県</label>
                <select id="rep_prefecture" {...register('rep_prefecture')} className="form-select">
                  <option value="">-- 選択してください --</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rep_city" className="form-label">市町村</label>
                <input id="rep_city" {...register('rep_city')} className="form-input" placeholder="市町村" />
              </div>
            </div>
            <div className="mt-3">
              <label htmlFor="rep_street" className="form-label">番地</label>
              <textarea id="rep_street" {...register('rep_street')} className="form-input h-16 resize-none" placeholder="住所" />
            </div>
          </>
        )}
      </div>

      {/* Business Metrics */}
      <div className="section-card">
        <p className="section-title">事業情報</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="capital" className="form-label">資本金（万円）</label>
            <div className="flex items-center gap-1">
              <Controller name="capital" control={control} render={({ field }) => (
                <input id="capital" type="number" min="0" className="form-input"
                  placeholder="資本金" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
              )} />
              <span className="text-sm whitespace-nowrap">万円</span>
            </div>
          </div>
          <div>
            <label htmlFor="monthly_revenue" className="form-label">月商（万円）</label>
            <div className="flex items-center gap-1">
              <Controller name="monthly_revenue" control={control} render={({ field }) => (
                <input id="monthly_revenue" type="number" min="0" className="form-input"
                  placeholder="月商" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
              )} />
              <span className="text-sm whitespace-nowrap">万円</span>
            </div>
          </div>
          <div>
            <label htmlFor="employees" className="form-label">従業員数（人）</label>
            <div className="flex items-center gap-1">
              <Controller name="employees" control={control} render={({ field }) => (
                <input id="employees" type="number" min="0" className="form-input"
                  placeholder="従業員数" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
              )} />
              <span className="text-sm">人</span>
            </div>
          </div>
          <div>
            <label htmlFor="founded_year" className="form-label">設立年月（年）</label>
            <div className="flex items-center gap-1">
              <Controller name="founded_year" control={control} render={({ field }) => (
                <input id="founded_year" type="number" min="1800" max="2100" className="form-input"
                  placeholder="設立年月" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
              )} />
              <span className="text-sm">年</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="purchase_amount" className="form-label">買取希望額（万円）</label>
            <div className="flex items-center gap-1">
              <Controller name="purchase_amount" control={control} render={({ field }) => (
                <input id="purchase_amount" type="number" min="0" className="form-input"
                  placeholder="買取希望額" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
              )} />
              <span className="text-sm whitespace-nowrap">万円</span>
            </div>
          </div>
          <div>
            <label htmlFor="purchase_date" className="form-label">買取希望日</label>
            <input id="purchase_date" type="date" {...register('purchase_date')} className="form-input" />
          </div>
          <div>
            <label htmlFor="payday" className="form-label">給料日</label>
            <div className="flex items-center gap-1">
              <Controller name="payday" control={control} render={({ field }) => (
                <input id="payday" type="number" min="1" max="31" className="form-input"
                  placeholder="給料日" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
              )} />
              <span className="text-sm">日</span>
            </div>
          </div>
          <div>
            <label htmlFor="total_salary" className="form-label">給与総支給額（万円）</label>
            <div className="flex items-center gap-1">
              <Controller name="total_salary" control={control} render={({ field }) => (
                <input id="total_salary" type="number" min="0" className="form-input"
                  placeholder="給与総支給額" value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
              )} />
              <span className="text-sm whitespace-nowrap">万円</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="business_description" className="form-label">事業内容</label>
            <textarea id="business_description" {...register('business_description')} className="form-input h-24 resize-none" placeholder="事業内容" />
          </div>
          <div>
            <p className="form-label">当座口座</p>
            <div className="flex gap-4">
              {(['なし', 'あり'] as const).map((v) => (
                <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" value={v} {...register('current_account')} />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="section-card">
        <p className="section-title">入金予定</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="table-th">会社名</th>
              <th className="table-th">住所</th>
              <th className="table-th">入金予定額</th>
              <th className="table-th">条件1</th>
              <th className="table-th">条件2</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map((i) => (
              <tr key={i}>
                <td className="p-1">
                  <input {...register(`payment_schedule.${i}.company`)} className="form-input" placeholder="会社名" />
                </td>
                <td className="p-1">
                  <input {...register(`payment_schedule.${i}.address`)} className="form-input" placeholder="入金会社住所" />
                </td>
                <td className="p-1">
                  <input {...register(`payment_schedule.${i}.amount`)} className="form-input" placeholder="入金予定額" />
                </td>
                <td className="p-1">
                  <input {...register(`payment_schedule.${i}.condition1`)} className="form-input" placeholder="条件1" />
                </td>
                <td className="p-1">
                  <input {...register(`payment_schedule.${i}.condition2`)} className="form-input" placeholder="条件2" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax & Others */}
      <div className="section-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="form-label">税金納付状況</p>
            <div className="flex gap-3 mb-2">
              {(['未納', '完納'] as const).map((v) => (
                <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" value={v} {...register('tax_payment_status')} />
                  {v}
                </label>
              ))}
            </div>
            <textarea {...register('tax_payment_detail')} className="form-input h-24 resize-none" placeholder="未納金額や理由など" />
          </div>
          <div>
            <label htmlFor="other_companies" className="form-label">他社利用状況</label>
            <textarea id="other_companies" {...register('other_companies')} className="form-input h-24 resize-none" placeholder="他社利用状況" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="section-card">
        <label htmlFor="notes" className="form-label">備考</label>
        <textarea id="notes" {...register('notes')} className="form-input h-32 resize-none" placeholder="備考" />
      </div>

      {/* Submit */}
      <div className="flex justify-end mb-6">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
          {isSubmitting && <LoadingSpinner size="sm" />}
          {isEdit ? '更新' : '登録'}
        </button>
      </div>
    </form>
  )
}
