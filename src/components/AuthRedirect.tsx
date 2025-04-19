'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

type AuthRedirectProps = {
  requiredAuth: boolean;
  redirectTo: string;
};

export default function AuthRedirect({ requiredAuth, redirectTo }: AuthRedirectProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('認証状態を確認中...');
        
        // セッションを取得
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('セッション取得エラー:', error);
        }
        
        console.log('セッション状態:', session ? '認証済み' : '未認証');
        
        // ログイン状態と要求される状態が一致しない場合はリダイレクト
        if ((requiredAuth && !session) || (!requiredAuth && session)) {
          console.log(`リダイレクト: ${redirectTo}`);
          router.push(redirectTo);
        }
      } catch (err) {
        console.error('認証チェックエラー:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [requiredAuth, redirectTo, router]);

  return null;
}
