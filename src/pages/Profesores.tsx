import React, { useEffect, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, UserPlus, LogIn, GraduationCap, X, Plus, Search, LayoutGrid, List, Trash2, Pencil, Check, Home } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ProfesoresProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Profesor {
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    mail: string | null;
    idSede: string | null;
}

interface Sede {
    idSede: number;
    nombreSede: string;
}

const emptyForm = { dni: '', nombre: '', apellido: '', telefono: '', mail: '', idSede: '' };

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

const Profesores: React.FC<ProfesoresProps> = ({ onLogout, onNavigate }) => {
    const [profesores, setProfesores] = useState<Profesor[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selected, setSelected] = useState<Profesor | null>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<Omit<Profesor, 'dni'>>({ nombre: '', apellido: '', telefono: null, mail: null, idSede: null });
    const [editLoading, setEditLoading] = useState(false);
    const [editStatus, setEditStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formLoading, setFormLoading] = useState(false);
    const [formStatus, setFormStatus] = useState<{ msg: string; ok: boolean } | null>(null);

    const fetchProfesores = () => {
        setLoading(true);
        setError(null);
        fetch(`${API_URL}/turnero/profesores`)
            .then((res) => { if (!res.ok) throw new Error('Error al cargar profesores'); return res.json(); })
            .then((data: Profesor[]) => { setProfesores(data); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    };

    useEffect(() => {
        fetchProfesores();
        fetch(`${API_URL}/turnero/sedes`)
            .then((res) => res.ok ? res.json() : [])
            .then((data: Sede[]) => setSedes(data))
            .catch(() => {});
    }, []);

    const sedeNombre = (idSede: string | null) => {
        if (!idSede) return '-';
        const sede = sedes.find(s => String(s.idSede) === String(idSede));
        return sede ? sede.nombreSede : idSede;
    };

    const filtered = profesores.filter(p => {
        const q = search.toLowerCase();
        return (
            p.dni.toLowerCase().includes(q) ||
            (p.nombre ?? '').toLowerCase().includes(q) ||
            (p.apellido ?? '').toLowerCase().includes(q)
        );
    });

    const selectProfesor = (p: Profesor) => {
        setSelected(p);
        setEditing(false);
        setEditStatus(null);
        setDeleteConfirm(false);
        setEditForm({ nombre: p.nombre, apellido: p.apellido, telefono: p.telefono, mail: p.mail, idSede: p.idSede });
    };

    const handleEdit = async () => {
        if (!selected) return;
        setEditLoading(true);
        setEditStatus(null);
        try {
            const body: Record<string, string> = {};
            if (editForm.nombre) body.nombre = editForm.nombre;
            if (editForm.apellido) body.apellido = editForm.apellido;
            if (editForm.telefono) body.telefono = editForm.telefono;
            if (editForm.mail) body.mail = editForm.mail;
            if (editForm.idSede) body.idSede = editForm.idSede;

            const res = await fetch(`${API_URL}/turnero/profesores/${selected.dni}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const updated: Profesor = await res.json();
            setSelected(updated);
            setEditing(false);
            setEditStatus({ msg: 'Cambios guardados.', ok: true });
            fetchProfesores();
        } catch (err: unknown) {
            setEditStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setDeleteLoading(true);
        try {
            await fetch(`${API_URL}/turnero/profesores/${selected.dni}`, { method: 'DELETE' });
            setSelected(null);
            setDeleteConfirm(false);
            fetchProfesores();
        } catch {
            // silencioso
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormStatus(null);
        try {
            const body: Record<string, string> = { dni: form.dni, nombre: form.nombre, apellido: form.apellido };
            if (form.telefono) body.telefono = form.telefono;
            if (form.mail) body.mail = form.mail;
            if (form.idSede) body.idSede = form.idSede;
            const res = await fetch(`${API_URL}/turnero/profesores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error al guardar'); }
            setFormStatus({ msg: `Profesor "${form.nombre} ${form.apellido}" creado correctamente.`, ok: true });
            setForm(emptyForm);
            fetchProfesores();
        } catch (err: unknown) {
            setFormStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false });
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ backgroundColor: '#1976D2', height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>GOOD LIFE CENTER</h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <aside style={{ width: '220px', minWidth: '220px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #D1D5DB' }}>
                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map((item) => (
                            <button key={item.path} onClick={() => onNavigate(item.path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', color: item.path === '/profesores' ? '#1976D2' : '#374151', backgroundColor: item.path === '/profesores' ? '#EFF6FF' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', textAlign: 'left', fontWeight: item.path === '/profesores' ? '600' : '400' }}
                                onMouseEnter={(e) => { if (item.path !== '/profesores') e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                onMouseLeave={(e) => { if (item.path !== '/profesores') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <item.icon size={18} /><span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <LogOut size={18} /><span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Main */}
                <main style={{ flex: 1, backgroundColor: '#CCCCCC', padding: '24px', overflowY: 'auto', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                    {/* Panel izquierdo: lista/grilla */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Toolbar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0, flex: 1 }}>Profesores</h2>

                            {/* Búsqueda */}
                            <div style={{ position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                <input
                                    placeholder="Buscar nombre o DNI..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', width: '200px' }}
                                />
                            </div>

                            {/* Cambio de vista */}
                            <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: '6px', overflow: 'hidden' }}>
                                <button onClick={() => setViewMode('list')} title="Vista lista"
                                    style={{ padding: '7px 10px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'list' ? '#1976D2' : 'white', color: viewMode === 'list' ? 'white' : '#6B7280' }}>
                                    <List size={16} />
                                </button>
                                <button onClick={() => setViewMode('grid')} title="Vista grilla"
                                    style={{ padding: '7px 10px', border: 'none', borderLeft: '1px solid #D1D5DB', cursor: 'pointer', backgroundColor: viewMode === 'grid' ? '#1976D2' : 'white', color: viewMode === 'grid' ? 'white' : '#6B7280' }}>
                                    <LayoutGrid size={16} />
                                </button>
                            </div>

                            <button onClick={() => { setShowModal(true); setFormStatus(null); setForm(emptyForm); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#424242', color: 'white', padding: '8px 14px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                                <Plus size={15} /> Nuevo
                            </button>
                        </div>

                        {loading && <p style={{ color: '#6B7280' }}>Cargando profesores...</p>}
                        {error && <p style={{ color: '#EF4444' }}>{error}</p>}
                        {!loading && !error && filtered.length === 0 && (
                            <p style={{ color: '#6B7280' }}>{search ? 'Sin resultados.' : 'No hay profesores registrados.'}</p>
                        )}

                        {/* Vista Lista */}
                        {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
                            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                            {['DNI', 'Nombre', 'Apellido', 'Teléfono', 'Mail', 'Sede'].map(col => (
                                                <th key={col} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((prof, i) => (
                                            <tr key={prof.dni}
                                                onClick={() => selectProfesor(prof)}
                                                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #E5E7EB' : 'none', backgroundColor: selected?.dni === prof.dni ? '#EFF6FF' : 'white', cursor: 'pointer' }}
                                                onMouseEnter={(e) => { if (selected?.dni !== prof.dni) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected?.dni === prof.dni ? '#EFF6FF' : 'white'; }}>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{prof.dni}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', color: '#111827' }}>{prof.nombre ?? '-'}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', color: '#111827' }}>{prof.apellido ?? '-'}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', color: '#6B7280' }}>{prof.telefono ?? '-'}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', color: '#6B7280' }}>{prof.mail ?? '-'}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', color: '#6B7280' }}>{sedeNombre(prof.idSede)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Vista Grilla */}
                        {!loading && !error && filtered.length > 0 && viewMode === 'grid' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                                {filtered.map(prof => (
                                    <div key={prof.dni}
                                        onClick={() => selectProfesor(prof)}
                                        style={{ backgroundColor: selected?.dni === prof.dni ? '#EFF6FF' : 'white', border: selected?.dni === prof.dni ? '2px solid #1976D2' : '2px solid transparent', borderRadius: '10px', padding: '18px 14px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', transition: 'border-color 0.15s' }}
                                        onMouseEnter={(e) => { if (selected?.dni !== prof.dni) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected?.dni === prof.dni ? '#EFF6FF' : 'white'; }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#1976D2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: 'white', fontSize: '20px', fontWeight: '700' }}>
                                            {(prof.nombre?.[0] ?? '?').toUpperCase()}
                                        </div>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{prof.nombre} {prof.apellido}</div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>DNI: {prof.dni}</div>
                                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{sedeNombre(prof.idSede)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Panel derecho: detalle */}
                    {selected && (
                        <div style={{ width: '300px', minWidth: '300px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', padding: '24px', position: 'sticky', top: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Detalle</h3>
                                <button onClick={() => { setSelected(null); setEditing(false); setDeleteConfirm(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
                            </div>

                            {/* Avatar */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1976D2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>
                                    {(selected.nombre?.[0] ?? '?').toUpperCase()}
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>{selected.nombre} {selected.apellido}</div>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>DNI: {selected.dni}</div>
                            </div>

                            {/* Campos */}
                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { label: 'Nombre', key: 'nombre' as const },
                                        { label: 'Apellido', key: 'apellido' as const },
                                        { label: 'Teléfono', key: 'telefono' as const },
                                        { label: 'Mail', key: 'mail' as const },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280', display: 'block', marginBottom: '3px' }}>{label}</label>
                                            <input value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                style={{ ...inputStyle, fontSize: '13px', padding: '7px 10px' }} />
                                        </div>
                                    ))}
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280', display: 'block', marginBottom: '3px' }}>Sede</label>
                                        <select value={editForm.idSede ?? ''} onChange={e => setEditForm(f => ({ ...f, idSede: e.target.value || null }))}
                                            style={{ ...inputStyle, fontSize: '13px', padding: '7px 10px', backgroundColor: 'white' }}>
                                            <option value="">Sin sede</option>
                                            {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                                        </select>
                                    </div>

                                    {editStatus && (
                                        <p style={{ margin: 0, fontSize: '13px', color: editStatus.ok ? '#16A34A' : '#DC2626', padding: '8px', background: editStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>
                                            {editStatus.msg}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={handleEdit} disabled={editLoading}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', backgroundColor: editLoading ? '#9CA3AF' : '#1976D2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: editLoading ? 'not-allowed' : 'pointer' }}>
                                            <Check size={15} /> {editLoading ? 'Guardando...' : 'Confirmar'}
                                        </button>
                                        <button onClick={() => { setEditing(false); setEditStatus(null); }}
                                            style={{ padding: '9px 14px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                        {[
                                            { label: 'Teléfono', value: selected.telefono },
                                            { label: 'Mail', value: selected.mail },
                                            { label: 'Sede', value: sedeNombre(selected.idSede) },
                                        ].map(({ label, value }) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#6B7280', fontWeight: '500' }}>{label}</span>
                                                <span style={{ color: '#111827', textAlign: 'right', maxWidth: '160px', wordBreak: 'break-word' }}>{value ?? '-'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {editStatus && !editing && (
                                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: editStatus.ok ? '#16A34A' : '#DC2626', padding: '8px', background: editStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>
                                            {editStatus.msg}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => { setEditing(true); setEditStatus(null); setDeleteConfirm(false); }}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', backgroundColor: '#1976D2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                            <Pencil size={14} /> Editar
                                        </button>
                                        <button onClick={() => setDeleteConfirm(true)}
                                            style={{ padding: '9px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    {deleteConfirm && (
                                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                                            <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#DC2626', fontWeight: '500' }}>
                                                ¿Eliminar a {selected.nombre} {selected.apellido}?
                                            </p>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={handleDelete} disabled={deleteLoading}
                                                    style={{ flex: 1, padding: '8px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: deleteLoading ? 'not-allowed' : 'pointer' }}>
                                                    {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
                                                </button>
                                                <button onClick={() => setDeleteConfirm(false)}
                                                    style={{ flex: 1, padding: '8px', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Modal nuevo profesor */}
            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                            <X size={22} />
                        </button>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>Nuevo Profesor</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>DNI *</label>
                                    <input required value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Teléfono</label>
                                    <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                                    <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Apellido *</label>
                                    <input required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label>
                                <input type="email" value={form.mail} onChange={e => setForm(f => ({ ...f, mail: e.target.value }))} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Sede</label>
                                <select value={form.idSede} onChange={e => setForm(f => ({ ...f, idSede: e.target.value }))} style={{ ...inputStyle, backgroundColor: 'white' }}>
                                    <option value="">Sin sede</option>
                                    {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                                </select>
                            </div>
                            {formStatus && (
                                <p style={{ margin: 0, fontSize: '13px', color: formStatus.ok ? '#16A34A' : '#DC2626', padding: '10px', background: formStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>
                                    {formStatus.msg}
                                </p>
                            )}
                            <button type="submit" disabled={formLoading}
                                style={{ padding: '11px', backgroundColor: formLoading ? '#9CA3AF' : '#7C3AED', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: formLoading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
                                {formLoading ? 'Guardando...' : 'Guardar Profesor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profesores;
