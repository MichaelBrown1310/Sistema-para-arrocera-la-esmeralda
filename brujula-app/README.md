# Brújula Triple Impacto · prototipo Ionic + React (v0.2)

App móvil para apoyar decisiones en Arrocera La Esmeralda (Arroz Blanquita) teniendo en cuenta
el riesgo y el triple impacto (económico, social y ambiental).

> **Prototipo académico con datos de ejemplo** (no son datos reales de la empresa).

El proyecto tiene dos partes:

| Carpeta | Qué es | ¿Obligatoria? |
| --- | --- | --- |
| `/` (raíz) | La app (Ionic + React + Capacitor). Funciona sola, guardando en el dispositivo. | Sí |
| `backend/` | Servidor (Python + FastAPI) para sincronizar varios celulares. | Solo si quieres sincronizar |

## 1. Ejecutar la app

Requisitos: Node.js 20 o superior. En Windows, pon el proyecto fuera de `Documentos`
(por ejemplo `C:\dev\brujula-app`) para evitar bloqueos de Windows Defender.

```bash
pnpm install        # o: npm install
pnpm dev            # o: npm run dev  → abre http://localhost:5173
pnpm test           # pruebas de la lógica (18)
```

Si pnpm pide aprobar scripts de instalación, ejecuta `pnpm approve-builds`, marca `esbuild`
con la barra espaciadora y presiona Enter.

Con el Ionic CLI instalado (`npm i -g @ionic/cli`) también sirven `ionic serve` y `ionic build`.

## 2. Ejecutar el servidor (opcional, para sincronizar)

