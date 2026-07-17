import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, X, Search, LayoutGrid, List, CalendarDays } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TurneroProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Turno {
    dia: string;
    horario: string;
    horaFin: string | null;
    idSede: number;
    sede: string | null;
    estado: boolean | null;
    cantReservas: string | null;
    idActividad: number | null;
    actividad: string | null;
    profesorDni: string | null;
    profesorNombre: string | null;
    profesorApellido: string | null;
}

interface Profesor {
    dni: string;
    nombre: string;
    apellido: string;
}

interface Sede {
    idSede: number;
    nombreSede: string;
}

interface Actividad {
    idActividad: number;
    actividad: string;
}

type ViewMode = 'grid' | 'list' | 'calendar';

type TurnoForm = {
    dia: string;
    horario: string;
    horaFin: string;
    idSede: string;
    idActividad: string;
    dniProfesor: string;
};

const emptyForm: TurnoForm = { dia: '', horario: '09:00', horaFin: '', idSede: '', idActividad: '', dniProfesor: '' };

const formatDia = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const diaKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1.5';

const Turnero: React.FC<TurneroProps> = ({ onLogout, onNavigate }) => {
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [profesores, setProfesores] = useState<Profesor[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [searchFecha, setSearchFecha] = useState('');
    const [searchProfesor, setSearchProfesor] = useState('');

    const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<TurnoForm>(emptyForm);

    const [showNewModal, setShowNewModal] = useState(false);
    const [newForm, setNewForm] = useState<TurnoForm>(emptyForm);

    const extractErrorMessage = async (res: Response, fallback: string): Promise<string> => {
        try {
            const body = await res.json();
            if (typeof body?.message === 'string') return body.message;
            if (Array.isArray(body?.message)) return body.message.join(', ');
        } catch {
            // response had no JSON body
        }
        return fallback;
    };

    const fetchTurnos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchFecha) {
                params.set('desde', searchFecha);
                params.set('hasta', searchFecha);
            }
            if (searchProfesor.trim()) params.set('profesor', searchProfesor.trim());
            const res = await fetch(`${API_URL}/turnero?${params.toString()}`);
            if (!res.ok) throw new Error('No se pudo cargar el turnero');
            setTurnos(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const [profRes, sedeRes, actRes] = await Promise.all([
                fetch(`${API_URL}/turnero/profesores`),
                fetch(`${API_URL}/turnero/sedes`),
                fetch(`${API_URL}/turnero/actividades`),
            ]);
            if (profRes.ok) setProfesores(await profRes.json());
            if (sedeRes.ok) setSedes(await sedeRes.json());
            if (actRes.ok) setActividades(await actRes.json());
        } catch {
            // listas auxiliares; si fallan, los selectores quedan vacíos
        }
    };

    useEffect(() => {
        fetchLookups();
    }, []);

    useEffect(() => {
        fetchTurnos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchFecha, searchProfesor]);

    const groupedByDia = useMemo(() => {
        const groups: Record<string, Turno[]> = {};
        for (const t of turnos) {
            const key = diaKey(t.dia);
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        }
        return groups;
    }, [turnos]);

    const openDetail = (turno: Turno) => {
        setSelectedTurno(turno);
        setEditMode(false);
    };

    const closeDetail = () => {
        setSelectedTurno(null);
        setEditMode(false);
    };

    const startEdit = (turno: Turno) => {
        setEditForm({
            dia: diaKey(turno.dia),
            horario: turno.horario,
            horaFin: turno.horaFin ?? '',
            idSede: String(turno.idSede),
            idActividad: String(turno.idActividad ?? ''),
            dniProfesor: turno.profesorDni ?? '',
        });
        setEditMode(true);
    };

    const handleCreate = async () => {
        try {
            const res = await fetch(`${API_URL}/turnero`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dia: newForm.dia,
                    horario: newForm.horario,
                    horaFin: newForm.horaFin || undefined,
                    idSede: Number(newForm.idSede),
                    idActividad: Number(newForm.idActividad),
                    dniProfesor: newForm.dniProfesor,
                }),
            });
            if (!res.ok) throw new Error(await extractErrorMessage(res, 'No se pudo crear el turno'));
            setShowNewModal(false);
            setNewForm(emptyForm);
            fetchTurnos();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    };

    const handleUpdate = async () => {
        if (!selectedTurno) return;
        try {
            const res = await fetch(`${API_URL}/turnero`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    oldDia: diaKey(selectedTurno.dia),
                    oldHorario: selectedTurno.horario,
                    oldIdSede: selectedTurno.idSede,
                    dia: editForm.dia,
                    horario: editForm.horario,
                    horaFin: editForm.horaFin || undefined,
                    idSede: Number(editForm.idSede),
                    idActividad: Number(editForm.idActividad),
                    dniProfesor: editForm.dniProfesor,
                }),
            });
            if (!res.ok) throw new Error(await extractErrorMessage(res, 'No se pudo modificar el turno'));
            closeDetail();
            fetchTurnos();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    };

    const handleDelete = async (turno: Turno) => {
        try {
            const params = new URLSearchParams({
                dia: diaKey(turno.dia),
                horario: turno.horario,
                idSede: String(turno.idSede),
            });
            const res = await fetch(`${API_URL}/turnero?${params.toString()}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await extractErrorMessage(res, 'No se pudo eliminar el turno'));
            closeDetail();
            fetchTurnos();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    };

    const profesorLabel = (t: Turno) =>
        t.profesorNombre ? `${t.profesorNombre} ${t.profesorApellido ?? ''}`.trim() : 'Sin profesor';

    const horarioLabel = (t: Turno) =>
        t.horaFin ? `${t.horario.slice(0, 5)} - ${t.horaFin.slice(0, 5)}` : t.horario.slice(0, 5);

    const renderTurnoCard = (t: Turno, index = 0) => (
        <div
            key={`${t.dia}-${t.horario}-${t.idSede}`}
            onClick={() => openDetail(t)}
            className="flex items-center justify-between px-5 py-4 border-2 border-gray-900 rounded-xl bg-white cursor-pointer hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-200 animate-fadeIn"
            style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
        >
            <div className="flex gap-10 items-center flex-1">
                <span className="text-lg font-semibold text-gray-900 min-w-[110px]">
                    {horarioLabel(t)}
                </span>
                <span className="text-[15px] text-gray-900 flex-1">Profe: {profesorLabel(t)}</span>
                <span className="text-[15px] text-gray-900 min-w-[140px]">Sede: {t.sede ?? '-'}</span>
            </div>
        </div>
    );

    return (
        <>
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/turnero">
                {/* Toolbar */}
                <div className="flex gap-3 mb-6 items-center flex-wrap w-full max-w-6xl animate-fadeIn">
                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-card focus-within:ring-2 focus-within:ring-primary transition-all duration-150">
                        <Calendar size={18} className="text-gray-400 shrink-0" />
                        <input
                            type="date"
                            value={searchFecha}
                            onChange={(e) => setSearchFecha(e.target.value)}
                            className="outline-none text-sm bg-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-[220px] shadow-card focus-within:ring-2 focus-within:ring-primary transition-all duration-150">
                        <Search size={18} className="text-gray-400 shrink-0" />
                        <input
                            value={searchProfesor}
                            onChange={(e) => setSearchProfesor(e.target.value)}
                            placeholder="Buscar por profesor..."
                            className="outline-none text-sm flex-1 bg-transparent"
                        />
                    </div>

                    <div className="flex gap-1 bg-white rounded-lg p-1 shadow-card">
                        {([
                            ['grid', LayoutGrid, 'Vista grilla'],
                            ['list', List, 'Vista lista'],
                            ['calendar', CalendarDays, 'Vista calendario'],
                        ] as [ViewMode, typeof LayoutGrid, string][]).map(([mode, Icon, title]) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                title={title}
                                className={`px-2.5 py-1.5 rounded-md transition-all duration-150 flex items-center ${viewMode === mode ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <Icon size={18} />
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setNewForm(f => ({ ...f, idActividad: f.idActividad || String(actividades[0]?.idActividad ?? '') }));
                            setShowNewModal(true);
                        }}
                        className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow transition-all duration-150"
                    >
                        Nuevo Horario
                    </button>
                </div>

                {error && (
                    <div className="w-full max-w-6xl mb-4 text-red-700 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg text-sm animate-shake">
                        {error}
                    </div>
                )}

                <div className="w-full max-w-6xl">
                    {loading ? (
                        <p className="text-gray-600">Cargando turnos...</p>
                    ) : turnos.length === 0 ? (
                        <p className="text-gray-600">No se encontraron turnos.</p>
                    ) : viewMode === 'list' ? (
                        <div className="bg-white rounded-2xl shadow-card p-6 w-full animate-fadeIn">
                            {Object.entries(groupedByDia).map(([key, apps], i) => (
                                <div key={key} className={i < Object.keys(groupedByDia).length - 1 ? 'mb-8' : ''}>
                                    <h3 className="text-base font-semibold text-gray-900 mb-4 capitalize">
                                        {formatDia(apps[0].dia)}
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {apps.map((t, idx) => renderTurnoCard(t, idx))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                            {turnos.map((t, index) => (
                                <div
                                    key={`${t.dia}-${t.horario}-${t.idSede}`}
                                    onClick={() => openDetail(t)}
                                    className="bg-white rounded-xl shadow-card hover:shadow-card-hover p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                                >
                                    <p className="text-[13px] text-gray-500 capitalize m-0">{formatDia(t.dia)}</p>
                                    <p className="text-xl font-bold text-gray-900 my-1.5">{horarioLabel(t)}</p>
                                    <p className="text-sm text-gray-700 m-0">Profe: {profesorLabel(t)}</p>
                                    <p className="text-sm text-gray-700 m-0">Sede: {t.sede ?? '-'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                            {Object.entries(groupedByDia).map(([key, apps], gi) => (
                                <div
                                    key={key}
                                    className="bg-white rounded-xl shadow-card p-4 animate-fadeIn"
                                    style={{ animationDelay: `${Math.min(gi, 10) * 40}ms` }}
                                >
                                    <p className="font-bold text-gray-900 mb-2.5 capitalize">{formatDia(apps[0].dia)}</p>
                                    <div className="flex flex-col gap-1.5">
                                        {apps.map((t) => (
                                            <button
                                                key={`${t.dia}-${t.horario}-${t.idSede}`}
                                                onClick={() => openDetail(t)}
                                                className="text-left border border-gray-200 rounded-lg px-2.5 py-1.5 text-[13px] bg-transparent hover:bg-primary-50 hover:border-primary-200 transition-colors duration-150"
                                            >
                                                <strong>{horarioLabel(t)}</strong> — {profesorLabel(t)} ({t.sede ?? '-'})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AppShell>

            {/* Detail / Edit Modal */}
            {selectedTurno && (
                <div
                    onClick={closeDetail}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-lg w-full relative shadow-2xl animate-popIn"
                    >
                        <button onClick={closeDetail} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200">
                            <X size={22} />
                        </button>

                        {!editMode ? (
                            <>
                                <h2 className="text-xl font-bold text-gray-900 mb-5 capitalize">
                                    {formatDia(selectedTurno.dia)}
                                </h2>
                                <div className="flex flex-col gap-2.5 mb-7 text-[15px] text-gray-900">
                                    <p className="m-0"><strong>Horario:</strong> {horarioLabel(selectedTurno)}</p>
                                    <p className="m-0"><strong>Profesor:</strong> {profesorLabel(selectedTurno)}</p>
                                    <p className="m-0"><strong>Sede:</strong> {selectedTurno.sede ?? '-'}</p>
                                    <p className="m-0"><strong>Actividad:</strong> {selectedTurno.actividad ?? '-'}</p>
                                    <p className="m-0"><strong>Cant. Reservas:</strong> {selectedTurno.cantReservas ?? '0'}</p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => handleDelete(selectedTurno)}
                                        className="bg-red-500 hover:bg-red-600 active:scale-95 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => startEdit(selectedTurno)}
                                        className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                                    >
                                        Modificar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-gray-900 mb-5">Modificar Turno</h2>

                                <div className="mb-4">
                                    <label className={labelClass}>Fecha</label>
                                    <input
                                        type="date"
                                        value={editForm.dia}
                                        onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className={labelClass}>Hora de entrada</label>
                                        <input
                                            type="time"
                                            value={editForm.horario}
                                            onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Hora de salida</label>
                                        <input
                                            type="time"
                                            value={editForm.horaFin}
                                            onChange={(e) => setEditForm({ ...editForm, horaFin: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className={labelClass}>Profesor</label>
                                    <select
                                        value={editForm.dniProfesor}
                                        onChange={(e) => setEditForm({ ...editForm, dniProfesor: e.target.value })}
                                        className={inputClass}
                                    >
                                        <option value="">Sin profesor</option>
                                        {profesores.map((p) => (
                                            <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className={labelClass}>Sede</label>
                                    <select
                                        value={editForm.idSede}
                                        onChange={(e) => setEditForm({ ...editForm, idSede: e.target.value })}
                                        className={inputClass}
                                    >
                                        {sedes.map((s) => (
                                            <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setEditMode(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150">
                                        Cancelar
                                    </button>
                                    <button onClick={handleUpdate} className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150">
                                        Guardar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* New Turno Modal */}
            {showNewModal && (
                <div
                    onClick={() => setShowNewModal(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-lg w-full relative shadow-2xl animate-popIn"
                    >
                        <button onClick={() => setShowNewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200">
                            <X size={22} />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-6">Nuevo Horario</h2>

                        <div className="mb-4">
                            <label className={labelClass}>Fecha</label>
                            <input
                                type="date"
                                value={newForm.dia}
                                onChange={(e) => setNewForm({ ...newForm, dia: e.target.value })}
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className={labelClass}>Hora de entrada</label>
                                <input
                                    type="time"
                                    value={newForm.horario}
                                    onChange={(e) => setNewForm({ ...newForm, horario: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hora de salida</label>
                                <input
                                    type="time"
                                    value={newForm.horaFin}
                                    onChange={(e) => setNewForm({ ...newForm, horaFin: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className={labelClass}>Profesor</label>
                            <select
                                value={newForm.dniProfesor}
                                onChange={(e) => setNewForm({ ...newForm, dniProfesor: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">Seleccionar profesor</option>
                                {profesores.map((p) => (
                                    <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className={labelClass}>Sede</label>
                            <select
                                value={newForm.idSede}
                                onChange={(e) => setNewForm({ ...newForm, idSede: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">Seleccionar sede</option>
                                {sedes.map((s) => (
                                    <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-7">
                            <button onClick={() => setShowNewModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150">
                                Cancelar
                            </button>
                            <button onClick={handleCreate} className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150">
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Turnero;
