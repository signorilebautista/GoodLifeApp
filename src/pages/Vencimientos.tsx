import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, CreditCard, XCircle, DollarSign, Search } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface VencimientosProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface SocioVencimiento {
    dni: string;
    nombre: string;
    apellido: string;
    plan: string | null;
    precioPlan: number | null;
    deuda: number | null;
    fechaUltimoPago: string | null;
    ultimoMonto: number | null;
    proximoPago: string | null;
    estado: 'ok' | 'proximo' | 'vencido' | 'sinFecha';
}

interface Pago {
    idPago: number;
    fechaPago: string;
    monto: number;
    diasVigencia: number;
}

type Filtro = 'todos' | 'proximo' | 'vencido' | 'sinFecha';

const estadoConfig = {
    ok:       { label: 'Al día',       color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle },
    proximo:  { label: 'Próximo',      color: 'text-amber-600 bg-amber-50',    icon: Clock },
    vencido:  { label: 'Vencido',      color: 'text-red-600 bg-red-50',        icon: XCircle },
    sinFecha: { label: 'Sin registro', color: 'text-gray-500 bg-gray-100',     icon: AlertTriangle },
};

const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;
const fmtFecha = (iso: string | null) => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
};
const fmtFechaHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const Vencimientos: React.FC<VencimientosProps> = ({ onLogout, onNavigate }) => {
    const [socios, setSocios] = useState<SocioVencimiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<Filtro>('todos');

    // Modal pagos rápidos
    const [pagosOpen, setPagosOpen] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const [socioEncontrado, setSocioEncontrado] = useState<SocioVencimiento | null>(null);
    const [modoPago, setModoPago] = useState<'deuda' | 'membresia'>('membresia');
    const [montoPagos, setMontoPagos] = useState('');
    const [diasPagos, setDiasPagos] = useState('30');
    const [registrandoPago, setRegistrandoPago] = useState(false);
    const [resultadoPagos, setResultadoPagos] = useState<{ ok: boolean; nuevaDeuda: number } | null>(null);
    const busquedaRef = useRef<HTMLInputElement>(null);

    // Modal pago
    const [pagoModal, setPagoModal] = useState<SocioVencimiento | null>(null);
    const [modoModal, setModoModal] = useState<'deuda' | 'membresia'>('membresia');
    const [montoInput, setMontoInput] = useState('');
    const [diasInput, setDiasInput] = useState('30');
    const [pagando, setPagando] = useState(false);
    const [pagoResult, setPagoResult] = useState<{ ok: boolean; mensaje: string; nuevaDeuda: number } | null>(null);

    // Historial de pagos por socio (expandible)
    const [historialDni, setHistorialDni] = useState<string | null>(null);
    const [historial, setHistorial] = useState<Pago[]>([]);
    const [historialLoading, setHistorialLoading] = useState(false);

    const abrirPagos = () => {
        setPagosOpen(true);
        setBusqueda('');
        setMostrarDropdown(false);
        setSocioEncontrado(null);
        setModoPago('membresia');
        setMontoPagos('');
        setDiasPagos('30');
        setResultadoPagos(null);
        setTimeout(() => busquedaRef.current?.focus(), 80);
    };

    const cerrarPagos = () => {
        setPagosOpen(false);
        setSocioEncontrado(null);
        setResultadoPagos(null);
        setMostrarDropdown(false);
    };

    const seleccionarSocio = (s: SocioVencimiento) => {
        setSocioEncontrado(s);
        setBusqueda(`${s.apellido}, ${s.nombre} — DNI ${s.dni}`);
        setMostrarDropdown(false);
        setModoPago('membresia');
        setMontoPagos('');
        setDiasPagos('30');
        setResultadoPagos(null);
    };

    const confirmarPagoRapido = async () => {
        if (!socioEncontrado) return;
        setRegistrandoPago(true);
        try {
            const res = await fetch(`${API_URL}/socios/${socioEncontrado.dni}/pago`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monto: Number(montoPagos) || 0,
                    diasVigencia: Number(diasPagos) || 30,
                    soloDeuda: modoPago === 'deuda',
                }),
            });
            const data = await res.json();
            setResultadoPagos(data.ok ? { ok: true, nuevaDeuda: data.nuevaDeuda } : { ok: false, nuevaDeuda: 0 });
            if (data.ok) cargar();
        } catch {
            setResultadoPagos({ ok: false, nuevaDeuda: 0 });
        } finally {
            setRegistrandoPago(false);
        }
    };

    const montoPagosNum = Number(montoPagos) || 0;
    const deudaActualRapido = socioEncontrado?.deuda ?? 0;
    const precioRapido = socioEncontrado?.precioPlan ?? 0;
    const previewDeudaRapido = modoPago === 'deuda'
        ? deudaActualRapido + montoPagosNum
        : deudaActualRapido + montoPagosNum - precioRapido;

    const sugerencias: SocioVencimiento[] = (() => {
        const q = busqueda.trim().toLowerCase();
        if (!q || socioEncontrado || !mostrarDropdown) return [];
        return socios.filter(s =>
            String(s.dni).includes(q) ||
            s.nombre.toLowerCase().includes(q) ||
            s.apellido.toLowerCase().includes(q) ||
            `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) ||
            `${s.apellido} ${s.nombre}`.toLowerCase().includes(q)
        ).slice(0, 8);
    })();

    const mensajeDeuda = (deuda: number) => {
        if (deuda < 0) return { texto: `Falta pagar ${fmt(Math.abs(deuda))}`, color: 'bg-red-50 text-red-700' };
        if (deuda === 0) return { texto: 'Deuda pagada', color: 'bg-emerald-50 text-emerald-700' };
        return { texto: `Deuda pagada y tiene a favor ${fmt(deuda)}`, color: 'bg-emerald-50 text-emerald-700' };
    };

    const cargar = useCallback(() => {
        setLoading(true);
        fetch(`${API_URL}/socios/vencimientos`)
            .then(r => r.ok ? r.json() : [])
            .then(setSocios)
            .catch(() => setSocios([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const abrirModal = (s: SocioVencimiento) => {
        setPagoModal(s);
        setModoModal('membresia');
        setMontoInput('');
        setDiasInput('30');
        setPagoResult(null);
    };

    const confirmarPago = async () => {
        if (!pagoModal) return;
        setPagando(true);
        setPagoResult(null);
        try {
            const res = await fetch(`${API_URL}/socios/${pagoModal.dni}/pago`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monto: Number(montoInput) || 0, diasVigencia: Number(diasInput) || 30, soloDeuda: modoModal === 'deuda' }),
            });
            const data = await res.json();
            setPagoResult(data);
            if (data.ok) cargar();
        } catch {
            setPagoResult({ ok: false, mensaje: 'Error al registrar el pago.', nuevaDeuda: 0 });
        } finally {
            setPagando(false);
        }
    };

    const toggleHistorial = async (dni: string) => {
        if (historialDni === dni) { setHistorialDni(null); return; }
        setHistorialDni(dni);
        setHistorial([]);
        setHistorialLoading(true);
        try {
            const res = await fetch(`${API_URL}/socios/${dni}/pagos`);
            setHistorial(res.ok ? await res.json() : []);
        } finally {
            setHistorialLoading(false);
        }
    };

    // Cálculo en tiempo real del modal
    const monto = Number(montoInput) || 0;
    const deudaActual = pagoModal?.deuda ?? 0;
    const precio = pagoModal?.precioPlan ?? 0;
    const resultadoDeuda = modoModal === 'deuda' ? deudaActual + monto : deudaActual + monto - precio;

    const filtrados = filtro === 'todos' ? socios : socios.filter(s => s.estado === filtro);
    const counts = {
        proximo:  socios.filter(s => s.estado === 'proximo').length,
        vencido:  socios.filter(s => s.estado === 'vencido').length,
        sinFecha: socios.filter(s => s.estado === 'sinFecha').length,
    };

    const filtros: { key: Filtro; label: string; count: number; color: string }[] = [
        { key: 'todos',    label: 'Todos',               count: socios.length,     color: 'text-gray-700 bg-gray-100 hover:bg-gray-200' },
        { key: 'vencido',  label: 'Vencidos',            count: counts.vencido,    color: 'text-red-600 bg-red-50 hover:bg-red-100' },
        { key: 'proximo',  label: 'Próximos (≤7 días)',  count: counts.proximo,    color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
        { key: 'sinFecha', label: 'Sin registro',        count: counts.sinFecha,   color: 'text-gray-500 bg-gray-100 hover:bg-gray-200' },
    ];

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/vencimientos">
            <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-800">Vencimientos de Cuotas</h2>
                    <button
                        onClick={abrirPagos}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow hover:bg-emerald-700 transition-colors duration-150"
                    >
                        <DollarSign size={16} />
                        Pagos
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                    {filtros.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFiltro(f.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${filtro === f.key ? f.color + ' ring-2 ring-offset-1 ring-current' : f.color}`}
                        >
                            {f.label} ({f.count})
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400 text-sm">Cargando...</div>
                    ) : filtrados.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">Sin resultados.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                                    <th className="text-left px-5 py-3 font-semibold">Socio</th>
                                    <th className="text-left px-4 py-3 font-semibold">Plan / Precio</th>
                                    <th className="text-left px-4 py-3 font-semibold">Deuda</th>
                                    <th className="text-left px-4 py-3 font-semibold">Último pago</th>
                                    <th className="text-left px-4 py-3 font-semibold">Próximo pago</th>
                                    <th className="text-left px-4 py-3 font-semibold">Estado</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((s, i) => {
                                    const cfg = estadoConfig[s.estado];
                                    const Icon = cfg.icon;
                                    const isOpen = historialDni === s.dni;
                                    return (
                                        <React.Fragment key={s.dni}>
                                            <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors duration-100 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                                                <td className="px-5 py-3">
                                                    <p className="font-semibold text-gray-800">{s.apellido}, {s.nombre}</p>
                                                    <p className="text-gray-400 text-xs">DNI {s.dni}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-gray-700">{s.plan ?? '—'}</p>
                                                    {s.precioPlan != null && (
                                                        <p className="text-xs text-gray-400">{fmt(s.precioPlan)}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {s.deuda != null ? (
                                                        <span className={`text-sm font-medium ${s.deuda < 0 ? 'text-red-600' : s.deuda > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                            {s.deuda < 0 ? `−${fmt(Math.abs(s.deuda))}` : s.deuda > 0 ? `+${fmt(s.deuda)}` : '$0'}
                                                        </span>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-gray-600">{fmtFecha(s.fechaUltimoPago)}</p>
                                                    {s.ultimoMonto != null && (
                                                        <p className="text-xs text-gray-400">{fmt(s.ultimoMonto)}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-700">{fmtFecha(s.proximoPago)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                                                        <Icon size={12} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={() => toggleHistorial(s.dni)}
                                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                                            title="Ver historial"
                                                        >
                                                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => abrirModal(s)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 text-xs font-medium transition-colors duration-150"
                                                        >
                                                            <CreditCard size={12} />
                                                            Registrar pago
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Historial expandible */}
                                            {isOpen && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={7} className="px-10 py-3">
                                                        {historialLoading ? (
                                                            <p className="text-xs text-gray-400">Cargando historial...</p>
                                                        ) : historial.length === 0 ? (
                                                            <p className="text-xs text-gray-400">Sin pagos registrados.</p>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-xs font-semibold text-gray-500 mb-1">Historial de pagos</p>
                                                                {historial.map(p => (
                                                                    <div key={p.idPago} className="flex items-center gap-4 text-xs text-gray-600">
                                                                        <span className="w-36 text-gray-500">{fmtFechaHora(p.fechaPago)}</span>
                                                                        <span className="font-semibold text-gray-800">{fmt(p.monto)}</span>
                                                                        <span className="text-gray-400">{p.diasVigencia} días</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal pagos rápidos por DNI */}
            {pagosOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-[420px] animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-50">
                                <DollarSign size={18} className="text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">Registrar Pago</h3>
                        </div>

                        {/* Búsqueda por nombre, apellido o DNI */}
                        {!resultadoPagos && (
                            <div className="relative mb-4">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Buscar socio (nombre, apellido o DNI)</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        ref={busquedaRef}
                                        type="text"
                                        value={busqueda}
                                        onChange={e => {
                                            setBusqueda(e.target.value);
                                            setSocioEncontrado(null);
                                            setResultadoPagos(null);
                                            setMostrarDropdown(true);
                                        }}
                                        onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                                        placeholder="Ej: González, Juan o 12345678"
                                        className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                    />
                                </div>
                                {sugerencias.length > 0 && (
                                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                        {sugerencias.map(s => (
                                            <li key={s.dni}>
                                                <button
                                                    onMouseDown={e => { e.preventDefault(); seleccionarSocio(s); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-3"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{s.apellido}, {s.nombre}</p>
                                                        <p className="text-xs text-gray-400">DNI {s.dni}</p>
                                                    </div>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.deuda != null && s.deuda < 0 ? 'bg-red-50 text-red-600' : s.deuda != null && s.deuda > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {s.deuda != null ? (s.deuda < 0 ? `−${fmt(Math.abs(s.deuda))}` : s.deuda > 0 ? `+${fmt(s.deuda)}` : '$0') : '—'}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Socio encontrado - formulario de pago */}
                        {socioEncontrado && !resultadoPagos && (
                            <>
                                {/* Info del socio */}
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                                    <p className="font-semibold text-gray-800">{socioEncontrado.apellido}, {socioEncontrado.nombre}</p>
                                    <p className="text-gray-400 text-xs mb-2">DNI {socioEncontrado.dni}</p>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">Plan</span>
                                        <span className="font-medium">{socioEncontrado.plan ?? '—'}{socioEncontrado.precioPlan != null ? ` · ${fmt(socioEncontrado.precioPlan)}` : ''}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-500">Deuda actual</span>
                                        <span className={`font-semibold ${deudaActualRapido < 0 ? 'text-red-600' : deudaActualRapido > 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                                            {deudaActualRapido < 0 ? `−${fmt(Math.abs(deudaActualRapido))}` : deudaActualRapido > 0 ? `+${fmt(deudaActualRapido)}` : '$0'}
                                        </span>
                                    </div>
                                </div>

                                {/* Selector de modo */}
                                <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
                                    <button
                                        onClick={() => { setModoPago('deuda'); setMontoPagos(deudaActualRapido < 0 ? String(Math.abs(deudaActualRapido)) : ''); }}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors ${modoPago === 'deuda' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        Solo deuda
                                    </button>
                                    <button
                                        onClick={() => { setModoPago('membresia'); setMontoPagos(''); }}
                                        className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${modoPago === 'membresia' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        Deuda + membresía
                                    </button>
                                </div>

                                {/* Campos de pago */}
                                <div className="flex gap-3 mb-3">
                                    <div className={modoPago === 'deuda' ? 'w-full' : 'flex-1'}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Monto recibido ($)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={montoPagos}
                                            onChange={e => setMontoPagos(e.target.value)}
                                            placeholder="0"
                                            autoFocus
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                        />
                                    </div>
                                    {modoPago === 'membresia' && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Días de vigencia</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={diasPagos}
                                                onChange={e => setDiasPagos(e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Preview resultado */}
                                {montoPagosNum > 0 && (
                                    <div className={`rounded-xl p-3 mb-4 text-sm font-medium ${mensajeDeuda(previewDeudaRapido).color}`}>
                                        {mensajeDeuda(previewDeudaRapido).texto}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Resultado tras confirmar */}
                        {resultadoPagos && (
                            <div className={`rounded-xl p-4 mb-4 text-sm font-medium text-center ${resultadoPagos.ok ? mensajeDeuda(resultadoPagos.nuevaDeuda).color : 'bg-red-50 text-red-700'}`}>
                                {resultadoPagos.ok
                                    ? mensajeDeuda(resultadoPagos.nuevaDeuda).texto
                                    : 'Error al registrar el pago. Intentá de nuevo.'}
                            </div>
                        )}

                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={cerrarPagos}
                                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                {resultadoPagos ? 'Cerrar' : 'Cancelar'}
                            </button>
                            {socioEncontrado && !resultadoPagos && (
                                <button
                                    onClick={confirmarPagoRapido}
                                    disabled={registrandoPago || montoPagosNum <= 0}
                                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {registrandoPago ? 'Registrando...' : 'Confirmar pago'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal registrar pago */}
            {pagoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-96 animate-fadeIn">
                        <h3 className="font-bold text-gray-800 mb-1">Registrar pago</h3>
                        <p className="text-sm text-gray-500 mb-4">{pagoModal.apellido}, {pagoModal.nombre} · DNI {pagoModal.dni}</p>

                        {/* Info */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-4 flex flex-col gap-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Membresía</span>
                                <span className="font-medium">{pagoModal.plan ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Precio membresía</span>
                                <span className="font-medium">{pagoModal.precioPlan != null ? fmt(pagoModal.precioPlan) : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Deuda actual</span>
                                <span className={`font-semibold ${deudaActual < 0 ? 'text-red-600' : deudaActual > 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                    {deudaActual < 0 ? `−${fmt(Math.abs(deudaActual))}` : deudaActual > 0 ? `+${fmt(deudaActual)}` : '$0'}
                                </span>
                            </div>
                        </div>

                        {/* Selector de modo */}
                        {!pagoResult && (
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
                                <button
                                    onClick={() => { setModoModal('deuda'); setMontoInput(deudaActual < 0 ? String(Math.abs(deudaActual)) : ''); }}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${modoModal === 'deuda' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Solo deuda
                                </button>
                                <button
                                    onClick={() => { setModoModal('membresia'); setMontoInput(''); }}
                                    className={`flex-1 py-2 text-sm font-medium border-l border-gray-200 transition-colors ${modoModal === 'membresia' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Deuda + membresía
                                </button>
                            </div>
                        )}

                        {!pagoResult ? (
                            <>
                                <div className="flex gap-3 mb-3">
                                    <div className={modoModal === 'deuda' ? 'w-full' : 'flex-1'}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Monto recibido ($)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={montoInput}
                                            onChange={e => setMontoInput(e.target.value)}
                                            placeholder="0"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                                        />
                                    </div>
                                    {modoModal === 'membresia' && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Días de vigencia</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={diasInput}
                                                onChange={e => setDiasInput(e.target.value)}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                                            />
                                        </div>
                                    )}
                                </div>

                                {monto > 0 && (
                                    <div className={`rounded-xl p-3 mb-4 text-sm font-medium ${mensajeDeuda(resultadoDeuda).color}`}>
                                        {mensajeDeuda(resultadoDeuda).texto}
                                    </div>
                                )}
                            </>
                        ) : null}

                        {/* Resultado post-confirmación */}
                        {pagoResult && (
                            <div className={`rounded-xl p-3 mb-4 text-sm ${pagoResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {pagoResult.ok ? mensajeDeuda(pagoResult.nuevaDeuda).texto : pagoResult.mensaje}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setPagoModal(null); setPagoResult(null); }}
                                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                {pagoResult ? 'Cerrar' : 'Cancelar'}
                            </button>
                            {!pagoResult && (
                                <button
                                    onClick={confirmarPago}
                                    disabled={pagando || monto <= 0}
                                    className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                                >
                                    {pagando ? 'Registrando...' : 'Confirmar'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Vencimientos;
