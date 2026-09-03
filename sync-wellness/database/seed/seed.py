"""
Database seed script — creates demo data for local development.
Run: python database/seed/seed.py
"""
import sys
import os
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from app.database.session import SessionLocal, Base, engine
from app.models import User, Cycle, MoodLog, Symptom, Nutrition, Reminder, ChatHistory
from app.core.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("== Seeding SYNC demo data... ==")

# Clean up existing demo user
existing = db.query(User).filter(User.email == "demo@sync.wellness").first()
if existing:
    db.delete(existing)
    db.commit()

# Create demo user
user = User(
    name="Priya Sharma",
    email="demo@sync.wellness",
    password_hash=get_password_hash("SyncDemo2024!"),
    age=28,
    height=163.0,
    weight=58.0,
    medical_conditions=None,
)
db.add(user)
db.commit()
db.refresh(user)
print("[OK] Demo user created: " + user.email + " (password: SyncDemo2024!)")

# Create cycle records (last 6 months)
today = date.today()
cycle_starts = [
    today - timedelta(days=d) for d in [5, 33, 62, 90, 119, 148]
]
phases = ["menstrual", "follicular", "luteal", "follicular", "ovulation", "luteal"]
for i, start in enumerate(cycle_starts):
    cycle = Cycle(
        user_id=user.id,
        period_start=start,
        period_end=start + timedelta(days=5),
        cycle_length=28 + (i % 3 - 1),  # 27-29 days variation
        period_length=5,
        current_phase=phases[i],
        predicted_next_cycle=start + timedelta(days=28),
    )
    db.add(cycle)
print("[OK] Cycle records created (last 6 months)")

# Create mood logs (last 30 days)
moods = ["happy", "calm", "tired", "anxious", "energetic", "neutral", "irritated", "calm", "happy"]
for i in range(30):
    log_date = today - timedelta(days=i)
    mood = moods[i % len(moods)]
    log = MoodLog(
        user_id=user.id,
        date=log_date,
        mood=mood,
        stress_level=min(10, 3 + (i % 5)),
        energy_level=min(10, 7 - (i % 4)),
        journal=f"Day {i+1} -- Feeling {mood} today. Taking it one step at a time." if i % 3 == 0 else None,
        sentiment_score={"happy": 0.8, "calm": 0.6, "neutral": 0.0, "tired": -0.3,
                         "anxious": -0.7, "irritated": -0.75, "energetic": 0.9}.get(mood, 0.0),
    )
    db.add(log)
print("[OK] Mood logs created (last 30 days)")

# Create symptoms (last 30 days)
symptom_data = [
    ("cramps", 3), ("fatigue", 2), ("headache", 2), ("bloating", 1),
    ("acne", 1), ("back_pain", 2), ("fatigue", 3), ("cramps", 2),
]
for i, (stype, severity) in enumerate(symptom_data):
    s = Symptom(
        user_id=user.id,
        date=today - timedelta(days=i * 3),
        symptom_type=stype,
        severity=severity,
        notes=f"Noted during cycle day {i + 1}" if i % 2 == 0 else None,
    )
    db.add(s)
print("[OK] Symptom records created")

# Create nutrition logs (last 7 days)
for i in range(7):
    n = Nutrition(
        user_id=user.id,
        date=today - timedelta(days=i),
        water_intake=1.5 + (i * 0.2),
        diet_plan="vegetarian",
        notes="Balanced meals with iron-rich foods" if i == 0 else None,
    )
    db.add(n)
print("[OK] Nutrition logs created (last 7 days)")

# Create reminders
reminder_data = [
    ("medicine", "Iron Supplement", "Take iron tablet after breakfast", 8, 0),
    ("water", "Hydration Check", "Time to drink a glass of water!", 12, 0),
    ("water", "Hydration Check", "Time to drink a glass of water!", 17, 0),
    ("period", "Period Due", "Your estimated period start date", 0, 5),
    ("appointment", "Gynecologist Check-up", "Annual wellness visit", 9, 30),
]
for rtype, title, desc, hour, days_ahead in reminder_data:
    r = Reminder(
        user_id=user.id,
        type=rtype,
        title=title,
        description=desc,
        scheduled_time=datetime(today.year, today.month, today.day, hour, 0, tzinfo=timezone.utc) + timedelta(days=days_ahead),
        repeat="daily" if rtype == "water" else "none",
    )
    db.add(r)
print("[OK] Reminders created")

# Create sample chat history
chat_entries = [
    ("What is the follicular phase?",
     "The follicular phase begins on the first day of your period and lasts until ovulation (approximately days 1-13). "
     "During this phase, follicle-stimulating hormone (FSH) causes follicles in your ovaries to mature. "
     "Estrogen gradually rises, which rebuilds your uterine lining. Energy levels often increase during this time."),
    ("What foods are good for cramps?",
     "For general comfort during cramps, many people find these helpful:\n"
     "* Magnesium-rich foods: dark chocolate, nuts, leafy greens\n"
     "* Anti-inflammatory foods: ginger tea, turmeric, omega-3 rich salmon\n"
     "* Staying well hydrated helps too\n"
     "Remember, for persistent or severe cramps, please consult your healthcare provider."),
]
for q, a in chat_entries:
    ch = ChatHistory(
        user_id=user.id,
        question=q,
        answer=a,
        sources='["SYNC Wellness Knowledge Base"]',
    )
    db.add(ch)
print("[OK] Chat history created")

db.commit()
db.close()

print("\nSUCCESS: Demo data seeded successfully!")
print("---------------------------------------------")
print("  Demo Login Credentials:")
print("  Email:    demo@sync.wellness")
print("  Password: SyncDemo2024!")
print("---------------------------------------------")

