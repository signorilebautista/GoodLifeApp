import React, { useCallback, useEffect, useState } from 'react';
import {
    Users, Calendar, FileText, BarChart3, Settings, LogOut, UserPlus, X,
    Building2, Dumbbell, ClipboardList, Clock, User, LogIn, GraduationCap,
    Search, LayoutGrid, List, Edit2, Save, ChevronLeft, Trash2, Home,
} from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CrearCuentaProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Membresia { idMembresia: number; nombreMembresia: string; }
interface ZonaMuscular { idZona: number; nombre: string; }
interface Sede { idSede: number; nombreSede: string; }
interface Profesor { dni: string; nombre: string; apellido: string; }

type EntityType = 'socio' | 'sede' | 'profesor' | 'ejercicio' | 'plan' | 'turno';

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

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB',
    borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
};

const emptySocioForm = { dni: '', nombre: '', apellido: '', mail: '', telefono: '', direccion: '', idMembresia: '', clasesRestantes: '', deuda: '', idProfesor: '' };

const entityConfig: Record<EntityType, { label: string; color: string; icon: React.ReactNode; apiUrl: string; nameField: string; idField: string }> = {
    socio:    { label: 'Socio',     color: '#059669', icon: <Users size={28} />,         apiUrl: '/socios',              nameField: 'nombre',         idField: 'dni' },
    sede:     { label: 'Sede',      color: '#1976D2', icon: <Building2 size={28} />,     apiUrl: '/turnero/sedes',       nameField: 'nombreSede',     idField: 'idSede' },
    profesor: { label: 'Profesor',  color: '#7C3AED', icon: <User size={28} />,          apiUrl: '/turnero/profesores',  nameField: 'nombre',         idField: 'dni' },
    ejercicio:{ label: 'Ejercicio', color: '#D97706', icon: <Dumbbell size={28} />,      apiUrl: '/ejercicios',          nameField: 'nombre',         idField: 'idEjercicio' },
    plan:     { label: 'Membresía', color: '#DC2626', icon: <ClipboardList size={28} />, apiUrl: '/socios/membresias',   nameField: 'nombreMembresia',idField: 'idMembresia' },
    turno:    { label: 'Turno',     color: '#0891B2', icon: <Clock size={28} />,         apiUrl: '/turnero',             nameField: 'horario',        idField: 'idTurno' },
};

// Patch endpoints per entity
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

