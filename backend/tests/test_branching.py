def test_conditional_branching_rule_evaluation(client, admin_headers):
    # 1. Create a questionnaire with conditional rule
    res = client.post(
        "/api/v1/questionnaires",
        headers=admin_headers,
        json={
            "title": "Billboard Illumination Inspection",
            "category": "Billboard"
        }
    )
    q_id = res.json()["id"]

    # Question 1: Condition
    q1_res = client.post(
        f"/api/v1/questionnaires/{q_id}/questions",
        headers=admin_headers,
        json={
            "question_text": "Is the night illumination functioning properly?",
            "question_type": "single_choice",
            "is_required": True,
            "options": [
                {"label": "Yes - All bulbs lit", "value": "Yes"},
                {"label": "No - Lights broken or off", "value": "No"}
            ]
        }
    )
    q1_id = q1_res.json()["id"]

    # Question 2: Follow-up required photo
    q2_res = client.post(
        f"/api/v1/questionnaires/{q_id}/questions",
        headers=admin_headers,
        json={
            "question_text": "Upload photo of dark billboard junction box",
            "question_type": "image_upload",
            "is_required": True
        }
    )
    q2_id = q2_res.json()["id"]

    # Question 3: Standard observation
    q3_res = client.post(
        f"/api/v1/questionnaires/{q_id}/questions",
        headers=admin_headers,
        json={
            "question_text": "General surveyor comments",
            "question_type": "long_answer",
            "is_required": False
        }
    )
    q3_id = q3_res.json()["id"]

    # Add Branching Rule: Show q2 ONLY when q1 equals "No"
    rule_res = client.post(
        f"/api/v1/questionnaires/{q_id}/rules",
        headers=admin_headers,
        json={
            "source_question_id": q1_id,
            "target_question_id": q2_id,
            "condition_operator": "equals",
            "condition_value": "No",
            "action": "show"
        }
    )
    assert rule_res.status_code == 201

    # Scenario A: Respondent answers "Yes" -> q2 should be HIDDEN!
    eval_a = client.post(
        f"/api/v1/questionnaires/{q_id}/preview-evaluate",
        headers=admin_headers,
        json={"answers": {q1_id: "Yes"}}
    )
    assert eval_a.status_code == 200
    res_a = eval_a.json()
    assert q1_id in res_a["visible_question_ids"]
    assert q3_id in res_a["visible_question_ids"]
    assert q2_id in res_a["hidden_question_ids"]

    # Scenario B: Respondent answers "No" -> q2 should now be VISIBLE!
    eval_b = client.post(
        f"/api/v1/questionnaires/{q_id}/preview-evaluate",
        headers=admin_headers,
        json={"answers": {q1_id: "No"}}
    )
    assert eval_b.status_code == 200
    res_b = eval_b.json()
    assert q2_id in res_b["visible_question_ids"]
    assert q2_id not in res_b["hidden_question_ids"]
