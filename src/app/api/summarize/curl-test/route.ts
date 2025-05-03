import { NextRequest, NextResponse } from 'next/server';

/**
 * Curl Test API
 * 
 * このAPIは、curlコマンド相当の最小限のリクエストでOpenAI APIへの接続をテストするエンドポイントです。
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
  
  console.log('Curl Test API: 環境変数チェック:');
  for (const key of possibleKeys) {
    const value = process.env[key];
    if (value) {
      console.log(`Curl Test API: - ${key}: 存在します (長さ: ${value.length}文字)`);
      return value;
    } else {
      console.log(`Curl Test API: - ${key}: 存在しません`);
    }
  }
  
  // すべての環境変数を出力（デバッグ用）
  console.log('Curl Test API: すべての環境変数キー:');
  Object.keys(process.env).forEach(key => {
    // セキュリティのため、キー名のみを出力
    console.log(`Curl Test API: - ${key}`);
  });
  
  return null;
};

export async function GET(request: NextRequest) {
  try {
    console.log('Curl Test API: リクエスト受信');
    
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      console.error('Curl Test API: APIキーが見つかりません');
      return NextResponse.json(
        { 
          error: 'APIキーが見つかりません',
          message: 'Vercelダッシュボードで環境変数OPENAI_API_KEYが正しく設定されているか確認してください。'
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
    
    console.log('Curl Test API: curl相当のテスト開始');
    
    // 最もシンプルなリクエスト
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // レスポンスの詳細情報を取得
    const responseText = await response.text();
    
    console.log('Curl Test API: APIレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()]),
      body_preview: responseText.substring(0, 200)
    });
    
    if (!response.ok) {
      console.error('Curl Test API: APIエラー', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      return NextResponse.json(
        {
          error: `APIエラー: ${response.status} ${response.statusText}`,
          response_body: responseText
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
    
    // 正常なレスポンスの場合はJSONとしてパース
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Curl Test API: JSONパースエラー', parseError);
      return NextResponse.json(
        {
          error: 'JSONパースエラー',
          response_body: responseText
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
    
    return NextResponse.json(
      {
        status: response.status,
        ok: response.ok,
        models_count: jsonData.data?.length || 0,
        models_preview: jsonData.data?.slice(0, 5).map((model: any) => model.id) || [],
        full_response: jsonData
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
    console.error('Curl Test API: 例外発生', {
      message: e.message,
      name: e.name,
      stack: e.stack
    });
    
    return NextResponse.json(
      {
        error: `例外: ${e.message}`,
        stack: e.stack,
        name: e.name
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
