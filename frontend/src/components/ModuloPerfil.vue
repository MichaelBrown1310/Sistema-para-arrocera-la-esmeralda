<template>
  <div class="animar-entrada">
    <div class="panel">
      <div class="cabecera-seccion">
        <h2>Mi Perfil de Usuario</h2>
        <div v-if="!editando" class="grupo-botones">
          <button type="button" class="boton-accion" @click="iniciarEdicion">
            Editar Perfil
          </button>
        </div>
      </div>

      <div class="contenedor-perfil-grid">
        <div class="columna-foto-perfil">
          <div class="marco-foto-grande">
            <img
              v-if="form.fotoPerfil"
              :src="form.fotoPerfil"
              alt="Foto de perfil"
              class="imagen-foto-grande"
            />
            <div v-else class="iniciales-foto-grande">
              {{ obtenerIniciales(form.nombre) }}
            </div>
          </div>

          <template v-if="editando">
            <label class="boton-subir-foto">
              Cambiar Foto de Perfil
              <input
                type="file"
                accept="image/*"
                class="input-archivo-oculto"
                @change="procesarArchivoFoto"
              />
            </label>

            <button
              v-if="form.fotoPerfil"
              type="button"
              class="boton-quitar-foto"
              @click="form.fotoPerfil = ''"
            >
              Quitar Foto
            </button>
          </template>

          <div class="insignia-rol" style="margin-top: 10px; text-align: center;">
            {{ form.nombreRol }}
          </div>
          <div class="texto-secundario" style="margin-top: 4px; text-align: center;">
            @{{ form.usuario }}
          </div>
        </div>

        <div v-if="!editando" class="columna-datos-perfil">
          <div class="fila-formulario">
            <div class="campo">
              <div class="etiqueta-dato-perfil">Nombre Completo</div>
              <div class="valor-dato-perfil">{{ usuario.nombre }}</div>
            </div>
            <div class="campo">
              <div class="etiqueta-dato-perfil">Usuario de Acceso</div>
              <div class="valor-dato-perfil">@{{ usuario.usuario }}</div>
            </div>
          </div>

          <div class="fila-formulario">
            <div class="campo">
              <div class="etiqueta-dato-perfil">Correo Corporativo</div>
              <div class="valor-dato-perfil">{{ usuario.correo || 'No especificado' }}</div>
            </div>
            <div class="campo">
              <div class="etiqueta-dato-perfil">Rol en la Organizacion</div>
              <div class="valor-dato-perfil">{{ usuario.nombreRol }}</div>
            </div>
          </div>

          <div class="fila-formulario">
            <div class="campo-completo">
              <div class="etiqueta-dato-perfil">Empresa / Organizacion</div>
              <div class="valor-dato-perfil">{{ usuario.empresa || 'Corporacion Empresarial S.A.' }}</div>
            </div>
          </div>

          <div class="fila-formulario">
            <div class="campo-completo">
              <div class="etiqueta-dato-perfil">Permisos Asignados al Rol</div>
              <div class="caja-permisos-perfil">
                {{ usuario.descripcionPermisos }}
              </div>
            </div>
          </div>

          <div v-if="mensajeGuardado" class="aviso-exito-perfil">
            {{ mensajeGuardado }}
          </div>
        </div>

        <form v-else @submit.prevent="guardarCambiosPerfil" class="columna-datos-perfil">
          <div class="fila-formulario">
            <div class="campo">
              <label>Nombre Completo *</label>
              <input
                type="text"
                v-model="form.nombre"
                required
                placeholder="Ej: Carlos Mendoza"
              />
            </div>
            <div class="campo">
              <label>Usuario de Acceso</label>
              <input
                type="text"
                :value="form.usuario"
                disabled
              />
            </div>
          </div>

          <div class="fila-formulario">
            <div class="campo">
              <label>Correo Corporativo</label>
              <input
                type="text"
                v-model="form.correo"
                placeholder="usuario@corporacion.com"
              />
            </div>
            <div class="campo">
              <label>Rol en la Organizacion</label>
              <select v-model="form.rol" @change="actualizarMetadatosRol">
                <option value="gerente">Gerente / Director Estrategico</option>
                <option value="analista">Analista de Riesgos y Estrategia</option>
                <option value="supervisor">Supervisor de Operaciones (Campo / Movil)</option>
                <option value="auditor">Auditor Interno / Certificador Externo</option>
              </select>
            </div>
          </div>

          <div class="fila-formulario">
            <div class="campo-completo">
              <label>Empresa / Organizacion</label>
              <input
                type="text"
                v-model="form.empresa"
                placeholder="Corporacion Empresarial S.A."
              />
            </div>
          </div>

          <div class="fila-formulario">
            <div class="campo-completo">
              <label>Permisos Asignados al Rol</label>
              <div class="caja-permisos-perfil">
                {{ form.descripcionPermisos }}
              </div>
            </div>
          </div>

          <div class="barra-reportes">
            <button type="submit" class="boton-accion">
              Guardar Cambios
            </button>
            <button type="button" @click="cancelarEdicion">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const MAPA_ROLES = {
  gerente: {
    nombreRol: 'Gerente / Director Estrategico',
    descripcionPermisos: 'Acceso total: aprobara decisiones en bitacora, configura gobernanza y administra todos los modulos.'
  },
  analista: {
    nombreRol: 'Analista de Riesgos y Estrategia',
    descripcionPermisos: 'Gestiona factores PESTEL, matriz de riesgos 5x5 y simulacion de decisiones (sin aprobacion final ni ajustes).'
  },
  supervisor: {
    nombreRol: 'Supervisor de Operaciones (Campo / Movil)',
    descripcionPermisos: 'Registra auditorias en Sedes y Proveedores y reporta factores PESTEL desde terreno.'
  },
  auditor: {
    nombreRol: 'Auditor Interno / Certificador Externo',
    descripcionPermisos: 'Modo solo lectura y exportacion de reportes CSV y PDF para auditorias de certificacion.'
  }
};

