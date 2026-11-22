// DATOS DE EJEMPLO. Son ilustrativos: sirven para mostrar cómo funciona la app.
// No son datos reales de Arrocera La Esmeralda.

import type { Ajustes, Decision, Finca, Opcion, RegistroBitacora, Riesgo } from './tipos';

export const AJUSTES_INICIALES: Ajustes = {
  pesos: { E: 35, S: 35, A: 30 },
  apetitoRiesgo: 12,
  metaAguaM3Ha: 7000,
  servidorUrl: '',
  notificaciones: false,
};

export const RIESGOS_EJEMPLO: Riesgo[] = [
  {
    id: 'r-nino',
    nombre: 'El Niño 2026-2027',
    categoria: 'Clima',
    descripcion: 'Déficit de lluvias en el segundo semestre de 2026 y comienzos de 2027.',
    probabilidad: 5,
    impacto: 4,
    pilares: ['E', 'S', 'A'],
    controles: 'Siembra escalonada según pronóstico del IDEAM; prima por ahorro de agua.',
    probResidual: 4,
    impactoResidual: 3,
  },
  {
    id: 'r-paddy',
    nombre: 'Caída del precio del paddy',
    categoria: 'Mercado',
    descripcion: 'El precio al agricultor viene bajando mientras los costos siguen altos.',
    probabilidad: 4,
    impacto: 4,
    pilares: ['S', 'E'],
    controles: 'Precio piso en los contratos con agricultores.',
    probResidual: 3,
    impactoResidual: 3,
  },
  {
    id: 'r-tlc',
    nombre: 'Desgravación del TLC con EE. UU. (2030)',
    categoria: 'Comercio',
    descripcion: 'Desde 2030 el arroz de EE. UU. entra sin cupo ni arancel.',
    probabilidad: 3,
    impacto: 4,
    pilares: ['E'],
    controles: 'Diferenciación por calidad y sellos; productividad con el CIAT.',
    probResidual: 3,
    impactoResidual: 3,
  },
  {
    id: 'r-regulado',
    nombre: 'Libertad regulada del paddy',
    categoria: 'Regulatorio',
    descripcion: 'Precios mínimos fijados por el Gobierno para el paddy verde.',
    probabilidad: 3,
    impacto: 3,
    pilares: ['E', 'S'],
    controles: 'Seguimiento de resoluciones y ajuste de contratos.',
    probResidual: 3,
    impactoResidual: 2,
  },
  {
    id: 'r-orden',
    nombre: 'Orden público en zona rural de Jamundí',
    categoria: 'Orden público',
    descripcion: 'Bloqueos de vías, ataques y ocupación de predios en 2026.',
    probabilidad: 4,
    impacto: 5,
    pilares: ['S', 'E'],
    controles: 'Rutas alternas y horarios de recolección; protocolo de seguridad.',
    probResidual: 3,
    impactoResidual: 4,
  },
];

export const FINCAS_EJEMPLO: Finca[] = [
  {
    id: 'f-01', fechaSiembra: '2026-08-10', fechaCosechaEsperada: '2026-12-12', produccionEsperadaT: 84, problemasRiego: false, detalleRiego: '', latitud: 3.245, longitud: -76.56,
    nombre: 'Finca El Guayabo', codigoAgricultor: 'AG-014', zona: 'Valle', municipio: 'Jamundí',
    areaHa: 12, aguaM3Ha: 6800, controlBiologicoPct: 80, nivelacionLaser: true, loteOrganico: true,
    insumoNoPermitido: false, avesObservadas: 23, intencionSiembra: 'si', ultimaVisita: '2026-10-20', notas: '',
  },
  {
    id: 'f-02', fechaSiembra: '2026-08-20', fechaCosechaEsperada: '2026-12-22', produccionEsperadaT: 50, problemasRiego: true, detalleRiego: 'La bomba de riego falla; se riega por inundación más tiempo.', latitud: 3.23, longitud: -76.52,
    nombre: 'Finca La Ceiba', codigoAgricultor: 'AG-031', zona: 'Valle', municipio: 'Jamundí',
    areaHa: 8, aguaM3Ha: 7900, controlBiologicoPct: 40, nivelacionLaser: false, loteOrganico: false,
    insumoNoPermitido: false, avesObservadas: 9, intencionSiembra: 'duda', ultimaVisita: '2026-10-18',
    notas: 'Dice que con el precio actual no le alcanza para la próxima siembra.',
  },
  {
    id: 'f-03', fechaSiembra: '2026-07-20', fechaCosechaEsperada: '2026-11-20', produccionEsperadaT: 102, problemasRiego: false, detalleRiego: '', latitud: 3.02, longitud: -76.47,
    nombre: 'Finca San José', codigoAgricultor: 'AG-047', zona: 'Cauca', municipio: 'Santander de Quilichao',
    areaHa: 15, aguaM3Ha: 6500, controlBiologicoPct: 90, nivelacionLaser: true, loteOrganico: true,
    insumoNoPermitido: false, avesObservadas: 31, intencionSiembra: 'si', ultimaVisita: '2026-10-22', notas: '',
  },
  {
    id: 'f-04', fechaSiembra: '2026-08-05', fechaCosechaEsperada: '2026-12-05', produccionEsperadaT: 38, problemasRiego: false, detalleRiego: '', latitud: 3.235, longitud: -76.41,
    nombre: 'Finca Los Samanes', codigoAgricultor: 'AG-052', zona: 'Cauca', municipio: 'Puerto Tejada',
    areaHa: 6, aguaM3Ha: 7100, controlBiologicoPct: 60, nivelacionLaser: true, loteOrganico: true,
    insumoNoPermitido: true, avesObservadas: 12, intencionSiembra: 'si', ultimaVisita: '2026-10-15',
    notas: 'Se aplicó un insecticida no permitido en el lote orgánico.',
  },
  {
    id: 'f-05', fechaSiembra: '2026-08-25', fechaCosechaEsperada: '2026-12-28', produccionEsperadaT: 65, problemasRiego: false, detalleRiego: '', latitud: 3.205, longitud: -76.585,
    nombre: 'Finca El Porvenir', codigoAgricultor: 'AG-066', zona: 'Valle', municipio: 'Jamundí',
    areaHa: 10, aguaM3Ha: 6900, controlBiologicoPct: 70, nivelacionLaser: true, loteOrganico: false,
    insumoNoPermitido: false, avesObservadas: 17, intencionSiembra: 'no', ultimaVisita: '2026-10-10',
    notas: 'Vía de acceso bloqueada dos veces este mes.',
  },
  {
    id: 'f-06', fechaSiembra: '2026-09-01', fechaCosechaEsperada: '2027-01-05', produccionEsperadaT: 280, problemasRiego: false, detalleRiego: '', latitud: 5.15, longitud: -72.56,
    nombre: 'Finca Altamira', codigoAgricultor: 'AG-108', zona: 'Casanare', municipio: 'Aguazul',
    areaHa: 40, aguaM3Ha: 6200, controlBiologicoPct: 30, nivelacionLaser: true, loteOrganico: false,
    insumoNoPermitido: false, avesObservadas: 14, intencionSiembra: 'si', ultimaVisita: '2026-10-05', notas: '',
  },
];

