import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import MenuPrincipal from './pages/MenuPrincipal'
import PerfilPage from './pages/PerfilPage'
import ReservaPage from './pages/ReservaPage'
import MisReservasPage from './pages/MisReservasPage'
import TabataPage from './pages/TabataPage'
import TabataConfigPage from './pages/TabataConfigPage'
import EntrenamientoPage from './pages/EntrenamientoPage'


function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPrincipal />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/reserva" element={<ReservaPage />} />
        <Route path="/mis-reservas" element={<MisReservasPage />} />
        <Route path="/tabata" element={<TabataPage />} />
        <Route path="/tabata/config" element={<TabataConfigPage />} />
        <Route path="/entrenamiento" element={<EntrenamientoPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
