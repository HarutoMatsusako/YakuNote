import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 環境変数から直接値を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 型定義
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      summaries: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          original_text: string;
          summary: string;
          url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          original_text: string;
          summary: string;
          url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          original_text?: string;
          summary?: string;
          url?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

// ブラウザ環境でのみ実行されるシングルトンクライアント
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // サーバーサイドでは新しいインスタンスを作成
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });
  }
  
  // クライアントサイドではシングルトンインスタンスを使用
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'X-Client-Info': 'yakunote-app'
        }
      }
    });
  }
  
  return supabaseInstance;
};

// エクスポートするクライアントインスタンス
export const supabase = getSupabaseClient();

// Next.js用のクライアントコンポーネントクライアント
// 必要な場合のみ使用（通常は上記のsupabaseを使用）
export const createBrowserClient = () => {
  return createClientComponentClient<Database>();
};
