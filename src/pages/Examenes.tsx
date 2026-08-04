import React, { useEffect, useState } from 'react';
import { ChevronLeft, Save, Search, LayoutGrid, List } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ExamenesProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Socio {
    dni: string;
    nombre: string;
    apellido: string;
    plan: string | null;
    clasesRestantes: string | null;
}

// El examen es una planilla de evaluación funcional: estructura fija,
// valores dinámicos. Se guarda/lee tal cual como jsonb en el backend.
type Examen = Record<string, unknown>;

const emptyExamen = (): Examen => ({
    evaluaciones: {
        sentadilla_profunda: {
            rodillas_alineadas_con_pies: { puntos: null, observacion: '' },
            femur_debajo_horizontal: { puntos: null, observacion: '' },
            torso_paralelo_tibia: { puntos: null, observacion: '' },
            barra_alineada_pies: { puntos: null, observacion: '' },
            puntuacion_total: null,
            observacion_general: '',
        },
        puente_gluteo: {
            dos_pies: { puntos: null, observacion: '' },
            derecha: { puntos: null, observacion: '' },
            izquierda: { puntos: null, observacion: '' },
            puntuacion_total: null,
        },
        estocada_en_linea: {
            barra_vertical: { der: null, izq: null },
            movimiento_torso: { der: null, izq: null },
            rodilla_atras_toca_pie: { der: null, izq: null },
            alineacion_pies: { der: null, izq: null },
            puntuacion: { der: null, izq: null },
            observaciones: '',
        },
        mov_cadera: {
            rotacion_interna: { der: null, izq: null },
            rotacion_externa: { der: null, izq: null },
            puntuacion: { der: null, izq: null },
            observaciones: '',
        },
        push_up: {
            pulgares_alineados_menton: { puntos: null, observacion: '' },
            elevacion_suelo_bloque: { puntos: null, observacion: '' },
            columna_neutra: { puntos: null, observacion: '' },
            plancha_frontal: { puntos: null, observacion: '' },
            cantidad_tiempo: { puntos: null, observacion: '' },
        },
        mov_hombro: {
            distancia: { izquierda: null, derecha: null },
            puntuacion: { izquierda: null, derecha: null },
            observacion: '',
        },
        mov_tobillo: {
            angulo_grados: { izquierda: null, derecha: null },
            puntuacion: { izquierda: null, derecha: null },
            observacion: '',
        },
        elevacion_pierna_recta: {
            distancia_al_suelo: { derecha: null, izquierda: null },
            puente_isquios: { derecha: null, izquierda: null },
            max_rep: { derecha: null, izquierda: null },
            observacion: '',
        },
        pistol_squat: {
            control_motor: { derecha: null, izquierda: null },
            valgo_rodilla: { derecha: null, izquierda: null },
            max_rep: { derecha: null, izquierda: null },
            observacion: '',
        },
    },
    dias_entrenamiento: {
        lunes: false, martes: false, miercoles: false,
        jueves: false, viernes: false, sabado: false, domingo: false,
    },
    preguntas: {
        enfermedad_lesion_patologia: '',
        experiencia_entrenamiento_fuerza: '',
        practica_deporte: '',
        que_gusta_no_gusta_gimnasio: '',
        objetivos_entrenamiento: '',
        ultima_vez_bien_fisicamente: '',
    },
});

const getAt = (obj: unknown, path: (string | number)[]): any =>
    path.reduce((o: any, k) => (o == null ? undefined : o[k]), obj);

const setPath = <T,>(obj: T, path: (string | number)[], value: unknown): T => {
    const clone = structuredClone(obj) as any;
    let cur = clone;
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
    cur[path[path.length - 1]] = value;
    return clone;
};

