import { z } from 'zod'

export const UserCreateSchema = z.object({
  display_name: z.string().min(1, '名前は必須です').max(100),
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上必要です')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9])/,
      'パスワードは英字と数字を含む必要があります'
    ),
})

export type UserCreateFormData = z.infer<typeof UserCreateSchema>

export const LoginSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

export type LoginFormData = z.infer<typeof LoginSchema>
