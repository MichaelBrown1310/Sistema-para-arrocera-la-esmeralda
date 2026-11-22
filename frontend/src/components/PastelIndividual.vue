<template>
  <div class="tarjeta-pastel-categoria">
    <h3>{{ categoria }}</h3>
    <div class="subtexto">
      Total: {{ total }} (Amenazas: {{ amenazas }} | Oportunidades: {{ oportunidades }})
    </div>

    <div v-if="total === 0" class="mensaje-vacio-pequeno">
      Sin factores registrados
    </div>

    <div v-show="total > 0" class="contenedor-pastel-categoria">
      <canvas ref="lienzoIndividual"></canvas>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'PastelIndividual',
  props: {
    categoria: {
      type: String,
      required: true
    },
    factores: {
      type: Array,
      required: true
    }
  },
  created() {
    this.instanciaGrafico = null;
  },
  mounted() {
    if (this.total > 0) {
      this.construirGrafico();
    }
  },
  computed: {
    amenazas() {
      return this.factores.filter(
        f => f.categoria === this.categoria && f.tipo === 'Amenaza'
      ).length;
    },
    oportunidades() {
      return this.factores.filter(
        f => f.categoria === this.categoria && f.tipo === 'Oportunidad'
      ).length;
    },
    total() {
      return this.amenazas + this.oportunidades;
    }
  },
  watch: {
    factores: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          if (this.total > 0) {
            if (!this.instanciaGrafico) {
              this.construirGrafico();
            } else {
              this.actualizarGrafico();
            }
          } else if (this.instanciaGrafico) {
            this.instanciaGrafico.destroy();
            this.instanciaGrafico = null;
          }
        });
      }
    }
  },
  beforeUnmount() {
    if (this.instanciaGrafico) {
      this.instanciaGrafico.destroy();
    }
  },
  methods: {
    construirGrafico() {
      if (!this.$refs.lienzoIndividual) {
        return;
      }
      const contexto = this.$refs.lienzoIndividual.getContext('2d');
      this.instanciaGrafico = markRaw(new Chart(contexto, {
        type: 'pie',
        data: {
          labels: ['Amenazas', 'Oportunidades'],
          datasets: [
            {
              data: [this.amenazas, this.oportunidades],
              backgroundColor: ['#e57373', '#81c784'],
              borderColor: '#ffffff',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      }));
    },
    actualizarGrafico() {
      if (!this.instanciaGrafico) {
        return;
      }
      this.instanciaGrafico.data.datasets[0].data = [this.amenazas, this.oportunidades];
      this.instanciaGrafico.update();
    }
  }
};
</script>
