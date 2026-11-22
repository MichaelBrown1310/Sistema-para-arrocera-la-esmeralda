<template>
  <div class="animar-entrada">
    <div class="panel">
      <div class="cabecera-seccion">
        <h2>Radar de Riesgos Corporativos (Matriz 5x5)</h2>
        <div class="grupo-botones">
          <button
            :class="vista === 'inherente' ? 'boton-accion' : ''"
            @click="vista = 'inherente'"
          >
            Riesgo Inherente (Sin controles)
          </button>
          <button
            :class="vista === 'residual' ? 'boton-accion' : ''"
            @click="vista = 'residual'"
          >
            Riesgo Residual (Con controles)
          </button>
          <button v-if="puedeEditar" @click="abrirNuevoRiesgo">Nuevo Riesgo</button>
        </div>
      </div>

      <div class="resumen-cajas">
        <div class="caja-resumen">
          <div>Total Riesgos</div>
          <div class="numero">{{ riesgos.length }}</div>
        </div>
        <div class="caja-resumen criticos">
          <div>Riesgos en Rojo ({{ vista }})</div>
          <div class="numero">{{ cantidadRojos }}</div>
        </div>
        <div class="caja-resumen">
          <div>Sobre Apetito de Riesgo ({{ ajustes.apetitoRiesgo }})</div>
          <div class="numero">{{ cantidadSobreApetito }}</div>
        </div>
      </div>

      <div class="contenedor-matriz-5x5">
        <div class="etiqueta-eje-y">Probabilidad (1 a 5)</div>
        <div class="contenedor-tabla-responsive">
          <table class="tabla-matriz-5x5">
            <thead>
              <tr>
                <th>Prob \ Imp</th>
                <th v-for="imp in [1, 2, 3, 4, 5]" :key="imp">Impacto {{ imp }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prob in [5, 4, 3, 2, 1]" :key="prob">
                <th>Prob {{ prob }}</th>
                <td
                  v-for="imp in [1, 2, 3, 4, 5]"
                  :key="imp"
                  :class="obtenerClaseCelda(prob, imp)"
                >
                  <div class="valor-celda-matriz">{{ matriz[prob - 1][imp - 1] }}</div>
                  <div class="sub-celda-matriz">Nivel {{ prob * imp }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="mostrandoFormulario" class="panel no-imprimir animar-entrada">
      <h2>{{ editandoId ? 'Editar Riesgo' : 'Registrar Nuevo Riesgo' }}</h2>
      <form @submit.prevent="guardarFormulario">
        <div class="fila-formulario">
          <div class="campo">
            <label>Nombre del Riesgo *</label>
            <input type="text" v-model="form.nombre" required placeholder="Ej: Interrupcion en cadena de suministro" />
          </div>
          <div class="campo">
            <label>Categoria *</label>
            <select v-model="form.categoria" required>
              <option value="Operativo">Operativo</option>
              <option value="Mercado">Mercado</option>
              <option value="Comercio">Comercio</option>
              <option value="Regulatorio">Regulatorio</option>
              <option value="Logistica">Logistica</option>
              <option value="Clima">Clima / Ambiental</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo-completo">
            <label>Descripcion</label>
            <input type="text" v-model="form.descripcion" placeholder="Detalle del evento de riesgo corporativo" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Probabilidad Inherente (1 a 5)</label>
            <select v-model.number="form.probabilidad">
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="campo">
            <label>Impacto Inherente (1 a 5)</label>
            <select v-model.number="form.impacto">
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="campo">
            <label>Pilares Afectados</label>
            <div class="opciones-en-linea">
              <label><input type="checkbox" value="E" v-model="form.pilares" /> Economico (E)</label>
              <label><input type="checkbox" value="S" v-model="form.pilares" /> Social (S)</label>
              <label><input type="checkbox" value="A" v-model="form.pilares" /> Ambiental (A)</label>
            </div>
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo-completo">
            <label>Controles o Mitigacion</label>
            <input type="text" v-model="form.controles" placeholder="Medidas aplicadas para reducir el riesgo" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Probabilidad Residual (Con controles, 1 a 5)</label>
            <select v-model.number="form.probResidual">
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="campo">
            <label>Impacto Residual (Con controles, 1 a 5)</label>
            <select v-model.number="form.impactoResidual">
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <div class="barra-reportes">
          <button type="submit" class="boton-accion">Guardar Riesgo</button>
          <button type="button" @click="mostrandoFormulario = false">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="panel">
      <h2>Listado de Riesgos Ordenados por Criticidad</h2>
      <div class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Riesgo</th>
              <th>Categoria</th>
              <th>Pilares</th>
              <th>Inherente (P x I)</th>
              <th>Controles</th>
              <th>Residual (P x I)</th>
              <th v-if="puedeEditar" class="no-imprimir">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in riesgosOrdenados" :key="r.id">
              <td>
                <strong>{{ r.nombre }}</strong>
                <div class="texto-secundario">{{ r.descripcion }}</div>
              </td>
              <td>{{ r.categoria }}</td>
              <td>{{ (r.pilares || []).join(', ') }}</td>
              <td :class="claseSemaforoValor(r.probabilidad * r.impacto)">
                {{ r.probabilidad * r.impacto }} (P{{ r.probabilidad }} x I{{ r.impacto }})
              </td>
              <td>{{ r.controles || 'Sin controles registrados' }}</td>
              <td :class="claseSemaforoValor(r.probResidual * r.impactoResidual)">
                {{ r.probResidual * r.impactoResidual }} (P{{ r.probResidual }} x I{{ r.impactoResidual }})
              </td>
              <td v-if="puedeEditar" class="no-imprimir">
                <div class="grupo-botones">
                  <button @click="editarRiesgo(r)">Editar</button>
                  <button class="boton-eliminar" @click="$emit('eliminar-riesgo', r.id)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { conteoMatriz, nivelRiesgo, valorRiesgo } from '../logicaTripleImpacto';

export default {
  name: 'ModuloRiesgos',
  props: {
    riesgos: { type: Array, required: true },
    ajustes: { type: Object, required: true },
    puedeEditar: { type: Boolean, default: true }
  },
  emits: ['guardar-riesgo', 'eliminar-riesgo'],
  data() {
    return {
      vista: 'inherente',
      mostrandoFormulario: false,
      editandoId: null,
      form: {
        id: '',
        nombre: '',
        categoria: 'Operativo',
        descripcion: '',
        probabilidad: 3,
        impacto: 3,
        pilares: ['E'],
        controles: '',
        probResidual: 2,
        impactoResidual: 2
      }
    };
  },
  computed: {
    esResidual() {
      return this.vista === 'residual';
    },
    matriz() {
      return conteoMatriz(this.riesgos, this.esResidual);
    },
    riesgosOrdenados() {
      return [...this.riesgos].sort((a, b) => {
        const va = this.esResidual
          ? valorRiesgo(a.probResidual, a.impactoResidual)
          : valorRiesgo(a.probabilidad, a.impacto);
        const vb = this.esResidual
          ? valorRiesgo(b.probResidual, b.impactoResidual)
          : valorRiesgo(b.probabilidad, b.impacto);
        return vb - va;
      });
    },
    cantidadRojos() {
      return this.riesgos.filter(r => {
        const v = this.esResidual
          ? valorRiesgo(r.probResidual, r.impactoResidual)
          : valorRiesgo(r.probabilidad, r.impacto);
        return nivelRiesgo(v) === 'rojo';
      }).length;
    },
    cantidadSobreApetito() {
      return this.riesgos.filter(
        r => valorRiesgo(r.probResidual, r.impactoResidual) > this.ajustes.apetitoRiesgo
      ).length;
    }
  },
  methods: {
    obtenerClaseCelda(prob, imp) {
      const n = nivelRiesgo(prob * imp);
      if (n === 'rojo') return 'semaforo-alto';
      if (n === 'amarillo') return 'semaforo-medio';
      return 'semaforo-bajo';
    },
    claseSemaforoValor(v) {
      const n = nivelRiesgo(v);
      if (n === 'rojo') return 'semaforo-alto';
      if (n === 'amarillo') return 'semaforo-medio';
      return 'semaforo-bajo';
    },
    abrirNuevoRiesgo() {
      this.editandoId = null;
      this.form = {
        id: 'r-' + Date.now(),
        nombre: '',
        categoria: 'Operativo',
        descripcion: '',
        probabilidad: 3,
        impacto: 3,
        pilares: ['E'],
        controles: '',
        probResidual: 2,
        impactoResidual: 2
      };
      this.mostrandoFormulario = true;
    },
    editarRiesgo(r) {
      this.editandoId = r.id;
      this.form = {
        id: r.id,
        nombre: r.nombre,
        categoria: r.categoria,
        descripcion: r.descripcion || '',
        probabilidad: Number(r.probabilidad),
        impacto: Number(r.impacto),
        pilares: Array.isArray(r.pilares) ? [...r.pilares] : [],
        controles: r.controles || '',
        probResidual: Number(r.probResidual),
        impactoResidual: Number(r.impactoResidual)
      };
      this.mostrandoFormulario = true;
    },
    guardarFormulario() {
      this.$emit('guardar-riesgo', { ...this.form });
      this.mostrandoFormulario = false;
    }
  }
};
</script>