Requisitos: Python 3.10 o superior.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows   (en Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Documentación interactiva de la API: http://localhost:8000/docs
- Pruebas del servidor: `python -m pytest`
- Por defecto guarda en SQLite (`backend/brujula.db`). Para PostgreSQL instala
  `psycopg[binary]` y define `DATABASE_URL=postgresql+psycopg://usuario:clave@host:5432/brujula`.
- Alertas por correo para la gerencia: `python -m app.enviar_alertas`
  (configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USUARIO`, `SMTP_CLAVE`, `ALERTAS_PARA`;
  sin esa configuración solo imprime las alertas). Se puede programar una vez al día.

Luego, en la app: **Ajustes → Sincronización → Dirección del servidor**:

- En el mismo computador: `http://localhost:8000`
- Desde un celular en la misma red wifi: `http://IP-DEL-COMPUTADOR:8000`
  (la IP se ve con `ipconfig` en Windows; ej. `http://192.168.1.20:8000`)
- Desde el emulador de Android: `http://10.0.2.2:8000`

## 3. Instalarla como PWA (desde el navegador)

```bash
pnpm build          # genera dist/ con el manifest y el service worker
```

Publica la carpeta `dist/` en un hosting con HTTPS (Netlify, Vercel, Firebase Hosting…).
En el celular, abre la dirección y elige **"Agregar a pantalla de inicio"**. La app abre
sin internet porque el service worker guarda sus archivos.

## 4. Instalarla en Android (Capacitor)

Necesita Android Studio.

```bash
pnpm build
npx cap add android
npx cap sync android
npx cap open android
```

Después de `cap add android`, agrega estos permisos en
`android/app/src/main/AndroidManifest.xml` (dentro de `<manifest>`):

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Qué hace

| Pantalla | Qué se puede hacer |
| --- | --- |
| **Riesgos** | Matriz 5×5 (probabilidad × impacto), antes y después de controles. Crear, editar y borrar riesgos. |
| **Fincas → Lista** | Visitas de los agrónomos con alertas por finca. Buscar y filtrar las que tienen alerta. |
| **Fincas → Mapa** | Un punto por finca, del color de su alerta y del tamaño de su área. Filtro por zona (Valle y Cauca / Casanare). |
| **Formulario de visita** | Agua por hectárea y problemas de riego; control biológico, nivelación láser y reglas de lote orgánico; aves observadas; área, fecha de siembra, cosecha y producción esperadas; intención de volver a sembrar; ubicación GPS. |
| **Decidir** | Opciones con puntaje triple impacto, riesgo residual y candados; simulador de escenarios; aprobar una opción. |
| **Bitácora** | Decisiones aprobadas, supuestos, escenarios simulados, candados verificados, quién aprobó, revisión y resultado real. |
| **Reporte** | Reporte para auditorías (Empresa B, comercio justo, orgánico, Amigo de las Aves): vista, PDF y CSV. |
| **Alertas (campana)** | Alertas automáticas agrupadas en "Atender ya", "Revisar pronto" y "Para tener en cuenta". |
| **Ajustes** | Pesos del puntaje, apetito de riesgo, meta de agua, servidor de sincronización y notificaciones. |

### Alertas automáticas

| Alerta | Gravedad |
| --- | --- |
| Riesgo con controles por encima del apetito | Alta |
| Riesgo en rojo sin controles registrados | Alta |
| Agricultor que no volverá a sembrar | Alta |
| Insumo no permitido en lote orgánico | Alta |
| Revisión de una decisión vencida | Alta |
| Agricultor que duda si sembrar | Media |
| Agua sobre la meta | Media |
| Problema de riego | Media |
| Revisión de decisión en 7 días o menos | Media |
| Decisión abierta sin opción recomendable | Media |
| Cosecha esperada en 15 días o menos | Informativa |
| Finca sin visita hace más de 60 días | Informativa |

Si se activan en Ajustes, las alertas altas y medias nuevas llegan como notificación
(del celular en Android/iOS; del navegador en la versión web).

### Trabajo sin señal y sincronización

1. Todo se guarda primero en el dispositivo (IndexedDB), así que la app funciona sin internet.
2. Cada cambio entra a una cola de **pendientes**.
3. Cuando hay señal y un servidor configurado, la app envía los pendientes y recibe los cambios
   de los demás dispositivos: al abrirla, al volver la conexión, 4 segundos después de cada cambio
   y cada minuto.
4. Si dos personas modifican lo mismo, **gana el cambio más reciente**.

## Cómo calcula

Toda la lógica está en `src/domain/` y tiene pruebas.

- **Riesgo** = probabilidad × impacto (1 a 25). Verde 1–6, amarillo 8–12, rojo 15–25.
- **PTI** = 35 % económico + 35 % social + 30 % ambiental (pesos configurables).
- **Candados**: si una opción paga por debajo del mínimo de comercio justo, usa un insumo no
  permitido en lotes orgánicos o supera la meta de agua, queda **descartada**.
- **Apetito de riesgo** (12 por defecto): por encima, la opción "requiere mitigación".
- **Simulador**: sensibilidad media resta 10 puntos a cada pilar afectado; alta resta 20.

## Estructura

```
src/
  domain/                 Lógica pura (sin interfaz) + pruebas
    calculos.ts             Riesgo, PTI, candados, simulador, indicadores de fincas
    alertas.ts              Reglas de alertas automáticas
    sync.ts                 Cola de pendientes y regla "gana el más reciente"
    datosEjemplo.ts         Datos ilustrativos
  data/
    store.tsx               Estado, guardado en IndexedDB y sincronización
    notificaciones.ts       Notificaciones locales / del navegador
    reporte.ts              Reporte para auditorías (PDF y CSV)
  components/             Semáforo, matriz, mapa, campana de alertas…
  pages/                  Una pantalla por archivo
backend/
  app/main.py             API: /sync, /datos/{coleccion}, /alertas, /salud
  app/db.py               Base de datos (SQLite o PostgreSQL)
  app/reglas.py           Alertas del lado del servidor
  app/enviar_alertas.py   Correo diario de alertas
  tests/                  Pruebas del servidor
```

## Tecnologías

Ionic 9, React 19, TypeScript, React Router 6, Capacitor 8 (geolocalización, notificaciones
locales, archivos y compartir), Vite, vite-plugin-pwa (Workbox), idb-keyval (IndexedDB),
Leaflet + OpenStreetMap, jsPDF, Vitest. Servidor: FastAPI, SQLAlchemy, SQLite/PostgreSQL, pytest.

## Qué falta

- Inicio de sesión y permisos por rol (hoy cualquiera con la dirección del servidor puede sincronizar).
- Publicar el servidor con HTTPS en un hosting real.
- Carga automática de datos del IDEAM, Fedearroz, DIAN y Defensoría (no se ha verificado si tienen API).
- Resolver conflictos campo por campo (hoy gana el registro completo más reciente).
- Validar con la empresa los pesos, candados, escenarios y umbrales de alertas, y cargar datos reales.
