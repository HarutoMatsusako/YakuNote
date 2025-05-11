'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthFormProps = {
  type: 'login' | 'signup';
};

export default function AuthForm({ type }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Googleサインイン処理
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      console.log('Googleサインイン処理を開始します...');

      // ✅ 環境に応じてリダイレクト先を切り替える
      const redirectTo =
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000/api/auth/callback'
          : 'https://yaku-note.vercel.app/api/auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('Googleサインインレスポンス:', { data, error });

      if (error) throw error;

    } catch (err: unknown) {
      console.error('Googleサインインエラー:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Googleサインインエラー: ${errorMessage}`);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {type === 'login' ? 'ログイン' : 'アカウント作成'}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mb-4"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
          </g>
        </svg>
        {googleLoading ? '処理中...' : 'Googleでサインイン'}
      </button>

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