const sinCandados = { precioBajoMinimo: false, insumoNoPermitido: false, superaMetaAgua: false };

export const opcionVacia = (id: string, nombre: string): Opcion => ({
  id,
  nombre,
  descripcion: '',
  E: 50,
  S: 50,
  A: 50,
  probResidual: 3,
  impactoResidual: 3,
  candados: { ...sinCandados },
  sensibilidad: { nino: 1, paddy: 1, bloqueo: 1, importaciones: 1 },
});

export const DECISIONES_EJEMPLO: Decision[] = [
  {
    id: 'd-2027a',
    titulo: 'Compra de paddy, cosecha 2027-A',
    pregunta: '¿De dónde y a qué precio compramos el arroz del primer semestre de 2027?',
    responsable: 'Jefe de abastecimiento',
    fechaCreacion: '2026-11-07',
    estado: 'abierta',
    opciones: [
      {
        id: 'o-a',
        nombre: 'A. Más compra en Casanare',
        descripcion: 'Comprar más en Aguazul y reducir compras en Valle y Cauca.',
        E: 82, S: 45, A: 55,
        probResidual: 4, impactoResidual: 4,
        candados: { ...sinCandados, precioBajoMinimo: true },
        sensibilidad: { nino: 2, paddy: 2, bloqueo: 0, importaciones: 1 },
      },
      {
        id: 'o-b',
        nombre: 'B. Todo en Valle y Cauca',
        descripcion: 'Mantener todas las compras en Valle y Cauca con precio garantizado.',
        E: 50, S: 85, A: 75,
        probResidual: 3, impactoResidual: 4,
        candados: { ...sinCandados },
        sensibilidad: { nino: 2, paddy: 1, bloqueo: 2, importaciones: 2 },
      },
      {
        id: 'o-c',
        nombre: 'C. Mixta',
        descripcion:
          'Precio piso en Valle y Cauca con prima por ahorro de agua, siembra escalonada según IDEAM, déficit desde Aguazul y rutas alternas.',
        E: 70, S: 78, A: 72,
        probResidual: 2, impactoResidual: 4,
        candados: { ...sinCandados },
        sensibilidad: { nino: 1, paddy: 1, bloqueo: 1, importaciones: 1 },
      },
    ],
  },
];

/** Finca en blanco para una visita nueva. */
export const fincaVacia = (id: string, hoy: string): Finca => ({
  id,
  nombre: '',
  codigoAgricultor: '',
  zona: 'Valle',
  municipio: '',
  areaHa: 0,
  fechaSiembra: '',
  fechaCosechaEsperada: '',
  produccionEsperadaT: 0,
  aguaM3Ha: 0,
  problemasRiego: false,
  detalleRiego: '',
  controlBiologicoPct: 0,
  nivelacionLaser: false,
  loteOrganico: false,
  insumoNoPermitido: false,
  avesObservadas: 0,
  intencionSiembra: 'si',
  ultimaVisita: hoy,
  notas: '',
  latitud: null,
  longitud: null,
});

/* Normalizadores: completan con valores por defecto los datos guardados por versiones
   anteriores de la app o recibidos del servidor, para que nunca falte un campo. */

export const normalizarFinca = (f: Partial<Finca> & { id: string }): Finca => ({
  ...fincaVacia(f.id, f.ultimaVisita ?? ''),
  ...f,
});

export const normalizarRegistro = (r: Partial<RegistroBitacora> & { id: string }): RegistroBitacora => ({
  decisionId: '',
  tituloDecision: '',
  opcionElegida: '',
  pti: 0,
  riesgoResidual: 0,
  candadosVerificados: [],
  escenariosSimulados: [],
  supuestos: '',
  aprobadoPor: '',
  fechaAprobacion: '',
  fechaRevision: '',
  resultadoReal: '',
  estadoRevision: 'pendiente',
  ...r,
});

export const normalizarAjustes = (a: Partial<Ajustes> | undefined): Ajustes => ({
  ...AJUSTES_INICIALES,
  ...(a ?? {}),
  pesos: { ...AJUSTES_INICIALES.pesos, ...(a?.pesos ?? {}) },
});
