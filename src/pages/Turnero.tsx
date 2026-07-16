import React, { useEffect, useMemo, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, X, Search, LayoutGrid, List, CalendarDays, UserPlus, LogIn, GraduationCap, Home } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TurneroProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Turno {
    dia: string;
    horario: string;
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
    idSede: string;
    idActividad: string;
    dniProfesor: string;
};

const emptyForm: TurnoForm = { dia: '', horario: '09:00', idSede: '', idActividad: '', dniProfesor: '' };

const formatDia = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const diaKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

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

    const menuItems = [
        { icon: Home, label: 'Menú', active: false },
        { icon: Users, label: 'Socios', active: false },
        { icon: Calendar, label: 'Turnero', active: true },
        { icon: LogIn, label: 'Ingreso', active: false },
        { icon: FileText, label: 'Planes', active: false },
        { icon: BarChart3, label: 'Estadísticas', active: false },
        { icon: GraduationCap, label: 'Profesores', active: false },
        { icon: UserPlus, label: 'Agregar', active: false },
        { icon: Settings, label: 'Configuraciones', active: false },
    ];

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

    const renderTurnoCard = (t: Turno) => (
        <div
            key={`${t.dia}-${t.horario}-${t.idSede}`}
            onClick={() => openDetail(t)}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: '2px solid #111827',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827', minWidth: '60px' }}>
                    {t.horario.slice(0, 5)}
                </span>
                <span style={{ fontSize: '16px', color: '#111827', flex: 1 }}>Profe: {profesorLabel(t)}</span>
                <span style={{ fontSize: '16px', color: '#111827', minWidth: '140px' }}>Sede: {t.sede ?? '-'}</span>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ backgroundColor: '#1976D2', height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <aside style={{ width: '220px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #D1D5DB' }}>
                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.label === 'Turnero') return;
                                    if (item.label === 'Socios') onNavigate('/socios');
                                    else if (item.label === 'Planes') onNavigate('/planes');
                                    else if (item.label === 'Estadísticas') onNavigate('/estadisticas');
                                    else if (item.label === 'Ingreso') onNavigate('/ingreso');
                                    else if (item.label === 'Profesores') onNavigate('/profesores');
                                    else if (item.label === 'Agregar') onNavigate('/crear-cuenta');
                                    else if (item.label === 'Configuraciones') onNavigate('/configuraciones');
                                    else onNavigate('/menu-principal');
                                }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                                    color: '#374151', backgroundColor: item.active ? '#F3F4F6' : 'transparent', border: 'none',
                                    cursor: 'pointer', fontSize: '16px', textAlign: 'left',
                                }}
                                onMouseEnter={(e) => !item.active && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                                onMouseLeave={(e) => !item.active && (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button
                            onClick={onLogout}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                <main style={{ flex: 1, backgroundColor: '#E5E7EB', padding: '24px', overflowY: 'auto' }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Fecha search */}
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '6px', padding: '6px 12px', gap: '8px' }}>
                            <Calendar size={18} color="#6B7280" />
                            <input
                                type="date"
                                value={searchFecha}
                                onChange={(e) => setSearchFecha(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: '14px' }}
                            />
                        </div>

                        {/* Profesor search */}
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '6px', padding: '6px 12px', gap: '8px', flex: 1, minWidth: '220px' }}>
                            <Search size={18} color="#6B7280" />
                            <input
                                value={searchProfesor}
                                onChange={(e) => setSearchProfesor(e.target.value)}
                                placeholder="Buscar por profesor..."
                                style={{ border: 'none', outline: 'none', fontSize: '14px', flex: 1 }}
                            />
                        </div>

                        {/* View toggle */}
                        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'white', borderRadius: '6px', padding: '4px' }}>
                            {([
                                ['grid', LayoutGrid, 'Vista grilla'],
                                ['list', List, 'Vista lista'],
                                ['calendar', CalendarDays, 'Vista calendario'],
                            ] as [ViewMode, typeof LayoutGrid, string][]).map(([mode, Icon, title]) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    title={title}
                                    style={{
                                        padding: '6px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                                        backgroundColor: viewMode === mode ? '#424242' : 'transparent',
                                        color: viewMode === mode ? 'white' : '#374151', display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    <Icon size={18} />
                                </button>
                            ))}
                        </div>

                        {/* Nuevo Horario */}
                        <button
                            onClick={() => setShowNewModal(true)}
                            style={{ backgroundColor: '#424242', color: 'white', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#424242'}
                        >
                            Nuevo Horario
                        </button>
                    </div>

                    {error && (
                        <div style={{ marginBottom: '16px', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '10px 16px', borderRadius: '6px' }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <p style={{ color: '#374151' }}>Cargando turnos...</p>
                    ) : turnos.length === 0 ? (
                        <p style={{ color: '#374151' }}>No se encontraron turnos.</p>
                    ) : viewMode === 'list' ? (
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%' }}>
                            {Object.entries(groupedByDia).map(([key, apps], i) => (
                                <div key={key} style={{ marginBottom: i < Object.keys(groupedByDia).length - 1 ? '32px' : 0 }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: 0, textTransform: 'capitalize' }}>
                                        {formatDia(apps[0].dia)}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {apps.map(renderTurnoCard)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                            {turnos.map((t) => (
                                <div
                                    key={`${t.dia}-${t.horario}-${t.idSede}`}
                                    onClick={() => openDetail(t)}
                                    style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', cursor: 'pointer' }}
                                >
                                    <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', textTransform: 'capitalize' }}>{formatDia(t.dia)}</p>
                                    <p style={{ margin: '6px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>{t.horario.slice(0, 5)}</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>Profe: {profesorLabel(t)}</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>Sede: {t.sede ?? '-'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                            {Object.entries(groupedByDia).map(([key, apps]) => (
                                <div key={key} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <p style={{ margin: '0 0 10px 0', fontWeight: '700', color: '#111827', textTransform: 'capitalize' }}>{formatDia(apps[0].dia)}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {apps.map((t) => (
                                            <button
                                                key={`${t.dia}-${t.horario}-${t.idSede}`}
                                                onClick={() => openDetail(t)}
                                                style={{ textAlign: 'left', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '6px 10px', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                <strong>{t.horario.slice(0, 5)}</strong> â€” {profesorLabel(t)} ({t.sede ?? '-'})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Detail / Edit Modal */}
            {selectedTurno && (
                <div onClick={closeDetail} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', position: 'relative' }}>
                        <button onClick={closeDetail} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                            <X size={24} />
                        </button>

                        {!editMode ? (
                            <>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: 0, marginBottom: '20px', textTransform: 'capitalize' }}>
                                    {formatDia(selectedTurno.dia)}
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', fontSize: '16px', color: '#111827' }}>
                                    <p style={{ margin: 0 }}><strong>Horario:</strong> {selectedTurno.horario.slice(0, 5)}</p>
                                    <p style={{ margin: 0 }}><strong>Profesor:</strong> {profesorLabel(selectedTurno)}</p>
                                    <p style={{ margin: 0 }}><strong>Sede:</strong> {selectedTurno.sede ?? '-'}</p>
                                    <p style={{ margin: 0 }}><strong>Actividad:</strong> {selectedTurno.actividad ?? '-'}</p>
                                    <p style={{ margin: 0 }}><strong>Cant. Reservas:</strong> {selectedTurno.cantReservas ?? '0'}</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button
                                        onClick={() => handleDelete(selectedTurno)}
                                        style={{ backgroundColor: '#EF4444', color: 'white', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => startEdit(selectedTurno)}
                                        style={{ backgroundColor: '#424242', color: 'white', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Modificar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: 0, marginBottom: '20px' }}>Modificar Turno</h2>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Fecha</label>
                                    <input
                                        type="date"
                                        value={editForm.dia}
                                        onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Horario</label>
                                    <input
                                        type="time"
                                        value={editForm.horario}
                                        onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Profesor</label>
                                    <select
                                        value={editForm.dniProfesor}
                                        onChange={(e) => setEditForm({ ...editForm, dniProfesor: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                    >
                                        <option value="">Sin profesor</option>
                                        {profesores.map((p) => (
                                            <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Sede</label>
                                    <select
                                        value={editForm.idSede}
                                        onChange={(e) => setEditForm({ ...editForm, idSede: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                    >
                                        {sedes.map((s) => (
                                            <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button onClick={() => setEditMode(false)} style={{ backgroundColor: '#E5E7EB', color: '#111827', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                                        Cancelar
                                    </button>
                                    <button onClick={handleUpdate} style={{ backgroundColor: '#424242', color: 'white', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
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
                <div onClick={() => setShowNewModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', position: 'relative' }}>
                        <button onClick={() => setShowNewModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', marginTop: 0 }}>Nuevo Horario</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Fecha</label>
                            <input
                                type="date"
                                value={newForm.dia}
                                onChange={(e) => setNewForm({ ...newForm, dia: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Horario</label>
                            <input
                                type="time"
                                value={newForm.horario}
                                onChange={(e) => setNewForm({ ...newForm, horario: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Profesor</label>
                            <select
                                value={newForm.dniProfesor}
                                onChange={(e) => setNewForm({ ...newForm, dniProfesor: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                            >
                                <option value="">Seleccionar profesor</option>
                                {profesores.map((p) => (
                                    <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Sede</label>
                            <select
                                value={newForm.idSede}
                                onChange={(e) => setNewForm({ ...newForm, idSede: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                            >
                                <option value="">Seleccionar sede</option>
                                {sedes.map((s) => (
                                    <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Actividad</label>
                            <select
                                value={newForm.idActividad}
                                onChange={(e) => setNewForm({ ...newForm, idActividad: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                            >
                                <option value="">Seleccionar actividad</option>
                                {actividades.map((a) => (
                                    <option key={a.idActividad} value={a.idActividad}>{a.actividad}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowNewModal(false)} style={{ backgroundColor: '#E5E7EB', color: '#111827', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                                Cancelar
                            </button>
                            <button onClick={handleCreate} style={{ backgroundColor: '#424242', color: 'white', padding: '10px 24px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Turnero;

