<template>
  <div class="panel" id="seccion-pasteles-categorias">
    <h2>5. Analisis Individual por Cada Categoria (Amenazas vs Oportunidades)</h2>
    <div class="cuadricula-pasteles">
      <PastelIndividual
        v-for="cat in categorias"
        :key="cat"
        :categoria="cat"
        :factores="factores"
      />
    </div>
  </div>
</template>

<script>
import PastelIndividual from './PastelIndividual.vue';

export default {
  name: 'GraficosPastelCategorias',
  components: {
    PastelIndividual
  },
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
  }
};
</script>
