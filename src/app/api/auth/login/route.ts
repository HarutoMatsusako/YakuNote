import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    console.log('ログインAPIルートが呼び出されました');
    
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
    
    // ログイン処理
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('ログインエラー:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (!data.user) {
      console.error('ログイン成功したが、ユーザー情報がありません');
      return NextResponse.json({ 
        error: 'ユーザー情報の取得に失敗しました' 
      }, { status: 400 });
    }
    
    console.log('ログイン成功:', { user: data.user.id });
    
    // セッションが正常に作成されたか確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('セッション確認エラー:', sessionError);
      return NextResponse.json({ 
        error: 'セッションの検証に失敗しました' 
      }, { status: 400 });
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
    } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
      errorMessage = err.message;
    }
    
    return NextResponse.json({ 
      error: `エラーが発生しました: ${errorMessage}` 
    }, { status: 500 });
  }
}
