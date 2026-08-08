import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'
import { urlBase64ToUint8Array } from '../utils/push'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
const FOTO_MAX_SIZE = 400

function comprimirImagen(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
        reader.onload = () => {
            const img = new Image()
            img.onerror = () => reject(new Error('No se pudo leer la imagen'))
            img.onload = () => {
                const scale = Math.min(1, FOTO_MAX_SIZE / Math.max(img.width, img.height))
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(img.width * scale)
                canvas.height = Math.round(img.height * scale)
                const ctx = canvas.getContext('2d')
                if (!ctx) return reject(new Error('No se pudo procesar la imagen'))
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL('image/jpeg', 0.8))
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    })
}

interface RegistroPeso {
    id: number
    peso: number
    fecha: string
}

interface EjercicioProgreso {
    idEjercicio: number
    nombre: string
    pesoActual: number
}

interface Comentario {
    id: number
    texto: string
    createdAt: string
    leido: boolean
}

function formatFecha(isoDate: string): string {
    const [y, m, d] = isoDate.slice(0, 10).split('-')
    return `${d}/${m}/${y}`
}

export default function PerfilPage() {
    const textGray = "text-white/60 font-medium"
    const textDark = "text-white font-bold"

    const [socio, setSocio] = useState<Record<string, any>>({})
    const [showFotoMenu, setShowFotoMenu] = useState(false)
    const [uploadingFoto, setUploadingFoto] = useState(false)
    const [fotoError, setFotoError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    // Progreso
    const [ejercicios, setEjercicios] = useState<EjercicioProgreso[]>([])
    const [loadingProgreso, setLoadingProgreso] = useState(true)
    const [errorProgreso, setErrorProgreso] = useState<string | null>(null)
    const [historial, setHistorial] = useState<Record<number, RegistroPeso[] | null>>({})
    const [expandido, setExpandido] = useState<number | null>(null)
    const [loadingHistorial, setLoadingHistorial] = useState(false)

    // Comentarios
    const [comentarios, setComentarios] = useState<Comentario[]>([])
    const [loadingComentarios, setLoadingComentarios] = useState(true)
    const [nuevoComentario, setNuevoComentario] = useState('')
    const [enviandoComentario, setEnviandoComentario] = useState(false)
    const [comentarioError, setComentarioError] = useState('')

    // Notificaciones push
    const pushSoportado = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY
    const [pushActivo, setPushActivo] = useState(false)
    const [pushLoading, setPushLoading] = useState(false)
    const [pushError, setPushError] = useState('')

    useEffect(() => {
        const raw = localStorage.getItem('socio')
        if (raw) setSocio(JSON.parse(raw))
    }, [])

    const fetchProgreso = useCallback(async (dni: string) => {
        setLoadingProgreso(true)
        setErrorProgreso(null)
        try {
            const url = `${API_URL}/rutina/ejercicios-con-historial?usuarioId=${encodeURIComponent(dni)}`
            const res = await fetch(url)
            if (!res.ok) {
                const text = await res.text().catch(() => res.status.toString())
                setErrorProgreso(`Error ${res.status}: ${text}`)
                setEjercicios([])
                return
            }
            const data: EjercicioProgreso[] = await res.json()
            setEjercicios(data)
        } catch (e: any) {
            setErrorProgreso(e?.message ?? 'Error de red')
            setEjercicios([])
        } finally {
            setLoadingProgreso(false)
        }
    }, [])

    useEffect(() => {
        const raw = localStorage.getItem('socio')
        const dni = raw ? JSON.parse(raw).DNI : null
        if (dni) fetchProgreso(String(dni))
        else setLoadingProgreso(false)
    }, [fetchProgreso])

    const fetchComentarios = useCallback(async (dni: string) => {
        setLoadingComentarios(true)
        try {
            const res = await fetch(`${API_URL}/comentarios?dniSocio=${encodeURIComponent(dni)}`)
            setComentarios(res.ok ? await res.json() : [])
        } catch {
            setComentarios([])
        } finally {
            setLoadingComentarios(false)
        }
    }, [])

    useEffect(() => {
        const raw = localStorage.getItem('socio')
        const dni = raw ? JSON.parse(raw).DNI : null
        if (dni) fetchComentarios(String(dni))
        else setLoadingComentarios(false)
    }, [fetchComentarios])

    useEffect(() => {
        if (!pushSoportado) return
        navigator.serviceWorker.ready
            .then((reg) => reg.pushManager.getSubscription())
            .then((sub) => setPushActivo(!!sub))
            .catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const activarPush = async () => {
        if (!socio.DNI || !pushSoportado) return
        setPushLoading(true)
        setPushError('')
        try {
            const permiso = await Notification.requestPermission()
            if (permiso !== 'granted') {
                setPushError('Necesitamos tu permiso para poder avisarte los vencimientos.')
                return
            }
            const reg = await navigator.serviceWorker.ready
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
            })
            const res = await fetch(`${API_URL}/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dniSocio: socio.DNI, subscription: sub.toJSON() }),
            })
            if (!res.ok) throw new Error()
            setPushActivo(true)
        } catch {
            setPushError('No se pudieron activar las notificaciones. Probá de nuevo.')
        } finally {
            setPushLoading(false)
        }
    }

    const enviarComentario = async () => {
        if (!socio.DNI || !nuevoComentario.trim()) return
        setEnviandoComentario(true)
        setComentarioError('')
        try {
            const res = await fetch(`${API_URL}/comentarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dniSocio: socio.DNI, texto: nuevoComentario.trim() }),
            })
            if (!res.ok) throw new Error()
            setNuevoComentario('')
            await fetchComentarios(String(socio.DNI))
        } catch {
            setComentarioError('No se pudo enviar el comentario. Probá de nuevo.')
        } finally {
            setEnviandoComentario(false)
        }
    }

    const toggleEjercicio = async (ej: EjercicioProgreso) => {
        if (expandido === ej.idEjercicio) {
            setExpandido(null)
            return
        }
        setExpandido(ej.idEjercicio)

        // Si ya cargamos el historial, no volver a fetchear
        if (historial[ej.idEjercicio] !== undefined) return

        const dni = (() => { try { return JSON.parse(localStorage.getItem('socio') ?? '{}').DNI ?? '' } catch { return '' } })()
        setLoadingHistorial(true)
        try {
            const res = await fetch(`${API_URL}/rutina/historial?usuarioId=${encodeURIComponent(dni)}&ejercicioId=${ej.idEjercicio}`)
            const data: RegistroPeso[] = res.ok ? await res.json() : []
            setHistorial(prev => ({ ...prev, [ej.idEjercicio]: data }))
            console.log(`[Historial] ejercicio ${ej.idEjercicio}:`, data)
        } catch (e) {
            console.error('[Historial] error:', e)
            setHistorial(prev => ({ ...prev, [ej.idEjercicio]: [] }))
        } finally {
            setLoadingHistorial(false)
        }
    }

    const nombreCompleto = [socio.nombre, socio.apellido].filter(Boolean).join(' ') || '—'

    const guardarFoto = async (fotoUrl: string | null) => {
        if (!socio.DNI) return
        setUploadingFoto(true)
        setFotoError('')
        try {
            const res = await fetch(`${API_URL}/socios/${socio.DNI}/foto`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fotoUrl }),
            })
            if (!res.ok) throw new Error()
            const updated = { ...socio, fotoUrl }
            setSocio(updated)
            localStorage.setItem('socio', JSON.stringify(updated))
        } catch {
            setFotoError('No se pudo guardar la foto. Probá de nuevo.')
        } finally {
            setUploadingFoto(false)
        }
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        setShowFotoMenu(false)
        if (!file) return
        try {
            const dataUrl = await comprimirImagen(file)
            await guardarFoto(dataUrl)
        } catch {
            setFotoError('No se pudo procesar la imagen.')
        }
    }

    const handleQuitarFoto = () => {
        setShowFotoMenu(false)
        guardarFoto(null)
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 pb-28">
            <div
                className="absolute inset-0 bg-cover bg-center scale-110"
                style={{ backgroundImage: `url(${backgroundGym})`, filter: 'blur(10px)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />

            <div className="relative z-10 px-6 pt-12">
                <h1 className="text-3xl font-bold text-white mb-6 pl-1 tracking-tight drop-shadow-lg">Perfil</h1>

                {pushSoportado && !pushActivo && (
                    <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/30 px-4 py-3 mb-6 flex items-center justify-between gap-3 animate-fade-in">
                        <p className="text-white/80 text-xs">Activá las notificaciones para que te avisemos cuando se acerque el vencimiento de tu cuota.</p>
                        <button
                            type="button"
                            onClick={activarPush}
                            disabled={pushLoading}
                            className="shrink-0 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap"
                        >
                            {pushLoading ? 'Activando...' : 'Activar'}
                        </button>
                    </div>
                )}
                {pushError && <p role="alert" className="text-red-300 text-xs font-medium mb-4 -mt-3">{pushError}</p>}

                {/* Card principal */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 mb-6 relative animate-fade-in">

                    {/* Foto */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg overflow-hidden">
                                {uploadingFoto ? (
                                    <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : socio.fotoUrl ? (
                                    <img src={socio.fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <img src={logoGoodLife} alt="Good Life Center" className="w-16 h-16 object-contain" />
                                )}
                            </div>
                            <button
                                type="button"
                                aria-label="Editar foto de perfil"
                                onClick={() => setShowFotoMenu((v) => !v)}
                                disabled={uploadingFoto}
                                className="absolute bottom-0 right-0 bg-cyan-500 text-white p-2 rounded-full shadow-md hover:bg-cyan-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-60"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>

                            {showFotoMenu && (
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 w-48 rounded-xl bg-gray-900 border border-white/15 shadow-2xl overflow-hidden animate-fade-in">
                                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors">
                                        Sacar foto
                                    </button>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors border-t border-white/10">
                                        Elegir de galería
                                    </button>
                                    {socio.fotoUrl && (
                                        <button type="button" onClick={handleQuitarFoto} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors border-t border-white/10">
                                            Quitar foto
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        {fotoError && <p role="alert" className="text-red-300 text-xs font-medium mt-2">{fotoError}</p>}
                    </div>

                    {/* Información Personal */}
                    <div className="mb-6">
                        <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2">Información Personal</h2>
                        <div className="h-px w-full bg-white/15 mb-4" />
                        <dl className="space-y-2 text-sm">
                            <div className="flex gap-2"><dt className={textDark}>Nombre:</dt><dd className={textGray}>{nombreCompleto}</dd></div>
                            <div className="flex gap-2"><dt className={textDark}>Mail:</dt><dd className={textGray}>{socio.mail || '—'}</dd></div>
                            <div className="flex gap-2"><dt className={textDark}>DNI:</dt><dd className={textGray}>{socio.DNI || '—'}</dd></div>
                            {socio.contacto && <div className="flex gap-2"><dt className={textDark}>Contacto:</dt><dd className={textGray}>{socio.contacto}</dd></div>}
                            {socio.direccion && <div className="flex gap-2"><dt className={textDark}>Dirección:</dt><dd className={textGray}>{socio.direccion}</dd></div>}
                        </dl>
                    </div>

                    {/* Membresía */}
                    <div>
                        <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2">Membresía</h2>
                        <div className="h-px w-full bg-white/15 mb-4" />
                        <dl className="space-y-2 text-sm">
                            <div className="flex gap-2"><dt className={textDark}>Clases restantes:</dt><dd className={textGray}>{socio.clasesRestantes ?? '—'}</dd></div>
                            {socio.nombreMembresia && <div className="flex gap-2"><dt className={textDark}>Membresía:</dt><dd className={textGray}>{socio.nombreMembresia}</dd></div>}
                            {socio.profesor && <div className="flex gap-2"><dt className={textDark}>Profesor:</dt><dd className={textGray}>{socio.profesor}</dd></div>}
                            {socio.vigencia && <div className="flex gap-2"><dt className={textDark}>Vigencia:</dt><dd className={textGray}>{socio.vigencia}</dd></div>}
                            {socio.ultimaClaseAsistida && <div className="flex gap-2"><dt className={textDark}>Última Clase Asistida:</dt><dd className={textGray}>{socio.ultimaClaseAsistida}</dd></div>}
                        </dl>
                    </div>
                </div>

                {/* Comentarios */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 mb-6 animate-fade-in">
                    <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2">Comentarios</h2>
                    <div className="h-px w-full bg-white/15 mb-4" />

                    <p className="text-white/40 text-xs mb-3">
                        Dejale un mensaje a tu profesor. Lo va a poder ver desde el panel.
                    </p>

                    <div className="flex flex-col gap-2">
                        <textarea
                            value={nuevoComentario}
                            onChange={(e) => setNuevoComentario(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            placeholder="Escribí tu comentario..."
                            className="w-full rounded-xl bg-white/5 border border-white/15 text-white text-sm placeholder-white/30 px-3.5 py-2.5 outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/60 transition-colors resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                            {comentarioError && <p role="alert" className="text-red-300 text-xs font-medium mr-auto">{comentarioError}</p>}
                            <button
                                type="button"
                                onClick={enviarComentario}
                                disabled={enviandoComentario || !nuevoComentario.trim()}
                                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                            >
                                {enviandoComentario ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </div>

                    {loadingComentarios ? (
                        <div className="flex justify-center py-4">
                            <span className="w-5 h-5 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                        </div>
                    ) : comentarios.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {comentarios.map(c => (
                                <div key={c.id} className="rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5">
                                    <p className="text-white text-sm break-words">{c.texto}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-white/30 text-[11px]">{formatFecha(c.createdAt)}</span>
                                        {c.leido && <span className="text-cyan-400/70 text-[11px]">Visto por tu profesor</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tu Progreso */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 mb-6 animate-fade-in">
                    <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2">Tu Progreso</h2>
                    <div className="h-px w-full bg-white/15 mb-4" />

                    {loadingProgreso && (
                        <div className="flex justify-center py-6">
                            <span className="w-6 h-6 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
                        </div>
                    )}

                    {!loadingProgreso && errorProgreso && (
                        <p className="text-red-400 text-xs text-center py-4 break-all">{errorProgreso}</p>
                    )}

                    {!loadingProgreso && !errorProgreso && ejercicios.length === 0 && (
                        <p className="text-white/40 text-sm text-center py-4">
                            Todavía no registraste ningún peso. Hacelo desde la sección Entrenamiento.
                        </p>
                    )}

                    {!loadingProgreso && ejercicios.length > 0 && (
                        <div className="space-y-2">
                            {ejercicios.map(ej => {
                                const abierto = expandido === ej.idEjercicio
                                const registros = historial[ej.idEjercicio]
                                return (
                                    <div key={ej.idEjercicio} className="rounded-2xl overflow-hidden border border-white/10">
                                        {/* Fila del ejercicio */}
                                        <button
                                            type="button"
                                            onClick={() => toggleEjercicio(ej)}
                                            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="text-white font-semibold text-sm capitalize">{ej.nombre}</p>
                                                <p className="text-white/40 text-xs mt-0.5">
                                                    Actual: <span className="text-cyan-400 font-bold">{String(ej.pesoActual).replace('.', ',')} kg</span>
                                                </p>
                                            </div>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`h-4 w-4 text-white/40 shrink-0 ml-3 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Historial */}
                                        {abierto && (
                                            <div className="border-t border-white/10 bg-white/5 px-4 py-3">
                                                {loadingHistorial && registros === undefined ? (
                                                    <div className="flex justify-center py-3">
                                                        <span className="w-5 h-5 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
                                                    </div>
                                                ) : !registros || registros.length === 0 ? (
                                                    <p className="text-white/30 text-xs text-center py-2">Sin registros anteriores.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {[...registros].reverse().map(r => (
                                                            <div key={r.id} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>{formatFecha(r.fecha)}</span>
                                                                </div>
                                                                <span className="text-cyan-400 font-bold text-sm">
                                                                    {String(r.peso).replace('.', ',')} kg
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Navbar />
        </div>
    )
}
