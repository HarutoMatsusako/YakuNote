'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type AuthRedirectProps = {
  requiredAuth: boolean;
  redirectTo: string;
};

export default function AuthRedirect({ requiredAuth, redirectTo }: AuthRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('認証状態を確認中...');
        
        // テスト用に認証チェックをスキップ
        // console.log('テスト用に認証チェックをスキップします');
        
        // 本来のコード
        // セッションを取得
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('セッション取得エラー:', error);
          // エラーが発生した場合、安全のためにログイン状態がないと仮定
          if (requiredAuth) {
            console.log(`認証エラーのためリダイレクト: ${redirectTo}`);
            router.push(redirectTo);
          }
          return;
        }
        
        console.log('セッション状態:', session ? '認証済み' : '未認証');
        
        // ログイン状態と要求される状態が一致しない場合はリダイレクト
        if ((requiredAuth && !session) || (!requiredAuth && session)) {
          console.log(`リダイレクト: ${redirectTo}`);
          router.push(redirectTo);
        }
      } catch (err) {
        console.error('認証チェックエラー:', err);
        // 例外が発生した場合、安全のためにログイン状態がないと仮定
        if (requiredAuth) {
          console.log(`認証チェックエラーのためリダイレクト: ${redirectTo}`);
          router.push(redirectTo);
        }
      }
    };

    checkAuth();
  }, [requiredAuth, redirectTo, router]);

  return null;
}
