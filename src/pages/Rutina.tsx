import React, { useEffect, useState, useCallback } from 'react';
import { Pencil, X, ChevronDown, ChevronRight } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RutinaProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Ejercicio {
    idEjercicio: number;
    nombre: string;
    zona: { idZona: number; nombre: string } | null;
    videoUrl: string | null;
}

const inputClass =
    'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-150';

function getUsuarioId(): string {
    return sessionStorage.getItem('currentUser') ?? '';
}

const Rutina: React.FC<RutinaProps> = ({ onLogout, onNavigate }) => {
    const usuarioId = getUsuarioId();

    const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
    const [pesosActuales, setPesosActuales] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [colapsados, setColapsados] = useState<Record<string, boolean>>({});

    const [modalEditar, setModalEditar] = useState<Ejercicio | null>(null);
    const [inputPeso, setInputPeso] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [guardadoOk, setGuardadoOk] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ejRes, pesosRes] = await Promise.all([
                fetch(`${API_URL}/ejercicios`),
                fetch(`${API_URL}/rutina/pesos-actuales?usuarioId=${encodeURIComponent(usuarioId)}`),
            ]);
            const ejs: Ejercicio[] = ejRes.ok ? await ejRes.json() : [];
            const pesos: Record<number, number> = pesosRes.ok ? await pesosRes.json() : {};
            setEjercicios(ejs);
            setPesosActuales(pesos);
        } finally {
            setLoading(false);
        }
    }, [usuarioId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const gruposPorZona = ejercicios.reduce<Record<string, Ejercicio[]>>((acc, ej) => {
        const zona = ej.zona?.nombre ?? 'Sin zona';
        if (!acc[zona]) acc[zona] = [];
        acc[zona].push(ej);
        return acc;
    }, {});

    const toggleZona = (zona: string) =>
        setColapsados(prev => ({ ...prev, [zona]: !prev[zona] }));

    const abrirEditar = (ej: Ejercicio) => {
        const actual = pesosActuales[ej.idEjercicio];
        setInputPeso(actual !== undefined ? String(actual).replace('.', ',') : '');
        setGuardadoOk(false);
        setModalEditar(ej);
    };

    const handleGuardar = async () => {
        if (!modalEditar) return;
        const peso = parseFloat(inputPeso.replace(',', '.'));
        if (isNaN(peso) || peso <= 0) return;
        setGuardando(true);
        try {
            const res = await fetch(`${API_URL}/rutina/peso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioId, ejercicioId: modalEditar.idEjercicio, peso }),
            });
            if (res.ok) {
                setPesosActuales(prev => ({ ...prev, [modalEditar.idEjercicio]: peso }));
                setGuardadoOk(true);
                setTimeout(() => setModalEditar(null), 800);
            }
        } finally {
            setGuardando(false);
        }
    };

    const handleInputPeso = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputPeso(e.target.value.replace(/[^0-9.,]/g, ''));
    };

    return (
        <>
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/rutina">
                <div className="w-full max-w-2xl">
                    <h2 className="text-xl font-bold text-gray-900 mb-5">Entrenamiento</h2>

                    {loading && <p className="text-gray-500 text-sm">Cargando ejercicios...</p>}
                    {!loading && ejercicios.length === 0 && (
                        <p className="text-gray-400 text-sm">No hay ejercicios cargados.</p>
                    )}

                    <div className="flex flex-col gap-4">
                        {Object.entries(gruposPorZona).map(([zona, ejs]) => {
                            const abierto = !colapsados[zona];
                            return (
                                <div key={zona} className="bg-white rounded-2xl shadow-card overflow-hidden animate-fadeIn">
                                    <button
                                        onClick={() => toggleZona(zona)}
                                        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <span className="font-semibold text-gray-800 text-[15px]">{zona}</span>
                                        <span className="flex items-center gap-2 text-gray-400">
                                            <span className="text-xs">{ejs.length} ejercicio{ejs.length !== 1 ? 's' : ''}</span>
                                            {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </span>
                                    </button>

                                    {abierto && (
                                        <div className="border-t border-gray-100 divide-y divide-gray-50">
                                            {ejs.map(ej => {
                                                const pesoActual = pesosActuales[ej.idEjercicio];
                                                return (
                                                    <div
                                                        key={ej.idEjercicio}
                                                        className="flex items-center px-5 py-3 gap-3 hover:bg-gray-50 transition-colors duration-100"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{ej.nombre}</p>
                                                        </div>

                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-sm font-semibold text-emerald-600 min-w-[52px] text-right">
                                                                {pesoActual !== undefined
                                                                    ? `${String(pesoActual).replace('.', ',')} kg`
                                                                    : <span className="text-gray-300 font-normal">— kg</span>
                                                                }
                                                            </span>
                                                            <button
                                                                onClick={() => abrirEditar(ej)}
                                                                title="Editar peso"
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-150"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </AppShell>

            {modalEditar && (
                <div
                    onClick={() => setModalEditar(null)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-popIn"
                    >
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="text-base font-bold text-gray-900">Editar Peso</h3>
                            <button onClick={() => setModalEditar(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">{modalEditar.nombre}</p>

                        <div className="relative mb-5">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={inputPeso}
                                onChange={handleInputPeso}
                                placeholder="0"
                                autoFocus
                                className={`${inputClass} pr-10 text-xl font-semibold text-center`}
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">kg</span>
                        </div>

                        {guardadoOk && (
                            <p className="text-emerald-600 text-sm text-center mb-3">¡Guardado!</p>
                        )}

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setModalEditar(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={guardando || !inputPeso}
                                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                                    guardando || !inputPeso ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm'
                                }`}
                            >
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Rutina;
