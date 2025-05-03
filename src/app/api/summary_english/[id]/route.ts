import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

// OpenAIクライアントの初期化（実行時のみ）
let openaiClient: OpenAI | null = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not set');
    }
    
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
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
          { detail: "Summary not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { detail: `Error retrieving summary: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { detail: "Summary not found" },
        { status: 404 }
      );
    }
    
    // 元のテキストを英語で要約
    const original_text = data.original_text as string;
    
    // テキストの長さを制限
    const max_chars = 12000;
    const truncated_text = original_text.length > max_chars 
      ? original_text.substring(0, max_chars) + "...(Text is too long, only summarizing the first part)"
      : original_text;
    
    // OpenAIクライアントを取得
    const openai = getOpenAIClient();
    
    // 英語で要約
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Please summarize the following text in English." },
        { role: "user", content: truncated_text }
      ]
    });
    
    const english_summary = response.choices[0].message.content;
    
    // 英語の要約で元の要約を置き換え
    const result = { ...data };
    result.summary = english_summary;
    
    return NextResponse.json({ summary: result });
  } catch (e: any) {
    console.error('Summary English API error:', e);
    return NextResponse.json(
      { detail: `Error retrieving summary: ${e.message}` },
      { status: 500 }
    );
  }
}
