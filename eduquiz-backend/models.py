from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base

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