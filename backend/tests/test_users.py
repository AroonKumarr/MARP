def test_list_users(client, admin_headers):
    res = client.get("/api/v1/users", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] >= 1
    emails = [u["email"] for u in data["items"]]
    assert "admin@marp.io" in emails

def test_create_and_deactivate_user(client, admin_headers):
    # 1. Create User
    create_res = client.post(
        "/api/v1/users",
        headers=admin_headers,
        json={
            "full_name": "Hamza Abbasi",
            "email": "hamza.survey@marp.io",
            "password": "SecurePassword123!",
            "phone": "+92-333-5551234",
            "role_names": ["Field Staff"]
        }
    )
    assert create_res.status_code == 201
    user_id = create_res.json()["id"]

    # 2. Deactivate User
    deact_res = client.post(f"/api/v1/users/{user_id}/deactivate", headers=admin_headers)
    assert deact_res.status_code == 200
    assert deact_res.json()["is_active"] is False

    # 3. Reactivate User
    react_res = client.post(f"/api/v1/users/{user_id}/reactivate", headers=admin_headers)
    assert react_res.status_code == 200
    assert react_res.json()["is_active"] is True

def test_device_registration_and_approval(client, admin_headers):
    dev_res = client.post(
        "/api/v1/devices",
        headers=admin_headers,
        json={
            "device_identifier": "TEST-IMEI-998877665544",
            "device_name": "Field Pixel 8 Pro",
            "model": "GC3VE",
            "os_version": "Android 15",
            "app_version": "1.0.5"
        }
    )
    assert dev_res.status_code == 201
    dev_id = dev_res.json()["id"]

    # Revoke device
    rev_res = client.put(f"/api/v1/devices/{dev_id}/revoke", headers=admin_headers)
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "Revoked"

    # Approve device
    app_res = client.put(f"/api/v1/devices/{dev_id}/approve", headers=admin_headers)
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "Approved"

def test_audit_logs_recorded(client, admin_headers):
    res = client.get("/api/v1/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["total"] > 0
    actions = [l["action"] for l in data["items"]]
    assert any("login" in a or "create" in a for a in actions)
