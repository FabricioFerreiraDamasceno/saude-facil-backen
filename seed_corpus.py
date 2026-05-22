"""Seed providers + exams from Corpus Med XLS into Saúde Fácil API."""
import os
import sys
import json
import requests
import xlrd

BASE = "http://127.0.0.1:8000" 
XLS = r"C:\Users\louise\Desktop\saude_facil\backend\scripts\TabelaDePrecosCLINICA CORPUS MED DO TRABALHO _20250828_1329.xls" # COLOQUE O CAMINHO CORRETO AQUI

ADMIN = {
    "email": "admin@saudefacil.com.br", 
    "password": "Admin@2026"           
}



DOCTOR_AVATARS = [
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
    "https://images.pexels.com/photos/19438566/pexels-photo-19438566.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
]


def login():
    print(f"🔑 Tentando login em {BASE}/auth/login...")
    # Mudamos 'data=' para 'json=' e usamos 'email' conforme seu modelo
    payload = {
        "email": ADMIN["email"], 
        "password": ADMIN["password"]
    }
    
    r = requests.post(f"{BASE}/auth/login", json=payload, timeout=10)
    
    if r.status_code != 200:
        print(f"❌ Erro no login: {r.status_code} - {r.text}")
        r.raise_for_status()
        
    data = r.json()
    print("✅ Login realizado com sucesso!")
    return data["access_token"]

def safe_post(url, **kwargs):
    for _ in range(3):
        try:
            r = requests.post(url, timeout=20, **kwargs)
            return r
        except Exception:
            continue
    raise Exception("Falha na requisição")

def infer_category(name: str) -> str:
    n = name.upper()
    img_keys = ["RAIO", "RAIO-X", "RAIO X", "ULTRA", "ULTRASSOM", "TOMOGRAFIA",
                "RESSONANCIA", "RESSONÂNCIA", "ECG", "ECOCARDIO", "MAMOGRAFIA",
                "DENSITOMETRIA", "DOPPLER", "ENDOSCOPIA", "COLONOSCOPIA", "ECG-",
                "ELETROCARDIOGRAMA", "ESPIROMETRIA", "AUDIOMETRIA"]
    if any(k in n for k in img_keys):
        return "Imagem"
    return "Laboratoriais"


def main():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}

    # 1) Providers
    providers = [
        {
            "full_name": "Dr. Guilherme Souza Maia",
            "type": "MEDIC",
            "specialty": "Cardiologia",
            "crm": "CREMESP 226524",
            "bio": "Cardiologista clínico — atendimento de adultos com foco em prevenção e arritmias.",
            "avatar": DOCTOR_AVATARS[0],
            "base_price": 250.0,
        },
        {
            "full_name": "Juliana Araújo",
            "type": "PSYCHOLOGIST",
            "specialty": "Psicologia Clínica",
            "crm": "CRP-0483272",
            "bio": "Psicóloga clínica — terapia individual e ansiedade.",
            "avatar": DOCTOR_AVATARS[1],
            "base_price": 180.0,
        },
        {
            "full_name": "Rassinou Dias",
            "type": "MEDIC",
            "specialty": "Fonoaudiologia",
            "crm": "CRF 11553",
            "bio": "Fonoaudiólogo — terapia de fala, voz e audição.",
            "avatar": DOCTOR_AVATARS[2],
            "base_price": 150.0,
        },
    ]
    created_provs = 0
    for p in providers:
        r = requests.post(f"{BASE}/providers", json=p, headers=headers, timeout=10)
        if r.status_code in (200, 201):
            created_provs += 1
        else:
            print("Provider ERR:", p["full_name"], r.status_code, r.text[:200])
    print(f"✅ Providers created: {created_provs}/{len(providers)}")

    # 2) Exams from XLS (Coluna PREÇO_FINAL = preço de venda)
    book = xlrd.open_workbook(XLS)
    sheet = book.sheet_by_index(0)
    exams = []
    seen = set()
    for r in range(3, sheet.nrows):  # skip headers
        try:
            name = str(sheet.cell_value(r, 1)).strip()
            price = sheet.cell_value(r, 4)
        except Exception:
            continue
        if not name or name.lower() in seen:
            continue
        try:
            price = float(price)
        except Exception:
            continue
        if price <= 0:
            continue
        seen.add(name.lower())
        exams.append({
            "name": name.title()[:120],
            "description": "Exame ofertado por Saúde Fácil Brasil.",
            "price": round(price, 2),
            "category": infer_category(name),
            "image": None,
        })
    print(f"📋 Exams parsed from XLS: {len(exams)}")

    # Send in chunks
    CHUNK = 200
    inserted = 0
    for i in range(0, len(exams), CHUNK):
        payload = {"exams": exams[i:i + CHUNK]}
        r = requests.post(f"{BASE}/admin/batch/exams", json=payload, headers=headers, timeout=30)
        if r.status_code in (200, 201):
            inserted += r.json().get("inserted", 0)
        else:
            print("Batch ERR:", r.status_code, r.text[:200])
            break
    print(f"✅ Exams inserted: {inserted}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FATAL:", e, file=sys.stderr)
        sys.exit(1)
