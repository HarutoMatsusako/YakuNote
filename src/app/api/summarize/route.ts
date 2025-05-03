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

// 環境変数のデバッグ強化
const getOpenAIApiKey = () => {
  // 可能性のある環境変数名をすべて試す
  const possibleKeys = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'OPENAI_KEY',
    'NEXT_PUBLIC_OPENAI_KEY'
  ];
  
  console.log('Summarize API: 環境変数チェック:');
  for (const key of possibleKeys) {
    const value = process.env[key];
    if (value) {
      console.log(`Summarize API: - ${key}: 存在します (長さ: ${value.length}文字)`);
      return value;
    } else {
      console.log(`Summarize API: - ${key}: 存在しません`);
    }
  }
  
  // すべての環境変数を出力（デバッグ用）
  console.log('Summarize API: すべての環境変数キー:');
  Object.keys(process.env).forEach(key => {
    // セキュリティのため、キー名のみを出力
    console.log(`Summarize API: - ${key}`);
  });
  
  return null;
};

const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      console.error('Summarize API: OpenAIクライアント初期化エラー: APIキーが設定されていません');
      throw new Error('OpenAI API key is not set');
    }
    
    console.log('Summarize API: OpenAIクライアント初期化: APIキー確認OK');
    
    // タイムアウトとリトライ設定を追加
    openaiClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.openai.com/v1',
      timeout: 60000, // 60秒のタイムアウト
      maxRetries: 3   // 最大3回リトライ
    });
  }
  return openaiClient;
};

export async function POST(request: NextRequest) {
  try {
    console.log('Summarize API: リクエスト受信');
    
    // リクエストボディをデバッグ
    const requestText = await request.text();
    console.log('Summarize API: リクエスト本文', requestText);
    
    // JSONとして解析
    let body;
    try {
      body = JSON.parse(requestText);
      console.log('Summarize API: JSONパース成功', body);
    } catch (parseError) {
      console.error('Summarize API: JSONパースエラー', parseError);
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
      console.error('Summarize API: テキストが指定されていません');
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

    // テキストの長さを制限（より小さな値に設定）
    const max_chars = 4000; // 軽量化のため4000文字に制限
    const truncated_text = text.length > max_chars 
      ? text.substring(0, max_chars) + "...(テキストが長すぎるため、一部のみを要約しています)"
      : text;
    
    console.log('Summarize API: テキスト長', text.length);
    console.log('Summarize API: 切り詰め後のテキスト長', truncated_text.length);

    // OpenAIクライアントを取得
    const openai = getOpenAIClient();
    
    // OpenAI APIを使用して要約
    console.log('Summarize API: OpenAI API呼び出し開始');
    let response;
    
    // APIキーを取得
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not set');
    }
    
    try {
      // リクエストの詳細情報をログに出力
      console.log('Summarize API: OpenAI APIリクエスト詳細:', {
        model: "gpt-3.5-turbo-0125",
        messages_count: 2,
        system_content_length: "以下の文章を要約してください。簡潔にまとめてください。".length,
        user_content_length: truncated_text.length,
        max_tokens: 1000,
        temperature: 0.7
      });
      
      // 最初に新しいモデルを試す
      console.log('Summarize API: 新しいモデル(gpt-3.5-turbo-0125)で試行');
      
      // 直接fetchを使用してレスポンスを詳細にチェック
      const fetchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo-0125",
          messages: [
            { role: "system", content: "以下の文章を要約してください。簡潔にまとめてください。" },
            { role: "user", content: truncated_text }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });
      
      // レスポンスの詳細情報をログに出力
      console.log('Summarize API: OpenAI APIレスポンス状態:', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        ok: fetchResponse.ok
      });
      
      if (!fetchResponse.ok) {
        const errorBody = await fetchResponse.text();
        console.error('Summarize API: OpenAI APIエラー詳細:', {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          body: errorBody
        });
        throw new Error(`OpenAI API error: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      
      const jsonResponse = await fetchResponse.json();
      response = jsonResponse;
      
      // レスポンスの詳細情報をログに出力
      console.log('Summarize API: OpenAI APIレスポンス詳細:', {
        model: response.model,
        choices_count: response.choices?.length || 0,
        content_length: response.choices?.[0]?.message?.content?.length || 0,
        finish_reason: response.choices?.[0]?.finish_reason
      });
      
      console.log('Summarize API: 新しいモデルでの呼び出し成功');
    } catch (modelError) {
      console.error('Summarize API: 新しいモデルでエラー発生、安定版にフォールバック', modelError);
      
      try {
        // 安定版モデルにフォールバック
        console.log('Summarize API: 安定版モデル(gpt-3.5-turbo)にフォールバック');
        
        // 直接fetchを使用してレスポンスを詳細にチェック
        const fetchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        
        // レスポンスの詳細情報をログに出力
        console.log('Summarize API: フォールバックAPIレスポンス状態:', {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          ok: fetchResponse.ok
        });
        
        if (!fetchResponse.ok) {
          const errorBody = await fetchResponse.text();
          console.error('Summarize API: フォールバックAPIエラー詳細:', {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            body: errorBody
          });
          throw new Error(`OpenAI API error: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        
        const jsonResponse = await fetchResponse.json();
        response = jsonResponse;
        
        // レスポンスの詳細情報をログに出力
        console.log('Summarize API: フォールバックAPIレスポンス詳細:', {
          model: response.model,
          choices_count: response.choices?.length || 0,
          content_length: response.choices?.[0]?.message?.content?.length || 0,
          finish_reason: response.choices?.[0]?.finish_reason
        });
        
        console.log('Summarize API: 安定版モデルでの呼び出し成功');
      } catch (fallbackError) {
        console.error('Summarize API: フォールバックモデルでもエラー発生', fallbackError);
        throw fallbackError; // 再スロー
      }
    }
    console.log('Summarize API: OpenAI API呼び出し完了');

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
    // より詳細なエラーログ
    console.error('Summarize API error details:', {
      message: e.message,
      name: e.name,
      stack: e.stack,
      cause: e.cause
    });
    
    // APIキーが設定されていない場合の特別なエラーメッセージ
    const errorMessage = e.message === 'OpenAI API key is not set' 
      ? 'OpenAI APIキーが設定されていません。環境変数を確認してください。' 
      : `要約中にエラーが発生しました: ${e.message}`;
    
    return NextResponse.json(
      { detail: errorMessage },
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
