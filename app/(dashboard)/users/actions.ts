'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { UserCreateSchema } from '@/lib/validations/user'

export async function listUsers() {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers()
  if (error) {
    console.error('listUsers error:', error)
    throw new Error('ユーザー一覧の取得に失敗しました')
  }
  return data.users
}

export async function createUser(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  // Auth check: only authenticated users can create users
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません', success: false }

  const parsed = UserCreateSchema.safeParse({
    display_name: formData.get('display_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const firstError = parsed.error.flatten().formErrors[0] ??
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      '入力内容を確認してください'
    return { error: firstError, success: false }
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.display_name },
  })

  if (error) {
    console.error('createUser error:', error)
    if (error.message.includes('already registered')) {
      return { error: 'このメールアドレスは既に登録されています', success: false }
    }
    return { error: 'ユーザー登録に失敗しました', success: false }
  }

  // Insert profile
  if (data.user) {
    // profiles insert uses service role key, bypass strict type
    const profileData = {
      id: data.user.id,
      display_name: parsed.data.display_name,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any).from('profiles').insert(profileData)
  }

  revalidatePath('/users')
  return { error: null, success: true }
}

export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '認証されていません' }

  // Prevent self-deletion
  if (userId === user.id) {
    return { error: '自分自身は削除できません' }
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) {
    console.error('deleteUser error:', error)
    return { error: 'ユーザーの削除に失敗しました' }
  }

  revalidatePath('/users')
  return { error: null }
}
