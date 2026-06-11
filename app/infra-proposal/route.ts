import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-static'

export async function GET(): Promise<Response> {
  const filePath = join(process.cwd(), 'public', 'infra-proposal.html')
  const html = readFileSync(filePath, 'utf-8')
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
