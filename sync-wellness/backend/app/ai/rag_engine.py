"""
RAG Chatbot Engine
LangChain + FAISS + LLM for wellness Q&A.
Falls back to mock responses when no API key is configured.
SYNC is NOT a medical diagnosis system.
"""
import os
import json
from typing import Tuple, List, Optional
from app.core.config import settings

# ──────────────────────────────────────────────────────────────────────────────
# Wellness Knowledge Base
# These are general wellness facts, not medical advice.
# ──────────────────────────────────────────────────────────────────────────────

WELLNESS_KNOWLEDGE = [
    # Menstrual cycle basics
    """The menstrual cycle typically lasts 21–35 days. Day 1 is the first day of your period.
    The average cycle is 28 days, but variation is normal and healthy.
    Cycle length can be influenced by stress, diet, exercise, sleep, and health conditions.""",

    """The four phases of the menstrual cycle are:
    1. Menstrual phase (days 1–5 avg): Uterine lining sheds.
    2. Follicular phase (days 6–13 avg): Follicles develop, estrogen rises.
    3. Ovulation (around day 14 avg): Egg is released, peak fertility.
    4. Luteal phase (days 15–28 avg): Progesterone rises, body prepares for next cycle.""",

    """PMS (Premenstrual Syndrome) symptoms commonly include mood changes, bloating,
    breast tenderness, headaches, and fatigue. These typically occur in the luteal phase.
    General wellness strategies include regular exercise, reduced caffeine and sodium,
    adequate sleep, and stress management. If symptoms are severe, consult a healthcare provider.""",

    # Nutrition
    """Iron-rich foods support energy, especially during menstruation:
    Plant sources: lentils, spinach, fortified cereals, tofu, pumpkin seeds.
    Animal sources: lean red meat, poultry, fish.
    Tip: Pair iron-rich foods with vitamin C (oranges, tomatoes) for better absorption.
    Avoid combining with calcium-rich foods or coffee/tea as these can reduce absorption.""",

    """Staying hydrated is essential for overall wellness:
    General guideline: 8 glasses (about 2 liters) of water per day.
    During your period or in hot weather, increase intake.
    Signs of good hydration: pale yellow urine, regular urination.
    Hydrating foods: cucumbers, watermelon, oranges, soups.""",

    """Magnesium-rich foods may support PMS symptoms and sleep quality:
    Sources: dark leafy greens, nuts (almonds, cashews), seeds (pumpkin, sunflower),
    dark chocolate, avocado, legumes, and whole grains.
    Magnesium supports muscle relaxation and may ease cramps.""",

    # Exercise
    """Regular exercise has many wellness benefits across the menstrual cycle:
    During menstruation: Gentle movement like yoga or walking can ease cramps.
    During the follicular phase: Great time for strength training and cardio.
    Around ovulation: Peak performance — high intensity exercise is well-tolerated.
    During the luteal phase: Lower intensity is often preferred as the body prepares for the next cycle.""",

    # Sleep
    """Sleep quality can vary across the menstrual cycle:
    Follicular phase: Sleep is often deeper and more restorative.
    Luteal phase: Progesterone can affect body temperature and sleep architecture.
    Tips for better sleep: consistent sleep schedule, cool dark room,
    limiting caffeine after noon, reducing screen time before bed.""",

    # Stress
    """Stress management supports overall menstrual and general health:
    Chronic stress can affect cycle regularity and hormone balance.
    Effective strategies: regular physical activity, meditation, deep breathing,
    journaling, spending time in nature, social connection.
    If stress significantly affects daily functioning, professional support is recommended.""",

    # Cramps
    """Menstrual cramps (dysmenorrhea) are caused by uterine contractions.
    General wellness approaches:
    - Gentle heat application (hot water bottle, warm bath)
    - Light exercise and movement
    - Staying well hydrated
    - Magnesium and omega-3 rich foods
    - Adequate rest
    Severe or debilitating cramps should be evaluated by a healthcare professional.""",

    # Mood
    """Mood changes across the menstrual cycle are common and driven by hormonal fluctuations:
    Pre-ovulation: Rising estrogen often supports positive mood and energy.
    Post-ovulation (luteal): Progesterone rise can bring fatigue, irritability, or anxiety.
    Tracking your mood helps you understand your personal patterns.
    If mood changes significantly impact your quality of life, please consult a healthcare provider.""",

    # Disclaimer
    """IMPORTANT: SYNC provides general wellness information and is not a substitute for 
    professional medical advice, diagnosis, or treatment. Always seek the advice of a 
    qualified healthcare professional for any health concerns. If you experience severe 
    symptoms, seek immediate medical attention.""",
]

# ──────────────────────────────────────────────────────────────────────────────
# Mock responses for development (no API key required)
# ──────────────────────────────────────────────────────────────────────────────

