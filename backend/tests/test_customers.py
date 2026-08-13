def test_create_customer(client, staff_headers):
    resp = client.post(
        "/api/customers",
        json={"name": "Acme Corp", "contact": "acme@example.com"},
        headers=staff_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Acme Corp"
    assert body["contact"] == "acme@example.com"
    assert "id" in body


def test_create_customer_without_contact(client, staff_headers):
    resp = client.post("/api/customers", json={"name": "No Contact Co"}, headers=staff_headers)
    assert resp.status_code == 201
    assert resp.json()["contact"] is None


def test_list_customers(client, staff_headers):
    client.post("/api/customers", json={"name": "Beta LLC"}, headers=staff_headers)
    client.post("/api/customers", json={"name": "Acme Corp"}, headers=staff_headers)

    resp = client.get("/api/customers", headers=staff_headers)
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert names == sorted(names)
    assert {"Acme Corp", "Beta LLC"} <= set(names)


def test_get_customer(client, staff_headers, customer):
    resp = client.get(f"/api/customers/{customer['id']}", headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Corp"


def test_get_customer_not_found(client, staff_headers):
    resp = client.get("/api/customers/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_update_customer(client, staff_headers, customer):
    resp = client.put(
        f"/api/customers/{customer['id']}",
        json={"contact": "new@example.com"},
        headers=staff_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["contact"] == "new@example.com"
    assert body["name"] == "Acme Corp"


def test_update_customer_not_found(client, staff_headers):
    resp = client.put("/api/customers/9999", json={"name": "x"}, headers=staff_headers)
    assert resp.status_code == 404


def test_delete_customer(client, staff_headers, customer):
    resp = client.delete(f"/api/customers/{customer['id']}", headers=staff_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/customers/{customer['id']}", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_customer_not_found(client, staff_headers):
    resp = client.delete("/api/customers/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_customer_with_orders_conflicts(client, staff_headers, customer):
    resp = client.post(
        "/api/orders",
        json={"customer_id": customer["id"], "load_location": "Jakarta", "unload_location": "Bandung"},
        headers=staff_headers,
    )
    assert resp.status_code == 201

    resp = client.delete(f"/api/customers/{customer['id']}", headers=staff_headers)
    assert resp.status_code == 409


def test_customer_endpoints_require_auth(client):
    resp = client.get("/api/customers")
    assert resp.status_code == 401


def test_customer_endpoints_forbidden_for_driver_role(client, driver_headers):
    resp = client.get("/api/customers", headers=driver_headers)
    assert resp.status_code == 403
