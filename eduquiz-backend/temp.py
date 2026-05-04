from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

db.execute(text("DELETE FROM notes;"))
db.commit()
print("Table cleared")

db.close()