def test_create_truck(client, staff_headers):
    resp = client.post("/api/trucks", json={"plate": "B1234XYZ", "type": "box"}, headers=staff_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["plate"] == "B1234XYZ"
    assert body["type"] == "box"
    assert body["status"] == "available"


def test_create_truck_duplicate_plate_conflicts(client, staff_headers):
    client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers)
    resp = client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers)
    assert resp.status_code == 409


def test_list_trucks(client, staff_headers):
    client.post("/api/trucks", json={"plate": "B2222ZZ"}, headers=staff_headers)
    client.post("/api/trucks", json={"plate": "B1111AA"}, headers=staff_headers)

    resp = client.get("/api/trucks", headers=staff_headers)
    assert resp.status_code == 200
    plates = [t["plate"] for t in resp.json()]
    assert plates == sorted(plates)
    assert {"B1111AA", "B2222ZZ"} <= set(plates)


def test_list_trucks_filtered_by_status(client, staff_headers):
    client.post("/api/trucks", json={"plate": "B1111AA"}, headers=staff_headers)
    resp = client.get("/api/trucks", params={"status_filter": "available"}, headers=staff_headers)
    assert resp.status_code == 200
    assert all(t["status"] == "available" for t in resp.json())

    resp = client.get("/api/trucks", params={"status_filter": "on_trip"}, headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_truck(client, staff_headers):
    created = client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers).json()
    resp = client.get(f"/api/trucks/{created['id']}", headers=staff_headers)
    assert resp.status_code == 200
    assert resp.json()["plate"] == "B1234XYZ"


def test_get_truck_not_found(client, staff_headers):
    resp = client.get("/api/trucks/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_update_truck(client, staff_headers):
    created = client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers).json()
    resp = client.put(f"/api/trucks/{created['id']}", json={"type": "flatbed"}, headers=staff_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["type"] == "flatbed"
    assert body["plate"] == "B1234XYZ"


def test_update_truck_not_found(client, staff_headers):
    resp = client.put("/api/trucks/9999", json={"type": "flatbed"}, headers=staff_headers)
    assert resp.status_code == 404


def test_delete_truck(client, staff_headers):
    created = client.post("/api/trucks", json={"plate": "B1234XYZ"}, headers=staff_headers).json()
    resp = client.delete(f"/api/trucks/{created['id']}", headers=staff_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/trucks/{created['id']}", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_truck_not_found(client, staff_headers):
    resp = client.delete("/api/trucks/9999", headers=staff_headers)
    assert resp.status_code == 404


def test_delete_truck_with_orders_conflicts(client, staff_headers, driver, customer):
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

    resp = client.delete(f"/api/trucks/{truck['id']}", headers=staff_headers)
    assert resp.status_code == 409


def test_truck_endpoints_require_auth(client):
    resp = client.get("/api/trucks")
    assert resp.status_code == 401


def test_truck_endpoints_forbidden_for_driver_role(client, driver_headers):
    resp = client.get("/api/trucks", headers=driver_headers)
    assert resp.status_code == 403
