from database import SessionLocal
from models import History, Analytics
from datetime import datetime, timezone

def save_history(user_email, video_url, title, score, total_questions):
    db = SessionLocal()

    # Save history
    record = History(
        user_email=user_email,
        video_url=video_url,
        video_title=title,
        score=score,
        total_questions=total_questions
    )
    db.add(record)

    # Update analytics
    today = datetime.now(timezone.utc).date().isoformat()

    analytics = db.query(Analytics).filter(
        Analytics.user_email == user_email,
        Analytics.date == today
    ).first()

    if analytics:
        analytics.quizzes_taken += 1
        analytics.total_score += score
    else:
        analytics = Analytics(
            user_email=user_email,
            date=today,
            quizzes_taken=1,
            total_score=score
        )
        db.add(analytics)

    db.commit()
    db.close()

    return {"message": "History saved"}


def get_history(user_email):
    db = SessionLocal()

    data = db.query(History).filter(
        History.user_email == user_email
    ).order_by(History.created_at.desc()).all()

    result = [
        {
            "title": d.video_title,
            "url": d.video_url,
            "score": d.score,
            "total": d.total_questions,
            "date": d.created_at
        }
        for d in data
    ]

    db.close()
    return result


def get_analytics(user_email):
    db = SessionLocal()

    data = db.query(Analytics).filter(
        Analytics.user_email == user_email
    ).all()

    result = [
        {
            "date": d.date,
            "quizzes": d.quizzes_taken,
            "score": d.total_score
        }
        for d in data
    ]

    db.close()
    return result