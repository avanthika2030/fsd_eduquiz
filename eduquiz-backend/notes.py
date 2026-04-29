from database import SessionLocal
from models import Note

def save_note(user_email, video_url, title, content):
    db = SessionLocal()

    note = Note(
        user_email=user_email,
        video_url=video_url,
        video_title=title,
        content=content
    )

    db.add(note)
    db.commit()
    db.close()

    return {"message": "Note saved"}


def get_user_notes(user_email):
    db = SessionLocal()

    notes = db.query(Note).filter(Note.user_email == user_email).all()

    result = [
        {
            "id": n.id,
            "title": n.video_title,
            "content": n.content,
            "url": n.video_url
        }
        for n in notes
    ]

    db.close()
    return result


def update_note(note_id, new_content):
    db = SessionLocal()

    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        db.close()
        return {"error": "Note not found"}

    note.content = new_content
    db.commit()
    db.close()

    return {"message": "Note updated"}