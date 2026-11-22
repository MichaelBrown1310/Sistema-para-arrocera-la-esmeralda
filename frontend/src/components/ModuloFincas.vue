<template>
  <div class="animar-entrada">
    <div class="panel">
      <div class="cabecera-seccion">
        <h2>Monitoreo de Sedes Operativas y Proveedores</h2>
        <div class="grupo-botones">
          <button
            :class="vista === 'lista' ? 'boton-accion' : ''"
            @click="vista = 'lista'"
          >
            Vista de Lista
          </button>
          <button
            :class="vista === 'mapa' ? 'boton-accion' : ''"
            @click="activarVistaMapa"
          >
            Vista de Mapa Geografico
          </button>
          <button v-if="puedeEditar" @click="abrirNuevaFinca">Registrar Inspeccion de Sede</button>
        </div>
      </div>

      <div class="resumen-cajas">
        <div class="caja-resumen">
          <div>Sedes / Proveedores (Escala {{ resumen.areaHa }})</div>
          <div class="numero">{{ resumen.total }}</div>
        </div>
        <div class="caja-resumen" :class="resumen.aguaPromedio > ajustes.metaAguaM3Ha ? 'criticos' : ''">
          <div>Consumo Promedio (Meta {{ ajustes.metaAguaM3Ha }})</div>
          <div class="numero">{{ resumen.aguaPromedio }} m3</div>
        </div>
        <div class="caja-resumen criticos">
          <div>Unidades con Alerta</div>
          <div class="numero">{{ resumen.enAlerta }}</div>
        </div>
        <div class="caja-resumen">
          <div>Riesgo de Discontinuidad</div>
          <div class="numero">{{ resumen.riesgoAbandono }}</div>
        </div>
      </div>

      <div class="resumen-cajas">
        <div class="caja-resumen">
          <div>Produccion / Volumen Esperado</div>
          <div class="numero">{{ resumen.produccionEsperadaT }} t</div>
        </div>
        <div class="caja-resumen">
          <div>Eficiencia Ambiental Promedio</div>
          <div class="numero">{{ resumen.controlBiologicoPct }}%</div>
        </div>
        <div class="caja-resumen">
          <div>Indicadores Entorno / Bio</div>
          <div class="numero">{{ resumen.avesTotal }}</div>
        </div>
        <div class="caja-resumen">
          <div>Tecnologia Limpia / Sello Verde</div>
          <div class="numero">{{ resumen.conLaser }} / {{ resumen.conOrganico }}</div>
        </div>
      </div>

      <div class="fila-formulario no-imprimir">
        <div class="campo">
          <input
            type="text"
            v-model="busqueda"
            placeholder="Buscar por sede, proveedor, codigo, ciudad o region..."
          />
        </div>
        <div class="grupo-botones">
          <button :class="filtro === 'todas' ? 'boton-accion' : ''" @click="filtro = 'todas'">
            Todas ({{ fincasFiltradasTexto.length }})
          </button>
          <button :class="filtro === 'alerta' ? 'boton-accion' : ''" @click="filtro = 'alerta'">
            Solo con Alerta
          </button>
        </div>
      </div>
    </div>

    <div v-show="vista === 'mapa'" class="panel animar-entrada">
      <div class="cabecera-seccion">
        <h2>Mapa Geografico de Sedes y Proveedores</h2>
        <div class="grupo-botones">
          <button :class="zonaMapa === 'todas' ? 'boton-accion' : ''" @click="cambiarZonaMapa('todas')">
            Todas las Regiones
          </button>
          <button :class="zonaMapa === 'centro-sur' ? 'boton-accion' : ''" @click="cambiarZonaMapa('centro-sur')">
            Zona Centro, Sur y Occidente
          </button>
          <button :class="zonaMapa === 'norte' ? 'boton-accion' : ''" @click="cambiarZonaMapa('norte')">
            Zona Norte
          </button>
        </div>
      </div>

      <div ref="contenedorMapa" class="contenedor-mapa-leaflet"></div>

      <div class="leyenda-mapa">
        <span><span class="punto-leyenda" style="background-color: #2e9d5b;"></span> Verde: Sin alertas</span>
        <span><span class="punto-leyenda" style="background-color: #e0a200;"></span> Amarillo: Atencion (Consumo, Falla o Duda)</span>
        <span><span class="punto-leyenda" style="background-color: #c8372d;"></span> Rojo: Grave (Incumple sello o Suspension)</span>
        <span>Tamano = escala operativa. Haga clic en cualquier marcador para ver el detalle.</span>
      </div>
    </div>

    <div v-if="mostrandoFormulario" class="panel no-imprimir animar-entrada">
      <h2>{{ editandoId ? 'Editar Ficha de Sede o Proveedor' : 'Registrar Nueva Inspeccion de Sede o Proveedor' }}</h2>
      <form @submit.prevent="guardarFormulario">
        <div class="fila-formulario">
          <div class="campo">
            <label>Nombre de la Sede o Proveedor *</label>
            <input type="text" v-model="form.nombre" required placeholder="Ej: Planta Operativa Central" />
          </div>
          <div class="campo">
            <label>Codigo de Proveedor / Unidad *</label>
            <input type="text" v-model="form.codigoAgricultor" required placeholder="Ej: PRV-014" />
          </div>
          <div class="campo">
            <label>Region Operativa *</label>
            <select v-model="form.zona" required>
              <option value="Zona Centro">Zona Centro</option>
              <option value="Zona Norte">Zona Norte</option>
              <option value="Zona Sur">Zona Sur</option>
              <option value="Zona Occidente">Zona Occidente</option>
            </select>
          </div>
          <div class="campo">
            <label>Ciudad / Municipio *</label>
            <input type="text" v-model="form.municipio" required placeholder="Ej: Bogota D.C." />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Capacidad / Escala Operativa</label>
            <input type="number" step="0.1" v-model.number="form.areaHa" />
          </div>
          <div class="campo">
            <label>Consumo de Agua / Recurso (m3)</label>
            <input type="number" v-model.number="form.aguaM3Ha" />
          </div>
          <div class="campo">
            <label>Produccion Esperada (toneladas / lotes)</label>
            <input type="number" step="0.1" v-model.number="form.produccionEsperadaT" />
          </div>
          <div class="campo">
            <label>Eficiencia Ambiental / Circular (%)</label>
            <input type="number" min="0" max="100" v-model.number="form.controlBiologicoPct" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Fecha Inicio de Ciclo</label>
            <input type="date" v-model="form.fechaSiembra" />
          </div>
          <div class="campo">
            <label>Fecha de Entrega Esperada</label>
            <input type="date" v-model="form.fechaCosechaEsperada" />
          </div>
          <div class="campo">
            <label>Fecha de Ultima Auditoria</label>
            <input type="date" v-model="form.ultimaVisita" />
          </div>
          <div class="campo">
            <label>Indicadores Positivos de Entorno</label>
            <input type="number" min="0" v-model.number="form.avesObservadas" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Continuidad Operativa Proximo Periodo</label>
            <select v-model="form.intencionSiembra">
              <option value="si">Continuidad confirmada</option>
              <option value="duda">En evaluacion / Incertidumbre</option>
              <option value="no">Riesgo de suspension</option>
            </select>
          </div>
          <div class="campo">
            <label>Certificaciones y Estado Tecnico</label>
            <div class="opciones-en-linea">
              <label><input type="checkbox" v-model="form.nivelacionLaser" /> Tecnologia de eficiencia</label>
              <label><input type="checkbox" v-model="form.loteOrganico" /> Linea con sello sostenible</label>
              <label v-if="form.loteOrganico">
                <input type="checkbox" v-model="form.insumoNoPermitido" /> Uso de insumo restringido
              </label>
              <label><input type="checkbox" v-model="form.problemasRiego" /> Falla tecnica operativa</label>
            </div>
          </div>
        </div>

        <div v-if="form.problemasRiego" class="fila-formulario">
          <div class="campo-completo">
            <label>Detalle de la Falla Tecnica u Operativa</label>
            <input type="text" v-model="form.detalleRiego" placeholder="Describa la contingencia tecnica detectada" />
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo">
            <label>Latitud GPS</label>
            <input type="number" step="0.0001" v-model.number="form.latitud" placeholder="Ej: 4.65" />
          </div>
          <div class="campo">
            <label>Longitud GPS</label>
            <input type="number" step="0.0001" v-model.number="form.longitud" placeholder="Ej: -74.08" />
          </div>
          <div class="campo" style="justify-content: flex-end;">
            <button type="button" @click="tomarUbicacionActual">Obtener Ubicacion GPS del Dispositivo</button>
          </div>
        </div>

        <div class="fila-formulario">
          <div class="campo-completo">
            <label>Notas de la Auditoria</label>
            <input type="text" v-model="form.notas" placeholder="Observaciones del auditor o supervisor" />
          </div>
        </div>

        <div class="barra-reportes">
          <button type="submit" class="boton-accion">Guardar Registro</button>
          <button type="button" @click="mostrandoFormulario = false">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="panel">
      <h2>Listado de Sedes, Plantas y Proveedores</h2>
      <div class="contenedor-tabla-responsive">
        <table>
          <thead>
            <tr>
              <th>Sede / Proveedor</th>
              <th>Region y Ciudad</th>
              <th>Capacidad y Volumen</th>
              <th>Consumo Recurso</th>
              <th>Desempeno Ambiental</th>
              <th>Continuidad</th>
              <th>Estado Alerta</th>
              <th v-if="puedeEditar" class="no-imprimir">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in fincasVisibles" :key="f.id">
              <td>
                <strong>{{ f.nombre }}</strong>
                <div class="texto-secundario">{{ f.codigoAgricultor }} | Auditoria: {{ f.ultimaVisita }}</div>
              </td>
              <td>{{ f.municipio }} ({{ f.zona }})</td>
              <td>Escala {{ f.areaHa }} | {{ f.produccionEsperadaT }} t</td>
              <td :class="f.aguaM3Ha > ajustes.metaAguaM3Ha ? 'semaforo-alto' : ''">
                {{ f.aguaM3Ha }} m3
              </td>
              <td>
                Eficiencia: {{ f.controlBiologicoPct }}% | Bio: {{ f.avesObservadas }}
                <div class="texto-secundario">
                  {{ f.nivelacionLaser ? 'Tec. Limpia' : 'Estandar' }} |
                  {{ f.loteOrganico ? 'Certificado' : 'Convencional' }}
                </div>
              </td>
              <td>
                <span v-if="f.intencionSiembra === 'si'">Confirmada</span>
                <span v-else-if="f.intencionSiembra === 'duda'" class="tipo-amenaza">En duda</span>
                <span v-else class="tipo-amenaza">En riesgo</span>
              </td>
              <td :class="claseAlertaFinca(f)">
                {{ textoAlertaFinca(f) }}
              </td>
              <td v-if="puedeEditar" class="no-imprimir">
                <div class="grupo-botones">
                  <button @click="editarFinca(f)">Editar</button>
                  <button class="boton-eliminar" @click="$emit('eliminar-finca', f.id)">Eliminar</button>
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
import { markRaw, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { alertasFinca, colorFinca, resumenFincas, tieneAlerta } from '../logicaTripleImpacto';

const COLORES_MAPA = {
  rojo: '#c8372d',
  amarillo: '#e0a200',
  verde: '#2e9d5b'
};

export default {
  name: 'ModuloFincas',
  props: {
    fincas: { type: Array, required: true },
    ajustes: { type: Object, required: true },
    puedeEditar: { type: Boolean, default: true }
  },
  emits: ['guardar-finca', 'eliminar-finca'],
  data() {
    return {
      vista: 'lista',
      filtro: 'todas',
      zonaMapa: 'todas',
      busqueda: '',
      mostrandoFormulario: false,
      editandoId: null,
      form: this.fincaPorDefecto()
    };
  },
  created() {
    this.instanciaMapa = null;
    this.capaMarcadores = null;
  },
  mounted() {
    this.inicializarMapaLeaflet();
  },
  beforeUnmount() {
    if (this.instanciaMapa) {
      this.instanciaMapa.remove();
      this.instanciaMapa = null;
    }
  },
  watch: {
    fincas: {
      deep: true,
      handler() {
        this.renderizarMarcadoresMapa(false);
      }
    },
    busqueda() {
      this.renderizarMarcadoresMapa(false);
    },
    filtro() {
      this.renderizarMarcadoresMapa(false);
    },
    'ajustes.metaAguaM3Ha'() {
      this.renderizarMarcadoresMapa(false);
    }
  },
  computed: {
    resumen() {
      return resumenFincas(this.fincas, this.ajustes.metaAguaM3Ha);
    },
    fincasFiltradasTexto() {
      const q = this.busqueda.trim().toLowerCase();
      if (!q) return this.fincas;
      return this.fincas.filter(f =>
        (f.nombre + ' ' + f.codigoAgricultor + ' ' + f.municipio + ' ' + f.zona)
          .toLowerCase()
          .includes(q)
      );
    },
    fincasVisibles() {
      return this.fincasFiltradasTexto.filter(
        f => this.filtro === 'todas' || tieneAlerta(f, this.ajustes.metaAguaM3Ha)
      );
    },
    fincasParaMapa() {
      const conCoord = this.fincasVisibles.filter(
        f => f.latitud !== null && f.longitud !== null && f.latitud !== '' && f.longitud !== ''
      );
      return conCoord.filter(f => {
        if (this.zonaMapa === 'todas') return true;
        if (this.zonaMapa === 'norte') return f.zona === 'Zona Norte';
        return f.zona !== 'Zona Norte';
      });
    }
  },
  methods: {
    inicializarMapaLeaflet() {
      if (this.instanciaMapa || !this.$refs.contenedorMapa) return;

      const mapa = L.map(this.$refs.contenedorMapa, {
        center: [4.6, -74.5],
        zoom: 6,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapa);

      const grupo = L.layerGroup().addTo(mapa);

      this.instanciaMapa = markRaw(mapa);
      this.capaMarcadores = markRaw(grupo);
      this.renderizarMarcadoresMapa(true);
    },
    activarVistaMapa() {
      this.vista = 'mapa';
      nextTick(() => {
        if (!this.instanciaMapa) {
          this.inicializarMapaLeaflet();
        }
        setTimeout(() => {
          if (this.instanciaMapa) {
            this.instanciaMapa.invalidateSize();
            this.renderizarMarcadoresMapa(true);
          }
        }, 120);
      });
    },
    cambiarZonaMapa(nuevaZona) {
      this.zonaMapa = nuevaZona;
      this.renderizarMarcadoresMapa(true);
    },
    renderizarMarcadoresMapa(ajustarEncuadre) {
      if (!this.instanciaMapa || !this.capaMarcadores) return;

      this.capaMarcadores.clearLayers();
      const lista = this.fincasParaMapa;
      const coordenadas = [];

      for (let i = 0; i < lista.length; i++) {
        const f = lista[i];
        const lat = Number(f.latitud);
        const lng = Number(f.longitud);
        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

        coordenadas.push([lat, lng]);
        const claveColor = colorFinca(f, this.ajustes.metaAguaM3Ha);
        const colorHex = COLORES_MAPA[claveColor] || COLORES_MAPA.verde;
        const radio = Math.max(8, Math.min(18, 6 + Math.sqrt(Number(f.areaHa || 1)) * 1.6));
        const textoEstado = this.textoAlertaFinca(f);

        const marcador = L.circleMarker([lat, lng], {
          radius: radio,
          color: '#ffffff',
          weight: 2,
          fillColor: colorHex,
          fillOpacity: 0.9
        });

        const contenedorPopup = document.createElement('div');
        contenedorPopup.style.fontSize = '12.5px';
        contenedorPopup.style.lineHeight = '1.45';

        const titulo = document.createElement('strong');
        titulo.textContent = f.nombre;
        contenedorPopup.appendChild(titulo);
        contenedorPopup.appendChild(document.createElement('br'));

        const info = document.createElement('span');
        info.textContent = `${f.codigoAgricultor} · ${f.municipio} (${f.zona}) · Escala ${f.areaHa}`;
        contenedorPopup.appendChild(info);
        contenedorPopup.appendChild(document.createElement('br'));

        const estado = document.createElement('span');
        estado.textContent = `Estado: ${textoEstado}`;
        contenedorPopup.appendChild(estado);

        if (this.puedeEditar) {
          contenedorPopup.appendChild(document.createElement('br'));
          const boton = document.createElement('button');
          boton.className = 'boton-popup-mapa';
          boton.textContent = 'Abrir ficha tecnica';
          boton.addEventListener('click', () => {
            this.editarFinca(f);
          });
          contenedorPopup.appendChild(boton);
        }

        marcador.bindPopup(contenedorPopup);
        marcador.addTo(this.capaMarcadores);
      }

      if (ajustarEncuadre && coordenadas.length > 0) {
        this.instanciaMapa.fitBounds(coordenadas, { padding: [40, 40], maxZoom: 11 });
      }
    },
    fincaPorDefecto() {
      const hoy = new Date().toISOString().slice(0, 10);
      return {
        id: 'f-' + Date.now(),
        nombre: '',
        codigoAgricultor: '',
        zona: 'Zona Centro',
        municipio: '',
        areaHa: 10,
        fechaSiembra: hoy,
        fechaCosechaEsperada: '',
        produccionEsperadaT: 60,
        aguaM3Ha: 6500,
        problemasRiego: false,
        detalleRiego: '',
        controlBiologicoPct: 50,
        nivelacionLaser: false,
        loteOrganico: false,
        insumoNoPermitido: false,
        avesObservadas: 10,
        intencionSiembra: 'si',
        ultimaVisita: hoy,
        notas: '',
        latitud: 4.65,
        longitud: -74.08
      };
    },
    claseAlertaFinca(f) {
      const c = colorFinca(f, this.ajustes.metaAguaM3Ha);
      if (c === 'rojo') return 'semaforo-alto';
      if (c === 'amarillo') return 'semaforo-medio';
      return 'semaforo-bajo';
    },
    textoAlertaFinca(f) {
      const a = alertasFinca(f, this.ajustes.metaAguaM3Ha);
      const lista = [];
      if (a.organico) lista.push('Incumple sello');
      if (a.abandono) lista.push(f.intencionSiembra === 'no' ? 'Suspension' : 'En duda');
      if (a.agua) lista.push('Sobre meta recurso');
      if (a.riego) lista.push('Falla tecnica');
      return lista.length > 0 ? lista.join(' · ') : 'Sin alertas';
    },
    abrirNuevaFinca() {
      this.editandoId = null;
      this.form = this.fincaPorDefecto();
      this.mostrandoFormulario = true;
    },
    editarFinca(f) {
      this.editandoId = f.id;
      this.form = { ...this.fincaPorDefecto(), ...f };
      this.mostrandoFormulario = true;
    },
    tomarUbicacionActual() {
      if (!navigator.geolocation) {
        alert('Este navegador no soporta geolocalizacion.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.form.latitud = Math.round(pos.coords.latitude * 100000) / 100000;
          this.form.longitud = Math.round(pos.coords.longitude * 100000) / 100000;
        },
        () => {
          alert('No se pudo obtener la ubicacion GPS. Verifique los permisos del navegador.');
        }
      );
    },
    guardarFormulario() {
      this.$emit('guardar-finca', { ...this.form });
      this.mostrandoFormulario = false;
    }
  }
};
</script>
