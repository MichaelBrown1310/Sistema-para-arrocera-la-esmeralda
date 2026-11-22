<template>
  <div v-if="!usuarioActual" class="pantalla-login animar-entrada">
    <div class="tarjeta-login">
      <div class="cabecera-marca-login">
        <img src="/logo-rl.svg" alt="RL" class="imagen-logo-marca" />
        <div>
          <div class="nombre-app-login">RiskLens</div>
          <div class="etiqueta-empresa-login">{{ ajustes.nombreEmpresa || 'Corporacion Empresarial S.A.' }}</div>
        </div>
      </div>

      <div class="selector-modo-auth">
        <button
          type="button"
          :class="modoAuth === 'login' ? 'tab-auth-activa' : ''"
          @click="cambiarModoAuth('login')"
        >
          Iniciar Sesion
        </button>
        <button
          type="button"
          :class="modoAuth === 'registro' ? 'tab-auth-activa' : ''"
          @click="cambiarModoAuth('registro')"
        >
          Registrarse
        </button>
      </div>

      <form
        v-if="modoAuth === 'login'"
        @submit.prevent="iniciarSesionConUsuario"
        class="formulario-login"
      >
        <div>
          <h1>Bienvenido</h1>
          <p class="subtitulo-login">
            Ingrese sus credenciales para acceder a RiskLens
          </p>
        </div>

        <div class="grupo-campo-login">
          <label>Usuario</label>
          <input
            type="text"
            v-model="formLogin.usuario"
            required
            autocomplete="username"
            placeholder="Ej: gerente01"
          />
        </div>

        <div class="grupo-campo-login">
          <label>Contrasena</label>
          <input
            type="password"
            v-model="formLogin.clave"
            required
            autocomplete="current-password"
            placeholder="Ingrese su contrasena"
          />
        </div>

        <div v-if="mensajeAuth" class="alerta-candados">
          {{ mensajeAuth }}
        </div>

        <button type="submit" class="boton-accion boton-login" :disabled="autenticando">
          {{ autenticando ? 'Ingresando...' : 'Entrar a RiskLens' }}
        </button>

        <button
          v-if="eventoInstalacionPwa"
          type="button"
          class="boton-instalar-pwa"
          @click="instalarPwa"
        >
          Instalar RiskLens como Aplicacion
        </button>
      </form>

      <form
        v-else
        @submit.prevent="registrarNuevoUsuario"
        class="formulario-login"
      >
        <div>
          <h1>Crear Cuenta</h1>
          <p class="subtitulo-login">
            Registre su perfil y foto para ingresar a la organizacion
          </p>
        </div>

        <div class="selector-foto-registro">
          <div class="marco-foto-registro">
            <img
              v-if="formRegistro.fotoPerfil"
              :src="formRegistro.fotoPerfil"
              alt="Vista previa"
              class="imagen-foto-grande"
            />
            <div v-else class="iniciales-foto-registro">
              {{ obtenerIniciales(formRegistro.nombre || 'RL') }}
            </div>
          </div>
          <div class="acciones-foto-registro">
            <label class="boton-subir-foto">
              Subir Foto de Perfil
              <input
                type="file"
                accept="image/*"
                class="input-archivo-oculto"
                @change="procesarFotoRegistro"
              />
            </label>
            <span class="texto-secundario">Opcional (JPG o PNG)</span>
          </div>
        </div>

        <div class="grupo-campo-login">
          <label>Nombre Completo *</label>
          <input
            type="text"
            v-model="formRegistro.nombre"
            required
            placeholder="Ej: Sofia Ramirez"
          />
        </div>

        <div class="fila-doble-login">
          <div class="grupo-campo-login">
            <label>Usuario *</label>
            <input
              type="text"
              v-model="formRegistro.usuario"
              required
              placeholder="Ej: sofia01"
            />
          </div>

          <div class="grupo-campo-login">
            <label>Contrasena *</label>
            <input
              type="password"
              v-model="formRegistro.clave"
              required
              placeholder="Minimo 6 caracteres"
            />
          </div>
        </div>

        <div class="grupo-campo-login">
          <label>Rol en la Empresa *</label>
          <select v-model="formRegistro.rol" required>
            <option value="gerente">Gerente / Director Estrategico</option>
            <option value="analista">Analista de Riesgos y Estrategia</option>
            <option value="supervisor">Supervisor de Operaciones (Campo / Movil)</option>
            <option value="auditor">Auditor Interno / Certificador Externo</option>
          </select>
        </div>

        <div v-if="mensajeAuth" class="alerta-candados">
          {{ mensajeAuth }}
        </div>

        <button type="submit" class="boton-accion boton-login" :disabled="autenticando">
          {{ autenticando ? 'Creando cuenta...' : 'Completar Registro e Ingresar' }}
        </button>
      </form>
    </div>
  </div>

  <div v-else class="disposicion-app">
    <div class="barra-superior-movil no-imprimir">
      <div class="identidad-movil">
        <img src="/logo-rl.svg" alt="RL" class="imagen-logo-pequeno" />
        <div>
          <div class="titulo-movil">RiskLens</div>
          <div class="subtitulo-movil">{{ usuarioActual.usuario }} · {{ usuarioActual.nombreRol }}</div>
        </div>
      </div>
      <button class="boton-menu-movil" @click="menuMovilAbierto = !menuMovilAbierto">
        {{ menuMovilAbierto ? 'Cerrar' : 'Menu' }}
      </button>
    </div>

    <aside class="barra-lateral no-imprimir" :class="{ 'abierta-movil': menuMovilAbierto }">
      <div class="bloque-marca-lateral">
        <img src="/logo-rl.svg" alt="RL" class="imagen-logo-pequeno" />
        <div>
          <h3>RiskLens</h3>
          <div class="subtitulo-lateral">{{ ajustes.nombreEmpresa || 'Corporacion Empresarial S.A.' }}</div>
        </div>
      </div>

      <div class="caja-usuario-perfil">
        <div class="fila-usuario-cabecera">
          <img
            v-if="usuarioActual.fotoPerfil"
            :src="usuarioActual.fotoPerfil"
            alt="Perfil"
            class="avatar-usuario-img"
          />
          <div v-else class="avatar-usuario">
            {{ obtenerIniciales(usuarioActual.nombre) }}
          </div>
          <div>
            <div class="nombre-usuario">{{ usuarioActual.nombre }}</div>
            <div class="correo-usuario">@{{ usuarioActual.usuario }}</div>
          </div>
        </div>
        <div class="insignia-rol">{{ usuarioActual.nombreRol }}</div>
        <div class="botones-tarjeta-usuario">
          <button
            :class="vistaPrincipal === 'perfil' ? 'boton-accion' : ''"
            @click="cambiarVistaPrincipal('perfil')"
          >
            Mi Perfil
          </button>
          <button @click="cerrarSesionUsuario">
            Salir
          </button>
        </div>
      </div>

      <div class="seccion-menu-titulo">MODULO 1: MACROENTORNO</div>
      <ul>
        <li>
          <a
            href="#"
            :class="vistaPrincipal === 'pestel' ? 'enlace-activo' : ''"
            @click.prevent="cambiarVistaPrincipal('pestel')"
          >
            <span>PESTEL</span>
            <span class="contador-menu">{{ factores.length }}</span>
          </a>
        </li>
      </ul>

      <div class="seccion-menu-titulo">MODULO 2: TRIPLE IMPACTO</div>
      <ul>
        <li>
          <a
            href="#"
            :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'riesgos' ? 'enlace-activo' : ''"
            @click.prevent="irSubmoduloBrujula('riesgos')"
          >
            <span>Radar de Riesgos</span>
            <span class="contador-menu">{{ riesgos.length }}</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'fincas' ? 'enlace-activo' : ''"
            @click.prevent="irSubmoduloBrujula('fincas')"
          >
            <span>Sedes y Proveedores</span>
            <span class="contador-menu">{{ fincas.length }}</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'decisiones' ? 'enlace-activo' : ''"
            @click.prevent="irSubmoduloBrujula('decisiones')"
          >
            <span>Evaluador y Simulador</span>
            <span class="contador-menu">{{ decisiones.length }}</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'bitacora' ? 'enlace-activo' : ''"
            @click.prevent="irSubmoduloBrujula('bitacora')"
          >
            <span>Bitacora y Auditoria</span>
            <span class="contador-menu">{{ bitacora.length }}</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'alertas' ? 'enlace-activo' : ''"
            @click.prevent="irSubmoduloBrujula('alertas')"
          >
            <span>Alertas y Gobernanza</span>
            <span class="contador-menu" :class="alertasActivas.length > 0 ? 'alerta-activa-badge' : ''">
              {{ alertasActivas.length }}
            </span>
          </a>
        </li>
      </ul>

      <div class="barra-lateral-acciones">
        <button class="boton-accion" @click="instalarPwa">
          Descargar App (PWA)
        </button>
        <button @click="descargarCSV">Exportar CSV PESTEL</button>
        <button @click="imprimirReporte">Exportar Vista a PDF</button>
      </div>
    </aside>

    <main class="contenido-principal">
      <header class="encabezado animar-entrada">
        <div class="cabecera-seccion" style="margin-bottom: 0;">
          <div>
            <div class="migaja-pan">
              RiskLens · {{ ajustes.nombreEmpresa || 'Corporacion Empresarial S.A.' }} /
              {{ etiquetaSeccionActiva }}
            </div>
            <h1>
              {{ tituloSeccionActiva }}
            </h1>
          </div>
          <div class="grupo-botones no-imprimir">
            <button
              :class="vistaPrincipal === 'pestel' ? 'boton-accion' : ''"
              @click="cambiarVistaPrincipal('pestel')"
            >
              PESTEL ({{ factores.length }})
            </button>
            <button
              :class="vistaPrincipal === 'brujula' ? 'boton-accion' : ''"
              @click="cambiarVistaPrincipal('brujula')"
            >
              Triple Impacto
            </button>
            <button
              :class="vistaPrincipal === 'perfil' ? 'boton-accion' : ''"
              @click="cambiarVistaPrincipal('perfil')"
            >
              Mi Perfil
            </button>
          </div>
        </div>
      </header>

      <div v-if="vistaPrincipal === 'perfil'" class="animar-entrada">
        <ModuloPerfil
          :usuario="usuarioActual"
          @actualizar-perfil="guardarPerfilUsuarioFirebase"
        />
      </div>

      <div v-else-if="vistaPrincipal === 'pestel'" class="animar-entrada">
        <FormularioFactor v-if="puedeCrearPestel" @guardar="agregarFactor" />
        <div v-else class="panel aviso-solo-lectura no-imprimir">
          <strong>Modo Consulta ({{ usuarioActual.nombreRol }}):</strong> Puede explorar la matriz de priorizacion, analizar los graficos y exportar reportes en CSV o PDF.
        </div>

        <TablaFactores
          :factores="factores"
          :puedeEliminar="puedeEliminarPestel"
          @eliminar="eliminarFactor"
        />

        <div class="cuadricula-graficos-principales">
          <GraficoPestel :factores="factores" />
          <GraficoPastelGeneral :factores="factores" />
        </div>

        <GraficosPastelCategorias :factores="factores" />
      </div>

      <div v-else class="animar-entrada">
        <div class="barra-submodulos no-imprimir">
          <button
            :class="subvistaBrujula === 'riesgos' ? 'boton-accion' : ''"
            @click="subvistaBrujula = 'riesgos'"
          >
            Radar de Riesgos ({{ riesgos.length }})
          </button>
          <button
            :class="subvistaBrujula === 'fincas' ? 'boton-accion' : ''"
            @click="subvistaBrujula = 'fincas'"
          >
            Sedes y Proveedores ({{ fincas.length }})
          </button>
          <button
            :class="subvistaBrujula === 'decisiones' ? 'boton-accion' : ''"
            @click="subvistaBrujula = 'decisiones'"
          >
            Decisiones y Simulador ({{ decisiones.length }})
          </button>
          <button
            :class="subvistaBrujula === 'bitacora' ? 'boton-accion' : ''"
            @click="subvistaBrujula = 'bitacora'"
          >
            Bitacora y Auditoria ({{ bitacora.length }})
          </button>
          <button
            :class="subvistaBrujula === 'alertas' ? 'boton-accion' : ''"
            @click="subvistaBrujula = 'alertas'"
          >
            Alertas ({{ alertasActivas.length }}) y Gobernanza
          </button>
        </div>

        <ModuloRiesgos
          v-if="subvistaBrujula === 'riesgos'"
          :riesgos="riesgos"
          :ajustes="ajustes"
          :puedeEditar="puedeEditarRiesgos"
          @guardar-riesgo="guardarRiesgoFirebase"
          @eliminar-riesgo="eliminarRiesgoFirebase"
        />

        <ModuloFincas
          v-if="subvistaBrujula === 'fincas'"
          :fincas="fincas"
          :ajustes="ajustes"
          :puedeEditar="puedeEditarFincas"
          @guardar-finca="guardarFincaFirebase"
          @eliminar-finca="eliminarFincaFirebase"
        />

        <ModuloDecisiones
          v-if="subvistaBrujula === 'decisiones'"
          :decisiones="decisiones"
          :ajustes="ajustes"
          :puedeEditar="puedeEditarDecisiones"
          :puedeAprobar="puedeAprobarDecisiones"
          @guardar-decision="guardarDecisionFirebase"
          @eliminar-decision="eliminarDecisionFirebase"
          @aprobar-decision="aprobarDecisionFirebase"
        />

        <ModuloBitacora
          v-if="subvistaBrujula === 'bitacora'"
          :bitacora="bitacora"
          :fincas="fincas"
          :riesgos="riesgos"
          :ajustes="ajustes"
          :puedeEditar="puedeEditarBitacora"
          @guardar-bitacora="guardarBitacoraFirebase"
          @eliminar-bitacora="eliminarBitacoraFirebase"
        />

        <ModuloAlertasAjustes
          v-if="subvistaBrujula === 'alertas'"
          :alertas="alertasActivas"
          :ajustes="ajustes"
          :puedeEditarAjustes="puedeEditarAjustes"
          @guardar-ajustes="guardarAjustesFirebase"
          @restablecer-datos="restablecerDatosEjemploFirebase"
          @ir-submodulo="irSubmoduloBrujula"
        />
      </div>
    </main>

    <nav class="barra-inferior-movil no-imprimir">
      <button
        :class="vistaPrincipal === 'pestel' ? 'activo-movil' : ''"
        @click="cambiarVistaPrincipal('pestel')"
      >
        PESTEL
      </button>
      <button
        :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'riesgos' ? 'activo-movil' : ''"
        @click="irSubmoduloBrujula('riesgos')"
      >
        Riesgos
      </button>
      <button
        :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'fincas' ? 'activo-movil' : ''"
        @click="irSubmoduloBrujula('fincas')"
      >
        Sedes
      </button>
      <button
        :class="vistaPrincipal === 'brujula' && subvistaBrujula === 'decisiones' ? 'activo-movil' : ''"
        @click="irSubmoduloBrujula('decisiones')"
      >
        Decisiones
      </button>
      <button
        :class="vistaPrincipal === 'perfil' ? 'activo-movil' : ''"
        @click="cambiarVistaPrincipal('perfil')"
      >
        Perfil
      </button>
    </nav>
  </div>
