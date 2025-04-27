"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// バックエンドAPIのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [shouldRerun, setShouldRerun] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("ユーザー情報を取得中...");

        // テスト用にダミーユーザーを設定
        // console.log("テスト用にダミーユーザーを設定します");
        // setUser({
        //   id: "123e4567-e89b-12d3-a456-426614174000", // 有効なUUID形式
        //   email: "test@example.com",
        // });

        // 本来のコード（テスト時はコメントアウト）
        
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
        
      } catch (err) {
        console.error("認証エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  // 言語を切り替える関数
  const toggleLanguage = async () => {
    const newLang = language === "ja" ? "en" : "ja";
    setLanguage(newLang);
  
    if (summary) {
      try {
        const response = await fetch(`${API_BASE_URL}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: summary,
            targetLang: newLang,
          }),
        });
  
        if (!response.ok) {
          throw new Error("翻訳に失敗しました");
        }
  
        const data = await response.json();
        setSummary(data.translatedText);
      } catch (error) {
        console.error("翻訳エラー:", error);
      }
    }
  };
  
  // 言語が変更されたときのログ出力（デバッグ用）
  useEffect(() => {
    console.log("言語が変更されました:", language);
  }, [language]);

  // URLからテキストを抽出する関数
  const extractTextFromUrl = async () => {
    if (!url) {
      setError("URLを入力してください");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsExtracting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "テキスト抽出に失敗しました");
      }

      const data = await response.json();
      setExtractedText(data.text);

      // テキストを抽出したら自動的に要約を開始
      console.log("テキスト抽出完了、要約を開始します");
      summarizeText(data.text);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
      setIsExtracting(false);
    }
  };

  // テキストを要約する関数
  const summarizeText = async (text: string, lang: "ja" | "en" = language) => {
    if (!text) {
      setError("要約するテキストがありません");
      setIsExtracting(false);
      return;
    }

    setIsSummarizing(true);

    try {
      // 言語に応じてエンドポイントを選択
      const endpoint = language === "ja" ? "/summarize" : "/summarize_english";
      console.log("🌐 現在の言語:", language);
      console.log("🔗 使用するエンドポイント:", endpoint);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "要約に失敗しました");
      }

      const data = await response.json();
      setSummary(data.summary || "要約結果が空です");
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setIsExtracting(false);
      setIsSummarizing(false);
    }
  };

  // 要約をSupabaseに保存する関数
  const saveSummary = async () => {
    console.log("保存ボタンがクリックされました");

    if (!user) {
      // 未ログインの場合はログインページにリダイレクト
      console.log(
        "ユーザーが未ログインです。ログインページにリダイレクトします"
      );
      router.push("/login");
      return;
    }

    if (!extractedText || !summary) {
      console.log("保存に必要な情報が不足しています");
      setError("保存に必要な情報が不足しています");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("保存APIを呼び出します");
      const response = await fetch(`${API_BASE_URL}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: extractedText,
          summary: summary,
          user_id: user.id,
          url: url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "保存APIからエラーレスポンスを受け取りました:",
          errorData
        );
        throw new Error(errorData.detail || "保存に失敗しました");
      }

      console.log("保存が成功しました");
      setSuccess("要約が正常に保存されました");
    } catch (err: any) {
      console.error("保存中にエラーが発生しました:", err);
      setError(`エラー: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 保存済み要約一覧ページに移動する関数
  const goToSavedSummaries = () => {
    if (!user) {
      // 未ログインの場合はログインページにリダイレクト
      router.push("/login");
      return;
    }

    router.push("/summaries");
  };

  // 成功メッセージを一定時間後に消す
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // エラーメッセージを一定時間後に消す
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-white py-12 px-6 sm:px-8 lg:px-12">
      <div className="w-full max-w-4xl">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-indigo-700 font-sans">
            YakuNote
          </h1>

          <div className="flex items-center space-x-4">
            {!loading && user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">{user.email}</div>
                <Link
                  href="/summaries"
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-sm"
                >
                  保存一覧
                </Link>
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium text-sm"
              >
                ログイン
              </button>
            )}
            <button
              onClick={goToSavedSummaries}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm"
            >
              保存する
            </button>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
          {/* URL入力部分 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label
                htmlFor="url"
                className="block text-lg font-medium text-gray-700"
              >
                URL入力
              </label>
            </div>
            <div className="flex space-x-4">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-3 px-4"
                disabled={isExtracting || isSummarizing}
              />
              <button
                onClick={extractTextFromUrl}
                disabled={isExtracting || isSummarizing || !url}
                className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 transition-colors font-medium text-base"
              >
                {isExtracting
                  ? "抽出中..."
                  : isSummarizing
                  ? "要約中..."
                  : "要約開始"}
              </button>
            </div>
          </div>

          {/* エラーと成功メッセージ */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-base mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg text-base mb-6">
              {success}
            </div>
          )}

          {/* 要約結果 */}
          {summary && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                要約結果
              </h2>
              <button
                onClick={() => {
                  console.log(
                    "言語切り替えボタンがクリックされました（インラインハンドラー）"
                  );
                  toggleLanguage();
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm"
                id="language-toggle-button"
              >
                {language === "ja" ? "🇺🇸 English" : "🇯🇵 Japnanese"}
              </button>
              <div className="bg-indigo-50 p-6 rounded-lg text-gray-800 whitespace-pre-wrap text-base border border-indigo-100">
                {summary}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveSummary}
                  disabled={isSaving}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 transition-colors font-medium text-base"
                >
                  {isSaving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          )}

          {/* 抽出されたテキスト */}
          {extractedText && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                抽出されたテキスト
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg max-h-60 overflow-y-auto text-base text-gray-700 border border-gray-100">
                {extractedText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
