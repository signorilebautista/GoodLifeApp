import React, { useEffect, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, Info, UserPlus, LogIn, GraduationCap, Home } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MenuPrincipalProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface TurnoResumen {
    dia: string;
    horario: string;
    profesorNombre: string | null;
    profesorApellido: string | null;
}

const MenuPrincipal: React.FC<MenuPrincipalProps> = ({ onLogout, onNavigate }) => {
    const menuItems = [
        { icon: Home, label: 'Menú' },
        { icon: Users, label: 'Socios' },
        { icon: Calendar, label: 'Turnero' },
        { icon: LogIn, label: 'Ingreso' },
        { icon: FileText, label: 'Planes' },
        { icon: BarChart3, label: 'Estadísticas' },
        { icon: GraduationCap, label: 'Profesores' },
        { icon: UserPlus, label: 'Agregar' },
        { icon: Settings, label: 'Configuraciones' },
    ];

    const [sociosActivos, setSociosActivos] = useState<number | null>(null);
    const [visitasMes, setVisitasMes] = useState<number | null>(null);
    const [bajasMes, setBajasMes] = useState<number | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/socios`)
            .then((res) => (res.ok ? res.json() : []))
            .then((socios: unknown[]) => setSociosActivos(socios.length))
            .catch(() => setSociosActivos(null));

        const hoy = new Date();
        const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
        const hasta = hoy.toISOString().slice(0, 10);
        fetch(`${API_URL}/stats?desde=${desde}&hasta=${hasta}&granularity=day`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data) return;
                const visitas = (data.asistencias as { count: number }[]).reduce((s, p) => s + p.count, 0);
                const bajas = (data.bajas as { count: number }[]).reduce((s, p) => s + p.count, 0);
                setVisitasMes(visitas);
                setBajasMes(bajas);
            })
            .catch(() => {});
    }, []);

    const serviceCards = [
        { title: 'Socios Activos', value: sociosActivos !== null ? String(sociosActivos) : '-' },
        { title: 'Visitas del mes', value: visitasMes !== null ? String(visitasMes) : '-' },
        { title: 'Prox. vencimientos', value: '0' },
        { title: 'Bajas del mes', value: bajasMes !== null ? String(bajasMes) : '-' },
    ];

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const monthLabels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonthLabel = `${monthLabels[today.getMonth()]} ${today.getFullYear()}`;

    const [turnosByDay, setTurnosByDay] = useState<Record<string, TurnoResumen[]>>({});

    useEffect(() => {
        const desde = format(calendarStart, 'yyyy-MM-dd');
        const hasta = format(calendarEnd, 'yyyy-MM-dd');
        const params = new URLSearchParams({ desde, hasta });
        fetch(`${API_URL}/turnero?${params.toString()}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((turnos: TurnoResumen[]) => {
                const grouped: Record<string, TurnoResumen[]> = {};
                for (const t of turnos) {
                    const key = new Date(t.dia).toISOString().slice(0, 10);
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(t);
                }
                setTurnosByDay(grouped);
            })
            .catch(() => setTurnosByDay({}));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const profesorShort = (t: TurnoResumen) => {
        if (!t.profesorApellido && !t.profesorNombre) return 'Sin profesor';
        return t.profesorApellido ?? t.profesorNombre ?? '';
    };

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
                                    if (item.label === 'Socios') {
                                        onNavigate('/socios');
                                    } else if (item.label === 'Turnero') {
                                        onNavigate('/turnero');
                                    } else if (item.label === 'Planes') {
                                        onNavigate('/planes');
                                    } else if (item.label === 'Estadísticas') {
                                        onNavigate('/estadisticas');
                                    } else if (item.label === 'Ingreso') {
                                        onNavigate('/ingreso');
                                    } else if (item.label === 'Agregar') {
                                        onNavigate('/crear-cuenta');
                                    } else if (item.label === 'Profesores') {
                                        onNavigate('/profesores');
                                    } else if (item.label === 'Configuraciones') {
                                        onNavigate('/configuraciones');
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

                    {/* Calendario de turnos activos */}
                    <div style={{
                        marginTop: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        padding: '20px',
                        maxWidth: '768px',
                        width: '100%'
                    }}>
                        <h3 style={{
                            color: '#111827',
                            fontWeight: '600',
                            fontSize: '14px',
                            margin: '0 0 16px 0',
                            textTransform: 'capitalize'
                        }}>
                            {currentMonthLabel}
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '4px',
                            marginBottom: '8px'
                        }}>
                            {weekDayLabels.map((label) => (
                                <div key={label} style={{
                                    textAlign: 'center',
                                    fontSize: '12px',
                                    color: '#6B7280',
                                    fontWeight: '600'
                                }}>
                                    {label}
                                </div>
                            ))}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '4px'
                        }}>
                            {calendarDays.map((day: Date) => {
                                const dayKey = format(day, 'yyyy-MM-dd');
                                const dayTurnos = turnosByDay[dayKey] ?? [];
                                return (
                                    <div
                                        key={dayKey}
                                        onClick={() => onNavigate('/turnero')}
                                        style={{
                                            textAlign: 'center',
                                            padding: '4px 2px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            color: isSameMonth(day, today) ? '#111827' : '#D1D5DB',
                                            backgroundColor: isToday(day) ? '#E0E7FF' : 'transparent',
                                            fontWeight: isToday(day) ? '700' : '400',
                                            cursor: dayTurnos.length ? 'pointer' : 'default',
                                            minHeight: '46px'
                                        }}
                                    >
                                        {format(day, 'd')}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                                            {dayTurnos.slice(0, 2).map((t, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        fontSize: '8px',
                                                        lineHeight: '1.2',
                                                        color: '#1976D2',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}
                                                >
                                                    {t.horario.slice(0, 5)} {profesorShort(t)}
                                                </span>
                                            ))}
                                            {dayTurnos.length > 2 && (
                                                <span style={{ fontSize: '8px', color: '#6B7280' }}>
                                                    +{dayTurnos.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                                            ðŸ‘¤
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

