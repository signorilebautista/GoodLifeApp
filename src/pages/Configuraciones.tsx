import React, { useCallback, useEffect, useId, useState } from 'react';
import { Eye, EyeOff, Sun, Moon, Lock, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import AppShell from '../components/AppShell';
import { useSettings, type FontSize } from '../context/SettingsContext';

interface ConfiguracionesProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
    currentUser: string;
}

const inputClass = 'w-full pl-10 pr-10 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150';
const labelClass = 'text-xs font-medium text-gray-600 block mb-1';

const PasswordField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete: string;
}> = ({ id, label, value, onChange, autoComplete }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className={labelClass}>{label}</label>
            <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    className={inputClass}
                    required
                />
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors duration-150"
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
};

const PillGroup: React.FC<{
    legend: string;
    options: { label: string; value: string }[];
    current: string;
    onChange: (v: string) => void;
}> = ({ legend, options, current, onChange }) => (
    <div role="radiogroup" aria-label={legend} className="flex gap-2 flex-wrap">
        {options.map(opt => (
            <button
                key={opt.value}
                role="radio"
                aria-checked={current === opt.value}
                onClick={() => onChange(opt.value)}
                className={`px-4 py-1.5 rounded-full border-2 text-[13px] font-medium transition-all duration-150 active:scale-95 ${current === opt.value ? 'bg-primary-500 border-primary-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'}`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; delay?: number }> = ({ title, children, delay = 0 }) => (
    <div className="bg-white rounded-2xl shadow-card p-6 mb-5 animate-fadeIn" style={{ animationDelay: `${delay}ms` }}>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2.5 border-b border-gray-100">{title}</h3>
        {children}
    </div>
);

interface Ejercicio {
    idEjercicio: number;
    nombre: string;
}

interface RegistroPeso {
    id: number;
    ejercicioId: number;
    peso: number;
    fecha: string;
}

function formatFecha(isoDate: string): string {
    const [y, m, d] = isoDate.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
}

const Configuraciones: React.FC<ConfiguracionesProps> = ({ onLogout, onNavigate, currentUser }) => {
    const { theme, fontSize, setTheme, setFontSize, changePassword } = useSettings();

    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passMsg, setPassMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const formId = useId();

    const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
    const [historialPorEj, setHistorialPorEj] = useState<Record<number, RegistroPeso[]>>({});
    const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});
    const [loadingProgreso, setLoadingProgreso] = useState(true);

    const fetchProgreso = useCallback(async () => {
        setLoadingProgreso(true);
        try {
            const [ejRes, pesosRes] = await Promise.all([
                fetch(`${API_URL}/ejercicios`),
                fetch(`${API_URL}/rutina/pesos-actuales?usuarioId=${encodeURIComponent(currentUser)}`),
            ]);
            const ejs: Ejercicio[] = ejRes.ok ? await ejRes.json() : [];
            const pesosActuales: Record<number, number> = pesosRes.ok ? await pesosRes.json() : {};

            const ejsConPeso = ejs.filter(e => pesosActuales[e.idEjercicio] !== undefined);
            setEjercicios(ejsConPeso);

            const historials: Record<number, RegistroPeso[]> = {};
            await Promise.all(
                ejsConPeso.map(async (ej) => {
                    const res = await fetch(
                        `${API_URL}/rutina/historial?usuarioId=${encodeURIComponent(currentUser)}&ejercicioId=${ej.idEjercicio}`,
                    );
                    historials[ej.idEjercicio] = res.ok ? await res.json() : [];
                }),
            );
            setHistorialPorEj(historials);
        } finally {
            setLoadingProgreso(false);
        }
    }, [currentUser]);

    useEffect(() => { fetchProgreso(); }, [fetchProgreso]);

    const toggleEj = (id: number) =>
        setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));

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

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/configuraciones">
            <div className="w-full max-w-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-5 animate-fadeIn">Configuraciones</h2>

                {/* Cambiar contraseña */}
                <Section title="Cambiar contraseña">
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5" aria-describedby={passMsg ? `${formId}-status` : undefined}>
                        <PasswordField id={`${formId}-old`} label="Contraseña actual" value={oldPass} onChange={setOldPass} autoComplete="current-password" />
                        <PasswordField id={`${formId}-new`} label="Nueva contraseña" value={newPass} onChange={setNewPass} autoComplete="new-password" />
                        <PasswordField id={`${formId}-confirm`} label="Confirmar nueva contraseña" value={confirmPass} onChange={setConfirmPass} autoComplete="new-password" />

                        <p id={`${formId}-status`} role="status" aria-live="polite" className={passMsg ? `text-[13px] px-3 py-2 rounded-lg ${passMsg.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50 animate-shake'}` : 'sr-only'}>
                            {passMsg?.text}
                        </p>

                        <button
                            type="submit"
                            className="py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white rounded-lg text-sm font-semibold shadow-sm transition-all duration-150 self-start px-6"
                        >
                            Actualizar contraseña
                        </button>
                    </form>
                </Section>

                {/* Apariencia */}
                <Section title="Apariencia" delay={80}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="m-0 font-medium text-sm text-gray-900">Modo de color</p>
                            <p className="mt-0.5 text-xs text-gray-500">Cambia entre tema claro y oscuro</p>
                        </div>
                        <button
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            aria-pressed={theme === 'dark'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-medium transition-colors duration-150 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                            {theme === 'dark' ? 'Oscuro' : 'Claro'}
                        </button>
                    </div>
                </Section>

                {/* Accesibilidad */}
                <Section title="Accesibilidad" delay={160}>
                    <div className="mb-5">
                        <p className="mb-2.5 font-medium text-sm text-gray-900">Tamaño de letra</p>
                        <PillGroup
                            legend="Tamaño de letra"
                            options={[{ label: 'Pequeño', value: 'small' }, { label: 'Mediano', value: 'medium' }, { label: 'Grande', value: 'large' }]}
                            current={fontSize}
                            onChange={v => setFontSize(v as FontSize)}
                        />
                    </div>
                </Section>

                {/* Tu Progreso */}
                <Section title="Tu Progreso" delay={240}>
                    {loadingProgreso && (
                        <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
                    )}
                    {!loadingProgreso && ejercicios.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">
                            Todavía no registraste ningún peso. Hacelo desde la sección{' '}
                            <button onClick={() => onNavigate('/rutina')} className="text-primary-600 font-medium hover:underline">
                                Entrenamiento
                            </button>.
                        </p>
                    )}
                    {!loadingProgreso && ejercicios.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {ejercicios.map(ej => {
                                const registros = historialPorEj[ej.idEjercicio] ?? [];
                                const abierto = expandidos[ej.idEjercicio];
                                const ultimo = registros[registros.length - 1];
                                return (
                                    <div key={ej.idEjercicio} className="border border-gray-100 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleEj(ej.idEjercicio)}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">{ej.nombre}</p>
                                                {ultimo && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Último: <span className="text-emerald-600 font-semibold">{String(ultimo.peso).replace('.', ',')} kg</span> · {formatFecha(ultimo.fecha)}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-gray-400 ml-3 shrink-0">
                                                {abierto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                            </span>
                                        </button>

                                        {abierto && (
                                            <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-1.5 bg-gray-50">
                                                {[...registros].reverse().map(r => (
                                                    <div key={r.id} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-1.5 text-gray-500">
                                                            <Calendar size={12} />
                                                            <span>{formatFecha(r.fecha)}</span>
                                                        </div>
                                                        <span className="text-emerald-600 font-bold">
                                                            {String(r.peso).replace('.', ',')} kg
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Section>
            </div>
        </AppShell>
    );
};

export default Configuraciones;
