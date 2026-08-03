import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const DNI_STORAGE_KEY = 'recordarDni'

export default function LoginPage() {
    const [dni, setDni] = useState(() => localStorage.getItem(DNI_STORAGE_KEY) || '')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [recordar, setRecordar] = useState(() => !!localStorage.getItem(DNI_STORAGE_KEY))
    const navigate = useNavigate()

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setDni(value)
            setError('') // Clear error when user types
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate DNI is not empty
        if (dni.trim() === '') {
            setError('Por favor ingresa tu DNI')
            return
        }

        // Validate DNI has exactly 8 digits
        if (dni.length !== 8) {
            setError('El DNI debe tener 8 dígitos')
            return
        }

        setError('')
        setIsSubmitting(true)

        try {
            const response = await fetch(`${API_URL}/socios/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni }),
            })
            const data = await response.json()

            if (!response.ok) {
                setError(data.message || 'No se pudo iniciar sesión')
                setIsSubmitting(false)
                return
            }

            localStorage.setItem('socio', JSON.stringify(data))
            if (recordar) {
                localStorage.setItem(DNI_STORAGE_KEY, dni)
            } else {
                localStorage.removeItem(DNI_STORAGE_KEY)
            }
            navigate('/menu')
        } catch {
            setError('No se pudo conectar con el servidor')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Background Image with Blur */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-110"
                style={{
                    backgroundImage: `url(${backgroundGym})`,
                    filter: 'blur(10px)',
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
                {/* Card */}
                <div className="w-full max-w-sm rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl px-8 py-10 animate-fade-in">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <img
                            src={logoGoodLife}
                            alt="Good Life Center"
                            className="w-24 h-24 object-contain drop-shadow-2xl"
                        />
                    </div>

                    {/* Welcome Message */}
                    <div className="text-center mb-8">
                        <h1 className="text-white text-2xl font-bold mb-2 tracking-tight drop-shadow-lg">
                            ¡Hola de nuevo!
                        </h1>
                        <p className="text-white/70 text-sm font-medium">
                            Ingresá tu DNI para empezar a entrenar
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5" noValidate>
                        {/* DNI Input */}
                        <div>
                            <label htmlFor="dni" className="sr-only">
                                DNI
                            </label>
                            <input
                                id="dni"
                                name="dni"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="username"
                                placeholder="DNI"
                                value={dni}
                                onChange={handleDniChange}
                                aria-invalid={!!error}
                                aria-describedby={error ? 'dni-error' : undefined}
                                disabled={isSubmitting}
                                className={`w-full px-6 py-4 bg-white/10 backdrop-blur-md border ${error ? 'border-red-400/80' : 'border-white/25'
                                    } rounded-2xl text-white placeholder-white/50 text-center text-lg font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-cyan-400/70 focus:border-cyan-400/70 focus:bg-white/15 transition-all duration-300 disabled:opacity-60`}
                                maxLength={8}
                            />
                            {/* Error Message */}
                            {error && (
                                <p
                                    id="dni-error"
                                    role="alert"
                                    aria-live="polite"
                                    className="text-red-300 text-sm font-medium mt-2 text-center animate-fade-in"
                                >
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Recordarme */}
                        <div className="flex items-center justify-center gap-2">
                            <input
                                id="recordar"
                                name="recordar"
                                type="checkbox"
                                checked={recordar}
                                onChange={(e) => setRecordar(e.target.checked)}
                                disabled={isSubmitting}
                                className="w-4 h-4 rounded border-white/25 bg-white/10 text-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/70 disabled:opacity-60"
                            />
                            <label htmlFor="recordar" className="text-white/70 text-sm font-medium select-none">
                                Recordarme
                            </label>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:hover:bg-cyan-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                'Ingresar'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
