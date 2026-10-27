from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "estaciones" in data
    assert len(data["estaciones"]) == 4

def test_list_stations():
    response = client.get("/api/stations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    ids = [s["id"] for s in data]
    assert "puerto_ayacucho" in ids
    assert "ciudad_bolivar" in ids

def test_summary():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert "estaciones" in data
    assert len(data["estaciones"]) == 4

def test_historical():
    response = client.get("/api/historical?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 10

def test_forecasts():
    response = client.get("/api/forecasts?station_id=ciudad_bolivar")
    assert response.status_code == 200
    data = response.json()
    assert data["horizonte_dias"] == 35

def test_metrics():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] > 0

def test_compare_series():
    response = client.get("/api/compare-series?station_id=palua&history_days=14")
    assert response.status_code == 200
    data = response.json()
    assert data["station_id"] == "palua"
    assert len(data["timeline"]) == 14 + 35
