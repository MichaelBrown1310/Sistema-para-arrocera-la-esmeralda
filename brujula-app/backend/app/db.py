"""Base de datos del servidor.

Por defecto usa SQLite (un archivo brujula.db). Para PostgreSQL, define la variable
de entorno DATABASE_URL, por ejemplo:
    postgresql+psycopg://usuario:clave@localhost:5432/brujula
"""

import os

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brujula.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

metadata = MetaData()

# Un registro por cada elemento de cada colección (riesgo, finca, decisión, bitácora).
# `datos` guarda el elemento completo en JSON; `version` es el número de cambio del servidor.
registros = Table(
    "registros",
    metadata,
    Column("coleccion", String(20), primary_key=True),
    Column("id", String(64), primary_key=True),
    Column("datos", Text, nullable=True),
    Column("actualizado", String(40), nullable=False),
    Column("borrado", Boolean, nullable=False, default=False),
    Column("version", Integer, nullable=False, index=True),
)

# Contador de versiones: cada fila insertada entrega el siguiente número.
versiones = Table(
    "versiones",
    metadata,
    Column("version", Integer, primary_key=True, autoincrement=True),
)


def crear_tablas() -> None:
    metadata.create_all(engine)
