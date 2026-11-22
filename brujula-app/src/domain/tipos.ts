// Modelo de datos de la Brújula Triple Impacto.
// Todo lo que la app guarda o calcula se describe aquí.

/** Pilares del triple impacto: Económico, Social, Ambiental. */
export type Pilar = 'E' | 'S' | 'A';

/** Escala de 1 a 5 usada en la matriz de riesgo. */
export type Escala = 1 | 2 | 3 | 4 | 5;

export type CategoriaRiesgo =
  | 'Clima'
  | 'Mercado'
  | 'Comercio'
  | 'Regulatorio'
  | 'Orden público'
  | 'Otro';

/** Fecha y hora ISO de la última modificación. Se usa para sincronizar (gana el cambio más reciente). */
export type Marca = string;

export interface Riesgo {
  id: string;
  actualizado?: Marca;
  nombre: string;
  categoria: CategoriaRiesgo;
  descripcion: string;
  probabilidad: Escala;
  impacto: Escala;
  pilares: Pilar[];
  controles: string;
  probResidual: Escala;
  impactoResidual: Escala;
}

export type Zona = 'Valle' | 'Cauca' | 'Casanare';
export type IntencionSiembra = 'si' | 'duda' | 'no';

/** Datos que registra el agrónomo en cada visita de finca. */
export interface Finca {
  id: string;
  actualizado?: Marca;
  nombre: string;
  codigoAgricultor: string;
  zona: Zona;
  municipio: string;
  areaHa: number;
  fechaSiembra: string; // AAAA-MM-DD, vacío si no se sabe
  fechaCosechaEsperada: string; // AAAA-MM-DD, vacío si no se sabe
  produccionEsperadaT: number; // toneladas de paddy esperadas
  aguaM3Ha: number;
  problemasRiego: boolean;
  detalleRiego: string;
  controlBiologicoPct: number;
  nivelacionLaser: boolean;
  loteOrganico: boolean;
  insumoNoPermitido: boolean;
  avesObservadas: number;
  intencionSiembra: IntencionSiembra;
  ultimaVisita: string; // AAAA-MM-DD
  notas: string;
  latitud: number | null;
  longitud: number | null;
}

/** Reglas que bloquean una opción aunque tenga buen puntaje. */
export type CandadoId = 'precioBajoMinimo' | 'insumoNoPermitido' | 'superaMetaAgua';

/** Escenarios del simulador "¿qué pasa si?". */
export type EscenarioId = 'nino' | 'paddy' | 'bloqueo' | 'importaciones';

/** 0 = baja, 1 = media, 2 = alta. */
export type Sensibilidad = 0 | 1 | 2;

export interface Opcion {
  id: string;
  nombre: string;
  descripcion: string;
  E: number; // 0 a 100
  S: number; // 0 a 100
  A: number; // 0 a 100
  probResidual: Escala;
  impactoResidual: Escala;
  candados: Record<CandadoId, boolean>;
  sensibilidad: Record<EscenarioId, Sensibilidad>;
}

export type EstadoDecision = 'abierta' | 'aprobada';

export interface Decision {
  id: string;
  actualizado?: Marca;
  titulo: string;
  pregunta: string;
  responsable: string;
  fechaCreacion: string;
  opciones: Opcion[];
  estado: EstadoDecision;
}

export interface RegistroBitacora {
  id: string;
  actualizado?: Marca;
  decisionId: string;
  tituloDecision: string;
  opcionElegida: string;
  pti: number;
  riesgoResidual: number;
  candadosVerificados: string[]; // candados revisados al aprobar (todos cumplidos)
  escenariosSimulados: string[];
  supuestos: string;
  aprobadoPor: string;
  fechaAprobacion: string;
  fechaRevision: string;
  resultadoReal: string;
  estadoRevision: 'pendiente' | 'revisada';
}

export interface Pesos {
  E: number;
  S: number;
  A: number;
}

export interface Ajustes {
  pesos: Pesos; // deben sumar 100
  apetitoRiesgo: number; // máximo riesgo residual aceptado sin plan (1 a 25)
  metaAguaM3Ha: number;
  servidorUrl: string; // vacío = sin sincronización
  notificaciones: boolean;
}

/* ---------- Sincronización ---------- */

export type Coleccion = 'riesgos' | 'fincas' | 'decisiones' | 'bitacora';

/** Un cambio pendiente de enviar (o recibido del servidor). datos = null significa borrado. */
export interface Cambio {
  coleccion: Coleccion;
  id: string;
  datos: unknown | null;
  actualizado: Marca;
}

export interface EstadoSync {
  pendientes: Cambio[];
  cursor: number; // último número de versión del servidor que ya tenemos
  ultimaSync: Marca | null;
  ultimoError: string | null;
}

/* ---------- Alertas ---------- */

export type Gravedad = 'alta' | 'media' | 'info';

export interface Alerta {
  id: string; // estable: sirve para no notificar dos veces lo mismo
  gravedad: Gravedad;
  titulo: string;
  detalle: string;
  enlace: string; // ruta de la app donde se atiende
}

export type NivelRiesgo = 'verde' | 'amarillo' | 'rojo';

export type EstadoOpcion = 'recomendada' | 'viable' | 'mitigar' | 'descartada';

export interface ResultadoOpcion {
  opcion: Opcion;
  ptiBase: number;
  ptiEscenario: number;
  riesgo: number;
  nivel: NivelRiesgo;
  candadosRotos: string[];
  estado: EstadoOpcion;
  razon: string;
}
