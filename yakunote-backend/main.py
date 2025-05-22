from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
import os
import trafilatura
import requests
from datetime import datetime
import requests

today_summary_date = datetime.now().date()
summary_count = 0

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Supabaseクライアントの初期化
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client = create_client(supabase_url, supabase_key)

app = FastAPI()

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのオリジン
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのHTTPヘッダーを許可
)

class TextInput(BaseModel):
    text: str

class UrlInput(BaseModel):
    url: HttpUrl

class SummaryInput(BaseModel):
    text: str
    summary: str
    user_id: str
    url: str = None

class TranslateInput(BaseModel):
    text: str
    targetLang: str  # "ja" or "en"



@app.post("/extract")
def extract_content(input: UrlInput):
    try:
        # URLからコンテンツを取得
        response = requests.get(str(input.url), timeout=10)
        response.raise_for_status()  # エラーチェック
        
        
        # HTMLから本文を抽出
        content = trafilatura.extract(response.text)
        
        if not content:
            raise HTTPException(status_code=400, detail="コンテンツを抽出できませんでした")
        
        return {"text": content, "url": str(input.url)}
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"URLからのコンテンツ取得に失敗しました: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"コンテンツ抽出中にエラーが発生しました: {str(e)}")

@app.post("/summarize")
def summarize(input: TextInput):
    global today_summary_date, summary_count

    # 日付が変わったらリセット
    now = datetime.now().date()
    if now != today_summary_date:
        today_summary_date = now
        summary_count = 0

    # 要約回数チェック
    if summary_count >= 10:
        raise HTTPException(status_code=429, detail="本日の要約可能回数（10回）に達しました")

    summary_count += 1

    # ↓ここから今までの要約ロジックを書く
    max_chars = 12000
    truncated_text = input.text[:max_chars] if len(input.text) > max_chars else input.text

    if len(input.text) > max_chars:
        truncated_text += "...(テキストが長すぎるため、一部のみを要約しています)"

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "以下の文章を要約してください。重要なポイントを漏らさず、詳細に要約してください。結果は長めでもいいです。"},
                {"role": "user", "content": truncated_text}
            ]
        )
        summary = response.choices[0].message.content

        if len(input.text) > max_chars:
            summary += "\n\n(注: 元のテキストが長すぎるため、最初の部分のみを要約しています)"

        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"要約中にエラーが発生しました: {str(e)}")
    
@app.post("/save")
def save_summary(input: SummaryInput):
    try:
        # summariesテーブルにデータを挿入
        data = supabase_client.table("summaries").insert({
            "original_text": input.text,
            "summary": input.summary,
            "user_id": input.user_id,
            "url": input.url
        }).execute()
        
        # 成功レスポンス
        return {"status": "success"}
    except Exception as e:
        # エラーハンドリング
        raise HTTPException(status_code=500, detail=f"保存に失敗しました: {str(e)}")

@app.get("/summaries/{user_id}")
def get_summaries(user_id: str, skip: int = 0, limit: int = 10):
    try:
        # ユーザーIDに基づいて要約を取得
        response = supabase_client.table("summaries") \
            .select("id, summary, url, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .range(skip, skip + limit - 1) \
            .execute()
        
        # 総件数を取得
        count_response = supabase_client.table("summaries") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .execute()
        
        total_count = count_response.count if hasattr(count_response, 'count') else 0
        
        return {
            "summaries": response.data,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        # エラーハンドリング
        raise HTTPException(status_code=500, detail=f"要約の取得に失敗しました: {str(e)}")

@app.get("/summary/{summary_id}")
def get_summary(summary_id: str):
    try:
        # 要約IDに基づいて要約の詳細を取得
        response = supabase_client.table("summaries") \
            .select("*") \
            .eq("id", summary_id) \
            .limit(1) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="要約が見つかりませんでした")
        
        return {"summary": response.data[0]}
    except Exception as e:
        # エラーハンドリング
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"要約の取得に失敗しました: {str(e)}")

@app.delete("/summary/{summary_id}")
def delete_summary(summary_id: str):
    try:
        # 要約IDに基づいて要約を削除
        response = supabase_client.table("summaries") \
            .delete() \
            .eq("id", summary_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="要約が見つかりませんでした")
        
        return {"status": "success", "message": "要約が削除されました"}
    except Exception as e:
        # エラーハンドリング
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"要約の削除に失敗しました: {str(e)}")

@app.post("/summarize_english")
def summarize_english(input: TextInput):
    # テキストの長さを制限（約8000トークン程度に制限）
    max_chars = 12000
    truncated_text = input.text[:max_chars] if len(input.text) > max_chars else input.text
    
    if len(input.text) > max_chars:
        truncated_text += "...(Text is too long, only summarizing the first part)"
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Please summarize the following text in English. Include all important points and provide a detailed summary. It's okay if the result is lengthy."},
                {"role": "user", "content": truncated_text}
            ]
        )
        summary = response.choices[0].message.content
        
        # 元のテキストが切り詰められた場合はその旨を追加
        if len(input.text) > max_chars:
            summary += "\n\n(Note: The original text was too long, only the first part was summarized)"
            
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during summarization: {str(e)}")



@app.get("/summary_english/{summary_id}")
def get_summary_english(summary_id: str):
    try:
        # 要約IDに基づいて要約の詳細を取得
        response = supabase_client.table("summaries") \
            .select("*") \
            .eq("id", summary_id) \
            .limit(1) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Summary not found")
        
        summary_data = response.data[0]
        
        # 元のテキストを英語で要約
        original_text = summary_data["original_text"]
        
        # テキストの長さを制限
        max_chars = 12000
        truncated_text = original_text[:max_chars] if len(original_text) > max_chars else original_text
        
        # 英語で要約
        openai_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Please summarize the following text in English. Include all important points and provide a detailed summary. It's okay if the result is lengthy."},
                {"role": "user", "content": truncated_text}
            ]
        )
        english_summary = openai_response.choices[0].message.content
        
        # 英語の要約で元の要約を置き換え
        summary_data["summary"] = english_summary
        
        return {"summary": summary_data}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error retrieving summary: {str(e)}")
    
  

@app.post("/translate")
def translate_text(input: TranslateInput):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"以下の文章を{input.targetLang}語に翻訳してください。"},
                {"role": "user", "content": input.text}
            ]
        )
        translated = response.choices[0].message.content
        return {"translatedText": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"翻訳中にエラーが発生しました: {str(e)}")
