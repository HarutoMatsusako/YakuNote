"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthRedirect from "@/components/AuthRedirect";
import { use } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface SummaryDetail {
  id: string;
  summary: string;
  original_text: string;
  url: string | null;
  user_id: string;
  created_at: string;
}

export default function SummaryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<"ja" | "en">("ja");

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("ユーザー情報を取得中...");
        setUser({
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "test@example.com",
        });
      } catch (err) {
        console.error("認証エラー:", err);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "ja" ? "en" : "ja";
    setLanguage(newLang);
  };

  useEffect(() => {
    if (id) fetchSummaryDetail();
  }, [language]);

  const fetchSummaryDetail = async () => {
    if (!id) return;
    try {
      setError(null);
      setLoading(true);
      const endpoint =
        language === "ja" ? `/summary/${id}` : `/summary_english/${id}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        if (response.status === 404)
          throw new Error("要約が見つかりませんでした");
        const errorData = await response.json();
        throw new Error(errorData.detail || "要約の取得に失敗しました");
      }
      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSummaryDetail();
  }, [id]);

  const deleteSummary = async () => {
    if (!id || !confirm("この要約を削除してもよろしいですか？")) return;
    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);
      const response = await fetch(`${API_BASE_URL}/summary/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "要約の削除に失敗しました");
      }
      setSuccess("要約が正常に削除されました");
      setTimeout(() => router.push("/summaries"), 1000);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthRedirect requiredAuth={true} redirectTo="/login" />

      <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold"></h1>
          <div className="flex space-x-4">
            {!loading && user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
            )}
            <Link
              href="/summaries"
              className="inline-flex items-center px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors font-medium text-sm"
            >
              要約一覧へ
            </Link>
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
        ) : success ? (
          <div className="bg-green-50 text-green-500 p-4 rounded-md mb-6">
            {success}
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <div>
              {/* タイトルとボタンを横並びにする */}
              <div className="flex justify-between items-center mb-0.5">
                <h2 className="text-lg font-semibold text-gray-800">要約</h2>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors font-medium text-sm"
                >
                  {language === "ja"
                    ? "🇺🇸 English"
                    : "🇯🇵 Japanese"}
                </button>
              </div>

              {/* 要約本文 */}
              <div className="bg-indigo-50 p-4 rounded-md text-gray-900 whitespace-pre-wrap">
                {summary.summary}
              </div>
            </div>
            {summary.url && (
              <div>
                <h2 className="text-lg font-semibold text-gray-400 mb-2">元のURL</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <a
                    href={summary.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    {summary.url}
                  </a>
                </div>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-400 mb-2">作成日時</h2>
              <div className="bg-gray-50 p-4 rounded-md text-gray-400">
                {formatDate(summary.created_at)}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-400 mb-2">元のテキスト</h2>
              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto text-sm text-gray-400">
                {summary.original_text}
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors font-medium text-sm"
              >
                {" "}
                要約を始める
              </Link>
              <Link
                href="/summaries"
                className="inline-flex items-center px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors font-medium text-sm"
              >
                要約一覧へ
              </Link>
              <button
                onClick={deleteSummary}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors font-medium text-sm"
              >
                {isDeleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">要約が見つかりませんでした</p>
            <Link
              href="/summaries"
              className="inline-flex items-center px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors font-medium text-sm"
            >
              要約一覧へ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
