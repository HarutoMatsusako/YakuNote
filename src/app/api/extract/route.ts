import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract API
 * 
 * このAPIは、テキストを受け取るためのシンプルなエンドポイントです。
 * POSTメソッドのみをサポートし、受け取ったテキストをログに出力します。
 * 
 * @version 1.0.0
 * @date 2025-05-03
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;
    
    // 受け取ったテキストをログに出力
    console.log('Received text:', text);
    
    // シンプルなレスポンスを返す
    return NextResponse.json({ message: "Received" });
  } catch (e: any) {
    console.error('Extract API error:', e);
    return NextResponse.json(
      { error: `エラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
