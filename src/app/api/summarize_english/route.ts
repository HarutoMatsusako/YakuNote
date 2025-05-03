import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
        { status: 400 }
      );
    }

    // テキストの長さを制限（約8000トークン程度に制限）
    const max_chars = 12000;
    const truncated_text = text.length > max_chars 
      ? text.substring(0, max_chars) + "...(Text is too long, only summarizing the first part)"
      : text;

    // OpenAIクライアントを取得
    const openai = getOpenAIClient();
    
    // OpenAI APIを使用して英語で要約
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Please summarize the following text in English." },
        { role: "user", content: truncated_text }
      ]
    });

    let summary = response.choices[0].message.content;

    // 元のテキストが切り詰められた場合はその旨を追加
    if (text.length > max_chars) {
      summary += "\n\n(Note: The original text was too long, only the first part was summarized)";
    }

    return NextResponse.json({ summary });
  } catch (e: any) {
    console.error('Summarize English API error:', e);
    return NextResponse.json(
      { detail: `Error during summarization: ${e.message}` },
      { status: 500 }
    );
  }
}
