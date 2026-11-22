import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactHashRouter, IonReactMemoryRouter } from '@ionic/react-router';
import type { ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { bookOutline, gitCompareOutline, leafOutline, pulseOutline, settingsOutline } from 'ionicons/icons';

import { ProveedorDatos } from './data/store';
import RiesgosPage from './pages/RiesgosPage';
import RiesgoForm from './pages/RiesgoForm';
import FincasPage from './pages/FincasPage';
import FincaForm from './pages/FincaForm';
import DecisionesPage from './pages/DecisionesPage';
import DecisionDetalle from './pages/DecisionDetalle';
import BitacoraPage from './pages/BitacoraPage';
import AjustesPage from './pages/AjustesPage';
import AlertasPage from './pages/AlertasPage';
import ReportePage from './pages/ReportePage';
import { VigilanteAlertas } from './data/useAlertas';

/* Estilos base de Ionic */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/text-alignment.css';
/* Modo oscuro según el sistema operativo */
import '@ionic/react/css/palettes/dark.system.css';
/* Tema de la app */
import './theme/variables.css';

setupIonicReact({ mode: 'md' });

// HashRouter funciona igual en el navegador y dentro de Capacitor (Android/iOS).
// La demo en un solo archivo usa un router en memoria para no depender de la URL.
const Router = ({ children }: { children: ReactNode }) =>
  import.meta.env.MODE === 'demo' ? (
    <IonReactMemoryRouter initialEntries={['/decidir']}>{children}</IonReactMemoryRouter>
  ) : (
    <IonReactHashRouter>{children}</IonReactHashRouter>
  );

const App = () => (
  <IonApp>
    <ProveedorDatos>
      <VigilanteAlertas />
      <Router>
        <IonTabs>
          <IonRouterOutlet>
            <Route path="/riesgos" element={<RiesgosPage />} />
            <Route path="/riesgos/:id" element={<RiesgoForm />} />
            <Route path="/fincas" element={<FincasPage />} />
            <Route path="/fincas/:id" element={<FincaForm />} />
            <Route path="/decidir" element={<DecisionesPage />} />
            <Route path="/decidir/:id" element={<DecisionDetalle />} />
            <Route path="/bitacora" element={<BitacoraPage />} />
            <Route path="/ajustes" element={<AjustesPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="/reporte" element={<ReportePage />} />
            <Route path="/" element={<Navigate to="/decidir" replace />} />
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="riesgos" href="/riesgos">
              <IonIcon icon={pulseOutline} aria-hidden="true" />
              <IonLabel>Riesgos</IonLabel>
            </IonTabButton>
            <IonTabButton tab="fincas" href="/fincas">
              <IonIcon icon={leafOutline} aria-hidden="true" />
              <IonLabel>Fincas</IonLabel>
            </IonTabButton>
            <IonTabButton tab="decidir" href="/decidir">
              <IonIcon icon={gitCompareOutline} aria-hidden="true" />
              <IonLabel>Decidir</IonLabel>
            </IonTabButton>
            <IonTabButton tab="bitacora" href="/bitacora">
              <IonIcon icon={bookOutline} aria-hidden="true" />
              <IonLabel>Bitácora</IonLabel>
            </IonTabButton>
            <IonTabButton tab="ajustes" href="/ajustes">
              <IonIcon icon={settingsOutline} aria-hidden="true" />
              <IonLabel>Ajustes</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </Router>
    </ProveedorDatos>
  </IonApp>
);

export default App;
