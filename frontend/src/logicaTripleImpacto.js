export function valorRiesgo(probabilidad, impacto) {
  return Number(probabilidad) * Number(impacto);
}

export function nivelRiesgo(valor) {
  if (valor <= 6) {
    return 'verde';
  }
  if (valor <= 12) {
    return 'amarillo';
  }
  return 'rojo';
}

export function conteoMatriz(riesgos, residual) {
  const matriz = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0]
  ];
  for (let k = 0; k < riesgos.length; k++) {
    const r = riesgos[k];
    const p = residual ? Number(r.probResidual) : Number(r.probabilidad);
    const i = residual ? Number(r.impactoResidual) : Number(r.impacto);
    if (p >= 1 && p <= 5 && i >= 1 && i <= 5) {
      matriz[p - 1][i - 1] += 1;
    }
  }
  return matriz;
}

export function sumaPesos(pesos) {
  return Number(pesos.E) + Number(pesos.S) + Number(pesos.A);
}

function limitar(x, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(x) || 0));
}

export function calcularPTI(E, S, A, pesos) {
  const total = sumaPesos(pesos) || 1;
  return Math.round(
    (Number(pesos.E) * limitar(E) + Number(pesos.S) * limitar(S) + Number(pesos.A) * limitar(A)) / total
  );
}

export const CANDADOS = {
  precioBajoMinimo: 'Paga por debajo del estandar de comercio justo o salario digno',
  insumoNoPermitido: 'Utiliza insumos o procesos restringidos en lineas certificadas',
  superaMetaAgua: 'Supera el limite maximo de consumo de agua o recurso ambiental'
};

export const CANDADOS_CUMPLIDOS = {
  precioBajoMinimo: 'Cumple pago justo a proveedores y condiciones laborales dignas',
  insumoNoPermitido: 'Libre de insumos restringidos en lineas certificadas',
  superaMetaAgua: 'Cumple la meta de consumo de agua y huella ambiental'
};

export function candadosRotos(opcion) {
  const claves = Object.keys(CANDADOS);
  const rotos = [];
  for (let i = 0; i < claves.length; i++) {
    const clave = claves[i];
    if (opcion.candados && opcion.candados[clave]) {
      rotos.push(CANDADOS[clave]);
    }
  }
  return rotos;
}

export const ESCENARIOS = [
  {
    id: 'nino',
    nombre: 'Crisis climatica o escasez de recursos',
    descripcion: 'Menor disponibilidad hidrica y energetica: sube el costo operativo.',
    pilares: ['E', 'A']
  },
  {
    id: 'paddy',
    nombre: 'Presion de precios y caida de margenes',
    descripcion: 'Los proveedores aliados pueden no cubrir sus costos y suspender contratos.',
    pilares: ['S']
  },
  {
    id: 'bloqueo',
    nombre: 'Bloqueo logistico en rutas de suministro',
    descripcion: 'Retrasos severos en recoleccion y despacho hacia centros de distribucion.',
    pilares: ['E', 'S']
  },
  {
    id: 'importaciones',
    nombre: 'Aumento de competencia internacional',
    descripcion: 'Presion competitiva por entrada de productos importados de bajo precio.',
    pilares: ['E']
  }
];

export const PENALIZACION = [0, 10, 20];
export const SENSIBILIDAD_TEXTO = ['Baja', 'Media', 'Alta'];

export function puntajesBajoEscenarios(opcion, activos) {
  const p = { E: Number(opcion.E), S: Number(opcion.S), A: Number(opcion.A) };
  for (let i = 0; i < ESCENARIOS.length; i++) {
    const esc = ESCENARIOS[i];
    if (!activos.includes(esc.id)) {
      continue;
    }
    const nivelSens = opcion.sensibilidad ? Number(opcion.sensibilidad[esc.id] || 0) : 0;
    const resta = PENALIZACION[nivelSens] || 0;
    for (let j = 0; j < esc.pilares.length; j++) {
      const pilar = esc.pilares[j];
      p[pilar] = limitar(p[pilar] - resta);
    }
  }
  return p;
}

const ORDEN_ESTADO = {
  recomendada: 0,
  viable: 1,
  mitigar: 2,
  descartada: 3
};

