from datetime import date, timedelta

def test_campaign_crud_and_status(client, admin_headers):
    # 1. Create Campaign
    c_res = client.post(
        "/api/v1/campaigns",
        headers=admin_headers,
        json={
            "title": "Summer Retail Beverage Campaign",
            "code": "CMP-TEST-001",
            "description": "Retail visibility checks in Punjab supermarkets",
            "research_category": "Retail",
            "budget": 500000.0,
            "start_date": str(date.today()),
            "end_date": str(date.today() + timedelta(days=30))
        }
    )
    assert c_res.status_code == 201
    c_id = c_res.json()["id"]
    assert c_res.json()["status"] == "Planning"

    # 2. Update Status to Active
    st_res = client.put(
        f"/api/v1/campaigns/{c_id}/status",
        headers=admin_headers,
        json={"status": "Active"}
    )
    assert st_res.status_code == 200
    assert st_res.json()["status"] == "Active"

def test_hierarchical_location_tree(client, admin_headers):
    res = client.get("/api/v1/locations/tree", headers=admin_headers)
    assert res.status_code == 200
    tree = res.json()
    assert len(tree) >= 1
    root = tree[0]
    assert root["name"] == "Pakistan"
    assert root["level"] == "country"
    assert len(root["children"]) >= 1

def test_advertisement_registration(client, admin_headers):
    # Get seeded campaign and location
    camps = client.get("/api/v1/campaigns", headers=admin_headers).json()["items"]
    assert len(camps) > 0
    c_id = camps[0]["id"]

    locs = client.get("/api/v1/locations", headers=admin_headers).json()
    assert len(locs) > 0
    loc_id = locs[0]["id"]

    ad_res = client.post(
        "/api/v1/advertisements",
        headers=admin_headers,
        json={
            "name": "Supernet 5G Digital Billboard",
            "campaign_id": c_id,
            "location_id": loc_id,
            "ad_type": "Digital LED",
            "brand": "Supernet",
            "dimensions": "40x20",
            "orientation": "North-Facing",
            "illumination_type": "Digital/LED",
            "status": "Active"
        }
    )
    assert ad_res.status_code == 201
    assert ad_res.json()["brand"] == "Supernet"

def test_competitor_comparison(client, admin_headers):
    res = client.get("/api/v1/competitors/compare?client_brand=Jazz", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["client_brand"] == "Jazz"
    assert len(data["comparison"]) >= 1
    client_entry = [c for c in data["comparison"] if c["is_client"]][0]
    assert client_entry["brand"] == "Jazz"
