import React, { useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, X } from 'lucide-react';
import logo from '../assets/logo.png';

interface SociosProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Member {
    id: number;
    memberNumber: string;
    name: string;
    plan: string;
    createdDate: string;
    dni: string;
    email: string;
    debt: number;
    planType: string;
    remainingDays: number;
    totalDays: number;
    lastAttendance: string;
}

const Socios: React.FC<SociosProps> = ({ onLogout, onNavigate }) => {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const menuItems = [
        { icon: Users, label: 'Socios', active: true },
        { icon: Calendar, label: 'Turnero', active: false },
        { icon: FileText, label: 'Planes', active: false },
        { icon: BarChart3, label: 'Estadísticas', active: false },
        { icon: Settings, label: 'Configuraciones', active: false },
    ];

    const members: Member[] = [
        { id: 1, memberNumber: '500/1', name: 'Bautista Signorile', plan: 'Personalizado con lucas', createdDate: '25/05/2025', dni: '99999999', email: 'signorilebautista@gmail.com', debt: -13000, planType: 'Estandar', remainingDays: 5, totalDays: 12, lastAttendance: '25/08/2025' },
        { id: 2, memberNumber: '501/1', name: 'Manuel Barreiro', plan: 'Personalizado con lucas', createdDate: '25/05/2025', dni: '88888888', email: 'manuelbarreiro@gmail.com', debt: 0, planType: 'Premium', remainingDays: 8, totalDays: 12, lastAttendance: '26/08/2025' },
        { id: 3, memberNumber: '502/1', name: 'Benja Gerhauser', plan: 'Personalizado con lucas', createdDate: '25/05/2025', dni: '77777777', email: 'benjagerhauser@gmail.com', debt: -5000, planType: 'Estandar', remainingDays: 3, totalDays: 12, lastAttendance: '24/08/2025' },
        { id: 4, memberNumber: '503/1', name: 'Juani Perioti', plan: 'Personalizado con lucas', createdDate: '25/05/2025', dni: '66666666', email: 'juaniperioti@gmail.com', debt: 0, planType: 'Premium', remainingDays: 10, totalDays: 12, lastAttendance: '27/08/2025' },
        { id: 5, memberNumber: '504/1', name: 'Juani Perioti', plan: 'Personalizado con Miguel', createdDate: '25/05/2025', dni: '66666666', email: 'juaniperioti@gmail.com', debt: -2000, planType: 'Estandar', remainingDays: 6, totalDays: 12, lastAttendance: '25/08/2025' },
        { id: 6, memberNumber: '505/1', name: 'Bautista Signorile', plan: 'Personalizado con Miguel', createdDate: '25/05/2025', dni: '99999999', email: 'signorilebautista@gmail.com', debt: 0, planType: 'Premium', remainingDays: 9, totalDays: 12, lastAttendance: '26/08/2025' },
        { id: 7, memberNumber: '506/1', name: 'Manuel Barreiro', plan: 'Personalizado con Miguel', createdDate: '25/05/2025', dni: '88888888', email: 'manuelbarreiro@gmail.com', debt: -8000, planType: 'Estandar', remainingDays: 4, totalDays: 12, lastAttendance: '23/08/2025' },
        { id: 8, memberNumber: '507/1', name: 'Benja Gerhauser', plan: 'Personalizado con Miguel', createdDate: '25/05/2025', dni: '77777777', email: 'benjagerhauser@gmail.com', debt: 0, planType: 'Premium', remainingDays: 11, totalDays: 12, lastAttendance: '27/08/2025' },
        { id: 9, memberNumber: '508/1', name: 'Manuel Barreiro', plan: 'Personalizado con Juan', createdDate: '25/05/2025', dni: '88888888', email: 'manuelbarreiro@gmail.com', debt: -3000, planType: 'Estandar', remainingDays: 7, totalDays: 12, lastAttendance: '25/08/2025' },
        { id: 10, memberNumber: '509/1', name: 'Benja Gerhauser', plan: 'Personalizado con Juan', createdDate: '25/05/2025', dni: '77777777', email: 'benjagerhauser@gmail.com', debt: 0, planType: 'Premium', remainingDays: 12, totalDays: 12, lastAttendance: '28/08/2025' },
        { id: 11, memberNumber: '510/1', name: 'Juani Perioti', plan: 'Personalizado con Juan', createdDate: '25/05/2025', dni: '66666666', email: 'juaniperioti@gmail.com', debt: -6000, planType: 'Estandar', remainingDays: 2, totalDays: 12, lastAttendance: '22/08/2025' },
        { id: 12, memberNumber: '511/1', name: 'Bautista Signorile', plan: 'Personalizado con Juan', createdDate: '25/05/2025', dni: '99999999', email: 'signorilebautista@gmail.com', debt: 0, planType: 'Premium', remainingDays: 8, totalDays: 12, lastAttendance: '26/08/2025' },
        { id: 13, memberNumber: '512/1', name: 'Benja Gerhauser', plan: 'Personalizado con Carlos', createdDate: '25/05/2025', dni: '77777777', email: 'benjagerhauser@gmail.com', debt: -10000, planType: 'Estandar', remainingDays: 1, totalDays: 12, lastAttendance: '21/08/2025' },
        { id: 14, memberNumber: '513/1', name: 'Juani Perioti', plan: 'Personalizado con Carlos', createdDate: '25/05/2025', dni: '66666666', email: 'juaniperioti@gmail.com', debt: 0, planType: 'Premium', remainingDays: 9, totalDays: 12, lastAttendance: '26/08/2025' },
        { id: 15, memberNumber: '514/1', name: 'Bautista Signorile', plan: 'Personalizado con Carlos', createdDate: '25/05/2025', dni: '99999999', email: 'signorilebautista@gmail.com', debt: -4000, planType: 'Estandar', remainingDays: 6, totalDays: 12, lastAttendance: '24/08/2025' },
        { id: 16, memberNumber: '515/1', name: 'Manuel Barreiro', plan: 'Personalizado con Carlos', createdDate: '25/05/2025', dni: '88888888', email: 'manuelbarreiro@gmail.com', debt: 0, planType: 'Premium', remainingDays: 10, totalDays: 12, lastAttendance: '27/08/2025' },
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
                                    if (item.label === 'Socios') return;
                                    if (item.label === 'Turnero') {
                                        onNavigate('/turnero');
                                    } else if (item.label === 'Planes') {
                                        onNavigate('/planes');
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
                    {/* New Member Button */}
                    <div style={{ marginBottom: '20px', width: '100%', maxWidth: '1200px' }}>
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

                    {/* Members Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px',
                        maxWidth: '1200px',
                        width: '100%'
                    }}>
                        {members.map((member) => (
                            <div
                                key={member.id}
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
                                        👤
                                    </div>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#111827',
                                        margin: 0
                                    }}>
                                        {member.name}
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
                                        {member.plan}
                                    </p>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#9CA3AF',
                                        margin: 0
                                    }}>
                                        Creado el {member.createdDate.split('/')[0]}/{member.createdDate.split('/')[1]}
                                    </p>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle delete
                                    }}
                                    style={{
                                        backgroundColor: '#EF4444',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        marginTop: '4px',
                                        fontWeight: '500'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Modal */}
            {selectedMember && (
                <div
                    onClick={() => setSelectedMember(null)}
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
                            onClick={() => setSelectedMember(null)}
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
                                {selectedMember.name}
                            </h2>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Nº De Socio: <strong>{selectedMember.memberNumber}</strong></p>
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
                                👤
                            </div>
                            <div>
                                <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                    {selectedMember.plan}
                                </p>
                                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                                    Creado el {selectedMember.createdDate}
                                </p>
                            </div>
                        </div>

                        {/* DNI and Email */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '8px 16px',
                                borderRadius: '6px'
                            }}>
                                <span style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>DNI:</strong> {selectedMember.dni}
                                </span>
                            </div>
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '8px 16px',
                                borderRadius: '6px'
                            }}>
                                <span style={{ fontSize: '14px', color: '#111827' }}>
                                    <strong>Mail:</strong> {selectedMember.email}
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
                                    color: selectedMember.debt < 0 ? '#EF4444' : '#10B981',
                                    margin: 0
                                }}>
                                    {selectedMember.debt < 0 ? '-' : ''}${Math.abs(selectedMember.debt).toLocaleString()}
                                </p>
                            </div>

                            {/* Plan */}
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '20px',
                                borderRadius: '8px'
                            }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                                    Plan
                                </p>
                                <p style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {selectedMember.planType}
                                </p>
                            </div>

                            {/* Días Restantes */}
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '20px',
                                borderRadius: '8px'
                            }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                                    Días Restantes:
                                </p>
                                <p style={{
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {selectedMember.remainingDays}/{selectedMember.totalDays}
                                </p>
                            </div>

                            {/* Último Día Asistido */}
                            <div style={{
                                backgroundColor: '#E5E7EB',
                                padding: '20px',
                                borderRadius: '8px'
                            }}>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                                    Ultimo Día Asistido
                                </p>
                                <p style={{
                                    fontSize: '28px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }}>
                                    {selectedMember.lastAttendance}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button style={{
                                backgroundColor: '#424242',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}>
                                Cambio de plan
                            </button>
                            <button style={{
                                backgroundColor: '#424242',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}>
                                Cambio de profesor
                            </button>
                            <button style={{
                                backgroundColor: '#424242',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}>
                                Cambio de sede
                            </button>
                            <button style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500',
                                marginLeft: 'auto'
                            }}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Socios;
