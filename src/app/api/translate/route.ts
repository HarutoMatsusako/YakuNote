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
    const { text, targetLang } = body;

    if (!text) {
      return NextResponse.json(
        { detail: "テキストが指定されていません" },
        { status: 400 }
      );
    }

    if (!targetLang || (targetLang !== "ja" && targetLang !== "en")) {
      return NextResponse.json(
        { detail: "対象言語は'ja'または'en'を指定してください" },
        { status: 400 }
      );
    }

    // 言語に応じたシステムプロンプトを設定
    const systemPrompt = targetLang === "ja" 
      ? "以下の文章を日本語に翻訳してください。" 
      : "Please translate the following text into English.";

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

    const translatedText = response.choices[0].message.content;

    return NextResponse.json({ translatedText });
  } catch (e: any) {
    console.error('Translate API error:', e);
    return NextResponse.json(
      { detail: `翻訳中にエラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
