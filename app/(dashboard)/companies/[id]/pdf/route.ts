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

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''%E9%A1%A7%E5%AE%A2%E8%A9%B3%E7%B4%B0_${id}.pdf`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return new NextResponse('PDF generation failed', { status: 500 })
  }
}
