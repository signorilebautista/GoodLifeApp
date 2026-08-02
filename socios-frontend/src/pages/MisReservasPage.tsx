import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Turno {
    dia: string
    horario: string
    idSede: number
    nombreSede: string
    profesorNombre: string | null
    profesorApellido: string | null
}

function getSocioDni(): string | null {
    const socioRaw = localStorage.getItem('socio')
    const socio = socioRaw ? JSON.parse(socioRaw) : null
    return socio?.DNI ?? null
}

export default function MisReservasPage() {
    const navigate = useNavigate()
    const [dni] = useState(getSocioDni)
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [isLoading, setIsLoading] = useState(!!dni)
    const [error, setError] = useState(dni ? '' : 'No se encontró tu sesión. Volvé a iniciar sesión.')
    const [cancelandoKey, setCancelandoKey] = useState<string | null>(null)
    const [cancelError, setCancelError] = useState<Record<string, string>>({})
    const [confirmTurno, setConfirmTurno] = useState<Turno | null>(null)

    useEffect(() => {
        if (!dni) return

        fetch(`${API_URL}/turnero/reservas/${dni}`)
            .then(async (response) => {
                const data = await response.json()
                if (!response.ok) throw new Error(data.message || 'No se pudieron obtener tus reservas')
                setTurnos(data)
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo conectar con el servidor'))
            .finally(() => setIsLoading(false))
    }, [dni])

    const formatDia = (isoDate: string) => {
        const date = new Date(isoDate)
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    const formatHorario = (horario: string) => horario.slice(0, 5)

    const profesorLabel = (t: Turno) =>
        t.profesorNombre ? `${t.profesorNombre} ${t.profesorApellido ?? ''}`.trim() : null

    const turnoKey = (t: Turno) => `${t.dia}-${t.horario}-${t.idSede}`

    // El gimnasio opera en hora Argentina; forzamos ese huso sin importar el del dispositivo.
    const GYM_UTC_OFFSET = '-03:00'

    const minutosParaElTurno = (t: Turno) => {
        const inicio = new Date(`${t.dia.slice(0, 10)}T${t.horario}${GYM_UTC_OFFSET}`)
        return (inicio.getTime() - Date.now()) / 60000
    }

    const handleCancelar = async (t: Turno) => {
        if (!dni) return
        const key = turnoKey(t)
        setCancelError((prev) => ({ ...prev, [key]: '' }))

        setConfirmTurno(null)
        setCancelandoKey(key)
        try {
            const params = new URLSearchParams({
                dni,
                idSede: String(t.idSede),
                dia: t.dia.slice(0, 10),
                horario: t.horario,
            })
            const response = await fetch(`${API_URL}/turnero/reservas?${params.toString()}`, { method: 'DELETE' })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) throw new Error(data.message || 'No se pudo cancelar la reserva')

            setTurnos((prev) => prev.filter((turno) => turnoKey(turno) !== key))
        } catch (err) {
            setCancelError((prev) => ({ ...prev, [key]: err instanceof Error ? err.message : 'No se pudo conectar con el servidor' }))
        } finally {
            setCancelandoKey(null)
        }
    }

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
                <div className="flex justify-center mb-6">
                    <img
                        src={logoGoodLife}
                        alt="Good Life Center"
                        className="w-16 h-16 object-contain drop-shadow-xl"
                    />
                </div>

                <div className="relative mb-8">
                    <button
                        type="button"
                        onClick={() => navigate('/menu')}
                        className="absolute top-1/2 -translate-y-1/2 left-0 text-white/70 font-semibold text-sm flex items-center hover:text-cyan-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver
                    </button>

                    <h1 className="text-2xl font-bold text-center text-white uppercase tracking-tight drop-shadow-lg">
                        Mis Reservas
                    </h1>
                </div>

                {isLoading && (
                    <div className="flex justify-center py-16" role="status" aria-live="polite">
                        <span className="w-8 h-8 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                )}

                {!isLoading && error && (
                    <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-lg p-6 text-center animate-fade-in">
                        <p className="text-red-300 text-sm font-medium" role="alert">{error}</p>
                    </div>
                )}

                {!isLoading && !error && turnos.length === 0 && (
                    <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-lg p-8 text-center animate-fade-in">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-white font-semibold mb-1">No tenés reservas próximas</p>
                        <p className="text-white/50 text-sm mb-6">Reservá un turno para verlo acá</p>
                        <button
                            type="button"
                            onClick={() => navigate('/reserva')}
                            className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        >
                            Reservar turno
                        </button>
                    </div>
                )}

                {!isLoading && !error && turnos.length > 0 && (
                    <div className="space-y-3 animate-slide-up">
                        {turnos.map((turno) => {
                            const key = turnoKey(turno)
                            const puedeCancelar = minutosParaElTurno(turno) >= 30
                            const cancelando = cancelandoKey === key
                            const errorCancelacion = cancelError[key]
                            return (
                                <div
                                    key={key}
                                    className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-lg p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-cyan-500/20 text-cyan-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-sm capitalize">{formatDia(turno.dia)}</p>
                                            <p className="text-white/50 text-xs">{turno.nombreSede} · {formatHorario(turno.horario)}hs</p>
                                            {profesorLabel(turno) && (
                                                <p className="text-cyan-300/80 text-xs mt-0.5">Profe: {profesorLabel(turno)}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmTurno(turno)}
                                            disabled={!puedeCancelar || cancelando}
                                            title={!puedeCancelar ? 'Solo se puede cancelar con 30 min de anticipación' : undefined}
                                            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-red-400/40 text-red-300 hover:bg-red-500/10 transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                        >
                                            {cancelando ? 'Cancelando...' : 'Cancelar'}
                                        </button>
                                    </div>
                                    {!puedeCancelar && (
                                        <p className="text-white/40 text-[11px] mt-2">
                                            Ya no se puede cancelar (menos de 30 min para el turno)
                                        </p>
                                    )}
                                    {errorCancelacion && (
                                        <p className="text-red-300 text-xs mt-2" role="alert">{errorCancelacion}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <Navbar />

            {/* Confirmation Modal */}
            {confirmTurno && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                    role="dialog" aria-modal="true" aria-labelledby="cancel-title">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 p-6 w-[90%] max-w-[300px] shadow-2xl animate-scale-in text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 id="cancel-title" className="text-xl font-bold text-white mb-2">Cancelar Reserva</h3>
                        <p className="text-white/60 mb-4 text-sm">
                            ¿Seguro que querés cancelar el turno de las {formatHorario(confirmTurno.horario)}hs
                            {' '}del {formatDia(confirmTurno.dia)}?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button type="button"
                                onClick={() => setConfirmTurno(null)}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold rounded-xl transition-colors">
                                No
                            </button>
                            <button type="button" onClick={() => handleCancelar(confirmTurno)}
                                className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 min-w-[64px]">
                                Sí
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
