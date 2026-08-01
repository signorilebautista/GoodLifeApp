import React, { useCallback, useEffect, useState } from 'react';
import {
    Users, X, Building2, Dumbbell, ClipboardList, Clock, User,
    Search, LayoutGrid, List, Edit2, Save, ChevronLeft, Trash2,
} from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CrearCuentaProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Membresia { idMembresia: number; nombreMembresia: string; cantidadClases: number | null; precio: number | null; }
interface ZonaMuscular { idZona: number; nombre: string; }
interface Sede { idSede: number; nombreSede: string; }
interface Profesor { dni: string; nombre: string; apellido: string; }

type EntityType = 'socio' | 'sede' | 'profesor' | 'ejercicio' | 'plan' | 'turno';

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
const labelClass = 'text-xs font-medium text-gray-600 block mb-1';

const emptySocioForm = { dni: '', nombre: '', apellido: '', mail: '', telefono: '', direccion: '', idMembresia: '', clasesRestantes: '', deuda: '', idProfesor: '' };

const entityConfig: Record<EntityType, { label: string; color: string; icon: React.ReactNode; apiUrl: string; nameField: string; idField: string }> = {
    socio:    { label: 'Socio',     color: '#059669', icon: <Users size={28} />,         apiUrl: '/socios',              nameField: 'nombre',         idField: 'dni' },
    sede:     { label: 'Sede',      color: '#00A8E8', icon: <Building2 size={28} />,     apiUrl: '/turnero/sedes',       nameField: 'nombreSede',     idField: 'idSede' },
    profesor: { label: 'Profesor',  color: '#7C3AED', icon: <User size={28} />,          apiUrl: '/turnero/profesores',  nameField: 'nombre',         idField: 'dni' },
    ejercicio:{ label: 'Ejercicio', color: '#D97706', icon: <Dumbbell size={28} />,      apiUrl: '/ejercicios',          nameField: 'nombre',         idField: 'idEjercicio' },
    plan:     { label: 'Membresía', color: '#DC2626', icon: <ClipboardList size={28} />, apiUrl: '/socios/membresias',   nameField: 'nombreMembresia',idField: 'idMembresia' },
    turno:    { label: 'Turno',     color: '#0891B2', icon: <Clock size={28} />,         apiUrl: '/turnero',             nameField: 'horario',        idField: 'idTurno' },
};

const patchUrl = (type: EntityType, item: Record<string, unknown>): string => {
    const cfg = entityConfig[type];
    const id = item[cfg.idField];
    switch (type) {
        case 'socio':     return `/socios/${id}`;
        case 'sede':      return `/turnero/sedes/${id as number}`;
        case 'profesor':  return `/turnero/profesores/${id as string}`;
        case 'ejercicio': return `/ejercicios/${id}`;
        case 'plan':      return `/socios/membresias/${id}`;
        case 'turno':     return `/turnero/${id}`;
    }
};

