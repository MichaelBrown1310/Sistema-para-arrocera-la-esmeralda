<template>
  <div class="panel" id="seccion-barras">
    <h2>3. Comparativa por Entorno (Amenazas vs Oportunidades)</h2>
    <div class="seccion-grafico">
      <canvas ref="lienzoGrafico"></canvas>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'GraficoPestel',
  props: {
    factores: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      categorias: [
        'Político',
        'Económico',
        'Social',
        'Tecnológico',
        'Ecológico',
        'Legal'
      ]
    };
  },
  created() {
    this.instanciaGrafico = null;
  },
  mounted() {
    this.construirGrafico();
  },
  watch: {
    factores: {
      deep: true,
      handler() {
        this.actualizarGrafico();
      }
    }
  },
  beforeUnmount() {
    if (this.instanciaGrafico) {
      this.instanciaGrafico.destroy();
    }
  },
  methods: {
    calcularTotales() {
      const amenazasPorCategoria = [];
      const oportunidadesPorCategoria = [];

      for (let i = 0; i < this.categorias.length; i++) {
        const categoria = this.categorias[i];
        const amenazas = this.factores.filter(
          f => f.categoria === categoria && f.tipo === 'Amenaza'
        ).length;
        const oportunidades = this.factores.filter(
          f => f.categoria === categoria && f.tipo === 'Oportunidad'
        ).length;

        amenazasPorCategoria.push(amenazas);
        oportunidadesPorCategoria.push(oportunidades);
      }

      return { amenazasPorCategoria, oportunidadesPorCategoria };
    },
    construirGrafico() {
      const contexto = this.$refs.lienzoGrafico.getContext('2d');
      const { amenazasPorCategoria, oportunidadesPorCategoria } = this.calcularTotales();

      this.instanciaGrafico = markRaw(new Chart(contexto, {
        type: 'bar',
        data: {
          labels: this.categorias,
          datasets: [
            {
              label: 'Amenazas',
              data: amenazasPorCategoria,
              backgroundColor: '#e57373',
              borderColor: '#c62828',
              borderWidth: 1
            },
            {
              label: 'Oportunidades',
              data: oportunidadesPorCategoria,
              backgroundColor: '#81c784',
              borderColor: '#2e7d32',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 5,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      }));
    },
    actualizarGrafico() {
      if (!this.instanciaGrafico) {
        return;
      }
      const { amenazasPorCategoria, oportunidadesPorCategoria } = this.calcularTotales();
      this.instanciaGrafico.data.datasets[0].data = amenazasPorCategoria;
      this.instanciaGrafico.data.datasets[1].data = oportunidadesPorCategoria;
      this.instanciaGrafico.update();
    }
  }
};
</script>
