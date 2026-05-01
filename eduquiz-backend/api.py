from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from quiz_generator import QuizGenerator
from rag_engine import RAGEngine
import os
from dotenv import load_dotenv
from models import Base
from database import engine
from auth import create_user, authenticate_user
from notes import save_note
from notes import get_user_notes
from groq import Groq
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import verify_token
from typing import List, Optional

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class VideoRequest(BaseModel):
    url: str
    bloom_levels: Optional[List[str]] = ["Remember", "Understand", "Apply"]
    difficulty: Optional[str] = "Medium"
    num_questions: Optional[int] = 5
    model: Optional[str] = "llama-3.3-70b-versatile" 

Base.metadata.create_all(bind=engine)
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    email = verify_token(token)

    if email is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return email

@app.post("/generate-quiz")
def generate_quiz(data: VideoRequest, user: str = Depends(get_current_user)):
    
    try:
        

        rag = RAGEngine()
        chunks, title, metadata = rag.process_video(data.url)

        qgen = QuizGenerator(api_key, model=data.model) 

        questions = qgen.generate_quiz(
            rag_engine=rag,
            num_questions=data.num_questions,
            bloom_levels=data.bloom_levels,
            difficulty=data.difficulty
        )
        client = Groq(api_key=api_key)

        preview_text = " ".join(chunks[:3])[:1200]

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # or selected_model
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert educator. Generate a detailed, structured summary of the given transcript."
                },
                {
                    "role": "user",
                    "content": preview_text
                }
            ],
            temperature=0.3,
            max_tokens=400
        )

        summary = response.choices[0].message.content
        save_note(user, data.url, title, summary)
        return {
            "title": title,
            "questions": questions,
            "summary": summary
        }
        

    except Exception as e:
        return {"error": str(e)}
    


@app.get("/notes")
def fetch_notes(user: str = Depends(get_current_user)):
    return get_user_notes(user)


##############
class NoteUpdate(BaseModel):
    id: int
    content: str


from notes import update_note

@app.put("/notes")
def edit_note(data: NoteUpdate, user: str = Depends(get_current_user)):
    return update_note(data.id, data.content)
##################


@app.post("/register")
def register(user: UserCreate):
    return create_user(user.email, user.password)

@app.post("/login")
def login(user: UserLogin):
    return authenticate_user(user.email, user.password)