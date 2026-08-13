def _create_order(client, headers, customer_id, **overrides):
    payload = {
        "customer_id": customer_id,
        "load_location": "Jakarta",
        "unload_location": "Bandung",
    }
    payload.update(overrides)
    return client.post("/api/orders", json=payload, headers=headers)


def test_create_order(client, staff_headers, customer):
    resp = _create_order(client, staff_headers, customer["id"])
    assert resp.status_code == 201
    body = resp.json()
    assert body["customer_id"] == customer["id"]
    assert body["status"] == "ORDER"
    assert body["order_no"]
    assert body["current_location"] == "Jakarta"


def test_create_order_invalid_customer_not_found(client, staff_headers):
    resp = _create_order(client, staff_headers, 9999)
    assert resp.status_code == 404


def test_create_order_forbidden_for_driver_role(client, driver_headers, customer):
    resp = _create_order(client, driver_headers, customer["id"])
    assert resp.status_code == 403


def test_list_orders(client, staff_headers, customer):
    _create_order(client, staff_headers, customer["id"])
    resp = client.get("/api/orders", headers=staff_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    assert len(body["items"]) >= 1
    assert body["page"] == 1


def test_list_orders_filtered_by_customer(client, staff_headers, customer):
    other_customer = client.post("/api/customers", json={"name": "Other Co"}, headers=staff_headers).json()
    _create_order(client, staff_headers, customer["id"])
    _create_order(client, staff_headers, other_customer["id"])

    resp = client.get("/api/orders", params={"customer_id": customer["id"]}, headers=staff_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["customer_id"] == customer["id"]


def test_get_order(client, staff_headers, customer):
    created = _create_order(client, staff_headers, customer["id"]).json()
    resp = client.get(f"/api/orders/{created['id']}", headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_get_order_not_found(client, staff_headers):
    resp = client.get("/api/orders/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_driver_cannot_see_unassigned_order(client, staff_headers, driver_headers, customer):
    created = _create_order(client, staff_headers, customer["id"]).json()
    resp = client.get(f"/api/orders/{created['id']}", headers=driver_headers)
    assert resp.status_code == 403


def test_driver_can_see_assigned_order(client, staff_headers, driver_headers, driver, customer):
    truck = client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers).json()
    created = _create_order(client, staff_headers, customer["id"]).json()
    client.post(
        f"/api/orders/{created['id']}/assign",
        json={"driver_id": driver.id, "truck_id": truck["id"]},
        headers=staff_headers,
    )
    resp = client.get(f"/api/orders/{created['id']}", headers=driver_headers)
    assert resp.status_code == 200


def test_update_order(client, staff_headers, customer):
    created = _create_order(client, staff_headers, customer["id"]).json()
    resp = client.put(f"/api/orders/{created['id']}", json={"notes": "handle with care"}, headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json()["notes"] == "handle with care"


def test_update_order_not_found(client, staff_headers):
    resp = client.put("/api/orders/9999", json={"notes": "x"}, headers=staff_headers)
    assert resp.status_code == 404


def test_update_order_forbidden_for_driver_role(client, driver_headers, customer, staff_headers):
    created = _create_order(client, staff_headers, customer["id"]).json()
    resp = client.put(f"/api/orders/{created['id']}", json={"notes": "x"}, headers=driver_headers)
    assert resp.status_code == 403


def test_delete_order(client, staff_headers, customer):
    created = _create_order(client, staff_headers, customer["id"]).json()
    resp = client.delete(f"/api/orders/{created['id']}", headers=staff_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/orders/{created['id']}", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_order_not_found(client, staff_headers):
    resp = client.delete("/api/orders/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_order_forbidden_for_driver_role(client, driver_headers, customer, staff_headers):
    created = _create_order(client, staff_headers, customer["id"]).json()
    resp = client.delete(f"/api/orders/{created['id']}", headers=driver_headers)
    assert resp.status_code == 403


def test_order_endpoints_require_auth(client):
    resp = client.get("/api/orders")
    assert resp.status_code == 401
