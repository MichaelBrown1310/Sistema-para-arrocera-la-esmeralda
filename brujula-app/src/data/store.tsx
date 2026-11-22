// Estado global de la app.
//
// - Guarda todo en el dispositivo (IndexedDB; si no está disponible, localStorage),
//   así la app funciona sin señal.
// - Cada cambio queda en una cola de "pendientes". Si hay un servidor configurado
//   en Ajustes, la cola se envía al volver la conexión y se reciben los cambios de
//   otros dispositivos (ver src/domain/sync.ts y la carpeta backend/).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type {
  Ajustes,
  Cambio,
  Coleccion,
  Decision,
  EstadoSync,
  Finca,
  RegistroBitacora,
  Riesgo,
} from '../domain/tipos';
import {
  AJUSTES_INICIALES,
  DECISIONES_EJEMPLO,
  FINCAS_EJEMPLO,
  RIESGOS_EJEMPLO,
  normalizarAjustes,
  normalizarFinca,
  normalizarRegistro,
} from '../domain/datosEjemplo';
import { aplicarRemotos, encolar, llamarServidor, quitarEnviados } from '../domain/sync';

export interface Datos {
  riesgos: Riesgo[];
  fincas: Finca[];
  decisiones: Decision[];
  bitacora: RegistroBitacora[];
  ajustes: Ajustes;
}

interface Estado {
  datos: Datos;
  sync: EstadoSync;
}

const CLAVE = 'brujula-triple-impacto:v2';
const CLAVE_V1 = 'brujula-triple-impacto:v1';

const datosIniciales = (): Datos => ({
  riesgos: RIESGOS_EJEMPLO,
  fincas: FINCAS_EJEMPLO,
  decisiones: DECISIONES_EJEMPLO,
  bitacora: [],
  ajustes: AJUSTES_INICIALES,
});

const syncInicial = (): EstadoSync => ({ pendientes: [], cursor: 0, ultimaSync: null, ultimoError: null });

/** Completa campos que falten (datos de versiones anteriores o recibidos del servidor). */
const normalizarItem = (coleccion: Coleccion, item: { id: string }) => {
  if (coleccion === 'fincas') return normalizarFinca(item as Finca);
  if (coleccion === 'bitacora') return normalizarRegistro(item as RegistroBitacora);
  return item;
};

const normalizarEstado = (crudo: Partial<Estado> | null): Estado => {
  const base = datosIniciales();
  const d = (crudo?.datos ?? {}) as Partial<Datos>;
  return {
    datos: {
      riesgos: d.riesgos ?? base.riesgos,
      fincas: (d.fincas ?? base.fincas).map(normalizarFinca),
      decisiones: d.decisiones ?? base.decisiones,
      bitacora: (d.bitacora ?? []).map(normalizarRegistro),
      ajustes: normalizarAjustes(d.ajustes),
    },
    sync: { ...syncInicial(), ...(crudo?.sync ?? {}) },
  };
};

/* ---------- Almacenamiento local ---------- */

const leerGuardado = async (): Promise<Estado> => {
  try {
    const v = await idbGet<Estado>(CLAVE);
    if (v) return normalizarEstado(v);
  } catch {
    /* IndexedDB no disponible: se intenta localStorage */
  }
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo) return normalizarEstado(JSON.parse(crudo));
    const v1 = localStorage.getItem(CLAVE_V1); // datos de la versión 0.1
    if (v1) return normalizarEstado({ datos: JSON.parse(v1) });
  } catch {
    /* sin almacenamiento: se usan los datos de ejemplo */
  }
  return normalizarEstado(null);
};

const escribir = async (e: Estado) => {
  try {
    await idbSet(CLAVE, e);
    return;
  } catch {
    /* sigue con localStorage */
  }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* si no se puede guardar, la app sigue funcionando en memoria */
  }
};

/* ---------- Utilidades ---------- */

