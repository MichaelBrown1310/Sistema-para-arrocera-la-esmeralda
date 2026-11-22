import importlib
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def cliente(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'prueba.db'}")
    import app.db
    import app.main

    importlib.reload(app.db)
    importlib.reload(app.main)
    with TestClient(app.main.app) as c:
        yield c


def cambio(id_, actualizado, datos):
    return {"coleccion": "fincas", "id": id_, "actualizado": actualizado, "datos": datos}


def test_salud(cliente):
    assert cliente.get("/salud").json() == {"ok": True}


def test_dos_celulares_se_sincronizan(cliente):
    # Celular A envía una finca
    r = cliente.post("/sync", json={"cambios": [cambio("f1", "2026-11-08T10:00:00Z", {"id": "f1", "nombre": "A"})], "cursor": 0})
    assert r.status_code == 200
    cursor_a = r.json()["cursor"]
    assert cursor_a == 1

    # Celular B (sin nada) recibe la finca
    r = cliente.post("/sync", json={"cambios": [], "cursor": 0})
    assert [c["id"] for c in r.json()["cambios"]] == ["f1"]

    # B la modifica más tarde; A recibe la nueva versión
    cliente.post("/sync", json={"cambios": [cambio("f1", "2026-11-08T11:00:00Z", {"id": "f1", "nombre": "B"})], "cursor": 1})
    r = cliente.post("/sync", json={"cambios": [], "cursor": cursor_a})
    assert r.json()["cambios"][0]["datos"]["nombre"] == "B"


def test_gana_el_mas_reciente_y_borrados(cliente):
    cliente.post("/sync", json={"cambios": [cambio("f1", "2026-11-08T12:00:00Z", {"id": "f1", "nombre": "nuevo"})]})
    # un cambio más viejo no sobrescribe
    cliente.post("/sync", json={"cambios": [cambio("f1", "2026-11-08T09:00:00Z", {"id": "f1", "nombre": "viejo"})]})
    assert cliente.get("/datos/fincas").json()[0]["nombre"] == "nuevo"
    # borrado
    r = cliente.post("/sync", json={"cambios": [cambio("f1", "2026-11-08T13:00:00Z", None)], "cursor": 0})
    assert r.json()["cambios"][0]["datos"] is None
    assert cliente.get("/datos/fincas").json() == []


def test_alertas(cliente):
    finca = {"id": "f5", "nombre": "El Porvenir", "intencionSiembra": "no", "aguaM3Ha": 8000, "problemasRiego": True}
    cliente.post("/sync", json={"cambios": [cambio("f5", "2026-11-08T10:00:00Z", finca)]})
    titulos = [a["titulo"] for a in cliente.get("/alertas").json()]
    assert "El Porvenir: no volverá a sembrar" in titulos
    assert "El Porvenir: agua sobre la meta" in titulos
