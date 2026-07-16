import React, { useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import logo from '../assets/logo.png';
import { appUsers } from '../utils/mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface LoginPageProps {
    onLogin: (username: string, mustChangePassword?: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Admin hardcodeado (sin email)
        const localUser = appUsers.find(u => u.username === usuario && u.password === password);
        if (localUser) {
            onLogin(localUser.username, false);
            return;
        }

        // Profesores: login vía API con email
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mail: usuario, password }),
            });
            if (!res.ok) throw new Error('Credenciales incorrectas');
            const data = await res.json();
            onLogin(data.mail, data.mustChangePassword);
        } catch {
            setError('Usuario o contraseña incorrectos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-[#00A8E8] h-20 flex items-center justify-center px-6">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="Good Life Center" className="h-16 w-16" />
                    <h1 className="text-white text-2xl font-bold tracking-wider">
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            <div
                className="flex-1 flex items-center justify-center p-4 relative"
                style={{
                    backgroundImage: `url(${backgroundImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                }}
            >
                <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />

                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Usuario o email"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:border-transparent text-gray-700"
                                    required
                                />
                            </div>

                            <div>
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:border-transparent text-gray-700"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#00A8E8] text-white py-3 rounded font-semibold text-base hover:bg-[#0086BA] transition-colors duration-200 shadow-md disabled:opacity-60"
                            >
                                {loading ? 'VERIFICANDO...' : 'INGRESAR'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
