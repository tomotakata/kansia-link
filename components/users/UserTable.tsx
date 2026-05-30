'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { deleteUser } from '@/app/(dashboard)/users/actions'

interface User {
  id: string
  email?: string
  user_metadata?: { display_name?: string }
  created_at?: string
}

interface UserTableProps {
  users: User[]
}

export default function UserTable({ users }: UserTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`「${email}」を削除してもよろしいですか？`)) return
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  if (users.length === 0) {
    return <p className="text-center py-8 text-gray-500">ユーザーが登録されていません</p>
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">一覧表示</h3>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center border-b border-gray-200 py-3 gap-4">
            <span className="w-8 text-sm text-gray-500 font-mono">
              {u.id.slice(0, 4)}...
            </span>
            <span className="flex-1 text-sm font-medium">
              {u.user_metadata?.display_name ?? u.email ?? '-'}
            </span>
            <span className="flex-1 text-sm text-gray-600">{u.email}</span>
            <button
              onClick={() => handleDelete(u.id, u.email ?? u.id)}
              disabled={isPending}
              className="btn-danger disabled:opacity-50"
              aria-label={`${u.email}を削除`}
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
