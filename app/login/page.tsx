'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from './actions'

const initialState = { error: null as string | null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'ログイン中...' : 'ログイン'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">カンシアリンク</h1>
        <p className="text-sm text-gray-500 text-center mb-6">企業管理システム</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="form-label">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="example@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              placeholder="パスワード"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
