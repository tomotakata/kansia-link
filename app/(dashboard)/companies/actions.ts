'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CompanySchema } from '@/lib/validations/company'
import type { CompanySearchParams } from '@/lib/validations/company'
import type { Company } from '@/types/database'

// ============================================================
// Search & List
// ============================================================
export async function searchCompanies(params: CompanySearchParams) {
  const supabase = await createClient()

  let query = supabase.from('companies').select('*', { count: 'exact' })

  if (params.company_name) {
    query = query.ilike('company_name', `%${params.company_name}%`)
  }
  if (params.company_name_kana) {
    query = query.ilike('company_name_kana', `%${params.company_name_kana}%`)
  }
  if (params.rep_name) {
    query = query.ilike('rep_name', `%${params.rep_name}%`)
  }
  if (params.rep_name_kana) {
    query = query.ilike('rep_name_kana', `%${params.rep_name_kana}%`)
  }
  if (params.mobile_phone) {
    query = query.ilike('mobile_phone', `%${params.mobile_phone}%`)
  }
  if (params.prefecture) {
    query = query.eq('company_prefecture', params.prefecture)
  }
  if (params.city) {
    query = query.ilike('company_city', `%${params.city}%`)
  }
  if (params.monthly_revenue_min != null) {
    query = query.gte('monthly_revenue', params.monthly_revenue_min)
  }
  if (params.monthly_revenue_max != null) {
    query = query.lte('monthly_revenue', params.monthly_revenue_max)
  }
  if (params.star_rating !== 'all') {
    query = query.eq('star_rating', parseInt(params.star_rating))
  }
  if (!params.show_hidden) {
    query = query.eq('is_hidden', false)
  }

  // Sort
  if (params.sort === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('id', { ascending: true })
  }

  // Pagination
  const limit = params.limit
  const offset = (params.page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('searchCompanies error:', error)
    throw new Error('企業データの取得に失敗しました')
  }

  return { data: data ?? [], total: count ?? 0 }
}

// ============================================================
// Get single company
// ============================================================
export async function getCompany(id: number): Promise<Company | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getCompany error:', error)
    return null
  }
  return data
}

// ============================================================
// Create company
// ============================================================
export async function createCompany(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const raw = Object.fromEntries(formData.entries())

  // Parse nested JSON fields
  let family_members = []
  let payment_schedule = []
  try {
    const fm = formData.get('family_members')
    if (fm) family_members = JSON.parse(String(fm))
  } catch { /* ignore */ }
  try {
    const ps = formData.get('payment_schedule')
    if (ps) payment_schedule = JSON.parse(String(ps))
  } catch { /* ignore */ }

  const parsed = CompanySchema.safeParse({
    ...raw,
    is_hidden: raw['is_hidden'] === 'true' || raw['is_hidden'] === 'on',
    star_rating: raw['star_rating'] ? parseInt(String(raw['star_rating'])) : null,
    birth_year: raw['birth_year'] ? parseInt(String(raw['birth_year'])) : null,
    birth_month: raw['birth_month'] ? parseInt(String(raw['birth_month'])) : null,
    birth_day: raw['birth_day'] ? parseInt(String(raw['birth_day'])) : null,
    capital: raw['capital'] ? parseFloat(String(raw['capital'])) : null,
    monthly_revenue: raw['monthly_revenue'] ? parseFloat(String(raw['monthly_revenue'])) : null,
    employees: raw['employees'] ? parseInt(String(raw['employees'])) : null,
    founded_year: raw['founded_year'] ? parseInt(String(raw['founded_year'])) : null,
    purchase_amount: raw['purchase_amount'] ? parseFloat(String(raw['purchase_amount'])) : null,
    payday: raw['payday'] ? parseInt(String(raw['payday'])) : null,
    total_salary: raw['total_salary'] ? parseFloat(String(raw['total_salary'])) : null,
    rep_address_same: raw['rep_address_same'] === 'true' || raw['rep_address_same'] === 'on',
    family_members,
    payment_schedule,
  })

  if (!parsed.success) {
    const firstError = parsed.error.flatten().formErrors[0] ?? 
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      '入力内容を確認してください'
    return { error: firstError, success: false }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('companies')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(parsed.data as unknown as any)

  if (error) {
    console.error('createCompany error:', error)
    return { error: '登録に失敗しました', success: false }
  }

  revalidatePath('/companies')
  redirect('/companies')
}

// ============================================================
// Update company
// ============================================================
export async function updateCompany(
  id: number,
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const raw = Object.fromEntries(formData.entries())

  let family_members = []
  let payment_schedule = []
  try {
    const fm = formData.get('family_members')
    if (fm) family_members = JSON.parse(String(fm))
  } catch { /* ignore */ }
  try {
    const ps = formData.get('payment_schedule')
    if (ps) payment_schedule = JSON.parse(String(ps))
  } catch { /* ignore */ }

  const parsed = CompanySchema.safeParse({
    ...raw,
    is_hidden: raw['is_hidden'] === 'true' || raw['is_hidden'] === 'on',
    star_rating: raw['star_rating'] ? parseInt(String(raw['star_rating'])) : null,
    birth_year: raw['birth_year'] ? parseInt(String(raw['birth_year'])) : null,
    birth_month: raw['birth_month'] ? parseInt(String(raw['birth_month'])) : null,
    birth_day: raw['birth_day'] ? parseInt(String(raw['birth_day'])) : null,
    capital: raw['capital'] ? parseFloat(String(raw['capital'])) : null,
    monthly_revenue: raw['monthly_revenue'] ? parseFloat(String(raw['monthly_revenue'])) : null,
    employees: raw['employees'] ? parseInt(String(raw['employees'])) : null,
    founded_year: raw['founded_year'] ? parseInt(String(raw['founded_year'])) : null,
    purchase_amount: raw['purchase_amount'] ? parseFloat(String(raw['purchase_amount'])) : null,
    payday: raw['payday'] ? parseInt(String(raw['payday'])) : null,
    total_salary: raw['total_salary'] ? parseFloat(String(raw['total_salary'])) : null,
    rep_address_same: raw['rep_address_same'] === 'true' || raw['rep_address_same'] === 'on',
    family_members,
    payment_schedule,
  })

  if (!parsed.success) {
    const firstError = parsed.error.flatten().formErrors[0] ?? 
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      '入力内容を確認してください'
    return { error: firstError, success: false }
  }

  const supabase = await createClient()
  // Cast to bypass strict Supabase generic update type constraint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db.from('companies').update(parsed.data).eq('id', id)

  if (error) {
    console.error('updateCompany error:', error)
    return { error: '更新に失敗しました', success: false }
  }

  revalidatePath('/companies')
  revalidatePath(`/companies/${id}/edit`)
  redirect('/companies')
}

// ============================================================
// Delete company
// ============================================================
export async function deleteCompany(id: number): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)

  if (error) {
    console.error('deleteCompany error:', error)
    return { error: '削除に失敗しました' }
  }

  revalidatePath('/companies')
  return { error: null }
}

