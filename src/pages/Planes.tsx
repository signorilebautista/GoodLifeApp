import React, { useEffect, useState } from 'react';
import { ChevronLeft, Save, Search, LayoutGrid, List, Copy } from 'lucide-react';
import AppShell from '../components/AppShell';
import PlanEditor, { type DayPlan, type EjercicioDB, mapPlanJsonToDays, planToJson } from '../components/PlanEditor';

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

interface PlantillaResumen {
    id: number;
    nombre: string;
    descripcion: string | null;
}

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
    const [planLoading, setPlanLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const [plantillas, setPlantillas] = useState<PlantillaResumen[]>([]);
    const [showPlantillaSelector, setShowPlantillaSelector] = useState(false);
    const [plantillaAAplicar, setPlantillaAAplicar] = useState<PlantillaResumen | null>(null);
    const [aplicandoPlantilla, setAplicandoPlantilla] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/socios`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Socio[]) => { setSocios(data); setLoadingSocios(false); })
            .catch(() => setLoadingSocios(false));
        fetch(`${API_URL}/ejercicios`)
            .then(r => r.ok ? r.json() : [])
            .then(setEjerciciosDB)
            .catch(() => {});
        fetch(`${API_URL}/plantillas`)
            .then(r => r.ok ? r.json() : [])
            .then(setPlantillas)
            .catch(() => {});
    }, []);

    const confirmarAplicarPlantilla = async () => {
        if (!plantillaAAplicar) return;
        setAplicandoPlantilla(true);
        try {
            const res = await fetch(`${API_URL}/plantillas/${plantillaAAplicar.id}`);
            const data = res.ok ? await res.json() : null;
            setDays(mapPlanJsonToDays(data?.plan));
            setSaveStatus(null);
        } finally {
            setAplicandoPlantilla(false);
            setPlantillaAAplicar(null);
            setShowPlantillaSelector(false);
        }
    };

    const selectSocio = async (s: Socio) => {
        setSelectedSocio(s);
        setSaveStatus(null);
        setPlanLoading(true);
        try {
            const res = await fetch(`${API_URL}/socios/${s.dni}/plan`);
            const data = res.ok ? await res.json() : null;
            setDays(mapPlanJsonToDays(data));
        } catch {
            setDays(mapPlanJsonToDays(null));
        } finally {
            setPlanLoading(false);
        }
    };

    const backToList = () => {
        setSelectedSocio(null);
        setDays([]);
        setSaveStatus(null);
    };

    const savePlan = async () => {
        if (!selectedSocio) return;
        setSaveLoading(true);
        setSaveStatus(null);
        try {
            const res = await fetch(`${API_URL}/socios/${selectedSocio.dni}/plan`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planToJson(days) }),
            });
            if (!res.ok) throw new Error('Error al guardar');
            setSaveStatus({ msg: 'Plan guardado.', ok: true });
        } catch {
            setSaveStatus({ msg: 'Error al guardar el plan.', ok: false });
        } finally {
            setSaveLoading(false);
        }
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
                            onClick={() => setShowPlantillaSelector(true)}
                            disabled={planLoading || plantillas.length === 0}
                            title={plantillas.length === 0 ? 'No hay plantillas creadas todavía' : 'Aplicar una plantilla a este socio'}
                            className="flex items-center gap-1.5 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Copy size={15} /> Aplicar plantilla
                        </button>
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

                {planLoading ? (
                    <p className="text-gray-500">Cargando plan...</p>
                ) : (
                    <PlanEditor days={days} setDays={setDays} ejerciciosDB={ejerciciosDB} />
                )}
            </div>

            {/* Selector de plantilla */}
            {showPlantillaSelector && (
                <div
                    onClick={() => setShowPlantillaSelector(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-7 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-popIn">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Aplicar plantilla</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            Elegí una plantilla para {selectedSocio.nombre} {selectedSocio.apellido}. Vas a poder revisarla y ajustarla antes de guardar.
                        </p>
                        <div className="flex flex-col gap-2">
                            {plantillas.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setPlantillaAAplicar(p)}
                                    className="text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors duration-150"
                                >
                                    <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                                    {p.descripcion && <p className="text-xs text-gray-500 mt-0.5">{p.descripcion}</p>}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setShowPlantillaSelector(false)} className="bg-white text-gray-900 px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer text-sm transition-colors duration-150">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmación de reemplazo */}
            {plantillaAAplicar && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl animate-popIn">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Aplicar "{plantillaAAplicar.nombre}"?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Esto reemplaza el plan que estás viendo en pantalla para {selectedSocio.nombre} {selectedSocio.apellido}. Los cambios no guardados se van a perder. Vas a poder editar el resultado antes de guardar.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <button onClick={() => setPlantillaAAplicar(null)} className="bg-white text-gray-900 px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer text-sm transition-colors duration-150">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarAplicarPlantilla}
                                disabled={aplicandoPlantilla}
                                className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold bg-gray-900 hover:bg-gray-800 cursor-pointer transition-colors duration-150 disabled:opacity-60"
                            >
                                {aplicandoPlantilla ? 'Aplicando...' : 'Sí, reemplazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Planes;
