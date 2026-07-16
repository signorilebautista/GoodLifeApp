import React, { useRef, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, UserPlus, LogIn, CheckCircle, XCircle, GraduationCap, Home } from 'lucide-react';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface IngresoProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface IngresoResult {
    ok: boolean;
    nombre: string;
    apellido: string;
    clasesRestantes: number;
    mensaje: string;
    timestamp: Date;
}

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

const Ingreso: React.FC<IngresoProps> = ({ onLogout, onNavigate }) => {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IngresoResult | null>(null);
    const [ultimo, setUltimo] = useState<IngresoResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleIngreso = async () => {
        const dniTrim = dni.trim();
        if (!dniTrim) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/socios/${dniTrim}/ingreso`, { method: 'PATCH' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Error al registrar ingreso.');
            const r: IngresoResult = { ...data, timestamp: new Date() };
            setResult(r);
            if (r.ok) setUltimo(r);
        } catch (err: unknown) {
            setResult({ ok: false, nombre: '', apellido: '', clasesRestantes: 0, mensaje: err instanceof Error ? err.message : 'Error desconocido.', timestamp: new Date() });
        } finally {
            setLoading(false);
            setDni('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleIngreso();
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ backgroundColor: '#1976D2', height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>GOOD LIFE CENTER</h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <aside style={{ width: '220px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #D1D5DB' }}>
                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map(item => (
                            <button key={item.label} onClick={() => item.path !== '/ingreso' && onNavigate(item.path)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                                    color: item.path === '/ingreso' ? '#1976D2' : '#374151',
                                    backgroundColor: item.path === '/ingreso' ? '#EFF6FF' : 'transparent',
                                    border: 'none', cursor: item.path === '/ingreso' ? 'default' : 'pointer',
                                    fontSize: '16px', textAlign: 'left', fontWeight: item.path === '/ingreso' ? '600' : '400',
                                }}
                                onMouseEnter={e => { if (item.path !== '/ingreso') e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                onMouseLeave={e => { if (item.path !== '/ingreso') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button onClick={onLogout}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                <main style={{ flex: 1, backgroundColor: '#CCCCCC', padding: '40px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    {/* Input card */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LogIn size={22} color="#1976D2" /> Registrar Ingreso
                        </h2>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '8px' }}>DNI del socio</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                ref={inputRef}
                                autoFocus
                                value={dni}
                                onChange={e => setDni(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ej: 12345678"
                                style={{ flex: 1, padding: '12px 14px', border: '2px solid #D1D5DB', borderRadius: '8px', fontSize: '18px', outline: 'none', letterSpacing: '0.05em' }}
                                onFocus={e => e.target.style.borderColor = '#1976D2'}
                                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                            />
                            <button
                                onClick={handleIngreso}
                                disabled={loading || !dni.trim()}
                                style={{
                                    padding: '12px 22px', borderRadius: '8px', border: 'none', cursor: loading || !dni.trim() ? 'not-allowed' : 'pointer',
                                    backgroundColor: loading || !dni.trim() ? '#93C5FD' : '#1976D2', color: 'white', fontSize: '15px', fontWeight: '600',
                                }}>
                                {loading ? '...' : 'Ingresar'}
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px', margin: '8px 0 0 0' }}>Presioná Enter o el botón para registrar.</p>
                    </div>

                    {/* Result */}
                    {result && (
                        <div style={{
                            backgroundColor: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderLeft: `5px solid ${result.ok ? '#10B981' : '#EF4444'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                {result.ok
                                    ? <CheckCircle size={36} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    : <XCircle size={36} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                }
                                <div>
                                    {result.nombre && (
                                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                                            {result.nombre} {result.apellido}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '15px', color: result.ok ? '#065F46' : '#991B1B', margin: '0 0 6px 0', fontWeight: '500' }}>
                                        {result.mensaje}
                                    </p>
                                    {result.ok && (
                                        <div style={{ display: 'inline-block', backgroundColor: result.clasesRestantes > 0 ? '#D1FAE5' : '#FEE2E2', borderRadius: '6px', padding: '4px 12px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: result.clasesRestantes > 0 ? '#065F46' : '#991B1B' }}>
                                                Clases restantes: {result.clasesRestantes}
                                            </span>
                                        </div>
                                    )}
                                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '8px 0 0 0' }}>{formatTime(result.timestamp)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Último ingresado */}
                    {ultimo && result !== ultimo && (
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px', width: '100%', maxWidth: '480px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <p style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Último ingresado</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#4ADE80,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>ðŸ‘¤</div>
                                <div>
                                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>{ultimo.nombre} {ultimo.apellido}</p>
                                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                                        {ultimo.clasesRestantes} clase{ultimo.clasesRestantes !== 1 ? 's' : ''} restante{ultimo.clasesRestantes !== 1 ? 's' : ''} Â· {formatTime(ultimo.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Ingreso;

