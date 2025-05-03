import { NextRequest, NextResponse } from 'next/server';

/**
 * Direct Test API
 * 
 * このAPIは、OpenAI APIへの接続をfetchを使って直接テストするエンドポイントです。
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 環境変数のデバッグ
const debugEnvironmentVariables = () => {
  console.log('Direct Test API: 環境変数一覧:');
  Object.keys(process.env).forEach(key => {
    if (key.includes('OPENAI') || key.includes('API')) {
      console.log(`Direct Test API: - ${key}: ${key === 'OPENAI_API_KEY' ? '存在します' : '存在しません'}`);
    }
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const firstChars = apiKey.substring(0, 4);
    const lastChars = apiKey.substring(apiKey.length - 4);
    console.log(`Direct Test API: APIキー確認: ${firstChars}...${lastChars} (長さ: ${apiKey.length}文字)`);
    return apiKey;
  } else {
    console.error('Direct Test API: APIキーが設定されていません');
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('Direct Test API: リクエスト受信');
    
    const apiKey = debugEnvironmentVariables();
    if (!apiKey) {
      console.error('Direct Test API: APIキーが設定されていません');
      return NextResponse.json(
        { error: 'APIキーが設定されていません' }, 
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
    
    console.log('Direct Test API: APIキー確認OK、リクエスト開始');
    
    // 直接fetchでリクエスト
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct Test API: APIエラー', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return NextResponse.json(
        { 
          error: `APIエラー: ${response.status} ${response.statusText}`,
          details: errorText
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
    
    const data = await response.json();
    console.log('Direct Test API: 成功', {
      modelsCount: data.data?.length || 0
    });
    
    return NextResponse.json(
      { 
        success: true, 
        models: data.data?.slice(0, 5) || []
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
    console.error('Direct Test API: 例外発生', {
      message: e.message,
      name: e.name,
      stack: e.stack
    });
    return NextResponse.json(
      { 
        error: `例外: ${e.message}`,
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
