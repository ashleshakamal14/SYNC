# SYNC — AI-Powered Women's Wellness Companion 🌸

> **"Understand Your Body • Track Your Health • Feel Your Best"**

SYNC is a production-quality, modular women's wellness companion application built with **FastAPI**, **Next.js**, **MySQL**, **scikit-learn**, and the **Google Gemini API**. It provides cycle tracking with machine learning-based next-period predictions, holistic mood and emotional check-ins, statistical cycle-mood correlation analysis, and an empathetic, privacy-preserving AI wellness chatbot.

---

## ⚠️ Medical Safety & Boundary Statement

> **IMPORTANT:** SYNC provides general wellness information and lifestyle education based on self-logged data. It is **NOT** a medical diagnostic tool and is **never** a substitute for professional medical advice, clinical diagnosis, or personalized treatment plans. In case of acute symptoms, severe pain, or emergency health concerns, users should immediately seek professional medical care or contact local emergency services.

---

## 🏛️ System Architecture

```
[ Next.js 15+ Frontend (App Router, Tailwind CSS, Recharts) - Port 3000 ]
                              ↕ (REST API + JWT Bearer Auth)
[ FastAPI Backend (Python, Pydantic v2, SQLAlchemy 2.0) - Port 8001 ]
        ├── Auth Module (JWT, Bcrypt hashing, strict user scoping)
        ├── Cycle & Phase Engine (Random Forest ML model + fallback)
        ├── Mood Tracking & Pattern Engine (Sentiment & Multi-metric trends)
        ├── Cycle + Mood Correlation Layer (Phase-based wellness insights)
        ├── Gemini AI Chatbot Service (google-genai SDK, safety system prompt, context builder)
        └── MySQL Database Layer (syncdb: users, cycles, mood_logs, conversations, chat_messages)
```

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| **Frontend** | Next.js 15+, React 19, TypeScript, Vanilla CSS / Tailwind CSS, Lucide Icons, Recharts, Axios |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, PyMySQL, Uvicorn |
| **Database** | MySQL 8.0+ (`syncdb` at `localhost:3306`) |
| **Machine Learning** | scikit-learn (Random Forest Regressor pipeline for cycle prediction), pandas, NumPy |
| **AI Chatbot** | Official Google Gemini Python SDK (`google-genai`), LangChain, FAISS |
| **Authentication** | JWT (JSON Web Tokens) with HS256, Passlib (Bcrypt password hashing) |
| **Testing** | pytest, pytest-asyncio, FastAPI TestClient |

---

## 🔒 Security & Environment Configuration

> [!WARNING]
> **Gemini API key must be configured locally and must never be committed to Git.**
> The `GEMINI_API_KEY` is strictly stored on the FastAPI backend in `.env` and is **NEVER** exposed to the Next.js frontend or prefixed with `NEXT_PUBLIC_*`.

### Required Environment Variables

#### Backend `.env` (`sync-wellness/.env`)
```ini
# Database (MySQL)
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/syncdb
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=syncdb
MYSQL_HOST=localhost
MYSQL_PORT=3306

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI / Gemini API (Backend only)
GEMINI_API_KEY=your-gemini-api-key-here
LLM_PROVIDER=gemini

# Frontend Origin & Port
NEXT_PUBLIC_API_URL=http://localhost:8001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
ENVIRONMENT=development
```

#### Frontend `.env.local` (`sync-wellness/frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 🚀 How to Run Locally

### 1. Start MySQL Database
Ensure MySQL is running on `localhost:3306` with database `syncdb`.

### 2. Start the FastAPI Backend (Port 8001)

Open Windows PowerShell:
```powershell
# Navigate to backend directory
cd c:\Users\ASHLESHA\SYNC\sync-wellness\backend

# Activate virtual environment
..\..\.venv\Scripts\Activate.ps1

# Run FastAPI backend on port 8001
uvicorn app.main:app --reload --port 8001
```

Backend will be available at:
- **API Base URL**: `http://localhost:8001`
- **Interactive Swagger Docs**: `http://localhost:8001/api/docs`
- **OpenAPI JSON**: `http://localhost:8001/openapi.json`

### 3. Start the Next.js Frontend (Port 3000)

Open a second Windows PowerShell terminal:
```powershell
# Navigate to frontend directory
cd c:\Users\ASHLESHA\SYNC\sync-wellness\frontend

# Start Next.js development server
npm run dev
```

Frontend will be available at:
- **Web App URL**: `http://localhost:3000`
- **Login**: `http://localhost:3000/login`
- **Cycle Dashboard**: `http://localhost:3000/cycle`
- **Mood Dashboard**: `http://localhost:3000/mood`
- **AI Chatbot**: `http://localhost:3000/chat`

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user account & issue JWT.
- `POST /api/auth/login` — Authenticate user & issue JWT.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `PUT /api/auth/profile` — Update user profile details.

### Cycle Tracking (`/api/cycles`)
- `POST /api/cycles` — Create a new period / cycle record.
- `GET /api/cycles` — Retrieve all cycle records for the authenticated user.
- `GET /api/cycles/current` — Current cycle state, day, phase, and metrics.
- `GET /api/cycles/prediction` — ML-based prediction of next period date & length with historical average fallback.
- `GET /api/cycles/stats` — Cycle history statistics (average length, variability/std dev, shortest/longest cycle).
- `GET /api/cycles/{cycle_id}` — Get specific cycle by ID (user isolated).
- `PUT /api/cycles/{cycle_id}` — Update cycle record.
- `DELETE /api/cycles/{cycle_id}` — Delete cycle record.

### Mood Tracking (`/api/moods`)
- `POST /api/moods` — Record mood, mood score (1-10), stress (1-10), anxiety (1-10), energy (1-10), sleep hours, and journal notes.
- `GET /api/moods` — Retrieve mood entries with optional filters (`days=7`, `days=30`, `start_date`, `end_date`).
- `GET /api/moods/summary` — Comprehensive summary with averages (mood score, stress, anxiety, energy, sleep) and mood trends.
- `GET /api/moods/{mood_id}` — Get specific mood entry (user isolated).
- `PUT /api/moods/{mood_id}` — Update mood entry.
- `DELETE /api/moods/{mood_id}` — Delete mood entry.

### Cycle + Mood Correlations & Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` — Aggregated dashboard metrics, mini-charts, upcoming reminders.
- `GET /api/analytics/correlations` — Statistical correlation of mood, energy, stress, and sleep across cycle phases (Menstrual, Follicular, Ovulation, Luteal) with non-medical phrasing.
- `GET /api/analytics/moods/trends` — Multi-day mood timeline and distribution.
- `GET /api/analytics/cycles/history` — Historical cycle chart data.

### AI Chatbot (`/api/chat`)
- `POST /api/chat` — Authenticated chat endpoint powered by Gemini. Injects minimal user wellness context (current cycle day, phase, recent mood, sleep, symptoms) and enforces safety system prompt.
- `GET /api/chat/history` — Retrieve user's chat message history (strictly user isolated).
- `DELETE /api/chat/history` — Clear user's chat history and conversation threads.

---

## 🧪 Automated Testing

To run the complete test suite verifying authentication, cycles CRUD, ML predictions, mood filters, cycle-mood correlations, chatbot, unauthorized access, and cross-user data isolation:

```powershell
cd c:\Users\ASHLESHA\SYNC\sync-wellness\backend
..\..\.venv\Scripts\python.exe -m pytest tests/test_full_suite.py -v
```

All 14 unit and integration tests pass with 100% pass rate.
