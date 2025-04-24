from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Supabaseクライアントの初期化
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_client = create_client(supabase_url, supabase_key)

app = FastAPI()

class TextInput(BaseModel):
    text: str

class SummaryInput(BaseModel):
    text: str
    summary: str
    user_id: str

@app.post("/summarize")
def summarize(input: TextInput):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "以下の文章を要約してください。"},
            {"role": "user", "content": input.text}
        ]
    )
    summary = response.choices[0].message.content
    return {"summary": summary}

@app.post("/save")
def save_summary(input: SummaryInput):
    try:
        # summariesテーブルにデータを挿入
        data = supabase_client.table("summaries").insert({
            "original_text": input.text,
            "summary": input.summary,
            "user_id": input.user_id
        }).execute()
        
        # 成功レスポンス
        return {"status": "success"}
    except Exception as e:
        # エラーハンドリング
        raise HTTPException(status_code=500, detail=f"保存に失敗しました: {str(e)}")
