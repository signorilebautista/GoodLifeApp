import React, { useEffect, useState } from 'react';
import { X, Search, LayoutGrid, List, Check, DollarSign } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SociosProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Member {
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
    idProfesor: string | null;
}

interface Membresia {
    idMembresia: number;
    nombreMembresia: string;
    cantidadClases: number | null;
    precio: number | null;
}

interface Profesor {
    dni: string;
    nombre: string;
    apellido: string;
}

type NewMemberForm = {
    dni: string;
    nombre: string;
    apellido: string;
    direccion: string;
    mail: string;
    telefono: string;
    idMembresia: string;
    clasesRestantes: string;
    deuda: string;
    idProfesor: string;
};

const emptyForm: NewMemberForm = {
    dni: '',
    nombre: '',
    apellido: '',
    direccion: '',
    mail: '',
    telefono: '',
    idMembresia: '',
    clasesRestantes: '',
    deuda: '',
    idProfesor: '',
};

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
const labelClass = 'text-xs font-medium text-gray-600 block mb-1';

const Socios: React.FC<SociosProps> = ({ onLogout, onNavigate }) => {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [membresias, setMembresias] = useState<Membresia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState<NewMemberForm>(emptyForm);

    const [profesores, setProfesores] = useState<Profesor[]>([]);

    // Action sub-modals
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [planStatus, setPlanStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [planLoading, setPlanLoading] = useState(false);

    const [showProfesorModal, setShowProfesorModal] = useState(false);
    const [selectedProfesorDni, setSelectedProfesorDni] = useState('');
    const [profesorStatus, setProfesorStatus] = useState<{ msg: string; ok: boolean } | null>(null);
    const [profesorLoading, setProfesorLoading] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmPlan, setConfirmPlan] = useState(false);
    const [confirmProfesor, setConfirmProfesor] = useState(false);

    // Panel de pago del socio
    const [showPagoPanel, setShowPagoPanel] = useState(false);
    const [modoPago, setModoPago] = useState<'deuda' | 'membresia'>('membresia');
    const [montoPago, setMontoPago] = useState('');
    const [diasPago, setDiasPago] = useState('30');
    const [pagando, setPagando] = useState(false);
    const [resultadoPago, setResultadoPago] = useState<{ ok: boolean; nuevaDeuda: number; mensaje: string } | null>(null);

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/socios`);
            if (!res.ok) throw new Error('No se pudo cargar la lista de socios');
            const data = await res.json();
            setMembers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const fetchMembresias = async () => {
        try {
            const res = await fetch(`${API_URL}/socios/membresias`);
            if (!res.ok) return;
            setMembresias(await res.json());
        } catch {
            // si falla, el selector de plan queda vacío
        }
    };

    const fetchProfesores = async () => {
        try {
            const res = await fetch(`${API_URL}/turnero/profesores`);
            if (res.ok) setProfesores(await res.json());
        } catch { }
    };

    useEffect(() => {
        fetchMembers();
        fetchMembresias();
        fetchProfesores();
    }, []);

    const handleAddMember = async () => {
        try {
            const res = await fetch(`${API_URL}/socios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dni: newMember.dni,
                    nombre: newMember.nombre,
                    apellido: newMember.apellido,
                    direccion: newMember.direccion || undefined,
                    mail: newMember.mail || undefined,
                    telefono: newMember.telefono || undefined,
                    idMembresia: newMember.idMembresia ? Number(newMember.idMembresia) : undefined,
                    clasesRestantes: newMember.clasesRestantes || undefined,
                    deuda: newMember.deuda || undefined,
                    idProfesor: newMember.idProfesor || undefined,
                }),
            });
            if (!res.ok) throw new Error('No se pudo crear el socio');
            setShowAddModal(false);
            setNewMember(emptyForm);
            fetchMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    };

    const handleDeleteMember = async (dni: string) => {
        try {
            const res = await fetch(`${API_URL}/socios/${dni}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('No se pudo eliminar el socio');
            setSelectedMember(null);
            fetchMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        }
    };

    const openPagoPanel = () => {
        setShowPagoPanel(true);
        setShowPlanModal(false);
        setShowProfesorModal(false);
        setConfirmDelete(false);
        setModoPago('membresia');
        setMontoPago('');
        setDiasPago('30');
        setResultadoPago(null);
    };

    const handlePago = async () => {
        if (!selectedMember) return;
        setPagando(true);
        try {
            const res = await fetch(`${API_URL}/socios/${selectedMember.dni}/pago`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monto: Number(montoPago) || 0,
                    diasVigencia: Number(diasPago) || 30,
                    soloDeuda: modoPago === 'deuda',
                }),
            });
            const data = await res.json();
            setResultadoPago(data);
            if (data.ok) {
                setSelectedMember(m => m ? {
                    ...m,
                    deuda: String(data.nuevaDeuda),
                    ...(data.clasesRestantes !== undefined && { clasesRestantes: data.clasesRestantes }),
                } : m);
                setMembers(prev => prev.map(m => m.dni === selectedMember.dni ? {
                    ...m,
                    deuda: String(data.nuevaDeuda),
                    ...(data.clasesRestantes !== undefined && { clasesRestantes: data.clasesRestantes }),
                } : m));
            }
        } catch {
            setResultadoPago({ ok: false, nuevaDeuda: 0, mensaje: 'Error al registrar el pago.' });
        } finally {
            setPagando(false);
        }
    };

    const openPlanModal = () => {
        setSelectedPlanId(selectedMember?.idMembresia != null ? String(selectedMember.idMembresia) : '');
        setPlanStatus(null);
        setConfirmPlan(false);
        setShowPlanModal(true);
        setShowProfesorModal(false);
        setConfirmDelete(false);
        setShowPagoPanel(false);
        setResultadoPago(null);
    };

    const handleCambioPlan = async () => {
        if (!selectedMember) return;
        setPlanLoading(true); setPlanStatus(null);
        try {
            const res = await fetch(`${API_URL}/socios/${selectedMember.dni}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idMembresia: selectedPlanId ? Number(selectedPlanId) : null }),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const updated = await res.json();
            const planNombre = membresias.find(m => m.idMembresia === Number(selectedPlanId))?.nombreMembresia ?? 'Sin membresía';
            setPlanStatus({ msg: `Plan actualizado a "${planNombre}".`, ok: true });
            setSelectedMember(m => m ? { ...m, idMembresia: Number(selectedPlanId) || null, plan: planNombre, clasesRestantes: updated.clasesRestantes ?? m.clasesRestantes } : m);
            setMembers(prev => prev.map(m => m.dni === selectedMember.dni ? { ...m, idMembresia: updated.idMembresia, plan: planNombre, clasesRestantes: updated.clasesRestantes ?? m.clasesRestantes } : m));
        } catch (err) {
            setPlanStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false });
        } finally { setPlanLoading(false); }
    };

    const openProfesorModal = () => {
        setSelectedProfesorDni('');
        setProfesorStatus(null);
        setConfirmProfesor(false);
        setShowProfesorModal(true);
        setShowPlanModal(false);
        setConfirmDelete(false);
        setShowPagoPanel(false);
        setResultadoPago(null);
    };

    const handleCambioProfesor = async () => {
        if (!selectedMember || !selectedProfesorDni) return;
        setProfesorLoading(true); setProfesorStatus(null);
        try {
            const res = await fetch(`${API_URL}/socios/${selectedMember.dni}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idProfesor: selectedProfesorDni }),
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Error'); }
            const prof = profesores.find(p => p.dni === selectedProfesorDni);
            const nombre = prof ? `${prof.nombre} ${prof.apellido}` : selectedProfesorDni;
            setProfesorStatus({ msg: `Profesor asignado: ${nombre}.`, ok: true });
            setSelectedMember(m => m ? { ...m, idProfesor: selectedProfesorDni } : m);
            setMembers(prev => prev.map(m => m.dni === selectedMember.dni ? { ...m, idProfesor: selectedProfesorDni } : m));
        } catch (err) {
            setProfesorStatus({ msg: err instanceof Error ? err.message : 'Error', ok: false });
        } finally { setProfesorLoading(false); }
    };

    const filteredMembers = members.filter((member) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        const fullName = `${member.nombre} ${member.apellido}`.toLowerCase();
        return fullName.includes(term) || member.dni.toLowerCase().includes(term);
    });

    const formatDeuda = (deuda: string | null) => {
        const value = Number(deuda ?? 0);
        if (value < 0) return `-$${Math.abs(value).toLocaleString()}`;
        return `$${value.toLocaleString()}`;
    };

    const avatarInitials = (nombre: string, apellido: string) =>
        `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();

    return (
        <>
            <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/socios">
                {/* Toolbar */}
                <div className="mb-5 w-full max-w-6xl flex items-center gap-3 flex-wrap animate-fadeIn">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition-all duration-150"
                    >
                        + Nuevo Socio
                    </button>

                    <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 flex-1 min-w-[220px] shadow-card focus-within:ring-2 focus-within:ring-primary transition-all duration-150">
                        <Search size={18} className="text-gray-400 shrink-0" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre o DNI..."
                            className="outline-none text-sm flex-1 bg-transparent"
                        />
                    </div>

                    <div className="flex gap-1 bg-white rounded-lg p-1 shadow-card">
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Vista grilla"
                            className={`px-2.5 py-1.5 rounded-md transition-all duration-150 flex items-center ${viewMode === 'grid' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            title="Vista lista"
                            className={`px-2.5 py-1.5 rounded-md transition-all duration-150 flex items-center ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="w-full max-w-6xl mb-4 text-red-700 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg text-sm animate-shake">
                        {error}
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-600">Cargando socios...</p>
                ) : filteredMembers.length === 0 ? (
                    <p className="text-gray-600">No se encontraron socios.</p>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl w-full">
                        {filteredMembers.map((member, index) => (
                            <div
                                key={member.dni}
                                onClick={() => setSelectedMember(member)}
                                className="bg-white rounded-xl shadow-card hover:shadow-card-hover p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                                style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                        {avatarInitials(member.nombre, member.apellido)}
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 truncate">
                                        {member.nombre} {member.apellido}
                                    </h3>
                                </div>
                                <div className="ml-[52px] -mt-2">
                                    <p className="text-[13px] text-gray-500 mb-0.5">{member.plan ?? 'Sin plan'}</p>
                                    <p className="text-xs text-gray-400">DNI {member.dni}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 max-w-6xl w-full">
                        {filteredMembers.map((member, index) => (
                            <div
                                key={member.dni}
                                onClick={() => setSelectedMember(member)}
                                className="bg-white rounded-xl shadow-card hover:shadow-card-hover px-5 py-3.5 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 animate-fadeIn"
                                style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                            >
                                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                    {avatarInitials(member.nombre, member.apellido)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-semibold text-gray-900 truncate">{member.nombre} {member.apellido}</p>
                                    <p className="text-xs text-gray-500 truncate">{member.plan ?? 'Sin plan'}</p>
                                </div>
                                <span className="text-[13px] text-gray-600 shrink-0">DNI {member.dni}</span>
                                <span className="text-[13px] text-gray-600 shrink-0 hidden sm:inline">{member.mail ?? '-'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </AppShell>

            {/* Add Member Modal */}
            {showAddModal && (
                <div
                    onClick={() => setShowAddModal(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-popIn"
                    >
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200"
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-5">Nuevo Socio</h2>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }} className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                {([['dni', 'DNI *', true], ['telefono', 'Teléfono', false], ['nombre', 'Nombre *', true], ['apellido', 'Apellido *', true]] as [keyof NewMemberForm, string, boolean][]).map(([field, label, req]) => (
                                    <div key={field}>
                                        <label className={labelClass}>{label}</label>
                                        <input required={req} value={newMember[field]} onChange={(e) => setNewMember({ ...newMember, [field]: e.target.value })} className={inputClass} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" value={newMember.mail} onChange={(e) => setNewMember({ ...newMember, mail: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Dirección</label>
                                <input value={newMember.direccion} onChange={(e) => setNewMember({ ...newMember, direccion: e.target.value })} className={inputClass} />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>Membresía</label>
                                    <select value={newMember.idMembresia} onChange={(e) => { const m = membresias.find(m => String(m.idMembresia) === e.target.value); setNewMember(prev => ({ ...prev, idMembresia: e.target.value, clasesRestantes: m?.cantidadClases != null ? String(m.cantidadClases) : prev.clasesRestantes, deuda: m?.precio != null ? String(-m.precio) : prev.deuda })); }} className={inputClass}>
                                        <option value="">Sin membresía</option>
                                        {membresias.map((m) => <option key={m.idMembresia} value={m.idMembresia}>{m.nombreMembresia}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Clases</label>
                                    <input value={newMember.clasesRestantes} onChange={(e) => setNewMember({ ...newMember, clasesRestantes: e.target.value })} placeholder="0" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Deuda</label>
                                    <input value={newMember.deuda} onChange={(e) => setNewMember({ ...newMember, deuda: e.target.value })} placeholder="0" className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Profesor</label>
                                <select value={newMember.idProfesor} onChange={(e) => setNewMember({ ...newMember, idProfesor: e.target.value })} className={inputClass}>
                                    <option value="">Sin profesor</option>
                                    {profesores.map((p) => <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-2.5 rounded-lg text-sm font-semibold shadow transition-all duration-150"
                            >
                                Guardar Socio
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedMember && (
                <div
                    onClick={() => { setSelectedMember(null); setShowPlanModal(false); setShowProfesorModal(false); setConfirmDelete(false); setShowPagoPanel(false); setResultadoPago(null); }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-popIn"
                    >
                        <button
                            onClick={() => { setSelectedMember(null); setShowPlanModal(false); setShowProfesorModal(false); setConfirmDelete(false); setShowPagoPanel(false); setResultadoPago(null); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:rotate-90 transition-all duration-200 p-1"
                        >
                            <X size={22} />
                        </button>

                        <div className="flex justify-between items-start mb-6 pr-8">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedMember.nombre} {selectedMember.apellido}
                            </h2>
                            <p className="text-sm text-gray-500 shrink-0">DNI: <strong className="text-gray-700">{selectedMember.dni}</strong></p>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-lg font-semibold shadow-sm">
                                {avatarInitials(selectedMember.nombre, selectedMember.apellido)}
                            </div>
                            <div>
                                <p className="text-[15px] font-semibold text-gray-900">
                                    {selectedMember.plan ?? 'Sin plan'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {selectedMember.direccion ?? 'Sin dirección registrada'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-6 flex-wrap">
                            <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-800">
                                <strong>Mail:</strong> {selectedMember.mail ?? '-'}
                            </div>
                            <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-800">
                                <strong>Teléfono:</strong> {selectedMember.telefono ?? '-'}
                            </div>
                            <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-800">
                                <strong>Profesor:</strong>{' '}
                                {(() => {
                                    const p = profesores.find(p => p.dni === selectedMember.idProfesor);
                                    return p ? `${p.nombre} ${p.apellido}` : '-';
                                })()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-100 rounded-xl p-5">
                                <p className="text-base font-semibold text-gray-900 mb-1.5">Deuda</p>
                                <p className={`text-4xl font-bold ${Number(selectedMember.deuda ?? 0) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {formatDeuda(selectedMember.deuda)}
                                </p>
                            </div>

                            <div className="bg-gray-100 rounded-xl p-5">
                                <p className="text-base font-semibold text-gray-900 mb-1.5">Membresía</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    {selectedMember.plan ?? 'Sin plan'}
                                </p>
                            </div>

                            <div className="bg-gray-100 rounded-xl p-5 col-span-2">
                                <p className="text-base font-semibold text-gray-900 mb-1.5">Clases Restantes</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    {selectedMember.clasesRestantes ?? '0'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <button onClick={openPagoPanel} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150">
                                <DollarSign size={15} /> Pago
                            </button>
                            <button onClick={openPlanModal} className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150">
                                Cambio de membresía
                            </button>
                            <button onClick={openProfesorModal} className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150">
                                Cambio de profesor
                            </button>
                            <button onClick={() => { setConfirmDelete(true); setShowPlanModal(false); setShowProfesorModal(false); setShowPagoPanel(false); }} className="bg-red-500 hover:bg-red-600 active:scale-95 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ml-auto">
                                Eliminar
                            </button>
                        </div>

                        {showPagoPanel && (() => {
                            const deudaActual = Number(selectedMember.deuda ?? 0);
                            const precioMem = membresias.find(m => m.idMembresia === selectedMember.idMembresia)?.precio ?? 0;
                            const montoNum = Number(montoPago) || 0;
                            const previewDeuda = modoPago === 'deuda'
                                ? deudaActual + montoNum
                                : deudaActual + montoNum - precioMem;
                            const fmt = (n: number) => `$${Math.abs(n).toLocaleString('es-AR')}`;
                            const msgDeuda = (d: number) =>
                                d < 0 ? { texto: `Falta pagar ${fmt(d)}`, color: 'bg-red-50 text-red-700' }
                                : d === 0 ? { texto: 'Deuda pagada', color: 'bg-emerald-50 text-emerald-700' }
                                : { texto: `Deuda pagada y tiene a favor ${fmt(d)}`, color: 'bg-emerald-50 text-emerald-700' };
                            return (
                                <div className="mt-5 bg-gray-100 rounded-xl p-5 flex flex-col gap-3 animate-fadeIn">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[15px] font-semibold text-gray-900">Registrar pago</p>
                                        <button onClick={() => { setShowPagoPanel(false); setResultadoPago(null); }} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                                    </div>

                                    {/* Deuda actual */}
                                    <div className="flex justify-between text-sm bg-white rounded-lg px-3 py-2">
                                        <span className="text-gray-500">Deuda actual</span>
                                        <span className={`font-semibold ${deudaActual < 0 ? 'text-red-600' : deudaActual > 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                                            {deudaActual < 0 ? `−${fmt(deudaActual)}` : deudaActual > 0 ? `+${fmt(deudaActual)}` : '$0'}
                                        </span>
                                    </div>

                                    {/* Selector de modo */}
                                    {!resultadoPago && (
                                        <>
                                            <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                                <button
                                                    onClick={() => { setModoPago('deuda'); setMontoPago(deudaActual < 0 ? String(Math.abs(deudaActual)) : ''); }}
                                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${modoPago === 'deuda' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Solo deuda
                                                </button>
                                                <button
                                                    onClick={() => { setModoPago('membresia'); setMontoPago(''); }}
                                                    className={`flex-1 py-2 text-sm font-medium border-l border-gray-200 transition-colors ${modoPago === 'membresia' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                                >
                                                    Deuda + membresía
                                                </button>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className={modoPago === 'deuda' ? 'w-full' : 'flex-1'}>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Monto recibido ($)</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={montoPago}
                                                        onChange={e => setMontoPago(e.target.value)}
                                                        placeholder="0"
                                                        className={inputClass}
                                                    />
                                                </div>
                                                {modoPago === 'membresia' && (
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Días de vigencia</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={diasPago}
                                                            onChange={e => setDiasPago(e.target.value)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {montoNum > 0 && (
                                                <div className={`rounded-lg px-3 py-2 text-sm font-medium ${msgDeuda(previewDeuda).color}`}>
                                                    {msgDeuda(previewDeuda).texto}
                                                </div>
                                            )}

                                            <button
                                                onClick={handlePago}
                                                disabled={pagando || montoNum <= 0}
                                                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                            >
                                                {pagando ? 'Registrando...' : 'Confirmar pago'}
                                            </button>
                                        </>
                                    )}

                                    {resultadoPago && (
                                        <>
                                            <div className={`rounded-lg px-3 py-3 text-sm font-medium text-center ${resultadoPago.ok ? msgDeuda(resultadoPago.nuevaDeuda).color : 'bg-red-50 text-red-700'}`}>
                                                {resultadoPago.ok ? msgDeuda(resultadoPago.nuevaDeuda).texto : resultadoPago.mensaje}
                                            </div>
                                            <button
                                                onClick={() => { setResultadoPago(null); setMontoPago(''); setDiasPago('30'); }}
                                                className="py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Nuevo pago
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {confirmDelete && (
                            <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-5 flex flex-col gap-3 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <p className="text-[15px] font-semibold text-red-900">¿Eliminar a {selectedMember.nombre} {selectedMember.apellido}?</p>
                                    <button onClick={() => setConfirmDelete(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                                </div>
                                <p className="text-[13px] text-red-700">Esta acción no se puede deshacer.</p>
                                <div className="flex gap-2.5">
                                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors duration-150">
                                        Cancelar
                                    </button>
                                    <button onClick={() => handleDeleteMember(selectedMember.dni)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150">
                                        <Check size={15} /> Sí, eliminar
                                    </button>
                                </div>
                            </div>
                        )}

                        {showPlanModal && (
                            <div className="mt-5 bg-gray-100 rounded-xl p-5 flex flex-col gap-3 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <p className="text-[15px] font-semibold text-gray-900">Cambiar membresía</p>
                                    <button onClick={() => { setShowPlanModal(false); setConfirmPlan(false); }} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                                </div>
                                <select value={selectedPlanId} onChange={e => { setSelectedPlanId(e.target.value); setConfirmPlan(false); setPlanStatus(null); }} className={inputClass}>
                                    <option value="">Sin membresía</option>
                                    {membresias.map(m => <option key={m.idMembresia} value={m.idMembresia}>{m.nombreMembresia}</option>)}
                                </select>
                                {!confirmPlan && !planStatus && (
                                    <button onClick={() => setConfirmPlan(true)} className="py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors duration-150">
                                        Cambiar membresía
                                    </button>
                                )}
                                {confirmPlan && !planStatus && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col gap-2.5 animate-fadeIn">
                                        <p className="text-[13px] font-semibold text-amber-800">
                                            ¿Confirmar cambio a "{membresias.find(m => String(m.idMembresia) === selectedPlanId)?.nombreMembresia ?? 'Sin membresía'}"?
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmPlan(false)} className="flex-1 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors duration-150">
                                                Cancelar
                                            </button>
                                            <button onClick={handleCambioPlan} disabled={planLoading} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors duration-150 ${planLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                                <Check size={14} /> {planLoading ? 'Guardando...' : 'Sí, confirmar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {planStatus && <p className={`text-[13px] px-3 py-2 rounded-lg ${planStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>{planStatus.msg}</p>}
                            </div>
                        )}

                        {showProfesorModal && (
                            <div className="mt-5 bg-gray-100 rounded-xl p-5 flex flex-col gap-3 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <p className="text-[15px] font-semibold text-gray-900">Asignar profesor</p>
                                    <button onClick={() => { setShowProfesorModal(false); setConfirmProfesor(false); }} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
                                </div>
                                <select value={selectedProfesorDni} onChange={e => { setSelectedProfesorDni(e.target.value); setConfirmProfesor(false); setProfesorStatus(null); }} className={inputClass}>
                                    <option value="">Seleccionar profesor...</option>
                                    {profesores.map(p => <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>)}
                                </select>
                                {!confirmProfesor && !profesorStatus && (
                                    <button onClick={() => setConfirmProfesor(true)} disabled={!selectedProfesorDni} className={`py-2.5 rounded-lg text-sm font-semibold text-white transition-colors duration-150 ${selectedProfesorDni ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                                        Asignar profesor
                                    </button>
                                )}
                                {confirmProfesor && !profesorStatus && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col gap-2.5 animate-fadeIn">
                                        <p className="text-[13px] font-semibold text-amber-800">
                                            ¿Confirmar asignación a "{profesores.find(p => p.dni === selectedProfesorDni)?.nombre} {profesores.find(p => p.dni === selectedProfesorDni)?.apellido}"?
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmProfesor(false)} className="flex-1 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors duration-150">
                                                Cancelar
                                            </button>
                                            <button onClick={handleCambioProfesor} disabled={profesorLoading} className={`flex-1 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors duration-150 ${profesorLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                                <Check size={14} /> {profesorLoading ? 'Guardando...' : 'Sí, confirmar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {profesorStatus && <p className={`text-[13px] px-3 py-2 rounded-lg ${profesorStatus.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>{profesorStatus.msg}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Socios;
