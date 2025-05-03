import { NextRequest, NextResponse } from 'next/server';

/**
 * Environment Test API
 * 
 * このAPIは、環境変数の設定状況をテストするエンドポイントです。
 * 特にOpenAI APIキーの存在と形式を確認します。
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
  
  console.log('Env Test API: 環境変数チェック:');
  for (const key of possibleKeys) {
    const value = process.env[key];
    if (value) {
      console.log(`Env Test API: - ${key}: 存在します (長さ: ${value.length}文字)`);
      return { key, value };
    } else {
      console.log(`Env Test API: - ${key}: 存在しません`);
    }
  }
  
  // すべての環境変数を出力（デバッグ用）
  console.log('Env Test API: すべての環境変数キー:');
  Object.keys(process.env).forEach(key => {
    // セキュリティのため、キー名のみを出力
    console.log(`Env Test API: - ${key}`);
  });
  
  return null;
};

export async function GET(request: NextRequest) {
  try {
    console.log('Env Test API: リクエスト受信');
    
    // 環境変数のみをチェックするエンドポイント
    const apiKeyInfo = getOpenAIApiKey();
    
    if (!apiKeyInfo) {
      console.error('Env Test API: APIキーが見つかりません');
      return NextResponse.json(
        {
          error: 'APIキーが見つかりません',
          env_keys: Object.keys(process.env)
            .filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('TOKEN'))
            .slice(0, 10)
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    const { key, value } = apiKeyInfo;
    
    // APIキーの形式チェック
    const isValidFormat = value.startsWith('sk-') && value.length > 20;
    console.log(`Env Test API: APIキー形式チェック: ${isValidFormat ? '有効' : '無効'}`);
    
    return NextResponse.json(
      {
        key_name: key,
        key_exists: true,
        key_length: value.length,
        key_format_valid: isValidFormat,
        key_preview: `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
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
    console.error('Env Test API: エラー発生', e);
    return NextResponse.json(
      {
        error: e.message,
        stack: e.stack
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
