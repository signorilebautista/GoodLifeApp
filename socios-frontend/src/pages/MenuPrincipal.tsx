import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

export default function MenuPrincipal() {
    const navigate = useNavigate()
    const socio = JSON.parse(localStorage.getItem('socio') || '{}')
    const nombre = socio.nombre || 'socio'

    const shortcuts = [
        {
            label: 'Perfil',
            path: '/perfil',
            icon: (
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            ),
        },
        {
            label: 'Reserva',
            path: '/reserva',
            icon: (
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            ),
        },
    ]

    const features = [
        {
            label: 'Mis Reservas',
            description: 'Tus próximos turnos',
            path: '/mis-reservas',
            icon: (
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 9v7h12V9H4z" clipRule="evenodd" />
            ),
        },
        {
            label: 'Tabata Timer',
            description: 'Entrená por intervalos',
            path: '/tabata',
            icon: (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            ),
        },
        {
            label: 'Entrenamiento',
            description: 'Tu rutina asignada',
            path: '/entrenamiento',
            icon: (
                <path d="M4.5 9a1 1 0 011-1h1V6a1 1 0 112 0v2h3V6a1 1 0 112 0v2h1a1 1 0 110 2h-1v2a1 1 0 11-2 0v-2h-3v2a1 1 0 11-2 0v-2h-1a1 1 0 01-1-1z" />
            ),
        },
    ]

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 pb-28">
            {/* Background Image with Blur */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-110"
                style={{
                    backgroundImage: `url(${backgroundGym})`,
                    filter: 'blur(10px)',
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />

            {/* Content */}
            <div className="relative z-10 px-6 pt-12">
                {/* Welcome Section */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 mb-8 text-center animate-fade-in">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg">
                            <img
                                src={logoGoodLife}
                                alt="Good Life Center"
                                className="w-14 h-14 object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-tight drop-shadow-lg">
                        ¡Hola, {nombre}!
                    </h1>
                    <p className="text-white/60 text-sm font-medium mt-1">
                        Listo para entrenar hoy
                    </p>
                </div>

                {/* Atajos Section */}
                <div className="mb-8 animate-slide-up">
                    <h2 className="text-white/70 font-bold text-xs uppercase tracking-widest mb-3 px-1">
                        Atajos
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {shortcuts.map((item) => (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className="group flex flex-col items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 py-6 px-4 shadow-lg hover:bg-white/15 hover:border-cyan-400/40 transform hover:scale-[1.03] active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                            >
                                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        {item.icon}
                                    </svg>
                                </span>
                                <span className="text-white font-semibold text-sm">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mas funciones Section */}
                <div className="mb-6 animate-slide-up">
                    <h2 className="text-white/70 font-bold text-xs uppercase tracking-widest mb-3 px-1">
                        Más funciones
                    </h2>
                    <div className="space-y-3">
                        {features.map((item) => (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 py-4 px-5 shadow-lg hover:bg-white/15 hover:border-cyan-400/40 transform hover:scale-[1.01] active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 text-left"
                            >
                                <span className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-cyan-500/20 text-cyan-400">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        {item.icon}
                                    </svg>
                                </span>
                                <span className="flex-1">
                                    <span className="block text-white font-semibold text-sm">{item.label}</span>
                                    <span className="block text-white/50 text-xs">{item.description}</span>
                                </span>
                                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Navbar />
        </div>
    )
}
