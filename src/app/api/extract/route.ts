import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract API
 * 
 * このAPIは、指定されたURLからテキストを抽出するためのエンドポイントです。
 * POSTメソッドのみをサポートし、URLからテキストを抽出して返します。
 * 
 * @version 1.0.1
 * @date 2025-05-03
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;
    
    if (!url) {
      console.error('Extract API error: URLが指定されていません');
      return NextResponse.json(
        { error: "URLが指定されていません" },
        { status: 400 }
      );
    }
    
    // URLからテキストを抽出する処理
    // 実際のプロジェクトでは、ここでURLからテキストを抽出する処理を実装します
    // このサンプルでは、ダミーテキストを返します
    const extractedText = `${url}から抽出されたテキストです。これはサンプルテキストです。`;
    
    // 抽出したテキストをログに出力
    console.log('Extracted text from URL:', url);
    console.log('Extracted content length:', extractedText.length);
    console.log('Extracted content preview:', extractedText.substring(0, 100));
    
    // 抽出したテキストを返す
    return NextResponse.json({ text: extractedText });
  } catch (e: any) {
    console.error('Extract API error:', e);
    return NextResponse.json(
      { error: `テキスト抽出中にエラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
