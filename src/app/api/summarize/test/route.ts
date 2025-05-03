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
    
    // APIキーを取得
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      console.error('Test API: APIキーが設定されていません');
      throw new Error('OpenAI API key is not set');
    }
    
    console.log('Test API: APIキー取得成功、長さ:', apiKey.length);
    
    // DNSの解決をテスト
    try {
      console.log('Test API: DNS解決テスト開始 - api.openai.com');
      const dnsResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      console.log('Test API: DNS解決テスト完了 - ステータス:', dnsResponse.status);
    } catch (dnsError: any) {
      console.error('Test API: DNS解決テストエラー:', {
        message: dnsError.message,
        name: dnsError.name
      });
    }
    
    // 代替エンドポイントのテスト
    try {
      console.log('Test API: 代替エンドポイントテスト開始 - /v1/models');
      const modelsResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      console.log('Test API: 代替エンドポイントテスト完了 - ステータス:', modelsResponse.status);
      
      if (modelsResponse.ok) {
        const modelsText = await modelsResponse.text();
        console.log('Test API: モデル一覧取得成功 - 長さ:', modelsText.length);
      }
    } catch (modelsError: any) {
      console.error('Test API: 代替エンドポイントテストエラー:', {
        message: modelsError.message,
        name: modelsError.name
      });
    }
    
    // 直接fetchを使用してOpenAI APIにリクエスト
    console.log('Test API: fetch開始 - https://api.openai.com/v1/chat/completions');
    
    try {
      const fetchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "user", content: "Hello" }
          ],
          max_tokens: 10
        })
      });
      
      // レスポンスステータスをログに出力
      console.log('Test API: fetch完了 - ステータス:', fetchResponse.status, fetchResponse.statusText);
      
      // レスポンスの内容をテキストとして取得
      const responseText = await fetchResponse.text();
      console.log('Test API: レスポンス本文:', responseText);
      
      if (!fetchResponse.ok) {
        console.error('Test API: APIエラー', {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          body: responseText
        });
        throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText} - ${responseText}`);
      }
      
      // 正常なレスポンスの場合はJSONとしてパース
      const data = JSON.parse(responseText);
      
      return NextResponse.json(
        {
          result: data.choices[0].message.content,
          model: data.model,
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
    } catch (fetchError: any) {
      // fetchエラーの詳細をログに出力
      console.error('Test API: fetch例外詳細:', {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack,
        cause: fetchError.cause,
        type: fetchError.type,
        code: fetchError.code
      });
      
      // ネットワークエラーの場合
      if (fetchError.message.includes('fetch failed') || 
          fetchError.message.includes('network') ||
          fetchError.message.includes('connection')) {
        console.error('Test API: ネットワークエラーと判断');
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      throw fetchError;
    }
  } catch (e: any) {
    // 最終的なエラーハンドリング
    console.error('Test API: 最終エラー詳細:', {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause,
      // エラーオブジェクトのすべてのプロパティを出力
      ...Object.getOwnPropertyNames(e).reduce((acc, prop) => {
        acc[prop] = e[prop];
        return acc;
      }, {} as Record<string, any>)
    });
    
    return NextResponse.json(
      { 
        detail: `テストエラー: ${e.message}`,
        error_type: e.name,
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
