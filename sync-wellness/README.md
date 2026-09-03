# SYNC — AI-Powered Women's Wellness Companion 🌸

> **"Understand Your Body • Track Your Health • Feel Your Best"**

SYNC is an intelligent, holistic wellness companion designed for women to track menstrual cycles, understand hormonal phases, monitor moods, observe physical symptoms, cultivate healthy hydration and nutritional habits, and receive personalized, explainable AI wellness insights.

---

## ⚠️ Medical Disclaimer

> **IMPORTANT:** SYNC provides general wellness information and lifestyle observations based on self-logged data. It is **NOT** a medical diagnosis system and is **never** a substitute for professional medical advice, clinical diagnosis, or medical treatment. If you experience severe, persistent, or debilitating symptoms, please consult a qualified healthcare professional immediately.

---

## 📱 Features

- **🌙 Cycle & Phase Tracking**: Rule-based and ML-assisted estimation of next periods, ovulation dates, and fertile windows. Automatic phase classification into Menstrual, Follicular, Ovulation, and Luteal phases.
- **✨ AI Phase Guide**: Phase-specific suggestions for balanced nutrition, physical activity, sleep hygiene, self-care, and productivity.
- **😊 Mood & Reflection Journal**: Daily emotional logging with automated sentiment scoring, stress/energy trend charts, and pattern observations.
- **🩺 Symptom Tracking**: Track cramps, headaches, fatigue, bloating, acne, and other symptoms on a 1–5 severity scale with frequency breakdowns.
- **🥗 Nutrition & Hydration Tracker**: 1-click water logger, balanced meal notes, and cycle-supportive mineral food recommendations.
- **⏰ Smart Reminders**: Timely alerts for supplements, water intake, upcoming periods, and doctor appointments with one-click completion.
- **💬 RAG AI Health Assistant**: LangChain + FAISS powered wellness assistant that provides cited, educational answers to lifestyle and cycle questions. Safe mock fallback enabled for offline/zero-key development.
- **🤝 Privacy-First Partner Mode**: Share only what you choose (cycle phase, daily mood, or profile) with a trusted partner with instant revocation. Private journal entries are **strictly confidential**.
- **📊 Reports & PDF Generation**: Interactive analytics charts and one-click downloadable PDF summary reports for your personal health records or doctor consultations.

---

## 🏛️ System Architecture

```
[ Next.js 15+ Frontend (App Router, Tailwind CSS, Recharts) ]
                            ↕ (HTTP / REST + JWT)
        [ FastAPI Backend (Python, Pydantic, SQLAlchemy) ]
              ├── Auth Module & JWT Token Services
              ├── Cycle & Phase Engine (Rule + ML Weighted Averages)
              ├── Mood Engine & Sentiment Analysis
              ├── Nutrition & Reminder Service
              ├── Partner Access Control (Granular Permissions)
              ├── PDF Report Generator (ReportLab)
              └── AI RAG Chatbot (LangChain, FAISS, LLM Providers)
                            ↕
        [ Database: PostgreSQL / Local SQLite Fallback ]
                            ↕
        [ Cloud Storage: AWS S3 (Reports Storage) ]
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15+, React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Axios |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, ReportLab |
| **Database** | PostgreSQL (Production) / SQLite (Zero-config local fallback) |
| **Auth** | JWT (JSON Web Tokens), Passlib (Bcrypt hashing) |
| **AI / RAG** | LangChain, FAISS Vector DB, Hugging Face Embeddings, Google Gemini / OpenAI / Groq |
| **Cloud (AWS)**| Terraform (VPC, Subnets, Security Groups, EC2, RDS PostgreSQL, S3, IAM) |
| **CI/CD** | GitHub Actions (Automated pytest, linting, Next.js production build) |

---

## 📂 Project Structure

```
sync-wellness/
├── frontend/                     # Next.js 15+ Frontend
│   ├── app/                      # App router pages
│   │   ├── chat/                 # AI Wellness Chatbot UI
│   │   ├── cycle/                # Cycle tracking & Phase guide
│   │   ├── dashboard/            # Core dashboard & charts
│   │   ├── login/                # Authentication Sign-in
│   │   ├── mood/                 # Mood tracking & journal
│   │   ├── nutrition/            # Water & nutrition tracker
│   │   ├── partner/              # Partner mode & permission controls
│   │   ├── profile/              # User settings & health profile
│   │   ├── register/             # Account creation
│   │   ├── reminders/            # Care alert reminders
│   │   ├── reports/              # Analytics & PDF generation
│   │   ├── globals.css           # Wellness design tokens & CSS
│   │   └── page.tsx              # SaaS Landing page
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # useAuth hook & context
│   ├── lib/                      # API client & utility constants
│   ├── services/                 # API service methods
│   └── types/                    # TypeScript interfaces
│
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── ai/                   # AI engines (Cycle, Mood, RAG, Recommendations)
│   │   ├── api/                  # API route handlers (Auth, Cycles, Moods, etc.)
│   │   ├── core/                 # Config & security (JWT, Bcrypt)
│   │   ├── database/             # SQLAlchemy engine & session factory
│   │   ├── models/               # SQLAlchemy models (User, Cycle, MoodLog, etc.)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── main.py               # FastAPI application entrypoint
│   ├── tests/                    # Pytest integration & unit test suite
│   └── requirements.txt          # Python dependencies
│
├── database/seed/                # Seed script with realistic demo data
├── infrastructure/terraform/     # Complete AWS Terraform infrastructure
├── .github/workflows/            # GitHub Actions CI/CD pipeline
├── .env.example                  # Environment variable reference
└── README.md
```

---

## 🚀 Quickstart: Running Locally (No Docker Required)

### 1. Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.10+
- (Optional) PostgreSQL database (a zero-config local SQLite database is automatically used if PostgreSQL is not active)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default values work out of the box for local development without external API keys.

---

### 3. Setup and Run Backend

```bash
# Navigate to backend directory
cd sync-wellness/backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed demo user and 6 months of wellness records
python ../database/seed/seed.py

