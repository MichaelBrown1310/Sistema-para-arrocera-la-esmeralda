<template>
  <div class="animar-entrada">
    <div class="panel">
      <h2>Centro de Alertas Automaticas del Sistema</h2>
      <p class="texto-secundario">
        Las alertas se calculan en tiempo real cruzando los datos de riesgos, auditorias de sedes/proveedores, decisiones abiertas y revisiones de bitacora.
      </p>

      <div class="resumen-cajas">
        <div class="caja-resumen criticos">
          <div>Atender Ya (Gravedad Alta)</div>
          <div class="numero">{{ alertasAlta.length }}</div>
        </div>
        <div class="caja-resumen">
          <div>Revisar Pronto (Gravedad Media)</div>
          <div class="numero">{{ alertasMedia.length }}</div>
        </div>
        <div class="caja-resumen">
          <div>Informativas</div>
          <div class="numero">{{ alertasInfo.length }}</div>
        </div>
      </div>

      <div v-if="alertas.length === 0" class="mensaje-vacio">
        No hay alertas activas. Las sedes, los riesgos y la bitacora se encuentran en orden.
      </div>

      <div v-else class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Prioridad</th>
              <th>Alerta Detectada</th>
              <th>Detalle y Recomendacion</th>
              <th>Modulo</th>
              <th class="no-imprimir">Accion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in alertas" :key="a.id">
              <td :class="clasePrioridadAlerta(a.gravedad)">
                {{ textoPrioridadAlerta(a.gravedad) }}
              </td>
              <td><strong>{{ a.titulo }}</strong></td>
              <td>{{ a.detalle }}</td>
              <td>{{ a.modulo === 'fincas' ? 'SEDES' : a.modulo.toUpperCase() }}</td>
              <td class="no-imprimir">
                <button @click="$emit('ir-submodulo', a.modulo)">Ir al Modulo</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel no-imprimir">
      <h2>Ajustes de Gobernanza y Parametros de la Empresa</h2>
      <div v-if="!puedeEditarAjustes" class="mensaje-vacio" style="margin-bottom: 14px;">
        Solo el rol Gerente (gerente01) tiene permisos para modificar los parametros de gobernanza.
      </div>
      <form @submit.prevent="guardarConfiguracion">
        <div class="fila-formulario">
          <div class="campo-completo">
            <label>Nombre de la Empresa u Organizacion</label>
            <input
              type="text"
              v-model="form.nombreEmpresa"
              :disabled="!puedeEditarAjustes"
              placeholder="Ej: Corporacion Empresarial S.A."
            />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Peso Economico E (%)</label>
            <input type="number" min="0" max="100" v-model.number="form.pesos.E" :disabled="!puedeEditarAjustes" />
          </div>
          <div class="campo">
            <label>Peso Social S (%)</label>
            <input type="number" min="0" max="100" v-model.number="form.pesos.S" :disabled="!puedeEditarAjustes" />
          </div>
          <div class="campo">
            <label>Peso Ambiental A (%)</label>
            <input type="number" min="0" max="100" v-model.number="form.pesos.A" :disabled="!puedeEditarAjustes" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo-completo">
            <div :class="sumaActual === 100 ? 'tipo-oportunidad' : 'tipo-amenaza'">
              Suma actual de pesos: {{ sumaActual }}%
              <span v-if="sumaActual !== 100"> (Los 3 pesos deben sumar exactamente 100%)</span>
            </div>
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Apetito Maximo de Riesgo Residual (1 a 25)</label>
            <input type="number" min="1" max="25" v-model.number="form.apetitoRiesgo" :disabled="!puedeEditarAjustes" />
          </div>
          <div class="campo">
            <label>Meta Ambiental de Recurso / Agua (m3 por unidad)</label>
            <input type="number" min="100" step="100" v-model.number="form.metaAguaM3Ha" :disabled="!puedeEditarAjustes" />
          </div>
        </div>

        <div v-if="puedeEditarAjustes" class="barra-reportes">
          <button type="submit" class="boton-accion" :disabled="sumaActual !== 100">
            Guardar Ajustes
          </button>
          <button type="button" class="boton-eliminar" @click="confirmarRestablecer">
            Restablecer Datos Iniciales
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModuloAlertasAjustes',
  props: {
    alertas: { type: Array, required: true },
    ajustes: { type: Object, required: true },
    puedeEditarAjustes: { type: Boolean, default: true }
  },
  emits: ['guardar-ajustes', 'restablecer-datos', 'ir-submodulo'],
  data() {
    return {
      form: {
        nombreEmpresa: this.ajustes.nombreEmpresa || 'Corporacion Empresarial S.A.',
        pesos: {
          E: this.ajustes.pesos.E,
          S: this.ajustes.pesos.S,
          A: this.ajustes.pesos.A
        },
        apetitoRiesgo: this.ajustes.apetitoRiesgo,
        metaAguaM3Ha: this.ajustes.metaAguaM3Ha
      }
    };
  },
  watch: {
    ajustes: {
      deep: true,
      handler(nuevo) {
        this.form = {
          nombreEmpresa: nuevo.nombreEmpresa || 'Corporacion Empresarial S.A.',
          pesos: {
            E: nuevo.pesos.E,
            S: nuevo.pesos.S,
            A: nuevo.pesos.A
          },
          apetitoRiesgo: nuevo.apetitoRiesgo,
          metaAguaM3Ha: nuevo.metaAguaM3Ha
        };
      }
    }
  },
  computed: {
    sumaActual() {
      return Number(this.form.pesos.E) + Number(this.form.pesos.S) + Number(this.form.pesos.A);
    },
    alertasAlta() {
      return this.alertas.filter(a => a.gravedad === 'alta');
    },
    alertasMedia() {
      return this.alertas.filter(a => a.gravedad === 'media');
    },
    alertasInfo() {
      return this.alertas.filter(a => a.gravedad === 'info');
    }
  },
  methods: {
    clasePrioridadAlerta(gravedad) {
      if (gravedad === 'alta') return 'semaforo-alto';
      if (gravedad === 'media') return 'semaforo-medio';
      return 'semaforo-bajo';
    },
    textoPrioridadAlerta(gravedad) {
      if (gravedad === 'alta') return 'Atender Ya (Alta)';
      if (gravedad === 'media') return 'Revisar Pronto (Media)';
      return 'Informativa';
    },
    guardarConfiguracion() {
      if (this.sumaActual !== 100) {
        alert('Los pesos deben sumar 100%.');
        return;
      }
      this.$emit('guardar-ajustes', JSON.parse(JSON.stringify(this.form)));
    },
    confirmarRestablecer() {
      if (confirm('¿Desea restablecer todos los datos iniciales del sistema?')) {
        this.$emit('restablecer-datos');
      }
    }
  }
};
</script>
