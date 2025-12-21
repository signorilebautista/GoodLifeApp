import React, { useState } from 'react';
import backgroundImg from '../assets/background.jpg';
import logo from '../assets/logo.png';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-[#00A8E8] h-20 flex items-center justify-center px-6">
                <div className="flex items-center gap-4">
                    <img src={logo} alt="Good Life Center" className="h-16 w-16" />
                    <h1 className="text-white text-2xl font-bold tracking-wider">
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <div
                className="flex-1 flex items-center justify-center p-4 relative"
                style={{
                    backgroundImage: `url(${backgroundImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                }}
            >
                {/* Blur Overlay */}
                <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />

                {/* Login Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:border-transparent text-gray-700"
                                    required
                                />
                            </div>

                            {/* Contraseña */}
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

                            {/* Forgot Password */}
                            <div className="text-left">
                                <a href="#" className="text-sm text-[#00A8E8] hover:underline">
                                    ¿Olvidó su contraseña?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-[#00A8E8] text-white py-3 rounded font-semibold text-base hover:bg-[#0086BA] transition-colors duration-200 shadow-md"
                            >
                                INGRESAR
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
