import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { alertasFinca, colorFinca } from '../domain/calculos';
import type { Finca } from '../domain/tipos';

const COLORES = { rojo: '#c8372d', amarillo: '#e0a200', verde: '#2e9d5b' } as const;

/** Ajusta el mapa a las fincas visibles y corrige su tamaño al mostrarse dentro de Ionic. */
const Encuadre = ({ limites }: { limites: LatLngBoundsExpression | null }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      if (limites) map.fitBounds(limites, { padding: [36, 36], maxZoom: 12 });
    }, 250);
    return () => clearTimeout(t);
  }, [map, limites]);
  return null;
};

type Zona = 'todas' | 'valle-cauca' | 'casanare';

/** Mapa de fincas: un punto por finca, con el color de su alerta. */
const MapaFincas = ({
  fincas,
  metaAgua,
  onAbrir,
}: {
  fincas: Finca[];
  metaAgua: number;
  onAbrir: (id: string) => void;
}) => {
  const [zona, setZona] = useState<Zona>('todas');
  const [sinFondo, setSinFondo] = useState(false);
  const conUbicacion = fincas.filter((f) => f.latitud !== null && f.longitud !== null);
  const sinUbicacion = fincas.length - conUbicacion.length;
  const visibles = conUbicacion.filter((f) =>
    zona === 'todas' ? true : zona === 'casanare' ? f.zona === 'Casanare' : f.zona !== 'Casanare',
  );

  const limites = useMemo<LatLngBoundsExpression | null>(() => {
    if (visibles.length === 0) return null;
    const lats = visibles.map((f) => f.latitud as number);
    const lngs = visibles.map((f) => f.longitud as number);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zona, conUbicacion.length]);

  return (
    <div className="mapa-fincas">
      <div className="mapa-zonas" role="group" aria-label="Zona del mapa">
        {(
          [
            ['todas', 'Todas'],
            ['valle-cauca', 'Valle y Cauca'],
            ['casanare', 'Casanare'],
          ] as [Zona, string][]
        ).map(([z, t]) => (
          <button key={z} className={zona === z ? 'activa' : ''} onClick={() => setZona(z)} aria-pressed={zona === z}>
            {t}
          </button>
        ))}
      </div>
      <MapContainer center={[3.6, -75.5]} zoom={6} className="mapa" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setSinFondo(true) }}
        />
        <Encuadre limites={limites} />
        {visibles.map((f) => {
          const color = COLORES[colorFinca(f, metaAgua)];
          const a = alertasFinca(f, metaAgua);
          const motivos = [
            f.intencionSiembra === 'no' && 'No volverá a sembrar',
            f.intencionSiembra === 'duda' && 'Duda si sembrar',
            a.organico && 'Candado orgánico',
            a.agua && 'Agua sobre la meta',
            a.riego && 'Problema de riego',
          ].filter(Boolean) as string[];
          return (
            <CircleMarker
              key={f.id}
              center={[f.latitud as number, f.longitud as number]}
              radius={Math.max(8, Math.min(18, 6 + Math.sqrt(f.areaHa) * 1.6))}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{f.nombre}</strong>
                <br />
                {f.codigoAgricultor} · {f.municipio} · {f.areaHa} ha
                <br />
                {motivos.length ? motivos.join(' · ') : 'Sin alertas'}
                <br />
                <button className="enlace-popup" onClick={() => onAbrir(f.id)}>
                  Abrir visita
                </button>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="mapa-leyenda">
        <span><i style={{ background: COLORES.verde }} /> Sin alertas</span>
        <span><i style={{ background: COLORES.amarillo }} /> Atención</span>
        <span><i style={{ background: COLORES.rojo }} /> Grave</span>
        <span>Tamaño = área sembrada</span>
      </div>
      {sinFondo && (
        <p className="aviso-ejemplo">
          No se pudo cargar el fondo del mapa (necesita internet). Los puntos de las fincas siguen en su lugar.
        </p>
      )}
      {sinUbicacion > 0 && (
        <p className="aviso-ejemplo">
          {sinUbicacion} {sinUbicacion === 1 ? 'finca no tiene' : 'fincas no tienen'} ubicación. Agrégala en su visita
          con «Usar mi ubicación actual».
        </p>
      )}
    </div>
  );
};

export default MapaFincas;
