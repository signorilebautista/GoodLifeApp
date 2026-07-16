import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { SettingsProvider } from './context/SettingsContext';

function AppContent() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('isLoggedIn') === 'true');
    const [currentUser, setCurrentUser] = useState(() => sessionStorage.getItem('currentUser') ?? '');
    const [mustChangePassword, setMustChangePassword] = useState(() => sessionStorage.getItem('mustChangePassword') === 'true');
    const navigate = useNavigate();

    const handleLogin = (username: string, mustChange = false) => {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', username);
        sessionStorage.setItem('mustChangePassword', String(mustChange));
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
        sessionStorage.setItem('mustChangePassword', 'false');
        setMustChangePassword(false);
        navigate('/menu-principal', { replace: true });
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('mustChangePassword');
        setIsLoggedIn(false);
        setCurrentUser('');
        setMustChangePassword(false);
        navigate('/', { replace: true });
    };

    const handleNavigate = (path: string) => navigate(path);

    return (
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
