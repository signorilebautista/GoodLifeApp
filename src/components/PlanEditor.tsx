import React, { useEffect, useState } from 'react';
import { Plus, X, Trash2, ChevronUp, PlayCircle, Search } from 'lucide-react';

export interface EjercicioDB {
    idEjercicio: number;
    nombre: string;
    videoUrl: string | null;
    zona: { idZona: number; nombre: string } | null;
}

export interface Exercise {
    uid: number;
    idEjercicio: number;
    name: string;
    reps: string;
    series: string;
    videoUrl: string | null;
}

export interface Block {
    uid: number;
    name: string;
    exercises: Exercise[];
}

export interface DayPlan {
    uid: number;
    label: string;
    blocks: Block[];
}

interface PlanJsonExercise {
    idEjercicio: number;
    name: string;
    series: string;
    reps: string;
    videoUrl: string | null;
}

interface PlanJsonBlock {
    name: string;
    exercises: PlanJsonExercise[];
}

interface PlanJsonDay {
    label: string;
    blocks: PlanJsonBlock[];
}

export interface PlanJson {
    days: PlanJsonDay[];
}

let uid = 100;
export const nextUid = () => uid++;

export const makeDays = (): DayPlan[] => [
    { uid: nextUid(), label: 'Día 1', blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] },
    { uid: nextUid(), label: 'Día 2', blocks: [{ uid: nextUid(), name: 'Bloque 1', exercises: [] }] },
];

/** Convierte el JSON persistido ({ days: [...] }) al estado local con uids, regenerando
 * identificadores nuevos para que React pueda trackear cada día/bloque/ejercicio. */
export const mapPlanJsonToDays = (plan: PlanJson | null | undefined): DayPlan[] => {
    if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) return makeDays();
    return plan.days.map((d) => ({
        uid: nextUid(),
        label: d.label,
        blocks: d.blocks.map((b) => ({
            uid: nextUid(),
            name: b.name,
            exercises: b.exercises.map((e) => ({ ...e, uid: nextUid() })),
        })),
    }));
};

/** Inversa de mapPlanJsonToDays: arma el JSON a persistir a partir del estado local. */
export const planToJson = (days: DayPlan[]): PlanJson => ({
    days: days.map((d) => ({
        label: d.label,
        blocks: d.blocks.map((b) => ({
            name: b.name,
            exercises: b.exercises.map((e) => ({
                idEjercicio: e.idEjercicio,
                name: e.name,
                series: e.series,
                reps: e.reps,
                videoUrl: e.videoUrl,
            })),
        })),
    })),
});

export const inputClass = 'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
export const labelClass = 'text-xs font-semibold text-gray-600 block mb-1.5';

const toEmbedUrl = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};

interface PlanEditorProps {
    days: DayPlan[];
    setDays: React.Dispatch<React.SetStateAction<DayPlan[]>>;
    ejerciciosDB: EjercicioDB[];
}

const PlanEditor: React.FC<PlanEditorProps> = ({ days, setDays, ejerciciosDB }) => {
    const [selectedDayUid, setSelectedDayUid] = useState<number | null>(days[0]?.uid ?? null);
    const [openVideos, setOpenVideos] = useState<Set<number>>(new Set());

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
    const [exSearch, setExSearch] = useState('');

    // Si `days` cambia desde afuera (se cargó el plan de otro socio, o se aplicó una
    // plantilla) y el día seleccionado ya no existe en la lista nueva, seleccionamos
    // el primero. Si el día seleccionado sigue existiendo (ediciones internas como
    // agregar/eliminar día), no tocamos la selección.
    useEffect(() => {
        if (!days.some(d => d.uid === selectedDayUid)) {
            setSelectedDayUid(days[0]?.uid ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days]);

    const toggleVideo = (exUid: number) =>
        setOpenVideos(prev => { const s = new Set(prev); s.has(exUid) ? s.delete(exUid) : s.add(exUid); return s; });

    const selectedDay = days.find(d => d.uid === selectedDayUid) ?? null;
    const previewEjercicio = ejerciciosDB.find(e => String(e.idEjercicio) === exEjercicioId) ?? null;

    const zonas = Array.from(
        new Map(ejerciciosDB.filter(e => e.zona).map(e => [e.zona!.idZona, e.zona!])).values()
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const ejerciciosFiltrados = (exZonaId
        ? ejerciciosDB.filter(e => e.zona && String(e.zona.idZona) === exZonaId)
        : []
    ).filter(e => e.nombre.toLowerCase().includes(exSearch.trim().toLowerCase()));

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
        setExSearch('');
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

    return (
        <>
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
                    {!selectedDay ? (
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
                            <select value={exZonaId} onChange={e => { setExZonaId(e.target.value); setExEjercicioId(''); setExSearch(''); }} className={inputClass}>
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

                        {exZonaId && (
                            <div className="mb-4">
                                <label className={labelClass}>Buscar ejercicio</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={exSearch}
                                        onChange={e => setExSearch(e.target.value)}
                                        placeholder="Filtrar por nombre..."
                                        className={`${inputClass} pl-8`}
                                    />
                                </div>
                            </div>
                        )}

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
                                    {exSearch.trim() ? 'Sin resultados para la búsqueda.' : 'No hay ejercicios en esta zona.'}
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

export default PlanEditor;