const seccionesTipoA = [
    {
        key: 'sentadilla_profunda', titulo: 'Sentadilla Profunda', total: true, observacionGeneral: true,
        campos: [
            { key: 'rodillas_alineadas_con_pies', label: 'Rodillas alineadas con pies' },
            { key: 'femur_debajo_horizontal', label: 'Fémur debajo de la horizontal' },
            { key: 'torso_paralelo_tibia', label: 'Torso paralelo a la tibia' },
            { key: 'barra_alineada_pies', label: 'Barra alineada con los pies' },
        ],
    },
    {
        key: 'puente_gluteo', titulo: 'Puente de Glúteo', total: true, observacionGeneral: false,
        campos: [
            { key: 'dos_pies', label: 'Dos pies' },
            { key: 'derecha', label: 'Derecha' },
            { key: 'izquierda', label: 'Izquierda' },
        ],
    },
    {
        key: 'push_up', titulo: 'Push Up', total: false, observacionGeneral: false,
        campos: [
            { key: 'pulgares_alineados_menton', label: 'Pulgares alineados con mentón' },
            { key: 'elevacion_suelo_bloque', label: 'Elevación del suelo / bloque' },
            { key: 'columna_neutra', label: 'Columna neutra' },
            { key: 'plancha_frontal', label: 'Plancha frontal' },
            { key: 'cantidad_tiempo', label: 'Cantidad / Tiempo' },
        ],
    },
];

const seccionesTipoB = [
    {
        key: 'estocada_en_linea', titulo: 'Estocada en Línea',
        campos: [
            { key: 'barra_vertical', label: 'Barra vertical' },
            { key: 'movimiento_torso', label: 'Movimiento de torso' },
            { key: 'rodilla_atras_toca_pie', label: 'Rodilla atrás toca el pie' },
            { key: 'alineacion_pies', label: 'Alineación de pies' },
        ],
    },
    {
        key: 'mov_cadera', titulo: 'Movilidad de Cadera',
        campos: [
            { key: 'rotacion_interna', label: 'Rotación interna' },
            { key: 'rotacion_externa', label: 'Rotación externa' },
        ],
    },
];

const seccionesTipoC = [
    { key: 'mov_hombro', titulo: 'Movilidad de Hombro', medidaKey: 'distancia', medidaLabel: 'Distancia' },
    { key: 'mov_tobillo', titulo: 'Movilidad de Tobillo', medidaKey: 'angulo_grados', medidaLabel: 'Ángulo (grados)' },
];

const seccionesTipoD = [
    {
        key: 'elevacion_pierna_recta', titulo: 'Elevación de Pierna Recta',
        campos: [
            { key: 'distancia_al_suelo', label: 'Distancia al suelo' },
            { key: 'puente_isquios', label: 'Puente de isquios' },
            { key: 'max_rep', label: 'Máx. repeticiones' },
        ],
    },
    {
        key: 'pistol_squat', titulo: 'Pistol Squat',
        campos: [
            { key: 'control_motor', label: 'Control motor' },
            { key: 'valgo_rodilla', label: 'Valgo de rodilla' },
            { key: 'max_rep', label: 'Máx. repeticiones' },
        ],
    },
];

const preguntasConfig = [
    { key: 'enfermedad_lesion_patologia', label: '¿Enfermedad, lesión o patología?' },
    { key: 'experiencia_entrenamiento_fuerza', label: 'Experiencia en entrenamiento de fuerza' },
    { key: 'practica_deporte', label: '¿Practica algún deporte?' },
    { key: 'que_gusta_no_gusta_gimnasio', label: '¿Qué le gusta / no le gusta del gimnasio?' },
    { key: 'objetivos_entrenamiento', label: 'Objetivos de entrenamiento' },
    { key: 'ultima_vez_bien_fisicamente', label: 'Última vez que se sintió bien físicamente' },
];

const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

