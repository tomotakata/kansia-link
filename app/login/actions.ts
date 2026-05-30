'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginSchema } from '@/lib/validations/user'

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.flatten().formErrors[0] ??
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      '入力内容を確認してください'
    return { error: firstError }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Generic message to avoid user enumeration
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  redirect('/companies')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
