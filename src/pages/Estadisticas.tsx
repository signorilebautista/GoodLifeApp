import React, { useEffect, useState } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import AppShell from '../components/AppShell';

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
    isBiweekly: boolean;
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
        const day = cur.getDate();
        result.push({
            key,
            label: toDayLabel(key),
            isMonthStart: day === 1,
            isBiweekly: day === 1 || day === 16,
            asistencias: asMap.get(key) ?? 0,
            nuevos: nvMap.get(key) ?? 0,
            bajas: bjMap.get(key) ?? 0,
        });
        cur = addDays(cur, 1);
    }
    return result;
}

const AxisTick = (props: any) => {
    const { x, y, payload, data, rango } = props;
    const point = (data as DayPoint[]).find(d => d.label === payload.value);
    if (!point) return null;
    const show = rango === '3m' ? point.isBiweekly : point.isMonthStart;
    if (!show) return null;
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

    const refLines = rango === '3m'
        ? data.filter(d => d.isBiweekly).map(d => d.label)
        : data.filter(d => d.isMonthStart).map(d => d.label);

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/estadisticas">
            <div className="w-full max-w-4xl">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3 animate-fadeIn">
                    <h2 className="text-xl font-bold text-gray-900">Estadísticas</h2>
                    <div className="flex gap-2 flex-wrap">
                        {rangoOpts.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setRango(opt.value)}
                                className={`px-4 py-1.5 rounded-full border-2 text-[13px] font-medium transition-all duration-150 active:scale-95 ${rango === opt.value ? 'bg-primary-500 border-primary-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Asistencias', value: totalAsistencias, color: '#00A8E8', text: 'text-primary-600' },
                        { label: 'Nuevos socios', value: totalNuevos, color: '#16A34A', text: 'text-emerald-600' },
                        { label: 'Bajas', value: totalBajas, color: '#DC2626', text: 'text-red-600' },
                    ].map((k, index) => (
                        <div
                            key={k.label}
                            className="bg-white rounded-xl shadow-card hover:shadow-card-hover p-5 transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                            style={{ borderTop: `4px solid ${k.color}`, animationDelay: `${index * 80}ms` }}
                        >
                            <p className="text-[13px] text-gray-500 font-medium mb-1.5">{k.label}</p>
                            <p className={`text-3xl font-bold ${k.text}`}>{k.value}</p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="bg-white rounded-2xl shadow-card p-6 animate-fadeIn [animation-delay:200ms]">
                    {loading && <p className="text-center text-gray-500">Cargando...</p>}
                    {error && <p className="text-center text-red-600">{error}</p>}
                    {!loading && !error && data.length === 0 && (
                        <p className="text-center text-gray-500">Sin datos para el período seleccionado.</p>
                    )}
                    {!loading && !error && data.length > 0 && (
                        <ResponsiveContainer width="100%" height={380}>
                            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={<AxisTick data={data} rango={rango} />}
                                    interval={0}
                                    height={36}
                                />
                                <YAxis allowDecimals={false} domain={[0, 20]} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                {refLines.map(label => (
                                    <ReferenceLine key={label} x={label} stroke="#6B7280" strokeDasharray="5 3" strokeWidth={1.5} />
                                ))}
                                <Bar dataKey="asistencias" name="Asistencias" fill="#00A8E8" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="nuevos" name="Nuevos socios" fill="#16A34A" radius={[3, 3, 0, 0]} />
                                <Line dataKey="bajas" name="Bajas" stroke="#DC2626" strokeWidth={2} dot={false} type="monotone" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </AppShell>
    );
};

export default Estadisticas;
