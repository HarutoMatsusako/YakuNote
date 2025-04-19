import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './lib/supabase';

export async function middleware(req: NextRequest) {
  // APIルートの場合は処理をスキップ
  if (req.nextUrl.pathname.startsWith('/api/')) {
    console.log('APIルートのためミドルウェアをスキップ:', req.nextUrl.pathname);
    return NextResponse.next();
  }
  
  try {
    const res = NextResponse.next();
    
    // Supabaseクライアントをミドルウェアで作成
    const supabase = createMiddlewareClient<Database>({ req, res });
    
    // セッションの更新
    await supabase.auth.getSession();
    
    return res;
  } catch (error) {
    console.error('ミドルウェアエラー:', error);
    return NextResponse.next();
  }
}

// APIルートを除外したマッチャー
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