MOCK_RESPONSES = {
    "default": (
        "I'm here to support your wellness journey! "
        "I can answer general questions about menstrual cycles, nutrition, "
        "mood, symptoms, hydration, and overall wellness. "
        "What would you like to know?\n\n"
        "*(Running in demo mode — configure an AI API key for intelligent responses)*",
        ["SYNC Wellness Knowledge Base"]
    ),
    "period": (
        "The average menstrual cycle lasts 21–35 days, with your period "
        "typically lasting 3–7 days. Day 1 of your cycle is the first day "
        "of your period. Remember, variation is normal! 🌙\n\n"
        "**Tip:** Track your cycles consistently in SYNC to see your personal patterns.",
        ["SYNC Wellness Knowledge Base — Cycle Education"]
    ),
    "cramps": (
        "Menstrual cramps are caused by uterine contractions and are very common. "
        "General wellness suggestions that many people find helpful:\n"
        "- **Heat therapy** — warm water bottle on your lower abdomen\n"
        "- **Light movement** — gentle yoga or walking\n"
        "- **Hydration** — staying well hydrated\n"
        "- **Magnesium-rich foods** — nuts, dark chocolate, leafy greens\n\n"
        "If cramps are severe or debilitating, please consult a healthcare professional. 💛",
        ["SYNC Wellness Knowledge Base — Cramp Support"]
    ),
    "nutrition": (
        "Good nutrition supports wellness throughout your cycle:\n"
        "- **Iron-rich foods** (lentils, spinach, lean meat) — especially helpful during your period\n"
        "- **Magnesium** (nuts, seeds, dark chocolate) — supports muscle relaxation\n"
        "- **Vitamin C** with iron sources — boosts absorption\n"
        "- **Hydration** — aim for 2+ liters of water daily\n\n"
        "These are general wellness suggestions. For personalized nutrition advice, "
        "consider consulting a registered dietitian. 🥗",
        ["SYNC Wellness Knowledge Base — Nutrition"]
    ),
}


def get_mock_response(question: str) -> Tuple[str, List[str]]:
    """Return a relevant mock response based on keywords."""
    q_lower = question.lower()

    if any(w in q_lower for w in ["cramp", "pain", "hurt"]):
        return MOCK_RESPONSES["cramps"]
    elif any(w in q_lower for w in ["food", "eat", "nutrition", "iron", "diet", "water", "hydrat"]):
        return MOCK_RESPONSES["nutrition"]
    elif any(w in q_lower for w in ["period", "cycle", "menstrual", "phase"]):
        return MOCK_RESPONSES["period"]
    else:
        return MOCK_RESPONSES["default"]


# ──────────────────────────────────────────────────────────────────────────────
# RAG pipeline (LangChain + FAISS)
# ──────────────────────────────────────────────────────────────────────────────

_rag_chain = None
_vector_store = None


def _build_rag_chain():
    """Build the RAG chain lazily (first call only)."""
    global _rag_chain, _vector_store

    try:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import FAISS
        from langchain_community.embeddings import HuggingFaceEmbeddings
        from langchain.chains import RetrievalQA
        from langchain.prompts import PromptTemplate

        # Build vector store from knowledge base
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        docs = splitter.create_documents(WELLNESS_KNOWLEDGE)

        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        _vector_store = FAISS.from_documents(docs, embeddings)

        # Build LLM
        llm = _get_llm()
        if llm is None:
            return None

        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are SYNC, a supportive AI wellness companion for women.
Use the following wellness information to answer the question.
Always be supportive, non-judgmental, and clear.
NEVER provide medical diagnoses or replace professional medical advice.
For urgent or serious health concerns, always recommend consulting a healthcare professional.

Wellness Context:
{context}

User Question: {question}

SYNC Response:"""
        )

        _rag_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=_vector_store.as_retriever(search_kwargs={"k": 3}),
            chain_type_kwargs={"prompt": prompt_template},
            return_source_documents=True,
        )
        return _rag_chain
    except Exception as e:
        print(f"[RAG] Failed to build chain: {e}")
        return None


def _get_llm():
    """Get configured LLM based on environment."""
    provider = settings.LLM_PROVIDER.lower()

    try:
        if provider == "gemini" and settings.GEMINI_API_KEY:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=settings.GEMINI_API_KEY,
                temperature=0.3,
            )
        elif provider == "openai" and settings.OPENAI_API_KEY:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model="gpt-3.5-turbo",
                api_key=settings.OPENAI_API_KEY,
                temperature=0.3,
            )
        elif provider == "groq" and settings.GROQ_API_KEY:
            from langchain_groq import ChatGroq
            return ChatGroq(
                model="llama3-8b-8192",
                api_key=settings.GROQ_API_KEY,
                temperature=0.3,
            )
    except Exception as e:
        print(f"[LLM] Failed to initialize {provider}: {e}")

    return None


async def chat(question: str) -> Tuple[str, List[str]]:
    """
    Main chat function. Returns (answer, sources).
    Falls back to mock if no LLM configured.
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "mock" or not any([
        settings.GEMINI_API_KEY,
        settings.OPENAI_API_KEY,
        settings.GROQ_API_KEY,
    ]):
        return get_mock_response(question)

    try:
        chain = _rag_chain or _build_rag_chain()
        if chain is None:
            return get_mock_response(question)

        result = chain({"query": question})
        answer = result.get("result", "")
        source_docs = result.get("source_documents", [])
        sources = [f"SYNC Wellness Knowledge Base (Section {i+1})" for i in range(len(source_docs))]

        # Safety check: if response seems to give medical advice, add disclaimer
        answer += (
            "\n\n---\n*SYNC provides general wellness information. "
            "For personal health concerns, please consult a qualified healthcare professional.*"
        )

        return answer, sources

    except Exception as e:
        print(f"[RAG] Chat error: {e}")
        return get_mock_response(question)
