import { notFound } from 'next/navigation'
import { getCompany } from '@/app/(dashboard)/companies/actions'
import CompanyForm from '@/components/companies/CompanyForm'

interface PageProps {
  params: { id: string }
}

export default async function EditCompanyPage({ params }: PageProps) {
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()

  const company = await getCompany(id)
  if (!company) notFound()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">企業編集</h2>
      <CompanyForm company={company} />
    </div>
  )
}