export default {
  name: 'ModuloPerfil',
  props: {
    usuario: {
      type: Object,
      required: true
    }
  },
  emits: ['actualizar-perfil'],
  data() {
    return {
      editando: false,
      mensajeGuardado: '',
      form: this.clonarUsuario(this.usuario)
    };
  },
  watch: {
    usuario: {
      deep: true,
      handler(u) {
        if (!u) return;
        this.form = this.clonarUsuario(u);
      }
    }
  },
  methods: {
    clonarUsuario(u) {
      return {
        id: u.id || u.usuario,
        usuario: u.usuario || '',
        clave: u.clave || '',
        correo: u.correo || '',
        nombre: u.nombre || '',
        rol: u.rol || 'analista',
        nombreRol: u.nombreRol || 'Analista de Riesgos y Estrategia',
        empresa: u.empresa || 'Corporacion Empresarial S.A.',
        descripcionPermisos: u.descripcionPermisos || '',
        fotoPerfil: u.fotoPerfil || ''
      };
    },
    iniciarEdicion() {
      this.form = this.clonarUsuario(this.usuario);
      this.mensajeGuardado = '';
      this.editando = true;
    },
    cancelarEdicion() {
      this.form = this.clonarUsuario(this.usuario);
      this.editando = false;
    },
    obtenerIniciales(nombre) {
      if (!nombre) return 'US';
      const partes = nombre.trim().split(' ');
      if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
      return (partes[0][0] + partes[1][0]).toUpperCase();
    },
    actualizarMetadatosRol() {
      const info = MAPA_ROLES[this.form.rol] || MAPA_ROLES.analista;
      this.form.nombreRol = info.nombreRol;
      this.form.descripcionPermisos = info.descripcionPermisos;
    },
    procesarArchivoFoto(evento) {
      const archivo = evento.target.files && evento.target.files[0];
      if (!archivo) return;

      const lector = new FileReader();
      lector.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const tamanoMax = 220;
          let ancho = img.width;
          let alto = img.height;

          if (ancho > alto) {
            if (ancho > tamanoMax) {
              alto = Math.round((alto * tamanoMax) / ancho);
              ancho = tamanoMax;
            }
          } else if (alto > tamanoMax) {
            ancho = Math.round((ancho * tamanoMax) / alto);
            alto = tamanoMax;
          }

          canvas.width = ancho;
          canvas.height = alto;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, ancho, alto);
          this.form.fotoPerfil = canvas.toDataURL('image/jpeg', 0.82);
        };
        img.src = e.target.result;
      };
      lector.readAsDataURL(archivo);
    },
    guardarCambiosPerfil() {
      this.actualizarMetadatosRol();
      this.$emit('actualizar-perfil', { ...this.form });
      this.editando = false;
      this.mensajeGuardado = 'Los datos de su perfil han sido actualizados.';
      setTimeout(() => {
        this.mensajeGuardado = '';
      }, 3000);
    }
  }
};
</script>
