import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extract API
 * 
 * このAPIは、指定されたURLからテキストを抽出するためのエンドポイントです。
 * POSTメソッドのみをサポートし、URLからテキストを抽出して返します。
 * 
 * @version 1.1.0
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
    
    console.log('Extract API: URLからテキストを抽出します:', url);
    
    // URLからHTMLを取得
    let response;
    try {
      response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3'
        },
        timeout: 10000 // 10秒でタイムアウト
      });
      
      // ステータスコードをチェック
      if (response.status !== 200) {
        console.error(`Extract API: HTTPエラー: ${response.status}`);
        return NextResponse.json(
          { error: `URLからのデータ取得に失敗しました: HTTPステータス ${response.status}` },
          { status: 500 }
        );
      }
      
      console.log('Extract API: HTMLの取得に成功しました');
    } catch (fetchError: any) {
      console.error('Extract API: URLからのデータ取得に失敗しました:', fetchError.message);
      return NextResponse.json(
        { error: `URLからのデータ取得に失敗しました: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    // HTMLからテキストを抽出
    const html = response.data;
    const $ = cheerio.load(html);
    
    // 不要な要素を削除
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, .header, .footer, .nav, .sidebar, .ad, .advertisement, .banner').remove();
    
    // 本文と思われる部分を抽出
    let mainContent = '';
    
    // 一般的な本文コンテナのセレクタを試す
    const contentSelectors = [
      'article', 'main', '.content', '.main', '#content', '#main', '.post', '.entry', '.article',
      '.post-content', '.entry-content', '.article-content', '[role="main"]', '.body', '#body'
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text().trim();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }
    
    // 本文が見つからない場合はbodyから抽出
    if (!mainContent || mainContent.trim().length < 100) {
      mainContent = $('body').text();
    }
    
    // テキストの整形
    const extractedText = mainContent
      .replace(/\s+/g, ' ')  // 連続する空白を1つにまとめる
      .replace(/\n+/g, '\n') // 連続する改行を1つにまとめる
      .trim();               // 前後の空白を削除
    
    // 抽出したテキストをログに出力
    console.log('Extract API: テキスト抽出完了');
    console.log('Extract API: 抽出されたテキスト長:', extractedText.length);
    console.log('Extract API: 抽出されたテキスト（先頭100文字）:', extractedText.substring(0, 100));
    
    // 抽出したテキストが空でないか確認
    if (!extractedText || extractedText.trim().length === 0) {
      console.error('Extract API: 抽出されたテキストが空です');
      return NextResponse.json(
        { error: "テキストの抽出に失敗しました。ページからテキストを抽出できませんでした。" },
        { status: 500 }
      );
    }
    
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
