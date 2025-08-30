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
import './theme/variables.scss';
import './theme/global.scss';

import './firebaseConfig';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RedirectIfLoggedIn from './components/RedirectIfLoggedIn';
import DashboardRedirect from './components/DashboardRedirect';

import SuperAdminLogin from './pages/superadmin/sa-login';
import SuperAdminDashboard from './pages/superadmin/sa-dashboard';
import SuperRegister from './pages/superadmin/sa-register';

import ALogin from './pages/admin/admin-login';
import AMenu from './pages/admin/admin-menu';
import AAnnouncements from './pages/admin/admin-brgy-announcements';

import UserLogin from './pages/user/user-login';
import UserRegister from './pages/user/user-register';
import UserDashboard from './pages/user/user-menu';
import UserVerifyEmail from './pages/user/user-verify-email';
import User_Requests from './pages/user/user-requests';
import Medicine_Requests_Status from './pages/user/user-med-list';
import Teleconsultation_Requests_Status from './pages/user/user-tele-list';
import SAMenu from './pages/superadmin/sa-menu';
import RegisterInvited from './pages/auth/RegisterInvited';


setupIonicReact();

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            {/* Super Admin Routes */}
            <Route exact path="/superadmin">
              <RedirectIfLoggedIn redirectTo="/dashboard">
                <SuperAdminLogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/superadmin/login">
              <RedirectIfLoggedIn redirectTo="/dashboard">
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

            <Route exact path="/superadmin/register">
              <ProtectedRoute
                requiredRole="superadmin"
                redirectTo="/superadmin/login"
              >
                <SuperRegister />
              </ProtectedRoute>
            </Route>

            {/* Admin Routes */}
            <Route exact path="/admin">
              <RedirectIfLoggedIn redirectTo="/dashboard">
                <ALogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/admin/login">
              <RedirectIfLoggedIn redirectTo="/dashboard">
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
              <RedirectIfLoggedIn redirectTo="/dashboard">
                <UserLogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/user/login">
              <RedirectIfLoggedIn redirectTo="/dashboard">
                <UserLogin />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/user/register">
              <RedirectIfLoggedIn redirectTo="/dashboard">
                <UserRegister />
              </RedirectIfLoggedIn>
            </Route>
            <Route exact path="/user/verify-email"> {/* NEW ROUTE */}
              <UserVerifyEmail />
            </Route>
            
            {/* Invitation Registration Route */}
            <Route exact path="/register-invited">
              <RegisterInvited />
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

            {/* Central Dashboard Redirect */}
            <Route path="/dashboard">
              <DashboardRedirect />
            </Route>

            {/* Default route */}
            <Route exact path="/" render={() => <Redirect to="/dashboard" />} />
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
);

export default App;
