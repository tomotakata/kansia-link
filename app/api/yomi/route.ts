import path from 'path'
import { NextResponse } from 'next/server'
import kuromoji from 'kuromoji'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Tokenizer = {
  tokenize: (text: string) => Array<{ reading?: string; surface_form: string }>
}

let tokenizerPromise: Promise<Tokenizer> | null = null

function getTokenizer(): Promise<Tokenizer> {
  if (!tokenizerPromise) {
    const dicPath = path.join(process.cwd(), 'node_modules/kuromoji/dict')
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) reject(err)
        else resolve(tokenizer as unknown as Tokenizer)
      })
    })
  }
  return tokenizerPromise
}

const hiraToKata = (s: string) =>
  s.replace(/[\u3041-\u3096]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))

export async function GET(request: Request) {
  const text = new URL(request.url).searchParams.get('text')?.trim() ?? ''
  if (!text) return NextResponse.json({ kana: '' })

  try {
    const tokenizer = await getTokenizer()
    const kana = tokenizer
      .tokenize(text)
      .map((t) => {
        const r = t.reading && t.reading !== '*' ? t.reading : t.surface_form
        return hiraToKata(r)
      })
      .join('')
    return NextResponse.json({ kana })
  } catch {
    return NextResponse.json({ kana: '' }, { status: 200 })
  }
}
