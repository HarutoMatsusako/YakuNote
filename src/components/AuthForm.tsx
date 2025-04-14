'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';

type AuthFormProps = {
  type: 'login' | 'signup';
};

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) {
          setError(error.message);
        } else {
          // サインアップ成功
          router.push('/summary');
        }
      } else {
        // ログイン処理
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          // ログイン成功
          router.push('/summary');
        }
      }
    } catch (err) {
      console.error('認証エラー:', err);
      setError('認証処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {type === 'login' ? 'ログイン' : 'サインアップ'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? (
            <span>処理中...</span>
          ) : type === 'login' ? (
            'ログイン'
          ) : (
            'サインアップ'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-center text-sm">
        {type === 'login' ? (
          <p>
            アカウントをお持ちでない方は{' '}
            <a href="/signup" className="text-blue-500 hover:underline">
              サインアップ
            </a>
          </p>
        ) : (
          <p>
            すでにアカウントをお持ちの方は{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              ログイン
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
