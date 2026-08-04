import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogIn, CheckCircle, XCircle, History, Users, RefreshCw } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const EN_CURSO_POLL_MS = 60_000;
const HISTORIAL_POLL_MS = 60_000;

interface SocioEnCurso {
    dni: string;
    nombre: string;
    apellido: string;
    idSede: number;
    nombreSede: string;
    horario: string;
    horaFin: string | null;
}

interface IngresoProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

export interface IngresoHistorialItem {
    ok: boolean;
    dni?: string;
    nombre: string;
    apellido: string;
    clasesRestantes: number;
    mensaje: string;
    timestamp: string;
}

interface IngresoResult extends Omit<IngresoHistorialItem, 'timestamp'> {
    timestamp: Date;
}

interface IngresoReciente {
    dni: string;
    nombre: string;
    apellido: string;
    fecha: string;
    nombreSede: string | null;
}

interface Sede {
    idSede: number;
    nombreSede: string;
}

const Ingreso: React.FC<IngresoProps> = ({ onLogout, onNavigate }) => {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IngresoResult | null>(null);
    const [historial, setHistorial] = useState<IngresoReciente[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const [enCurso, setEnCurso] = useState<SocioEnCurso[]>([]);
    const [loadingEnCurso, setLoadingEnCurso] = useState(true);
    const [ingresandoDni, setIngresandoDni] = useState<string | null>(null);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [showSedeModal, setShowSedeModal] = useState(false);
    const [sedeSeleccionada, setSedeSeleccionada] = useState('');
    const [dniPendiente, setDniPendiente] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchEnCurso = useCallback(async () => {
        setLoadingEnCurso(true);
        try {
            const res = await fetch(`${API_URL}/turnero/en-curso`);
            if (res.ok) setEnCurso(await res.json());
        } catch {
            // se reintenta en el próximo poll
        } finally {
            setLoadingEnCurso(false);
        }
    }, []);

    const fetchHistorial = useCallback(async () => {
        setLoadingHistorial(true);
        try {
            const res = await fetch(`${API_URL}/socios/ingresos/recientes`);
            if (res.ok) setHistorial(await res.json());
        } catch {
            // se reintenta en el próximo poll
        } finally {
            setLoadingHistorial(false);
        }
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/turnero/sedes`)
            .then(res => res.ok ? res.json() : [])
            .then(setSedes)
            .catch(() => setSedes([]));
    }, []);

    useEffect(() => {
        fetchEnCurso();
        const interval = setInterval(fetchEnCurso, EN_CURSO_POLL_MS);
        return () => clearInterval(interval);
    }, [fetchEnCurso]);

    useEffect(() => {
        fetchHistorial();
        const interval = setInterval(fetchHistorial, HISTORIAL_POLL_MS);
        return () => clearInterval(interval);
    }, [fetchHistorial]);

    const handleIngreso = async (dniParam?: string, idSede?: number) => {
        const dniTrim = (dniParam ?? dni).trim();
        if (!dniTrim) return;
        if (dniParam) setIngresandoDni(dniParam);
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/socios/${dniTrim}/ingreso`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idSede }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Error al registrar ingreso.');
            const r: IngresoResult = { ...data, dni: dniTrim, timestamp: new Date() };
            setResult(r);
            if (r.ok) {
                fetchHistorial();
            }
        } catch (err: unknown) {
            setResult({ ok: false, dni: dniTrim, nombre: '', apellido: '', clasesRestantes: 0, mensaje: err instanceof Error ? err.message : 'Error desconocido.', timestamp: new Date() });
        } finally {
            setLoading(false);
            setIngresandoDni(null);
            setDni('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const abrirSelectorSede = (dniParam?: string) => {
        const dniTrim = (dniParam ?? dni).trim();
        if (!dniTrim) return;
        setDniPendiente(dniTrim);
        setSedeSeleccionada(sedes.length === 1 ? String(sedes[0].idSede) : '');
        setShowSedeModal(true);
    };

    const confirmarSedeYRegistrar = () => {
        if (!sedeSeleccionada) return;
        setShowSedeModal(false);
        handleIngreso(dniPendiente, Number(sedeSeleccionada));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') abrirSelectorSede();
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const formatFecha = (d: Date) => {
        const hoy = new Date();
        const esHoy = d.toDateString() === hoy.toDateString();
        const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        return esHoy ? hora : `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} · ${hora}`;
    };

    const formatHorario = (h: string) => h.slice(0, 5);

    const yaIngreso = (dniSocio: string) => historial.some(h => h.dni === dniSocio);

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/ingreso">
            <div className="w-full max-w-lg flex flex-col gap-6 items-center pt-4">
                {/* Socios con turno ahora */}
                <div className="bg-white rounded-2xl shadow-card p-7 w-full animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                            <Users size={20} className="text-primary-600" /> Con turno ahora
                        </h2>
                        <button
                            onClick={fetchEnCurso}
                            disabled={loadingEnCurso}
                            title="Actualizar"
                            className="text-gray-400 hover:text-primary-600 transition-colors duration-150 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loadingEnCurso ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loadingEnCurso && enCurso.length === 0 ? (
                        <p className="text-sm text-gray-400">Cargando...</p>
                    ) : enCurso.length === 0 ? (
                        <p className="text-sm text-gray-400">Nadie tiene un turno activo en este momento.</p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {enCurso.map((s) => {
                                const checkeado = yaIngreso(s.dni);
                                return (
                                    <div
                                        key={`${s.dni}-${s.idSede}-${s.horario}`}
                                        className="flex items-center gap-3 border border-gray-100 rounded-xl px-3.5 py-2.5"
                                    >
                                        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                            {`${s.nombre[0] ?? ''}${s.apellido[0] ?? ''}`.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-semibold text-gray-900 truncate">{s.nombre} {s.apellido}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {s.nombreSede} · {formatHorario(s.horario)}{s.horaFin ? ` - ${formatHorario(s.horaFin)}` : ''}hs
                                            </p>
                                        </div>
                                        {checkeado ? (
                                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1 shrink-0 flex items-center gap-1">
                                                <CheckCircle size={12} /> Ingresó
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleIngreso(s.dni, s.idSede)}
                                                disabled={loading}
                                                className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors duration-150 disabled:opacity-60"
                                            >
                                                {ingresandoDni === s.dni ? '...' : 'Marcar ingreso'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

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
                            onClick={() => abrirSelectorSede()}
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

                {/* Historial de ingresos (últimas 24hs) */}
                <div className="bg-white rounded-2xl shadow-card px-6 py-5 w-full animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                            <History size={13} /> Ingresos de las últimas 24hs
                        </p>
                        <button
                            onClick={fetchHistorial}
                            disabled={loadingHistorial}
                            title="Actualizar"
                            className="text-gray-400 hover:text-primary-600 transition-colors duration-150 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loadingHistorial ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loadingHistorial && historial.length === 0 ? (
                        <p className="text-sm text-gray-400">Cargando...</p>
                    ) : historial.length === 0 ? (
                        <p className="text-sm text-gray-400">No hay ingresos registrados en las últimas 24hs.</p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {historial.map((item, i) => (
                                <div key={`${item.dni}-${item.fecha}`} className="flex items-center gap-3">
                                    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                        {`${item.nombre[0] ?? ''}${item.apellido[0] ?? ''}`.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-gray-900 truncate">{item.nombre} {item.apellido}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {formatFecha(new Date(item.fecha))}{item.nombreSede ? ` · ${item.nombreSede}` : ''}
                                        </p>
                                    </div>
                                    {i === 0 && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 shrink-0">Reciente</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selector de sucursal antes de registrar el ingreso */}
            {showSedeModal && (
                <div
                    onClick={() => setShowSedeModal(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-7 w-full max-w-xs shadow-2xl animate-popIn"
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-1">¿En qué sucursal?</h3>
                        <p className="text-sm text-gray-500 mb-4">DNI {dniPendiente}</p>
                        <select
                            autoFocus
                            value={sedeSeleccionada}
                            onChange={(e) => setSedeSeleccionada(e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-xl text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all duration-150 mb-4"
                        >
                            <option value="">Elegí una sucursal</option>
                            {sedes.map((s) => (
                                <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                            ))}
                        </select>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setShowSedeModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-colors duration-150"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarSedeYRegistrar}
                                disabled={!sedeSeleccionada || loading}
                                className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors duration-150"
                            >
                                {loading ? '...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Ingreso;
