import { NextRequest, NextResponse } from 'next/server';

// OPTIONSメソッド（CORS対応）
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

// 環境変数からOpenAI APIキーを取得
const getOpenAIApiKey = () => {
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

  // すべての環境変数名（キー）を出力
  console.log('Test API: すべての環境変数キー:');
  Object.keys(process.env).forEach(key => {
    console.log(`Test API: - ${key}`);
  });

  return null;
};

export async function GET(request: NextRequest) {
  try {
    console.log('Test API: リクエスト受信');

    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      console.error('Test API: APIキーが設定されていません');
      throw new Error('OpenAI API key is not set');
    }

    // DNSチェック（HEAD）
    try {
      console.log('Test API: DNS解決テスト開始');
      const dnsRes = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      console.log('Test API: DNS解決テスト完了 - ステータス:', dnsRes.status);
    } catch (err: any) {
      console.error('Test API: DNSエラー:', { message: err.message, name: err.name });
    }

    // モデル一覧のGETチェック
    try {
      console.log('Test API: モデル取得テスト開始');
      const modelRes = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      console.log('Test API: モデル取得完了 - ステータス:', modelRes.status);

      if (modelRes.ok) {
        const modelText = await modelRes.text();
        console.log('Test API: モデル一覧長さ:', modelText.length);
      }
    } catch (err: any) {
      console.error('Test API: モデル取得エラー:', { message: err.message, name: err.name });
    }

    // 要約テスト（chat/completions）
    console.log('Test API: 要約fetch開始');
    try {
      const fetchRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      console.log('Test API: fetch完了 - ステータス:', fetchRes.status, fetchRes.statusText);

      const resText = await fetchRes.text();
      console.log('Test API: レスポンス本文:', resText);

      if (!fetchRes.ok) {
        console.error('Test API: APIエラー', {
          status: fetchRes.status,
          statusText: fetchRes.statusText,
          body: resText
        });
        throw new Error(`API error: ${fetchRes.status} ${fetchRes.statusText} - ${resText}`);
      }

      const data = JSON.parse(resText);
      const content = data?.choices?.[0]?.message?.content ?? 'No content returned';

      return NextResponse.json({
        result: content,
        model: data?.model ?? 'unknown',
        status: 'success'
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    } catch (fetchErr: any) {
      console.error('Test API: fetch例外詳細:', {
        message: fetchErr.message,
        name: fetchErr.name,
        stack: fetchErr.stack,
        cause: fetchErr?.cause,
        type: fetchErr?.type,
        code: fetchErr?.code
      });

      if (fetchErr.message?.includes('fetch') || fetchErr.message?.includes('network')) {
        console.error('Test API: ネットワークエラーと判断');
        throw new Error(`Network error: ${fetchErr.message}`);
      }

      throw fetchErr;
    }

  } catch (e: any) {
    console.error('Test API: 最終エラー詳細:', {
      message: e?.message,
      name: e?.name,
      stack: e?.stack,
      cause: e?.cause,
      ...Object.getOwnPropertyNames(e ?? {}).reduce((acc, prop) => {
        acc[prop] = e[prop];
        return acc;
      }, {} as Record<string, any>)
    });

    return NextResponse.json({
      detail: `テストエラー: ${e.message}`,
      error_type: e.name,
      status: 'error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}
