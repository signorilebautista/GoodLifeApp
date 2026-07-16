import React, { useEffect, useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, UserPlus, LogIn, GraduationCap, Home } from 'lucide-react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface EstadisticasProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface StatPoint { key: string; label: string; count: number; }
interface StatsResult { asistencias: StatPoint[]; nuevos: StatPoint[]; bajas: StatPoint[]; }

type Rango = '1m' | '3m' | '1y' | 'all';

const rangoOpts: { label: string; value: Rango }[] = [
    { label: 'Último mes', value: '1m' },
    { label: 'Últimos 3 meses', value: '3m' },
    { label: 'Último año', value: '1y' },
    { label: 'Todo', value: 'all' },
];

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

const MES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function getRangoFechas(rango: Rango): { desde?: string; hasta?: string } {
    const hoy = new Date();
    const hasta = hoy.toISOString().slice(0, 10);
    if (rango === 'all') return {};
    const desde = new Date(hoy);
    if (rango === '1m') desde.setMonth(desde.getMonth() - 1);
    else if (rango === '3m') desde.setMonth(desde.getMonth() - 3);
    else if (rango === '1y') desde.setFullYear(desde.getFullYear() - 1);
    return { desde: desde.toISOString().slice(0, 10), hasta };
}

function toDayLabel(ymd: string): string {
    const [, m, d] = ymd.split('-');
    return `${parseInt(d)} ${MES_LABEL[parseInt(m) - 1]}`;
}

function addDays(date: Date, n: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

interface DayPoint {
    key: string;
    label: string;
    isMonthStart: boolean;
    asistencias: number;
    nuevos: number;
    bajas: number;
}

function buildDayPoints(
    desde: string,
    hasta: string,
    asistencias: StatPoint[],
    nuevos: StatPoint[],
    bajas: StatPoint[],
): DayPoint[] {
    const asMap = new Map(asistencias.map(p => [p.key, p.count]));
    const nvMap = new Map(nuevos.map(p => [p.key, p.count]));
    const bjMap = new Map(bajas.map(p => [p.key, p.count]));

    const result: DayPoint[] = [];
    let cur = new Date(desde + 'T00:00:00');
    const end = new Date(hasta + 'T00:00:00');

    while (cur <= end) {
        const key = cur.toISOString().slice(0, 10);
        result.push({
            key,
            label: toDayLabel(key),
            isMonthStart: cur.getDate() === 1,
            asistencias: asMap.get(key) ?? 0,
            nuevos: nvMap.get(key) ?? 0,
            bajas: bjMap.get(key) ?? 0,
        });
        cur = addDays(cur, 1);
    }
    return result;
}

// XAxis tick that only renders on month starts
const MonthTick = (props: any) => {
    const { x, y, payload, data } = props;
    const point = (data as DayPoint[]).find(d => d.label === payload.value);
    if (!point?.isMonthStart) return null;
    return (
        <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600}>
            {payload.value}
        </text>
    );
};

const Estadisticas: React.FC<EstadisticasProps> = ({ onLogout, onNavigate }) => {
    const [rango, setRango] = useState<Rango>('3m');
    const [data, setData] = useState<DayPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const { desde, hasta } = getRangoFechas(rango);
        const params = new URLSearchParams();
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);
        params.set('granularity', 'day');

        fetch(`${API_URL}/stats?${params}`)
            .then(r => { if (!r.ok) throw new Error('Error al cargar'); return r.json() as Promise<StatsResult>; })
            .then(res => {
                // determine effective range
                const allKeys = [
                    ...res.asistencias.map(p => p.key),
                    ...res.nuevos.map(p => p.key),
                    ...res.bajas.map(p => p.key),
                ];
                const today = new Date().toISOString().slice(0, 10);
                const effectiveDesde = desde ?? (allKeys.length ? allKeys.reduce((a, b) => a < b ? a : b) : today);
                const effectiveHasta = hasta ?? today;
                setData(buildDayPoints(effectiveDesde, effectiveHasta, res.asistencias, res.nuevos, res.bajas));
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [rango]);

    const totalAsistencias = data.reduce((s, d) => s + d.asistencias, 0);
    const totalNuevos = data.reduce((s, d) => s + d.nuevos, 0);
    const totalBajas = data.reduce((s, d) => s + d.bajas, 0);

    const monthStarts = data.filter(d => d.isMonthStart).map(d => d.label);

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
                            <button key={item.label} onClick={() => item.path && onNavigate(item.path)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                                    color: item.path === '/estadisticas' ? '#1976D2' : '#374151',
                                    backgroundColor: item.path === '/estadisticas' ? '#EFF6FF' : 'transparent',
                                    border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left',
                                    fontWeight: item.path === '/estadisticas' ? '600' : '400',
                                }}
                                onMouseEnter={e => { if (item.path !== '/estadisticas') e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                                onMouseLeave={e => { if (item.path !== '/estadisticas') e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <item.icon size={20} /><span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div style={{ borderTop: '1px solid #D1D5DB' }}>
                        <button onClick={onLogout}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', color: '#374151', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', textAlign: 'left' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <LogOut size={20} /><span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                <main style={{ flex: 1, backgroundColor: '#CCCCCC', padding: '28px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Estadísticas</h2>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {rangoOpts.map(opt => (
                                    <button key={opt.value} onClick={() => setRango(opt.value)}
                                        style={{
                                            padding: '7px 16px', borderRadius: '999px', border: '2px solid',
                                            borderColor: rango === opt.value ? '#1976D2' : '#D1D5DB',
                                            background: rango === opt.value ? '#1976D2' : 'white',
                                            color: rango === opt.value ? 'white' : '#374151',
                                            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                                        }}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* KPI cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            {[
                                { label: 'Asistencias', value: totalAsistencias, color: '#1976D2' },
                                { label: 'Nuevos socios', value: totalNuevos, color: '#16A34A' },
                                { label: 'Bajas', value: totalBajas, color: '#DC2626' },
                            ].map(k => (
                                <div key={k.label} style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderTop: `4px solid ${k.color}` }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{k.label}</p>
                                    <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: k.color }}>{k.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Chart */}
                        <div style={{ background: 'white', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            {loading && <p style={{ textAlign: 'center', color: '#6B7280' }}>Cargando...</p>}
                            {error && <p style={{ textAlign: 'center', color: '#DC2626' }}>{error}</p>}
                            {!loading && !error && data.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#6B7280' }}>Sin datos para el período seleccionado.</p>
                            )}
                            {!loading && !error && data.length > 0 && (
                                <ResponsiveContainer width="100%" height={380}>
                                    <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                        <XAxis
                                            dataKey="label"
                                            tick={<MonthTick data={data} />}
                                            interval={0}
                                            height={36}
                                        />
                                        <YAxis allowDecimals={false} domain={[0, 20]} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        {monthStarts.map(label => (
                                            <ReferenceLine key={label} x={label} stroke="#9CA3AF" strokeDasharray="4 3" />
                                        ))}
                                        <Bar dataKey="asistencias" name="Asistencias" fill="#1976D2" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="nuevos" name="Nuevos socios" fill="#16A34A" radius={[3, 3, 0, 0]} />
                                        <Line dataKey="bajas" name="Bajas" stroke="#DC2626" strokeWidth={2} dot={false} type="monotone" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Estadisticas;

