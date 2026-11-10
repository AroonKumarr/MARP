def test_dashboard_live_database_metrics(client, admin_headers):
    res = client.get("/api/v1/dashboard/metrics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "active_campaigns" in data
    assert "total_field_staff" in data
    assert "published_questionnaires" in data
    assert "registered_devices" in data
    # Dynamic values derived from seed
    assert data["active_campaigns"] >= 1
    assert data["total_field_staff"] >= 1

def test_dashboard_workflow_board(client, admin_headers):
    res = client.get("/api/v1/dashboard/workflow-board", headers=admin_headers)
    assert res.status_code == 200
    board = res.json()
    assert "todo" in board
    assert "in_progress" in board
    assert "review" in board
    # In seeded demo, we created at least 1 in progress and 1 review task
    assert len(board["in_progress"]) >= 1 or len(board["todo"]) >= 1

def test_dashboard_donut_analytics(client, admin_headers):
    res = client.get("/api/v1/dashboard/analytics/donut", headers=admin_headers)
    assert res.status_code == 200
    donut = res.json()
    assert "total" in donut
    assert "items" in donut
    assert donut["total"] >= 1
    categories = [it["name"] for it in donut["items"]]
    assert "Billboard" in categories or "Retail" in categories

def test_dashboard_weekly_activity(client, admin_headers):
    res = client.get("/api/v1/dashboard/analytics/weekly", headers=admin_headers)
    assert res.status_code == 200
    weekly = res.json()
    assert "days" in weekly
    assert len(weekly["days"]) == 7
    days = [d["day"] for d in weekly["days"]]
    assert days == ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
