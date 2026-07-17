import React, { useId, useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import logo from '../assets/logo.png';
import { Lock, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CambiarContrasenaProps {
    mail: string;
    onSuccess: () => void;
}

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
            <label htmlFor={id} className="sr-only">{label}</label>
            <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    placeholder={label}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 bg-gray-50 rounded-xl outline-none text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white transition-all duration-150"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors duration-150"
                >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
        </div>
    );
};

const CambiarContrasena: React.FC<CambiarContrasenaProps> = ({ mail, onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const formId = useId();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirm) {
            setError('Las contraseñas nuevas no coinciden.');
            return;
        }
        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mail, currentPassword, newPassword }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message ?? 'Error al cambiar contraseña');
            }
            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                backgroundImage: `url(${backgroundImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/70 to-black/70 backdrop-blur-[2px]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl animate-blobFloat" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-blobFloat [animation-delay:2s]" />

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center gap-3 mb-8 animate-fadeDown">
                    <div className="relative animate-popIn">
                        <div className="absolute inset-0 rounded-full bg-primary-300/50 blur-xl animate-glowPulse" />
                        <img
                            src={logo}
                            alt="Good Life Center"
                            className="relative h-20 w-20 rounded-full shadow-lg ring-4 ring-white/30 animate-logoFloat"
                        />
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-wide text-center drop-shadow-md">
                        GOOD LIFE CENTER
                    </h1>
                </div>

                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40 animate-fadeIn">
                    <h2 id={`${formId}-title`} className="text-xl font-bold text-gray-800 mb-2 text-center">Cambiar contraseña</h2>
                    <p className="text-sm text-gray-500 mb-6 text-center">
                        Es tu primer ingreso. Por favor configurá una contraseña nueva.
                    </p>
                    <form onSubmit={handleSubmit} aria-labelledby={`${formId}-title`} className="flex flex-col gap-4">
                        <PasswordField
                            id={`${formId}-current`}
                            label="Contraseña temporal (recibida por mail)"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            autoComplete="current-password"
                        />
                        <PasswordField
                            id={`${formId}-new`}
                            label="Nueva contraseña"
                            value={newPassword}
                            onChange={setNewPassword}
                            autoComplete="new-password"
                        />
                        <PasswordField
                            id={`${formId}-confirm`}
                            label="Confirmar nueva contraseña"
                            value={confirm}
                            onChange={setConfirm}
                            autoComplete="new-password"
                        />

                        <p role="status" aria-live="polite" className={error ? 'flex items-center gap-2 bg-red-50 border border-red-100 text-accent-red text-sm rounded-lg px-3 py-2 animate-shake' : 'sr-only'}>
                            {error}
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-primary-600 text-white py-3 rounded-xl font-semibold text-base hover:brightness-110 hover:shadow-xl active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'GUARDANDO...' : 'GUARDAR Y CONTINUAR'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CambiarContrasena;
