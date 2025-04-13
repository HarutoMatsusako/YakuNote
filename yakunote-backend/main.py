from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

class TextInput(BaseModel):
    text: str

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
