// Lógica de negocio de la Brújula Triple Impacto.
// Funciones puras: no dependen de la interfaz, por eso se pueden probar
// y, más adelante, mover tal cual a un backend.

import type {
  Ajustes,
  CandadoId,
  Decision,
  EscenarioId,
  EstadoOpcion,
  Finca,
  NivelRiesgo,
  Opcion,
  Pesos,
  Pilar,
  ResultadoOpcion,
  Riesgo,
} from './tipos';

/* ---------- 1. Matriz de riesgo (probabilidad × impacto) ---------- */

/** Riesgo = Probabilidad × Impacto, de 1 a 25. */
export const valorRiesgo = (probabilidad: number, impacto: number): number =>
  probabilidad * impacto;

/** Verde de 1 a 6, amarillo de 8 a 12, rojo de 15 a 25. */
export const nivelRiesgo = (valor: number): NivelRiesgo =>
  valor <= 6 ? 'verde' : valor <= 12 ? 'amarillo' : 'rojo';

export const ordenarRiesgos = (riesgos: Riesgo[]): Riesgo[] =>
  [...riesgos].sort(
    (a, b) => valorRiesgo(b.probabilidad, b.impacto) - valorRiesgo(a.probabilidad, a.impacto),
  );

/** Cuenta cuántos riesgos caen en cada celda de la matriz 5×5. matriz[p-1][i-1]. */
export const conteoMatriz = (riesgos: Riesgo[], residual = false): number[][] => {
  const matriz = Array.from({ length: 5 }, () => Array<number>(5).fill(0));
  for (const r of riesgos) {
    const p = residual ? r.probResidual : r.probabilidad;
    const i = residual ? r.impactoResidual : r.impacto;
    matriz[p - 1][i - 1] += 1;
  }
  return matriz;
};

/* ---------- 2. Puntaje Triple Impacto (PTI) ---------- */

export const sumaPesos = (p: Pesos): number => p.E + p.S + p.A;
export const pesosValidos = (p: Pesos): boolean => sumaPesos(p) === 100;

const limitar = (x: number, min = 0, max = 100) => Math.min(max, Math.max(min, x));

/** PTI = pE·E + pS·S + pA·A, con pesos en porcentaje. Resultado de 0 a 100. */
export const calcularPTI = (E: number, S: number, A: number, pesos: Pesos): number => {
  const total = sumaPesos(pesos) || 1;
  return Math.round(
    (pesos.E * limitar(E) + pesos.S * limitar(S) + pesos.A * limitar(A)) / total,
  );
};

/* ---------- 3. Candados ---------- */

export const CANDADOS: Record<CandadoId, string> = {
  precioBajoMinimo: 'Paga por debajo del mínimo de comercio justo',
  insumoNoPermitido: 'Usa un insumo no permitido en lotes orgánicos',
  superaMetaAgua: 'Supera la meta de agua por hectárea',
};

/** Cómo se lee cada candado cuando se cumple (para la bitácora y el reporte). */
export const CANDADOS_CUMPLIDOS: Record<CandadoId, string> = {
  precioBajoMinimo: 'Paga al menos el mínimo de comercio justo',
  insumoNoPermitido: 'No usa insumos prohibidos en lotes orgánicos',
  superaMetaAgua: 'No supera la meta de agua por hectárea',
};

export const candadosRotos = (opcion: Opcion): string[] =>
  (Object.keys(CANDADOS) as CandadoId[])
    .filter((id) => opcion.candados[id])
    .map((id) => CANDADOS[id]);

/* ---------- 4. Simulador "¿qué pasa si?" ---------- */

export interface Escenario {
  id: EscenarioId;
  nombre: string;
  descripcion: string;
  pilares: Pilar[];
}

export const ESCENARIOS: Escenario[] = [
  {
    id: 'nino',
    nombre: 'El Niño fuerte',
    descripcion: 'Menos lluvia: baja la cosecha y sube el uso de agua.',
    pilares: ['E', 'A'],
  },
  {
    id: 'paddy',
    nombre: 'Sigue cayendo el precio del paddy',
    descripcion: 'El agricultor puede no cubrir costos y dejar de sembrar.',
    pilares: ['S'],
  },
  {
    id: 'bloqueo',
    nombre: 'Bloqueo de vías en Jamundí',
    descripcion: 'No se puede recoger el arroz de algunas zonas.',
    pilares: ['E', 'S'],
  },
  {
    id: 'importaciones',
    nombre: 'Más arroz importado',
    descripcion: 'Baja el precio de venta frente al arroz de EE. UU.',
    pilares: ['E'],
  },
];

/** Puntos que se restan a cada pilar afectado según la sensibilidad (baja, media, alta). */
export const PENALIZACION = [0, 10, 20] as const;

export const SENSIBILIDAD_TEXTO = ['Baja', 'Media', 'Alta'] as const;

/** Aplica los escenarios activos a los puntajes de una opción. */
export const puntajesBajoEscenarios = (
  opcion: Opcion,
  activos: EscenarioId[],
): Record<Pilar, number> => {
  const p = { E: opcion.E, S: opcion.S, A: opcion.A };
  for (const esc of ESCENARIOS) {
    if (!activos.includes(esc.id)) continue;
    const resta = PENALIZACION[opcion.sensibilidad[esc.id]];
    for (const pilar of esc.pilares) p[pilar] = limitar(p[pilar] - resta);
  }
  return p;
};

/* ---------- 5. Evaluación completa de una decisión ---------- */

