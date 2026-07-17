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
import LoadingScreen from './components/LoadingScreen';
import { prefetchRoute } from './utils/prefetch';
import { SettingsProvider } from './context/SettingsContext';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MIN_NAV_TRANSITION_MS = 500;

// Sesión: si el usuario marcó "Recordarme" persistimos en localStorage
// (sobrevive al cierre del navegador); si no, en sessionStorage como antes.
const readSession = (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key);
const clearSession = (key: string) => { localStorage.removeItem(key); sessionStorage.removeItem(key); };

function AppContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => readSession('isLoggedIn') === 'true');
    const [currentUser, setCurrentUser] = useState(() => readSession('currentUser') ?? '');
    const [mustChangePassword, setMustChangePassword] = useState(() => readSession('mustChangePassword') === 'true');
    const [pageTransitioning, setPageTransitioning] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = (username: string, mustChange = false, rememberMe = false) => {
        const store = rememberMe ? localStorage : sessionStorage;
        store.setItem('isLoggedIn', 'true');
        store.setItem('currentUser', username);
        store.setItem('mustChangePassword', String(mustChange));
        setIsLoggedIn(true);
        setCurrentUser(username);
        setMustChangePassword(mustChange);
        if (mustChange) {
            navigate('/cambiar-contrasena', { replace: true });
        } else {
            navigate('/menu-principal', { replace: true });
        }
    };

    const handlePasswordChanged = () => {
        const store = localStorage.getItem('isLoggedIn') ? localStorage : sessionStorage;
        store.setItem('mustChangePassword', 'false');
        setMustChangePassword(false);
        navigate('/menu-principal', { replace: true });
    };

    const handleLogout = () => {
        clearSession('isLoggedIn');
        clearSession('currentUser');
        clearSession('mustChangePassword');
        setIsLoggedIn(false);
        setCurrentUser('');
        setMustChangePassword(false);
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
                element={isLoggedIn ? <CrearCuenta onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
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
                element={isLoggedIn ? <Profesores onLogout={handleLogout} onNavigate={handleNavigate} /> : <Navigate to="/" replace />}
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
