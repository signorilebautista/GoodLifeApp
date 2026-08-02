import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    const handleLogoutClick = () => {
        setShowLogoutModal(true)
    }

    const handleConfirmLogout = () => {
        console.log('Logout confirmed')
        navigate('/')
    }

    const handleCancelLogout = () => {
        setShowLogoutModal(false)
    }

    const handleNavigation = (path: string) => {
        navigate(path)
    }

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-cyan-400' : 'text-white'
    }

    return (
        <>
            <nav className="fixed bottom-4 left-4 right-4 bg-black rounded-2xl shadow-2xl z-50">
                <div className="flex items-center justify-around h-14 px-2">
                    {/* Profile Icon */}
                    <button
                        type="button"
                        onClick={() => handleNavigation('/perfil')}
                        aria-label="Perfil"
                        aria-current={location.pathname === '/perfil' ? 'page' : undefined}
                        className={`flex items-center justify-center w-10 h-10 rounded-full hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors ${isActive('/perfil')}`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Calendar Icon */}
                    <button
                        type="button"
                        onClick={() => handleNavigation('/reserva')}
                        aria-label="Reservar clase"
                        aria-current={location.pathname === '/reserva' ? 'page' : undefined}
                        className={`flex items-center justify-center w-10 h-10 rounded-full hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors ${isActive('/reserva')}`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Home Icon - Central with Blue Background */}
                    <button
                        type="button"
                        onClick={() => handleNavigation('/menu')}
                        aria-label="Menú principal"
                        aria-current={location.pathname === '/menu' ? 'page' : undefined}
                        className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
                    >
                        <div className="bg-cyan-500 hover:bg-cyan-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-300">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                        </div>
                    </button>

                    {/* Tabata Icon (formerly Notifications) */}
                    <button
                        type="button"
                        onClick={() => handleNavigation('/tabata')}
                        aria-label="Tabata Timer"
                        aria-current={location.pathname === '/tabata' ? 'page' : undefined}
                        className={`flex items-center justify-center w-10 h-10 rounded-full hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors ${isActive('/tabata')}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* Logout Icon */}
                    <button
                        type="button"
                        onClick={handleLogoutClick}
                        aria-label="Cerrar sesión"
                        className="flex items-center justify-center w-10 h-10 rounded-full text-white hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="logout-title"
                >
                    <div className="bg-gray-200 rounded-2xl p-6 w-[90%] max-w-[300px] shadow-2xl animate-scale-in">
                        <p id="logout-title" className="text-gray-800 text-center font-medium mb-6">
                            ¿Estás seguro que quieres salir?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={handleCancelLogout}
                                className="px-8 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmLogout}
                                className="px-8 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                            >
                                Sí
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
