<template>
  <div class="animar-entrada">
    <div class="panel">
      <div class="cabecera-seccion">
        <h2>Evaluador Triple Impacto y Simulador de Decisiones</h2>
        <div v-if="puedeEditar" class="grupo-botones">
          <button @click="crearNuevaDecision" class="boton-accion">Plantear Nueva Decision</button>
        </div>
      </div>

      <p class="texto-secundario">
        Formula actual PTI = {{ ajustes.pesos.E }}% Economico + {{ ajustes.pesos.S }}% Social + {{ ajustes.pesos.A }}% Ambiental | Apetito maximo de riesgo residual: {{ ajustes.apetitoRiesgo }}
      </p>

      <div class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Titulo de la Decision</th>
              <th>Pregunta Estrategica</th>
              <th>Responsable</th>
              <th>Opciones</th>
              <th>Opcion Recomendada</th>
              <th>Estado</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in decisiones"
              :key="d.id"
              :style="decisionActiva && decisionActiva.id === d.id ? 'background-color: #f0fdf4;' : ''"
            >
              <td><strong>{{ d.titulo }}</strong></td>
              <td>{{ d.pregunta || 'Sin pregunta definida' }}</td>
              <td>{{ d.responsable || 'Gerencia' }}</td>
              <td>{{ (d.opciones || []).length }}</td>
              <td>{{ obtenerTextoRecomendada(d) }}</td>
              <td :class="d.estado === 'aprobada' ? 'semaforo-bajo' : 'semaforo-medio'">
                {{ d.estado === 'aprobada' ? 'Aprobada' : 'Abierta' }}
              </td>
              <td>
                <div class="grupo-botones">
                  <button @click="seleccionarDecision(d, 'comparar')">Simular / Evaluar</button>
                  <button v-if="puedeEditar" @click="seleccionarDecision(d, 'editar')">Editar Opciones</button>
                  <button v-if="puedeEditar" class="boton-eliminar" @click="eliminarDecision(d.id)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="decisionActiva && modoVista === 'comparar'" class="panel animar-entrada">
      <div class="cabecera-seccion">
        <div>
          <h2>Evaluacion: {{ decisionActiva.titulo }}</h2>
          <p class="texto-secundario">{{ decisionActiva.pregunta }}</p>
        </div>
        <div v-if="puedeEditar" class="grupo-botones">
          <button @click="modoVista = 'editar'">Editar Opciones</button>
        </div>
      </div>

      <div class="caja-simulador">
        <h3>Simulador: ¿Que pasa si...? (Active uno o varios escenarios)</h3>
        <div class="grupo-botones" style="margin-top: 8px;">
          <button
            v-for="esc in escenariosDisponibles"
            :key="esc.id"
            :class="escenariosActivos.includes(esc.id) ? 'boton-accion' : ''"
            @click="alternarEscenario(esc.id)"
          >
            {{ esc.nombre }} (Afecta {{ esc.pilares.join(', ') }})
          </button>
        </div>
        <div v-if="escenariosActivos.length > 0" class="texto-secundario" style="margin-top: 8px;">
          Escenarios activos: {{ descripcionEscenariosActivos }}
        </div>
      </div>

      <div class="cuadricula-opciones">
        <div
          v-for="res in resultadosEvaluacion"
          :key="res.opcion.id"
          class="tarjeta-opcion-evaluada"
          :class="'borde-' + res.estado"
        >
          <div class="cabecera-opcion">
            <span class="etiqueta-estado" :class="claseEstadoOpcion(res.estado)">
              {{ textoEstadoOpcion(res.estado) }}
            </span>
            <span :class="claseSemaforoRiesgo(res.riesgo)" style="padding: 3px 8px; font-size: 12px;">
              Riesgo Residual: {{ res.riesgo }}
            </span>
          </div>

          <h3>{{ res.opcion.nombre }}</h3>
          <p class="texto-secundario">{{ res.opcion.descripcion }}</p>

          <div class="bloque-pti">
            <div class="numero-pti">
              PTI: {{ escenariosActivos.length > 0 ? res.ptiEscenario : res.ptiBase }}
              <span v-if="escenariosActivos.length > 0 && res.ptiEscenario !== res.ptiBase" class="texto-secundario">
                (Base: {{ res.ptiBase }})
              </span>
            </div>
          </div>

          <div class="barras-pilares">
            <div class="fila-barra-pilar">
              <span>Economico (E): {{ escenariosActivos.length > 0 ? res.sim.E : res.opcion.E }} / 100</span>
              <div class="fondo-barra">
                <div class="relleno-barra economico" :style="{ width: (escenariosActivos.length > 0 ? res.sim.E : res.opcion.E) + '%' }"></div>
              </div>
            </div>
            <div class="fila-barra-pilar">
              <span>Social (S): {{ escenariosActivos.length > 0 ? res.sim.S : res.opcion.S }} / 100</span>
              <div class="fondo-barra">
                <div class="relleno-barra social" :style="{ width: (escenariosActivos.length > 0 ? res.sim.S : res.opcion.S) + '%' }"></div>
              </div>
            </div>
            <div class="fila-barra-pilar">
              <span>Ambiental (A): {{ escenariosActivos.length > 0 ? res.sim.A : res.opcion.A }} / 100</span>
              <div class="fondo-barra">
                <div class="relleno-barra ambiental" :style="{ width: (escenariosActivos.length > 0 ? res.sim.A : res.opcion.A) + '%' }"></div>
              </div>
            </div>
          </div>

          <div v-if="res.candadosRotos.length > 0" class="alerta-candados">
            <div v-for="c in res.candadosRotos" :key="c">Candado incumplido: {{ c }}</div>
          </div>

          <p class="razon-opcion">{{ res.razon }}</p>

          <div v-if="decisionActiva.estado !== 'aprobada' && res.estado !== 'descartada'" class="no-imprimir">
            <button
              v-if="puedeAprobar"
              class="boton-accion"
              style="width: 100%;"
              @click="iniciarAprobacion(res)"
            >
              Aprobar esta Opcion
            </button>
            <div v-else class="texto-secundario" style="text-align: center; padding: 6px; border: 1px dashed #cbd5e1; border-radius: 6px;">
              Solo el rol Gerente (gerente01) puede aprobar decisiones en bitacora
            </div>
          </div>
        </div>
      </div>

      <div v-if="opcionPorAprobar" class="panel-aprobacion no-imprimir animar-entrada">
        <h3>Confirmar Aprobacion de Opcion: {{ opcionPorAprobar.opcion.nombre }}</h3>
        <form @submit.prevent="confirmarAprobacion">
          <div class="fila-formulario">
            <div class="campo">
              <label>Aprobado por (Nombre o Cargo) *</label>
              <input type="text" v-model="formAprobacion.aprobadoPor" required placeholder="Ej: Gerente de Operaciones" />
            </div>
            <div class="campo">
              <label>Fecha de Revision Programada *</label>
              <input type="date" v-model="formAprobacion.fechaRevision" required />
            </div>
          </div>
          <div class="fila-formulario">
            <div class="campo-completo">
              <label>Supuestos y Justificacion</label>
              <input type="text" v-model="formAprobacion.supuestos" placeholder="Condiciones previstas al tomar la decision" />
            </div>
          </div>
          <div class="barra-reportes">
            <button type="submit" class="boton-accion">Confirmar Aprobacion</button>
            <button type="button" @click="opcionPorAprobar = null">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="decisionActiva && modoVista === 'editar'" class="panel no-imprimir animar-entrada">
      <div class="cabecera-seccion">
        <h2>Configurar Decision y Opciones</h2>
        <div class="grupo-botones">
          <button @click="agregarOpcion">Agregar Opcion</button>
          <button class="boton-accion" @click="guardarCambiosDecision">Guardar Decision</button>
          <button @click="modoVista = 'comparar'">Volver a Simulador</button>
        </div>
      </div>

      <div class="fila-formulario">
        <div class="campo">
          <label>Titulo de la Decision</label>
          <input type="text" v-model="decisionActiva.titulo" />
        </div>
        <div class="campo">
          <label>Responsable</label>
          <input type="text" v-model="decisionActiva.responsable" />
        </div>
      </div>
      <div class="fila-formulario">
        <div class="campo-completo">
          <label>Pregunta que se quiere responder</label>
          <input type="text" v-model="decisionActiva.pregunta" />
        </div>
      </div>

      <div v-for="(op, idx) in decisionActiva.opciones" :key="op.id" class="caja-editor-opcion">
        <div class="cabecera-seccion">
          <h3>Opcion {{ idx + 1 }}: {{ op.nombre }}</h3>
          <button
            v-if="decisionActiva.opciones.length > 2"
            class="boton-eliminar"
            @click="quitarOpcion(op.id)"
          >
            Quitar Opcion
          </button>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Nombre de la Opcion</label>
            <input type="text" v-model="op.nombre" />
          </div>
          <div class="campo">
            <label>Descripcion</label>
            <input type="text" v-model="op.descripcion" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Puntaje Economico E (0 a 100)</label>
            <input type="number" min="0" max="100" v-model.number="op.E" />
          </div>
          <div class="campo">
            <label>Puntaje Social S (0 a 100)</label>
            <input type="number" min="0" max="100" v-model.number="op.S" />
          </div>
          <div class="campo">
            <label>Puntaje Ambiental A (0 a 100)</label>
            <input type="number" min="0" max="100" v-model.number="op.A" />
          </div>
          <div class="campo">
            <label>Prob. Residual (1-5)</label>
            <select v-model.number="op.probResidual">
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="campo">
            <label>Impacto Residual (1-5)</label>
            <select v-model.number="op.impactoResidual">
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo-completo">
            <label>Candados de Certificacion (Marcar si la opcion INCUMPLE el candado)</label>
            <div class="opciones-en-linea">
              <label>
                <input type="checkbox" v-model="op.candados.precioBajoMinimo" />
                Incumple pago justo o condiciones laborales
              </label>
              <label>
                <input type="checkbox" v-model="op.candados.insumoNoPermitido" />
                Usa insumos o procesos no certificados
              </label>
              <label>
                <input type="checkbox" v-model="op.candados.superaMetaAgua" />
                Supera el limite maximo de consumo ambiental
              </label>
            </div>
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo" v-for="esc in escenariosDisponibles" :key="esc.id">
            <label>Sensibilidad a: {{ esc.nombre }}</label>
            <select v-model.number="op.sensibilidad[esc.id]">
              <option :value="0">Baja (-0 pts)</option>
              <option :value="1">Media (-10 pts)</option>
              <option :value="2">Alta (-20 pts)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  CANDADOS_CUMPLIDOS,
  ESCENARIOS,
  evaluarDecision,
  nivelRiesgo
} from '../logicaTripleImpacto';

