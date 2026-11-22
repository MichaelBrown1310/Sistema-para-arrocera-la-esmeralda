// Lógica de sincronización (funciones puras).
// Regla: "gana el cambio más reciente" (last-write-wins) según la marca `actualizado`.
// El servidor numera cada cambio que guarda (versión); el cliente recuerda la última
// versión recibida (cursor) y en cada sincronización pide solo lo nuevo.

import type { Cambio, Coleccion } from './tipos';

export const COLECCIONES: Coleccion[] = ['riesgos', 'fincas', 'decisiones', 'bitacora'];

type ConMarca = { id: string; actualizado?: string };

export type Colecciones = Record<Coleccion, ConMarca[]>;

const MARCA_INICIAL = '1970-01-01T00:00:00.000Z';

/** Agrega un cambio a la cola; si ya había uno del mismo registro, deja solo el más reciente. */
export const encolar = (pendientes: Cambio[], cambio: Cambio): Cambio[] => {
  const otros = pendientes.filter((c) => !(c.coleccion === cambio.coleccion && c.id === cambio.id));
  const previo = pendientes.find((c) => c.coleccion === cambio.coleccion && c.id === cambio.id);
  if (previo && previo.actualizado > cambio.actualizado) return pendientes;
  return [...otros, cambio];
};

/** Quita de la cola los cambios que el servidor ya recibió (si no se modificaron después). */
export const quitarEnviados = (pendientes: Cambio[], enviados: Cambio[]): Cambio[] =>
  pendientes.filter(
    (p) => !enviados.some((e) => e.coleccion === p.coleccion && e.id === p.id && e.actualizado === p.actualizado),
  );

/** Aplica cambios recibidos del servidor a las colecciones locales. */
export const aplicarRemotos = <T extends Colecciones>(
  datos: T,
  cambios: Cambio[],
  normalizar: (coleccion: Coleccion, item: ConMarca) => ConMarca = (_c, x) => x,
): T => {
  const resultado = { ...datos };
  for (const c of cambios) {
    const lista = resultado[c.coleccion] ?? [];
    const local = lista.find((x) => x.id === c.id);
    if (local && (local.actualizado ?? MARCA_INICIAL) >= c.actualizado) continue; // el local es igual o más nuevo
    const sinEste = lista.filter((x) => x.id !== c.id);
    resultado[c.coleccion] =
      c.datos === null
        ? sinEste
        : [...sinEste, normalizar(c.coleccion, { ...(c.datos as ConMarca), id: c.id, actualizado: c.actualizado })];
  }
  return resultado;
};

export interface RespuestaSync {
  cambios: Cambio[];
  cursor: number;
}

/** Llama al servidor: envía los pendientes y recibe lo nuevo desde `cursor`. */
export const llamarServidor = async (
  url: string,
  pendientes: Cambio[],
  cursor: number,
  fetchFn: typeof fetch = fetch,
): Promise<RespuestaSync> => {
  const base = url.trim().replace(/\/+$/, '');
  const control = new AbortController();
  const tiempo = setTimeout(() => control.abort(), 15_000);
  try {
    const r = await fetchFn(`${base}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cambios: pendientes, cursor }),
      signal: control.signal,
    });
    if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
    return (await r.json()) as RespuestaSync;
  } finally {
    clearTimeout(tiempo);
  }
};
