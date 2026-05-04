from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from database import Base
from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    video_url = Column(String)
    video_title = Column(String)
    content = Column(Text)


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    video_url = Column(String)
    video_title = Column(String)
    score = Column(Integer)
    total_questions = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    date = Column(String) 
    quizzes_taken = Column(Integer, default=0)
    total_score = Column(Integer, default=0)