import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Summarize API
 *
 * このAPIは、テキストを要約するためのエンドポイントです。
 * OpenAI GPT-3.5-turboモデルを使用して、日本語のテキストを要約します。
 *
 * @version 1.0.1
 * @date 2025-05-03
 */

// OPTIONSメソッドを追加してCORSプリフライトリクエストに対応
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// OpenAIクライアントの初期化（実行時のみ）
let openaiClient: OpenAI | null = null;

// 環境変数から適切なAPIキーを取得
const getOpenAIApiKey = () => {
  // 可能性のある環境変数名をすべて試す
  const possibleKeys = [
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_OPENAI_API_KEY",
    "OPENAI_KEY",
    "NEXT_PUBLIC_OPENAI_KEY",
  ];

  for (const key of possibleKeys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return null;
};

const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = getOpenAIApiKey();

    if (!apiKey) {
      console.error(
        "Summarize API: OpenAIクライアント初期化エラー: APIキーが設定されていません"
      );
      throw new Error("OpenAI API key is not set");
    }

    // タイムアウトとリトライ設定を追加
    openaiClient = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1",
      timeout: 60000, // 60秒のタイムアウト
      maxRetries: 3, // 最大3回リトライ
    });
  }
  return openaiClient;
};

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const requestText = await request.text();

    // JSONとして解析
    let body;
    try {
      body = JSON.parse(requestText);
    } catch (parseError) {
      console.error("Summarize API: JSONパースエラー", parseError);
      return NextResponse.json(
        { detail: "リクエストボディのJSONパースに失敗しました" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    const { text } = body;

    if (!text) {
      console.error("Summarize API: テキストが指定されていません");
      return NextResponse.json(
        { detail: "テキストが指定されていません" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // テキストの長さを制限（より小さな値に設定）
    const max_chars = 4000; // 軽量化のため4000文字に制限
    const truncated_text =
      text.length > max_chars
        ? text.substring(0, max_chars) +
          "...(テキストが長すぎるため、一部のみを要約しています)"
        : text;


    // OpenAIクライアントを取得
    const openai = getOpenAIClient();

    // OpenAI APIを使用して要約
    let response;

    // APIキーを取得
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    try {

      // 最初に新しいモデルを試す

      // 直接fetchを使用してレスポンスを詳細にチェック
      const fetchResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-0125",
            messages: [
              {
                role: "system",
                content:
                  "以下の文章を内容を維持したまま、できるだけ詳しくわかりやすく要約してください。省略しすぎないようにしてください。",
              },
              { role: "user", content: truncated_text },
            ],
            max_tokens: 1000,
            temperature: 0.5,
          }),
        }
      );


      if (!fetchResponse.ok) {
        const errorBody = await fetchResponse.text();
        console.error("Summarize API: OpenAI APIエラー詳細:", {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          body: errorBody,
        });
        throw new Error(
          `OpenAI API error: ${fetchResponse.status} ${fetchResponse.statusText}`
        );
      }

      const jsonResponse = await fetchResponse.json();
      response = jsonResponse;

    } catch (modelError) {
      console.error(
        "Summarize API: 新しいモデルでエラー発生、安定版にフォールバック",
        modelError
      );

      try {
        // 安定版モデルにフォールバック

        // 直接fetchを使用してレスポンスを詳細にチェック
        const fetchResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "以下の文章を要約してください。簡潔にまとめてください。",
                },
                { role: "user", content: truncated_text },
              ],
              max_tokens: 1000,
              temperature: 0.7,
            }),
          }
        );


        if (!fetchResponse.ok) {
          const errorBody = await fetchResponse.text();
          console.error("Summarize API: フォールバックAPIエラー詳細:", {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            body: errorBody,
          });
          throw new Error(
            `OpenAI API error: ${fetchResponse.status} ${fetchResponse.statusText}`
          );
        }

        const jsonResponse = await fetchResponse.json();
        response = jsonResponse;

      } catch (fallbackError) {
        console.error(
          "Summarize API: フォールバックモデルでもエラー発生",
          fallbackError
        );
        throw fallbackError; // 再スロー
      }
    }

    let summary = response.choices[0].message.content;

    // 元のテキストが切り詰められた場合はその旨を追加
    if (text.length > max_chars) {
      summary +=
        "\n\n(注: 元のテキストが長すぎるため、最初の部分のみを要約しています)";
    }

    return NextResponse.json(
      { summary },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (e: any) {
    // より詳細なエラーログ
    console.error("Summarize API error details:", {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause,
    });

    // APIキーが設定されていない場合の特別なエラーメッセージ
    const errorMessage =
      e.message === "OpenAI API key is not set"
        ? "OpenAI APIキーが設定されていません。環境変数を確認してください。"
        : `要約中にエラーが発生しました: ${e.message}`;

    return NextResponse.json(
      { detail: errorMessage },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
