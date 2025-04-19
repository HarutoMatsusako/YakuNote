import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    console.log('サインアップAPIルートが呼び出されました');
    
    // リクエストボディを取得
    let body;
    try {
      body = await request.json();
      console.log('受信したリクエストボディ:', body);
    } catch (e) {
      console.error('JSONパースエラー:', e);
      return NextResponse.json({ 
        error: 'リクエストボディの解析に失敗しました' 
      }, { status: 400 });
    }
    
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'メールアドレスとパスワードは必須です' 
      }, { status: 400 });
    }
    
    // Supabase認証クライアントの作成
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    console.log('Supabase認証処理を開始:', { email });
    
    // サインアップ処理
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/api/auth/callback`,
      },
    });
    
    if (error) {
      console.error('サインアップエラー:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log('サインアップ成功:', data);
    
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('APIルートエラー:', err);
    return NextResponse.json({ 
      error: `エラーが発生しました: ${err.message}` 
    }, { status: 500 });
  }
}