export const nuevoId = (prefijo: string) =>
  `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Fecha local de hoy en formato AAAA-MM-DD. */
export const hoy = (fecha = new Date()) => fecha.toLocaleDateString('en-CA');

const ahora = () => new Date().toISOString();

const reemplazar = <T extends { id: string }>(lista: T[], item: T): T[] =>
  lista.some((x) => x.id === item.id) ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item];

/* ---------- Contexto ---------- */

export interface ResultadoSync {
  ok: boolean;
  mensaje: string;
}

interface Acciones {
  guardarRiesgo: (r: Riesgo) => void;
  borrarRiesgo: (id: string) => void;
  guardarFinca: (f: Finca) => void;
  borrarFinca: (id: string) => void;
  guardarDecision: (d: Decision) => void;
  borrarDecision: (id: string) => void;
  aprobar: (registro: RegistroBitacora) => void;
  guardarRegistro: (r: RegistroBitacora) => void;
  guardarAjustes: (a: Ajustes) => void;
  restablecer: () => void;
  sincronizar: () => Promise<ResultadoSync>;
}

interface Valor extends Datos, Acciones {
  sync: EstadoSync;
  sincronizando: boolean;
  enLinea: boolean;
}

const Contexto = createContext<Valor | null>(null);

export const ProveedorDatos = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [enLinea, setEnLinea] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const ref = useRef<Estado | null>(null);
  const enCurso = useRef(false);

  // Carga inicial
  useEffect(() => {
    leerGuardado().then(setEstado);
  }, []);

  // Guardar cada cambio
  useEffect(() => {
    ref.current = estado;
    if (estado) void escribir(estado);
  }, [estado]);

  // Estado de la conexión
  useEffect(() => {
    const on = () => setEnLinea(true);
    const off = () => setEnLinea(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  /** Aplica un cambio local a una colección y lo pone en la cola de pendientes. */
  const cambiar = useCallback(
    <T extends { id: string; actualizado?: string }>(coleccion: Coleccion, id: string, item: T | null) => {
      const marca = ahora();
      setEstado((prev) => {
        if (!prev) return prev;
        const lista = prev.datos[coleccion] as unknown as T[];
        const nueva = item === null ? lista.filter((x) => x.id !== id) : reemplazar(lista, { ...item, actualizado: marca });
        const cambio: Cambio = { coleccion, id, datos: item === null ? null : { ...item, actualizado: marca }, actualizado: marca };
        return {
          datos: { ...prev.datos, [coleccion]: nueva },
          sync: { ...prev.sync, pendientes: encolar(prev.sync.pendientes, cambio) },
        };
      });
    },
    [],
  );

  const sincronizar = useCallback(async (): Promise<ResultadoSync> => {
    const e = ref.current;
    if (!e) return { ok: false, mensaje: 'La app aún está cargando.' };
    const url = e.datos.ajustes.servidorUrl.trim();
    if (!url) return { ok: false, mensaje: 'Configura la dirección del servidor en Ajustes.' };
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      return { ok: false, mensaje: 'Sin conexión. Los cambios quedan guardados y se enviarán después.' };
    if (enCurso.current) return { ok: false, mensaje: 'Ya hay una sincronización en curso.' };

    enCurso.current = true;
    setSincronizando(true);
    const enviados = e.sync.pendientes;
    try {
      const r = await llamarServidor(url, enviados, e.sync.cursor);
      setEstado((prev) => {
        if (!prev) return prev;
        const { riesgos, fincas, decisiones, bitacora } = prev.datos;
        const nuevas = aplicarRemotos({ riesgos, fincas, decisiones, bitacora }, r.cambios, normalizarItem);
        return {
          datos: { ...prev.datos, ...(nuevas as unknown as Omit<Datos, 'ajustes'>) },
          sync: {
            pendientes: quitarEnviados(prev.sync.pendientes, enviados),
            cursor: r.cursor,
            ultimaSync: ahora(),
            ultimoError: null,
          },
        };
      });
      return { ok: true, mensaje: `Sincronizado: ${enviados.length} enviados, ${r.cambios.length} recibidos.` };
    } catch (err) {
      const mensaje =
        err instanceof Error && err.name === 'AbortError'
          ? 'El servidor no respondió a tiempo.'
          : `No se pudo conectar con el servidor (${err instanceof Error ? err.message : 'error'}).`;
      setEstado((prev) => (prev ? { ...prev, sync: { ...prev.sync, ultimoError: mensaje } } : prev));
      return { ok: false, mensaje };
    } finally {
      enCurso.current = false;
      setSincronizando(false);
    }
  }, []);

  // Sincronización automática: al volver la conexión, cada minuto y unos segundos después de cada cambio.
  const url = estado?.datos.ajustes.servidorUrl ?? '';
  const pendientes = estado?.sync.pendientes.length ?? 0;
  useEffect(() => {
    if (!url || !enLinea) return;
    void sincronizar();
    const intervalo = setInterval(() => void sincronizar(), 60_000);
    return () => clearInterval(intervalo);
  }, [url, enLinea, sincronizar]);
  useEffect(() => {
    if (!url || !enLinea || pendientes === 0) return;
    const t = setTimeout(() => void sincronizar(), 4_000);
    return () => clearTimeout(t);
  }, [url, enLinea, pendientes, sincronizar]);

  const valor = useMemo<Valor | null>(() => {
    if (!estado) return null;
    return {
      ...estado.datos,
      sync: estado.sync,
      sincronizando,
      enLinea,
      guardarRiesgo: (r) => cambiar('riesgos', r.id, r),
      borrarRiesgo: (id) => cambiar('riesgos', id, null),
      guardarFinca: (f) => cambiar('fincas', f.id, f),
      borrarFinca: (id) => cambiar('fincas', id, null),
      guardarDecision: (d) => cambiar('decisiones', d.id, d),
      borrarDecision: (id) => cambiar('decisiones', id, null),
      aprobar: (registro) => {
        cambiar('bitacora', registro.id, registro);
        const dec = estado.datos.decisiones.find((x) => x.id === registro.decisionId);
        if (dec) cambiar('decisiones', dec.id, { ...dec, estado: 'aprobada' as const });
      },
      guardarRegistro: (r) => cambiar('bitacora', r.id, r),
      guardarAjustes: (a) => setEstado((prev) => (prev ? { ...prev, datos: { ...prev.datos, ajustes: a } } : prev)),
      restablecer: () =>
        setEstado((prev) => ({
          datos: { ...datosIniciales(), ajustes: { ...AJUSTES_INICIALES, servidorUrl: prev?.datos.ajustes.servidorUrl ?? '' } },
          sync: syncInicial(),
        })),
      sincronizar,
    };
  }, [estado, sincronizando, enLinea, cambiar, sincronizar]);

  if (!valor) return null; // carga inicial (dura milisegundos)
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useDatos = () => {
  const c = useContext(Contexto);
  if (!c) throw new Error('useDatos debe usarse dentro de ProveedorDatos');
  return c;
};
