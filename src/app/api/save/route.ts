import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化（実行時のみ）
let supabase: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not set');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, summary, user_id, url } = body;

    if (!text || !summary || !user_id) {
      return NextResponse.json(
        { detail: "テキスト、要約、ユーザーIDは必須です" },
        { status: 400 }
      );
    }

    // Supabaseクライアントを取得
    const supabaseClient = getSupabaseClient();
    
    // summariesテーブルにデータを挿入
    const { data, error } = await supabaseClient.from("summaries").insert({
      original_text: text,
      summary: summary,
      user_id: user_id,
      url: url || null
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { detail: `保存に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (e: any) {
    console.error('Save API error:', e);
    return NextResponse.json(
      { detail: `保存中にエラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
