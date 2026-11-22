"""Reglas de alertas del lado del servidor (las mismas de la app, para la gerencia)."""

from datetime import date


def _dias(a: str, b: str) -> int:
    return (date.fromisoformat(b) - date.fromisoformat(a)).days


def generar_alertas(fincas: list[dict], bitacora: list[dict], hoy: str, meta_agua: float) -> list[dict]:
    alertas: list[dict] = []
    for f in fincas:
        nombre = f.get("nombre", f.get("id"))
        if f.get("intencionSiembra") == "no":
            alertas.append({"gravedad": "alta", "titulo": f"{nombre}: no volverá a sembrar"})
        elif f.get("intencionSiembra") == "duda":
            alertas.append({"gravedad": "media", "titulo": f"{nombre}: duda si volverá a sembrar"})
        if f.get("loteOrganico") and f.get("insumoNoPermitido"):
            alertas.append({"gravedad": "alta", "titulo": f"{nombre}: candado del sello orgánico"})
        if (f.get("aguaM3Ha") or 0) > meta_agua:
            alertas.append({"gravedad": "media", "titulo": f"{nombre}: agua sobre la meta"})
        if f.get("problemasRiego"):
            alertas.append({"gravedad": "media", "titulo": f"{nombre}: problema de riego"})
    for b in bitacora:
        if b.get("estadoRevision") == "pendiente" and b.get("fechaRevision"):
            if _dias(hoy, b["fechaRevision"]) < 0:
                alertas.append({"gravedad": "alta", "titulo": f"Revisión vencida: {b.get('tituloDecision', '')}"})
    orden = {"alta": 0, "media": 1, "info": 2}
    return sorted(alertas, key=lambda a: orden[a["gravedad"]])
