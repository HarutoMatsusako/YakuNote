"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthRedirect from "@/components/AuthRedirect";
import { supabase } from "@/lib/supabase";

// バックエンドAPIのベースURL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function SummaryPage() {
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

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("ユーザー情報を取得中...");

        // テスト用にダミーユーザーを設定
        console.log("テスト用にダミーユーザーを設定します");
        setUser({
          id: "123e4567-e89b-12d3-a456-426614174000", // 有効なUUID形式に変更
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
        */
      } catch (err) {
        console.error("認証エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 言語を切り替える関数
  const toggleLanguage = () => {
    const newLang = language === "ja" ? "en" : "ja";
    console.log("言語を切り替えました:", newLang);
    
    // 言語状態を更新し、コールバックで要約処理を実行
    setLanguage(newLang);
    
    // 既に要約が表示されている場合は、言語切り替え後に再度要約を行う
    if (extractedText) {
      // 言語状態が確実に更新されてから要約処理を実行するために、
      // useEffectを使用して言語変更を検知して要約を実行する
      console.log("要約を再実行します");
    }
  };
  
  // 言語が変更されたときに要約を再実行
  useEffect(() => {
    if (extractedText && !isExtracting && !isSummarizing) {
      console.log("言語変更を検知しました:", language);
      summarizeText(extractedText);
    }
  }, [language]);

  // URLからテキストを抽出する関数
  const extractTextFromUrl = async () => {
    console.log("🔍 使用するエンドポイント:", language);
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
      summarizeText(data.text);
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
      setIsExtracting(false);
    }
  };

  // テキストを要約する関数
  const summarizeText = async (text: string) => {
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
      console.log("要約結果:", JSON.stringify(data, null, 2));
      console.log("要約テキスト:", data.summary);
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
    if (!user || !extractedText || !summary) {
      setError("保存に必要な情報が不足しています");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
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
        throw new Error(errorData.detail || "保存に失敗しました");
      }

      setSuccess("要約が正常に保存されました");
    } catch (err: any) {
      setError(`エラー: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 未ログインの場合は /login にリダイレクト */}
      <AuthRedirect requiredAuth={true} redirectTo="/login" />

      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">YakuNote</h1>

          {!loading && user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">{user.email}</div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white py-1 px-3 text-sm rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center py-4">読み込み中...</p>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700"
                >
                  URL
                </label>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {language === "ja"
                    ? "🇺🇸 英語に切り替え"
                    : "🇯🇵 日本語に切り替え"}
                </button>
              </div>
              <div className="flex">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  disabled={isExtracting || isSummarizing}
                />
                <button
                  onClick={extractTextFromUrl}
                  disabled={isExtracting || isSummarizing || !url}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {isExtracting
                    ? "抽出中..."
                    : isSummarizing
                    ? "要約中..."
                    : "抽出して要約"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md text-sm mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-500 p-4 rounded-md text-sm mb-6">
                {success}
              </div>
            )}

            {extractedText && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  抽出されたテキスト
                </h2>
                <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto text-sm">
                  {extractedText}
                </div>
              </div>
            )}

            {summary && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">要約</h2>
                <div className="bg-blue-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap">
                  {summary}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveSummary}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                  >
                    {isSaving ? "保存中..." : "Supabaseに保存"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
