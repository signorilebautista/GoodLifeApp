import React, { useEffect, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, Plus, UserPlus, X, Trash2, ChevronLeft, LogIn, GraduationCap, Save, PlayCircle, ChevronDown, ChevronUp, Home } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlanesProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Socio {
    dni: string;
    nombre: string;
    apellido: string;
    direccion: string | null;
    mail: string | null;
    telefono: string | null;
    idMembresia: number | null;
    clasesRestantes: string | null;
    plan: string | null;
    deuda: string | null;
}

interface EjercicioDB {
    idEjercicio: number;
    nombre: string;
    videoUrl: string | null;
    zona: { idZona: number; nombre: string } | null;
}

interface Exercise {
    uid: number;
    idEjercicio: number;
    name: string;
    reps: string;
    series: string;
    videoUrl: string | null;
}

interface Block {
    uid: number;
    name: string;
    exercises: Exercise[];
}

interface DayPlan {
    uid: number;
    label: string;
    blocks: Block[];
}

const menuItems = [
    { icon: Home, label: 'Menú', path: '/menu-principal' },
    { icon: Users, label: 'Socios', path: '/socios' },
    { icon: Calendar, label: 'Turnero', path: '/turnero' },
    { icon: LogIn, label: 'Ingreso', path: '/ingreso' },
    { icon: FileText, label: 'Planes', path: '/planes' },
    { icon: BarChart3, label: 'Estadísticas', path: '/estadisticas' },
    { icon: GraduationCap, label: 'Profesores', path: '/profesores' },
    { icon: UserPlus, label: 'Agregar', path: '/crear-cuenta' },
    { icon: Settings, label: 'Configuraciones', path: '/configuraciones' },
];

let uid = 100;
const nextUid = () => uid++;

const makeDays = (): DayPlan[] => [
    { uid: nextUid(), label: 'Día 1', blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] },
    { uid: nextUid(), label: 'Día 2', blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] },
];

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 10px', border: '1px solid #9CA3AF',
    borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box',
};

