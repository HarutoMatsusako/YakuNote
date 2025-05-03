import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { detail: "URLが指定されていません" },
        { status: 400 }
      );
    }

    // URLからコンテンツを取得
    const response = await fetch(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: `URLからのコンテンツ取得に失敗しました: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    
    // HTMLから本文を抽出
    const $ = cheerio.load(html);
    
    // メタデータを削除
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    $('aside').remove();
    
    // 本文を抽出（主要なコンテンツを含む要素を優先）
    let content = '';
    
    // 記事の本文を含む可能性が高い要素を探す
    const mainContent = $('article, main, .content, .post, .entry, .post-content, .article-content');
    
    if (mainContent.length > 0) {
      // 最も大きいコンテンツブロックを選択
      let maxLength = 0;
      let bestElement: any = null;
      
      mainContent.each((_, element) => {
        const text = $(element).text().trim();
        if (text.length > maxLength) {
          maxLength = text.length;
          bestElement = element;
        }
      });
      
      if (bestElement) {
        content = $(bestElement).text().trim();
      }
    }
    
    // メインコンテンツが見つからない場合は、bodyから直接テキストを抽出
    if (!content) {
      content = $('body').text().trim();
      
      // 不要な空白や改行を整理
      content = content.replace(/\s+/g, ' ');
    }
    
    if (!content) {
      return NextResponse.json(
        { detail: "コンテンツを抽出できませんでした" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ text: content, url });
  } catch (e: any) {
    console.error('Extract API error:', e);
    return NextResponse.json(
      { detail: `エラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
