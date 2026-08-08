import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, X, Search, LayoutGrid, List, CalendarDays, Clock, UserPlus } from 'lucide-react';
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
    reservas: string;
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

interface Asistente {
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
}

type ViewMode = 'schedule' | 'grid' | 'list' | 'calendar';

// Grilla horaria fija: de 8:00 a 23:00, en bloques de una hora.
const SCHEDULE_HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 8..22 (hora de inicio)
const pad2 = (n: number) => String(n).padStart(2, '0');
const hourLabel = (h: number) => `${pad2(h)}:00`;
const todayISO = () => new Date().toISOString().slice(0, 10);

const DEFAULT_CUPOS = '15';

type TurnoForm = {
    dia: string;
    horario: string;
    horaFin: string;
    idSede: string;
    dniProfesor: string;
    cantReservas: string;
};

type NewTurnoForm = {
    dia: string;
    horario: string;
    horaFin: string;
    idSedes: string[];
    dniProfesor: string;
    cantReservas: string;
};

const emptyForm: TurnoForm = { dia: '', horario: '09:00', horaFin: '', idSede: '', dniProfesor: '', cantReservas: DEFAULT_CUPOS };
const emptyNewForm: NewTurnoForm = { dia: '', horario: '09:00', horaFin: '', idSedes: [], dniProfesor: '', cantReservas: DEFAULT_CUPOS };

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('schedule');
    const [searchFecha, setSearchFecha] = useState(todayISO);
    const [searchProfesor, setSearchProfesor] = useState('');

    const [asistentes, setAsistentes] = useState<Asistente[]>([]);
    const [loadingAsistentes, setLoadingAsistentes] = useState(false);
    const [asistentesError, setAsistentesError] = useState<string | null>(null);

    const [assignSlot, setAssignSlot] = useState<{ dia: string; horario: string; horaFin: string; idSede: number } | null>(null);
    const [assignProfesor, setAssignProfesor] = useState('');
    const [assignCupos, setAssignCupos] = useState(DEFAULT_CUPOS);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assigning, setAssigning] = useState(false);

    const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState<TurnoForm>(emptyForm);

    const [showNewModal, setShowNewModal] = useState(false);
    const [newForm, setNewForm] = useState<NewTurnoForm>(emptyNewForm);
    const [newFormError, setNewFormError] = useState<string | null>(null);

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

    const fetchTurnos = async (opts: { silent?: boolean; fecha?: string; profesor?: string } = {}) => {
        if (!opts.silent) setLoading(true);
        setError(null);
        try {
            const fecha = opts.fecha ?? searchFecha;
            const profesor = opts.profesor ?? searchProfesor;
            const params = new URLSearchParams();
            if (fecha) {
                params.set('desde', fecha);
                params.set('hasta', fecha);
            }
            if (profesor.trim()) params.set('profesor', profesor.trim());
            const res = await fetch(`${API_URL}/turnero?${params.toString()}`);
            if (!res.ok) throw new Error('No se pudo cargar el turnero');
            setTurnos(await res.json());
        } catch (err) {
            if (!opts.silent) setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            if (!opts.silent) setLoading(false);
        }
    };

    const fetchLookups = async () => {
        try {
            const [profRes, sedeRes] = await Promise.all([
                fetch(`${API_URL}/turnero/profesores`),
                fetch(`${API_URL}/turnero/sedes`),
            ]);
            if (profRes.ok) setProfesores(await profRes.json());
            if (sedeRes.ok) setSedes(await sedeRes.json());
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

    // Cupos en tiempo real: refresca en segundo plano cada 15s, sin pisar al admin si tiene un modal abierto.
    useEffect(() => {
        const interval = setInterval(() => {
            if (!selectedTurno && !showNewModal && !assignSlot) {
                fetchTurnos({ silent: true });
            }
        }, 15_000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchFecha, searchProfesor, selectedTurno, showNewModal, assignSlot]);

    const groupedByDia = useMemo(() => {
        const groups: Record<string, Turno[]> = {};
        for (const t of turnos) {
            const key = diaKey(t.dia);
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        }
        return groups;
    }, [turnos]);

    // La grilla "Horarios por sede" fijaba las filas en 8..22 (SCHEDULE_HOURS): un turno
    // creado fuera de ese rango (ej. 23:00, o 07:00) se guardaba bien pero nunca aparecía
    // ahí porque esa vista nunca llegaba a iterar esa hora. Extendemos las filas con
    // cualquier hora que ya tenga un turno real ese día, además del rango fijo.
    const scheduleHours = useMemo(() => {
        const dia = searchFecha || todayISO();
        const horasConTurno = turnos
            .filter((t) => diaKey(t.dia) === dia)
            .map((t) => Number(t.horario.slice(0, 2)))
            .filter((h) => !Number.isNaN(h));
        return Array.from(new Set([...SCHEDULE_HOURS, ...horasConTurno])).sort((a, b) => a - b);
    }, [turnos, searchFecha]);

    const openDetail = (turno: Turno) => {
        setSelectedTurno(turno);
        setEditMode(false);
        fetchAsistentes(turno);
    };

    const closeDetail = () => {
        setSelectedTurno(null);
        setEditMode(false);
        setAsistentes([]);
        setAsistentesError(null);
    };

    const fetchAsistentes = async (turno: Turno) => {
        setLoadingAsistentes(true);
        setAsistentesError(null);
        try {
            const params = new URLSearchParams({
                dia: diaKey(turno.dia),
                horario: turno.horario,
                idSede: String(turno.idSede),
            });
            const res = await fetch(`${API_URL}/turnero/asistentes?${params.toString()}`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de asistentes');
            setAsistentes(await res.json());
        } catch (err) {
            setAsistentesError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoadingAsistentes(false);
        }
    };

    const startEdit = (turno: Turno) => {
        setEditForm({
            dia: diaKey(turno.dia),
            horario: turno.horario,
            horaFin: turno.horaFin ?? '',
            idSede: String(turno.idSede),
            dniProfesor: turno.profesorDni ?? '',
            cantReservas: turno.cantReservas ?? DEFAULT_CUPOS,
        });
        setEditMode(true);
    };

    const newFormValid = !!newForm.dia && !!newForm.horario && newForm.idSedes.length > 0;

    const handleCreate = async () => {
        if (!newForm.dia || !newForm.horario) {
            setNewFormError('Completá la fecha y la hora de entrada.');
            return;
        }
        if (newForm.idSedes.length === 0) {
            setNewFormError('Elegí al menos una sede.');
            return;
        }
        setNewFormError(null);

        const results = await Promise.allSettled(
            newForm.idSedes.map((idSede) =>
                fetch(`${API_URL}/turnero`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        dia: newForm.dia,
                        horario: newForm.horario,
                        horaFin: newForm.horaFin || undefined,
                        idSede: Number(idSede),
                        dniProfesor: newForm.dniProfesor || undefined,
                        cantReservas: newForm.cantReservas || DEFAULT_CUPOS,
                    }),
                }).then(async (res) => {
                    if (!res.ok) {
                        const sedeNombre = sedes.find((s) => String(s.idSede) === idSede)?.nombreSede ?? idSede;
                        throw new Error(`${sedeNombre}: ${await extractErrorMessage(res, 'no se pudo crear el turno')}`);
                    }
                }),
            ),
        );

        const fallidas = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
        const exitosas = results.length - fallidas.length;

        if (exitosas === 0) {
            setNewFormError(fallidas.map((f) => (f.reason instanceof Error ? f.reason.message : 'Error desconocido')).join(' · '));
            return;
        }

        // Al menos un turno se creó: cerramos el modal y sincronizamos el filtro
        // vigente con la fecha/profesor del turno nuevo, para que no quede "invisible"
        // detrás del buscador (causa raíz del bug: se creaba bien pero no se veía).
        const nuevaFecha = newForm.dia;
        let nuevoProfesorFiltro = searchProfesor;
        if (searchProfesor.trim()) {
            const profesorCreado = profesores.find((p) => p.dni === newForm.dniProfesor);
            const nombreCompleto = profesorCreado ? `${profesorCreado.nombre} ${profesorCreado.apellido}`.toLowerCase() : '';
            if (!newForm.dniProfesor || !nombreCompleto.includes(searchProfesor.trim().toLowerCase())) {
                nuevoProfesorFiltro = '';
            }
        }

        setShowNewModal(false);
        setNewForm(emptyNewForm);
        setSearchFecha(nuevaFecha);
        setSearchProfesor(nuevoProfesorFiltro);
        await fetchTurnos({ fecha: nuevaFecha, profesor: nuevoProfesorFiltro });

        if (fallidas.length > 0) {
            setNotice(null);
            setError(`Se crearon ${exitosas} de ${results.length} turnos. Fallaron: ${fallidas.map((f) => (f.reason instanceof Error ? f.reason.message : 'error desconocido')).join(' · ')}`);
        } else {
            setNotice(`Turno creado. Mostrando turnos del ${formatDia(nuevaFecha)}.`);
            setTimeout(() => setNotice(null), 5000);
        }
    };

    const openAssign = (dia: string, hour: number, idSede: number) => {
        setAssignSlot({ dia, horario: `${hourLabel(hour)}:00`, horaFin: `${hourLabel(hour + 1)}:00`, idSede });
        setAssignProfesor('');
        setAssignCupos(DEFAULT_CUPOS);
        setAssignError(null);
    };

    const closeAssign = () => {
        setAssignSlot(null);
        setAssignError(null);
    };

    const handleAssign = async () => {
        if (!assignSlot || !assignProfesor) {
            setAssignError('Elegí un profesor para asignar el turno.');
            return;
        }
        setAssigning(true);
        setAssignError(null);
        try {
            const res = await fetch(`${API_URL}/turnero`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dia: assignSlot.dia,
                    horario: assignSlot.horario,
                    horaFin: assignSlot.horaFin,
                    idSede: assignSlot.idSede,
                    dniProfesor: assignProfesor,
                    cantReservas: assignCupos || DEFAULT_CUPOS,
                }),
            });
            if (!res.ok) throw new Error(await extractErrorMessage(res, 'No se pudo asignar el turno'));
            closeAssign();
            fetchTurnos();
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setAssigning(false);
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
                    dniProfesor: editForm.dniProfesor || undefined,
                    cantReservas: editForm.cantReservas || DEFAULT_CUPOS,
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

    const cuposLabel = (t: Turno) => {
        const cupo = Number(t.cantReservas ?? 0);
        const ocupados = Number(t.reservas ?? 0);
        const libres = cupo - ocupados;
        if (cupo <= 0) return 'Sin cupo configurado';
        if (libres <= 0) return 'Lleno';
        return `${libres}/${cupo} cupos libres`;
    };

    const cuposColorClass = (t: Turno) => {
        const cupo = Number(t.cantReservas ?? 0);
        const ocupados = Number(t.reservas ?? 0);
        const libres = cupo - ocupados;
        if (cupo <= 0) return 'text-gray-400';
        if (libres <= 0) return 'text-red-600';
        if (libres <= Math.max(2, cupo * 0.2)) return 'text-amber-600';
        return 'text-emerald-600';
    };

    const findTurnoSlot = (dia: string, hour: number, idSede: number) =>
        turnos.find((t) => diaKey(t.dia) === dia && t.horario.slice(0, 2) === pad2(hour) && t.idSede === idSede);

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
                <span className={`text-sm font-semibold min-w-[130px] text-right ${cuposColorClass(t)}`}>{cuposLabel(t)}</span>
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
                            ['schedule', Clock, 'Horarios por sede'],
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
                            setNewFormError(null);
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

                {notice && (
                    <div className="w-full max-w-6xl mb-4 text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-lg text-sm animate-fadeIn">
                        {notice}
                    </div>
                )}

                <div className="w-full max-w-6xl">
                    {viewMode === 'schedule' ? (
                        <div className="grid gap-4 animate-fadeIn" style={{ gridTemplateColumns: `repeat(${Math.max(sedes.length, 1)}, minmax(240px, 1fr))` }}>
                            {sedes.length === 0 ? (
                                <p className="text-gray-600">No hay sedes cargadas.</p>
                            ) : (
                                sedes.map((sede) => (
                                    <div key={sede.idSede} className="bg-white rounded-2xl shadow-card p-4">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 text-center">{sede.nombreSede}</h3>
                                        <div className="flex flex-col gap-1.5">
                                            {scheduleHours.map((hour) => {
                                                const dia = searchFecha || todayISO();
                                                const t = findTurnoSlot(dia, hour, sede.idSede);
                                                return t ? (
                                                    <button
                                                        key={hour}
                                                        onClick={() => openDetail(t)}
                                                        className="flex flex-col px-3 py-2 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors duration-150 text-left"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-gray-900">{hourLabel(hour)}</span>
                                                            <span className="text-xs text-gray-700 truncate ml-2">{profesorLabel(t)}</span>
                                                        </div>
                                                        <span className={`text-[11px] font-semibold mt-0.5 ${cuposColorClass(t)}`}>{cuposLabel(t)}</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        key={hour}
                                                        onClick={() => openAssign(dia, hour, sede.idSede)}
                                                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors duration-150 text-left group"
                                                    >
                                                        <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600">{hourLabel(hour)}</span>
                                                        <UserPlus size={14} className="text-gray-300 group-hover:text-primary-500" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : loading ? (
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
                                    <p className={`text-sm font-semibold m-0 mt-1 ${cuposColorClass(t)}`}>{cuposLabel(t)}</p>
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
                                                <span className={`block text-[11px] font-semibold ${cuposColorClass(t)}`}>{cuposLabel(t)}</span>
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
                                    <p className="m-0">
                                        <strong>Cupos:</strong> {selectedTurno.reservas ?? '0'} / {selectedTurno.cantReservas ?? '0'} ocupados
                                        {' — '}
                                        <span className={cuposColorClass(selectedTurno)}>{cuposLabel(selectedTurno)}</span>
                                    </p>
                                </div>

                                <div className="mb-7">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                                        Asistirían ({asistentes.length})
                                    </p>
                                    {loadingAsistentes ? (
                                        <p className="text-sm text-gray-400">Cargando...</p>
                                    ) : asistentesError ? (
                                        <p className="text-sm text-red-600">{asistentesError}</p>
                                    ) : asistentes.length === 0 ? (
                                        <p className="text-sm text-gray-400">Todavía nadie reservó este turno.</p>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                            {asistentes.map((a) => (
                                                <div key={a.dni} className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2">
                                                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[11px] font-semibold">
                                                        {`${a.nombre[0] ?? ''}${a.apellido[0] ?? ''}`.toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[13px] font-semibold text-gray-900 truncate">{a.nombre} {a.apellido}</p>
                                                        <p className="text-[11px] text-gray-500">DNI {a.dni}{a.telefono ? ` · ${a.telefono}` : ''}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div>
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
                                    <div>
                                        <label className={labelClass}>Cupos</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={editForm.cantReservas}
                                            onChange={(e) => setEditForm({ ...editForm, cantReservas: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
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

            {/* Assign Profesor Modal (grilla horaria) */}
            {assignSlot && (
                <div
                    onClick={closeAssign}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-2xl animate-popIn"
                    >
                        <button onClick={closeAssign} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200">
                            <X size={22} />
                        </button>

                        <h2 className="text-xl font-bold text-gray-900 mb-1">Asignar turno</h2>
                        <p className="text-sm text-gray-500 mb-5 capitalize">
                            {formatDia(assignSlot.dia)} · {assignSlot.horario.slice(0, 5)} - {assignSlot.horaFin.slice(0, 5)} · {sedes.find(s => s.idSede === assignSlot.idSede)?.nombreSede}
                        </p>

                        <div className="mb-4">
                            <label className={labelClass}>Profesor</label>
                            <select
                                value={assignProfesor}
                                onChange={(e) => setAssignProfesor(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Seleccionar profesor</option>
                                {profesores.map((p) => (
                                    <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-2">
                            <label className={labelClass}>Cupos</label>
                            <input
                                type="number"
                                min={0}
                                value={assignCupos}
                                onChange={(e) => setAssignCupos(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        {assignError && (
                            <p className="text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-sm mt-3 animate-shake">
                                {assignError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={closeAssign} className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150">
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={assigning}
                                className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-60"
                            >
                                {assigning ? 'Asignando...' : 'Asignar'}
                            </button>
                        </div>
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
                            <label className={labelClass}>Fecha *</label>
                            <input
                                type="date"
                                required
                                value={newForm.dia}
                                onChange={(e) => setNewForm({ ...newForm, dia: e.target.value })}
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className={labelClass}>Hora de entrada *</label>
                                <input
                                    type="time"
                                    required
                                    step={3600}
                                    value={newForm.horario}
                                    onChange={(e) => setNewForm({ ...newForm, horario: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hora de salida</label>
                                <input
                                    type="time"
                                    step={3600}
                                    value={newForm.horaFin}
                                    onChange={(e) => setNewForm({ ...newForm, horaFin: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className={labelClass}>Profesor (opcional)</label>
                                <select
                                    value={newForm.dniProfesor}
                                    onChange={(e) => setNewForm({ ...newForm, dniProfesor: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Sin profesor (asignar después)</option>
                                    {profesores.map((p) => (
                                        <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Cupos</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={newForm.cantReservas}
                                    onChange={(e) => setNewForm({ ...newForm, cantReservas: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className={labelClass}>Sedes (podés elegir más de una)</label>
                            {sedes.length === 0 ? (
                                <p className="text-sm text-gray-400">No hay sedes cargadas.</p>
                            ) : (
                                <div className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3">
                                    {sedes.map((s) => {
                                        const checked = newForm.idSedes.includes(String(s.idSede));
                                        return (
                                            <label key={s.idSede} className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        const idSede = String(s.idSede);
                                                        setNewForm((f) => ({
                                                            ...f,
                                                            idSedes: e.target.checked
                                                                ? [...f.idSedes, idSede]
                                                                : f.idSedes.filter((id) => id !== idSede),
                                                        }));
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary"
                                                />
                                                {s.nombreSede}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {newFormError && (
                            <p className="text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-sm mt-3 animate-shake">
                                {newFormError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-7">
                            <button onClick={() => setShowNewModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150">
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newFormValid}
                                className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
                            >
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