const avatarInitials = (nombre: string, apellido: string) =>
    `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();

const cardClass = 'bg-white rounded-2xl shadow-card p-5 animate-fadeIn';
const gridHead = 'grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 items-center text-sm';

const Examenes: React.FC<ExamenesProps> = ({ onLogout, onNavigate }) => {
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loadingSocios, setLoadingSocios] = useState(true);
    const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [examen, setExamen] = useState<Examen>(emptyExamen());
    const [examenLoading, setExamenLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/socios`)
            .then(r => r.ok ? r.json() : [])
            .then((data: Socio[]) => { setSocios(data); setLoadingSocios(false); })
            .catch(() => setLoadingSocios(false));
    }, []);

    const num = (path: (string | number)[]) => {
        const v = getAt(examen, path);
        return (
            <input
                type="number"
                value={v ?? ''}
                onChange={e => setExamen(prev => setPath(prev, path, e.target.value === '' ? null : Number(e.target.value)))}
                className="w-16 px-2 py-1.5 border border-gray-200 bg-gray-50 rounded-md text-sm text-center outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150"
            />
        );
    };

    const txt = (path: (string | number)[], placeholder = 'Observación') => {
        const v = getAt(examen, path) ?? '';
        return (
            <input
                type="text"
                value={v}
                placeholder={placeholder}
                onChange={e => setExamen(prev => setPath(prev, path, e.target.value))}
                className="flex-1 min-w-0 px-2.5 py-1.5 border border-gray-200 bg-gray-50 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150"
            />
        );
    };

    const area = (path: (string | number)[], placeholder = '') => {
        const v = getAt(examen, path) ?? '';
        return (
            <textarea
                value={v}
                placeholder={placeholder}
                rows={2}
                onChange={e => setExamen(prev => setPath(prev, path, e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150 resize-none"
            />
        );
    };

    const selectSocio = async (s: Socio) => {
        setSelectedSocio(s);
        setSaveStatus(null);
        setExamenLoading(true);
        try {
            const res = await fetch(`${API_URL}/socios/${s.dni}/examen`);
            const data = res.ok ? await res.json() : null;
            setExamen(data ?? emptyExamen());
        } catch {
            setExamen(emptyExamen());
        } finally {
            setExamenLoading(false);
        }
    };

    const backToList = () => {
        setSelectedSocio(null);
        setExamen(emptyExamen());
        setSaveStatus(null);
    };

    const guardarExamen = async () => {
        if (!selectedSocio) return;
        setSaveLoading(true);
        setSaveStatus(null);
        try {
            const res = await fetch(`${API_URL}/socios/${selectedSocio.dni}/examen`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examen }),
            });
            if (!res.ok) throw new Error('Error al guardar');
            setSaveStatus({ msg: 'Planilla guardada.', ok: true });
        } catch {
            setSaveStatus({ msg: 'Error al guardar la planilla.', ok: false });
        } finally {
            setSaveLoading(false);
        }
    };

    const sociosFiltrados = socios.filter(s => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return s.dni.toLowerCase().includes(q) || s.nombre.toLowerCase().includes(q) || s.apellido.toLowerCase().includes(q);
    });

    // VIEW: lista de socios
    if (!selectedSocio) {
        return (
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/examenes">
                <div className="w-full max-w-5xl">
                    <div className="flex items-center gap-3 mb-5 animate-fadeIn flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">Exámenes</h2>
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
                            <button onClick={() => setViewMode('grid')} title="Vista grilla" className={`p-1.5 rounded-md transition-colors duration-150 ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <LayoutGrid size={16} />
                            </button>
                            <button onClick={() => setViewMode('list')} title="Vista lista" className={`p-1.5 rounded-md transition-colors duration-150 ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
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
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">DNI {s.dni}</p>
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
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </AppShell>
        );
    }

    // VIEW: planilla del socio seleccionado
    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/examenes">
            <div className="w-full max-w-4xl flex flex-col gap-5 pb-10">
                <div className={cardClass}>
                    <div className="flex items-center gap-4 flex-wrap">
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
                            onClick={guardarExamen}
                            disabled={saveLoading || examenLoading}
                            className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${saveLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 shadow-sm'}`}
                        >
                            <Save size={15} /> {saveLoading ? 'Guardando...' : 'Guardar Planilla'}
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
                </div>

                {examenLoading ? (
                    <p className="text-gray-500">Cargando planilla...</p>
                ) : (
                    <>
                        {seccionesTipoA.map(sec => (
                            <div key={sec.key} className={cardClass}>
                                <h3 className="text-base font-bold text-gray-900 mb-3">{sec.titulo}</h3>
                                <div className="flex flex-col gap-2">
                                    {sec.campos.map(c => (
                                        <div key={c.key} className="flex items-center gap-2.5">
                                            <span className="text-sm text-gray-700 flex-1 min-w-0">{c.label}</span>
                                            {num(['evaluaciones', sec.key, c.key, 'puntos'])}
                                            {txt(['evaluaciones', sec.key, c.key, 'observacion'])}
                                        </div>
                                    ))}
                                </div>
                                {(sec.total || sec.observacionGeneral) && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                                        {sec.total && (
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-sm font-semibold text-gray-900 flex-1">Puntuación total</span>
                                                {num(['evaluaciones', sec.key, 'puntuacion_total'])}
                                            </div>
                                        )}
                                        {sec.observacionGeneral && area(['evaluaciones', sec.key, 'observacion_general'], 'Observación general')}
                                    </div>
                                )}
                            </div>
                        ))}

                        {seccionesTipoB.map(sec => (
                            <div key={sec.key} className={cardClass}>
                                <h3 className="text-base font-bold text-gray-900 mb-3">{sec.titulo}</h3>
                                <div className={gridHead}>
                                    <span />
                                    <span className="text-xs font-semibold text-gray-500 text-center">Der</span>
                                    <span className="text-xs font-semibold text-gray-500 text-center">Izq</span>
                                    {sec.campos.map(c => (
                                        <React.Fragment key={c.key}>
                                            <span className="text-gray-700">{c.label}</span>
                                            {num(['evaluaciones', sec.key, c.key, 'der'])}
                                            {num(['evaluaciones', sec.key, c.key, 'izq'])}
                                        </React.Fragment>
                                    ))}
                                    <span className="text-gray-900 font-semibold">Puntuación</span>
                                    {num(['evaluaciones', sec.key, 'puntuacion', 'der'])}
                                    {num(['evaluaciones', sec.key, 'puntuacion', 'izq'])}
                                </div>
                                <div className="mt-3">{area(['evaluaciones', sec.key, 'observaciones'], 'Observaciones')}</div>
                            </div>
                        ))}

                        {seccionesTipoC.map(sec => (
                            <div key={sec.key} className={cardClass}>
                                <h3 className="text-base font-bold text-gray-900 mb-3">{sec.titulo}</h3>
                                <div className={gridHead}>
                                    <span />
                                    <span className="text-xs font-semibold text-gray-500 text-center">Izq</span>
                                    <span className="text-xs font-semibold text-gray-500 text-center">Der</span>
                                    <span className="text-gray-700">{sec.medidaLabel}</span>
                                    {num(['evaluaciones', sec.key, sec.medidaKey, 'izquierda'])}
                                    {num(['evaluaciones', sec.key, sec.medidaKey, 'derecha'])}
                                    <span className="text-gray-900 font-semibold">Puntuación</span>
                                    {num(['evaluaciones', sec.key, 'puntuacion', 'izquierda'])}
                                    {num(['evaluaciones', sec.key, 'puntuacion', 'derecha'])}
                                </div>
                                <div className="mt-3">{area(['evaluaciones', sec.key, 'observacion'], 'Observación')}</div>
                            </div>
                        ))}

                        {seccionesTipoD.map(sec => (
                            <div key={sec.key} className={cardClass}>
                                <h3 className="text-base font-bold text-gray-900 mb-3">{sec.titulo}</h3>
                                <div className={gridHead}>
                                    <span />
                                    <span className="text-xs font-semibold text-gray-500 text-center">Der</span>
                                    <span className="text-xs font-semibold text-gray-500 text-center">Izq</span>
                                    {sec.campos.map(c => (
                                        <React.Fragment key={c.key}>
                                            <span className="text-gray-700">{c.label}</span>
                                            {num(['evaluaciones', sec.key, c.key, 'derecha'])}
                                            {num(['evaluaciones', sec.key, c.key, 'izquierda'])}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="mt-3">{area(['evaluaciones', sec.key, 'observacion'], 'Observación')}</div>
                            </div>
                        ))}

                        <div className={cardClass}>
                            <h3 className="text-base font-bold text-gray-900 mb-3">Días de entrenamiento</h3>
                            <div className="flex flex-wrap gap-2">
                                {dias.map(d => {
                                    const checked = !!getAt(examen, ['dias_entrenamiento', d]);
                                    return (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setExamen(prev => setPath(prev, ['dias_entrenamiento', d], !checked))}
                                            className={`px-3.5 py-2 rounded-lg text-sm font-medium capitalize transition-colors duration-150 ${checked ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`${cardClass} flex flex-col gap-4`}>
                            <h3 className="text-base font-bold text-gray-900">Preguntas</h3>
                            {preguntasConfig.map(p => (
                                <div key={p.key}>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">{p.label}</label>
                                    {area(['preguntas', p.key])}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
};

export default Examenes;