// Fields to show in the edit form per entity
const editFields: Record<EntityType, { key: string; label: string; type?: string }[]> = {
    socio:    [{ key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' }, { key: 'mail', label: 'Email', type: 'email' }, { key: 'telefono', label: 'Teléfono' }, { key: 'direccion', label: 'Dirección' }, { key: 'clasesRestantes', label: 'Clases restantes', type: 'number' }, { key: 'deuda', label: 'Deuda', type: 'number' }],
    sede:     [{ key: 'nombreSede', label: 'Nombre' }, { key: 'direccion', label: 'Dirección' }],
    profesor: [{ key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' }, { key: 'telefono', label: 'Teléfono' }],
    ejercicio:[{ key: 'nombre', label: 'Nombre' }, { key: 'videoUrl', label: 'Video URL' }],
    plan:     [{ key: 'nombreMembresia', label: 'Nombre de la membresía' }],
    turno:    [{ key: 'horario', label: 'Horario' }, { key: 'dia', label: 'Día' }],
};

const CrearCuenta: React.FC<CrearCuentaProps> = ({ onLogout, onNavigate }) => {
    // Add modal
    const [addModal, setAddModal] = useState<EntityType | null>(null);

    // Modify modal state
    const [modifyEntity, setModifyEntity] = useState<EntityType | null>(null);
    const [modifyItems, setModifyItems] = useState<Record<string, unknown>[]>([]);
    const [modifySearch, setModifySearch] = useState('');
    const [modifyView, setModifyView] = useState<'grid' | 'list'>('grid');
    const [modifyLoading, setModifyLoading] = useState(false);

    // Edit panel state (shown inside modify modal)
    const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
    const [editForm, setEditForm] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState(false);
    const [editStatus, setEditStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [confirmDeleteEdit, setConfirmDeleteEdit] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Socio add form
    const [socioForm, setSocioForm] = useState(emptySocioForm);
    const [membresias, setMembresias] = useState<Membresia[]>([]);
    const [socioStatus, setSocioStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [socioLoading, setSocioLoading] = useState(false);

    // Ejercicio add form
    const [ejercicioForm, setEjercicioForm] = useState({ nombre: '', videoUrl: '', idZona: '', nuevaZona: '' });
    const [zonaMode, setZonaMode] = useState<'select' | 'create'>('select');
    const [zonas, setZonas] = useState<ZonaMuscular[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [profesoresList, setProfesoresList] = useState<Profesor[]>([]);
    const [ejercicioStatus, setEjercicioStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [ejercicioLoading, setEjercicioLoading] = useState(false);

    // Simple forms
    const [sedeForm, setSedeForm] = useState({ nombre: '', direccion: '' });
    const [sedeStatus, setSedeStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [sedeLoading, setSedeLoading] = useState(false);

    const [profesorForm, setProfesorForm] = useState({ dni: '', nombre: '', apellido: '', telefono: '', mail: '', idSede: '' });
    const [profesorStatus, setProfesorStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [profesorLoading, setProfesorLoading] = useState(false);

    const [planForm, setPlanForm] = useState({ nombre: '', descripcion: '' });
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
                if (v !== '') body[f.key] = f.type === 'number' ? Number(v) : v;
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
            // Refresh list
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
            const res = await fetch(`${API_URL}/socios/membresias`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombreMembresia: planForm.nombre }) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const saved = await res.json();
            setPlanStatus({ msg: `Membresía "${saved.nombreMembresia}" creada correctamente.`, ok: true });
            setPlanForm({ nombre: '', descripcion: '' });
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
            const res = await fetch(`${API_URL}/socios/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error.'); }
            setSocioStatus({ msg: 'Socio creado correctamente.', ok: true });
            setSocioForm(emptySocioForm);
        } catch (err: unknown) { setSocioStatus({ msg: err instanceof Error ? err.message : 'Error.', ok: false }); }
        finally { setSocioLoading(false); }
    };

    const handleProfesorSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setProfesorLoading(true); setProfesorStatus(null);
        try {
            const body: Record<string, string> = { dni: profesorForm.dni, nombre: profesorForm.nombre, apellido: profesorForm.apellido };
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
            setProfesorForm({ dni: '', nombre: '', apellido: '', telefono: '', mail: '', idSede: '' });
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

    const sidebar = (
        <aside style={{ width: '220px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #D1D5DB' }}>
            <nav style={{ flex: 1, padding: '8px 0' }}>
                {menuItems.map(item => (
                    <button key={item.label} onClick={() => item.path !== '/crear-cuenta' && onNavigate(item.path)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: item.path === '/crear-cuenta' ? '#1976D2' : '#374151', backgroundColor: item.path === '/crear-cuenta' ? '#EFF6FF' : 'transparent', border: 'none', cursor: item.path === '/crear-cuenta' ? 'default' : 'pointer', fontSize: '16px', textAlign: 'left', fontWeight: item.path === '/crear-cuenta' ? '600' : '400' }}
                        onMouseEnter={e => { if (item.path !== '/crear-cuenta') e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                        onMouseLeave={e => { if (item.path !== '/crear-cuenta') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <item.icon size={20} /><span>{item.label}</span>
                    </button>
                ))}
            </nav>
            <div style={{ borderTop: '1px solid #D1D5DB' }}>
                <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <LogOut size={20} /><span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );

    const entities: EntityType[] = ['sede', 'profesor', 'socio', 'ejercicio', 'plan', 'turno'];

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
                <main style={{ flex: 1, backgroundColor: '#CCCCCC', padding: '40px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '32px' }}>Â¿Qué desea gestionar?</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 200px)', gap: '20px' }}>
                        {entities.map(type => {
                            const c = entityConfig[type];
                            return (
                                <div key={type} style={{ backgroundColor: 'white', border: `2px solid ${c.color}`, borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
                                    <div style={{ color: c.color }}>{c.icon}</div>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{c.label}</span>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <button onClick={() => setAddModal(type)} style={{ flex: 1, padding: '8px 0', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: c.color, color: 'white', fontSize: '13px', fontWeight: '600' }}>Agregar</button>
                                        <button onClick={() => openModify(type)} style={{ flex: 1, padding: '8px 0', borderRadius: '6px', border: `1.5px solid ${c.color}`, cursor: 'pointer', backgroundColor: 'white', color: c.color, fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <Edit2 size={13} /> Modificar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>

            {/* â”€â”€ ADD MODAL â”€â”€ */}
            {addModal && (
                <div onClick={() => { setAddModal(null); setSocioStatus(null); setEjercicioStatus(null); setSedeStatus(null); setPlanStatus(null); setProfesorStatus(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => { setAddModal(null); setSocioStatus(null); setEjercicioStatus(null); setSedeStatus(null); setPlanStatus(null); setProfesorStatus(null); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={22} /></button>

                        {addModal === 'socio' && (
                            <>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agregar Socio</h3>
                                <form onSubmit={handleSocioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {([['dni','DNI *',true],['telefono','Teléfono',false],['nombre','Nombre *',true],['apellido','Apellido *',true]] as [string,string,boolean][]).map(([name,label,req]) => (
                                            <div key={name}><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>{label}</label><input name={name} value={(socioForm as Record<string,string>)[name]} onChange={e => setSocioForm(f => ({...f,[e.target.name]:e.target.value}))} required={req} style={inputStyle} /></div>
                                        ))}
                                    </div>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label><input name="mail" type="email" value={socioForm.mail} onChange={e => setSocioForm(f => ({...f,mail:e.target.value}))} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Dirección</label><input name="direccion" value={socioForm.direccion} onChange={e => setSocioForm(f => ({...f,direccion:e.target.value}))} style={inputStyle} /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Membresía</label><select name="idMembresia" value={socioForm.idMembresia} onChange={e => setSocioForm(f => ({...f,idMembresia:e.target.value}))} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">Sin membresía</option>{membresias.map(m => <option key={m.idMembresia} value={m.idMembresia}>{m.nombreMembresia}</option>)}</select></div>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Clases</label><input name="clasesRestantes" value={socioForm.clasesRestantes} onChange={e => setSocioForm(f => ({...f,clasesRestantes:e.target.value}))} style={inputStyle} placeholder="0" /></div>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Deuda</label><input name="deuda" value={socioForm.deuda} onChange={e => setSocioForm(f => ({...f,deuda:e.target.value}))} style={inputStyle} placeholder="0" /></div>
                                    </div>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Profesor</label><select name="idProfesor" value={socioForm.idProfesor} onChange={e => setSocioForm(f => ({...f,idProfesor:e.target.value}))} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">Sin profesor</option>{profesoresList.map(p => <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>)}</select></div>
                                    {socioStatus && <p style={{ margin: 0, fontSize: '13px', color: socioStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: socioStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{socioStatus.msg}</p>}
                                    <button type="submit" disabled={socioLoading} style={{ padding: '11px', backgroundColor: socioLoading ? '#93C5FD' : '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: socioLoading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>{socioLoading ? 'Guardando...' : 'Guardar Socio'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'sede' && (
                            <>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agregar Sede</h3>
                                <form onSubmit={handleSedeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {([['nombre','Nombre *',true],['direccion','Dirección',false]] as [string,string,boolean][]).map(([f,l,req]) => (<div key={f}><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>{l}</label><input required={req} value={(sedeForm as Record<string,string>)[f]} onChange={e => setSedeForm(s => ({...s,[f]:e.target.value}))} style={inputStyle} /></div>))}
                                    {sedeStatus && <p style={{ margin: 0, fontSize: '13px', color: sedeStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: sedeStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{sedeStatus.msg}</p>}
                                    <button type="submit" disabled={sedeLoading} style={{ padding: '11px', backgroundColor: sedeLoading ? '#93C5FD' : '#1976D2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: sedeLoading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>{sedeLoading ? 'Guardando...' : 'Guardar Sede'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'profesor' && (
                            <>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agregar Profesor</h3>
                                <form onSubmit={handleProfesorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>DNI *</label><input required value={profesorForm.dni} onChange={e => setProfesorForm(s => ({ ...s, dni: e.target.value }))} style={inputStyle} /></div>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Teléfono</label><input value={profesorForm.telefono} onChange={e => setProfesorForm(s => ({ ...s, telefono: e.target.value }))} style={inputStyle} /></div>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Nombre *</label><input required value={profesorForm.nombre} onChange={e => setProfesorForm(s => ({ ...s, nombre: e.target.value }))} style={inputStyle} /></div>
                                        <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Apellido *</label><input required value={profesorForm.apellido} onChange={e => setProfesorForm(s => ({ ...s, apellido: e.target.value }))} style={inputStyle} /></div>
                                    </div>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label><input type="email" value={profesorForm.mail} onChange={e => setProfesorForm(s => ({ ...s, mail: e.target.value }))} style={inputStyle} /></div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Sede</label>
                                        <select value={profesorForm.idSede} onChange={e => setProfesorForm(s => ({ ...s, idSede: e.target.value }))} style={{ ...inputStyle, backgroundColor: 'white' }}>
                                            <option value="">Sin sede</option>
                                            {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                                        </select>
                                    </div>
                                    {profesorStatus && <p style={{ margin: 0, fontSize: '13px', color: profesorStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: profesorStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{profesorStatus.msg}</p>}
                                    <button type="submit" disabled={profesorLoading} style={{ padding: '11px', backgroundColor: profesorLoading ? '#C4B5FD' : '#7C3AED', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: profesorLoading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>{profesorLoading ? 'Guardando...' : 'Guardar Profesor'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'ejercicio' && (
                            <>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agregar Ejercicio</h3>
                                <form onSubmit={handleEjercicioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Nombre del ejercicio *</label><input required value={ejercicioForm.nombre} onChange={e => setEjercicioForm(s => ({...s,nombre:e.target.value}))} style={inputStyle} placeholder="Ej: Sentadilla frontal" /></div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '6px' }}>Zona muscular</label>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            {(['select','create'] as const).map(mode => (<button key={mode} type="button" onClick={() => setZonaMode(mode)} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid #D1D5DB', cursor: 'pointer', fontSize: '13px', backgroundColor: zonaMode === mode ? '#D97706' : 'white', color: zonaMode === mode ? 'white' : '#374151', fontWeight: zonaMode === mode ? '600' : '400' }}>{mode === 'select' ? 'Seleccionar existente' : 'Crear nueva'}</button>))}
                                        </div>
                                        {zonaMode === 'select' ? (<select value={ejercicioForm.idZona} onChange={e => setEjercicioForm(s => ({...s,idZona:e.target.value}))} style={{ ...inputStyle, backgroundColor: 'white' }}><option value="">Sin zona</option>{zonas.map(z => <option key={z.idZona} value={z.idZona}>{z.nombre}</option>)}</select>) : (<input value={ejercicioForm.nuevaZona} onChange={e => setEjercicioForm(s => ({...s,nuevaZona:e.target.value}))} style={inputStyle} placeholder="Ej: Cuádriceps" />)}
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Video URL</label>
                                        <input value={ejercicioForm.videoUrl} onChange={e => setEjercicioForm(s => ({...s,videoUrl:e.target.value}))} style={inputStyle} placeholder="https://youtube.com/..." />
                                        {ejercicioForm.videoUrl && (<div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}><iframe src={toEmbedUrl(ejercicioForm.videoUrl)} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title="preview" /></div>)}
                                    </div>
                                    {ejercicioStatus && <p style={{ margin: 0, fontSize: '13px', color: ejercicioStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: ejercicioStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{ejercicioStatus.msg}</p>}
                                    <button type="submit" disabled={ejercicioLoading} style={{ padding: '11px', backgroundColor: ejercicioLoading ? '#FCD34D' : '#D97706', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: ejercicioLoading ? 'not-allowed' : 'pointer' }}>{ejercicioLoading ? 'Guardando...' : 'Guardar Ejercicio'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'plan' && (
                            <>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agregar Membresía</h3>
                                <form onSubmit={handleMembresiaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Nombre de la membresía *</label><input required value={planForm.nombre} onChange={e => setPlanForm(s => ({...s,nombre:e.target.value}))} style={inputStyle} /></div>
                                    <div><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Descripción</label><input value={planForm.descripcion} onChange={e => setPlanForm(s => ({...s,descripcion:e.target.value}))} style={inputStyle} /></div>
                                    {planStatus && <p style={{ margin: 0, fontSize: '13px', color: planStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: planStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{planStatus.msg}</p>}
                                    <button type="submit" disabled={planLoading} style={{ padding: '11px', backgroundColor: planLoading ? '#FCA5A5' : '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: planLoading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>{planLoading ? 'Guardando...' : 'Guardar Membresía'}</button>
                                </form>
                            </>
                        )}

                        {addModal === 'turno' && (
                            <>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Agregar Turno</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {([['dia','Día'],['hora','Hora'],['profesor','Profesor'],['sede','Sede']] as [string,string][]).map(([f,l]) => (<div key={f}><label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>{l}</label><input value={(turnoForm as Record<string,string>)[f]} onChange={e => setTurnoForm(s => ({...s,[f]:e.target.value}))} style={inputStyle} /></div>))}
                                    <button style={{ padding: '11px', backgroundColor: '#0891B2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>Guardar Turno</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* â”€â”€ MODIFY MODAL â”€â”€ */}
            {modifyEntity && cfg && (
                <div onClick={() => { setModifyEntity(null); setEditItem(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', width: '90%', maxWidth: '900px', maxHeight: '85vh', display: 'flex', overflow: 'hidden', position: 'relative' }}>

                        {/* Left: list panel */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: editItem ? '1px solid #E5E7EB' : 'none' }}>
                            {/* Header */}
                            <div style={{ padding: '20px 24px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Modificar {cfg.label}s</h3>
                                <button onClick={() => { setModifyEntity(null); setEditItem(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={22} /></button>
                            </div>

                            {/* Toolbar */}
                            <div style={{ padding: '14px 24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '8px 12px' }}>
                                    <Search size={16} color="#6B7280" />
                                    <input value={modifySearch} onChange={e => setModifySearch(e.target.value)} placeholder={`Buscar ${cfg.label.toLowerCase()}...`} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1 }} />
                                </div>
                                <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '4px' }}>
                                    <button onClick={() => setModifyView('grid')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: modifyView === 'grid' ? '#1976D2' : 'transparent', color: modifyView === 'grid' ? 'white' : '#374151', display: 'flex', alignItems: 'center' }}><LayoutGrid size={17} /></button>
                                    <button onClick={() => setModifyView('list')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: modifyView === 'list' ? '#1976D2' : 'transparent', color: modifyView === 'list' ? 'white' : '#374151', display: 'flex', alignItems: 'center' }}><List size={17} /></button>
                                </div>
                            </div>

                            {/* Items */}
                            <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 24px 24px' }}>
                                {modifyLoading ? (
                                    <p style={{ color: '#6B7280', textAlign: 'center', padding: '32px' }}>Cargando...</p>
                                ) : filteredItems.length === 0 ? (
                                    <p style={{ color: '#6B7280', textAlign: 'center', padding: '32px' }}>Sin resultados.</p>
                                ) : modifyView === 'grid' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                                        {filteredItems.map((item, i) => {
                                            const isSelected = editItem && editItem[cfg.idField] === item[cfg.idField];
                                            return (
                                                <div key={i} style={{ backgroundColor: isSelected ? cfg.color + '10' : '#F9FAFB', border: `1px solid ${isSelected ? cfg.color : '#E5E7EB'}`, borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: cfg.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                                                        {React.cloneElement(cfg.icon as React.ReactElement, { size: 16 })}
                                                    </div>
                                                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0, wordBreak: 'break-word' }}>
                                                        {modifyEntity === 'socio' ? `${item['nombre'] as string} ${(item['apellido'] as string) ?? ''}` : String(item[cfg.nameField] ?? 'â€”')}
                                                    </p>
                                                    {modifyEntity === 'socio' && <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>DNI: {item['dni'] as string}</p>}
                                                    {modifyEntity === 'ejercicio' && item['zona'] && <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>{(item['zona'] as { nombre: string }).nombre}</p>}
                                                    <button onClick={() => openEdit(item)} style={{ marginTop: 'auto', padding: '6px', borderRadius: '6px', border: `1px solid ${cfg.color}`, backgroundColor: isSelected ? cfg.color : 'white', color: isSelected ? 'white' : cfg.color, fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                        <Edit2 size={12} /> Editar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {filteredItems.map((item, i) => {
                                            const isSelected = editItem && editItem[cfg.idField] === item[cfg.idField];
                                            return (
                                                <div key={i} style={{ backgroundColor: isSelected ? cfg.color + '10' : '#F9FAFB', border: `1px solid ${isSelected ? cfg.color : '#E5E7EB'}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: cfg.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
                                                        {React.cloneElement(cfg.icon as React.ReactElement, { size: 16 })}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                                            {modifyEntity === 'socio' ? `${item['nombre'] as string} ${(item['apellido'] as string) ?? ''}` : String(item[cfg.nameField] ?? 'â€”')}
                                                        </p>
                                                        {modifyEntity === 'socio' && <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>DNI: {item['dni'] as string} Â· {(item['plan'] as string) ?? 'Sin plan'}</p>}
                                                        {modifyEntity === 'ejercicio' && item['zona'] && <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{(item['zona'] as { nombre: string }).nombre}</p>}
                                                    </div>
                                                    <button onClick={() => openEdit(item)} style={{ padding: '6px 14px', borderRadius: '6px', border: `1px solid ${cfg.color}`, backgroundColor: isSelected ? cfg.color : 'white', color: isSelected ? 'white' : cfg.color, fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
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
                            <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
                                <div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => setEditItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', padding: '4px' }}><ChevronLeft size={18} /></button>
                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                        {modifyEntity === 'socio'
                                            ? `${editItem['nombre'] as string} ${(editItem['apellido'] as string) ?? ''}`
                                            : String(editItem[cfg.nameField] ?? 'Editar')}
                                    </h4>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {editFields[modifyEntity].map(field => (
                                        <div key={field.key}>
                                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{field.label}</label>
                                            <input
                                                type={field.type ?? 'text'}
                                                value={editForm[field.key] ?? ''}
                                                onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                                                style={{ ...inputStyle, fontSize: '13px' }}
                                            />
                                        </div>
                                    ))}

                                    {editStatus && (
                                        <p style={{ margin: 0, fontSize: '13px', color: editStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: editStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>
                                            {editStatus.msg}
                                        </p>
                                    )}
                                </div>

                                <div style={{ padding: '12px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button onClick={handleEditSave} disabled={editLoading} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', cursor: editLoading ? 'not-allowed' : 'pointer', backgroundColor: editLoading ? '#9CA3AF' : cfg.color, color: 'white', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Save size={15} /> {editLoading ? 'Guardando...' : 'Guardar cambios'}
                                    </button>

                                    {!confirmDeleteEdit ? (
                                        <button onClick={() => setConfirmDeleteEdit(true)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #EF4444', cursor: 'pointer', backgroundColor: 'white', color: '#EF4444', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <Trash2 size={15} /> Eliminar
                                        </button>
                                    ) : (
                                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#991B1B' }}>Â¿Confirmar eliminación?</p>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => setConfirmDeleteEdit(false)} style={{ flex: 1, padding: '7px', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                                    Cancelar
                                                </button>
                                                <button onClick={handleDeleteEdit} disabled={deleteLoading} style={{ flex: 1, padding: '7px', backgroundColor: deleteLoading ? '#9CA3AF' : '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: deleteLoading ? 'not-allowed' : 'pointer' }}>
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
        </div>
    );
};

export default CrearCuenta;

