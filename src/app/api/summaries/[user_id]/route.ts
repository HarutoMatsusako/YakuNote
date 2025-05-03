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

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  try {
    const user_id = params.user_id;
    
    if (!user_id) {
      return NextResponse.json(
        { detail: "ユーザーIDが指定されていません" },
        { status: 400 }
      );
    }
    
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Supabaseクライアントを取得
    const supabaseClient = getSupabaseClient();
    
    // ユーザーIDに基づいて要約を取得
    const { data, error, count } = await supabaseClient
      .from("summaries")
      .select("id, summary, url, created_at", { count: 'exact' })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { detail: `要約の取得に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      summaries: data,
      total: count || 0,
      skip,
      limit
    });
  } catch (e: any) {
    console.error('Summaries API error:', e);
    return NextResponse.json(
      { detail: `要約の取得中にエラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
