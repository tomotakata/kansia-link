'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { exportCsv } from '@/app/(dashboard)/companies/actions'
import { CompanySearchSchema } from '@/lib/validations/company'

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

export default function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const getParam = useCallback((key: string): string => {
    return searchParams.get(key) ?? ''
  }, [searchParams])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const params = new URLSearchParams()
      fd.forEach((v, k) => {
        if (v) params.set(k, String(v))
      })
      params.set('page', '1')
      router.push(`/companies?${params.toString()}`)
    },
    [router]
  )

  const handleCsvDownload = useCallback(async () => {
    const p = searchParams
    const parsed = CompanySearchSchema.safeParse({
      company_name: p.get('company_name'),
      company_name_kana: p.get('company_name_kana'),
      rep_name: p.get('rep_name'),
      rep_name_kana: p.get('rep_name_kana'),
      mobile_phone: p.get('mobile_phone'),
      prefecture: p.get('prefecture'),
      city: p.get('city'),
      monthly_revenue_min: p.get('monthly_revenue_min') || undefined,
      monthly_revenue_max: p.get('monthly_revenue_max') || undefined,
      star_rating: p.get('star_rating') || 'all',
      show_hidden: p.get('show_hidden') === 'on',
      sort: p.get('sort') || 'newest',
    })
    if (!parsed.success) return

    try {
      const csv = await exportCsv(parsed.data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `企業一覧_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('CSVエクスポートに失敗しました')
    }
  }, [searchParams])

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor="company_name" className="form-label">会社名</label>
          <input id="company_name" name="company_name" defaultValue={getParam('company_name')}
            className="form-input" placeholder="会社名" />
        </div>
        <div>
          <label htmlFor="company_name_kana" className="form-label">会社名（カナ）</label>
          <input id="company_name_kana" name="company_name_kana" defaultValue={getParam('company_name_kana')}
            className="form-input" placeholder="会社名カナ" />
        </div>
        <div>
          <label htmlFor="rep_name" className="form-label">代表名</label>
          <input id="rep_name" name="rep_name" defaultValue={getParam('rep_name')}
            className="form-input" placeholder="代表名" />
        </div>
        <div>
          <label htmlFor="rep_name_kana" className="form-label">代表名（カナ）</label>
          <input id="rep_name_kana" name="rep_name_kana" defaultValue={getParam('rep_name_kana')}
            className="form-input" placeholder="代表名カナ" />
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="mobile_phone" className="form-label">代表携帯（前後あいまい検索）</label>
        <input id="mobile_phone" name="mobile_phone" defaultValue={getParam('mobile_phone')}
          className="form-input" placeholder="代表携帯（前後あいまい検索）" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor="prefecture" className="form-label">都道府県（会社住所）</label>
          <div className="flex gap-2">
            <select id="prefecture" name="prefecture" defaultValue={getParam('prefecture')} className="form-select flex-1">
              <option value="">都道府県</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input id="city" name="city" aria-label="市区町村" defaultValue={getParam('city')}
              className="form-input flex-1" placeholder="市区町村" />
          </div>
        </div>
        <div>
          <label htmlFor="monthly_revenue_min" className="form-label">月商</label>
          <div className="flex items-center gap-2">
            <input id="monthly_revenue_min" name="monthly_revenue_min" type="number" min="0"
              aria-label="月商 範囲始"
              defaultValue={getParam('monthly_revenue_min')}
              className="form-input" placeholder="月商 範囲始" />
            <span className="text-sm text-gray-600 whitespace-nowrap">万円 〜</span>
            <input id="monthly_revenue_max" name="monthly_revenue_max" type="number" min="0"
              aria-label="月商 範囲終"
              defaultValue={getParam('monthly_revenue_max')}
              className="form-input" placeholder="月商 範囲終" />
            <span className="text-sm text-gray-600 whitespace-nowrap">万円</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="form-label">※ 評価</p>
        <div className="flex gap-4">
          {(['all', '1', '2', '3', '4', '5'] as const).map((v) => (
            <label key={v} className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" name="star_rating" value={v}
                defaultChecked={getParam('star_rating') === v || (!getParam('star_rating') && v === 'all')} />
              {v === 'all' ? 'all' : '★'.repeat(parseInt(v))}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="form-label">非表示</p>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="show_hidden"
            defaultChecked={getParam('show_hidden') === 'on'} />
          非表示企業を含める
        </label>
      </div>

      <div className="mb-4">
        <p className="form-label">並び替え</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="radio" name="sort" value="registered"
              defaultChecked={getParam('sort') === 'registered'} />
            登録順
          </label>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="radio" name="sort" value="newest"
              defaultChecked={getParam('sort') !== 'registered'} />
            新着順
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary">検索</button>
        <button
          type="button"
          onClick={handleCsvDownload}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          CSVダウンロード
        </button>
      </div>
    </form>
  )
}
