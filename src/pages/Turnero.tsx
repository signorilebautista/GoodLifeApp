import React, { useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react';
import logo from '../assets/logo.png';

interface TurneroProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface Appointment {
    id: number;
    time: string;
    professor: string;
    location: string;
    date: string;
}

const Turnero: React.FC<TurneroProps> = ({ onLogout, onNavigate }) => {
    const [dateRange] = useState('20 Agosto - 25 Agosto');
    const [selectedLocation] = useState('Sede: Nva. Córdoba');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editProfessor, setEditProfessor] = useState('');

    // New appointment modal state
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('09:00');
    const [newProfessor, setNewProfessor] = useState('Bautista Signorile');
    const [newLocation, setNewLocation] = useState('Nva. Cba.');

    const menuItems = [
        { icon: Users, label: 'Socios', active: false },
        { icon: Calendar, label: 'Turnero', active: true },
        { icon: FileText, label: 'Planes', active: false },
        { icon: BarChart3, label: 'Estadísticas', active: false },
        { icon: Settings, label: 'Configuraciones', active: false },
    ];

    const appointments: Appointment[] = [
        { id: 1, time: '09:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Miercoles 20 de Agosto, 2025' },
        { id: 2, time: '11:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Miercoles 20 de Agosto, 2025' },
        { id: 3, time: '14:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Miercoles 20 de Agosto, 2025' },
        { id: 4, time: '09:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Jueves 21 de Agosto, 2025' },
        { id: 5, time: '11:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Jueves 21 de Agosto, 2025' },
        { id: 6, time: '14:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Jueves 21 de Agosto, 2025' },
        { id: 7, time: '09:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Viernes 22 de Agosto, 2025' },
        { id: 8, time: '11:00', professor: 'Bautista Signorile', location: 'Nva. Cba.', date: 'Viernes 22 de Agosto, 2025' },
    ];

    // Group appointments by date
    const groupedAppointments = appointments.reduce((acc, appointment) => {
        if (!acc[appointment.date]) {
            acc[appointment.date] = [];
        }
        acc[appointment.date].push(appointment);
        return acc;
    }, {} as Record<string, Appointment[]>);

    const handleModifyClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setEditTime(appointment.time);
        setEditProfessor(appointment.professor);
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
                                    if (item.label === 'Turnero') return;
                                    if (item.label === 'Socios') {
                                        onNavigate('/socios');
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
                    backgroundColor: '#E5E7EB',
                    padding: '24px',
                    overflowY: 'auto'
                }}>
                    {/* Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        alignItems: 'center'
                    }}>
                        {/* Date Range Selector */}
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#D1D5DB',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#111827'
                        }}>
                            <Calendar size={18} />
                            {dateRange}
                            <ChevronDown size={18} />
                        </button>

                        {/* Location Selector */}
                        <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#D1D5DB',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#111827'
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {selectedLocation}
                            <ChevronDown size={18} />
                        </button>

                        {/* Nuevo Horario Button */}
                        <button
                            onClick={() => setShowNewAppointmentModal(true)}
                            style={{
                                backgroundColor: '#424242',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '500',
                                marginLeft: 'auto'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#424242'}
                        >
                            Nuevo Horario
                        </button>
                    </div>

                    {/* Appointments List */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '100%',
                        width: '100%'
                    }}>
                        {Object.entries(groupedAppointments).map(([date, apps], dateIndex) => (
                            <div key={dateIndex} style={{ marginBottom: dateIndex < Object.keys(groupedAppointments).length - 1 ? '32px' : 0 }}>
                                {/* Date Header */}
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: '#111827',
                                    marginBottom: '16px',
                                    marginTop: 0
                                }}>
                                    {date}
                                </h3>

                                {/* Appointments for this date */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {apps.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '16px 20px',
                                                border: '2px solid #111827',
                                                borderRadius: '8px',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flex: 1 }}>
                                                {/* Time */}
                                                <span style={{
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    color: '#111827',
                                                    minWidth: '60px'
                                                }}>
                                                    {appointment.time}
                                                </span>

                                                {/* Professor */}
                                                <span style={{
                                                    fontSize: '16px',
                                                    color: '#111827',
                                                    flex: 1
                                                }}>
                                                    Profe: {appointment.professor}
                                                </span>

                                                {/* Location */}
                                                <span style={{
                                                    fontSize: '16px',
                                                    color: '#111827',
                                                    minWidth: '120px'
                                                }}>
                                                    Sede: {appointment.location}
                                                </span>
                                            </div>

                                            {/* Modify Button */}
                                            <button
                                                onClick={() => handleModifyClick(appointment)}
                                                style={{
                                                    backgroundColor: '#424242',
                                                    color: 'white',
                                                    padding: '8px 20px',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    marginLeft: '20px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#424242'}
                                            >
                                                Modificar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Edit Modal */}
            {selectedAppointment && (
                <div
                    onClick={() => setSelectedAppointment(null)}
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
                            maxWidth: '500px',
                            width: '90%',
                            position: 'relative'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedAppointment(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '24px',
                                color: '#6B7280',
                                padding: '4px'
                            }}
                        >
                            ×
                        </button>

                        {/* Horario Selector */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Horario:
                                <select
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: '#111827'
                                    }}
                                >
                                    <option value="09:00">09:00</option>
                                    <option value="10:00">10:00</option>
                                    <option value="11:00">11:00</option>
                                    <option value="12:00">12:00</option>
                                    <option value="13:00">13:00</option>
                                    <option value="14:00">14:00</option>
                                    <option value="15:00">15:00</option>
                                    <option value="16:00">16:00</option>
                                    <option value="17:00">17:00</option>
                                    <option value="18:00">18:00</option>
                                </select>
                                <ChevronDown size={20} />
                            </label>
                        </div>

                        {/* Profesor Selector */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Profesor:
                                <select
                                    value={editProfessor}
                                    onChange={(e) => setEditProfessor(e.target.value)}
                                    style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: '#111827'
                                    }}
                                >
                                    <option value="Bautista Signorile">Bautista Signorile</option>
                                    <option value="Manuel Barreiro">Manuel Barreiro</option>
                                    <option value="Benja Gerhauser">Benja Gerhauser</option>
                                    <option value="Juani Perioti">Juani Perioti</option>
                                </select>
                                <ChevronDown size={20} />
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                style={{
                                    backgroundColor: '#E5E7EB',
                                    color: '#111827',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Handle save logic here
                                    setSelectedAppointment(null);
                                }}
                                style={{
                                    backgroundColor: '#424242',
                                    color: 'white',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Appointment Modal */}
            {showNewAppointmentModal && (
                <div
                    onClick={() => setShowNewAppointmentModal(false)}
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
                            maxWidth: '500px',
                            width: '90%',
                            position: 'relative'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowNewAppointmentModal(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '24px',
                                color: '#6B7280',
                                padding: '4px'
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', marginTop: 0 }}>Nuevo Horario</h2>

                        {/* Fecha Selector */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Fecha:
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    style={{
                                        fontSize: '16px',
                                        padding: '8px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#111827',
                                        flex: 1
                                    }}
                                />
                            </label>
                        </div>

                        {/* Horario Selector */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Horario:
                                <select
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        padding: '8px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#111827',
                                        flex: 1
                                    }}
                                >
                                    <option value="09:00">09:00</option>
                                    <option value="10:00">10:00</option>
                                    <option value="11:00">11:00</option>
                                    <option value="12:00">12:00</option>
                                    <option value="13:00">13:00</option>
                                    <option value="14:00">14:00</option>
                                    <option value="15:00">15:00</option>
                                    <option value="16:00">16:00</option>
                                    <option value="17:00">17:00</option>
                                    <option value="18:00">18:00</option>
                                </select>
                            </label>
                        </div>

                        {/* Profesor Selector */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Profesor:
                                <select
                                    value={newProfessor}
                                    onChange={(e) => setNewProfessor(e.target.value)}
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        padding: '8px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#111827',
                                        flex: 1
                                    }}
                                >
                                    <option value="Bautista Signorile">Bautista Signorile</option>
                                    <option value="Manuel Barreiro">Manuel Barreiro</option>
                                    <option value="Benja Gerhauser">Benja Gerhauser</option>
                                    <option value="Juani Perioti">Juani Perioti</option>
                                </select>
                            </label>
                        </div>

                        {/* Sede Selector */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111827'
                            }}>
                                Sede:
                                <select
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        padding: '8px 12px',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#111827',
                                        flex: 1
                                    }}
                                >
                                    <option value="Nva. Cba.">Nva. Córdoba</option>
                                    <option value="Centro">Centro</option>
                                    <option value="Alta Córdoba">Alta Córdoba</option>
                                </select>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowNewAppointmentModal(false)}
                                style={{
                                    backgroundColor: '#E5E7EB',
                                    color: '#111827',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Handle save logic here
                                    setShowNewAppointmentModal(false);
                                }}
                                style={{
                                    backgroundColor: '#424242',
                                    color: 'white',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Turnero;
