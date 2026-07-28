import React, { useEffect, useState } from 'react';
import { X, Plus, Search, LayoutGrid, List, Trash2, Pencil, Check } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ProfesoresProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
    role?: 'admin' | 'profesor';
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

const emptyForm = { dni: '', nombre: '', apellido: '', telefono: '', mail: '', idSede: '', rol: 'profesor' };

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
const labelClass = 'text-xs font-medium text-gray-600 block mb-1';

const Profesores: React.FC<ProfesoresProps> = ({ onLogout, onNavigate, role = 'profesor' }) => {
    const isAdmin = role === 'admin';
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
            const body: Record<string, string> = { dni: form.dni, nombre: form.nombre, apellido: form.apellido, rol: form.rol };
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
        <>
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/profesores">
                <div className="w-full max-w-5xl flex gap-5 items-start">
                    {/* Panel izquierdo: lista/grilla */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2.5 mb-4 flex-wrap animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-900 flex-1">Profesores</h2>

                            <div className="relative">
                                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    placeholder="Buscar nombre o DNI..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-8 pr-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none w-[200px] focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150"
                                />
                            </div>

                            <div className="flex bg-white rounded-lg p-1 shadow-card gap-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    title="Vista lista"
                                    className={`px-2.5 py-1.5 rounded-md transition-all duration-150 flex items-center ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    <List size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    title="Vista grilla"
                                    className={`px-2.5 py-1.5 rounded-md transition-all duration-150 flex items-center ${viewMode === 'grid' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </div>

                            {isAdmin && (
                                <button
                                    onClick={() => { setShowModal(true); setFormStatus(null); setForm(emptyForm); }}
                                    className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 shadow"
                                >
                                    <Plus size={15} /> Nuevo
                                </button>
                            )}
                        </div>

                        {loading && <p className="text-gray-500">Cargando profesores...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!loading && !error && filtered.length === 0 && (
                            <p className="text-gray-500">{search ? 'Sin resultados.' : 'No hay profesores registrados.'}</p>
                        )}

                        {/* Vista Lista */}
                        {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
                            <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-fadeIn">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            {['DNI', 'Nombre', 'Apellido', 'Teléfono', 'Mail', 'Sede'].map(col => (
                                                <th key={col} className="px-4 py-2.5 text-left text-[13px] font-semibold text-gray-700">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((prof, i) => (
                                            <tr
                                                key={prof.dni}
                                                onClick={() => selectProfesor(prof)}
                                                className={`cursor-pointer transition-colors duration-150 ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''} ${selected?.dni === prof.dni ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <td className="px-4 py-2.5 text-sm text-gray-900 font-medium">{prof.dni}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-900">{prof.nombre ?? '-'}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-900">{prof.apellido ?? '-'}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-500">{prof.telefono ?? '-'}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-500">{prof.mail ?? '-'}</td>
                                                <td className="px-4 py-2.5 text-sm text-gray-500">{sedeNombre(prof.idSede)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Vista Grilla */}
                        {!loading && !error && filtered.length > 0 && viewMode === 'grid' && (
                            <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                                {filtered.map((prof, index) => (
                                    <div
                                        key={prof.dni}
                                        onClick={() => selectProfesor(prof)}
                                        className={`rounded-xl px-3.5 py-4 cursor-pointer shadow-card hover:shadow-card-hover text-center transition-all duration-200 hover:-translate-y-0.5 animate-fadeIn border-2 ${selected?.dni === prof.dni ? 'bg-primary-50 border-primary-400' : 'bg-white border-transparent'}`}
                                        style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                                    >
                                        <div className="h-[52px] w-[52px] rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center mx-auto mb-2.5 text-white text-xl font-bold shadow-sm">
                                            {(prof.nombre?.[0] ?? '?').toUpperCase()}
                                        </div>
                                        <div className="font-semibold text-sm text-gray-900">{prof.nombre} {prof.apellido}</div>
                                        <div className="text-xs text-gray-500 mt-1">DNI: {prof.dni}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{sedeNombre(prof.idSede)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Panel derecho: detalle */}
                    {selected && (
                        <div className="w-72 shrink-0 bg-white rounded-2xl shadow-card p-6 sticky top-24 animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-gray-900">Detalle</h3>
                                <button onClick={() => { setSelected(null); setEditing(false); setDeleteConfirm(false); }} className="text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-5">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-sm">
                                    {(selected.nombre?.[0] ?? '?').toUpperCase()}
                                </div>
                                <div className="font-bold text-base text-gray-900">{selected.nombre} {selected.apellido}</div>
                                <div className="text-[13px] text-gray-500">DNI: {selected.dni}</div>
                            </div>

                            {editing ? (
                                <div className="flex flex-col gap-3">
                                    {[
                                        { label: 'Nombre', key: 'nombre' as const },
                                        { label: 'Apellido', key: 'apellido' as const },
                                        { label: 'Teléfono', key: 'telefono' as const },
                                        { label: 'Mail', key: 'mail' as const },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <label className={labelClass}>{label}</label>
                                            <input value={editForm[key] ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} className={inputClass} />
                                        </div>
                                    ))}
                                    <div>
                                        <label className={labelClass}>Sede</label>
                                        <select value={editForm.idSede ?? ''} onChange={e => setEditForm(f => ({ ...f, idSede: e.target.value || null }))} className={inputClass}>
                                            <option value="">Sin sede</option>
                                            {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                                        </select>
                                    </div>

                                    {editStatus && (
                                        <p className={`text-[13px] px-3 py-2 rounded-lg ${editStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                            {editStatus.msg}
                                        </p>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEdit}
                                            disabled={editLoading}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors duration-150 ${editLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'}`}
                                        >
                                            <Check size={15} /> {editLoading ? 'Guardando...' : 'Confirmar'}
                                        </button>
                                        <button onClick={() => { setEditing(false); setEditStatus(null); }} className="px-3.5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm transition-colors duration-150">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2.5 mb-5">
                                        {[
                                            { label: 'Teléfono', value: selected.telefono },
                                            { label: 'Mail', value: selected.mail },
                                            { label: 'Sede', value: sedeNombre(selected.idSede) },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between text-[13px]">
                                                <span className="text-gray-500 font-medium">{label}</span>
                                                <span className="text-gray-900 text-right max-w-[160px] break-words">{value ?? '-'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {editStatus && !editing && (
                                        <p className={`text-[13px] px-3 py-2 rounded-lg mb-3 ${editStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                            {editStatus.msg}
                                        </p>
                                    )}

                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setEditing(true); setEditStatus(null); setDeleteConfirm(false); }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors duration-150"
                                            >
                                                <Pencil size={14} /> Editar
                                            </button>
                                            <button onClick={() => setDeleteConfirm(true)} className="px-3 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg transition-colors duration-150">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}

                                    {deleteConfirm && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 animate-fadeIn">
                                            <p className="text-[13px] text-red-600 font-medium mb-2.5">
                                                ¿Eliminar a {selected.nombre} {selected.apellido}?
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={deleteLoading}
                                                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors duration-150 ${deleteLoading ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                                                >
                                                    {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
                                                </button>
                                                <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-[13px] transition-colors duration-150">
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </AppShell>

            {/* Modal nuevo profesor */}
            {showModal && isAdmin && (
                <div
                    onClick={() => setShowModal(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-popIn">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200">
                            <X size={22} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 mb-5">Nuevo Profesor</h3>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>DNI *</label>
                                    <input required value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Teléfono</label>
                                    <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Nombre *</label>
                                    <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Apellido *</label>
                                    <input required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" value={form.mail} onChange={e => setForm(f => ({ ...f, mail: e.target.value }))} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Sede</label>
                                <select value={form.idSede} onChange={e => setForm(f => ({ ...f, idSede: e.target.value }))} className={inputClass}>
                                    <option value="">Sin sede</option>
                                    {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Rol *</label>
                                <select required value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))} className={inputClass}>
                                    <option value="profesor">Profesor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            {formStatus && (
                                <p className={`text-[13px] px-3 py-2.5 rounded-lg ${formStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                    {formStatus.msg}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={formLoading}
                                className={`py-2.5 rounded-lg text-white text-[15px] font-semibold mt-1 transition-all duration-150 active:scale-[0.98] ${formLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 shadow-sm'}`}
                            >
                                {formLoading ? 'Guardando...' : 'Guardar Profesor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Profesores;
