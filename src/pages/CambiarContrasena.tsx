import React, { useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import logo from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CambiarContrasenaProps {
    mail: string;
    onSuccess: () => void;
}

const CambiarContrasena: React.FC<CambiarContrasenaProps> = ({ mail, onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen flex flex-col">
            <header className="bg-[#00A8E8] h-20 flex items-center justify-center px-6">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="Good Life Center" className="h-16 w-16" />
                    <h1 className="text-white text-2xl font-bold tracking-wider">GOOD LIFE CENTER</h1>
                </div>
            </header>

            <div
                className="flex-1 flex items-center justify-center p-4 relative"
                style={{ backgroundImage: `url(${backgroundImg})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
            >
                <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Cambiar contraseña</h2>
                        <p className="text-sm text-gray-500 mb-6 text-center">
                            Es tu primer ingreso. Por favor configurá una contraseña nueva.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Contraseña temporal (recibida por mail)"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A8E8] text-gray-700"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A8E8] text-gray-700"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Confirmar nueva contraseña"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A8E8] text-gray-700"
                                required
                            />
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#00A8E8] text-white py-3 rounded font-semibold text-base hover:bg-[#0086BA] transition-colors duration-200 shadow-md disabled:opacity-60"
                            >
                                {loading ? 'GUARDANDO...' : 'GUARDAR Y CONTINUAR'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CambiarContrasena;
