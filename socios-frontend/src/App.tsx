import type { ReactElement } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import MenuPrincipal from './pages/MenuPrincipal'
import PerfilPage from './pages/PerfilPage'
import ReservaPage from './pages/ReservaPage'
import MisReservasPage from './pages/MisReservasPage'
import TabataPage from './pages/TabataPage'
import TabataConfigPage from './pages/TabataConfigPage'
import EntrenamientoPage from './pages/EntrenamientoPage'

function RequireAuth({ children }: { children: ReactElement }) {
  const isAuthenticated = !!localStorage.getItem('socio')
  return isAuthenticated ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<RequireAuth><MenuPrincipal /></RequireAuth>} />
        <Route path="/perfil" element={<RequireAuth><PerfilPage /></RequireAuth>} />
        <Route path="/reserva" element={<RequireAuth><ReservaPage /></RequireAuth>} />
        <Route path="/mis-reservas" element={<RequireAuth><MisReservasPage /></RequireAuth>} />
        <Route path="/tabata" element={<RequireAuth><TabataPage /></RequireAuth>} />
        <Route path="/tabata/config" element={<RequireAuth><TabataConfigPage /></RequireAuth>} />
        <Route path="/entrenamiento" element={<RequireAuth><EntrenamientoPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