</template>

<script>
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc
} from './firebase';
import {
  FACTORES_INICIALES,
  RIESGOS_INICIALES,
  FINCAS_INICIALES,
  DECISIONES_INICIALES,
  AJUSTES_INICIALES,
  USUARIOS_INICIALES
} from './datosIniciales';
import { generarAlertas } from './logicaTripleImpacto';
import FormularioFactor from './components/FormularioFactor.vue';
import TablaFactores from './components/TablaFactores.vue';
import GraficoPestel from './components/GraficoPestel.vue';
import GraficoPastelGeneral from './components/GraficoPastelGeneral.vue';
import GraficosPastelCategorias from './components/GraficosPastelCategorias.vue';
import ModuloRiesgos from './components/ModuloRiesgos.vue';
import ModuloFincas from './components/ModuloFincas.vue';
import ModuloDecisiones from './components/ModuloDecisiones.vue';
import ModuloBitacora from './components/ModuloBitacora.vue';
import ModuloAlertasAjustes from './components/ModuloAlertasAjustes.vue';
import ModuloPerfil from './components/ModuloPerfil.vue';

const DETALLE_ROLES = {
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
  name: 'App',
  components: {
    FormularioFactor,
    TablaFactores,
    GraficoPestel,
    GraficoPastelGeneral,
    GraficosPastelCategorias,
    ModuloRiesgos,
    ModuloFincas,
    ModuloDecisiones,
    ModuloBitacora,
    ModuloAlertasAjustes,
    ModuloPerfil
  },
  data() {
    return {
      modoAuth: 'login',
      vistaPrincipal: 'pestel',
      subvistaBrujula: 'riesgos',
      menuMovilAbierto: false,
      usuarioActual: null,
      autenticando: false,
      mensajeAuth: '',
      eventoInstalacionPwa: null,
      formLogin: {
        usuario: '',
        clave: ''
      },
      formRegistro: {
        nombre: '',
        usuario: '',
        clave: '',
        rol: 'analista',
        fotoPerfil: ''
      },
      cargandoFirebase: true,
      usuariosRegistrados: [...USUARIOS_INICIALES],
      factores: [...FACTORES_INICIALES],
      riesgos: [...RIESGOS_INICIALES],
      fincas: [...FINCAS_INICIALES],
      decisiones: [...DECISIONES_INICIALES],
      bitacora: [],
      ajustes: JSON.parse(JSON.stringify(AJUSTES_INICIALES))
    };
  },
  computed: {
    etiquetaSeccionActiva() {
      if (this.vistaPrincipal === 'perfil') return 'Cuenta de Usuario';
      if (this.vistaPrincipal === 'pestel') return 'Analisis PESTEL';
      return 'Brujula de Triple Impacto';
    },
    tituloSeccionActiva() {
      if (this.vistaPrincipal === 'perfil') return 'Mi Perfil y Configuracion de Cuenta';
      if (this.vistaPrincipal === 'pestel') return 'Entorno Estrategico PESTEL';
      const titulos = {
        riesgos: 'Radar de Riesgos Corporativos',
        fincas: 'Monitoreo de Sedes y Proveedores',
        decisiones: 'Evaluador y Simulador de Decisiones',
        bitacora: 'Bitacora y Evidencia de Auditoria',
        alertas: 'Centro de Alertas y Gobernanza'
      };
      return titulos[this.subvistaBrujula] || 'Brujula de Triple Impacto';
    },
    rolActual() {
      return this.usuarioActual ? this.usuarioActual.rol : '';
    },
    puedeCrearPestel() {
      return ['gerente', 'analista', 'supervisor'].includes(this.rolActual);
    },
    puedeEliminarPestel() {
      return ['gerente', 'analista'].includes(this.rolActual);
    },
    puedeEditarRiesgos() {
      return ['gerente', 'analista'].includes(this.rolActual);
    },
    puedeEditarFincas() {
      return ['gerente', 'supervisor'].includes(this.rolActual);
    },
    puedeEditarDecisiones() {
      return ['gerente', 'analista'].includes(this.rolActual);
    },
    puedeAprobarDecisiones() {
      return this.rolActual === 'gerente';
    },
    puedeEditarBitacora() {
      return this.rolActual === 'gerente';
    },
    puedeEditarAjustes() {
      return this.rolActual === 'gerente';
    },
    alertasActivas() {
      const hoy = new Date().toISOString().slice(0, 10);
      return generarAlertas(
        {
          riesgos: this.riesgos,
          fincas: this.fincas,
          decisiones: this.decisiones,
          bitacora: this.bitacora,
          ajustes: this.ajustes
        },
        hoy
      );
    }
  },
  mounted() {
    if (window.eventoGlobalPwa) {
      this.eventoInstalacionPwa = window.eventoGlobalPwa;
    }
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window.eventoGlobalPwa = e;
      this.eventoInstalacionPwa = e;
    });
    window.addEventListener('appinstalled', () => {
      window.eventoGlobalPwa = null;
      this.eventoInstalacionPwa = null;
    });
    const sesionGuardada = localStorage.getItem('sesion_corporacion_activa');
    if (sesionGuardada) {
      try {
        this.usuarioActual = JSON.parse(sesionGuardada);
      } catch (e) {
        localStorage.removeItem('sesion_corporacion_activa');
      }
    }
    this.cargarTodoDesdeFirebase();
  },
  methods: {
    async instalarPwa() {
      const evento = this.eventoInstalacionPwa || window.eventoGlobalPwa;
      if (evento) {
        evento.prompt();
        const resultado = await evento.userChoice;
        if (resultado && resultado.outcome === 'accepted') {
          window.eventoGlobalPwa = null;
          this.eventoInstalacionPwa = null;
        }
        return;
      }
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        alert('RiskLens ya esta abierta como una aplicacion independiente.');
        return;
      }
      alert('Para abrir RiskLens como aplicacion independiente, haga clic en el icono de computadora con flecha situado a la derecha de la barra de direcciones del navegador y seleccione "Instalar".');
    },
    cambiarModoAuth(modo) {
      this.modoAuth = modo;
      this.mensajeAuth = '';
    },
    obtenerIniciales(nombre) {
      if (!nombre) return 'RL';
      const partes = nombre.trim().split(' ');
      if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
      return (partes[0][0] + partes[1][0]).toUpperCase();
    },
    procesarFotoRegistro(evento) {
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
          this.formRegistro.fotoPerfil = canvas.toDataURL('image/jpeg', 0.82);
        };
        img.src = e.target.result;
      };
      lector.readAsDataURL(archivo);
    },
    cambiarVistaPrincipal(vista) {
      this.vistaPrincipal = vista;
      this.menuMovilAbierto = false;
    },
    irSubmoduloBrujula(sub) {
      this.vistaPrincipal = 'brujula';
      this.subvistaBrujula = sub;
      this.menuMovilAbierto = false;
    },
    async iniciarSesionConUsuario() {
      this.mensajeAuth = '';
      this.autenticando = true;
      const usuarioLimpio = this.formLogin.usuario.trim().toLowerCase();
      const claveLimpia = this.formLogin.clave.trim();

      try {
        let perfil = null;
        const refUsuario = doc(db, 'usuarios', usuarioLimpio);
        const snapUsuario = await getDoc(refUsuario);

        if (snapUsuario.exists()) {
          const datos = snapUsuario.data();
          if (datos.clave === claveLimpia) {
            perfil = datos;
          }
        } else {
          const encontradoLocal = this.usuariosRegistrados.find(
            u => u.usuario === usuarioLimpio && u.clave === claveLimpia
          );
          if (encontradoLocal) {
            perfil = encontradoLocal;
          }
        }

        if (!perfil) {
          this.mensajeAuth = 'Usuario o contrasena incorrectos. Verifique sus credenciales de acceso.';
          return;
        }

        if (perfil.correo) {
          try {
            await signInWithEmailAndPassword(auth, perfil.correo, perfil.clave);
          } catch (e) {}
        }

        this.usuarioActual = perfil;
        localStorage.setItem('sesion_corporacion_activa', JSON.stringify(perfil));
        this.formLogin.usuario = '';
        this.formLogin.clave = '';

        if (perfil.rol === 'supervisor') {
          this.vistaPrincipal = 'brujula';
          this.subvistaBrujula = 'fincas';
        } else if (perfil.rol === 'auditor') {
          this.vistaPrincipal = 'brujula';
          this.subvistaBrujula = 'bitacora';
        } else {
          this.vistaPrincipal = 'pestel';
        }
      } catch (error) {
        this.mensajeAuth = 'No fue posible validar las credenciales en este momento.';
      } finally {
        this.autenticando = false;
      }
    },
    async registrarNuevoUsuario() {
      this.mensajeAuth = '';
      const usuarioLimpio = this.formRegistro.usuario.trim().toLowerCase().replace(/\s+/g, '');
      const claveLimpia = this.formRegistro.clave.trim();
      const nombreLimpio = this.formRegistro.nombre.trim();

      if (!usuarioLimpio || !claveLimpia || !nombreLimpio) {
        this.mensajeAuth = 'Complete todos los campos obligatorios.';
        return;
      }

      if (claveLimpia.length < 6) {
        this.mensajeAuth = 'La contrasena debe tener al menos 6 caracteres.';
        return;
      }

      this.autenticando = true;
      try {
        const refExistente = doc(db, 'usuarios', usuarioLimpio);
        const snapExistente = await getDoc(refExistente);
        if (snapExistente.exists()) {
          this.mensajeAuth = 'Ese nombre de usuario ya esta registrado. Elija otro.';
          return;
        }

        const metaRol = DETALLE_ROLES[this.formRegistro.rol] || DETALLE_ROLES.analista;
        const nuevoPerfil = {
          id: usuarioLimpio,
          usuario: usuarioLimpio,
          clave: claveLimpia,
          correo: usuarioLimpio + '@corporacion.com',
          nombre: nombreLimpio,
          rol: this.formRegistro.rol,
          nombreRol: metaRol.nombreRol,
          empresa: this.ajustes.nombreEmpresa || 'Corporacion Empresarial S.A.',
          descripcionPermisos: metaRol.descripcionPermisos,
          fotoPerfil: this.formRegistro.fotoPerfil || ''
        };

        await setDoc(doc(db, 'usuarios', usuarioLimpio), nuevoPerfil);
        this.usuariosRegistrados.push(nuevoPerfil);

        try {
          await createUserWithEmailAndPassword(auth, nuevoPerfil.correo, nuevoPerfil.clave);
        } catch (e) {}

        this.usuarioActual = nuevoPerfil;
        localStorage.setItem('sesion_corporacion_activa', JSON.stringify(nuevoPerfil));
        this.formRegistro = {
          nombre: '',
          usuario: '',
          clave: '',
          rol: 'analista',
          fotoPerfil: ''
        };
        this.vistaPrincipal = 'pestel';
      } catch (error) {
        this.mensajeAuth = 'No se pudo completar el registro en este momento.';
      } finally {
        this.autenticando = false;
      }
    },
    async guardarPerfilUsuarioFirebase(perfilActualizado) {
      const idStr = String(perfilActualizado.id || perfilActualizado.usuario);
      this.usuarioActual = { ...perfilActualizado };
      localStorage.setItem('sesion_corporacion_activa', JSON.stringify(this.usuarioActual));

      const idx = this.usuariosRegistrados.findIndex(u => String(u.id) === idStr);
      if (idx >= 0) {
        this.usuariosRegistrados.splice(idx, 1, perfilActualizado);
      } else {
        this.usuariosRegistrados.push(perfilActualizado);
      }

      try {
        await setDoc(doc(db, 'usuarios', idStr), perfilActualizado);
      } catch (error) {
        console.error('Error al actualizar perfil:', error);
      }
    },
    async cerrarSesionUsuario() {
      this.usuarioActual = null;
      localStorage.removeItem('sesion_corporacion_activa');
      try {
        await signOut(auth);
      } catch (error) {}
    },
    async cargarColeccion(nombreColeccion, datosSemilla) {
      const snap = await getDocs(collection(db, nombreColeccion));
      if (snap.empty && datosSemilla && datosSemilla.length > 0) {
        for (let i = 0; i < datosSemilla.length; i++) {
          const item = datosSemilla[i];
          await setDoc(doc(db, nombreColeccion, String(item.id)), item);
        }
        return JSON.parse(JSON.stringify(datosSemilla));
      }
      const lista = [];
      snap.forEach(d => {
        lista.push(d.data());
      });
      return lista;
    },
    async cargarTodoDesdeFirebase() {
      this.cargandoFirebase = true;
      try {
        this.usuariosRegistrados = await this.cargarColeccion('usuarios', USUARIOS_INICIALES);
        this.factores = await this.cargarColeccion('factores', FACTORES_INICIALES);
        this.riesgos = await this.cargarColeccion('riesgos', RIESGOS_INICIALES);
        this.fincas = await this.cargarColeccion('fincas', FINCAS_INICIALES);
        this.decisiones = await this.cargarColeccion('decisiones', DECISIONES_INICIALES);
        this.bitacora = await this.cargarColeccion('bitacora', []);

        const refAjustes = doc(db, 'ajustes', 'config');
        const snapAjustes = await getDoc(refAjustes);
        if (snapAjustes.exists()) {
          this.ajustes = {
            ...JSON.parse(JSON.stringify(AJUSTES_INICIALES)),
            ...snapAjustes.data()
          };
        } else {
          await setDoc(refAjustes, AJUSTES_INICIALES);
          this.ajustes = JSON.parse(JSON.stringify(AJUSTES_INICIALES));
        }

        if (this.usuarioActual && this.usuarioActual.usuario) {
          const actualizado = this.usuariosRegistrados.find(
            u => u.usuario === this.usuarioActual.usuario
          );
          if (actualizado) {
            this.usuarioActual = actualizado;
            localStorage.setItem('sesion_corporacion_activa', JSON.stringify(actualizado));
          }
        }
      } catch (error) {
        console.error('Error al sincronizar datos:', error);
      } finally {
        this.cargandoFirebase = false;
      }
    },
    async agregarFactor(nuevo) {
      const factorGuardado = {
        id: String(Date.now()),
        ...nuevo
      };
      this.factores.push(factorGuardado);
      try {
        await setDoc(doc(db, 'factores', factorGuardado.id), factorGuardado);
      } catch (error) {
        console.error('Error al guardar factor:', error);
      }
    },
    async eliminarFactor(id) {
      const idStr = String(id);
      this.factores = this.factores.filter(f => String(f.id) !== idStr);
      try {
        await deleteDoc(doc(db, 'factores', idStr));
      } catch (error) {
        console.error('Error al eliminar factor:', error);
      }
    },
    async guardarRiesgoFirebase(riesgo) {
      const idStr = String(riesgo.id);
      const idx = this.riesgos.findIndex(r => String(r.id) === idStr);
      if (idx >= 0) {
        this.riesgos.splice(idx, 1, riesgo);
      } else {
        this.riesgos.push(riesgo);
      }
      try {
        await setDoc(doc(db, 'riesgos', idStr), riesgo);
      } catch (error) {
        console.error('Error al guardar riesgo:', error);
      }
    },
    async eliminarRiesgoFirebase(id) {
      const idStr = String(id);
      this.riesgos = this.riesgos.filter(r => String(r.id) !== idStr);
      try {
        await deleteDoc(doc(db, 'riesgos', idStr));
      } catch (error) {
        console.error('Error al eliminar riesgo:', error);
      }
    },
    async guardarFincaFirebase(finca) {
      const idStr = String(finca.id);
      const idx = this.fincas.findIndex(f => String(f.id) === idStr);
      if (idx >= 0) {
        this.fincas.splice(idx, 1, finca);
      } else {
        this.fincas.push(finca);
      }
      try {
        await setDoc(doc(db, 'fincas', idStr), finca);
      } catch (error) {
        console.error('Error al guardar sede:', error);
      }
    },
    async eliminarFincaFirebase(id) {
      const idStr = String(id);
      this.fincas = this.fincas.filter(f => String(f.id) !== idStr);
      try {
        await deleteDoc(doc(db, 'fincas', idStr));
      } catch (error) {
        console.error('Error al eliminar sede:', error);
      }
    },
    async guardarDecisionFirebase(decision) {
      const idStr = String(decision.id);
      const idx = this.decisiones.findIndex(d => String(d.id) === idStr);
      if (idx >= 0) {
        this.decisiones.splice(idx, 1, decision);
      } else {
        this.decisiones.push(decision);
      }
      try {
        await setDoc(doc(db, 'decisiones', idStr), decision);
      } catch (error) {
        console.error('Error al guardar decision:', error);
      }
    },
    async eliminarDecisionFirebase(id) {
      const idStr = String(id);
      this.decisiones = this.decisiones.filter(d => String(d.id) !== idStr);
      try {
        await deleteDoc(doc(db, 'decisiones', idStr));
      } catch (error) {
        console.error('Error al eliminar decision:', error);
      }
    },
    async aprobarDecisionFirebase({ decision, registro }) {
      if (this.usuarioActual && this.usuarioActual.usuario) {
        registro.aprobadoPor = registro.aprobadoPor + ' (' + this.usuarioActual.usuario + ')';
      }
      await this.guardarDecisionFirebase(decision);
      await this.guardarBitacoraFirebase(registro);
      this.subvistaBrujula = 'bitacora';
    },
    async guardarBitacoraFirebase(registro) {
      const idStr = String(registro.id);
      const idx = this.bitacora.findIndex(b => String(b.id) === idStr);
      if (idx >= 0) {
        this.bitacora.splice(idx, 1, registro);
      } else {
        this.bitacora.unshift(registro);
      }
      try {
        await setDoc(doc(db, 'bitacora', idStr), registro);
      } catch (error) {
        console.error('Error al guardar en bitacora:', error);
      }
    },
    async eliminarBitacoraFirebase(id) {
      const idStr = String(id);
      this.bitacora = this.bitacora.filter(b => String(b.id) !== idStr);
      try {
        await deleteDoc(doc(db, 'bitacora', idStr));
      } catch (error) {
        console.error('Error al eliminar de bitacora:', error);
      }
    },
    async guardarAjustesFirebase(nuevosAjustes) {
      this.ajustes = nuevosAjustes;
      try {
        await setDoc(doc(db, 'ajustes', 'config'), nuevosAjustes);
        alert('Ajustes guardados correctamente.');
      } catch (error) {
        console.error('Error al guardar ajustes:', error);
      }
    },
    async restablecerDatosEjemploFirebase() {
      this.cargandoFirebase = true;
      try {
        for (let i = 0; i < USUARIOS_INICIALES.length; i++) {
          const u = USUARIOS_INICIALES[i];
          await setDoc(doc(db, 'usuarios', String(u.id)), u);
        }
        for (let i = 0; i < FACTORES_INICIALES.length; i++) {
          const item = FACTORES_INICIALES[i];
          await setDoc(doc(db, 'factores', String(item.id)), item);
        }
        for (let i = 0; i < RIESGOS_INICIALES.length; i++) {
          const item = RIESGOS_INICIALES[i];
          await setDoc(doc(db, 'riesgos', String(item.id)), item);
        }
        for (let i = 0; i < FINCAS_INICIALES.length; i++) {
          const item = FINCAS_INICIALES[i];
          await setDoc(doc(db, 'fincas', String(item.id)), item);
        }
        for (let i = 0; i < DECISIONES_INICIALES.length; i++) {
          const item = DECISIONES_INICIALES[i];
          await setDoc(doc(db, 'decisiones', String(item.id)), item);
        }
        await setDoc(doc(db, 'ajustes', 'config'), AJUSTES_INICIALES);
        await this.cargarTodoDesdeFirebase();
      } catch (error) {
        console.error('Error al restablecer datos:', error);
      } finally {
        this.cargandoFirebase = false;
      }
    },
    descargarCSV() {
      if (this.factores.length === 0) {
        alert('No hay factores para exportar.');
        return;
      }

      let contenido = 'Categoria,Descripcion,Tipo,Impacto,Plazo,Prioridad\n';

      for (let i = 0; i < this.factores.length; i++) {
        const f = this.factores[i];
        let prioridad = 'Baja';
        if (f.impacto === 'Alto' && f.plazo === 'Corto plazo') {
          prioridad = 'Critica (Urgente)';
        } else if (f.impacto === 'Alto' || f.plazo === 'Corto plazo') {
          prioridad = 'Media';
        }

        const fila = `"${f.categoria}","${f.descripcion}","${f.tipo}","${f.impacto}","${f.plazo}","${prioridad}"\n`;
        contenido += fila;
      }

      const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.setAttribute('download', 'reporte_pestel_empresarial.csv');
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
    },
    imprimirReporte() {
      window.print();
    }
  }
};
</script>
