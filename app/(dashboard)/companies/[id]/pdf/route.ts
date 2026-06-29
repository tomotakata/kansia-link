import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const id = parseInt(params.id)
  if (isNaN(id)) {
    return new NextResponse('Invalid ID', { status: 400 })
  }

  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !company) {
    return new NextResponse('Company not found', { status: 404 })
  }

  try {
    // Dynamic import to avoid SSR bundle issues
    const { generateCompanyPdf } = await import('@/lib/pdf/generatePdf')
    const pdfBuffer = await generateCompanyPdf(company)
    const buffer = Buffer.from(pdfBuffer as unknown as ArrayBuffer)

    // Use company name as the download filename (sanitized), fallback to id
    const rawName = ((company as { company_name?: string | null }).company_name ?? '').trim().replace(/[\\/:*?"<>|]/g, '_')
    const baseName = rawName.length > 0 ? rawName : `顧客詳細_${id}`
    const encodedName = encodeURIComponent(`${baseName}.pdf`)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="company_${id}.pdf"; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return new NextResponse('PDF generation failed', { status: 500 })
  }
}
