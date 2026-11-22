"""Envía por correo las alertas actuales a la gerencia.

Pensado para ejecutarse una vez al día con una tarea programada
(Programador de tareas de Windows o cron en Linux):

    python -m app.enviar_alertas

Si no hay configuración de correo, solo imprime las alertas. Variables de entorno:
SMTP_HOST, SMTP_PORT (587), SMTP_USUARIO, SMTP_CLAVE, ALERTAS_PARA (correo destino).
"""

import os
import smtplib
from datetime import date
from email.message import EmailMessage

from .db import crear_tablas
from .main import _coleccion
from .reglas import generar_alertas


def main() -> None:
    crear_tablas()
    lista = generar_alertas(_coleccion("fincas"), _coleccion("bitacora"), date.today().isoformat(), 7000)
    texto = "\n".join(f"[{a['gravedad'].upper()}] {a['titulo']}" for a in lista) or "Sin alertas."
    print(texto)

    host, para = os.getenv("SMTP_HOST"), os.getenv("ALERTAS_PARA")
    if not host or not para or not lista:
        return
    msg = EmailMessage()
    msg["Subject"] = f"Brújula Triple Impacto: {len(lista)} alertas"
    msg["From"] = os.getenv("SMTP_USUARIO", "brujula@localhost")
    msg["To"] = para
    msg.set_content(texto)
    with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587"))) as s:
        s.starttls()
        if os.getenv("SMTP_USUARIO"):
            s.login(os.getenv("SMTP_USUARIO", ""), os.getenv("SMTP_CLAVE", ""))
        s.send_message(msg)
    print(f"Correo enviado a {para}.")


if __name__ == "__main__":
    main()