export default {
  name: 'ModuloDecisiones',
  props: {
    decisiones: { type: Array, required: true },
    ajustes: { type: Object, required: true },
    puedeEditar: { type: Boolean, default: true },
    puedeAprobar: { type: Boolean, default: true }
  },
  emits: ['guardar-decision', 'eliminar-decision', 'aprobar-decision'],
  data() {
    return {
      decisionActiva: null,
      modoVista: 'comparar',
      escenariosActivos: [],
      escenariosDisponibles: ESCENARIOS,
      opcionPorAprobar: null,
      formAprobacion: {
        aprobadoPor: '',
        supuestos: '',
        fechaRevision: ''
      }
    };
  },
  watch: {
    decisiones: {
      immediate: true,
      handler(lista) {
        if (!this.decisionActiva && lista.length > 0) {
          this.decisionActiva = JSON.parse(JSON.stringify(lista[0]));
        } else if (this.decisionActiva) {
          const actualizada = lista.find(d => d.id === this.decisionActiva.id);
          if (actualizada && this.modoVista === 'comparar') {
            this.decisionActiva = JSON.parse(JSON.stringify(actualizada));
          }
        }
      }
    }
  },
  computed: {
    resultadosEvaluacion() {
      if (!this.decisionActiva) return [];
      return evaluarDecision(this.decisionActiva, this.ajustes, this.escenariosActivos);
    },
    descripcionEscenariosActivos() {
      return this.escenariosDisponibles
        .filter(e => this.escenariosActivos.includes(e.id))
        .map(e => e.nombre + ' (' + e.descripcion + ')')
        .join(' | ');
    }
  },
  methods: {
    obtenerTextoRecomendada(d) {
      const res = evaluarDecision(d, this.ajustes, []);
      const rec = res.find(r => r.estado === 'recomendada');
      return rec ? rec.opcion.nombre + ' (PTI ' + rec.ptiBase + ')' : 'Sin opcion recomendable';
    },
    seleccionarDecision(d, modo) {
      this.decisionActiva = JSON.parse(JSON.stringify(d));
      this.modoVista = modo;
      this.opcionPorAprobar = null;
    },
    alternarEscenario(id) {
      if (this.escenariosActivos.includes(id)) {
        this.escenariosActivos = this.escenariosActivos.filter(x => x !== id);
      } else {
        this.escenariosActivos.push(id);
      }
    },
    textoEstadoOpcion(estado) {
      const mapa = {
        recomendada: 'RECOMENDADA',
        viable: 'VIABLE',
        mitigar: 'REQUIERE MITIGACION',
        descartada: 'DESCARTADA (CANDADO ROTO)'
      };
      return mapa[estado] || estado;
    },
    claseEstadoOpcion(estado) {
      if (estado === 'recomendada') return 'semaforo-bajo';
      if (estado === 'viable') return 'etiqueta-viable';
      if (estado === 'mitigar') return 'semaforo-medio';
      return 'semaforo-alto';
    },
    claseSemaforoRiesgo(valor) {
      const n = nivelRiesgo(valor);
      if (n === 'rojo') return 'semaforo-alto';
      if (n === 'amarillo') return 'semaforo-medio';
      return 'semaforo-bajo';
    },
    crearOpcionVacia(nombre) {
      return {
        id: 'o-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nombre,
        descripcion: '',
        E: 60,
        S: 60,
        A: 60,
        probResidual: 3,
        impactoResidual: 3,
        candados: {
          precioBajoMinimo: false,
          insumoNoPermitido: false,
          superaMetaAgua: false
        },
        sensibilidad: {
          nino: 1,
          paddy: 1,
          bloqueo: 1,
          importaciones: 1
        }
      };
    },
    crearNuevaDecision() {
      const hoy = new Date().toISOString().slice(0, 10);
      const nueva = {
        id: 'd-' + Date.now(),
        titulo: 'Nueva Decision Estrategica',
        pregunta: '¿Que alternativa genera mayor triple impacto dentro del apetito de riesgo?',
        responsable: 'Gerencia General',
        fechaCreacion: hoy,
        estado: 'abierta',
        opciones: [
          this.crearOpcionVacia('Opcion A'),
          this.crearOpcionVacia('Opcion B')
        ]
      };
      this.$emit('guardar-decision', nueva);
      this.decisionActiva = JSON.parse(JSON.stringify(nueva));
      this.modoVista = 'editar';
    },
    agregarOpcion() {
      const letra = String.fromCharCode(65 + this.decisionActiva.opciones.length);
      this.decisionActiva.opciones.push(this.crearOpcionVacia('Opcion ' + letra));
    },
    quitarOpcion(id) {
      this.decisionActiva.opciones = this.decisionActiva.opciones.filter(o => o.id !== id);
    },
    guardarCambiosDecision() {
      this.$emit('guardar-decision', JSON.parse(JSON.stringify(this.decisionActiva)));
      this.modoVista = 'comparar';
    },
    eliminarDecision(id) {
      this.$emit('eliminar-decision', id);
      if (this.decisionActiva && this.decisionActiva.id === id) {
        this.decisionActiva = null;
      }
    },
    iniciarAprobacion(res) {
      const enSeisMeses = new Date();
      enSeisMeses.setMonth(enSeisMeses.getMonth() + 6);
      const nombresEsc = this.escenariosDisponibles
        .filter(e => this.escenariosActivos.includes(e.id))
        .map(e => e.nombre);

      this.opcionPorAprobar = res;
      this.formAprobacion = {
        aprobadoPor: this.decisionActiva.responsable || 'Gerencia',
        supuestos: nombresEsc.length > 0 ? 'Escenarios simulados: ' + nombresEsc.join(', ') : '',
        fechaRevision: enSeisMeses.toISOString().slice(0, 10)
      };
    },
    confirmarAprobacion() {
      const hoy = new Date().toISOString().slice(0, 10);
      const nombresEsc = this.escenariosDisponibles
        .filter(e => this.escenariosActivos.includes(e.id))
        .map(e => e.nombre);

      const registroBitacora = {
        id: 'b-' + Date.now(),
        decisionId: this.decisionActiva.id,
        tituloDecision: this.decisionActiva.titulo,
        opcionElegida: this.opcionPorAprobar.opcion.nombre,
        pti: this.opcionPorAprobar.ptiBase,
        riesgoResidual: this.opcionPorAprobar.riesgo,
        candadosVerificados: Object.values(CANDADOS_CUMPLIDOS),
        escenariosSimulados: nombresEsc,
        supuestos: this.formAprobacion.supuestos,
        aprobadoPor: this.formAprobacion.aprobadoPor,
        fechaAprobacion: hoy,
        fechaRevision: this.formAprobacion.fechaRevision,
        resultadoReal: '',
        estadoRevision: 'pendiente'
      };

      const decisionActualizada = {
        ...JSON.parse(JSON.stringify(this.decisionActiva)),
        estado: 'aprobada'
      };

      this.$emit('aprobar-decision', {
        decision: decisionActualizada,
        registro: registroBitacora
      });
      this.decisionActiva = decisionActualizada;
      this.opcionPorAprobar = null;
    }
  }
};
</script>
