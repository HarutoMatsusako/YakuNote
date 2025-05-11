import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Supabaseクライアントの初期化（実行時のみ）
let supabase: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // 環境変数のチェックと詳細なログ出力
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      throw new Error('Supabase credentials are not set');
    }
    
    console.log('Initializing Supabase client with URL:', supabaseUrl);
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
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is not set');
    }
    
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
};

// 環境変数の状態をチェックするヘルパー関数
const checkEnvironmentVariables = () => {
  const variables = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '[設定済み]' : '[未設定]',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[設定済み]' : '[未設定]',
  };
  
  console.log('Environment variables status:', variables);
  
  return variables;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 環境変数の状態をチェック
  checkEnvironmentVariables();
  
  try {
    const id = params.id;
    
    console.log('Processing request for summary_id:', id);
    
    if (!id) {
      console.error('Summary ID is missing');
      return NextResponse.json(
        { detail: "要約IDが指定されていません" },
        { status: 400 }
      );
    }
    
    // Supabaseクライアントを取得
    let supabaseClient;
    try {
      supabaseClient = getSupabaseClient();
      console.log('Supabase client initialized successfully');
    } catch (clientError: any) {
      console.error('Failed to initialize Supabase client:', clientError);
      return NextResponse.json(
        { detail: `Supabase client initialization failed: ${clientError.message}` },
        { status: 500 }
      );
    }
    
    // 要約IDに基づいて要約の詳細を取得
    console.log('Fetching summary with ID:', id);
    const { data, error } = await supabaseClient
      .from("summaries")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
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
      console.error('No data returned for summary ID:', id);
      return NextResponse.json(
        { detail: "Summary not found" },
        { status: 404 }
      );
    }
    
    console.log('Summary retrieved successfully:', {
      id: data.id,
      has_original_text: !!data.original_text,
      text_length: typeof data.original_text === 'string' ? data.original_text.length : 0
    });
    
    // 元のテキストを英語で要約
    if (!data.original_text || typeof data.original_text !== 'string') {
      console.error('Original text is missing or invalid for summary ID:', id);
      return NextResponse.json(
        { detail: "Original text is missing or invalid in the summary" },
        { status: 400 }
      );
    }
    
    const original_text = data.original_text;
    
    // テキストの長さを制限
    const max_chars = 12000;
    const truncated_text = original_text.length > max_chars 
      ? original_text.substring(0, max_chars) + "...(Text is too long, only summarizing the first part)"
      : original_text;
    
    // OpenAIクライアントを取得
    let openai;
    try {
      openai = getOpenAIClient();
      console.log('OpenAI client initialized successfully');
    } catch (openaiClientError: any) {
      console.error('Failed to initialize OpenAI client:', openaiClientError);
      return NextResponse.json(
        { detail: `OpenAI client initialization failed: ${openaiClientError.message}` },
        { status: 500 }
      );
    }
    
    // 英語で要約
    let english_summary;
    try {
      console.log('Sending request to OpenAI for English summary');
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Please summarize the following text in English." },
          { role: "user", content: truncated_text }
        ]
      });
      
      english_summary = response.choices[0].message.content;
      console.log('Received English summary from OpenAI');
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { detail: `Error generating English summary: ${openaiError.message}` },
        { status: 500 }
      );
    }
    
    // 英語の要約で元の要約を置き換え
    const result = { ...data };
    result.summary = english_summary;
    
    return NextResponse.json({ summary: result });
  } catch (e: any) {
    console.error('Summary English API error:', e);
    console.error('Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    
    return NextResponse.json(
      { detail: `Error retrieving summary: ${e.message}` },
      { status: 500 }
    );
  }
}
