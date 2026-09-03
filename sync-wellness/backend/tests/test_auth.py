def test_register_and_login(client):
    # Test register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "name": "Sarah Connor",
            "email": "sarah@example.com",
            "password": "Password123!",
            "age": 29,
        },
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah@example.com"

    # Test duplicate registration rejection
    dup_res = client.post(
        "/api/auth/register",
        json={
            "name": "Sarah Connor Duplicate",
            "email": "sarah@example.com",
            "password": "Password123!",
        },
    )
    assert dup_res.status_code == 400

    # Test login
    login_res = client.post(
        "/api/auth/login",
        json={"email": "sarah@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data

    # Test me endpoint
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Sarah Connor"


def test_unauthorized_access(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
