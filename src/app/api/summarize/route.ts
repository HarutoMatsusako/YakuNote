import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
    
    openaiClient = new OpenAI({
      apiKey,
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

    // テキストの長さを制限（約8000トークン程度に制限）
    const max_chars = 12000;
    const truncated_text = text.length > max_chars 
      ? text.substring(0, max_chars) + "...(テキストが長すぎるため、一部のみを要約しています)"
      : text;

    // OpenAIクライアントを取得
    const openai = getOpenAIClient();
    
    // OpenAI APIを使用して要約
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "以下の文章を要約してください。" },
        { role: "user", content: truncated_text }
      ]
    });

    let summary = response.choices[0].message.content;

    // 元のテキストが切り詰められた場合はその旨を追加
    if (text.length > max_chars) {
      summary += "\n\n(注: 元のテキストが長すぎるため、最初の部分のみを要約しています)";
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
    console.error('Summarize API error:', e);
    return NextResponse.json(
      { detail: `要約中にエラーが発生しました: ${e.message}` },
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
