'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import Link from 'next/link'
import { deleteCompany } from '@/app/(dashboard)/companies/actions'
import type { Company } from '@/types/database'

interface CompanyTableProps {
  companies: Company[]
}

export default function CompanyTable({ companies }: CompanyTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleDelete(id: number, name: string) {
    if (!confirm(`「${name}」を削除してもよろしいですか？`)) return
    startTransition(async () => {
      const result = await deleteCompany(id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  async function handlePdf(id: number) {
    try {
      const res = await fetch(`/companies/${id}/pdf`)
      if (!res.ok) throw new Error('PDF生成に失敗しました')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `企業詳細_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('PDF生成に失敗しました')
    }
  }

  if (companies.length === 0) {
    return <p className="text-center py-8 text-gray-500">該当する企業が見つかりませんでした</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="table-th w-12">id</th>
            <th className="table-th w-32">作成日時</th>
            <th className="table-th">会社名(カナ)</th>
            <th className="table-th">代表名(カナ)</th>
            <th className="table-th">住所</th>
            <th className="table-th">連絡先(携帯)</th>
            <th className="table-th w-24">月商</th>
            <th className="table-th w-32">ボタン</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const address = [c.company_prefecture, c.company_city, c.company_street]
              .filter(Boolean)
              .join('')
            const createdAt = c.created_at
              ? new Date(c.created_at).toLocaleDateString('ja-JP')
              : '-'
            return (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="table-td text-center">{c.id}</td>
                <td className="table-td whitespace-nowrap">{createdAt}</td>
                <td className="table-td">
                  <div className="font-medium">{c.company_name}</div>
                  {c.company_name_kana && (
                    <div className="text-xs text-gray-500">{c.company_name_kana}</div>
                  )}
                </td>
                <td className="table-td">
                  <div>{c.rep_name ?? '-'}</div>
                  {c.rep_name_kana && (
                    <div className="text-xs text-gray-500">{c.rep_name_kana}</div>
                  )}
                </td>
                <td className="table-td max-w-xs truncate">{address || '-'}</td>
                <td className="table-td whitespace-nowrap">
                  <div>{c.mobile_phone ?? '-'}</div>
                  {c.company_phone && (
                    <div className="text-xs text-gray-500">{c.company_phone}</div>
                  )}
                </td>
                <td className="table-td whitespace-nowrap">
                  {c.monthly_revenue != null ? `${c.monthly_revenue.toLocaleString()}万円` : '-'}
                </td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handlePdf(c.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium"
                      aria-label={`${c.company_name}のPDFをダウンロード`}
                    >
                      PDF
                    </button>
                    <Link
                      href={`/companies/${c.id}/edit`}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id, c.company_name)}
                      disabled={isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium disabled:opacity-50"
                      aria-label={`${c.company_name}を削除`}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
