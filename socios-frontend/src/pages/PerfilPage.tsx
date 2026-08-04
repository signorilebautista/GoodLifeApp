import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
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

export default function PerfilPage() {
    const textGray = "text-white/60 font-medium"
    const textDark = "text-white font-bold"

    const [socio, setSocio] = useState<Record<string, any>>({})
    const [showFotoMenu, setShowFotoMenu] = useState(false)
    const [uploadingFoto, setUploadingFoto] = useState(false)
    const [fotoError, setFotoError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const raw = localStorage.getItem('socio')
        if (raw) setSocio(JSON.parse(raw))
    }, [])

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
                style={{
                    backgroundImage: `url(${backgroundGym})`,
                    filter: 'blur(10px)',
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />

            <div className="relative z-10 px-6 pt-12">
                <h1 className="text-3xl font-bold text-white mb-6 pl-1 tracking-tight drop-shadow-lg">Perfil</h1>

                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 mb-8 relative animate-fade-in">

                    <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg overflow-hidden">
                                {uploadingFoto ? (
                                    <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : socio.fotoUrl ? (
                                    <img src={socio.fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <img
                                        src={logoGoodLife}
                                        alt="Good Life Center"
                                        className="w-16 h-16 object-contain"
                                    />
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
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 w-44 rounded-xl bg-gray-900 border border-white/15 shadow-2xl overflow-hidden animate-fade-in">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
                                    >
                                        {socio.fotoUrl ? 'Cambiar foto' : 'Poner foto'}
                                    </button>
                                    {socio.fotoUrl && (
                                        <button
                                            type="button"
                                            onClick={handleQuitarFoto}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors border-t border-white/10"
                                        >
                                            Quitar foto
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {fotoError && (
                            <p role="alert" className="text-red-300 text-xs font-medium mt-2">{fotoError}</p>
                        )}
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