const ORDEN_ESTADO: Record<EstadoOpcion, number> = {
  recomendada: 0,
  viable: 1,
  mitigar: 2,
  descartada: 3,
};

/**
 * Evalúa todas las opciones de una decisión:
 * 1. Si rompe un candado -> descartada (el puntaje no la salva).
 * 2. Si su riesgo residual supera el apetito -> requiere plan de mitigación.
 * 3. Entre las demás, la de mayor PTI (bajo los escenarios activos) es la recomendada.
 */
export const evaluarDecision = (
  decision: Decision,
  ajustes: Ajustes,
  escenariosActivos: EscenarioId[] = [],
): ResultadoOpcion[] => {
  const resultados: ResultadoOpcion[] = decision.opciones.map((opcion) => {
    const ptiBase = calcularPTI(opcion.E, opcion.S, opcion.A, ajustes.pesos);
    const sim = puntajesBajoEscenarios(opcion, escenariosActivos);
    const ptiEscenario = calcularPTI(sim.E, sim.S, sim.A, ajustes.pesos);
    const riesgo = valorRiesgo(opcion.probResidual, opcion.impactoResidual);
    const rotos = candadosRotos(opcion);

    let estado: EstadoOpcion = 'viable';
    let razon = 'Cumple los candados y su riesgo está dentro del apetito.';
    if (rotos.length > 0) {
      estado = 'descartada';
      razon = `Candado roto: ${rotos.join('; ')}.`;
    } else if (riesgo > ajustes.apetitoRiesgo) {
      estado = 'mitigar';
      razon = `Riesgo residual ${riesgo} supera el apetito (${ajustes.apetitoRiesgo}). Necesita plan de mitigación.`;
    }
    return { opcion, ptiBase, ptiEscenario, riesgo, nivel: nivelRiesgo(riesgo), candadosRotos: rotos, estado, razon };
  });

  const candidatas = resultados.filter((r) => r.estado === 'viable');
  if (candidatas.length > 0) {
    const mejor = candidatas.reduce((a, b) =>
      b.ptiEscenario > a.ptiEscenario || (b.ptiEscenario === a.ptiEscenario && b.riesgo < a.riesgo) ? b : a,
    );
    mejor.estado = 'recomendada';
    mejor.razon =
      escenariosActivos.length > 0
        ? 'Mayor puntaje bajo los escenarios elegidos, sin candados rotos y con riesgo aceptable.'
        : 'Mayor puntaje triple impacto, sin candados rotos y con riesgo aceptable.';
  }

  return resultados.sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.ptiEscenario - a.ptiEscenario,
  );
};

/* ---------- 6. Indicadores de finca (formulario del agrónomo) ---------- */

export interface AlertasFinca {
  abandono: boolean;
  agua: boolean;
  organico: boolean;
  riego: boolean;
}

export const alertasFinca = (f: Finca, metaAgua: number): AlertasFinca => ({
  abandono: f.intencionSiembra !== 'si',
  agua: f.aguaM3Ha > metaAgua,
  organico: f.loteOrganico && f.insumoNoPermitido,
  riego: f.problemasRiego,
});

export const tieneAlerta = (f: Finca, metaAgua: number): boolean => {
  const a = alertasFinca(f, metaAgua);
  return a.abandono || a.agua || a.organico || a.riego;
};

/** Color del marcador o etiqueta de una finca: rojo (grave), amarillo (atención), verde. */
export const colorFinca = (f: Finca, metaAgua: number): 'rojo' | 'amarillo' | 'verde' => {
  const a = alertasFinca(f, metaAgua);
  if (a.organico || f.intencionSiembra === 'no') return 'rojo';
  if (a.abandono || a.agua || a.riego) return 'amarillo';
  return 'verde';
};

export interface ResumenFincas {
  total: number;
  areaHa: number;
  aguaPromedio: number; // ponderado por área
  enAlerta: number;
  riesgoAbandono: number;
  produccionEsperadaT: number;
  controlBiologicoPct: number; // promedio ponderado por área
  avesTotal: number;
  conLaser: number;
  conOrganico: number;
  incumplenOrganico: number;
  conProblemasRiego: number;
}

export const resumenFincas = (fincas: Finca[], metaAgua: number): ResumenFincas => {
  const areaHa = fincas.reduce((s, f) => s + f.areaHa, 0);
  const aguaTotal = fincas.reduce((s, f) => s + f.aguaM3Ha * f.areaHa, 0);
  return {
    total: fincas.length,
    areaHa: Math.round(areaHa * 10) / 10,
    aguaPromedio: areaHa > 0 ? Math.round(aguaTotal / areaHa) : 0,
    enAlerta: fincas.filter((f) => tieneAlerta(f, metaAgua)).length,
    riesgoAbandono: fincas.filter((f) => f.intencionSiembra !== 'si').length,
    produccionEsperadaT: Math.round(fincas.reduce((s, f) => s + f.produccionEsperadaT, 0)),
    controlBiologicoPct:
      areaHa > 0 ? Math.round(fincas.reduce((s, f) => s + f.controlBiologicoPct * f.areaHa, 0) / areaHa) : 0,
    avesTotal: fincas.reduce((s, f) => s + f.avesObservadas, 0),
    conLaser: fincas.filter((f) => f.nivelacionLaser).length,
    conOrganico: fincas.filter((f) => f.loteOrganico).length,
    incumplenOrganico: fincas.filter((f) => f.loteOrganico && f.insumoNoPermitido).length,
    conProblemasRiego: fincas.filter((f) => f.problemasRiego).length,
  };
};
