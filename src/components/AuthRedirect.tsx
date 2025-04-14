'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';

type AuthRedirectProps = {
  requiredAuth: boolean;
  redirectTo: string;
};

export default function AuthRedirect({ requiredAuth, redirectTo }: AuthRedirectProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // ログイン状態と要求される状態が一致しない場合はリダイレクト
      if ((requiredAuth && !session) || (!requiredAuth && session)) {
        router.push(redirectTo);
      }
    };

    checkAuth();
  }, [requiredAuth, redirectTo, router, supabase.auth]);

  return null;
}
