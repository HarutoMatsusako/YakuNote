import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // リクエストボディを取得
    let body;
    try {
      body = await request.json();
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
    
    if (!data.user) {
      console.error('サインアップ成功したが、ユーザー情報がありません');
      return NextResponse.json({ 
        error: 'ユーザー情報の取得に失敗しました' 
      }, { status: 400 });
    }
    
    // メール確認が必要な場合は、その旨をクライアントに通知
    if (data.user.identities && data.user.identities.length === 0) {
      return NextResponse.json({ 
        message: 'メールアドレスの確認が必要です。メールをご確認ください。',
        data 
      });
    }
    
    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error('APIルートエラー:', err);
    
    // 型ガードを使用してエラーメッセージを安全に取得
    let errorMessage = '不明なエラーが発生しました';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in (err as Record<string, unknown>) && typeof (err as Record<string, unknown>).message === 'string') {
      errorMessage = (err as Record<string, string>).message;
    }
    
    return NextResponse.json({ 
      error: `エラーが発生しました: ${errorMessage}` 
    }, { status: 500 });
  }
}
