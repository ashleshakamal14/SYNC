import pytest
from datetime import date, timedelta
from fastapi import status


def get_auth_token(client, email="testuser@example.com", password="password123", name="Test User"):
    # Register or login
    reg_res = client.post("/api/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "age": 25,
    })
    if reg_res.status_code == 201:
        return reg_res.json()["access_token"]
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    return login_res.json()["access_token"]


# ============================================================
# 1. AUTHENTICATION & JWT TESTS
# ============================================================

def test_register_and_login(client):
    email = "auth_test@example.com"
    pwd = "securepassword123"

    # Register
    res = client.post("/api/auth/register", json={
        "name": "Auth User",
        "email": email,
        "password": pwd,
        "age": 26,
    })
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": pwd,
    })
    assert login_res.status_code == status.HTTP_200_OK
    assert "access_token" in login_res.json()

    # Me endpoint
    token = login_res.json()["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == status.HTTP_200_OK
    assert me_res.json()["email"] == email


def test_unauthorized_access(client):
    # Unauthenticated access should return 401
    assert client.get("/api/cycles").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.get("/api/moods").status_code == status.HTTP_401_UNAUTHORIZED
    assert client.get("/api/chat/history").status_code == status.HTTP_401_UNAUTHORIZED


# ============================================================
# 2. CYCLE TRACKING, PREDICTION & STATS TESTS
# ============================================================

def test_cycle_crud_and_predictions(client):
    token = get_auth_token(client, "cycle_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    today = date.today()
    start1 = today - timedelta(days=56)
    start2 = today - timedelta(days=28)

    # 1. Create Cycle 1
    res1 = client.post("/api/cycles", headers=headers, json={
        "period_start": str(start1),
        "period_end": str(start1 + timedelta(days=5)),
        "cycle_length": 28,
        "period_length": 5,
        "notes": "First cycle log",
    })
    assert res1.status_code == status.HTTP_201_CREATED
    cycle1 = res1.json()
    assert cycle1["cycle_length"] == 28
    assert cycle1["period_length"] == 5

    # 2. Create Cycle 2
    res2 = client.post("/api/cycles", headers=headers, json={
        "period_start": str(start2),
        "period_end": str(start2 + timedelta(days=4)),
        "cycle_length": 28,
        "period_length": 4,
        "notes": "Second cycle log",
    })
    assert res2.status_code == status.HTTP_201_CREATED
    cycle2_id = res2.json()["id"]

    # 3. Get All Cycles
    get_res = client.get("/api/cycles", headers=headers)
    assert get_res.status_code == status.HTTP_200_OK
    assert len(get_res.json()) >= 2

    # 4. Get Current Cycle Info
    curr_res = client.get("/api/cycles/current", headers=headers)
    assert curr_res.status_code == status.HTTP_200_OK
    curr_data = curr_res.json()
    assert curr_data["has_data"] is True
    assert "metrics" in curr_data
    assert "phase_guide" in curr_data
    assert "stats" in curr_data

    # 5. Get Prediction Endpoint
    pred_res = client.get("/api/cycles/prediction", headers=headers)
    assert pred_res.status_code == status.HTTP_200_OK
    pred_data = pred_res.json()
    assert "predicted_next_period" in pred_data
    assert "predicted_cycle_length" in pred_data
    assert "confidence" in pred_data
    assert "method" in pred_data
    assert "disclaimer" in pred_data

    # 6. Get Stats Endpoint
    stats_res = client.get("/api/cycles/stats", headers=headers)
    assert stats_res.status_code == status.HTTP_200_OK
    stats_data = stats_res.json()
    assert stats_data["total_cycles"] >= 2
    assert stats_data["average_cycle_length"] is not None

    # 7. Update Cycle
    put_res = client.put(f"/api/cycles/{cycle2_id}", headers=headers, json={
        "notes": "Updated notes for cycle 2",
        "period_length": 5,
    })
    assert put_res.status_code == status.HTTP_200_OK
    assert put_res.json()["notes"] == "Updated notes for cycle 2"

    # 8. Delete Cycle
    del_res = client.delete(f"/api/cycles/{cycle2_id}", headers=headers)
    assert del_res.status_code == status.HTTP_204_NO_CONTENT

    # Verify deleted
    get_single = client.get(f"/api/cycles/{cycle2_id}", headers=headers)
    assert get_single.status_code == status.HTTP_404_NOT_FOUND


# ============================================================
# 3. MOOD TRACKING, FILTERS & SUMMARY TESTS
# ============================================================

def test_mood_crud_filters_and_summary(client):
    token = get_auth_token(client, "mood_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    today = date.today()

    # 1. Create Mood 1 (Today)
    m1 = client.post("/api/moods", headers=headers, json={
        "date": str(today),
        "mood": "happy",
        "mood_score": 8,
        "stress_level": 3,
        "anxiety_level": 2,
        "energy_level": 8,
        "sleep_hours": 8.0,
        "notes": "Felt energized and well rested today!",
    })
    assert m1.status_code == status.HTTP_201_CREATED
    m1_data = m1.json()
    assert m1_data["mood"] == "happy"
    assert m1_data["mood_score"] == 8
    assert m1_data["sleep_hours"] == 8.0
    m1_id = m1_data["id"]

    # 2. Create Mood 2 (10 days ago)
    m2 = client.post("/api/moods", headers=headers, json={
        "date": str(today - timedelta(days=10)),
        "mood": "calm",
        "mood_score": 7,
        "stress_level": 4,
        "anxiety_level": 3,
        "energy_level": 6,
        "sleep_hours": 7.0,
        "notes": "Peaceful day.",
    })
    assert m2.status_code == status.HTTP_201_CREATED

    # 3. Create Mood 3 (45 days ago)
    m3 = client.post("/api/moods", headers=headers, json={
        "date": str(today - timedelta(days=45)),
        "mood": "tired",
        "mood_score": 4,
        "stress_level": 7,
        "anxiety_level": 5,
        "energy_level": 3,
        "sleep_hours": 5.5,
        "notes": "Long busy day, feeling drained.",
    })
    assert m3.status_code == status.HTTP_201_CREATED

    # 4. Filter by last 7 days
    res_7d = client.get("/api/moods?days=7", headers=headers)
    assert res_7d.status_code == status.HTTP_200_OK
    assert len(res_7d.json()) == 1

    # 5. Filter by last 30 days
    res_30d = client.get("/api/moods?days=30", headers=headers)
    assert res_30d.status_code == status.HTTP_200_OK
    assert len(res_30d.json()) == 2

    # 6. Mood Summary
    sum_res = client.get("/api/moods/summary", headers=headers)
    assert sum_res.status_code == status.HTTP_200_OK
    sum_data = sum_res.json()
    assert sum_data["has_data"] is True
    assert sum_data["total_entries"] == 3
    assert sum_data["average_mood_score"] is not None
    assert sum_data["average_stress"] is not None
    assert sum_data["average_sleep"] is not None
    assert "mood_distribution" in sum_data
    assert len(sum_data["recent_entries"]) > 0

    # 7. Update Mood
    up_res = client.put(f"/api/moods/{m1_id}", headers=headers, json={
        "mood": "energetic",
        "energy_level": 9,
    })
    assert up_res.status_code == status.HTTP_200_OK
    assert up_res.json()["mood"] == "energetic"
    assert up_res.json()["energy_level"] == 9

    # 8. Delete Mood
    del_res = client.delete(f"/api/moods/{m1_id}", headers=headers)
    assert del_res.status_code == status.HTTP_204_NO_CONTENT


# ============================================================
# 4. CYCLE + MOOD CORRELATIONS
# ============================================================

def test_cycle_mood_correlations(client):
    token = get_auth_token(client, "corr_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    today = date.today()
    period_start = today - timedelta(days=20)

    # Log cycle
    client.post("/api/cycles", headers=headers, json={
        "period_start": str(period_start),
        "cycle_length": 28,
        "period_length": 5,
    })

    # Log mood entries across days
    client.post("/api/moods", headers=headers, json={
        "date": str(period_start + timedelta(days=2)),  # Menstrual phase
        "mood": "tired",
        "stress_level": 6,
        "energy_level": 3,
        "sleep_hours": 7.0,
    })
    client.post("/api/moods", headers=headers, json={
        "date": str(period_start + timedelta(days=8)),  # Follicular phase
        "mood": "energetic",
        "stress_level": 2,
        "energy_level": 8,
        "sleep_hours": 8.0,
    })

    # Get correlations
    corr_res = client.get("/api/analytics/correlations", headers=headers)
    assert corr_res.status_code == status.HTTP_200_OK
    corr_data = corr_res.json()
    assert corr_data["has_data"] is True
    assert "phase_correlations" in corr_data
    assert "menstrual" in corr_data["phase_correlations"]
    assert "follicular" in corr_data["phase_correlations"]
    assert "disclaimer" in corr_data


# ============================================================
# 5. CHATBOT & CHAT HISTORY TESTS
# ============================================================

def test_chatbot_and_history(client):
    token = get_auth_token(client, "chat_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Send chat message
    chat_res = client.post("/api/chat", headers=headers, json={
        "message": "What foods are nourishing during the menstrual phase?"
    })
    assert chat_res.status_code == status.HTTP_201_CREATED
    chat_data = chat_res.json()
    assert "response" in chat_data
    assert len(chat_data["response"]) > 0
    assert "sources" in chat_data
    assert "timestamp" in chat_data

    # 2. Get chat history
    hist_res = client.get("/api/chat/history", headers=headers)
    assert hist_res.status_code == status.HTTP_200_OK
    history = hist_res.json()
    assert len(history) >= 1
    assert history[0]["question"] == "What foods are nourishing during the menstrual phase?"

    # 3. Clear chat history
    clear_res = client.delete("/api/chat/history", headers=headers)
    assert clear_res.status_code == status.HTTP_204_NO_CONTENT

    # Verify cleared
    hist_empty = client.get("/api/chat/history", headers=headers)
    assert hist_empty.status_code == status.HTTP_200_OK
    assert len(hist_empty.json()) == 0


# ============================================================
# 6. STRICT USER ISOLATION TESTS
# ============================================================

def test_cross_user_data_isolation(client):
    # Setup User A
    token_a = get_auth_token(client, "user_a@example.com", name="User A")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup User B
    token_b = get_auth_token(client, "user_b@example.com", name="User B")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a cycle and a mood entry
    c_res = client.post("/api/cycles", headers=headers_a, json={
        "period_start": str(date.today()),
        "cycle_length": 30,
        "notes": "User A confidential cycle note",
    })
    cycle_a_id = c_res.json()["id"]

    m_res = client.post("/api/moods", headers=headers_a, json={
        "date": str(date.today()),
        "mood": "calm",
        "notes": "User A confidential journal note",
    })
    mood_a_id = m_res.json()["id"]

    # User A creates a chat entry
    client.post("/api/chat", headers=headers_a, json={
        "message": "User A secret medical question"
    })

    # User B tries to access User A's cycle
    get_cycle_b = client.get(f"/api/cycles/{cycle_a_id}", headers=headers_b)
    assert get_cycle_b.status_code == status.HTTP_404_NOT_FOUND

    # User B tries to update User A's cycle
    put_cycle_b = client.put(f"/api/cycles/{cycle_a_id}", headers=headers_b, json={"notes": "Hacked"})
    assert put_cycle_b.status_code == status.HTTP_404_NOT_FOUND

    # User B tries to delete User A's cycle
    del_cycle_b = client.delete(f"/api/cycles/{cycle_a_id}", headers=headers_b)
    assert del_cycle_b.status_code == status.HTTP_404_NOT_FOUND

    # User B tries to access User A's mood
    get_mood_b = client.get(f"/api/moods/{mood_a_id}", headers=headers_b)
    assert get_mood_b.status_code == status.HTTP_404_NOT_FOUND

    # User B checks their own cycle list and mood list (should NOT contain User A's data)
    b_cycles = client.get("/api/cycles", headers=headers_b).json()
    assert all(c["id"] != cycle_a_id for c in b_cycles)

    b_moods = client.get("/api/moods", headers=headers_b).json()
    assert all(m["id"] != mood_a_id for m in b_moods)

    # User B checks their chat history (should NOT contain User A's messages)
    b_chat = client.get("/api/chat/history", headers=headers_b).json()
    assert all("User A secret" not in c["question"] for c in b_chat)
