<template>
  <div class="animar-entrada">
    <div class="panel">
      <div class="cabecera-seccion">
        <h2>Bitacora de Decisiones y Evidencia para Auditorias</h2>
        <div class="grupo-botones no-imprimir">
          <button @click="descargarAuditoriaCSV">Descargar Reporte Auditoria CSV (Excel)</button>
          <button @click="imprimirAuditoria">Imprimir Reporte Auditoria (PDF)</button>
        </div>
      </div>
      <p class="texto-secundario">
        Evidencia trazable para certificaciones de Empresa B, Comercio Justo, ISO 14001 y Sostenibilidad Corporativa.
      </p>

      <div v-if="bitacora.length === 0" class="mensaje-vacio">
        Aun no hay decisiones aprobadas en la bitacora. Apruebe una opcion en el modulo de Decisiones.
      </div>

      <div v-else class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Decision y Opcion Elegida</th>
              <th>PTI y Riesgo</th>
              <th>Aprobacion y Revision</th>
              <th>Supuestos y Escenarios</th>
              <th>Resultado Real</th>
              <th v-if="puedeEditar" class="no-imprimir">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bitacora" :key="b.id">
              <td>
                <strong>{{ b.tituloDecision }}</strong>
                <div class="texto-secundario">Elegida: {{ b.opcionElegida }}</div>
              </td>
              <td>
                PTI: <strong>{{ b.pti }}</strong>
                <div class="texto-secundario">Riesgo residual: {{ b.riesgoResidual }}</div>
              </td>
              <td>
                Aprobo: <strong>{{ b.aprobadoPor }}</strong> ({{ b.fechaAprobacion }})
                <div :class="b.estadoRevision === 'revisada' ? 'tipo-oportunidad' : 'tipo-amenaza'">
                  {{ b.estadoRevision === 'revisada' ? 'Revisada' : 'Revision: ' + b.fechaRevision }}
                </div>
              </td>
              <td>
                <div>{{ b.supuestos || 'Sin supuestos adicionales' }}</div>
                <div v-if="b.escenariosSimulados && b.escenariosSimulados.length > 0" class="texto-secundario">
                  Escenarios: {{ b.escenariosSimulados.join(', ') }}
                </div>
              </td>
              <td>
                <div v-if="editandoId === b.id && puedeEditar" class="no-imprimir">
                  <input
                    type="text"
                    v-model="textoResultado"
                    placeholder="Describa que paso realmente..."
                    style="width: 100%; margin-bottom: 5px;"
                  />
                  <div class="grupo-botones">
                    <button class="boton-accion" @click="guardarResultado(b)">Guardar</button>
                    <button @click="editandoId = null">Cancelar</button>
                  </div>
                </div>
                <div v-else>
                  {{ b.resultadoReal || 'Pendiente de registrar resultado real' }}
                </div>
              </td>
              <td v-if="puedeEditar" class="no-imprimir">
                <div class="grupo-botones">
                  <button @click="iniciarEdicionResultado(b)">
                    {{ b.resultadoReal ? 'Editar Resultado' : 'Registrar Resultado' }}
                  </button>
                  <button class="boton-eliminar" @click="$emit('eliminar-bitacora', b.id)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <h2>Consolidado de Indicadores de Sostenibilidad en Sedes y Proveedores (Auditoria)</h2>
      <div class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Indicador de Triple Impacto</th>
              <th>Valor Consolidado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in listaIndicadoresFincas" :key="item.indicador">
              <td><strong>{{ item.indicador }}</strong></td>
              <td>{{ item.valor }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <h2>Resumen de Riesgos y Controles (Auditoria)</h2>
      <div class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Riesgo Identificado</th>
              <th>Categoria</th>
              <th>Riesgo Inherente</th>
              <th>Controles Aplicados</th>
              <th>Riesgo Residual</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in riesgos" :key="r.id">
              <td><strong>{{ r.nombre }}</strong></td>
              <td>{{ r.categoria }}</td>
              <td>{{ r.probabilidad * r.impacto }} (P{{ r.probabilidad }} x I{{ r.impacto }})</td>
              <td>{{ r.controles || 'Sin controles' }}</td>
              <td>{{ r.probResidual * r.impactoResidual }} (P{{ r.probResidual }} x I{{ r.impactoResidual }})</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { resumenFincas } from '../logicaTripleImpacto';

export default {
  name: 'ModuloBitacora',
  props: {
    bitacora: { type: Array, required: true },
    fincas: { type: Array, required: true },
    riesgos: { type: Array, required: true },
    ajustes: { type: Object, required: true },
    puedeEditar: { type: Boolean, default: true }
  },
  emits: ['guardar-bitacora', 'eliminar-bitacora'],
  data() {
    return {
      editandoId: null,
      textoResultado: ''
    };
  },
  computed: {
    resumen() {
      return resumenFincas(this.fincas, this.ajustes.metaAguaM3Ha);
    },
    listaIndicadoresFincas() {
      const r = this.resumen;
      return [
        { indicador: 'Sedes y proveedores auditados', valor: String(r.total) },
        { indicador: 'Capacidad instalada total', valor: r.areaHa + ' u.' },
        { indicador: 'Volumen operativo esperado', valor: r.produccionEsperadaT + ' t' },
        {
          indicador: 'Consumo de recurso e hidrico promedio ponderado',
          valor: r.aguaPromedio + ' m3/u (Meta ' + this.ajustes.metaAguaM3Ha + ' m3/u)'
        },
        { indicador: 'Sedes con alerta de suministro', valor: r.conProblemasRiego + ' de ' + r.total },
        { indicador: 'Practicas limpias promedio ponderado', valor: r.controlBiologicoPct + '%' },
        { indicador: 'Sedes con tecnologia de eficiencia', valor: r.conLaser + ' de ' + r.total },
        { indicador: 'Sedes con linea certificada', valor: r.conOrganico + ' de ' + r.total },
        { indicador: 'Incumplimientos de certificacion', valor: String(r.incumplenOrganico) },
        { indicador: 'Indice ambiental y biodiversidad acumulado', valor: String(r.avesTotal) },
        { indicador: 'Proveedores en riesgo de discontinuidad', valor: r.riesgoAbandono + ' de ' + r.total }
      ];
    }
  },
  methods: {
    iniciarEdicionResultado(b) {
      this.editandoId = b.id;
      this.textoResultado = b.resultadoReal || '';
    },
    guardarResultado(b) {
      const limpio = this.textoResultado.trim();
      const actualizado = {
        ...b,
        resultadoReal: limpio,
        estadoRevision: limpio ? 'revisada' : 'pendiente'
      };
      this.$emit('guardar-bitacora', actualizado);
      this.editandoId = null;
    },
    imprimirAuditoria() {
      window.print();
    },
    descargarAuditoriaCSV() {
      let contenido = 'Seccion,Concepto,Detalle,Valor1,Valor2,Responsable_Estado\n';

      for (let i = 0; i < this.bitacora.length; i++) {
        const b = this.bitacora[i];
        contenido += `"Decision Aprobada","${b.tituloDecision}","${b.opcionElegida}","PTI ${b.pti}","Riesgo ${b.riesgoResidual}","${b.aprobadoPor} (${b.fechaAprobacion})"\n`;
      }

      for (let i = 0; i < this.listaIndicadoresFincas.length; i++) {
        const ind = this.listaIndicadoresFincas[i];
        contenido += `"Indicador Operativo","${ind.indicador}","${ind.valor}","","",""\n`;
      }

      for (let i = 0; i < this.riesgos.length; i++) {
        const r = this.riesgos[i];
        contenido += `"Riesgo","${r.nombre}","${r.categoria}","Inherente ${r.probabilidad * r.impacto}","Residual ${r.probResidual * r.impactoResidual}","${r.controles || ''}"\n`;
      }

      const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.setAttribute('download', 'reporte_auditoria_triple_impacto.csv');
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
    }
  }
};
</script>
