import React, { useEffect, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, X, Search, LayoutGrid, List, UserPlus, LogIn, Check, GraduationCap, Home } from 'lucide-react';
import logo from '../assets/logo.png';

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

    const menuItems = [
        { icon: Home, label: 'Menú', active: false },
        { icon: Users, label: 'Socios', active: true },
        { icon: Calendar, label: 'Turnero', active: false },
        { icon: LogIn, label: 'Ingreso', active: false },
        { icon: FileText, label: 'Planes', active: false },
        { icon: BarChart3, label: 'Estadísticas', active: false },
        { icon: GraduationCap, label: 'Profesores', active: false },
        { icon: UserPlus, label: 'Agregar', active: false },
        { icon: Settings, label: 'Configuraciones', active: false },
    ];

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

    const openPlanModal = () => {
        setSelectedPlanId(selectedMember?.idMembresia != null ? String(selectedMember.idMembresia) : '');
        setPlanStatus(null);
        setConfirmPlan(false);
        setShowPlanModal(true);
        setShowProfesorModal(false);
        setConfirmDelete(false);
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
            setSelectedMember(m => m ? { ...m, idMembresia: Number(selectedPlanId) || null, plan: planNombre } : m);
            setMembers(prev => prev.map(m => m.dni === selectedMember.dni ? { ...m, idMembresia: updated.idMembresia, plan: planNombre } : m));
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
        return `$${Math.abs(value).toLocaleString()}`;
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#1976D2',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        margin: 0
                    }}>
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <aside style={{
                    width: '220px',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid #D1D5DB'
                }}>
                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.label === 'Socios') return;
                                    if (item.label === 'Turnero') {
                                        onNavigate('/turnero');
                                    } else if (item.label === 'Ingreso') {
                                        onNavigate('/ingreso');
                                    } else if (item.label === 'Planes') {
                                        onNavigate('/planes');
                                    } else if (item.label === 'Estadísticas') {
                                        onNavigate('/estadisticas');
                                    } else if (item.label === 'Profesores') {
                                        onNavigate('/profesores');
                                    } else if (item.label === 'Agregar') {
                                        onNavigate('/crear-cuenta');
                                    } else if (item.label === 'Configuraciones') {
                                        onNavigate('/configuraciones');
                                    } else {
                                        onNavigate('/menu-principal');
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
                                    color: '#374151',
                                    backgroundColor: item.active ? '#F3F4F6' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => !item.active && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                                onMouseLeave={(e) => !item.active && (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Logout Button at Bottom */}
                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button
                            onClick={onLogout}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 20px',
                                color: '#374151',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{
                    flex: 1,
                    backgroundColor: '#CCCCCC',
                    padding: '24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {/* Toolbar */}
                    <div style={{
                        marginBottom: '20px',
                        width: '100%',
                        maxWidth: '1200px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{
                                backgroundColor: '#424242',
                                color: 'white',
                                padding: '6px 16px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer'
                            }}>
                            Nuevo Socio
                        </button>

                        {/* Search bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            flex: 1,
                            minWidth: '220px',
                            gap: '8px'
                        }}>
                            <Search size={18} color="#6B7280" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre o DNI..."
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '14px',
                                    flex: 1
                                }}
                            />
                        </div>

                        {/* View toggle */}
                        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'white', borderRadius: '6px', padding: '4px' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                title="Vista grilla"
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: viewMode === 'grid' ? '#424242' : 'transparent',
                                    color: viewMode === 'grid' ? 'white' : '#374151',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                title="Vista lista"
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: viewMode === 'list' ? '#424242' : 'transparent',
                                    color: viewMode === 'list' ? 'white' : '#374151',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '16px', color: '#B91C1C', backgroundColor: '#FEE2E2', padding: '10px 16px', borderRadius: '6px' }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <p style={{ color: '#374151' }}>Cargando socios...</p>
                    ) : filteredMembers.length === 0 ? (
                        <p style={{ color: '#374151' }}>No se encontraron socios.</p>
                    ) : viewMode === 'grid' ? (
                        /* Members Grid */
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            maxWidth: '1200px',
                            width: '100%'
                        }}>
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.dni}
                                    onClick={() => setSelectedMember(member)}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {/* Avatar and Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #4ADE80, #3B82F6)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '18px',
                                            flexShrink: 0
                                        }}>
                                            ðŸ‘¤
                                        </div>
                                        <h3 style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#111827',
                                            margin: 0
                                        }}>
                                            {member.nombre} {member.apellido}
                                        </h3>
                                    </div>

                                    {/* Plan Info */}
                                    <div style={{ marginLeft: '52px' }}>
                                        <p style={{
                                            fontSize: '13px',
                                            color: '#6B7280',
                                            margin: 0,
                                            marginBottom: '4px'
                                        }}>
                                            {member.plan ?? 'Sin plan'}
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#9CA3AF',
                                            margin: 0
                                        }}>
                                            DNI {member.dni}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Members List */
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            maxWidth: '1200px',
                            width: '100%'
                        }}>
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.dni}
                                    onClick={() => setSelectedMember(member)}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        padding: '14px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #4ADE80, #3B82F6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '16px',
                                        flexShrink: 0
                                    }}>
                                        ðŸ‘¤
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{member.nombre} {member.apellido}</p>
                                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{member.plan ?? 'Sin plan'}</p>
                                    </div>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>DNI {member.dni}</span>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>{member.mail ?? '-'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div
                    onClick={() => setShowAddModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative'
                        }}
                    >
                        <button
                            onClick={() => setShowAddModal(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '20px' }}>Nuevo Socio</h2>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {([['dni','DNI *',true],['telefono','Teléfono',false],['nombre','Nombre *',true],['apellido','Apellido *',true]] as [keyof NewMemberForm, string, boolean][]).map(([field, label, req]) => (
                                    <div key={field}>
                                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>{label}</label>
                                        <input required={req} value={newMember[field]} onChange={(e) => setNewMember({ ...newMember, [field]: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label>
                                <input type="email" value={newMember.mail} onChange={(e) => setNewMember({ ...newMember, mail: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Dirección</label>
                                <input value={newMember.direccion} onChange={(e) => setNewMember({ ...newMember, direccion: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Membresía</label>
                                    <select value={newMember.idMembresia} onChange={(e) => setNewMember({ ...newMember, idMembresia: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}>
                                        <option value="">Sin membresía</option>
                                        {membresias.map((m) => <option key={m.idMembresia} value={m.idMembresia}>{m.nombreMembresia}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Clases</label>
                                    <input value={newMember.clasesRestantes} onChange={(e) => setNewMember({ ...newMember, clasesRestantes: e.target.value })} placeholder="0" style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Deuda</label>
                                    <input value={newMember.deuda} onChange={(e) => setNewMember({ ...newMember, deuda: e.target.value })} placeholder="0" style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Profesor</label>
                                <select value={newMember.idProfesor} onChange={(e) => setNewMember({ ...newMember, idProfesor: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}>
                                    <option value="">Sin profesor</option>
                                    {profesores.map((p) => <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    padding: '11px 20px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    marginTop: '8px'
                                }}
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
                    onClick={() => { setSelectedMember(null); setShowPlanModal(false); setShowProfesorModal(false); setConfirmDelete(false); }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '32px',
                            maxWidth: '900px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => { setSelectedMember(null); setShowPlanModal(false); setShowProfesorModal(false); setConfirmDelete(false); }}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6B7280',
                                padding: '4px'
                            }}
                        >
                            <X size={24} />
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#111827',
                                margin: 0,
                                textDecoration: 'underline'
                            }}>
                                {selectedMember.nombre} {selectedMember.apellido}
                            </h2>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>DNI: <strong>{selectedMember.dni}</strong></p>
                            </div>
                        </div>

                        {/* Member Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4ADE80, #3B82F6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px'
                            }}>
                                ðŸ‘¤
                            </div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                    {selectedMember.plan ?? 'Sin plan'}
                                </p>
                                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                                    {selectedMember.direccion ?? 'Sin dirección registrada'}
                                </p>
                            </div>
                        </div>

                        {/* DNI and Email */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div style={{ backgroundColor: '#E5E7EB', padding: '8px 16px', borderRadius: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>Mail:</strong> {selectedMember.mail ?? '-'}
                                </span>
                            </div>
                            <div style={{ backgroundColor: '#E5E7EB', padding: '8px 16px', borderRadius: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>Teléfono:</strong> {selectedMember.telefono ?? '-'}
                                </span>
                            </div>
                            <div style={{ backgroundColor: '#E5E7EB', padding: '8px 16px', borderRadius: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>Profesor:</strong>{' '}
                                    {(() => {
                                        const p = profesores.find(p => p.dni === selectedMember.idProfesor);
                                        return p ? `${p.nombre} ${p.apellido}` : '-';
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Info Cards Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px',
                            marginBottom: '32px'
                        }}>
                            {/* Deuda */}
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '20px',
                                borderRadius: '8px'
                            }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                                    Deuda
                                </p>
                                <p style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: Number(selectedMember.deuda ?? 0) > 0 ? '#EF4444' : '#10B981',
                                    margin: 0
                                }}>
                                    {formatDeuda(selectedMember.deuda)}
                                </p>
                            </div>

                            {/* Plan */}
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '20px',
                                borderRadius: '8px'
                            }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                                    Membresía
                                </p>
                                <p style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {selectedMember.plan ?? 'Sin plan'}
                                </p>
                            </div>

                            {/* Clases Restantes */}
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '20px',
                                borderRadius: '8px',
                                gridColumn: 'span 2'
                            }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                                    Clases Restantes
                                </p>
                                <p style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {selectedMember.clasesRestantes ?? '0'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button onClick={openPlanModal} style={{ backgroundColor: '#424242', color: 'white', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                                Cambio de membresía
                            </button>
                            <button onClick={openProfesorModal} style={{ backgroundColor: '#424242', color: 'white', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                                Cambio de profesor
                            </button>
                            <button onClick={() => { setConfirmDelete(true); setShowPlanModal(false); setShowProfesorModal(false); }} style={{ backgroundColor: '#EF4444', color: 'white', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: '500', marginLeft: 'auto' }}>
                                Eliminar
                            </button>
                        </div>

                        {/* Confirm delete */}
                        {confirmDelete && (
                            <div style={{ marginTop: '20px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#991B1B' }}>Â¿Eliminar a {selectedMember.nombre} {selectedMember.apellido}?</p>
                                    <button onClick={() => setConfirmDelete(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#B91C1C' }}>Esta acción no se puede deshacer.</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '9px', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                    <button onClick={() => handleDeleteMember(selectedMember.dni)} style={{ flex: 1, padding: '9px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <Check size={15} /> Sí, eliminar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Plan sub-modal */}
                        {showPlanModal && (
                            <div style={{ marginTop: '20px', backgroundColor: '#F3F4F6', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Cambiar membresía</p>
                                    <button onClick={() => { setShowPlanModal(false); setConfirmPlan(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
                                </div>
                                <select value={selectedPlanId} onChange={e => { setSelectedPlanId(e.target.value); setConfirmPlan(false); setPlanStatus(null); }} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white' }}>
                                    <option value="">Sin membresía</option>
                                    {membresias.map(m => <option key={m.idMembresia} value={m.idMembresia}>{m.nombreMembresia}</option>)}
                                </select>
                                {!confirmPlan && !planStatus && (
                                    <button onClick={() => setConfirmPlan(true)} style={{ padding: '9px', backgroundColor: '#424242', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                        Cambiar membresía
                                    </button>
                                )}
                                {confirmPlan && !planStatus && (
                                    <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
                                            Â¿Confirmar cambio a "{membresias.find(m => String(m.idMembresia) === selectedPlanId)?.nombreMembresia ?? 'Sin membresía'}"?
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setConfirmPlan(false)} style={{ flex: 1, padding: '8px', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                                Cancelar
                                            </button>
                                            <button onClick={handleCambioPlan} disabled={planLoading} style={{ flex: 1, padding: '8px', backgroundColor: planLoading ? '#9CA3AF' : '#424242', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: planLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <Check size={14} /> {planLoading ? 'Guardando...' : 'Sí, confirmar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {planStatus && <p style={{ margin: 0, fontSize: '13px', color: planStatus.ok ? '#16A34A' : '#DC2626', padding: '8px 12px', background: planStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{planStatus.msg}</p>}
                            </div>
                        )}

                        {/* Profesor sub-modal */}
                        {showProfesorModal && (
                            <div style={{ marginTop: '20px', backgroundColor: '#F3F4F6', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Asignar profesor</p>
                                    <button onClick={() => { setShowProfesorModal(false); setConfirmProfesor(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
                                </div>
                                <select value={selectedProfesorDni} onChange={e => { setSelectedProfesorDni(e.target.value); setConfirmProfesor(false); setProfesorStatus(null); }} style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white' }}>
                                    <option value="">Seleccionar profesor...</option>
                                    {profesores.map(p => <option key={p.dni} value={p.dni}>{p.nombre} {p.apellido}</option>)}
                                </select>
                                {!confirmProfesor && !profesorStatus && (
                                    <button onClick={() => setConfirmProfesor(true)} disabled={!selectedProfesorDni} style={{ padding: '9px', backgroundColor: selectedProfesorDni ? '#424242' : '#9CA3AF', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: selectedProfesorDni ? 'pointer' : 'not-allowed' }}>
                                        Asignar profesor
                                    </button>
                                )}
                                {confirmProfesor && !profesorStatus && (
                                    <div style={{ backgroundColor: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#92400E' }}>
                                            Â¿Confirmar asignación a "{profesores.find(p => p.dni === selectedProfesorDni)?.nombre} {profesores.find(p => p.dni === selectedProfesorDni)?.apellido}"?
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setConfirmProfesor(false)} style={{ flex: 1, padding: '8px', backgroundColor: 'white', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                                Cancelar
                                            </button>
                                            <button onClick={handleCambioProfesor} disabled={profesorLoading} style={{ flex: 1, padding: '8px', backgroundColor: profesorLoading ? '#9CA3AF' : '#424242', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: profesorLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                <Check size={14} /> {profesorLoading ? 'Guardando...' : 'Sí, confirmar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {profesorStatus && <p style={{ margin: 0, fontSize: '13px', color: profesorStatus.ok ? '#16A34A' : '#DC2626', padding: '8px 12px', background: profesorStatus.ok ? '#F0FDF4' : '#FEF2F2', borderRadius: '6px' }}>{profesorStatus.msg}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Socios;

