"""Backend tests for Saúde Fácil Brasil API"""
import os
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") if os.environ.get("EXPO_PUBLIC_BACKEND_URL") else "https://saude-facil-app.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@saudefacil.com.br"
ADMIN_PASSWORD = "Admin@2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def patient():
    email = f"test_pat_{uuid.uuid4().hex[:8]}@teste.com"
    r = requests.post(f"{API}/auth/register", json={
        "full_name": "Paciente Teste", "email": email, "password": "Teste@123", "phone": "11999990000"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["access_token"], "user": data["user"], "email": email}


def auth(token): return {"Authorization": f"Bearer {token}"}


# Health
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# Auth
def test_register_and_token(patient):
    assert patient["token"]
    assert patient["user"]["role"] == "PATIENT"
    assert patient["user"]["email"] == patient["email"]


def test_register_duplicate(patient):
    r = requests.post(f"{API}/auth/register", json={
        "full_name": "Dup", "email": patient["email"], "password": "Teste@123"
    })
    assert r.status_code == 400


def test_login_admin(admin_token):
    assert admin_token


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": "nope@x.com", "password": "wrong"})
    assert r.status_code == 401


def test_me(patient):
    r = requests.get(f"{API}/auth/me", headers=auth(patient["token"]))
    assert r.status_code == 200
    assert r.json()["email"] == patient["email"]


def test_me_no_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_google_login_mocked():
    email = f"test_g_{uuid.uuid4().hex[:8]}@gmail.com"
    r = requests.post(f"{API}/auth/google", json={"email": email, "full_name": "Google User"})
    assert r.status_code == 200
    assert r.json()["user"]["email"] == email


# Providers
def test_providers_list_empty_or_list():
    r = requests.get(f"{API}/providers")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_provider_create_non_admin_403(patient):
    r = requests.post(f"{API}/providers", headers=auth(patient["token"]), json={
        "full_name": "Dr Test", "type": "MEDIC", "specialty": "Cardio", "base_price": 100
    })
    assert r.status_code == 403


@pytest.fixture(scope="module")
def provider(admin_token):
    r = requests.post(f"{API}/providers", headers=auth(admin_token), json={
        "full_name": "Dr TEST House", "type": "MEDIC", "specialty": "Clinica Geral",
        "crm": "CRM12345", "base_price": 200, "bio": "Test"
    })
    assert r.status_code == 201, r.text
    return r.json()


def test_provider_create_admin(provider):
    assert provider["id"]
    assert provider["full_name"] == "Dr TEST House"


def test_provider_appears_in_list(provider):
    r = requests.get(f"{API}/providers")
    ids = [p["id"] for p in r.json()]
    assert provider["id"] in ids


# Slots
def test_slots_14days(provider):
    r = requests.get(f"{API}/providers/{provider['id']}/slots")
    assert r.status_code == 200
    slots = r.json()
    # 14 days * 10 hours * 2 (every 30min) = 280
    assert len(slots) == 280
    assert "start_datetime" in slots[0]
    assert "is_available" in slots[0]


# Appointments
def test_book_appointment_and_conflict(patient, provider):
    # pick slot 7 days ahead 10:00
    day = (datetime.now(timezone.utc) + timedelta(days=7)).replace(hour=10, minute=0, second=0, microsecond=0)
    payload = {"provider_id": provider["id"], "start_datetime": day.isoformat(), "modality": "PRESENTIAL"}
    r1 = requests.post(f"{API}/appointments", headers=auth(patient["token"]), json=payload)
    assert r1.status_code == 201, r1.text
    appt = r1.json()
    assert appt["status"] == "PENDING"

    r2 = requests.post(f"{API}/appointments", headers=auth(patient["token"]), json=payload)
    assert r2.status_code == 409


# Products
def test_products_list():
    r = requests.get(f"{API}/products")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_product_create_admin(admin_token):
    r = requests.post(f"{API}/products", headers=auth(admin_token), json={
        "name": "TEST_Dipirona", "price": 12.5, "stock": 50, "category": "Medicamentos"
    })
    assert r.status_code == 201
    assert r.json()["name"] == "TEST_Dipirona"


def test_product_create_non_admin(patient):
    r = requests.post(f"{API}/products", headers=auth(patient["token"]), json={"name": "x", "price": 1})
    assert r.status_code == 403


# Exams
def test_exams_list():
    r = requests.get(f"{API}/exams")
    assert r.status_code == 200


@pytest.fixture(scope="module")
def exam(admin_token):
    r = requests.post(f"{API}/exams", headers=auth(admin_token), json={
        "name": "TEST_Hemograma", "price": 80, "category": "Laboratoriais"
    })
    assert r.status_code == 201
    return r.json()


def test_exam_create_admin(exam):
    assert exam["id"]


# Orders
def test_create_order_with_fee_and_pay(patient, exam, provider):
    items = [
        {"type": "EXAM", "reference_id": exam["id"], "title": exam["name"], "price": 80, "quantity": 1},
        {"type": "PRODUCT", "reference_id": "p1", "title": "Med", "price": 20, "quantity": 2},
    ]
    r = requests.post(f"{API}/orders", headers=auth(patient["token"]),
                      json={"items": items, "payment_method": "PIX"})
    assert r.status_code == 201, r.text
    o = r.json()
    # subtotal 80 + 40 = 120, 5% fee = 6, total = 126
    assert o["subtotal"] == 120.0
    assert o["service_fee"] == 6.0
    assert o["total"] == 126.0
    assert o["status"] == "PENDING"

    # GET persistence
    r2 = requests.get(f"{API}/orders/{o['id']}", headers=auth(patient["token"]))
    assert r2.status_code == 200

    # Pay
    r3 = requests.post(f"{API}/orders/{o['id']}/pay", headers=auth(patient["token"]))
    assert r3.status_code == 200
    assert r3.json()["status"] == "PAID"

    # Verify status updated
    r4 = requests.get(f"{API}/orders/{o['id']}", headers=auth(patient["token"]))
    assert r4.json()["status"] == "PAID"


def test_empty_cart_order(patient):
    r = requests.post(f"{API}/orders", headers=auth(patient["token"]),
                      json={"items": [], "payment_method": "PIX"})
    assert r.status_code == 400
