'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createUser } from '@/app/(dashboard)/users/actions'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Link from 'next/link'

const initialState = { error: null as string | null, success: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary flex items-center gap-2">
      {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
      登録
    </button>
  )
}

export default function NewUserPage() {
  const [state, formAction] = useFormState(createUser, initialState)

  if (state.success) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">ユーザー登録</h2>
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-4">
          ユーザーを登録しました。
        </div>
        <Link href="/users" className="btn-primary inline-block">
          ユーザー一覧へ
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">ユーザー登録</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md">
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="display_name" className="form-label">
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              className="form-input"
              placeholder="表示名"
            />
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="form-input"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="form-input"
              placeholder="8文字以上、英数字含む"
            />
            <p className="text-xs text-gray-500 mt-1">8文字以上、英字と数字を含む必要があります</p>
          </div>

          {state.error && <ErrorMessage message={state.error} />}

          <div className="flex gap-3 pt-2">
            <SubmitButton />
            <Link href="/users" className="btn-secondary">
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
