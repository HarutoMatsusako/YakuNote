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
      // 一旦サマリーページにリダイレクトし、そこでセッションを確認する
      return NextResponse.redirect(new URL('/summary', request.url));
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
    
    // ログイン成功後のリダイレクト先
    return NextResponse.redirect(new URL('/summary', request.url));
  } catch (err: unknown) {
    console.error('コールバック処理エラー:', err);
    const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
