import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Copy, Search } from 'lucide-react';
import AppShell from '../components/AppShell';
import PlanEditor, { type DayPlan, type EjercicioDB, makeDays, mapPlanJsonToDays, planToJson, inputClass, labelClass } from '../components/PlanEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlantillasProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface PlantillaResumen {
    id: number;
    nombre: string;
    descripcion: string | null;
}

const Plantillas: React.FC<PlantillasProps> = ({ onLogout, onNavigate }) => {
    const [plantillas, setPlantillas] = useState<PlantillaResumen[]>([]);
    const [loadingLista, setLoadingLista] = useState(true);
    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState<number | 'nueva' | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [ejerciciosDB, setEjerciciosDB] = useState<EjercicioDB[]>([]);
    const [days, setDays] = useState<DayPlan[]>([]);
    const [loadingPlantilla, setLoadingPlantilla] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const cargarLista = () => {
        setLoadingLista(true);
        fetch(`${API_URL}/plantillas`)
            .then(r => r.ok ? r.json() : [])
            .then(setPlantillas)
            .catch(() => setPlantillas([]))
            .finally(() => setLoadingLista(false));
    };

    useEffect(() => {
        cargarLista();
        fetch(`${API_URL}/ejercicios`)
            .then(r => r.ok ? r.json() : [])
            .then(setEjerciciosDB)
            .catch(() => {});
    }, []);

    const nuevaPlantilla = () => {
        setSelectedId('nueva');
        setNombre('');
        setDescripcion('');
        setDays(makeDays());
        setSaveStatus(null);
    };

    const abrirPlantilla = async (id: number) => {
        setSelectedId(id);
        setSaveStatus(null);
        setLoadingPlantilla(true);
        try {
            const res = await fetch(`${API_URL}/plantillas/${id}`);
            const data = res.ok ? await res.json() : null;
            setNombre(data?.nombre ?? '');
            setDescripcion(data?.descripcion ?? '');
            setDays(mapPlanJsonToDays(data?.plan));
        } catch {
            setDays(mapPlanJsonToDays(null));
        } finally {
            setLoadingPlantilla(false);
        }
    };

    const volver = () => {
        setSelectedId(null);
        setDays([]);
        setSaveStatus(null);
    };

    const guardarPlantilla = async () => {
        if (!nombre.trim()) {
            setSaveStatus({ msg: 'Ponele un nombre a la plantilla.', ok: false });
            return;
        }
        setSaving(true);
        setSaveStatus(null);
        try {
            const body = { nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, plan: planToJson(days) };
            const res = selectedId === 'nueva'
                ? await fetch(`${API_URL}/plantillas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })
                : await fetch(`${API_URL}/plantillas/${selectedId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            if (!res.ok) throw new Error();
            const saved = await res.json();
            setSelectedId(saved.id);
            setSaveStatus({ msg: 'Plantilla guardada.', ok: true });
            cargarLista();
        } catch {
            setSaveStatus({ msg: 'Error al guardar la plantilla.', ok: false });
        } finally {
            setSaving(false);
        }
    };

    const eliminarPlantilla = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/plantillas/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setConfirmDeleteId(null);
                if (selectedId === id) volver();
                cargarLista();
            }
        } catch {
            // el listado simplemente no se actualiza; el usuario puede reintentar
        }
    };

    const plantillasFiltradas = plantillas.filter(p =>
        !search.trim() || p.nombre.toLowerCase().includes(search.trim().toLowerCase())
    );

    // VIEW: lista de plantillas
    if (selectedId === null) {
        return (
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/plantillas">
                <div className="w-full max-w-3xl">
                    <div className="flex items-center gap-3 mb-5 animate-fadeIn flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Copy size={20} className="text-primary-600" />
                            Plantillas de rutinas
                        </h2>
                        <div className="flex-1 relative min-w-[180px]">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar plantilla..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150"
                            />
                        </div>
                        <button
                            onClick={nuevaPlantilla}
                            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-150"
                        >
                            <Plus size={15} /> Nueva plantilla
                        </button>
                    </div>

                    {loadingLista ? (
                        <p className="text-gray-500">Cargando plantillas...</p>
                    ) : plantillasFiltradas.length === 0 ? (
                        <p className="text-gray-500">
                            {plantillas.length === 0 ? 'Todavía no hay plantillas creadas.' : `Sin resultados para "${search}".`}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {plantillasFiltradas.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-xl shadow-card hover:shadow-card-hover px-5 py-3.5 flex items-center gap-4 border-2 border-transparent hover:border-primary-300 transition-all duration-200"
                                >
                                    <button onClick={() => abrirPlantilla(p.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                                        <p className="text-[15px] font-semibold text-gray-900 truncate">{p.nombre}</p>
                                        {p.descripcion && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.descripcion}</p>}
                                    </button>
                                    {confirmDeleteId === p.id ? (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-gray-500">¿Eliminar?</span>
                                            <button onClick={() => eliminarPlantilla(p.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">Sí</button>
                                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmDeleteId(p.id)} title="Eliminar plantilla" className="text-gray-400 hover:text-red-500 p-1.5 shrink-0 transition-colors duration-150">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AppShell>
        );
    }

    // VIEW: editor de la plantilla seleccionada
    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/plantillas">
            <div className="w-full max-w-5xl flex flex-col gap-5">
                <div className="bg-white rounded-2xl shadow-card p-5 animate-fadeIn">
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <button onClick={volver} className="text-gray-500 hover:text-primary-600 text-sm p-0 bg-transparent border-none cursor-pointer transition-colors duration-150">
                            ← Volver
                        </button>
                        <div className="flex-1" />
                        {saveStatus && (
                            <span className={`text-[13px] px-2.5 py-1 rounded-md ${saveStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                {saveStatus.msg}
                            </span>
                        )}
                        <button
                            onClick={guardarPlantilla}
                            disabled={saving || loadingPlantilla}
                            className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 shadow-sm'}`}
                        >
                            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Plantilla'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Nombre</label>
                            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Fuerza - Nivel inicial" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Descripción (opcional)</label>
                            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: 3 días, full body" className={inputClass} />
                        </div>
                    </div>
                </div>

                {loadingPlantilla ? (
                    <p className="text-gray-500">Cargando plantilla...</p>
                ) : (
                    <PlanEditor days={days} setDays={setDays} ejerciciosDB={ejerciciosDB} />
                )}
            </div>
        </AppShell>
    );
};

export default Plantillas;
