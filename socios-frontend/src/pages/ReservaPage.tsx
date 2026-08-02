import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

type Turno = {
    horario: string
    horaFin: string
    cantReservas: number
    reservas: number
    profesorNombre: string | null
    profesorApellido: string | null
}

export default function ReservaPage() {
    const navigate = useNavigate()
    const today = new Date()
    const [selectedSede, setSelectedSede] = useState('')
    const [currentDate, setCurrentDate] = useState(today)
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
    const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
    const selectedDayRef = useRef<HTMLButtonElement | null>(null)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [bookingError, setBookingError] = useState('')
    const [turnos, setTurnos] = useState<Turno[]>([])
    const [loadingTurnos, setLoadingTurnos] = useState(false)

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const days = []
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i)
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' })
            days.push({ number: i, name: dayName.charAt(0).toUpperCase() + dayName.slice(1) })
        }
        return days
    }

    const getSelectedDateStr = () => {
        if (!selectedDay) return ''
        const y = currentDate.getFullYear()
        const m = String(currentDate.getMonth() + 1).padStart(2, '0')
        const d = String(selectedDay).padStart(2, '0')
        return `${y}-${m}-${d}`
    }

    useEffect(() => {
        if (!selectedSede || !selectedDay) {
            setTurnos([])
            return
        }
        setLoadingTurnos(true)
        setSelectedTurno(null)
        const dia = getSelectedDateStr()
        fetch(`${API_URL}/turnero/disponibles?idSede=${selectedSede}&dia=${dia}`)
            .then(r => r.json())
            .then(data => setTurnos(Array.isArray(data) ? data : []))
            .catch(() => setTurnos([]))
            .finally(() => setLoadingTurnos(false))
    }, [selectedSede, selectedDay, currentDate])

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        setSelectedDay(null)
        setSelectedTurno(null)
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        setSelectedDay(null)
        setSelectedTurno(null)
    }

    const handleDaySelect = (day: number) => {
        setSelectedDay(day)
        setSelectedTurno(null)
    }

    const handleTurnoSelect = (turno: Turno) => {
        if (!selectedDay || !selectedSede) return
        setSelectedTurno(turno)
        setBookingError('')
        setShowConfirmModal(true)
    }

    const handleConfirmBooking = async () => {
        if (!selectedSede || !selectedDay || !selectedTurno) return

        const socioRaw = localStorage.getItem('socio')
        const socio = socioRaw ? JSON.parse(socioRaw) : null
        if (!socio?.DNI) {
            setBookingError('No se encontró tu sesión. Volvé a iniciar sesión.')
            return
        }

        setBookingError('')
        setIsConfirming(true)

        const dia = getSelectedDateStr()

        try {
            const response = await fetch(`${API_URL}/turnero/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: String(socio.DNI), idSede: Number(selectedSede), dia, horario: selectedTurno.horario }),
            })

            if (!response.ok) {
                const data = await response.json()
                setBookingError(data.message || 'No se pudo guardar la reserva')
                setIsConfirming(false)
                return
            }

            setIsConfirming(false)
            setShowConfirmModal(false)
            navigate('/menu')
        } catch {
            setBookingError('No se pudo conectar con el servidor')
            setIsConfirming(false)
        }
    }

    const days = getDaysInMonth(currentDate)
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long' })
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    const year = currentDate.getFullYear()

    const formatHora = (h: string) => h?.slice(0, 5)

    const profesorLabel = (t: Turno) =>
        t.profesorNombre ? `${t.profesorNombre} ${t.profesorApellido ?? ''}`.trim() : null

    useEffect(() => {
        selectedDayRef.current?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' })
    }, [selectedDay, currentDate])

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 pb-28">
            <div
                className="absolute inset-0 bg-cover bg-center scale-110"
                style={{ backgroundImage: `url(${backgroundGym})`, filter: 'blur(10px)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950" />

            <div className="relative z-10 px-6 pt-12">
                <div className="flex justify-center mb-6">
                    <img src={logoGoodLife} alt="Good Life Center" className="w-16 h-16 object-contain drop-shadow-xl" />
                </div>

                <h1 className="text-2xl font-bold text-center text-white mb-8 uppercase tracking-tight drop-shadow-lg">
                    Reservar clase
                </h1>

                {/* Sede Selection */}
                <div className="mb-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-lg p-5 animate-fade-in">
                    <label htmlFor="sede" className="block text-center font-bold text-white/80 text-sm mb-3">
                        Selecciona una sede
                    </label>
                    <div className="relative">
                        <select
                            id="sede"
                            name="sede"
                            value={selectedSede}
                            onChange={(e) => setSelectedSede(e.target.value)}
                            className="w-full bg-white/10 border border-white/25 text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/70 appearance-none text-center transition-all duration-200 [&>option]:text-gray-900"
                        >
                            <option value="">Elige una sede</option>
                            <option value="1">AV. Poeta Lugones 64</option>
                            <option value="2">San Luis 145 3H</option>
                        </select>
                    </div>
                </div>

                {/* Date Selection */}
                <div className="mb-8 animate-slide-up">
                    <div className="flex justify-center items-center gap-4 mb-4">
                        <button type="button" onClick={prevMonth} aria-label="Mes anterior"
                            className="text-white font-bold text-xl w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                            &lt;
                        </button>
                        <div className="text-center w-32">
                            <div className="font-semibold text-white">{capitalizedMonth}</div>
                            <div className="font-medium text-white/50 text-sm">{year}</div>
                        </div>
                        <button type="button" onClick={nextMonth} aria-label="Mes siguiente"
                            className="text-white font-bold text-xl w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                            &gt;
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-1">
                        {days.map((day) => {
                            const isSelected = selectedDay === day.number
                            return (
                                <button
                                    key={day.number}
                                    ref={isSelected ? selectedDayRef : undefined}
                                    type="button"
                                    onClick={() => handleDaySelect(day.number)}
                                    aria-pressed={isSelected}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border flex-shrink-0 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 w-14 h-20 ${isSelected
                                        ? 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-110'
                                        : 'bg-white/10 backdrop-blur-md border-white/15 hover:border-cyan-400/40'}`}
                                >
                                    <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>{day.number}</span>
                                    <span className={`text-xs ${isSelected ? 'text-white font-semibold' : 'text-white/50'}`}>{day.name}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Time Slots */}
                <h3 className="text-center text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Horarios disponibles</h3>

                {!selectedSede || !selectedDay ? (
                    <p className="text-center text-white/40 text-sm">Seleccioná una sede y un día para ver los turnos.</p>
                ) : loadingTurnos ? (
                    <p className="text-center text-white/40 text-sm">Cargando turnos...</p>
                ) : turnos.length === 0 ? (
                    <p className="text-center text-white/40 text-sm">No hay turnos disponibles para este día.</p>
                ) : (
                    <div className="space-y-3 animate-slide-up">
                        {turnos.map((turno) => {
                            const lleno = Number(turno.reservas) >= Number(turno.cantReservas)
                            return (
                                <button
                                    key={turno.horario}
                                    type="button"
                                    onClick={() => !lleno && handleTurnoSelect(turno)}
                                    disabled={lleno}
                                    className={`w-full rounded-2xl p-4 text-center border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${lleno
                                        ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                        : 'bg-white/10 backdrop-blur-md border-white/15 text-white hover:bg-white/15 hover:border-cyan-400/40'}`}
                                >
                                    <p className="font-semibold">
                                        {formatHora(turno.horario)}hs — {formatHora(turno.horaFin)}hs
                                    </p>
                                    {profesorLabel(turno) && (
                                        <p className="text-sm mt-1 text-cyan-300/90 font-medium">
                                            Profe: {profesorLabel(turno)}
                                        </p>
                                    )}
                                    <p className="text-sm mt-1 text-white/50">
                                        {lleno ? 'Turno completo' : `${Number(turno.cantReservas) - Number(turno.reservas)} lugares disponibles`}
                                    </p>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <Navbar />

            {/* Confirmation Modal */}
            {showConfirmModal && selectedTurno && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4"
                    role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 p-6 w-[90%] max-w-[300px] shadow-2xl animate-scale-in text-center">
                        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 id="confirm-title" className="text-xl font-bold text-white mb-2">Confirmar Reserva</h3>
                        <p className="text-white/60 mb-4 text-sm">
                            ¿Reservar el turno de las {formatHora(selectedTurno.horario)}hs para el día {selectedDay}/{currentDate.getMonth() + 1}
                            {profesorLabel(selectedTurno) ? ` con ${profesorLabel(selectedTurno)}` : ''}?
                        </p>
                        {bookingError && (
                            <p role="alert" aria-live="polite" className="text-red-300 text-sm font-medium mb-4">{bookingError}</p>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button type="button"
                                onClick={() => { setShowConfirmModal(false); setBookingError('') }}
                                disabled={isConfirming}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
                                No
                            </button>
                            <button type="button" onClick={handleConfirmBooking} disabled={isConfirming}
                                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2 min-w-[64px]">
                                {isConfirming ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Sí'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
