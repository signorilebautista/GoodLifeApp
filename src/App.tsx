import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MenuPrincipal from './pages/MenuPrincipal';
import Socios from './pages/Socios';
import Turnero from './pages/Turnero';
import Planes from './pages/Planes';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/"
        element={
          isLoggedIn ?
            <Navigate to="/menu-principal" replace /> :
            <LoginPage onLogin={handleLogin} />
        }
      />

      {/* Menu Principal Route */}
      <Route
        path="/menu-principal"
        element={
          isLoggedIn ?
            <MenuPrincipal onLogout={handleLogout} onNavigate={handleNavigate} /> :
            <Navigate to="/" replace />
        }
      />

      {/* Socios Route */}
      <Route
        path="/socios"
        element={
          isLoggedIn ?
            <Socios onLogout={handleLogout} onNavigate={handleNavigate} /> :
            <Navigate to="/" replace />
        }
      />

      {/* Turnero Route */}
      <Route
        path="/turnero"
        element={
          isLoggedIn ?
            <Turnero onLogout={handleLogout} onNavigate={handleNavigate} /> :
            <Navigate to="/" replace />
        }
      />

      {/* Planes Route */}
      <Route
        path="/planes"
        element={
          isLoggedIn ?
            <Planes onLogout={handleLogout} onNavigate={handleNavigate} /> :
            <Navigate to="/" replace />
        }
      />

      {/* Redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
