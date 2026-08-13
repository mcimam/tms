def test_create_driver(client, staff_headers):
    resp = client.post("/api/drivers", json={"name": "Budi", "phone": "0812345"}, headers=staff_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Budi"
    assert body["phone"] == "0812345"
    assert body["status"] == "available"
    assert body["has_login"] is False


def test_create_driver_with_login(client, staff_headers):
    resp = client.post(
        "/api/drivers",
        json={"name": "Budi", "username": "budi", "password": "secret123"},
        headers=staff_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["has_login"] is True

    login = client.post("/api/auth/login", json={"username": "budi", "password": "secret123"})
    assert login.status_code == 200


def test_create_driver_duplicate_username_conflicts(client, staff_headers):
    client.post(
        "/api/drivers",
        json={"name": "Budi", "username": "budi", "password": "secret123"},
        headers=staff_headers,
    )
    resp = client.post(
        "/api/drivers",
        json={"name": "Other", "username": "budi", "password": "secret456"},
        headers=staff_headers,
    )
    assert resp.status_code == 409


def test_list_drivers(client, staff_headers):
    client.post("/api/drivers", json={"name": "Charlie"}, headers=staff_headers)
    client.post("/api/drivers", json={"name": "Alpha"}, headers=staff_headers)

    resp = client.get("/api/drivers", headers=staff_headers)
    assert resp.status_code == 200
    names = [d["name"] for d in resp.json()]
    assert names == sorted(names)
    assert {"Alpha", "Charlie"} <= set(names)


def test_list_drivers_filtered_by_status(client, staff_headers):
    client.post("/api/drivers", json={"name": "Alpha"}, headers=staff_headers)
    resp = client.get("/api/drivers", params={"status_filter": "available"}, headers=staff_headers)
    assert resp.status_code == 200
    assert all(d["status"] == "available" for d in resp.json())

    resp = client.get("/api/drivers", params={"status_filter": "on_trip"}, headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_driver(client, staff_headers, driver):
    resp = client.get(f"/api/drivers/{driver.id}", headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Driver"


def test_get_driver_not_found(client, staff_headers):
    resp = client.get("/api/drivers/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_update_driver(client, staff_headers, driver):
    resp = client.put(f"/api/drivers/{driver.id}", json={"name": "Renamed Driver"}, headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed Driver"


def test_update_driver_not_found(client, staff_headers):
    resp = client.put("/api/drivers/9999", json={"name": "x"}, headers=staff_headers)
    assert resp.status_code == 404


def test_update_driver_adds_login(client, staff_headers, driver):
    resp = client.put(
        f"/api/drivers/{driver.id}",
        json={"username": "newdriver", "password": "secret123"},
        headers=staff_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["has_login"] is True


def test_update_driver_username_conflicts(client, staff_headers, driver):
    client.post("/api/drivers", json={"name": "Other", "username": "taken", "password": "secret123"}, headers=staff_headers)
    resp = client.put(
        f"/api/drivers/{driver.id}",
        json={"username": "taken", "password": "secret123"},
        headers=staff_headers,
    )
    assert resp.status_code == 409


def test_delete_driver(client, staff_headers, driver):
    resp = client.delete(f"/api/drivers/{driver.id}", headers=staff_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/drivers/{driver.id}", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_driver_not_found(client, staff_headers):
    resp = client.delete("/api/drivers/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_driver_removes_login(client, staff_headers):
    created = client.post(
        "/api/drivers",
        json={"name": "Budi", "username": "budi", "password": "secret123"},
        headers=staff_headers,
    ).json()

    resp = client.delete(f"/api/drivers/{created['id']}", headers=staff_headers)
    assert resp.status_code == 204

    login = client.post("/api/auth/login", json={"username": "budi", "password": "secret123"})
    assert login.status_code == 401


def test_delete_driver_with_orders_conflicts(client, staff_headers, driver, customer):
    truck = client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers).json()
    order = client.post(
        "/api/orders",
        json={"customer_id": customer["id"], "load_location": "Jakarta", "unload_location": "Bandung"},
        headers=staff_headers,
    ).json()
    resp = client.post(
        f"/api/orders/{order['id']}/assign",
        json={"driver_id": driver.id, "truck_id": truck["id"]},
        headers=staff_headers,
    )
    assert resp.status_code == 200

    resp = client.delete(f"/api/drivers/{driver.id}", headers=staff_headers)
    assert resp.status_code == 409


def test_driver_endpoints_require_auth(client):
    resp = client.get("/api/drivers")
    assert resp.status_code == 401


def test_driver_endpoints_forbidden_for_driver_role(client, driver_headers):
    resp = client.get("/api/drivers", headers=driver_headers)
    assert resp.status_code == 403
