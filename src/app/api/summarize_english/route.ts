import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * Summarize English API
 * 
 * このAPIは、テキストを英語で要約するためのエンドポイントです。
 * OpenAI GPT-3.5-turboモデルを使用して、テキストを英語で要約します。
 * 
 * @version 1.0.1
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

const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not set');
    }
    
    // タイムアウトとリトライ設定を追加
    openaiClient = new OpenAI({
      apiKey,
      timeout: 60000, // 60秒のタイムアウト
      maxRetries: 3   // 最大3回リトライ
    });
  }
  return openaiClient;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
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

    // テキストの長さを制限（より小さな値に設定）
    const max_chars = 4000; // 軽量化のため4000文字に制限
    const truncated_text = text.length > max_chars 
      ? text.substring(0, max_chars) + "...(Text is too long, only summarizing the first part)"
      : text;
    
    console.log('Summarize English API: テキスト長', text.length);
    console.log('Summarize English API: 切り詰め後のテキスト長', truncated_text.length);

    // OpenAIクライアントを取得
    const openai = getOpenAIClient();
    
    // OpenAI APIを使用して英語で要約（より新しいモデルバージョンを使用）
    console.log('Summarize English API: OpenAI API呼び出し開始');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // より新しいバージョンを指定
      messages: [
        { role: "system", content: "Please summarize the following text in English. Be concise." },
        { role: "user", content: truncated_text }
      ],
      max_tokens: 1000, // トークン数を制限
      temperature: 0.7  // 創造性の度合い
    });
    console.log('Summarize English API: OpenAI API呼び出し完了');

    let summary = response.choices[0].message.content;

    // 元のテキストが切り詰められた場合はその旨を追加
    if (text.length > max_chars) {
      summary += "\n\n(Note: The original text was too long, only the first part was summarized)";
    }

    return NextResponse.json(
      { summary },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (e: any) {
    // より詳細なエラーログ
    console.error('Summarize English API error details:', {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause
    });
    
    // APIキーが設定されていない場合の特別なエラーメッセージ
    const errorMessage = e.message === 'OpenAI API key is not set' 
      ? 'OpenAI API key is not set. Please check your environment variables.' 
      : `Error during summarization: ${e.message}`;
    
    return NextResponse.json(
      { detail: errorMessage },
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
