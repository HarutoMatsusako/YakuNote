import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '../types/supabase'

// ブラウザ側のSupabaseクライアント
export const createBrowserClient = () => {
  return createClientComponentClient<Database>()
}

// サーバー側のSupabaseクライアント
export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  })
}

// 直接Supabaseクライアントを作成（環境変数を使用）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
