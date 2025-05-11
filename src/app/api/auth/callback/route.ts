import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '../../../../lib/supabase';

// CORS対応のためのヘッダー設定
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('コールバック処理を開始');
    console.log('リクエストURL:', request.url);
    
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    
    console.log('パラメータ:', { code, error, errorDescription });
    
    if (error) {
      console.error('認証エラー:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/login?error=${error}&error_description=${errorDescription || ''}`, request.url)
      );
    }

    if (!code) {
      // codeがない場合でも、access_tokenがある可能性を確認
      console.log('コードがありません。URLをチェック中...');
      
      // ハッシュフラグメントはサーバーサイドでは取得できないため、
      // クライアントサイドでの処理が必要
      // 一旦保存一覧ページにリダイレクトし、そこでセッションを確認する
      return NextResponse.redirect(new URL('/saved', request.url));
    }

    // App Routerではcookiesは使用可能
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('セッション交換エラー:', sessionError);
      return NextResponse.redirect(
        new URL(`/login?error=auth_callback_error&error_description=${sessionError.message}`, request.url)
      );
    }
    
    console.log('セッション交換成功');
    
    // セッションが正常に作成されたか確認
    const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
    
    if (getSessionError || !session) {
      console.error('セッション確認エラー:', getSessionError);
      return NextResponse.redirect(
        new URL(`/login?error=session_verification_error`, request.url)
      );
    }
    
    // ユーザー情報を確認
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (getUserError || !user) {
      console.error('ユーザー情報取得エラー:', getUserError);
      return NextResponse.redirect(
        new URL(`/login?error=user_verification_error`, request.url)
      );
    }
    
    console.log('ユーザー情報確認成功:', user.id);
    
    // ログイン成功後のリダイレクト先
    return NextResponse.redirect(new URL('/saved', request.url));
  } catch (err: unknown) {
    console.error('コールバック処理エラー:', err);
    
    // 型ガードを使用してエラーメッセージを安全に取得
    let errorMessage = '不明なエラーが発生しました';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in (err as Record<string, unknown>) && typeof (err as Record<string, unknown>).message === 'string') {
      errorMessage = (err as Record<string, string>).message;
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
