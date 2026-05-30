import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'カンシアリンク | 企業管理システム',
  description: '企業管理CRMシステム',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
