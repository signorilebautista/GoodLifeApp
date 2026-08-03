import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MenuPrincipal from './pages/MenuPrincipal';
import Socios from './pages/Socios';
import Turnero from './pages/Turnero';
import Planes from './pages/Planes';
import Configuraciones from './pages/Configuraciones';
import CrearCuenta from './pages/CrearCuenta';
import Estadisticas from './pages/Estadisticas';
import Ingreso from './pages/Ingreso';
import Profesores from './pages/Profesores';
import CambiarContrasena from './pages/CambiarContrasena';
import Vencimientos from './pages/Vencimientos';
import LoadingScreen from './components/LoadingScreen';
import { prefetchRoute } from './utils/prefetch';
import { SettingsProvider } from './context/SettingsContext';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MIN_NAV_TRANSITION_MS = 0;

// La sesión vive solo en sessionStorage: se cierra sola al cerrar la pestaña/navegador.
// "Recordarme" en el login únicamente autocompleta el usuario, no mantiene la sesión abierta.
const SESSION_KEYS = ['isLoggedIn', 'currentUser', 'mustChangePassword', 'userRole'];
// Migración: purga sesiones viejas que habían quedado persistidas en localStorage.
SESSION_KEYS.forEach((key) => localStorage.removeItem(key));

const readSession = (key: string) => sessionStorage.getItem(key);
const clearSession = (key: string) => sessionStorage.removeItem(key);

function AppContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => readSession('isLoggedIn') === 'true');
    const [currentUser, setCurrentUser] = useState(() => readSession('currentUser') ?? '');
    const [mustChangePassword, setMustChangePassword] = useState(() => readSession('mustChangePassword') === 'true');
    const [currentRole, setCurrentRole] = useState<'admin' | 'profesor'>(() => (readSession('userRole') as 'admin' | 'profesor') ?? 'profesor');
    const [pageTransitioning, setPageTransitioning] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = (username: string, mustChange = false, role: 'admin' | 'profesor' = 'profesor') => {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', username);
        sessionStorage.setItem('mustChangePassword', String(mustChange));
        sessionStorage.setItem('userRole', role);
        setIsLoggedIn(true);
        setCurrentUser(username);
        setMustChangePassword(mustChange);
        setCurrentRole(role);
        if (mustChange) {
            navigate('/cambiar-contrasena', { replace: true });
        } else {
            navigate('/menu-principal', { replace: true });
        }
    };

    const handlePasswordChanged = () => {
        sessionStorage.setItem('mustChangePassword', 'false');
        setMustChangePassword(false);
        navigate('/menu-principal', { replace: true });
    };

    const handleLogout = () => {
        clearSession('isLoggedIn');
        clearSession('currentUser');
        clearSession('mustChangePassword');
        clearSession('userRole');
        setIsLoggedIn(false);
        setCurrentUser('');
        setMustChangePassword(false);
        setCurrentRole('profesor');
        navigate('/', { replace: true });
    };

    const handleNavigate = async (path: string) => {
        if (path === location.pathname) return;
        setPageTransitioning(true);
        await Promise.all([delay(MIN_NAV_TRANSITION_MS), prefetchRoute(path)]);
        navigate(path);
        setPageTransitioning(false);
    };

    return (
        <>
        {pageTransitioning && (
            <div className="fixed inset-0 z-[2000]">
                <LoadingScreen />
            </div>
        )}
        <Routes>
            <Route
                path="/"
                element={isLoggedIn ? <Navigate to={mustChangePassword ? '/cambiar-contrasena' : '/menu-principal'} replace /> : <LoginPage onLogin={handleLogin} />}
            />
            <Route
                path="/cambiar-contrasena"
                element={isLoggedIn && mustChangePassword ? <CambiarContrasena mail={currentUser} onSuccess={handlePasswordChanged} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/menu-principal"
                element={isLoggedIn ? <MenuPrincipal onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/socios"
                element={isLoggedIn ? <Socios onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/turnero"
                element={isLoggedIn ? <Turnero onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/planes"
                element={isLoggedIn ? <Planes onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/configuraciones"
                element={isLoggedIn ? <Configuraciones onLogout={handleLogout} onNavigate={handleNavigate} currentUser={currentUser} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/crear-cuenta"
                element={isLoggedIn && currentRole === 'admin' ? <CrearCuenta onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to={isLoggedIn ? '/menu-principal' : '/'} replace />}
            />
            <Route
                path="/estadisticas"
                element={isLoggedIn ? <Estadisticas onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/ingreso"
                element={isLoggedIn ? <Ingreso onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/profesores"
                element={isLoggedIn ? <Profesores onLogout={handleLogout} onNavigate={handleNavigate} role={currentRole} /> : <Navigate to="/" replace />}
            />
            <Route
                path="/vencimientos"
                element={isLoggedIn ? <Vencimientos onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </>
    );
}

function App() {
    return (
        <SettingsProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </SettingsProvider>
    );
}

export default App;
