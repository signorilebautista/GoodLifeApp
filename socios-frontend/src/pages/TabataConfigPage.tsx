import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import logoGoodLife from '../assets/logo-goodlife.png'
import backgroundGym from '../assets/background-gym.jpg'
import { loadTabataSettings } from '../utils/tabataSettings'

export default function TabataConfigPage() {
    const navigate = useNavigate()

    const [initialSettings] = useState(loadTabataSettings)
    const [prepare, setPrepare] = useState(initialSettings.prepare)
    const [work, setWork] = useState(initialSettings.work)
    const [rest, setRest] = useState(initialSettings.rest)
    const [rounds, setRounds] = useState(initialSettings.rounds)
    const [series, setSeries] = useState(initialSettings.series)
    const [restBetweenSeries, setRestBetweenSeries] = useState(initialSettings.restBetweenSeries)

    const [isSaving, setIsSaving] = useState(false)

    const handleSave = () => {
        setIsSaving(true)
        const settings = { prepare, work, rest, rounds, series, restBetweenSeries }
        localStorage.setItem('tabataSettings', JSON.stringify(settings))
        setTimeout(() => {
            navigate('/tabata')
        }, 300)
    }

    const inputClass = "w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400/70 focus:bg-white/15 transition-all duration-200"
    const labelClass = "block text-white/70 font-semibold text-sm mb-2"

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

                <div className="mb-8">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => navigate('/tabata')}
                        className="mb-3 text-white/70 font-semibold text-sm flex items-center hover:text-cyan-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg px-1 -ml-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver
                    </button>

                    <h1 className="text-2xl font-bold text-center text-white uppercase tracking-tight drop-shadow-lg">
                        Configuración
                    </h1>
                </div>

                {/* Settings Form */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 space-y-6 animate-fade-in">
                    <div>
                        <label htmlFor="prepare" className={labelClass}>Preparación (seg)</label>
                        <input
                            id="prepare"
                            type="number"
                            value={prepare}
                            onChange={(e) => setPrepare(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="work" className={labelClass}>Trabajo (seg)</label>
                        <input
                            id="work"
                            type="number"
                            value={work}
                            onChange={(e) => setWork(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="rest" className={labelClass}>Descanso (seg)</label>
                        <input
                            id="rest"
                            type="number"
                            value={rest}
                            onChange={(e) => setRest(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="rounds" className={labelClass}>Rondas</label>
                        <input
                            id="rounds"
                            type="number"
                            value={rounds}
                            onChange={(e) => setRounds(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="series" className={labelClass}>Series (Repeticiones)</label>
                        <input
                            id="series"
                            type="number"
                            value={series}
                            onChange={(e) => setSeries(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="restBetweenSeries" className={labelClass}>Descanso entre series (seg)</label>
                        <input
                            id="restBetweenSeries"
                            type="number"
                            value={restBetweenSeries}
                            onChange={(e) => setRestBetweenSeries(Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:hover:bg-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/20 transform hover:scale-[1.02] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Guardar'
                    )}
                </button>
            </div>

            <Navbar />
        </div>
    )
}
