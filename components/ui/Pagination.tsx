import Link from 'next/link'

interface PaginationProps {
  page: number
  total: number
  limit: number
  searchParams: Record<string, string>
}

export default function Pagination({ page, total, limit, searchParams }: PaginationProps) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  function buildUrl(p: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(p) })
    return `/companies?${params.toString()}`
  }

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center gap-1 justify-center mt-4" aria-label="ページネーション">
      {page > 1 && (
        <Link href={buildUrl(page - 1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
          前へ
        </Link>
      )}
      {start > 1 && (
        <>
          <Link href={buildUrl(1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">1</Link>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          className={`px-3 py-1 text-sm border rounded ${
            p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'
          }`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
          <Link href={buildUrl(totalPages)} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
            {totalPages}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link href={buildUrl(page + 1)} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
          次へ
        </Link>
      )}
    </div>
  )
}
