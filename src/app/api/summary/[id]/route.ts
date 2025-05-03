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
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { detail: "要約IDが指定されていません" },
        { status: 400 }
      );
    }
    
    // Supabaseクライアントを取得
    const supabaseClient = getSupabaseClient();
    
    // 要約IDに基づいて要約の詳細を取得
    const { data, error } = await supabaseClient
      .from("summaries")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { detail: "要約が見つかりませんでした" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { detail: `要約の取得に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { detail: "要約が見つかりませんでした" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ summary: data });
  } catch (e: any) {
    console.error('Summary API error:', e);
    return NextResponse.json(
      { detail: `要約の取得中にエラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { detail: "要約IDが指定されていません" },
        { status: 400 }
      );
    }
    
    // Supabaseクライアントを取得
    const supabaseClient = getSupabaseClient();
    
    // 要約IDに基づいて要約を削除
    const { data, error } = await supabaseClient
      .from("summaries")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { detail: `要約の削除に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: "success",
      message: "要約が削除されました"
    });
  } catch (e: any) {
    console.error('Summary delete API error:', e);
    return NextResponse.json(
      { detail: `要約の削除中にエラーが発生しました: ${e.message}` },
      { status: 500 }
    );
  }
}
