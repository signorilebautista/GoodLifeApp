import React, { useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import logo from '../assets/logo.png';
import { appUsers } from '../utils/mockData';
import LoadingScreen from '../components/LoadingScreen';
import { prefetchMenuPrincipal } from '../utils/prefetch';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MIN_TRANSITION_MS = 900;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const REMEMBERED_USER_KEY = 'rememberedUser';
const REMEMBERED_PASS_KEY = 'rememberedPass';

interface LoginPageProps {
    onLogin: (username: string, mustChangePassword?: boolean, rememberMe?: boolean, role?: 'admin' | 'profesor') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [usuario, setUsuario] = useState(() => localStorage.getItem(REMEMBERED_USER_KEY) ?? '');
    const [password, setPassword] = useState(() => localStorage.getItem(REMEMBERED_PASS_KEY) ?? '');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(REMEMBERED_USER_KEY) !== null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [transitioning, setTransitioning] = useState(false);

    const completeLogin = async (username: string, mustChange?: boolean, role: 'admin' | 'profesor' = 'profesor') => {
        if (rememberMe) {
            localStorage.setItem(REMEMBERED_USER_KEY, username);
            localStorage.setItem(REMEMBERED_PASS_KEY, password);
        } else {
            localStorage.removeItem(REMEMBERED_USER_KEY);
            localStorage.removeItem(REMEMBERED_PASS_KEY);
        }
        setTransitioning(true);
        const tasks = [delay(MIN_TRANSITION_MS)];
        if (!mustChange) {
            tasks.push(prefetchMenuPrincipal());
        }
        await Promise.all(tasks);
        onLogin(username, mustChange, rememberMe, role);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Admin hardcodeado (sin email)
        const localUser = appUsers.find(u => u.username === usuario && u.password === password);
        if (localUser) {
            completeLogin(localUser.username, false, localUser.role === 'admin' ? 'admin' : 'profesor');
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
            completeLogin(data.mail, data.mustChangePassword, data.role ?? 'profesor');
        } catch {
            setError('Usuario o contraseña incorrectos.');
            setLoading(false);
        }
    };

    if (transitioning) {
        return <LoadingScreen />;
    }

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

            {/* Decorative glow blobs */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl animate-blobFloat" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-blobFloat [animation-delay:2s]" />

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center gap-3 mb-8 animate-fadeDown">
                    <div className="relative animate-popIn">
                        <div className="absolute inset-0 rounded-full bg-primary-300/50 blur-xl animate-glowPulse" />
                        <img
                            src={logo}
                            alt="Good Life Center"
                            className="relative h-20 w-20 rounded-full shadow-lg ring-4 ring-white/30 animate-logoFloat hover:scale-110 transition-transform duration-300"
                        />
                    </div>
                    <h1 className="text-white text-2xl font-bold tracking-wide text-center drop-shadow-md">
                        GOOD LIFE CENTER
                    </h1>
                    <p className="text-white/70 text-sm">Iniciá sesión para continuar</p>
                </div>

                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40 animate-fadeIn [animation-delay:150ms]">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative animate-fadeIn [animation-delay:250ms] group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors duration-200 group-focus-within:text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Usuario o email"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white text-gray-700 transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                required
                            />
                        </div>

                        <div className="relative animate-fadeIn [animation-delay:325ms] group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors duration-200 group-focus-within:text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-12V7a4 4 0 10-8 0v4h8z" />
                                </svg>
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-11 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white text-gray-700 transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-primary hover:scale-110 active:scale-95 transition-all duration-150"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none animate-fadeIn [animation-delay:360ms] w-fit">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary cursor-pointer accent-[#00A8E8]"
                            />
                            <span className="text-sm text-gray-600">Recordarme</span>
                        </label>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-accent-red text-sm rounded-lg px-3 py-2 animate-shake">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-primary-600 text-white py-3 rounded-xl font-semibold text-base hover:brightness-110 hover:shadow-xl active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary-500/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 animate-fadeIn [animation-delay:400ms]"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    VERIFICANDO...
                                </>
                            ) : (
                                'INGRESAR'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
