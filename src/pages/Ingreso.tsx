import React, { useRef, useState } from 'react';
import { LogIn, CheckCircle, XCircle, History } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const HISTORIAL_KEY = 'goodlife_ingreso_historial';
const MAX_HISTORIAL = 10;

interface IngresoProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

export interface IngresoHistorialItem {
    ok: boolean;
    nombre: string;
    apellido: string;
    clasesRestantes: number;
    mensaje: string;
    timestamp: string;
}

interface IngresoResult extends Omit<IngresoHistorialItem, 'timestamp'> {
    timestamp: Date;
}

function loadHistorial(): IngresoHistorialItem[] {
    try {
        return JSON.parse(localStorage.getItem(HISTORIAL_KEY) ?? '[]');
    } catch {
        return [];
    }
}

function saveHistorial(items: IngresoHistorialItem[]) {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(items.slice(0, MAX_HISTORIAL)));
}

const Ingreso: React.FC<IngresoProps> = ({ onLogout, onNavigate }) => {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IngresoResult | null>(null);
    const [historial, setHistorial] = useState<IngresoHistorialItem[]>(loadHistorial);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleIngreso = async () => {
        const dniTrim = dni.trim();
        if (!dniTrim) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/socios/${dniTrim}/ingreso`, { method: 'PATCH' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Error al registrar ingreso.');
            const r: IngresoResult = { ...data, timestamp: new Date() };
            setResult(r);
            if (r.ok) {
                const item: IngresoHistorialItem = { ...r, timestamp: r.timestamp.toISOString() };
                const updated = [item, ...loadHistorial()].slice(0, MAX_HISTORIAL);
                saveHistorial(updated);
                setHistorial(updated);
            }
        } catch (err: unknown) {
            setResult({ ok: false, nombre: '', apellido: '', clasesRestantes: 0, mensaje: err instanceof Error ? err.message : 'Error desconocido.', timestamp: new Date() });
        } finally {
            setLoading(false);
            setDni('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleIngreso();
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/ingreso">
            <div className="w-full max-w-lg flex flex-col gap-6 items-center pt-4">
                {/* Input card */}
                <div className="bg-white rounded-2xl shadow-card p-8 w-full animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2.5">
                        <LogIn size={22} className="text-primary-600" /> Registrar Ingreso
                    </h2>
                    <label className="text-sm font-medium text-gray-600 block mb-2">DNI del socio</label>
                    <div className="flex gap-2.5">
                        <input
                            ref={inputRef}
                            autoFocus
                            value={dni}
                            onChange={e => setDni(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ej: 12345678"
                            className="flex-1 px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-lg outline-none tracking-wide focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                        />
                        <button
                            onClick={handleIngreso}
                            disabled={loading || !dni.trim()}
                            className={`px-6 rounded-xl text-[15px] font-semibold text-white transition-all duration-150 active:scale-95 ${loading || !dni.trim() ? 'bg-primary-300 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 shadow-md shadow-primary-500/30'}`}
                        >
                            {loading ? '...' : 'Ingresar'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Presioná Enter o el botón para registrar.</p>
                </div>

                {/* Result */}
                {result && (
                    <div
                        className="bg-white rounded-2xl shadow-card p-7 w-full animate-popIn"
                        style={{ borderLeft: `5px solid ${result.ok ? '#10B981' : '#EF4444'}` }}
                    >
                        <div className="flex items-start gap-3.5">
                            {result.ok
                                ? <CheckCircle size={36} className="text-emerald-500 shrink-0 mt-0.5" />
                                : <XCircle size={36} className="text-red-500 shrink-0 mt-0.5 animate-shake" />
                            }
                            <div>
                                {result.nombre && (
                                    <p className="text-lg font-bold text-gray-900 mb-1">
                                        {result.nombre} {result.apellido}
                                    </p>
                                )}
                                <p className={`text-[15px] font-medium mb-1.5 ${result.ok ? 'text-emerald-800' : 'text-red-800'}`}>
                                    {result.mensaje}
                                </p>
                                {result.ok && (
                                    <div className={`inline-block rounded-md px-3 py-1 ${result.clasesRestantes > 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                        <span className={`text-sm font-semibold ${result.clasesRestantes > 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                                            Clases restantes: {result.clasesRestantes}
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-2">{formatTime(result.timestamp)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Historial de ingresos */}
                {historial.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-card px-6 py-5 w-full animate-fadeIn">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <History size={13} /> Últimos ingresos
                        </p>
                        <div className="flex flex-col gap-2.5">
                            {historial.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                        {`${item.nombre[0] ?? ''}${item.apellido[0] ?? ''}`.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-gray-900 truncate">{item.nombre} {item.apellido}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.clasesRestantes} clase{item.clasesRestantes !== 1 ? 's' : ''} restante{item.clasesRestantes !== 1 ? 's' : ''} · {formatTime(new Date(item.timestamp))}
                                        </p>
                                    </div>
                                    {i === 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">Ahora</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default Ingreso;
