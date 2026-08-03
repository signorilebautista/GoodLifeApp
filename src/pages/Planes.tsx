import React, { useEffect, useState } from 'react';
import { Plus, X, Trash2, ChevronLeft, Save, PlayCircle, ChevronUp, Search, LayoutGrid, List } from 'lucide-react';
import AppShell from '../components/AppShell';

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

let uid = 100;
const nextUid = () => uid++;

const makeDays = (): DayPlan[] => [
    { uid: nextUid(), label: 'Día 1', blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] },
    { uid: nextUid(), label: 'Día 2', blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] },
];

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
const labelClass = 'text-xs font-semibold text-gray-600 block mb-1.5';

const avatarInitials = (nombre: string, apellido: string) =>
    `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();

const Planes: React.FC<PlanesProps> = ({ onLogout, onNavigate }) => {
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loadingSocios, setLoadingSocios] = useState(true);
    const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [ejerciciosDB, setEjerciciosDB] = useState<EjercicioDB[]>([]);

    const [days, setDays] = useState<DayPlan[]>([]);
    const [selectedDayUid, setSelectedDayUid] = useState<number | null>(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [openVideos, setOpenVideos] = useState<Set<number>>(new Set());

    const toggleVideo = (uid: number) =>
        setOpenVideos(prev => { const s = new Set(prev); s.has(uid) ? s.delete(uid) : s.add(uid); return s; });

    const [editingDayUid, setEditingDayUid] = useState<number | null>(null);
    const [editingDayLabel, setEditingDayLabel] = useState('');

    const [editingBlockUid, setEditingBlockUid] = useState<number | null>(null);
    const [editingBlockName, setEditingBlockName] = useState('');

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

    const sociosFiltrados = socios.filter(s => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            s.dni.toLowerCase().includes(q) ||
            s.nombre.toLowerCase().includes(q) ||
            s.apellido.toLowerCase().includes(q)
        );
    });

    // VIEW: socios list
    if (!selectedSocio) {
        return (
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/planes">
                <div className="w-full max-w-5xl">
                    <div className="flex items-center gap-3 mb-5 animate-fadeIn flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">Ejercicios</h2>
                        <div className="flex-1 relative min-w-[180px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar por DNI, nombre o apellido..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150"
                            />
                        </div>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Vista grilla"
                                className={`p-1.5 rounded-md transition-colors duration-150 ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                title="Vista lista"
                                className={`p-1.5 rounded-md transition-colors duration-150 ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                    {loadingSocios ? (
                        <p className="text-gray-500">Cargando socios...</p>
                    ) : socios.length === 0 ? (
                        <p className="text-gray-500">Sin socios registrados.</p>
                    ) : sociosFiltrados.length === 0 ? (
                        <p className="text-gray-500">Sin resultados para "{search}".</p>
                    ) : viewMode === 'grid' ? (
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                            {sociosFiltrados.map((s, index) => (
                                <button
                                    key={s.dni}
                                    onClick={() => selectSocio(s)}
                                    className="bg-white rounded-xl shadow-card hover:shadow-card-hover px-5 py-4 flex items-center gap-3.5 border-2 border-transparent hover:border-primary-300 cursor-pointer text-left w-full transition-all duration-200 hover:-translate-y-0.5 animate-fadeIn"
                                    style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                                >
                                    <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-base font-semibold shadow-sm">
                                        {avatarInitials(s.nombre, s.apellido)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-semibold text-gray-900 truncate">{s.nombre} {s.apellido}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{s.plan ?? 'Sin plan'}</p>
                                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                            {s.clasesRestantes != null && (
                                                <span className="text-[11px] bg-primary-50 text-primary-700 rounded px-1.5 py-0.5">
                                                    {s.clasesRestantes} clases
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {sociosFiltrados.map((s, index) => (
                                <button
                                    key={s.dni}
                                    onClick={() => selectSocio(s)}
                                    className="bg-white rounded-xl shadow-card hover:shadow-card-hover px-4 py-3 flex items-center gap-4 border-2 border-transparent hover:border-primary-300 cursor-pointer text-left w-full transition-all duration-200 animate-fadeIn"
                                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                                >
                                    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                        {avatarInitials(s.nombre, s.apellido)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-gray-900 truncate">{s.nombre} {s.apellido}</p>
                                        <p className="text-xs text-gray-500 truncate">DNI {s.dni}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs text-gray-500">{s.plan ?? 'Sin plan'}</p>
                                        {s.clasesRestantes != null && (
                                            <span className="text-[11px] bg-primary-50 text-primary-700 rounded px-1.5 py-0.5 mt-1 inline-block">
                                                {s.clasesRestantes} clases
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </AppShell>
        );
    }

    // VIEW: plan editor for selected socio
    return (
        <>
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/planes">
                <div className="w-full max-w-5xl flex flex-col gap-5">
                    {/* Plan header */}
                    <div className="bg-white rounded-2xl shadow-card p-5 animate-fadeIn">
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                            <button onClick={backToList} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-gray-500 hover:text-primary-600 text-sm p-0 transition-colors duration-150">
                                <ChevronLeft size={18} /> Volver
                            </button>
                            <div className="flex-1" />
                            {saveStatus && (
                                <span className={`text-[13px] px-2.5 py-1 rounded-md ${saveStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                    {saveStatus.msg}
                                </span>
                            )}
                            <button
                                onClick={savePlan}
                                disabled={saveLoading || planLoading}
                                className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${saveLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 shadow-sm'}`}
                            >
                                <Save size={15} /> {saveLoading ? 'Guardando...' : 'Guardar Plan'}
                            </button>
                            <div className="w-px h-5 bg-gray-200" />
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                    {avatarInitials(selectedSocio.nombre, selectedSocio.apellido)}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900">{selectedSocio.nombre} {selectedSocio.apellido}</p>
                                    <p className="text-xs text-gray-500">DNI {selectedSocio.dni}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2.5 flex-wrap">
                            {[
                                ['Membresía', selectedSocio.plan ?? 'Sin membresía'],
                                ['Clases restantes', selectedSocio.clasesRestantes ?? '0'],
                                ['Mail', selectedSocio.mail ?? '—'],
                                ['Teléfono', selectedSocio.telefono ?? '—'],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-gray-100 rounded-lg px-3 py-1.5">
                                    <span className="text-[11px] text-gray-500 block">{label}</span>
                                    <span className="text-[13px] font-semibold text-gray-900">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-5 items-start">
                        {/* Days column */}
                        <div className="w-40 shrink-0 bg-white rounded-2xl shadow-card p-3 flex flex-col gap-2 animate-fadeIn">
                            {days.map(day => (
                                <div key={day.uid} className="flex items-center gap-1">
                                    {editingDayUid === day.uid ? (
                                        <input
                                            autoFocus value={editingDayLabel}
                                            onChange={e => setEditingDayLabel(e.target.value)}
                                            onBlur={commitDayLabel}
                                            onKeyDown={e => e.key === 'Enter' && commitDayLabel()}
                                            className="flex-1 px-2 py-1.5 rounded-md border border-primary text-[13px] outline-none"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => setSelectedDayUid(day.uid)}
                                            onDoubleClick={() => { setEditingDayUid(day.uid); setEditingDayLabel(day.label); }}
                                            title="Doble click para renombrar"
                                            className={`flex-1 py-2 px-2 rounded-md text-[13px] font-medium text-center transition-colors duration-150 ${selectedDayUid === day.uid ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {day.label}
                                        </button>
                                    )}
                                    <button onClick={() => deleteDay(day.uid)} title="Eliminar día" className="text-gray-400 hover:text-red-500 p-0.5 flex shrink-0 transition-colors duration-150">
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={addDay} className="py-2 rounded-md border border-dashed border-gray-300 bg-transparent text-[13px] text-gray-500 hover:bg-gray-50 hover:border-primary-300 flex items-center justify-center gap-1 transition-colors duration-150">
                                <Plus size={13} /> Día
                            </button>
                        </div>

                        {/* Blocks & exercises */}
                        <div className="flex-1 flex flex-col gap-5 min-w-0">
                            {planLoading ? (
                                <p className="text-gray-500">Cargando plan...</p>
                            ) : !selectedDay ? (
                                <p className="text-gray-500">Seleccioná un día.</p>
                            ) : (
                                <>
                                    {selectedDay.blocks.map((block, bi) => (
                                        <div key={block.uid} className="animate-fadeIn" style={{ animationDelay: `${bi * 60}ms` }}>
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                {editingBlockUid === block.uid ? (
                                                    <input
                                                        autoFocus value={editingBlockName}
                                                        onChange={e => setEditingBlockName(e.target.value)}
                                                        onBlur={commitBlockName}
                                                        onKeyDown={e => e.key === 'Enter' && commitBlockName()}
                                                        className="text-base font-bold border border-primary rounded px-2 py-1 outline-none"
                                                    />
                                                ) : (
                                                    <h3
                                                        onDoubleClick={() => { setEditingBlockUid(block.uid); setEditingBlockName(block.name); }}
                                                        title="Doble click para renombrar"
                                                        className="text-[17px] font-bold text-gray-900 m-0 cursor-pointer"
                                                    >
                                                        {block.name}
                                                    </h3>
                                                )}
                                                <button onClick={() => openExModal(block.uid)} title="Agregar ejercicio" className="bg-primary-500 hover:bg-primary-600 border-none text-white rounded-full w-[26px] h-[26px] cursor-pointer flex items-center justify-center shrink-0 transition-colors duration-150">
                                                    <Plus size={15} />
                                                </button>
                                                <button onClick={() => deleteBlock(block.uid)} title="Eliminar bloque" className="text-red-500 hover:text-red-600 cursor-pointer flex items-center shrink-0 transition-colors duration-150">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="bg-gray-200 rounded-xl p-3.5 flex flex-col gap-2.5">
                                                {block.exercises.length === 0 ? (
                                                    <p className="text-gray-500 text-sm m-0 text-center py-2">Sin ejercicios — usá el + para agregar</p>
                                                ) : block.exercises.map((ex, idx) => (
                                                    <div key={ex.uid} className="bg-gray-600 text-white rounded-lg overflow-hidden">
                                                        <div className="px-3.5 py-2.5 flex items-center gap-3">
                                                            <span className="text-xs opacity-70 min-w-[28px]">Ej. {idx + 1}</span>
                                                            <span className="text-sm flex-1 font-medium">{ex.name}</span>
                                                            <span className="text-xs opacity-80 whitespace-nowrap">{ex.series} series × {ex.reps} reps</span>
                                                            {ex.videoUrl && (
                                                                <button onClick={() => toggleVideo(ex.uid)} title={openVideos.has(ex.uid) ? 'Ocultar video' : 'Ver video'} className="text-white opacity-80 hover:opacity-100 flex items-center p-0 shrink-0 transition-opacity duration-150">
                                                                    {openVideos.has(ex.uid) ? <ChevronUp size={17} /> : <PlayCircle size={17} />}
                                                                </button>
                                                            )}
                                                            <button onClick={() => deleteExercise(block.uid, ex.uid)} className="text-white opacity-60 hover:opacity-100 flex p-0 shrink-0 transition-opacity duration-150">
                                                                <X size={15} />
                                                            </button>
                                                        </div>
                                                        {ex.videoUrl && openVideos.has(ex.uid) && (
                                                            <div className="aspect-video bg-black animate-fadeIn">
                                                                <iframe src={toEmbedUrl(ex.videoUrl)} className="w-full h-full border-none" allowFullScreen title={ex.name} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addBlock} className="bg-white text-gray-700 py-2.5 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 hover:border-primary-300 cursor-pointer text-sm flex items-center justify-center gap-1.5 transition-colors duration-150">
                                        <Plus size={16} /> Agregar bloque
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </AppShell>

            {/* Exercise modal */}
            {showExModal && (
                <div
                    onClick={() => setShowExModal(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-popIn">
                        <h3 className="text-lg font-bold text-gray-900 mb-5">Agregar Ejercicio</h3>

                        <div className="mb-4">
                            <label className={labelClass}>Zona muscular</label>
                            <select value={exZonaId} onChange={e => { setExZonaId(e.target.value); setExEjercicioId(''); }} className={inputClass}>
                                <option value="">Seleccionar zona...</option>
                                {zonas.map(z => (
                                    <option key={z.idZona} value={z.idZona}>{z.nombre}</option>
                                ))}
                            </select>
                            {ejerciciosDB.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1.5">
                                    No hay ejercicios. Agregá uno desde Agregar → Ejercicio.
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className={labelClass}>Ejercicio</label>
                            <select value={exEjercicioId} onChange={e => setExEjercicioId(e.target.value)} className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`} disabled={!exZonaId}>
                                <option value="">{exZonaId ? 'Seleccionar ejercicio...' : 'Primero seleccioná una zona'}</option>
                                {ejerciciosFiltrados.map(e => (
                                    <option key={e.idEjercicio} value={e.idEjercicio}>{e.nombre}</option>
                                ))}
                            </select>
                            {exZonaId && ejerciciosFiltrados.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1.5">
                                    No hay ejercicios en esta zona.
                                </p>
                            )}
                        </div>

                        {previewEjercicio?.videoUrl && (
                            <div className="mb-4 rounded-lg overflow-hidden aspect-video bg-black animate-fadeIn">
                                <iframe src={toEmbedUrl(previewEjercicio.videoUrl)} className="w-full h-full border-none" allowFullScreen title="preview" />
                            </div>
                        )}

                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <label className={labelClass}>Series</label>
                                <input type="number" value={exSeries} onChange={e => setExSeries(e.target.value)} className={inputClass} />
                            </div>
                            <div className="flex-1">
                                <label className={labelClass}>Repeticiones</label>
                                <input type="number" value={exReps} onChange={e => setExReps(e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5">
                            <button onClick={() => setShowExModal(false)} className="bg-white text-gray-900 px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer text-sm transition-colors duration-150">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAddExercise}
                                disabled={!exEjercicioId}
                                className={`px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors duration-150 ${exEjercicioId ? 'bg-gray-900 hover:bg-gray-800 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Planes;
