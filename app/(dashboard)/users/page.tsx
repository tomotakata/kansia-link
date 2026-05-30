import { listUsers } from './actions'
import UserTable from '@/components/users/UserTable'

export default async function UsersPage() {
  let users: Awaited<ReturnType<typeof listUsers>> = []
  let fetchError: string | null = null

  try {
    users = await listUsers()
  } catch {
    fetchError = 'ユーザー一覧の取得に失敗しました'
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">ユーザー一覧</h2>

      {fetchError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">
          {fetchError}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <UserTable users={users} />
      </div>
    </div>
  )
}