export function evaluarDecision(decision, ajustes, escenariosActivos = []) {
  const opciones = decision.opciones || [];
  const resultados = opciones.map(opcion => {
    const ptiBase = calcularPTI(opcion.E, opcion.S, opcion.A, ajustes.pesos);
    const sim = puntajesBajoEscenarios(opcion, escenariosActivos);
    const ptiEscenario = calcularPTI(sim.E, sim.S, sim.A, ajustes.pesos);
    const riesgo = valorRiesgo(opcion.probResidual, opcion.impactoResidual);
    const rotos = candadosRotos(opcion);

    let estado = 'viable';
    let razon = 'Cumple los candados y su riesgo esta dentro del apetito corporativo.';
    if (rotos.length > 0) {
      estado = 'descartada';
      razon = 'Candado roto: ' + rotos.join('; ') + '.';
    } else if (riesgo > ajustes.apetitoRiesgo) {
      estado = 'mitigar';
      razon = 'Riesgo residual ' + riesgo + ' supera el apetito (' + ajustes.apetitoRiesgo + '). Necesita plan de mitigacion.';
    }

    return {
      opcion,
      ptiBase,
      ptiEscenario,
      riesgo,
      nivel: nivelRiesgo(riesgo),
      candadosRotos: rotos,
      estado,
      razon,
      sim
    };
  });

  const candidatas = resultados.filter(r => r.estado === 'viable');
  if (candidatas.length > 0) {
    let mejor = candidatas[0];
    for (let i = 1; i < candidatas.length; i++) {
      const actual = candidatas[i];
      if (
        actual.ptiEscenario > mejor.ptiEscenario ||
        (actual.ptiEscenario === mejor.ptiEscenario && actual.riesgo < mejor.riesgo)
      ) {
        mejor = actual;
      }
    }
    mejor.estado = 'recomendada';
    mejor.razon =
      escenariosActivos.length > 0
        ? 'Mayor puntaje bajo los escenarios elegidos, sin candados rotos y con riesgo aceptable.'
        : 'Mayor puntaje triple impacto, sin candados rotos y con riesgo aceptable.';
  }

  return resultados.sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || b.ptiEscenario - a.ptiEscenario
  );
}

export function alertasFinca(f, metaAgua) {
  return {
    abandono: f.intencionSiembra !== 'si',
    agua: Number(f.aguaM3Ha) > Number(metaAgua),
    organico: Boolean(f.loteOrganico && f.insumoNoPermitido),
    riego: Boolean(f.problemasRiego)
  };
}

export function tieneAlerta(f, metaAgua) {
  const a = alertasFinca(f, metaAgua);
  return a.abandono || a.agua || a.organico || a.riego;
}

export function colorFinca(f, metaAgua) {
  const a = alertasFinca(f, metaAgua);
  if (a.organico || f.intencionSiembra === 'no') {
    return 'rojo';
  }
  if (a.abandono || a.agua || a.riego) {
    return 'amarillo';
  }
  return 'verde';
}

export function resumenFincas(fincas, metaAgua) {
  const areaHa = fincas.reduce((s, f) => s + Number(f.areaHa || 0), 0);
  const aguaTotal = fincas.reduce((s, f) => s + Number(f.aguaM3Ha || 0) * Number(f.areaHa || 0), 0);
  return {
    total: fincas.length,
    areaHa: Math.round(areaHa * 10) / 10,
    aguaPromedio: areaHa > 0 ? Math.round(aguaTotal / areaHa) : 0,
    enAlerta: fincas.filter(f => tieneAlerta(f, metaAgua)).length,
    riesgoAbandono: fincas.filter(f => f.intencionSiembra !== 'si').length,
    produccionEsperadaT: Math.round(fincas.reduce((s, f) => s + Number(f.produccionEsperadaT || 0), 0)),
    controlBiologicoPct:
      areaHa > 0
        ? Math.round(fincas.reduce((s, f) => s + Number(f.controlBiologicoPct || 0) * Number(f.areaHa || 0), 0) / areaHa)
        : 0,
    avesTotal: fincas.reduce((s, f) => s + Number(f.avesObservadas || 0), 0),
    conLaser: fincas.filter(f => f.nivelacionLaser).length,
    conOrganico: fincas.filter(f => f.loteOrganico).length,
    incumplenOrganico: fincas.filter(f => f.loteOrganico && f.insumoNoPermitido).length,
    conProblemasRiego: fincas.filter(f => f.problemasRiego).length
  };
}

