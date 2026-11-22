<template>
  <div class="panel no-imprimir" id="seccion-registro">
    <h2>1. Registro de Factor del Entorno PESTEL</h2>
    <form @submit.prevent="enviarFormulario">
      <div class="fila-formulario">
        <div class="campo">
          <label for="categoria">Categoria *</label>
          <select id="categoria" v-model="formulario.categoria" required>
            <option value="" disabled>Seleccione una categoria</option>
            <option value="Político">Político</option>
            <option value="Económico">Económico</option>
            <option value="Social">Social</option>
            <option value="Tecnológico">Tecnológico</option>
            <option value="Ecológico">Ecológico</option>
            <option value="Legal">Legal</option>
          </select>
        </div>

        <div class="campo">
          <label for="tipo">Tipo de Factor *</label>
          <select id="tipo" v-model="formulario.tipo" required>
            <option value="" disabled>Seleccione el tipo</option>
            <option value="Amenaza">Amenaza</option>
            <option value="Oportunidad">Oportunidad</option>
          </select>
        </div>

        <div class="campo">
          <label for="impacto">Nivel de Impacto *</label>
          <select id="impacto" v-model="formulario.impacto" required>
            <option value="" disabled>Seleccione el impacto</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>
        </div>

        <div class="campo">
          <label for="plazo">Plazo Estimado *</label>
          <select id="plazo" v-model="formulario.plazo" required>
            <option value="" disabled>Seleccione el plazo</option>
            <option value="Corto plazo">Corto plazo</option>
            <option value="Mediano plazo">Mediano plazo</option>
            <option value="Largo plazo">Largo plazo</option>
          </select>
        </div>
      </div>

      <div class="fila-formulario">
        <div class="campo-completo">
          <label for="descripcion">Descripcion del Factor *</label>
          <input
            id="descripcion"
            type="text"
            v-model="formulario.descripcion"
            placeholder="Ejemplo: Incremento del 18% en el costo de materias primas e insumos importados"
            required
          />
        </div>
      </div>

      <button type="submit" class="boton-accion">Guardar Factor</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'FormularioFactor',
  emits: ['guardar'],
  data() {
    return {
      formulario: {
        categoria: '',
        descripcion: '',
        tipo: '',
        impacto: '',
        plazo: ''
      }
    };
  },
  methods: {
    enviarFormulario() {
      this.$emit('guardar', { ...this.formulario });
      this.formulario.categoria = '';
      this.formulario.descripcion = '';
      this.formulario.tipo = '';
      this.formulario.impacto = '';
      this.formulario.plazo = '';
    }
  }
};
</script>
