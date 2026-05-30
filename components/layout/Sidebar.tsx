'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/login/actions'

const navItems = [
  { href: '/companies', label: '企業一覧', icon: '■' },
  { href: '/companies/new', label: '企業新規登録', icon: '✎' },
  { href: '/users/new', label: 'ユーザー登録', icon: '👤' },
  { href: '/users', label: 'ユーザー一覧', icon: '👥' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-48 bg-gray-800 text-white flex flex-col z-40">
      <div className="px-4 py-4 border-b border-gray-700">
        <h1 className="text-base font-bold leading-tight">企業管理システム</h1>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/companies'
              ? pathname === '/companies'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-gray-700 border-l-4 border-blue-400' : ''
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700 py-2">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-gray-700 transition-colors text-left"
          >
            <span className="text-xs">→</span>
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  )
}
