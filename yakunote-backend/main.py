from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
import os
import trafilatura
import requests

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

@app.post("/extract")
def extract_content(input: UrlInput):
    try:
        # URLからコンテンツを取得
        response = requests.get(str(input.url))
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
    # テキストの長さを制限（約8000トークン程度に制限）
    max_chars = 12000
    truncated_text = input.text[:max_chars] if len(input.text) > max_chars else input.text
    
    if len(input.text) > max_chars:
        truncated_text += "...(テキストが長すぎるため、一部のみを要約しています)"
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "以下の文章を要約してください。"},
                {"role": "user", "content": truncated_text}
            ]
        )
        summary = response.choices[0].message.content
        
        # 元のテキストが切り詰められた場合はその旨を追加
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
