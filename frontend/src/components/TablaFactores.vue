<template>
  <div class="panel animar-entrada" id="seccion-matriz">
    <h2>2. Matriz y Lista de Factores</h2>

    <div class="resumen-cajas">
      <div class="caja-resumen">
        <div>Total Factores</div>
        <div class="numero">{{ factores.length }}</div>
      </div>
      <div class="caja-resumen">
        <div>Amenazas</div>
        <div class="numero">{{ cantidadAmenazas }}</div>
      </div>
      <div class="caja-resumen">
        <div>Oportunidades</div>
        <div class="numero">{{ cantidadOportunidades }}</div>
      </div>
      <div class="caja-resumen criticos">
        <div>Urgentes</div>
        <div class="numero">{{ cantidadCriticos }}</div>
      </div>
    </div>

    <div v-if="factores.length === 0" class="mensaje-vacio">
      No hay factores registrados actualmente.
    </div>

    <div v-else class="contenedor-tabla-responsive">
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Descripcion</th>
            <th>Tipo</th>
            <th>Impacto</th>
            <th>Plazo</th>
            <th>Priorizacion</th>
            <th v-if="puedeEliminar" class="no-imprimir">Accion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="factor in factores" :key="factor.id">
            <td><strong>{{ factor.categoria }}</strong></td>
            <td>{{ factor.descripcion }}</td>
            <td :class="factor.tipo === 'Amenaza' ? 'tipo-amenaza' : 'tipo-oportunidad'">
              {{ factor.tipo }}
            </td>
            <td>{{ factor.impacto }}</td>
            <td>{{ factor.plazo }}</td>
            <td :class="obtenerClaseSemaforo(factor)">
              {{ obtenerTextoPrioridad(factor) }}
            </td>
            <td v-if="puedeEliminar" class="no-imprimir">
              <button class="boton-eliminar" @click="$emit('eliminar', factor.id)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TablaFactores',
  props: {
    factores: {
      type: Array,
      required: true
    },
    puedeEliminar: {
      type: Boolean,
      default: true
    }
  },
  emits: ['eliminar'],
  computed: {
    cantidadAmenazas() {
      return this.factores.filter(f => f.tipo === 'Amenaza').length;
    },
    cantidadOportunidades() {
      return this.factores.filter(f => f.tipo === 'Oportunidad').length;
    },
    cantidadCriticos() {
      return this.factores.filter(
        f => f.impacto === 'Alto' && f.plazo === 'Corto plazo'
      ).length;
    }
  },
  methods: {
    esCritico(factor) {
      return factor.impacto === 'Alto' && factor.plazo === 'Corto plazo';
    },
    obtenerClaseSemaforo(factor) {
      if (this.esCritico(factor)) {
        return 'semaforo-alto';
      }
      if (factor.impacto === 'Alto' || factor.plazo === 'Corto plazo') {
        return 'semaforo-medio';
      }
      return 'semaforo-bajo';
    },
    obtenerTextoPrioridad(factor) {
      if (this.esCritico(factor)) {
        return 'Critica (Urgente)';
      }
      if (factor.impacto === 'Alto' || factor.plazo === 'Corto plazo') {
        return 'Media';
      }
      return 'Baja';
    }
  }
};
</script>
