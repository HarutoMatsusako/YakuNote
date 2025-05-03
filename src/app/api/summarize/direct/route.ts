import { NextRequest, NextResponse } from 'next/server';

/**
 * Direct Summarize API
 * 
 * このAPIは、OpenAI APIを直接fetchで呼び出して要約を行うエンドポイントです。
 * OpenAIクライアントライブラリを使わずに、直接APIリクエストを行います。
 * 
 * @version 1.0.0
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

// 環境変数のデバッグ
const debugEnvironmentVariables = () => {
  console.log('Direct Summarize API: 環境変数一覧:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('OPENAI') || key.includes('API')) {
      console.log(`Direct Summarize API: - ${key}: ${key === 'OPENAI_API_KEY' ? '存在します' : '存在しません'}`);
    }
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const firstChars = apiKey.substring(0, 4);
    const lastChars = apiKey.substring(apiKey.length - 4);
    console.log(`Direct Summarize API: APIキー確認: ${firstChars}...${lastChars} (長さ: ${apiKey.length}文字)`);
    return apiKey;
  } else {
    console.error('Direct Summarize API: APIキーが設定されていません');
    return null;
  }
};

// 直接fetchを使用した要約処理
const summarizeWithFetch = async (text: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not set');
  
  console.log('Direct Summarize API: 要約リクエスト開始');
  console.log('Direct Summarize API: テキスト長', text.length);
  
  // テキストの長さを制限
  const max_chars = 4000;
  const truncated_text = text.length > max_chars 
    ? text.substring(0, max_chars) + "...(テキストが長すぎるため、一部のみを要約しています)"
    : text;
  
  console.log('Direct Summarize API: 切り詰め後のテキスト長', truncated_text.length);
  
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
        { role: "system", content: "以下の文章を要約してください。簡潔にまとめてください。" },
        { role: "user", content: truncated_text }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Direct Summarize API: APIエラー', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Direct Summarize API: 要約完了');
  return data.choices[0].message.content;
};

export async function POST(request: NextRequest) {
  try {
    console.log('Direct Summarize API: リクエスト受信');
    
    // リクエストボディをデバッグ
    const requestText = await request.text();
    console.log('Direct Summarize API: リクエスト本文', requestText);
    
    // JSONとして解析
    let body;
    try {
      body = JSON.parse(requestText);
      console.log('Direct Summarize API: JSONパース成功', body);
    } catch (parseError) {
      console.error('Direct Summarize API: JSONパースエラー', parseError);
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
    
    const { text } = body;

    if (!text) {
      console.error('Direct Summarize API: テキストが指定されていません');
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
    
    // APIキーの確認
    const apiKey = debugEnvironmentVariables();
    if (!apiKey) {
      return NextResponse.json(
        { detail: "OpenAI APIキーが設定されていません" },
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
    
    // 直接fetchを使用して要約
    const summary = await summarizeWithFetch(text);
    
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
    console.error('Direct Summarize API error details:', {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause
    });
    
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