const Planes: React.FC<PlanesProps> = ({ onLogout, onNavigate }) => {
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loadingSocios, setLoadingSocios] = useState(true);
    const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
    const [ejerciciosDB, setEjerciciosDB] = useState<EjercicioDB[]>([]);

    // Plan state (persisted per socio)
    const [days, setDays] = useState<DayPlan[]>([]);
    const [selectedDayUid, setSelectedDayUid] = useState<number | null>(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [openVideos, setOpenVideos] = useState<Set<number>>(new Set());

    const toggleVideo = (uid: number) =>
        setOpenVideos(prev => { const s = new Set(prev); s.has(uid) ? s.delete(uid) : s.add(uid); return s; });

    // Day editing
    const [editingDayUid, setEditingDayUid] = useState<number | null>(null);
    const [editingDayLabel, setEditingDayLabel] = useState('');

    // Block editing
    const [editingBlockUid, setEditingBlockUid] = useState<number | null>(null);
    const [editingBlockName, setEditingBlockName] = useState('');

    // Exercise modal
    const [showExModal, setShowExModal] = useState(false);
    const [exTargetBlockUid, setExTargetBlockUid] = useState<number | null>(null);
    const [exZonaId, setExZonaId] = useState('');
    const [exEjercicioId, setExEjercicioId] = useState('');
    const [exReps, setExReps] = useState('12');
    const [exSeries, setExSeries] = useState('4');

    const selectedDay = days.find(d => d.uid === selectedDayUid) ?? null;
    const previewEjercicio = ejerciciosDB.find(e => String(e.idEjercicio) === exEjercicioId) ?? null;

    const zonas = Array.from(
        new Map(ejerciciosDB.filter(e => e.zona).map(e => [e.zona!.idZona, e.zona!])).values()
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const ejerciciosFiltrados = exZonaId
        ? ejerciciosDB.filter(e => e.zona && String(e.zona.idZona) === exZonaId)
        : [];

    useEffect(() => {
        fetch(`${API_URL}/socios`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Socio[]) => { setSocios(data); setLoadingSocios(false); })
            .catch(() => setLoadingSocios(false));
        fetch(`${API_URL}/ejercicios`)
            .then(r => r.ok ? r.json() : [])
            .then(setEjerciciosDB)
            .catch(() => {});
    }, []);

    const selectSocio = async (s: Socio) => {
        setSelectedSocio(s);
        setEditingDayUid(null);
        setEditingBlockUid(null);
        setSaveStatus(null);
        setOpenVideos(new Set());
        setPlanLoading(true);
        try {
            const res = await fetch(`${API_URL}/socios/${s.dni}/plan`);
            const data = res.ok ? await res.json() : null;
            if (data && Array.isArray(data.days) && data.days.length > 0) {
                const loadedDays: DayPlan[] = data.days.map((d: { label: string; blocks: { name: string; exercises: { idEjercicio: number; name: string; series: string; reps: string; videoUrl: string | null }[] }[] }) => ({
                    uid: nextUid(),
                    label: d.label,
                    blocks: d.blocks.map((b: { name: string; exercises: { idEjercicio: number; name: string; series: string; reps: string; videoUrl: string | null }[] }) => ({
                        uid: nextUid(),
                        name: b.name,
                        exercises: b.exercises.map((e: { idEjercicio: number; name: string; series: string; reps: string; videoUrl: string | null }) => ({ ...e, uid: nextUid() })),
                    })),
                }));
                setDays(loadedDays);
                setSelectedDayUid(loadedDays[0].uid);
            } else {
                const initialDays = makeDays();
                setDays(initialDays);
                setSelectedDayUid(initialDays[0].uid);
            }
        } catch {
            const initialDays = makeDays();
            setDays(initialDays);
            setSelectedDayUid(initialDays[0].uid);
        } finally {
            setPlanLoading(false);
        }
    };

    const backToList = () => {
        setSelectedSocio(null);
        setDays([]);
        setSelectedDayUid(null);
        setSaveStatus(null);
    };

    const savePlan = async () => {
        if (!selectedSocio) return;
        setSaveLoading(true);
        setSaveStatus(null);
        try {
            const planData = {
                days: days.map(d => ({
                    label: d.label,
                    blocks: d.blocks.map(b => ({
                        name: b.name,
                        exercises: b.exercises.map(e => ({
                            idEjercicio: e.idEjercicio,
                            name: e.name,
                            series: e.series,
                            reps: e.reps,
                            videoUrl: e.videoUrl,
                        })),
                    })),
                })),
            };
            const res = await fetch(`${API_URL}/socios/${selectedSocio.dni}/plan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planData }),
            });
            if (!res.ok) throw new Error('Error al guardar');
            setSaveStatus({ msg: 'Plan guardado.', ok: true });
        } catch {
            setSaveStatus({ msg: 'Error al guardar el plan.', ok: false });
        } finally {
            setSaveLoading(false);
        }
    };

    const toEmbedUrl = (url: string) => {
        const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
        return m ? `https://www.youtube.com/embed/${m[1]}` : url;
    };

    // Day operations
    const addDay = () => {
        const newDay: DayPlan = { uid: nextUid(), label: `Día ${days.length + 1}`, blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] };
        setDays(prev => [...prev, newDay]);
        setSelectedDayUid(newDay.uid);
    };

    const deleteDay = (dayUid: number) => {
        setDays(prev => {
            const next = prev.filter(d => d.uid !== dayUid);
            if (selectedDayUid === dayUid) setSelectedDayUid(next[0]?.uid ?? null);
            return next;
        });
    };

    const commitDayLabel = () => {
        if (editingDayUid === null) return;
        setDays(prev => prev.map(d => d.uid === editingDayUid ? { ...d, label: editingDayLabel || d.label } : d));
        setEditingDayUid(null);
    };

    // Block operations
    const addBlock = () => {
        if (!selectedDay) return;
        const newBlock: Block = { uid: nextUid(), name: `Bloque ${selectedDay.blocks.length + 1}`, exercises: [] };
        setDays(prev => prev.map(d => d.uid === selectedDayUid ? { ...d, blocks: [...d.blocks, newBlock] } : d));
    };

    const deleteBlock = (blockUid: number) => {
        setDays(prev => prev.map(d => d.uid === selectedDayUid
            ? { ...d, blocks: d.blocks.filter(b => b.uid !== blockUid) } : d));
    };

    const commitBlockName = () => {
        if (editingBlockUid === null) return;
        setDays(prev => prev.map(d => d.uid === selectedDayUid
            ? { ...d, blocks: d.blocks.map(b => b.uid === editingBlockUid ? { ...b, name: editingBlockName || b.name } : b) }
            : d));
        setEditingBlockUid(null);
    };

    // Exercise operations
    const openExModal = (blockUid: number) => {
        setExTargetBlockUid(blockUid);
        setExZonaId('');
        setExEjercicioId('');
        setExReps('12');
        setExSeries('4');
        setShowExModal(true);
    };

    const confirmAddExercise = () => {
        const ejDB = ejerciciosDB.find(e => String(e.idEjercicio) === exEjercicioId);
        if (!ejDB || exTargetBlockUid === null) return;
        const newEx: Exercise = { uid: nextUid(), idEjercicio: ejDB.idEjercicio, name: ejDB.nombre, reps: exReps, series: exSeries, videoUrl: ejDB.videoUrl };
        setDays(prev => prev.map(d => d.uid === selectedDayUid
            ? { ...d, blocks: d.blocks.map(b => b.uid === exTargetBlockUid ? { ...b, exercises: [...b.exercises, newEx] } : b) }
            : d));
        setShowExModal(false);
    };

    const deleteExercise = (blockUid: number, exUid: number) => {
        setDays(prev => prev.map(d => d.uid === selectedDayUid
            ? { ...d, blocks: d.blocks.map(b => b.uid === blockUid ? { ...b, exercises: b.exercises.filter(e => e.uid !== exUid) } : b) }
            : d));
    };

    const sidebar = (
        <aside style={{ width: '220px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #D1D5DB' }}>
            <nav style={{ flex: 1, padding: '8px 0' }}>
                {menuItems.map(item => (
                    <button key={item.label} onClick={() => item.path !== '/planes' && onNavigate(item.path)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                            color: item.path === '/planes' ? '#1976D2' : '#374151',
                            backgroundColor: item.path === '/planes' ? '#EFF6FF' : 'transparent',
                            border: 'none', cursor: item.path === '/planes' ? 'default' : 'pointer',
                            fontSize: '16px', textAlign: 'left', fontWeight: item.path === '/planes' ? '600' : '400',
                        }}
                        onMouseEnter={e => { if (item.path !== '/planes') e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                        onMouseLeave={e => { if (item.path !== '/planes') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <div style={{ borderTop: '1px solid #D1D5DB' }}>
                <button onClick={onLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );

    // VIEW: socios list
    if (!selectedSocio) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <header style={{ backgroundColor: '#1976D2', height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>GOOD LIFE CENTER</h1>
                    </div>
                </header>
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {sidebar}
                    <main style={{ flex: 1, backgroundColor: '#E5E7EB', padding: '28px', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 20px 0' }}>Ejercicios</h2>
                        {loadingSocios ? (
                            <p style={{ color: '#6B7280' }}>Cargando socios...</p>
                        ) : socios.length === 0 ? (
                            <p style={{ color: '#6B7280' }}>Sin socios registrados.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', maxWidth: '960px' }}>
                                {socios.map(s => (
                                    <button key={s.dni} onClick={() => selectSocio(s)}
                                        style={{
                                            backgroundColor: 'white', borderRadius: '10px', padding: '18px 20px',
                                            display: 'flex', alignItems: 'center', gap: '14px',
                                            border: '2px solid transparent', cursor: 'pointer', textAlign: 'left', width: '100%',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'border-color 0.15s, transform 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#1976D2'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ADE80,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>ðŸ‘¤</div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{s.nombre} {s.apellido}</p>
                                            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{s.plan ?? 'Sin plan'}</p>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                {s.clasesRestantes != null && (
                                                    <span style={{ fontSize: '11px', backgroundColor: '#EFF6FF', color: '#1976D2', borderRadius: '4px', padding: '1px 6px' }}>
                                                        {s.clasesRestantes} clases
                                                    </span>
                                                )}
                                                {s.deuda != null && Number(s.deuda) > 0 && (
                                                    <span style={{ fontSize: '11px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '4px', padding: '1px 6px' }}>
                                                        Deuda ${Math.abs(Number(s.deuda)).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        );
    }

    // VIEW: plan editor for selected socio
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ backgroundColor: '#1976D2', height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>GOOD LIFE CENTER</h1>
                </div>
            </header>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {sidebar}
                <main style={{ flex: 1, backgroundColor: '#E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Plan header */}
                    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #D1D5DB', padding: '14px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                            <button onClick={backToList}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px', padding: 0 }}>
                                <ChevronLeft size={18} /> Volver
                            </button>
                            <div style={{ flex: 1 }} />
                            {saveStatus && (
                                <span style={{ fontSize: '13px', color: saveStatus.ok ? '#16A34A' : '#DC2626', padding: '4px 10px', background: saveStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>
                                    {saveStatus.msg}
                                </span>
                            )}
                            <button onClick={savePlan} disabled={saveLoading || planLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: saveLoading ? '#9CA3AF' : '#1976D2', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                <Save size={15} /> {saveLoading ? 'Guardando...' : 'Guardar Plan'}
                            </button>
                            <div style={{ width: '1px', height: '20px', backgroundColor: '#D1D5DB' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ADE80,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>ðŸ‘¤</div>
                                <div>
                                    <p style={{ fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 }}>{selectedSocio.nombre} {selectedSocio.apellido}</p>
                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>DNI {selectedSocio.dni}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {[
                                ['Membresía', selectedSocio.plan ?? 'Sin membresía'],
                                ['Clases restantes', selectedSocio.clasesRestantes ?? '0'],
                                ['Deuda', selectedSocio.deuda != null ? `$${Math.abs(Number(selectedSocio.deuda)).toLocaleString()}` : '$0'],
                                ['Mail', selectedSocio.mail ?? 'â€”'],
                                ['Teléfono', selectedSocio.telefono ?? 'â€”'],
                            ].map(([label, value]) => (
                                <div key={label} style={{ backgroundColor: '#F3F4F6', borderRadius: '6px', padding: '6px 12px' }}>
                                    <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>{label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Days column */}
                        <div style={{ width: '150px', backgroundColor: '#F9FAFB', borderRight: '1px solid #D1D5DB', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                            {days.map(day => (
                                <div key={day.uid} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {editingDayUid === day.uid ? (
                                        <input
                                            autoFocus value={editingDayLabel}
                                            onChange={e => setEditingDayLabel(e.target.value)}
                                            onBlur={commitDayLabel}
                                            onKeyDown={e => e.key === 'Enter' && commitDayLabel()}
                                            style={{ flex: 1, padding: '7px 8px', borderRadius: '6px', border: '1px solid #1976D2', fontSize: '13px' }}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => setSelectedDayUid(day.uid)}
                                            onDoubleClick={() => { setEditingDayUid(day.uid); setEditingDayLabel(day.label); }}
                                            title="Doble click para renombrar"
                                            style={{
                                                flex: 1, padding: '9px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                                fontSize: '13px', fontWeight: '500', textAlign: 'center',
                                                backgroundColor: selectedDayUid === day.uid ? '#1976D2' : '#E5E7EB',
                                                color: selectedDayUid === day.uid ? 'white' : '#374151',
                                            }}>
                                            {day.label}
                                        </button>
                                    )}
                                    <button onClick={() => deleteDay(day.uid)} title="Eliminar día"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex', flexShrink: 0 }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addDay}
                                style={{ padding: '8px', borderRadius: '6px', border: '1px dashed #9CA3AF', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Plus size={13} /> Día
                            </button>
                        </div>

                        {/* Blocks & exercises */}
                        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {planLoading ? (
                                <p style={{ color: '#6B7280' }}>Cargando plan...</p>
                            ) : !selectedDay ? (
                                <p style={{ color: '#6B7280' }}>Seleccioná un día.</p>
                            ) : (
                                <>
                                    {selectedDay.blocks.map(block => (
                                        <div key={block.uid}>
                                            {/* Block header */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                {editingBlockUid === block.uid ? (
                                                    <input
                                                        autoFocus value={editingBlockName}
                                                        onChange={e => setEditingBlockName(e.target.value)}
                                                        onBlur={commitBlockName}
                                                        onKeyDown={e => e.key === 'Enter' && commitBlockName()}
                                                        style={{ fontSize: '16px', fontWeight: 'bold', border: '1px solid #1976D2', borderRadius: '4px', padding: '4px 8px' }}
                                                    />
                                                ) : (
                                                    <h3
                                                        onDoubleClick={() => { setEditingBlockUid(block.uid); setEditingBlockName(block.name); }}
                                                        title="Doble click para renombrar"
                                                        style={{ fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0, cursor: 'pointer' }}>
                                                        {block.name}
                                                    </h3>
                                                )}
                                                <button onClick={() => openExModal(block.uid)} title="Agregar ejercicio"
                                                    style={{ background: '#1976D2', border: 'none', color: 'white', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Plus size={15} />
                                                </button>
                                                <button onClick={() => deleteBlock(block.uid)} title="Eliminar bloque"
                                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Exercises */}
                                            <div style={{ backgroundColor: '#D1D5DB', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {block.exercises.length === 0 ? (
                                                    <p style={{ color: '#6B7280', fontSize: '14px', margin: 0, textAlign: 'center' }}>Sin ejercicios â€” usá el + para agregar</p>
                                                ) : block.exercises.map((ex, idx) => (
                                                    <div key={ex.uid} style={{ backgroundColor: '#4B5563', color: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontSize: '12px', opacity: 0.7, minWidth: '28px' }}>Ej. {idx + 1}</span>
                                                            <span style={{ fontSize: '14px', flex: 1, fontWeight: '500' }}>{ex.name}</span>
                                                            <span style={{ fontSize: '12px', opacity: 0.8, whiteSpace: 'nowrap' }}>{ex.series} series Ã— {ex.reps} reps</span>
                                                            {ex.videoUrl && (
                                                                <button onClick={() => toggleVideo(ex.uid)} title={openVideos.has(ex.uid) ? 'Ocultar video' : 'Ver video'}
                                                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }}>
                                                                    {openVideos.has(ex.uid) ? <ChevronUp size={17} /> : <PlayCircle size={17} />}
                                                                </button>
                                                            )}
                                                            <button onClick={() => deleteExercise(block.uid, ex.uid)}
                                                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6, display: 'flex', padding: 0, flexShrink: 0 }}>
                                                                <X size={15} />
                                                            </button>
                                                        </div>
                                                        {ex.videoUrl && openVideos.has(ex.uid) && (
                                                            <div style={{ aspectRatio: '16/9', background: '#000' }}>
                                                                <iframe src={toEmbedUrl(ex.videoUrl)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title={ex.name} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addBlock}
                                        style={{ backgroundColor: 'white', color: '#374151', padding: '11px', borderRadius: '8px', border: '1px dashed #9CA3AF', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Plus size={16} /> Agregar bloque
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </main>

            </div>

            {/* Exercise modal */}
            {showExModal && (
                <div onClick={() => setShowExModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '28px', maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>Agregar Ejercicio</h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Zona muscular</label>
                            <select value={exZonaId} onChange={e => { setExZonaId(e.target.value); setExEjercicioId(''); }} style={inputStyle}>
                                <option value="">Seleccionar zona...</option>
                                {zonas.map(z => (
                                    <option key={z.idZona} value={z.idZona}>{z.nombre}</option>
                                ))}
                            </select>
                            {ejerciciosDB.length === 0 && (
                                <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0 0' }}>
                                    No hay ejercicios. Agregá uno desde Agregar â†’ Ejercicio.
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Ejercicio</label>
                            <select value={exEjercicioId} onChange={e => setExEjercicioId(e.target.value)} style={inputStyle} disabled={!exZonaId}>
                                <option value="">{exZonaId ? 'Seleccionar ejercicio...' : 'Primero seleccioná una zona'}</option>
                                {ejerciciosFiltrados.map(e => (
                                    <option key={e.idEjercicio} value={e.idEjercicio}>{e.nombre}</option>
                                ))}
                            </select>
                            {exZonaId && ejerciciosFiltrados.length === 0 && (
                                <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0 0' }}>
                                    No hay ejercicios en esta zona.
                                </p>
                            )}
                        </div>

                        {previewEjercicio?.videoUrl && (
                            <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                                <iframe src={toEmbedUrl(previewEjercicio.videoUrl)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="preview" />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Series</label>
                                <input type="number" value={exSeries} onChange={e => setExSeries(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Repeticiones</label>
                                <input type="number" value={exReps} onChange={e => setExReps(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowExModal(false)}
                                style={{ backgroundColor: 'white', color: '#111827', padding: '9px 20px', borderRadius: '6px', border: '1px solid #9CA3AF', cursor: 'pointer', fontSize: '14px' }}>
                                Cancelar
                            </button>
                            <button onClick={confirmAddExercise} disabled={!exEjercicioId}
                                style={{ backgroundColor: exEjercicioId ? '#111827' : '#9CA3AF', color: 'white', padding: '9px 20px', borderRadius: '6px', border: 'none', cursor: exEjercicioId ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '600' }}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planes;

