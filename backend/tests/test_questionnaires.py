def test_create_and_publish_questionnaire(client, admin_headers):
    # 1. Create Draft Questionnaire
    res = client.post(
        "/api/v1/questionnaires",
        headers=admin_headers,
        json={
            "title": "Beverage Retail Shelf Audit",
            "description": "Store audit for soft drink placements in Islamabad supermarkets",
            "category": "Retail"
        }
    )
    assert res.status_code == 201
    q_data = res.json()
    q_id = q_data["id"]
    assert q_data["status"] == "Draft"
    assert q_data["current_version"] == 1

    # 2. Add Question with Urdu Translation
    q_res = client.post(
        f"/api/v1/questionnaires/{q_id}/questions",
        headers=admin_headers,
        json={
            "question_text": "Is the brand refrigerator stocked to full capacity?",
            "question_type": "single_choice",
            "is_required": True,
            "order_index": 0,
            "options": [
                {"label": "100% Full", "value": "100_percent", "order_index": 0},
                {"label": "50% Half Full", "value": "50_percent", "order_index": 1},
                {"label": "Empty / Out of Stock", "value": "empty", "order_index": 2}
            ],
            "translations": [
                {
                    "language_code": "ur",
                    "translated_text": "کیا برانڈ ریفریجریٹر مکمل طور پر بھرا ہوا ہے؟",
                    "translated_options": [
                        {"label": "مکمل بھرا ہوا", "value": "100_percent"},
                        {"label": "آدھا بھرا ہوا", "value": "50_percent"},
                        {"label": "خالی / اسٹاک ختم", "value": "empty"}
                    ]
                }
            ]
        }
    )
    assert q_res.status_code == 201
    assert len(q_res.json()["options"]) == 3
    assert len(q_res.json()["translations"]) == 1

    # 3. Publish Questionnaire
    pub_res = client.post(f"/api/v1/questionnaires/{q_id}/publish", headers=admin_headers)
    assert pub_res.status_code == 200
    version_data = pub_res.json()
    assert version_data["version_number"] == 1
    assert version_data["status"] == "Published"

    # 4. Check Detail
    detail_res = client.get(f"/api/v1/questionnaires/{q_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] == "Published"
    assert len(detail_res.json()["questions"]) == 1

def test_duplicate_questionnaire(client, admin_headers):
    # Find existing seeded questionnaire
    list_res = client.get("/api/v1/questionnaires", headers=admin_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) > 0
    orig_id = list_res.json()["items"][0]["id"]

    dup_res = client.post(f"/api/v1/questionnaires/{orig_id}/duplicate", headers=admin_headers)
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert "(Copy)" in dup_data["title"]
    assert dup_data["status"] == "Draft"
