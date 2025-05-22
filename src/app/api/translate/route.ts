import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * Translate API
 * 
 * このAPIは、テキストを翻訳するためのエンドポイントです。
 * OpenAI GPT-3.5-turboモデルを使用して、日本語と英語の間で翻訳を行います。
 * 
 * @version 1.1.0
 * @date 2025-05-03
 */

// OPTIONSメソッドを追加してCORSプリフライトリクエストに対応
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// OpenAIクライアントの初期化（実行時のみ）
let openaiClient: OpenAI | null = null;

// 環境変数から適切なAPIキーを取得
const getOpenAIApiKey = () => {
  // 可能性のある環境変数名をすべて試す
  const possibleKeys = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'OPENAI_KEY',
    'NEXT_PUBLIC_OPENAI_KEY'
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
      console.error('Translate API: OpenAIクライアント初期化エラー: APIキーが設定されていません');
      throw new Error('OpenAI API key is not set');
    }
    
    // タイムアウトとリトライ設定を追加
    openaiClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.openai.com/v1',
      timeout: 60000, // 60秒のタイムアウト
      maxRetries: 3   // 最大3回リトライ
    });
  }
  return openaiClient;
};

// 直接fetchを使用した翻訳処理
const translateWithFetch = async (text: string, targetLang: string) => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) throw new Error('OpenAI API key is not set');
  
  // 言語に応じたシステムプロンプトを設定
  const systemPrompt = targetLang === "ja" 
    ? "以下の文章を日本語に翻訳してください。" 
    : "Please translate the following text into English.";
  
  // 直接fetchでリクエスト
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Translate API: APIエラー', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
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
      console.error('Translate API: JSONパースエラー', parseError);
      return NextResponse.json(
        { detail: "リクエストボディのJSONパースに失敗しました" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    const { text, targetLang } = body;

    if (!text) {
      console.error('Translate API: テキストが指定されていません');
      return NextResponse.json(
        { detail: "テキストが指定されていません" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    if (!targetLang || (targetLang !== "ja" && targetLang !== "en")) {
      console.error('Translate API: 対象言語が不正です', targetLang);
      return NextResponse.json(
        { detail: "対象言語は'ja'または'en'を指定してください" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }


    // 言語に応じたシステムプロンプトを設定
    const systemPrompt = targetLang === "ja" 
      ? "以下の文章を日本語に翻訳してください。" 
      : "Please translate the following text into English.";

    let translatedText;
    
    try {
      // 直接fetchを使用した実装を試す
      translatedText = await translateWithFetch(text, targetLang);
    } catch (fetchError) {
      console.error('Translate API: fetch実装でエラー発生、OpenAIクライアントにフォールバック', fetchError);
      
      // OpenAIクライアントを使用した実装にフォールバック
      
      // OpenAIクライアントを取得
      const openai = getOpenAIClient();
      
      // OpenAI APIを使用して翻訳
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ]
      });

      translatedText = response.choices[0].message.content;
    }


    return NextResponse.json(
      { translatedText },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (e: any) {
    console.error('Translate API error:', {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause
    });
    
    return NextResponse.json(
      { detail: `翻訳中にエラーが発生しました: ${e.message}` },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
