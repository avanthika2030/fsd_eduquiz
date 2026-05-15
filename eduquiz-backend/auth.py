from passlib.context import CryptContext
from models import User
from database import SessionLocal
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
import os
import re
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        return email
    except JWTError:
        return None
    


def validate_email(email: str):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w{2,}$'
    if not re.match(pattern, email):
        return "Invalid email format"
    return None

def validate_password(password: str):
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one number"
    return None 


def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def create_user(email, password):
    db = SessionLocal()

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.close()
        return {"error": "User already exists"}
    email_error = validate_email(email)
    if email_error:
        return {"error": email_error}
    pwd_error = validate_password(password)
    if pwd_error:
        return {"error": pwd_error}

    user = User(email=email, password=hash_password(password))
    db.add(user)
    db.commit()
    print("PASSWORD VALUE:", password)
    print("PASSWORD LENGTH:", len(password))
    print("TYPE:", type(password))
    db.close()

    return {"message": "User created"}


def authenticate_user(email, password):
    db = SessionLocal()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password):
        db.close()
        return {"error": "Invalid credentials"}

    token = create_access_token({"sub": user.email})

    db.close()


    return {
        "access_token": token,
        "token_type": "bearer"
    }

def reset_password(email, new_password):

    db = SessionLocal()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        db.close()
        return {"error": "User not found"}

    pwd_error = validate_password(new_password)

    if pwd_error:
        db.close()
        return {"error": pwd_error}

    user.password = hash_password(new_password)

    db.commit()
    db.close()

    return {"message": "Password updated successfully"}