// ============================================================
// CSV Export (cursor-based, handles 12,000+ records)
// ============================================================
export async function exportCsv(params: CompanySearchParams): Promise<string> {
  const supabase = await createAdminClient()
  const BOM = '\uFEFF'
  const headers = [
    'ID', '作成日時', '会社名', '会社名カナ', '代表者名', '代表者名カナ',
    '住所', '連絡先（携帯）', '月商（万円）', '評価', '非表示',
  ]
  const rows: string[] = [BOM + headers.join(',')]

  function esc(v: string | number | null | undefined): string {
    if (v == null) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  function toRow(c: Company): string {
    const addr = [c.company_prefecture, c.company_city, c.company_street].filter(Boolean).join('')
    return [
      c.id, c.created_at ? new Date(c.created_at).toLocaleString('ja-JP') : '',
      c.company_name, c.company_name_kana, c.rep_name, c.rep_name_kana,
      addr, c.mobile_phone, c.monthly_revenue,
      c.star_rating ? '★'.repeat(c.star_rating) : '', c.is_hidden ? '非表示' : '',
    ].map(esc).join(',')
  }

  let lastId = 0
  const batchSize = 1000

  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from('companies').select('*').gt('id', lastId).order('id').limit(batchSize)

    if (params.company_name) query = query.ilike('company_name', `%${params.company_name}%`)
    if (params.company_name_kana) query = query.ilike('company_name_kana', `%${params.company_name_kana}%`)
    if (params.rep_name) query = query.ilike('rep_name', `%${params.rep_name}%`)
    if (params.mobile_phone) query = query.ilike('mobile_phone', `%${params.mobile_phone}%`)
    if (params.prefecture) query = query.eq('company_prefecture', params.prefecture)
    if (params.monthly_revenue_min != null) query = query.gte('monthly_revenue', params.monthly_revenue_min)
    if (params.monthly_revenue_max != null) query = query.lte('monthly_revenue', params.monthly_revenue_max)
    if (params.star_rating !== 'all') query = query.eq('star_rating', parseInt(params.star_rating))
    if (!params.show_hidden) query = query.eq('is_hidden', false)

    const { data, error } = await query
    if (error) throw new Error('CSVエクスポートに失敗しました')
    if (!data || data.length === 0) break

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((c: any) => rows.push(toRow(c as Company)))
    const last = data[data.length - 1] as Company | undefined
    if (!last) break
    lastId = last.id as number
    if (data.length < batchSize) break
  }

  return rows.join('\n')
}
