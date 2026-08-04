import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getYoutubeEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url)
        const host = u.hostname.replace(/^www\./, '')
        let videoId: string | null = null

        if (host === 'youtu.be') {
            videoId = u.pathname.slice(1)
        } else if (host === 'youtube.com' || host === 'm.youtube.com') {
            if (u.pathname === '/watch') videoId = u.searchParams.get('v')
            else if (u.pathname.startsWith('/embed/')) videoId = u.pathname.split('/')[2]
            else if (u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/')[2]
        }

        if (!videoId) return null
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`
    } catch {
        return null
    }
}

type Exercise = {
    name: string
    reps: string
    series: string
    videoUrl?: string
    idEjercicio: number
}

type Block = {
    name: string
    exercises: Exercise[]
}

type Day = {
    label: string
    blocks: Block[]
}

function getDni(): string {
    try { return JSON.parse(localStorage.getItem('socio') ?? '{}').DNI ?? '' } catch { return '' }
}

export default function EntrenamientoPage() {
    const [days, setDays] = useState<Day[]>([])
    const [activeIndex, setActiveIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [videoModal, setVideoModal] = useState<{ name: string; url: string } | null>(null)
    const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())

    // Pesos actuales por ejercicioId
    const [pesosActuales, setPesosActuales] = useState<Record<number, number>>({})

    // Modal editar peso
    const [modalPeso, setModalPeso] = useState<Exercise | null>(null)
    const [inputPeso, setInputPeso] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [guardadoOk, setGuardadoOk] = useState(false)

    const toggleBlock = (index: number) => {
        setExpandedBlocks((prev) => {
            const next = new Set(prev)
            next.has(index) ? next.delete(index) : next.add(index)
            return next
        })
    }

    useEffect(() => {
        const raw = localStorage.getItem('socio')
        const socio = raw ? JSON.parse(raw) : null
        setDays(socio?.plan?.days || [])

        const dni = socio?.DNI
        if (!dni) { setLoading(false); return }

        Promise.all([
            fetch(`${API_URL}/socios/${dni}/plan`)
                .then(res => res.ok ? res.json() : null)
                .then(plan => { if (plan?.days) setDays(plan.days) })
                .catch(() => {}),
            fetch(`${API_URL}/rutina/pesos-actuales?usuarioId=${encodeURIComponent(dni)}`)
                .then(res => res.ok ? res.json() : {})
                .then(pesos => setPesosActuales(pesos))
                .catch(() => {}),
        ]).finally(() => setLoading(false))
    }, [])

    const abrirModalPeso = (exercise: Exercise) => {
        const actual = pesosActuales[exercise.idEjercicio]
        setInputPeso(actual !== undefined ? String(actual).replace('.', ',') : '')
        setGuardadoOk(false)
        setModalPeso(exercise)
    }

    const handleGuardar = async () => {
        if (!modalPeso) return
        const peso = parseFloat(inputPeso.replace(',', '.'))
        if (isNaN(peso) || peso <= 0) return
        const dni = getDni()
        if (!dni) return
        setGuardando(true)
        try {
            const res = await fetch(`${API_URL}/rutina/peso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioId: dni, ejercicioId: modalPeso.idEjercicio, peso }),
            })
            if (res.ok) {
                setPesosActuales(prev => ({ ...prev, [modalPeso.idEjercicio]: peso }))
                setGuardadoOk(true)
                setTimeout(() => setModalPeso(null), 800)
            }
        } finally {
            setGuardando(false)
        }
    }

    const currentDay = days[activeIndex]

    if (days.length === 0) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 pb-28">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    {loading ? (
                        <span className="w-8 h-8 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
                    ) : (
                        <p className="text-white/60 text-sm">No tenés un plan asignado aún.</p>
                    )}
                </div>
                <Navbar />
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 pb-28">
            <div
                className="absolute inset-0 bg-cover bg-center scale-110"
                style={{ backgroundImage: `url(${backgroundGym})`, filter: 'blur(10px)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />

            <div className="relative z-10 px-6 pt-12 space-y-6">
                <div className="flex justify-center">
                    <img src={logoGoodLife} alt="Good Life Center" className="w-16 h-16 object-contain drop-shadow-xl" />
                </div>

                {/* Day Selection */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-5 animate-fade-in">
                    <h2 className="text-2xl font-bold text-white mb-3 px-1">Día:</h2>
                    <div className="flex gap-3 flex-wrap" role="group" aria-label="Selección de día de entrenamiento">
                        {days.map((day, index) => (
                            <button
                                key={day.label}
                                type="button"
                                onClick={() => { setActiveIndex(index); setExpandedBlocks(new Set()) }}
                                aria-pressed={activeIndex === index}
                                aria-label={day.label}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-md transition-all duration-300 transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${activeIndex === index
                                    ? 'bg-cyan-500 text-white scale-110 shadow-cyan-500/30'
                                    : 'bg-white/10 border border-white/15 text-white/80 hover:bg-white/15 hover:border-cyan-400/40'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Blocks */}
                <div className="space-y-6 animate-slide-up">
                    {currentDay.blocks.map((block, index) => {
                        const ejercicios = block.exercises.filter(e => e.name)
                        if (ejercicios.length === 0) return null
                        const expandido = expandedBlocks.has(index)
                        return (
                            <div key={index} className="rounded-3xl overflow-hidden shadow-lg border border-white/15 bg-white/5 backdrop-blur-xl">
                                <button
                                    type="button"
                                    onClick={() => toggleBlock(index)}
                                    aria-expanded={expandido}
                                    className="w-full flex items-center justify-between bg-cyan-500/20 border-b border-white/10 px-6 py-3 text-left hover:bg-cyan-500/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                                >
                                    <h3 className="text-white text-lg font-bold">{block.name}</h3>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 text-white/70 shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {expandido && (
                                    <div className="p-2 space-y-1">
                                        {ejercicios.map((exercise) => {
                                            const pesoActual = pesosActuales[exercise.idEjercicio]
                                            return (
                                                <div key={exercise.idEjercicio} className="flex items-center justify-between p-3 hover:bg-white/10 rounded-xl transition-colors">
                                                    <p className="font-semibold text-white text-base capitalize flex-1 min-w-0 truncate pr-2">{exercise.name}</p>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="font-bold text-white/60 text-base">
                                                            {exercise.series} x {exercise.reps}
                                                        </span>

                                                        {/* Peso actual + botón editar */}
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirModalPeso(exercise)}
                                                            aria-label={`Editar peso de ${exercise.name}`}
                                                            className="flex items-center gap-1.5 bg-white/10 hover:bg-cyan-500/20 border border-white/15 hover:border-cyan-400/40 rounded-xl px-2.5 py-1.5 transition-colors"
                                                        >
                                                            <span className="text-cyan-400 font-bold text-sm">
                                                                {pesoActual !== undefined ? `${String(pesoActual).replace('.', ',')} kg` : '— kg'}
                                                            </span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>

                                                        {exercise.videoUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setVideoModal({ name: exercise.name, url: exercise.videoUrl! })}
                                                                aria-label={`Ver video de ${exercise.name}`}
                                                                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-cyan-400 hover:bg-white/15 transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <Navbar />

            {/* Modal editar peso */}
            {modalPeso && (
                <div
                    onClick={() => setModalPeso(null)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center z-[100] p-4"
                    role="dialog" aria-modal="true" aria-label={`Editar peso de ${modalPeso.name}`}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-sm rounded-3xl bg-gray-900/95 border border-white/15 shadow-2xl p-6 mb-2 animate-slide-up"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-bold text-base">Editar Peso</h3>
                            <button
                                type="button"
                                onClick={() => setModalPeso(null)}
                                aria-label="Cerrar"
                                className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-white/50 text-sm mb-5 capitalize">{modalPeso.name}</p>

                        <div className="relative mb-5">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={inputPeso}
                                onChange={e => setInputPeso(e.target.value.replace(/[^0-9.,]/g, ''))}
                                placeholder="0"
                                autoFocus
                                className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 pr-12 py-3 text-white text-2xl font-bold text-center outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">kg</span>
                        </div>

                        {guardadoOk && (
                            <p className="text-cyan-400 text-sm text-center mb-3 font-semibold">¡Guardado!</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setModalPeso(null)}
                                className="flex-1 py-3 rounded-2xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleGuardar}
                                disabled={guardando || !inputPeso}
                                className={`flex-1 py-3 rounded-2xl text-white text-sm font-bold transition-all active:scale-95 ${
                                    guardando || !inputPeso
                                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                        : 'bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                                }`}
                            >
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {videoModal && (
                <div
                    onClick={() => setVideoModal(null)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                    role="dialog" aria-modal="true" aria-label={`Video de ${videoModal.name}`}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden animate-scale-in"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <p className="text-white font-semibold text-sm capitalize truncate pr-2">{videoModal.name}</p>
                            <button
                                type="button"
                                onClick={() => setVideoModal(null)}
                                aria-label="Cerrar video"
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="aspect-video bg-black">
                            {getYoutubeEmbedUrl(videoModal.url) ? (
                                <iframe
                                    key={videoModal.url}
                                    src={getYoutubeEmbedUrl(videoModal.url)!}
                                    title={videoModal.name}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    key={videoModal.url}
                                    src={videoModal.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
