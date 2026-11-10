def test_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert len(data["modules"]) == 3

def test_login_success(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@marp.io", "password": "Admin12345!"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "admin@marp.io"
    assert "Company Administrator" in data["roles"]

def test_login_invalid_password(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@marp.io", "password": "WrongPassword!"}
    )
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]

def test_get_current_user_me(client, admin_headers):
    res = client.get("/api/v1/auth/me", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "admin@marp.io"
    assert data["is_active"] is True

def test_company_registration(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "company_name": "Horizon Media Audits",
            "full_name": "Farhan Tariq",
            "email": "farhan@horizonmedia.com",
            "password": "Password123!"
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "farhan@horizonmedia.com"
    assert "Company Administrator" in data["roles"]