const editFields: Record<EntityType, { key: string; label: string; type?: string }[]> = {
    socio:    [{ key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' }, { key: 'mail', label: 'Email', type: 'email' }, { key: 'telefono', label: 'Teléfono' }, { key: 'direccion', label: 'Dirección' }, { key: 'clasesRestantes', label: 'Clases restantes', type: 'number' }, { key: 'deuda', label: 'Deuda', type: 'number' }],
    sede:     [{ key: 'nombreSede', label: 'Nombre' }, { key: 'direccion', label: 'Dirección' }],
    profesor: [{ key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' }, { key: 'telefono', label: 'Teléfono' }],
    ejercicio:[{ key: 'nombre', label: 'Nombre' }, { key: 'videoUrl', label: 'Video URL' }],
    plan:     [{ key: 'nombreMembresia', label: 'Nombre de la membresía' }, { key: 'cantidadClases', label: 'Clases incluidas', type: 'number' }, { key: 'precio', label: 'Precio ($)', type: 'number' }],
    turno:    [{ key: 'horario', label: 'Horario' }, { key: 'dia', label: 'Día' }],
};

const StatusMsg = ({ status }: { status: { msg: string; ok: boolean } | null }) => {
    if (!status) return null;
    return (
        <p className={`m-0 text-[13px] px-2.5 py-2.5 rounded-lg ${status.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
            {status.msg}
        </p>
    );
};

const CrearCuenta: React.FC<CrearCuentaProps> = ({ onLogout, onNavigate }) => {
    const [addModal, setAddModal] = useState<EntityType | null>(null);

    const [modifyEntity, setModifyEntity] = useState<EntityType | null>(null);
    const [modifyItems, setModifyItems] = useState<Record<string, unknown>[]>([]);
    const [modifySearch, setModifySearch] = useState('');
    const [modifyView, setModifyView] = useState<'grid' | 'list'>('grid');
    const [modifyLoading, setModifyLoading] = useState(false);

    const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
    const [editForm, setEditForm] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState(false);
    const [editStatus, setEditStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [confirmDeleteEdit, setConfirmDeleteEdit] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [socioForm, setSocioForm] = useState(emptySocioForm);
    const [membresias, setMembresias] = useState<Membresia[]>([]);
    const [socioStatus, setSocioStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [socioLoading, setSocioLoading] = useState(false);

    const [ejercicioForm, setEjercicioForm] = useState({ nombre: '', videoUrl: '', idZona: '', nuevaZona: '' });
    const [zonaMode, setZonaMode] = useState<'select' | 'create'>('select');
    const [zonas, setZonas] = useState<ZonaMuscular[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [profesoresList, setProfesoresList] = useState<Profesor[]>([]);
    const [ejercicioStatus, setEjercicioStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [ejercicioLoading, setEjercicioLoading] = useState(false);

    const [sedeForm, setSedeForm] = useState({ nombre: '', direccion: '' });
    const [sedeStatus, setSedeStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [sedeLoading, setSedeLoading] = useState(false);

    const [profesorForm, setProfesorForm] = useState({ dni: '', nombre: '', apellido: '', telefono: '', mail: '', idSede: '', rol: 'profesor' });
    const [profesorStatus, setProfesorStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [profesorLoading, setProfesorLoading] = useState(false);

    const [planForm, setPlanForm] = useState({ nombre: '', cantidadClases: '', precio: '', descripcion: '' });
    const [planStatus, setPlanStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [planLoading, setPlanLoading] = useState(false);

    const [turnoForm, setTurnoForm] = useState({ dia: '', hora: '', profesor: '', sede: '' });

    useEffect(() => {
        fetch(`${API_URL}/socios/membresias`).then(r => r.ok ? r.json() : []).then(setMembresias).catch(() => {});
        fetch(`${API_URL}/ejercicios/zonas`).then(r => r.ok ? r.json() : []).then(setZonas).catch(() => {});
        fetch(`${API_URL}/turnero/sedes`).then(r => r.ok ? r.json() : []).then(setSedes).catch(() => {});
        fetch(`${API_URL}/turnero/profesores`).then(r => r.ok ? r.json() : []).then(setProfesoresList).catch(() => {});
    }, []);

    const openModify = useCallback(async (type: EntityType) => {
        setModifyEntity(type);
        setModifySearch('');
        setModifyView('grid');
        setModifyLoading(true);
        setModifyItems([]);
        setEditItem(null);
        setEditStatus(null);
        try {
            const res = await fetch(`${API_URL}${entityConfig[type].apiUrl}`);
            setModifyItems(res.ok ? await res.json() : []);
        } catch { setModifyItems([]); }
        finally { setModifyLoading(false); }
    }, []);

    const openEdit = (item: Record<string, unknown>) => {
        setEditItem(item);
        setEditStatus(null);
        setConfirmDeleteEdit(false);
        if (!modifyEntity) return;
        const fields = editFields[modifyEntity];
        const form: Record<string, string> = {};
        fields.forEach(f => { form[f.key] = String(item[f.key] ?? ''); });
        setEditForm(form);
    };

    const handleEditSave = async () => {
        if (!modifyEntity || !editItem) return;
        setEditLoading(true);
        setEditStatus(null);
        try {
            const body: Record<string, unknown> = {};
            editFields[modifyEntity].forEach(f => {
                const v = editForm[f.key];
                // El backend espera clasesRestantes/deuda como string numérico
                // (@IsNumberString), así que no convertimos a Number acá.
                if (v !== '') body[f.key] = v;
            });
            const url = patchUrl(modifyEntity, editItem);
            const res = await fetch(`${API_URL}${url}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.message ?? `Error ${res.status}`);
            }
            const updated = await res.json();
            setEditStatus({ msg: 'Guardado correctamente.', ok: true });
            setModifyItems(prev => prev.map(it => {
                const cfg = entityConfig[modifyEntity];
                return it[cfg.idField] === editItem[cfg.idField] ? { ...it, ...updated } : it;
            }));
            setEditItem({ ...editItem, ...updated });
        } catch (err: unknown) {
            setEditStatus({ msg: err instanceof Error ? err.message : 'Error al guardar.', ok: false });
        } finally {
            setEditLoading(false);
        }
    };

    const deleteUrl = (type: EntityType, item: Record<string, unknown>): string => {
        const cfg = entityConfig[type];
        const id = item[cfg.idField];
        switch (type) {
            case 'socio':     return `/socios/${id}`;
            case 'sede':      return `/turnero/sedes/${id}`;
            case 'profesor':  return `/turnero/profesores/${id}`;
            case 'ejercicio': return `/ejercicios/${id}`;
            case 'plan':      return `/socios/membresias/${id}`;
            case 'turno':     return `/turnero/${id}`;
        }
    };

    const handleDeleteEdit = async () => {
        if (!modifyEntity || !editItem) return;
        setDeleteLoading(true);
        try {
            const url = deleteUrl(modifyEntity, editItem);
            const res = await fetch(`${API_URL}${url}`, { method: 'DELETE' });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`); }
            const cfg = entityConfig[modifyEntity];
            setModifyItems(prev => prev.filter(it => it[cfg.idField] !== editItem[cfg.idField]));
            setEditItem(null);
            setConfirmDeleteEdit(false);
        } catch (err: unknown) {
            setEditStatus({ msg: err instanceof Error ? err.message : 'Error al eliminar.', ok: false });
            setConfirmDeleteEdit(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSedeSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSedeLoading(true); setSedeStatus(null);
        try {
            const res = await fetch(`${API_URL}/turnero/sedes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: sedeForm.nombre, direccion: sedeForm.direccion || undefined }) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const saved = await res.json();
            setSedeStatus({ msg: `Sede "${saved.nombreSede}" creada correctamente.`, ok: true });
            setSedeForm({ nombre: '', direccion: '' });
        } catch (err: unknown) { setSedeStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false }); }
        finally { setSedeLoading(false); }
    };

    const handleMembresiaSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setPlanLoading(true); setPlanStatus(null);
        try {
            const body: Record<string, unknown> = { nombreMembresia: planForm.nombre };
            if (planForm.cantidadClases) body.cantidadClases = Number(planForm.cantidadClases);
            if (planForm.precio) body.precio = Number(planForm.precio);
            const res = await fetch(`${API_URL}/socios/membresias`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const saved = await res.json();
            setPlanStatus({ msg: `Membresía "${saved.nombreMembresia}" creada correctamente.`, ok: true });
            setPlanForm({ nombre: '', cantidadClases: '', precio: '', descripcion: '' });
        } catch (err: unknown) { setPlanStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false }); }
        finally { setPlanLoading(false); }
    };

    const toEmbedUrl = (url: string) => {
        const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
        return m ? `https://www.youtube.com/embed/${m[1]}` : url;
    };

    const handleSocioSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSocioLoading(true); setSocioStatus(null);
        try {
            const body: Record<string, unknown> = { dni: socioForm.dni, nombre: socioForm.nombre, apellido: socioForm.apellido, mail: socioForm.mail || undefined, telefono: socioForm.telefono || undefined, direccion: socioForm.direccion || undefined, idMembresia: socioForm.idMembresia ? Number(socioForm.idMembresia) : undefined, clasesRestantes: socioForm.clasesRestantes || undefined, deuda: socioForm.deuda || undefined, idProfesor: socioForm.idProfesor || undefined };
            const res = await fetch(`${API_URL}/socios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error.'); }
            setSocioStatus({ msg: 'Socio creado correctamente.', ok: true });
            setSocioForm(emptySocioForm);
        } catch (err: unknown) { setSocioStatus({ msg: err instanceof Error ? err.message : 'Error.', ok: false }); }
        finally { setSocioLoading(false); }
    };

    const handleProfesorSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProfesorLoading(true); setProfesorStatus(null);
        try {
            const body: Record<string, string> = { dni: profesorForm.dni, nombre: profesorForm.nombre, apellido: profesorForm.apellido, rol: profesorForm.rol };
            if (profesorForm.telefono) body.telefono = profesorForm.telefono;
            if (profesorForm.mail) body.mail = profesorForm.mail;
            if (profesorForm.idSede) body.idSede = profesorForm.idSede;
            const res = await fetch(`${API_URL}/turnero/profesores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const saved = await res.json();
            setProfesorStatus({ msg: `Profesor "${saved.nombre} ${saved.apellido}" creado correctamente.`, ok: true });
            setProfesorForm({ dni: '', nombre: '', apellido: '', telefono: '', mail: '', idSede: '', rol: 'profesor' });
        } catch (err: unknown) { setProfesorStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false }); }
        finally { setProfesorLoading(false); }
    };

    const handleEjercicioSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setEjercicioLoading(true); setEjercicioStatus(null);
        try {
            const body: Record<string, unknown> = { nombre: ejercicioForm.nombre, videoUrl: ejercicioForm.videoUrl || undefined };
            if (zonaMode === 'select' && ejercicioForm.idZona) body.idZona = Number(ejercicioForm.idZona);
            else if (zonaMode === 'create' && ejercicioForm.nuevaZona.trim()) body.nuevaZona = ejercicioForm.nuevaZona.trim();
            const res = await fetch(`${API_URL}/ejercicios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error.'); }
            const saved = await res.json();
            const zr = await fetch(`${API_URL}/ejercicios/zonas`); if (zr.ok) setZonas(await zr.json());
            setEjercicioStatus({ msg: `Ejercicio "${saved.nombre}" guardado.`, ok: true });
            setEjercicioForm({ nombre: '', videoUrl: '', idZona: '', nuevaZona: '' });
        } catch (err: unknown) { setEjercicioStatus({ msg: err instanceof Error ? err.message : 'Error.', ok: false }); }
        finally { setEjercicioLoading(false); }
    };

    const cfg = modifyEntity ? entityConfig[modifyEntity] : null;
    const filteredItems = modifyItems.filter(item => {
        if (!cfg) return true;
        const val = (item[cfg.nameField] as string) ?? '';
        const val2 = modifyEntity === 'socio' ? ` ${(item['apellido'] as string) ?? ''}` : '';
        return (val + val2).toLowerCase().includes(modifySearch.toLowerCase());
    });

    const entities: EntityType[] = ['sede', 'profesor', 'socio', 'ejercicio', 'plan', 'turno'];
    const closeAddModal = () => { setAddModal(null); setSocioStatus(null); setEjercicioStatus(null); setSedeStatus(null); setPlanStatus(null); setProfesorStatus(null); };

    return (
        <>
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/crear-cuenta">
                <div className="w-full max-w-4xl pt-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-7 animate-fadeIn">¿Qué desea gestionar?</h2>
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                        {entities.map((type, index) => {
                            const c = entityConfig[type];
                            return (
                                <div
                                    key={type}
                                    className="bg-white rounded-2xl p-7 flex flex-col items-center gap-3.5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                                    style={{ border: `2px solid ${c.color}`, animationDelay: `${index * 60}ms` }}
                                >
                                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ color: c.color, backgroundColor: c.color + '15' }}>{c.icon}</div>
                                    <span className="text-lg font-bold text-gray-900">{c.label}</span>
                                    <div className="flex gap-2.5 w-full mt-1">
                                        <button
                                            onClick={() => setAddModal(type)}
                                            style={{ backgroundColor: c.color }}
                                            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-transform duration-150 active:scale-95 hover:brightness-110"
                                        >
                                            Agregar
                                        </button>
                                        <button
                                            onClick={() => openModify(type)}
                                            style={{ borderColor: c.color, color: c.color }}
                                            className="flex-1 py-2.5 rounded-lg border-[1.5px] bg-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <Edit2 size={14} /> Modificar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </AppShell>

            {/* ── ADD MODAL ── */}
            {addModal && (
                <div onClick={closeAddModal} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-popIn">
                        <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200"><X size={22} /></button>

                        {addModal === 'socio' && (
                            <>
                                <h3 className="text-lg font-bold mb-5">Agregar Socio</h3>
                                <form onSubmit={handleSocioSubmit} className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {([['dni','DNI *',true],['telefono','Teléfono',false],['nombre','Nombre *',true],['apellido','Apellido *',true]] as [string,string,boolean][]).map(([name,label,req]) => (
                                            <div key={name}><label className={labelClass}>{label}</label><input name={name} value={(socioForm as Record<string,string>)[name]} onChange={e => setSocioForm(f => ({...f,[e.target.name]:e.target.value}))} required={req} className={inputClass} /></div>
                                        ))}
                                    </div>
                                    <div><label className={labelClass}>Email</label><input name="mail" type="email" value={socioForm.mail} onChange={e => setSocioForm(f => ({...f,mail:e.target.value}))} className={inputClass} /></div>
                                    <div><label className={labelClass}>Dirección</label><input name="direccion" value={socioForm.direccion} onChange={e => setSocioForm(f => ({...f,direccion:e.target.value}))} className={inputClass} /></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div><label className={labelClass}>Membresía</label><select name="idMembresia" value={socioForm.idMembresia} onChange={e => { const m = membresias.find(m => String(m.idMembresia) === e.target.value); setSocioForm(f => ({...f, idMembresia: e.target.value, clasesRestantes: m?.cantidadClases != null ? String(m.cantidadClases) : f.clasesRestantes, deuda: m?.precio != null ? String(-m.precio) : f.deuda})); }} className={inputClass}><option value="">Sin membresía</option>{membresias.map(m => <option key={m.idMembresia} value={m.idMembresia}>{m.nombreMembresia}</option>)}</select></div>
                                        <div><label className={labelClass}>Clases</label><input name="clasesRestantes" value={socioForm.clasesRestantes} onChange={e => setSocioForm(f => ({...f,clasesRestantes:e.target.value}))} className={inputClass} placeholder="0" /></div>
                                        <div><label className={labelClass}>Deuda</label><input name="deuda" value={socioForm.deuda} onChange={e => setSocioForm(f => ({...f,deuda:e.target.value}))} className={inputClass} placeholder="0" /></div>
                                    </div>
                                    <div><label className={labelClass}>Profesor</label><select name="idProfesor" value={socioForm.idProfesor} onChange={e => setSocioForm(f => ({...f,idProfesor:e.target.value}))} className={inputClass}><option value="">Sin profesor</option>{profesoresList.map(p => <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>)}</select></div>
                                    <StatusMsg status={socioStatus} />
                                    <button type="submit" disabled={socioLoading} className={`py-2.5 rounded-lg text-white text-[15px] font-semibold mt-1 transition-all duration-150 active:scale-[0.98] ${socioLoading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>{socioLoading ? 'Guardando...' : 'Guardar Socio'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'sede' && (
                            <>
                                <h3 className="text-lg font-bold mb-5">Agregar Sede</h3>
                                <form onSubmit={handleSedeSubmit} className="flex flex-col gap-3">
                                    {([['nombre','Nombre *',true],['direccion','Dirección',false]] as [string,string,boolean][]).map(([f,l,req]) => (<div key={f}><label className={labelClass}>{l}</label><input required={req} value={(sedeForm as Record<string,string>)[f]} onChange={e => setSedeForm(s => ({...s,[f]:e.target.value}))} className={inputClass} /></div>))}
                                    <StatusMsg status={sedeStatus} />
                                    <button type="submit" disabled={sedeLoading} className={`py-2.5 rounded-lg text-white text-[15px] font-semibold mt-1 transition-all duration-150 active:scale-[0.98] ${sedeLoading ? 'bg-primary-300 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 shadow-sm'}`}>{sedeLoading ? 'Guardando...' : 'Guardar Sede'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'profesor' && (
                            <>
                                <h3 className="text-lg font-bold mb-5">Agregar Profesor</h3>
                                <form onSubmit={handleProfesorSubmit} className="flex flex-col gap-3.5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>DNI *</label><input required value={profesorForm.dni} onChange={e => setProfesorForm(s => ({ ...s, dni: e.target.value }))} className={inputClass} /></div>
                                        <div><label className={labelClass}>Teléfono</label><input value={profesorForm.telefono} onChange={e => setProfesorForm(s => ({ ...s, telefono: e.target.value }))} className={inputClass} /></div>
                                        <div><label className={labelClass}>Nombre *</label><input required value={profesorForm.nombre} onChange={e => setProfesorForm(s => ({ ...s, nombre: e.target.value }))} className={inputClass} /></div>
                                        <div><label className={labelClass}>Apellido *</label><input required value={profesorForm.apellido} onChange={e => setProfesorForm(s => ({ ...s, apellido: e.target.value }))} className={inputClass} /></div>
                                    </div>
                                    <div><label className={labelClass}>Email</label><input type="email" value={profesorForm.mail} onChange={e => setProfesorForm(s => ({ ...s, mail: e.target.value }))} className={inputClass} /></div>
                                    <div>
                                        <label className={labelClass}>Sede</label>
                                        <select value={profesorForm.idSede} onChange={e => setProfesorForm(s => ({ ...s, idSede: e.target.value }))} className={inputClass}>
                                            <option value="">Sin sede</option>
                                            {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Rol *</label>
                                        <select required value={profesorForm.rol} onChange={e => setProfesorForm(s => ({ ...s, rol: e.target.value }))} className={inputClass}>
                                            <option value="profesor">Profesor</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <StatusMsg status={profesorStatus} />
                                    <button type="submit" disabled={profesorLoading} className={`py-2.5 rounded-lg text-white text-[15px] font-semibold mt-1 transition-all duration-150 active:scale-[0.98] ${profesorLoading ? 'bg-violet-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 shadow-sm'}`}>{profesorLoading ? 'Guardando...' : 'Guardar Profesor'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'ejercicio' && (
                            <>
                                <h3 className="text-lg font-bold mb-5">Agregar Ejercicio</h3>
                                <form onSubmit={handleEjercicioSubmit} className="flex flex-col gap-3.5">
                                    <div><label className={labelClass}>Nombre del ejercicio *</label><input required value={ejercicioForm.nombre} onChange={e => setEjercicioForm(s => ({...s,nombre:e.target.value}))} className={inputClass} placeholder="Ej: Sentadilla frontal" /></div>
                                    <div>
                                        <label className={labelClass}>Zona muscular</label>
                                        <div className="flex gap-2 mb-2">
                                            {(['select','create'] as const).map(mode => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setZonaMode(mode)}
                                                    className={`px-3.5 py-1.5 rounded-full border text-[13px] transition-colors duration-150 ${zonaMode === mode ? 'bg-amber-600 border-amber-600 text-white font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'}`}
                                                >
                                                    {mode === 'select' ? 'Seleccionar existente' : 'Crear nueva'}
                                                </button>
                                            ))}
                                        </div>
                                        {zonaMode === 'select' ? (
                                            <select value={ejercicioForm.idZona} onChange={e => setEjercicioForm(s => ({...s,idZona:e.target.value}))} className={inputClass}><option value="">Sin zona</option>{zonas.map(z => <option key={z.idZona} value={z.idZona}>{z.nombre}</option>)}</select>
                                        ) : (
                                            <input value={ejercicioForm.nuevaZona} onChange={e => setEjercicioForm(s => ({...s,nuevaZona:e.target.value}))} className={inputClass} placeholder="Ej: Cuádriceps" />
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Video URL</label>
                                        <input value={ejercicioForm.videoUrl} onChange={e => setEjercicioForm(s => ({...s,videoUrl:e.target.value}))} className={inputClass} placeholder="https://youtube.com/..." />
                                        {ejercicioForm.videoUrl && (<div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video animate-fadeIn"><iframe src={toEmbedUrl(ejercicioForm.videoUrl)} className="w-full h-full border-none" allowFullScreen title="preview" /></div>)}
                                    </div>
                                    <StatusMsg status={ejercicioStatus} />
                                    <button type="submit" disabled={ejercicioLoading} className={`py-2.5 rounded-lg text-white text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] ${ejercicioLoading ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 shadow-sm'}`}>{ejercicioLoading ? 'Guardando...' : 'Guardar Ejercicio'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'plan' && (
                            <>
                                <h3 className="text-lg font-bold mb-5">Agregar Membresía</h3>
                                <form onSubmit={handleMembresiaSubmit} className="flex flex-col gap-3">
                                    <div><label className={labelClass}>Nombre de la membresía *</label><input required value={planForm.nombre} onChange={e => setPlanForm(s => ({...s,nombre:e.target.value}))} className={inputClass} /></div>
                                    <div><label className={labelClass}>Clases incluidas</label><input type="number" min="0" value={planForm.cantidadClases} onChange={e => setPlanForm(s => ({...s,cantidadClases:e.target.value}))} className={inputClass} placeholder="Ej: 10" /></div>
                                    <div><label className={labelClass}>Precio ($)</label><input type="number" min="0" value={planForm.precio} onChange={e => setPlanForm(s => ({...s,precio:e.target.value}))} className={inputClass} placeholder="Ej: 5000" /></div>
                                    <div><label className={labelClass}>Descripción</label><input value={planForm.descripcion} onChange={e => setPlanForm(s => ({...s,descripcion:e.target.value}))} className={inputClass} /></div>
                                    <StatusMsg status={planStatus} />
                                    <button type="submit" disabled={planLoading} className={`py-2.5 rounded-lg text-white text-[15px] font-semibold mt-1 transition-all duration-150 active:scale-[0.98] ${planLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm'}`}>{planLoading ? 'Guardando...' : 'Guardar Membresía'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'turno' && (
                            <>
                                <h3 className="text-lg font-bold mb-5">Agregar Turno</h3>
                                <div className="flex flex-col gap-3">
                                    {([['dia','Día'],['hora','Hora'],['profesor','Profesor'],['sede','Sede']] as [string,string][]).map(([f,l]) => (<div key={f}><label className={labelClass}>{l}</label><input value={(turnoForm as Record<string,string>)[f]} onChange={e => setTurnoForm(s => ({...s,[f]:e.target.value}))} className={inputClass} /></div>))}
                                    <button className="py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[15px] font-semibold mt-1 shadow-sm transition-all duration-150 active:scale-[0.98]">Guardar Turno</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODIFY MODAL ── */}
            {modifyEntity && cfg && (
                <div onClick={() => { setModifyEntity(null); setEditItem(null); }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn">
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-[90%] max-w-4xl max-h-[85vh] flex overflow-hidden relative shadow-2xl animate-popIn">

                        {/* Left: list panel */}
                        <div className={`flex-1 flex flex-col ${editItem ? 'border-r border-gray-100' : ''}`}>
                            <div className="px-6 pt-5 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 m-0">Modificar {cfg.label}s</h3>
                                <button onClick={() => { setModifyEntity(null); setEditItem(null); }} className="text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200"><X size={22} /></button>
                            </div>

                            <div className="px-6 py-3.5 flex gap-2.5 items-center">
                                <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition-all duration-150">
                                    <Search size={16} className="text-gray-400" />
                                    <input value={modifySearch} onChange={e => setModifySearch(e.target.value)} placeholder={`Buscar ${cfg.label.toLowerCase()}...`} className="border-none outline-none bg-transparent text-sm flex-1" />
                                </div>
                                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => setModifyView('grid')} className={`px-2.5 py-1.5 rounded-md flex items-center transition-colors duration-150 ${modifyView === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}><LayoutGrid size={17} /></button>
                                    <button onClick={() => setModifyView('list')} className={`px-2.5 py-1.5 rounded-md flex items-center transition-colors duration-150 ${modifyView === 'list' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}><List size={17} /></button>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 px-6 pb-6">
                                {modifyLoading ? (
                                    <p className="text-gray-500 text-center py-8">Cargando...</p>
                                ) : filteredItems.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Sin resultados.</p>
                                ) : modifyView === 'grid' ? (
                                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                        {filteredItems.map((item, i) => {
                                            const isSelected = editItem && editItem[cfg.idField] === item[cfg.idField];
                                            return (
                                                <div
                                                    key={i}
                                                    className="rounded-xl p-3.5 flex flex-col gap-2 transition-colors duration-150 animate-fadeIn"
                                                    style={{
                                                        animationDelay: `${Math.min(i, 10) * 30}ms`,
                                                        backgroundColor: isSelected ? cfg.color + '10' : 'var(--surface-muted)',
                                                        border: `1px solid ${isSelected ? cfg.color : 'var(--border-muted)'}`,
                                                    }}
                                                >
                                                    <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                                                        {React.cloneElement(cfg.icon as React.ReactElement, { size: 16 })}
                                                    </div>
                                                    <p className="text-[13px] font-semibold text-gray-900 m-0 break-words">
                                                        {modifyEntity === 'socio' ? `${item['nombre'] as string} ${(item['apellido'] as string) ?? ''}` : String(item[cfg.nameField] ?? '—')}
                                                    </p>
                                                    {modifyEntity === 'socio' && <p className="text-[11px] text-gray-500 m-0">DNI: {item['dni'] as string}</p>}
                                                    {modifyEntity === 'ejercicio' && item['zona'] && <p className="text-[11px] text-gray-500 m-0">{(item['zona'] as { nombre: string }).nombre}</p>}
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="mt-auto py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition-colors duration-150"
                                                        style={{
                                                            border: `1px solid ${cfg.color}`,
                                                            backgroundColor: isSelected ? cfg.color : 'var(--surface-card)',
                                                            color: isSelected ? 'white' : cfg.color,
                                                        }}
                                                    >
                                                        <Edit2 size={12} /> Editar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {filteredItems.map((item, i) => {
                                            const isSelected = editItem && editItem[cfg.idField] === item[cfg.idField];
                                            return (
                                                <div
                                                    key={i}
                                                    className="rounded-lg px-4 py-3 flex items-center gap-3.5 transition-colors duration-150 animate-fadeIn"
                                                    style={{
                                                        animationDelay: `${Math.min(i, 10) * 30}ms`,
                                                        backgroundColor: isSelected ? cfg.color + '10' : 'var(--surface-muted)',
                                                        border: `1px solid ${isSelected ? cfg.color : 'var(--border-muted)'}`,
                                                    }}
                                                >
                                                    <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>
                                                        {React.cloneElement(cfg.icon as React.ReactElement, { size: 16 })}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 m-0">
                                                            {modifyEntity === 'socio' ? `${item['nombre'] as string} ${(item['apellido'] as string) ?? ''}` : String(item[cfg.nameField] ?? '—')}
                                                        </p>
                                                        {modifyEntity === 'socio' && <p className="text-xs text-gray-500 mt-0.5">DNI: {item['dni'] as string} · {(item['plan'] as string) ?? 'Sin plan'}</p>}
                                                        {modifyEntity === 'ejercicio' && item['zona'] && <p className="text-xs text-gray-500 mt-0.5">{(item['zona'] as { nombre: string }).nombre}</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="px-3.5 py-1.5 rounded-md text-[13px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors duration-150"
                                                        style={{
                                                            border: `1px solid ${cfg.color}`,
                                                            backgroundColor: isSelected ? cfg.color : 'var(--surface-card)',
                                                            color: isSelected ? 'white' : cfg.color,
                                                        }}
                                                    >
                                                        <Edit2 size={13} /> Editar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: edit panel */}
                        {editItem && modifyEntity && (
                            <div className="w-[300px] shrink-0 flex flex-col bg-gray-50 animate-fadeIn">
                                <div className="px-5 pt-5 flex items-center gap-2">
                                    <button onClick={() => setEditItem(null)} className="text-gray-500 hover:text-primary-600 flex items-center p-1 transition-colors duration-150"><ChevronLeft size={18} /></button>
                                    <h4 className="text-[15px] font-bold text-gray-900 m-0">
                                        {modifyEntity === 'socio'
                                            ? `${editItem['nombre'] as string} ${(editItem['apellido'] as string) ?? ''}`
                                            : String(editItem[cfg.nameField] ?? 'Editar')}
                                    </h4>
                                </div>

                                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                                    {editFields[modifyEntity].map(field => (
                                        <div key={field.key}>
                                            <label className="text-[11px] font-medium text-gray-500 block mb-1 uppercase tracking-wide">{field.label}</label>
                                            <input
                                                type={field.type ?? 'text'}
                                                value={editForm[field.key] ?? ''}
                                                onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                                                className={`${inputClass} text-[13px]`}
                                            />
                                        </div>
                                    ))}
                                    <StatusMsg status={editStatus} />
                                </div>

                                <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
                                    <button
                                        onClick={handleEditSave}
                                        disabled={editLoading}
                                        style={{ backgroundColor: editLoading ? '#9CA3AF' : cfg.color }}
                                        className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98]"
                                    >
                                        <Save size={15} /> {editLoading ? 'Guardando...' : 'Guardar cambios'}
                                    </button>

                                    {!confirmDeleteEdit ? (
                                        <button onClick={() => setConfirmDeleteEdit(true)} className="w-full py-2.5 rounded-lg border border-red-500 bg-white text-red-500 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors duration-150">
                                            <Trash2 size={15} /> Eliminar
                                        </button>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-2 animate-fadeIn">
                                            <p className="m-0 text-[13px] font-semibold text-red-800">¿Confirmar eliminación?</p>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => setConfirmDeleteEdit(false)} className="flex-1 py-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md text-[13px] font-semibold transition-colors duration-150">
                                                    Cancelar
                                                </button>
                                                <button onClick={handleDeleteEdit} disabled={deleteLoading} className={`flex-1 py-1.5 rounded-md text-[13px] font-semibold text-white transition-colors duration-150 ${deleteLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>
                                                    {deleteLoading ? '...' : 'Sí, eliminar'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default CrearCuenta;
