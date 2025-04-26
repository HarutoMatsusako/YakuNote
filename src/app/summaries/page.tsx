"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthRedirect from "@/components/AuthRedirect";

// バックエンドAPIのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// 要約の型定義
interface Summary {
  id: string;
  summary: string;
  url: string | null;
  created_at: string;
}

// ページネーションの型定義
interface PaginationInfo {
  total: number;
  skip: number;
  limit: number;
}

export default function SummariesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    skip: 0,
    limit: 10,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("ユーザー情報を取得中...");

        // テスト用にダミーユーザーを設定
        console.log("テスト用にダミーユーザーを設定します");
        setUser({
          id: "123e4567-e89b-12d3-a456-426614174000", // 有効なUUID形式
          email: "test@example.com",
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
        console.error("認証エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // 要約一覧を取得する関数
  const fetchSummaries = async (skip = 0, limit = 10) => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/summaries/${user.id}?skip=${skip}&limit=${limit}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "要約の取得に失敗しました");
      }

      const data = await response.json();
      setSummaries(data.summaries);
      setPagination({
        total: data.total,
        skip: data.skip,
        limit: data.limit,
      });
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ユーザー情報が取得できたら要約一覧を取得
  useEffect(() => {
    if (user) {
      fetchSummaries();
    }
  }, [user]);

  // ページを変更する関数
  const changePage = (newSkip: number) => {
    fetchSummaries(newSkip, pagination.limit);
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // URLを短く表示する関数
  const truncateUrl = (url: string | null, maxLength = 50) => {
    if (!url) return "URL なし";
    return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
  };

  // 要約を短く表示する関数
  const truncateSummary = (summary: string, maxLength = 100) => {
    return summary.length > maxLength
      ? summary.substring(0, maxLength) + "..."
      : summary;
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 未ログインの場合は /login にリダイレクト */}
      <AuthRedirect requiredAuth={true} redirectTo="/login" />

      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">保存した要約一覧</h1>

          <div className="flex space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              トップページへ
            </Link>

            {!loading && user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
            )}
          </div>
        </div>
        {loading && !error ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">保存された要約はありません</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              新しい要約を作成する
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      要約
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      URL
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      作成日時
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaries.map((summary) => (
                    <tr key={summary.id} className="hover:bg-gray-50">
                      {/* 要約列 */}
                      <td className="px-6 py-4 whitespace-pre-wrap break-words max-w-[400px]">
                        <div className="text-sm text-gray-900">
                          {truncateSummary(summary.summary)}
                        </div>
                      </td>

                      {/* URL列 */}
                      <td className="px-6 py-4 whitespace-nowrap max-w-[200px] truncate">
                        <div className="text-sm text-gray-500">
                          {summary.url ? (
                            <a
                              href={summary.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {truncateUrl(summary.url)}
                            </a>
                          ) : (
                            "URL なし"
                          )}
                        </div>
                      </td>

                      {/* 作成日時 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(summary.created_at)}
                        </div>
                      </td>

                      {/* アクション（詳細リンク） */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/summary/${summary.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            {pagination.total > pagination.limit && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() =>
                    changePage(Math.max(0, pagination.skip - pagination.limit))
                  }
                  disabled={pagination.skip === 0}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  前のページ
                </button>

                <div className="text-sm text-gray-500">
                  {pagination.skip + 1} -{" "}
                  {Math.min(
                    pagination.skip + pagination.limit,
                    pagination.total
                  )}{" "}
                  / {pagination.total} 件
                </div>

                <button
                  onClick={() => changePage(pagination.skip + pagination.limit)}
                  disabled={
                    pagination.skip + pagination.limit >= pagination.total
                  }
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  次のページ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
