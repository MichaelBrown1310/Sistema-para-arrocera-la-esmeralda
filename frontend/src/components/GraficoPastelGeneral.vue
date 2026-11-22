<template>
  <div class="panel" id="seccion-pastel-general">
    <h2>4. Distribucion General por Categorias PESTEL</h2>
    <div class="contenedor-pastel-general">
      <canvas ref="lienzoGeneral"></canvas>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'GraficoPastelGeneral',
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
      ],
      colores: [
        '#5c6bc0',
        '#42a5f5',
        '#26a69a',
        '#ffb74d',
        '#81c784',
        '#ba68c8'
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
      const totales = [];
      for (let i = 0; i < this.categorias.length; i++) {
        const categoria = this.categorias[i];
        const cantidad = this.factores.filter(f => f.categoria === categoria).length;
        totales.push(cantidad);
      }
      return totales;
    },
    construirGrafico() {
      const contexto = this.$refs.lienzoGeneral.getContext('2d');
      const totales = this.calcularTotales();

      this.instanciaGrafico = markRaw(new Chart(contexto, {
        type: 'pie',
        data: {
          labels: this.categorias,
          datasets: [
            {
              data: totales,
              backgroundColor: this.colores,
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
      const totales = this.calcularTotales();
      this.instanciaGrafico.data.datasets[0].data = totales;
      this.instanciaGrafico.update();
    }
  }
};
</script>
