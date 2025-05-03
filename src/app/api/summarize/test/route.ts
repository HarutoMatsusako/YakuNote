import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * Test API
 * 
 * このAPIは、OpenAI APIの接続をテストするためのシンプルなエンドポイントです。
 * 最小限のリクエストでOpenAI APIを呼び出し、結果を返します。
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 環境変数のデバッグ強化
const getOpenAIApiKey = () => {
  // 可能性のある環境変数名をすべて試す
  const possibleKeys = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'OPENAI_KEY',
    'NEXT_PUBLIC_OPENAI_KEY'
  ];
  
  console.log('Test API: 環境変数チェック:');
  for (const key of possibleKeys) {
    const value = process.env[key];
    if (value) {
      console.log(`Test API: - ${key}: 存在します (長さ: ${value.length}文字)`);
      return value;
    } else {
      console.log(`Test API: - ${key}: 存在しません`);
    }
  }
  
  // すべての環境変数を出力（デバッグ用）
  console.log('Test API: すべての環境変数キー:');
  Object.keys(process.env).forEach(key => {
    // セキュリティのため、キー名のみを出力
    console.log(`Test API: - ${key}`);
  });
  
  return null;
};

// OpenAIクライアントの初期化
const getOpenAIClient = () => {
  try {
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      console.error('Test API: OpenAIクライアント初期化エラー: APIキーが設定されていません');
      throw new Error('OpenAI API key is not set');
    }
    
    console.log('Test API: OpenAIクライアント初期化: APIキー確認OK');
    
    // 明示的にベースURLを指定
    return new OpenAI({ 
      apiKey,
      baseURL: 'https://api.openai.com/v1',
      timeout: 30000, // 30秒のタイムアウト
      maxRetries: 2   // 最大2回リトライ
    });
  } catch (e) {
    console.error('Test API: OpenAIクライアント初期化例外:', e);
    throw e;
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Test API: リクエスト受信');
    
    // OpenAIクライアントを取得
    const openai = getOpenAIClient();
    
    // 最小限のリクエストでテスト
    console.log('Test API: OpenAI API呼び出し開始');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello" }
      ],
      max_tokens: 10
    });
    console.log('Test API: OpenAI API呼び出し完了');
    
    return NextResponse.json(
      { 
        result: response.choices[0].message.content,
        model: response.model,
        status: "success"
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (e: any) {
    console.error('Test API error details:', {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause
    });
    
    return NextResponse.json(
      { 
        detail: `テストエラー: ${e.message}`,
        status: "error"
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
