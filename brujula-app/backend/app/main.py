"""Servidor de la Brújula Triple Impacto.

Recibe los cambios que cada celular guardó sin conexión y le devuelve los cambios de
los demás. Regla de conflicto: gana el cambio con la marca de tiempo más reciente.

Ejecutar:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Documentación interactiva:  http://localhost:8000/docs
"""

import json
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import insert, select, update

from .db import crear_tablas, engine, registros, versiones
from .reglas import generar_alertas

Coleccion = Literal["riesgos", "fincas", "decisiones", "bitacora"]

@asynccontextmanager
async def _ciclo_de_vida(_app: FastAPI):
    crear_tablas()  # crea las tablas la primera vez
    yield


app = FastAPI(title="Brújula Triple Impacto · servidor", version="0.2.0", lifespan=_ciclo_de_vida)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class Cambio(BaseModel):
    coleccion: Coleccion
    id: str
    datos: dict[str, Any] | None  # None = borrado
    actualizado: str  # fecha ISO


class PeticionSync(BaseModel):
    cambios: list[Cambio] = []
    cursor: int = 0


class RespuestaSync(BaseModel):
    cambios: list[Cambio]
    cursor: int


@app.get("/salud")
def salud() -> dict:
    return {"ok": True}


@app.post("/sync", response_model=RespuestaSync)
def sincronizar(peticion: PeticionSync) -> RespuestaSync:
    with engine.begin() as con:
        # 1. Guardar los cambios del cliente (si son más recientes que lo guardado)
        for c in peticion.cambios:
            actual = con.execute(
                select(registros.c.actualizado).where(
                    registros.c.coleccion == c.coleccion, registros.c.id == c.id
                )
            ).first()
            if actual is not None and actual.actualizado >= c.actualizado:
                continue
            version = con.execute(insert(versiones)).inserted_primary_key[0]
            valores = {
                "datos": None if c.datos is None else json.dumps(c.datos, ensure_ascii=False),
                "actualizado": c.actualizado,
                "borrado": c.datos is None,
                "version": version,
            }
            if actual is None:
                con.execute(insert(registros).values(coleccion=c.coleccion, id=c.id, **valores))
            else:
                con.execute(
                    update(registros)
                    .where(registros.c.coleccion == c.coleccion, registros.c.id == c.id)
                    .values(**valores)
                )

        # 2. Devolver todo lo que cambió desde el cursor del cliente
        filas = con.execute(
            select(registros).where(registros.c.version > peticion.cursor).order_by(registros.c.version)
        ).all()

    cambios = [
        Cambio(
            coleccion=f.coleccion,
            id=f.id,
            datos=None if f.borrado else json.loads(f.datos),
            actualizado=f.actualizado,
        )
        for f in filas
    ]
    cursor = max([peticion.cursor, *[f.version for f in filas]])
    return RespuestaSync(cambios=cambios, cursor=cursor)


def _coleccion(nombre: str) -> list[dict]:
    with engine.connect() as con:
        filas = con.execute(
            select(registros.c.datos).where(registros.c.coleccion == nombre, registros.c.borrado.is_(False))
        ).all()
    return [json.loads(f.datos) for f in filas]


@app.get("/datos/{coleccion}")
def datos(coleccion: str) -> list[dict]:
    if coleccion not in ("riesgos", "fincas", "decisiones", "bitacora"):
        raise HTTPException(404, "Colección desconocida")
    return _coleccion(coleccion)


@app.get("/alertas")
def alertas(meta_agua: float = 7000) -> list[dict]:
    """Alertas con los datos de todos los dispositivos (para la gerencia)."""
    return generar_alertas(_coleccion("fincas"), _coleccion("bitacora"), date.today().isoformat(), meta_agua)
