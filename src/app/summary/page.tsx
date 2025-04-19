'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthRedirect from '@/components/AuthRedirect';
import { supabase } from '@/lib/supabase';

export default function SummaryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('ユーザー情報を取得中...');
        
        // まずセッションを確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('セッション取得エラー:', sessionError);
          setLoading(false);
          return;
        }
        
        if (!session) {
          console.log('セッションがありません');
          setLoading(false);
          return;
        }
        
        console.log('セッション取得成功:', session);
        
        // URLのハッシュフラグメントからセッション情報を取得する処理
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          console.log('URLハッシュ:', hash);
          
          // ハッシュフラグメントにアクセストークンが含まれている場合は処理
          if (hash && hash.includes('access_token')) {
            console.log('アクセストークンを検出しました。セッションを設定します...');
            
            // URLからハッシュフラグメントを削除
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + window.location.search
            );
          }
        }
        
        // ユーザー情報を取得
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('ユーザー取得エラー:', error);
        } else {
          console.log('ユーザー取得成功:', user);
          setUser(user);
        }
      } catch (err) {
        console.error('認証エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 未ログインの場合は /login にリダイレクト */}
      <AuthRedirect requiredAuth={true} redirectTo="/login" />
      
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">サマリーページ</h1>
        
        {loading ? (
          <p className="text-center">読み込み中...</p>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">メールアドレス:</span> {user?.email}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">ユーザーID:</span> {user?.id}
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                ログアウト
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
