import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

import './firebaseConfig';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RedirectIfLoggedIn from './components/RedirectIfLoggedIn';

import SuperAdminLogin from './pages/superadmin/SALogin';
import SuperAdminDashboard from './pages/superadmin/SADashboard';
import SuperRegister from './pages/superadmin/SARegister';

import ALogin from './pages/admin/ALogin';
import AMenu from './pages/admin/AMenu';
import AAnnouncements from './pages/admin/ABAnnouncements';

import UserLogin from './pages/user/ULogin';
import UserRegister from './pages/user/URegister';
import UserDashboard from './pages/user/UDashboard';
import SAMenu from './pages/superadmin/SAMenu';


setupIonicReact();

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            {/* Super Admin Routes */}
            <Route exact path="/superadmin">
              <RedirectIfLoggedIn>
                <SuperAdminLogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/superadmin/login">
              <RedirectIfLoggedIn>
                <SuperAdminLogin />
              </RedirectIfLoggedIn>
            </Route>
            
            {/* Protected Super Admin Dashboard */}
            <Route path="/superadmin/dashboard">
              <ProtectedRoute 
                requiredRole="superadmin" 
                redirectTo="/superadmin/login"
              >
                <SAMenu />
              </ProtectedRoute>
            </Route>

            {/* Admin Routes */}
            <Route exact path="/admin">
              <RedirectIfLoggedIn>
                <ALogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/admin/login">
              <RedirectIfLoggedIn>
                <ALogin />
              </RedirectIfLoggedIn>
            </Route>
                     
            {/* Protected Admin Dashboard */}
            <Route path="/admin/dashboard">
              <ProtectedRoute 
                requiredRole="admin" 
                redirectTo="/admin"
              >
                <AMenu />
              </ProtectedRoute>
            </Route>

            {/* User Routes */}
            <Route exact path="/user">
              <RedirectIfLoggedIn>
                <UserLogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/user/login">
              <RedirectIfLoggedIn>
                <UserLogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/user/register">
              <RedirectIfLoggedIn>
                <UserRegister />
              </RedirectIfLoggedIn>
            </Route>
            
            {/* Protected User Dashboard */}
            <Route path="/user/dashboard">
              <ProtectedRoute 
                requiredRole="user" 
                redirectTo="/user/login"
              >
                <UserDashboard />
              </ProtectedRoute>
            </Route>

            {/* Default route */}
            <Route exact path="/" render={() => <Redirect to="/user" />} />
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
);

export default App;
