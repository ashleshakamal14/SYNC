"""
Database Migration Utility for MySQL
Applies safe, non-destructive schema updates to syncdb.
"""
import logging
from sqlalchemy import inspect, text
from app.database.session import engine, Base
from app.models import User, Cycle, MoodLog, Symptom, Nutrition, Partner, Reminder, ChatHistory, Conversation, ChatMessage, Report  # noqa

logger = logging.getLogger("sync.migrations")


def run_migrations():
    """
    Safely creates any missing tables and adds missing columns
    to existing tables in MySQL.
    """
    try:
        # Create all tables defined in models that do not exist yet
        Base.metadata.create_all(bind=engine)

        inspector = inspect(engine)
        dialect = engine.dialect.name

        with engine.connect() as conn:
            if dialect == "mysql":
                logger.info("Applying non-destructive column migrations for MySQL...")

                # mood_logs table migrations
                if inspector.has_table("mood_logs"):
                    mood_cols = {col["name"] for col in inspector.get_columns("mood_logs")}
                    if "mood_score" not in mood_cols:
                        conn.execute(text("ALTER TABLE mood_logs ADD COLUMN mood_score INT NULL;"))
                    if "anxiety_level" not in mood_cols:
                        conn.execute(text("ALTER TABLE mood_logs ADD COLUMN anxiety_level INT NULL;"))
                    if "sleep_hours" not in mood_cols:
                        conn.execute(text("ALTER TABLE mood_logs ADD COLUMN sleep_hours DOUBLE NULL;"))
                    if "notes" not in mood_cols:
                        conn.execute(text("ALTER TABLE mood_logs ADD COLUMN notes TEXT NULL;"))
                    if "updated_at" not in mood_cols:
                        conn.execute(text("ALTER TABLE mood_logs ADD COLUMN updated_at DATETIME NULL;"))

                # cycles table migrations
                if inspector.has_table("cycles"):
                    cycle_cols = {col["name"] for col in inspector.get_columns("cycles")}
                    if "notes" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN notes TEXT NULL;"))
                    if "updated_at" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN updated_at DATETIME NULL;"))
                    if "current_phase" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN current_phase VARCHAR(50) NULL;"))
                    if "ovulation_date" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN ovulation_date DATE NULL;"))
                    if "fertile_window_start" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN fertile_window_start DATE NULL;"))
                    if "fertile_window_end" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN fertile_window_end DATE NULL;"))
                    if "predicted_next_cycle" not in cycle_cols:
                        conn.execute(text("ALTER TABLE cycles ADD COLUMN predicted_next_cycle DATE NULL;"))

                conn.commit()
                logger.info("MySQL schema migrations applied successfully.")
            else:
                logger.info(f"Database dialect is {dialect}; create_all ensured tables exist.")

    except Exception as e:
        logger.error(f"Migration error: {e}", exc_info=True)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migrations()
