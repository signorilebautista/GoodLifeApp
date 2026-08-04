import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'
import { loadTabataSettings } from '../utils/tabataSettings'

type TabataPhase = 'idle' | 'prepare' | 'work' | 'rest' | 'cycleRest' | 'finished'

interface WindowWithWebkitAudio {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
}

export default function TabataPage() {
    const navigate = useNavigate()

    // Timer State
    const [phase, setPhase] = useState<TabataPhase>('idle')
    const [timeLeft, setTimeLeft] = useState(0)
    const [currentRound, setCurrentRound] = useState(1)
    const [currentSeries, setCurrentSeries] = useState(1)
    const [isActive, setIsActive] = useState(false)
    const [phaseFlash, setPhaseFlash] = useState(false)

    // Settings State
    const [settings] = useState(loadTabataSettings)

    const timerRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)

    // Refs con el último valor de cada pieza de estado que la lógica de
    // transición de fase necesita leer desde dentro del callback del interval.
    const phaseRef = useRef(phase)
    const currentRoundRef = useRef(currentRound)
    const currentSeriesRef = useRef(currentSeries)
    useEffect(() => {
        phaseRef.current = phase
        currentRoundRef.current = currentRound
        currentSeriesRef.current = currentSeries
    }, [phase, currentRound, currentSeries])

    const initAudio = () => {
        if (!audioContextRef.current) {
            const win = window as unknown as WindowWithWebkitAudio
            const AudioContextClass = win.AudioContext || win.webkitAudioContext
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass()
            }
        }
    }

    const playTone = (freq: number, type: 'beep' | 'finished', duration: number = 0.1) => {
        if (!audioContextRef.current) return

        const osc = audioContextRef.current.createOscillator()
        const gain = audioContextRef.current.createGain()

        osc.connect(gain)
        gain.connect(audioContextRef.current.destination)

        if (type === 'finished') {
            osc.type = 'triangle'
        } else {
            osc.type = 'sine'
        }

        osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime)

        gain.gain.setValueAtTime(0.9, audioContextRef.current.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.00001, audioContextRef.current.currentTime + duration)

        osc.start()
        osc.stop(audioContextRef.current.currentTime + duration)
    }

    const playPhaseSound = (newPhase: TabataPhase) => {
        if (!audioContextRef.current) return

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }

        switch (newPhase) {
            case 'work':
                playTone(880, 'beep', 0.2) // High pitch for Work
                break
            case 'rest':
            case 'cycleRest':
                playTone(440, 'beep', 0.2) // Low pitch for Rest
                break
            case 'finished':
                // Simple fanfare: 3 fast beeps
                playTone(880, 'beep', 0.1)
                setTimeout(() => playTone(880, 'beep', 0.1), 150)
                setTimeout(() => playTone(1100, 'finished', 0.4), 300)
                break
            case 'prepare':
                playTone(660, 'beep', 0.1) // Prepare start sound
                break
        }
    }

    const playPhaseSoundRef = useRef(playPhaseSound)
    useEffect(() => {
        playPhaseSoundRef.current = playPhaseSound
    })

    // Beep corto para marcar los últimos 3 segundos de cada fase (3, 2, 1).
    const playTick = () => {
        if (!audioContextRef.current) return
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }
        playTone(1000, 'beep', 0.08)
    }

    const startTimer = () => {
        initAudio()
        setPhase('prepare')
        setTimeLeft(settings.prepare)
        setCurrentRound(1)
        setCurrentSeries(1)
        setIsActive(true)
        playPhaseSound('prepare')
    }

    const stopTimer = () => {
        setIsActive(false)
        setPhase('idle')
        setTimeLeft(0)
        if (timerRef.current) clearInterval(timerRef.current)
    }

    // Timer Logic: un solo interval que cuenta hacia atrás; la transición de
    // fase se calcula dentro del propio callback (no sincrónicamente en el
    // cuerpo del efecto), leyendo el estado más reciente desde los refs.
    useEffect(() => {
        if (!isActive) return

        timerRef.current = window.setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime > 1) {
                    const nextTime = prevTime - 1
                    if (nextTime <= 3 && phaseRef.current !== 'idle' && phaseRef.current !== 'finished') {
                        playTick()
                    }
                    return nextTime
                }

                const currentPhase = phaseRef.current
                let nextPhase: TabataPhase = currentPhase
                let nextTime = 0

                switch (currentPhase) {
                    case 'prepare':
                        nextPhase = 'work'
                        nextTime = settings.work
                        break
                    case 'work':
                        if (currentRoundRef.current < settings.rounds) {
                            nextPhase = 'rest'
                            nextTime = settings.rest
                        } else if (currentSeriesRef.current < settings.series) {
                            nextPhase = 'cycleRest'
                            nextTime = settings.restBetweenSeries
                        } else {
                            nextPhase = 'finished'
                        }
                        break
                    case 'rest':
                        setCurrentRound((prev) => prev + 1)
                        nextPhase = 'work'
                        nextTime = settings.work
                        break
                    case 'cycleRest':
                        setCurrentSeries((prev) => prev + 1)
                        setCurrentRound(1)
                        nextPhase = 'work'
                        nextTime = settings.work
                        break
                    default:
                        break
                }

                if (nextPhase !== currentPhase) {
                    setPhase(nextPhase)
                    playPhaseSoundRef.current(nextPhase)
                    setPhaseFlash(true)
                    setTimeout(() => setPhaseFlash(false), 500)
                    if (navigator.vibrate) navigator.vibrate(nextPhase === 'work' ? [120] : [60, 60, 60])
                }
                if (nextPhase === 'finished') {
                    setIsActive(false)
                }

                return nextTime
            })
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isActive, settings])

    // Dynamic Styles based on phase
    const getPhaseColor = () => {
        switch (phase) {
            case 'prepare': return 'border-yellow-400 text-yellow-300' // Yellow
            case 'work': return 'border-green-400 text-green-300'    // Green
            case 'rest': return 'border-red-400 text-red-300'        // Red
            case 'cycleRest': return 'border-purple-400 text-purple-300' // Purple for Series Rest
            case 'finished': return 'border-cyan-400 text-cyan-300'  // Cyan
            default: return 'border-cyan-500/60 text-white'          // Default
        }
    }

    const getPhaseLabel = () => {
        switch (phase) {
            case 'prepare': return 'PREPARAR'
            case 'work': return 'TRABAJO'
            case 'rest': return 'DESCANSO'
            case 'cycleRest': return 'DESCANSO SERIE'
            case 'finished': return 'TERMINADO'
            default: return 'LISTO'
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
                    <h1 className="text-2xl font-bold text-center text-white uppercase tracking-tight drop-shadow-lg">
                        Tabata Timer
                    </h1>

                    {/* Configuration Gear Icon (Only visible when idle) */}
                    {phase === 'idle' && (
                        <button
                            type="button"
                            onClick={() => navigate('/tabata/config')}
                            aria-label="Configurar temporizador Tabata"
                            className="absolute top-1/2 -translate-y-1/2 right-0 text-white/60 hover:text-cyan-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Timer Display */}
                <div className="flex flex-col items-center justify-center mb-12 animate-fade-in">
                    <div
                        className={`w-64 h-64 rounded-full border-8 flex items-center justify-center shadow-2xl bg-white/10 backdrop-blur-2xl relative transition-all duration-300 ${getPhaseColor()} ${phaseFlash ? 'scale-125 shadow-[0_0_70px_18px_rgba(255,255,255,0.55)]' : phase === 'work' ? 'scale-110' : ''}`}
                        role="timer"
                        aria-live="polite"
                        aria-label={`${getPhaseLabel()}, ${isActive ? timeLeft : 0} segundos restantes`}
                    >
                        {phaseFlash && (
                            <>
                                <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                                <span className="absolute -inset-3 rounded-full border-4 border-white/70 animate-ping" />
                            </>
                        )}
                        <span className="text-6xl font-bold transition-colors duration-300 tabular-nums">
                            {isActive ? timeLeft.toString().padStart(2, '0') : '00:00'}
                        </span>
                        <span className={`absolute bottom-12 font-semibold text-lg uppercase tracking-wider transition-all duration-300 ${phaseFlash ? 'text-white scale-110' : 'text-white/60'}`}>
                            {getPhaseLabel()}
                        </span>
                        {isActive && phase !== 'idle' && phase !== 'finished' && (
                            <>
                                <span className="absolute top-8 text-white/50 font-medium text-sm">
                                    RONDA {currentRound}/{settings.rounds}
                                </span>
                                <span className="absolute top-14 text-xs font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                                    SERIE {currentSeries}/{settings.series}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Start/Stop Button */}
                <button
                    type="button"
                    onClick={isActive ? stopTimer : startTimer}
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 active:scale-95 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${isActive ? 'bg-red-500 hover:bg-red-400 shadow-red-500/20' : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20'
                        }`}
                >
                    {isActive ? 'DETENER' : (phase === 'finished' ? 'REINICIAR' : 'INICIAR')}
                </button>

            </div>

            <Navbar />
        </div>
    )
}
