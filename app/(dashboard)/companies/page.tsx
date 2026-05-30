import { Suspense } from 'react'
import { searchCompanies } from './actions'
import { CompanySearchSchema } from '@/lib/validations/company'
import SearchForm from '@/components/companies/SearchForm'
import CompanyTable from '@/components/companies/CompanyTable'
import Pagination from '@/components/ui/Pagination'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const raw = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  )

  const parsed = CompanySearchSchema.safeParse(raw)
  const params = parsed.success ? parsed.data : CompanySearchSchema.parse({})

  const { data: companies, total } = await searchCompanies(params)

  const currentParams = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">企業一覧</h2>

      <Suspense fallback={<LoadingSpinner />}>
        <SearchForm />
      </Suspense>

      <p className="text-sm text-gray-600 mb-2">{total.toLocaleString()}件が該当しました。</p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <CompanyTable companies={companies} />
      </div>

      <Pagination
        page={params.page}
        total={total}
        limit={params.limit}
        searchParams={currentParams}
      />
    </div>
  )
}
