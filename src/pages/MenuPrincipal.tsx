import React from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, Info } from 'lucide-react';
import logo from '../assets/logo.png';

interface MenuPrincipalProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ onLogout, onNavigate }) => {
    const menuItems = [
        { icon: Users, label: 'Socios' },
        { icon: Calendar, label: 'Turnero' },
        { icon: FileText, label: 'Planes' },
        { icon: BarChart3, label: 'Estadísticas' },
        { icon: Settings, label: 'Configuraciones' },
    ];

    const serviceCards = [
        { title: 'Socios Activos', value: '0' },
        { title: 'Visitas mensuales', value: '0' },
        { title: 'Prox. vencimientos', value: '0' },
        { title: 'Bajas', value: '0' },
    ];

    const accessControl = [
        { name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
        { name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
        { name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
        { name: 'Signorile Bautista', subtitle: 'Personalizado Juan Ignacio' },
    ];

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
                    width: '330px',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid #D1D5DB'
                }}>
                    {/* Menu Title */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #D1D5DB'
                    }}>
                        <button
                            onClick={() => onNavigate('/menu-principal')}
                            style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#374151',
                                margin: 0,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            Menú
                        </button>
                    </div>

                    <nav style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.label === 'Socios') {
                                        onNavigate('/socios');
                                    } else if (item.label === 'Turnero') {
                                        onNavigate('/turnero');
                                    } else if (item.label === 'Planes') {
                                        onNavigate('/planes');
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 20px',
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
                    {/* New Member Button */}
                    <div style={{ marginBottom: '20px', width: '100%', maxWidth: '768px' }}>
                        <button style={{
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
                    </div>

                    {/* Service Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '20px',
                        maxWidth: '768px',
                        width: '100%'
                    }}>
                        {serviceCards.map((card, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    padding: '20px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <Info size={18} color="#374151" />
                                    <h3 style={{
                                        color: '#111827',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        margin: 0
                                    }}>{card.title}</h3>
                                </div>
                                <p style={{
                                    fontSize: '36px',
                                    fontWeight: '300',
                                    color: '#4B5563',
                                    margin: 0,
                                    marginLeft: '26px'
                                }}>{card.value}</p>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Right Panel - Control de Acceso */}
                <aside style={{
                    width: '256px',
                    backgroundColor: 'white',
                    borderLeft: '1px solid #D1D5DB',
                    overflowY: 'auto'
                }}>
                    <div style={{ padding: '16px' }}>
                        <h2 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '16px'
                        }}>
                            Control de Acceso
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {accessControl.map((person, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#F5F5F5',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
                                            👤
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontWeight: '600',
                                                color: '#111827',
                                                fontSize: '12px',
                                                margin: 0,
                                                lineHeight: '1.2',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {person.name}
                                            </p>
                                            <p style={{
                                                color: '#6B7280',
                                                fontSize: '12px',
                                                margin: '2px 0 0 0',
                                                lineHeight: '1.2',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{person.subtitle}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MenuPrincipal;
