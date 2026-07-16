import React, { useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, Eye, Sun, Moon, UserPlus, LogIn, GraduationCap, Home } from 'lucide-react';
import logo from '../assets/logo.png';
import { useSettings, type FontSize, type FontWeight, type Theme } from '../context/SettingsContext';

interface ConfiguracionesProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
    currentUser: string;
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

const Configuraciones: React.FC<ConfiguracionesProps> = ({ onLogout, onNavigate, currentUser }) => {
    const { theme, fontSize, fontWeight, highContrast, setTheme, setFontSize, setFontWeight, setHighContrast, changePassword } = useSettings();

    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(null);

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            setPassMsg({ text: 'Las contraseñas nuevas no coinciden.', ok: false });
            return;
        }
        const err = changePassword(currentUser, oldPass, newPass);
        if (err) {
            setPassMsg({ text: err, ok: false });
        } else {
            setPassMsg({ text: 'Contraseña actualizada correctamente.', ok: true });
            setOldPass(''); setNewPass(''); setConfirmPass('');
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    };

    const sectionStyle: React.CSSProperties = {
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        padding: '24px',
        marginBottom: '20px',
    };

    const sectionTitle: React.CSSProperties = {
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '18px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '10px',
    };

    const toggleRow: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
    };

    const pillGroup = (options: { label: string; value: string }[], current: string, onChange: (v: string) => void) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    style={{
                        padding: '6px 18px',
                        borderRadius: '999px',
                        border: '2px solid',
                        borderColor: current === opt.value ? '#1976D2' : '#D1D5DB',
                        background: current === opt.value ? '#1976D2' : 'transparent',
                        color: current === opt.value ? 'white' : '#374151',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ backgroundColor: '#1976D2', height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Good Life Center" style={{ height: '48px', width: '48px' }} />
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <aside style={{ width: '220px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #D1D5DB' }}>
                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.path && onNavigate(item.path)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
                                    color: item.path === '/configuraciones' ? '#1976D2' : '#374151',
                                    backgroundColor: item.path === '/configuraciones' ? '#EFF6FF' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    textAlign: 'left',
                                    fontWeight: item.path === '/configuraciones' ? '600' : '400',
                                }}
                                onMouseEnter={(e) => { if (item.path !== '/configuraciones') e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                onMouseLeave={(e) => { if (item.path !== '/configuraciones') e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button
                            onClick={onLogout}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Main */}
                <main style={{ flex: 1, backgroundColor: '#CCCCCC', padding: '28px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Configuraciones</h2>

                        {/* Cambiar contraseña */}
                        <div style={sectionStyle}>
                            <p style={sectionTitle}>Cambiar contraseña</p>
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="password"
                                    placeholder="Contraseña actual"
                                    value={oldPass}
                                    onChange={e => setOldPass(e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Nueva contraseña"
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmar nueva contraseña"
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                                {passMsg && (
                                    <p style={{ margin: 0, fontSize: '13px', color: passMsg.ok ? '#16A34A' : '#DC2626' }}>
                                        {passMsg.text}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    style={{ padding: '10px', backgroundColor: '#1976D2', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Actualizar contraseña
                                </button>
                            </form>
                        </div>

                        {/* Tema */}
                        <div style={sectionStyle}>
                            <p style={sectionTitle}>Apariencia</p>
                            <div style={toggleRow}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '14px' }}>Modo de color</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Cambia entre tema claro y oscuro</p>
                                </div>
                                <button
                                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #D1D5DB',
                                        background: theme === 'dark' ? '#1E293B' : '#F9FAFB',
                                        color: theme === 'dark' ? 'white' : '#374151',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                    }}
                                >
                                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                    {theme === 'dark' ? 'Oscuro' : 'Claro'}
                                </button>
                            </div>
                        </div>

                        {/* Accesibilidad */}
                        <div style={sectionStyle}>
                            <p style={sectionTitle}>Accesibilidad</p>

                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ margin: '0 0 10px', fontWeight: '500', fontSize: '14px' }}>Tamaño de letra</p>
                                {pillGroup(
                                    [{ label: 'Pequeño', value: 'small' }, { label: 'Mediano', value: 'medium' }, { label: 'Grande', value: 'large' }],
                                    fontSize,
                                    v => setFontSize(v as FontSize)
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ margin: '0 0 10px', fontWeight: '500', fontSize: '14px' }}>Grosor de letra</p>
                                {pillGroup(
                                    [{ label: 'Normal', value: 'normal' }, { label: 'Semi-negrita', value: 'semibold' }, { label: 'Negrita', value: 'bold' }],
                                    fontWeight,
                                    v => setFontWeight(v as FontWeight)
                                )}
                            </div>

                            <div style={toggleRow}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Eye size={16} /> Modo alto contraste
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Aumenta el contraste para mejor legibilidad</p>
                                </div>
                                <button
                                    onClick={() => setHighContrast(!highContrast)}
                                    style={{
                                        width: '48px',
                                        height: '26px',
                                        borderRadius: '999px',
                                        border: 'none',
                                        backgroundColor: highContrast ? '#1976D2' : '#D1D5DB',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'background 0.2s',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: highContrast ? '25px' : '3px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        transition: 'left 0.2s',
                                        display: 'block',
                                    }} />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Configuraciones;