# Start the FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/api/docs`

---

### 4. Setup and Run Frontend

```bash
# Open a new terminal and navigate to frontend directory
cd sync-wellness/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Next.js development server
npm run dev
```

The frontend will be available at:
- **Application URL**: `http://localhost:3000`
- **Login Credentials (Demo Account)**:
  - **Email**: `demo@sync.wellness`
  - **Password**: `SyncDemo2024!`
  *(Or click the "Use Demo Account" button on the login screen!)*

---

## 🤖 AI Configuration

SYNC is engineered with a **zero-downtime, resilient AI design**. It runs with an intelligent mock/fallback knowledge base for development, and seamlessly activates state-of-the-art LLMs when API keys are configured:

1. In your `.env` file, set `LLM_PROVIDER` to `gemini`, `openai`, or `groq`:
   ```ini
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSy...
   ```
2. The RAG pipeline automatically retrieves relevant wellness knowledge documents using FAISS and provides cited, context-aware answers.

---

## 🧪 Running Tests

```bash
# Run backend pytest suite
cd sync-wellness/backend
pytest tests/ -v

# Run frontend build check
cd sync-wellness/frontend
npm run build
```

---

## ☁️ AWS Infrastructure (Terraform)

The `infrastructure/terraform` folder contains production-ready Infrastructure-as-Code for AWS:

- **VPC & Subnets**: Multi-AZ public subnets for compute and isolated private subnets for RDS.
- **Compute (EC2)**: Application server running Next.js and FastAPI.
- **Database (RDS)**: Managed PostgreSQL instance in private subnets.
- **Storage (S3)**: AES-256 encrypted bucket with public access block for PDF wellness reports.
- **IAM**: Least-privilege roles and instance profiles.

### Terraform Deployment Instructions
```bash
cd sync-wellness/infrastructure/terraform

# Initialize Terraform
terraform init

# Review proposed changes
terraform plan -var="db_password=YourSecurePassword123!"

# Apply infrastructure
terraform apply -var="db_password=YourSecurePassword123!"
```

---

## 🔮 Future Scope & Roadmap

- **Wearable & Fitness Tracker Integration**: Continuous sleep and heart-rate variability (HRV) sync with Apple HealthKit, Fitbit, and Oura.
- **OCR for Blood Test Reports**: Automatic extraction and trend tracking of hemoglobin, ferritin, thyroid, and vitamin D lab panels.
- **Specialized Health Modes**: Dedicated tracking algorithms for PCOS, Pregnancy, Postpartum, and Perimenopause/Menopause.
- **Community Wellness Forum**: Safe, moderated peer discussions and support groups.
- **Voice Assistant**: Natural voice logging for quick hands-free check-ins.

---

## 🔒 Security & Privacy Practices

- **Strict Isolation**: Every database query is scoped to the authenticated user ID (`current_user.id`).
- **Encrypted Passwords**: Passwords hashed using industry-standard Bcrypt.
- **Confidential Journals**: Journal entries and personal reflections are protected by strict privacy policies and are never exposed to partners or external services.
- **CORS & Secure Headers**: Strict origin whitelisting for all API endpoints.

---

*SYNC is more than a tracker — it's your personal wellness partner for every phase of your journey. ♡*
