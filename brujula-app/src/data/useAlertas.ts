import { useEffect, useMemo } from 'react';
import { generarAlertas } from '../domain/alertas';
import { hoy, useDatos } from './store';
import { notificarNuevas } from './notificaciones';

/** Alertas activas calculadas con los datos actuales. */
export const useAlertas = () => {
  const { riesgos, fincas, decisiones, bitacora, ajustes } = useDatos();
  return useMemo(
    () => generarAlertas({ riesgos, fincas, decisiones, bitacora, ajustes }, hoy()),
    [riesgos, fincas, decisiones, bitacora, ajustes],
  );
};

/** Componente invisible: envía notificaciones cuando aparecen alertas nuevas. */
export const VigilanteAlertas = () => {
  const alertas = useAlertas();
  const { ajustes } = useDatos();
  useEffect(() => {
    if (ajustes.notificaciones) void notificarNuevas(alertas);
  }, [alertas, ajustes.notificaciones]);
  return null;
};
