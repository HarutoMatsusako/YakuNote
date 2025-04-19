'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import AuthRedirect from '@/components/AuthRedirect';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // URLからエラーパラメータを取得
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      console.log('サインアップエラー:', { errorParam, errorDescription });
      
      // エラーメッセージを設定
      if (errorParam === 'access_denied') {
        setError('Googleアカウントへのアクセスが拒否されました。再度お試しください。');
      } else if (errorParam === 'auth_callback_error') {
        setError(`認証コールバックエラー: ${errorDescription || '不明なエラー'}`);
      } else if (errorParam === 'no_callback_code') {
        setError('認証コードが見つかりませんでした。再度お試しください。');
      } else {
        setError(`認証エラー: ${errorParam} ${errorDescription ? `- ${errorDescription}` : ''}`);
      }
    }
  }, [searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* すでにログインしている場合は /summary にリダイレクト */}
        <AuthRedirect requiredAuth={false} redirectTo="/summary" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">アカウント作成</h1>
          <p className="mt-2 text-sm text-gray-600">
            新しいアカウントを作成して始めましょう
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm mb-6">
            {error}
          </div>
        )}
        
        <AuthForm type="signup" />
      </div>
    </div>
  );
}