function diasEntre(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function generarAlertas(datos, hoy) {
  const alertas = [];
  const meta = datos.ajustes.metaAguaM3Ha;

  for (let i = 0; i < datos.riesgos.length; i++) {
    const r = datos.riesgos[i];
    const residual = valorRiesgo(r.probResidual, r.impactoResidual);
    const inherente = valorRiesgo(r.probabilidad, r.impacto);
    if (residual > datos.ajustes.apetitoRiesgo) {
      alertas.push({
        id: 'riesgo-apetito-' + r.id,
        gravedad: 'alta',
        titulo: 'Riesgo sobre el apetito: ' + r.nombre,
        detalle: 'Con controles queda en ' + residual + '; el maximo aceptado es ' + datos.ajustes.apetitoRiesgo + '. Necesita plan de mitigacion.',
        modulo: 'riesgos'
      });
    } else if (nivelRiesgo(inherente) === 'rojo' && (!r.controles || !r.controles.trim())) {
      alertas.push({
        id: 'riesgo-sin-controles-' + r.id,
        gravedad: 'alta',
        titulo: 'Riesgo en rojo sin controles: ' + r.nombre,
        detalle: 'Valor ' + inherente + '. Registra que controles lo reducen.',
        modulo: 'riesgos'
      });
    }
  }

  for (let i = 0; i < datos.fincas.length; i++) {
    const f = datos.fincas[i];
    if (f.intencionSiembra === 'no') {
      alertas.push({
        id: 'finca-no-siembra-' + f.id,
        gravedad: 'alta',
        titulo: f.nombre + ': riesgo de suspension operativa',
        detalle: 'El proveedor o unidad ' + f.codigoAgricultor + ' reporto que no continuara el proximo periodo.',
        modulo: 'fincas'
      });
    } else if (f.intencionSiembra === 'duda') {
      alertas.push({
        id: 'finca-duda-siembra-' + f.id,
        gravedad: 'media',
        titulo: f.nombre + ': incertidumbre de continuidad',
        detalle: 'Conviene contactar al responsable ' + f.codigoAgricultor + ' para revisar condiciones.',
        modulo: 'fincas'
      });
    }
    if (f.loteOrganico && f.insumoNoPermitido) {
      alertas.push({
        id: 'finca-organico-' + f.id,
        gravedad: 'alta',
        titulo: f.nombre + ': incumplimiento de sello sostenible',
        detalle: 'Se detecto un insumo restringido en una unidad con certificacion sostenible.',
        modulo: 'fincas'
      });
    }
    if (Number(f.aguaM3Ha) > Number(meta)) {
      alertas.push({
        id: 'finca-agua-' + f.id,
        gravedad: 'media',
        titulo: f.nombre + ': consumo de recurso sobre la meta',
        detalle: f.aguaM3Ha + ' m3 (meta maxima ' + meta + ').',
        modulo: 'fincas'
      });
    }
    if (f.problemasRiego) {
      alertas.push({
        id: 'finca-riego-' + f.id,
        gravedad: 'media',
        titulo: f.nombre + ': falla tecnica u operativa',
        detalle: f.detalleRiego || 'Se reporto una falla tecnica en el suministro o recirculacion.',
        modulo: 'fincas'
      });
    }
    if (f.fechaCosechaEsperada) {
      const dias = diasEntre(hoy, f.fechaCosechaEsperada);
      if (dias >= 0 && dias <= 15) {
        alertas.push({
          id: 'finca-cosecha-' + f.id,
          gravedad: 'info',
          titulo: f.nombre + ': entrega de lote en ' + dias + ' dias',
          detalle: 'Se esperan unas ' + f.produccionEsperadaT + ' t/unidades. Programe la logistica.',
          modulo: 'fincas'
        });
      }
    }
    if (f.ultimaVisita && diasEntre(f.ultimaVisita, hoy) > 60) {
      alertas.push({
        id: 'finca-sin-visita-' + f.id,
        gravedad: 'info',
        titulo: f.nombre + ': sin auditoria reciente',
        detalle: 'La ultima inspeccion fue hace ' + diasEntre(f.ultimaVisita, hoy) + ' dias.',
        modulo: 'fincas'
      });
    }
  }

  for (let i = 0; i < datos.bitacora.length; i++) {
    const b = datos.bitacora[i];
    if (b.estadoRevision !== 'pendiente' || !b.fechaRevision) {
      continue;
    }
    const dias = diasEntre(hoy, b.fechaRevision);
    if (dias < 0) {
      alertas.push({
        id: 'bitacora-vencida-' + b.id,
        gravedad: 'alta',
        titulo: 'Revision vencida: ' + b.tituloDecision,
        detalle: 'Debia revisarse el ' + b.fechaRevision + '. Registre el resultado real.',
        modulo: 'bitacora'
      });
    } else if (dias <= 7) {
      alertas.push({
        id: 'bitacora-proxima-' + b.id,
        gravedad: 'media',
        titulo: 'Revision en ' + dias + ' dias: ' + b.tituloDecision,
        detalle: 'Fecha de revision programada: ' + b.fechaRevision + '.',
        modulo: 'bitacora'
      });
    }
  }

  for (let i = 0; i < datos.decisiones.length; i++) {
    const dec = datos.decisiones[i];
    if (dec.estado !== 'abierta' || !dec.opciones || dec.opciones.length === 0) {
      continue;
    }
    const r = evaluarDecision(dec, datos.ajustes);
    if (!r.some(x => x.estado === 'recomendada')) {
      alertas.push({
        id: 'decision-sin-opcion-' + dec.id,
        gravedad: 'media',
        titulo: 'Sin opcion recomendable: ' + dec.titulo,
        detalle: 'Todas las opciones rompen un candado o superan el apetito de riesgo.',
        modulo: 'decisiones'
      });
    }
  }

  const orden = { alta: 0, media: 1, info: 2 };
  return alertas.sort((a, b) => orden[a.gravedad] - orden[b.gravedad]);
}
