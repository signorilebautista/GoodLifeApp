import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

export default function PerfilPage() {
    const textGray = "text-white/60 font-medium"
    const textDark = "text-white font-bold"

    const [socio, setSocio] = useState<Record<string, any>>({})

    useEffect(() => {
        const raw = localStorage.getItem('socio')
        if (raw) setSocio(JSON.parse(raw))
    }, [])

    const nombreCompleto = [socio.nombre, socio.apellido].filter(Boolean).join(' ') || '—'

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 pb-28">
            <div
                className="absolute inset-0 bg-cover bg-center scale-110"
                style={{
                    backgroundImage: `url(${backgroundGym})`,
                    filter: 'blur(10px)',
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />

            <div className="relative z-10 px-6 pt-12">
                <h1 className="text-3xl font-bold text-white mb-6 pl-1 tracking-tight drop-shadow-lg">Perfil</h1>

                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 mb-8 relative animate-fade-in">

                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg">
                                <img
                                    src={logoGoodLife}
                                    alt="Good Life Center"
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                            <button
                                type="button"
                                aria-label="Editar foto de perfil"
                                className="absolute bottom-0 right-0 bg-cyan-500 text-white p-2 rounded-full shadow-md hover:bg-cyan-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Información Personal */}
                    <div className="mb-6">
                        <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2">Información Personal</h2>
                        <div className="h-px w-full bg-white/15 mb-4"></div>
                        <dl className="space-y-2 text-sm">
                            <div className="flex gap-2">
                                <dt className={textDark}>Nombre:</dt>
                                <dd className={textGray}>{nombreCompleto}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className={textDark}>Mail:</dt>
                                <dd className={textGray}>{socio.mail || '—'}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className={textDark}>DNI:</dt>
                                <dd className={textGray}>{socio.DNI || '—'}</dd>
                            </div>
                            {socio.contacto && (
                                <div className="flex gap-2">
                                    <dt className={textDark}>Contacto:</dt>
                                    <dd className={textGray}>{socio.contacto}</dd>
                                </div>
                            )}
                            {socio.direccion && (
                                <div className="flex gap-2">
                                    <dt className={textDark}>Dirección:</dt>
                                    <dd className={textGray}>{socio.direccion}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Membresía */}
                    <div className="mb-6">
                        <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2">Membresía</h2>
                        <div className="h-px w-full bg-white/15 mb-4"></div>
                        <dl className="space-y-2 text-sm">
                            <div className="flex gap-2">
                                <dt className={textDark}>Clases restantes:</dt>
                                <dd className={textGray}>{socio.clasesRestantes ?? '—'}</dd>
                            </div>
                            {socio.nombreMembresia && (
                                <div className="flex gap-2">
                                    <dt className={textDark}>Membresía:</dt>
                                    <dd className={textGray}>{socio.nombreMembresia}</dd>
                                </div>
                            )}
                            {socio.profesor && (
                                <div className="flex gap-2">
                                    <dt className={textDark}>Profesor:</dt>
                                    <dd className={textGray}>{socio.profesor}</dd>
                                </div>
                            )}
                            {socio.vigencia && (
                                <div className="flex gap-2">
                                    <dt className={textDark}>Vigencia:</dt>
                                    <dd className={textGray}>{socio.vigencia}</dd>
                                </div>
                            )}
                            {socio.ultimaClaseAsistida && (
                                <div className="flex gap-2">
                                    <dt className={textDark}>Última Clase Asistida:</dt>
                                    <dd className={textGray}>{socio.ultimaClaseAsistida}</dd>
                                </div>
                            )}
                        </dl>
                    </div>


                </div>
            </div>

            <Navbar />
        </div>
    )
}
