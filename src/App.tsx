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
import VerificationRedirector from './components/VerificationRedirector';

import Login from './pages/login';
import SuperRegister from './pages/superadmin/sa-admin-register';

import AMenu from './pages/admin/admin-menu';

import UserRegister from './pages/user/UserRegister';
import UserDashboard from './pages/user/user-menu';
import UserVerifyEmail from './pages/user/UserVerifyEmail';
import SAMenu from './pages/superadmin/sa-menu';
import RegisterInvited from './pages/auth/RegisterInvited';
import PendingVerification from './pages/user/PendingVerification';
import RejectedVerification from './pages/user/RejectedVerification';
import CompleteProfile from './pages/user/CompleteProfile';
import UserTeleList from './pages/user/user-tele-list';



setupIonicReact();



const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AuthProvider>
        <VerificationRedirector>
          <IonRouterOutlet>
            <Switch>
              {/* Login Routes */}
              <Route exact path="/login">
                <RedirectIfLoggedIn redirectTo="/dashboard">
                  <Login />
                </RedirectIfLoggedIn>
              </Route>
              <Route exact path="/">
                <RedirectIfLoggedIn redirectTo="/dashboard">
                  <Login />
                </RedirectIfLoggedIn>
              </Route>

              {/* Super Admin Routes */}
              <Route path="/superadmin/dashboard">
                <ProtectedRoute 
                  requiredRole="superadmin" 
                  redirectTo="/login"
                >
                  <SAMenu />
                </ProtectedRoute>
              </Route>

              <Route exact path="/superadmin/register">
                <ProtectedRoute
                  requiredRole="superadmin"
                  redirectTo="/login"
                >
                  <SuperRegister />
                </ProtectedRoute>
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/dashboard">
                <ProtectedRoute 
                  requiredRole="admin" 
                  redirectTo="/login"
                >
                  <AMenu />
                </ProtectedRoute>
              </Route>

              {/* User Routes */}
              <Route exact path="/user/register">
                <RedirectIfLoggedIn redirectTo="/dashboard">
                  <UserRegister />
                </RedirectIfLoggedIn>
              </Route>
              <Route exact path="/user/verify-email"> {/* NEW ROUTE */}
                <UserVerifyEmail />
              </Route>
              <Route exact path="/user/complete-profile">
                <ProtectedRoute requiredRole="user" redirectTo="/login">
                  <CompleteProfile />
                </ProtectedRoute>
              </Route>
              <Route exact path="/user/pending-verification">
                <ProtectedRoute requiredRole="user" redirectTo="/login">
                  <PendingVerification />
                </ProtectedRoute>
              </Route>
              <Route exact path="/user/rejected-verification">
                <ProtectedRoute requiredRole="user" redirectTo="/login">
                  <RejectedVerification />
                </ProtectedRoute>
              </Route>
              <Route exact path="/user/teleconsultations">
                <ProtectedRoute requiredRole="user" redirectTo="/login">
                  <UserTeleList />
                </ProtectedRoute>
              </Route>

              
              {/* Invitation Registration Route */}
              <Route exact path="/register-invited">
                <RegisterInvited />
              </Route>

              {/* Protected User Dashboard */}
              <Route path="/user/dashboard">
                <ProtectedRoute 
                  requiredRole="user" 
                  redirectTo="/login"
                >
                  <UserDashboard />
                </ProtectedRoute>
              </Route>

              {/* Central Dashboard Redirect */}
              <Route path="/dashboard">
                <DashboardRedirect />
              </Route>

              {/* Default route */}
              <Route render={() => <Redirect to="/login" />} />
            </Switch>
          </IonRouterOutlet>
        </VerificationRedirector>
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;