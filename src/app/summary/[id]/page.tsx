'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthRedirect from '@/components/AuthRedirect';

// バックエンドAPIのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// 要約の型定義
interface SummaryDetail {
  id: string;
  summary: string;
  original_text: string;
  url: string | null;
  user_id: string;
  created_at: string;
}

export default function SummaryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('ユーザー情報を取得中...');
        
        // テスト用にダミーユーザーを設定
        console.log('テスト用にダミーユーザーを設定します');
        setUser({
          id: '123e4567-e89b-12d3-a456-426614174000', // 有効なUUID形式
          email: 'test@example.com'
        });
        
        // 本来のコード（テスト時はコメントアウト）
        /*
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
        
        // ユーザー情報を取得
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('ユーザー取得エラー:', error);
        } else {
          console.log('ユーザー取得成功:', user);
          setUser(user);
        }
        */
      } catch (err) {
        console.error('認証エラー:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // 要約の詳細を取得する関数
  const fetchSummaryDetail = async () => {
    if (!params.id) return;
    
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/summary/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('要約が見つかりませんでした');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || '要約の取得に失敗しました');
      }
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ページ読み込み時に要約の詳細を取得
  useEffect(() => {
    if (params.id) {
      fetchSummaryDetail();
    }
  }, [params.id]);

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 未ログインの場合は /login にリダイレクト */}
      <AuthRedirect requiredAuth={true} redirectTo="/login" />
      
      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">要約の詳細</h1>
          
          <div className="flex space-x-4">
            <Link
              href="/summaries"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              要約一覧へ戻る
            </Link>
            
            {!loading && user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {user.email}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">要約</h2>
              <div className="bg-blue-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap">
                {summary.summary}
              </div>
            </div>
            
            {summary.url && (
              <div>
                <h2 className="text-lg font-semibold mb-2">元のURL</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <a href={summary.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {summary.url}
                  </a>
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-lg font-semibold mb-2">作成日時</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                {formatDate(summary.created_at)}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">元のテキスト</h2>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto text-sm">
                {summary.original_text}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                トップページへ
              </Link>
              
              <Link
                href="/summaries"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                要約一覧へ
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">要約が見つかりませんでした</p>
            <Link
              href="/summaries"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              要約一覧へ戻る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
