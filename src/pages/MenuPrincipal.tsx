import React, { useEffect, useState, useCallback } from 'react';
import { Info, TrendingDown, TrendingUp, UserCheck, LogIn } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import AppShell from '../components/AppShell';
import type { IngresoHistorialItem } from './Ingreso';

const HISTORIAL_KEY = 'goodlife_ingreso_historial';

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
    const [sociosActivos, setSociosActivos] = useState<number | null>(null);
    const [visitasMes, setVisitasMes] = useState<number | null>(null);
    const [bajasMes, setBajasMes] = useState<number | null>(null);
    const [proxVencimientos, setProxVencimientos] = useState<number | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/socios`)
            .then((res) => (res.ok ? res.json() : []))
            .then((socios: unknown[]) => setSociosActivos(socios.length))
            .catch(() => setSociosActivos(null));

        fetch(`${API_URL}/socios/vencimientos`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data: { estado: string }[]) => {
                const count = data.filter(s => s.estado === 'proximo' || s.estado === 'vencido').length;
                setProxVencimientos(count);
            })
            .catch(() => setProxVencimientos(null));

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
        { title: 'Socios Activos', value: sociosActivos !== null ? String(sociosActivos) : '-', icon: UserCheck, accent: 'from-primary-500 to-primary-600', link: '/estadisticas' },
        { title: 'Visitas del mes', value: visitasMes !== null ? String(visitasMes) : '-', icon: TrendingUp, accent: 'from-emerald-500 to-emerald-600', link: '/estadisticas' },
        { title: 'Prox. vencimientos', value: proxVencimientos !== null ? String(proxVencimientos) : '-', icon: Info, accent: 'from-amber-500 to-amber-600', link: '/vencimientos' },
        { title: 'Bajas del mes', value: bajasMes !== null ? String(bajasMes) : '-', icon: TrendingDown, accent: 'from-accent-red to-red-600', link: '/estadisticas' },
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

    const loadHistorial = useCallback((): IngresoHistorialItem[] => {
        try { return JSON.parse(localStorage.getItem(HISTORIAL_KEY) ?? '[]'); }
        catch { return []; }
    }, []);

    const [accessControl, setAccessControl] = useState<IngresoHistorialItem[]>(loadHistorial);

    useEffect(() => {
        const onFocus = () => setAccessControl(loadHistorial());
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [loadHistorial]);

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const rightPanel = (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Control de Acceso</h2>
                <button
                    onClick={() => onNavigate('/ingreso')}
                    className="text-[11px] text-primary-600 font-medium hover:underline flex items-center gap-1"
                >
                    <LogIn size={11} /> Ingresar
                </button>
            </div>

            {accessControl.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">Sin ingresos registrados hoy.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {accessControl.map((person, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-xl p-3 hover:bg-primary-50 transition-colors duration-200 animate-fadeIn"
                            style={{ animationDelay: `${index * 80}ms` }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                    {`${person.nombre[0] ?? ''}${person.apellido[0] ?? ''}`.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-xs leading-tight truncate">
                                        {person.nombre} {person.apellido}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-0.5 leading-tight">
                                        {person.clasesRestantes} clase{person.clasesRestantes !== 1 ? 's' : ''} · {formatTime(person.timestamp)}
                                    </p>
                                </div>
                                {index === 0 && (
                                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5 shrink-0">Ahora</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/menu-principal" rightPanel={rightPanel}>
            {/* Service Cards Grid */}
            <div className="grid grid-cols-2 gap-5 max-w-3xl w-full mt-1">
                {serviceCards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => card.link && onNavigate(card.link)}
                        className={`bg-white rounded-xl shadow-card hover:shadow-card-hover p-5 transition-all duration-300 hover:-translate-y-1 animate-fadeIn${card.link ? ' cursor-pointer' : ''}`}
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${card.accent} flex items-center justify-center text-white shadow-sm`}>
                                <card.icon size={16} />
                            </div>
                            <h3 className="text-gray-800 font-semibold text-sm">{card.title}</h3>
                        </div>
                        <p className="text-4xl font-light text-gray-600 ml-1">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Calendario de turnos activos */}
            <div className="mt-5 bg-white rounded-xl shadow-card p-5 max-w-3xl w-full animate-fadeIn [animation-delay:250ms]">
                <h3 className="text-gray-800 font-semibold text-sm mb-4 capitalize">
                    {currentMonthLabel}
                </h3>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDayLabels.map((label) => (
                        <div key={label} className="text-center text-xs font-semibold text-gray-500">
                            {label}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day: Date) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayTurnos = turnosByDay[dayKey] ?? [];
                        const today_ = isToday(day);
                        return (
                            <div
                                key={dayKey}
                                onClick={() => onNavigate('/turnero')}
                                className={`text-center rounded-lg px-0.5 py-1 text-[13px] min-h-[46px] transition-colors duration-150
                                    ${isSameMonth(day, today) ? 'text-gray-800' : 'text-gray-300'}
                                    ${today_ ? 'bg-primary-50 ring-1 ring-primary-300 font-bold' : ''}
                                    ${dayTurnos.length ? 'cursor-pointer hover:bg-primary-50' : ''}`}
                            >
                                {format(day, 'd')}
                                <div className="flex flex-col gap-px mt-0.5">
                                    {dayTurnos.slice(0, 2).map((t, i) => (
                                        <span
                                            key={i}
                                            className="text-[8px] leading-tight text-primary-600 whitespace-nowrap overflow-hidden text-ellipsis"
                                        >
                                            {t.horario.slice(0, 5)} {profesorShort(t)}
                                        </span>
                                    ))}
                                    {dayTurnos.length > 2 && (
                                        <span className="text-[8px] text-gray-500">
                                            +{dayTurnos.length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppShell>
    );
};

export default MenuPrincipal;
