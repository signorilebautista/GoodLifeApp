import React, { useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, UserPlus, LogIn, GraduationCap, Home, Menu, X, CreditCard } from 'lucide-react';
import logo from '../assets/logo.png';

interface AppShellProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
    activePath: string;
    children: React.ReactNode;
    rightPanel?: React.ReactNode;
}

const allMenuItems = [
    { icon: Home, label: 'Menú', path: '/menu-principal', adminOnly: false },
    { icon: Users, label: 'Socios', path: '/socios', adminOnly: false },
    { icon: FileText, label: 'Planes', path: '/planes', adminOnly: false },
    { icon: CreditCard, label: 'Gestión de Pagos y Venc.', path: '/vencimientos', adminOnly: false },
    { icon: Calendar, label: 'Turnero', path: '/turnero', adminOnly: false },
    { icon: LogIn, label: 'Ingreso', path: '/ingreso', adminOnly: false },
    { icon: BarChart3, label: 'Estadísticas', path: '/estadisticas', adminOnly: false },
    { icon: GraduationCap, label: 'Profesores', path: '/profesores', adminOnly: false },
    { icon: UserPlus, label: 'Agregar', path: '/crear-cuenta', adminOnly: true },
    { icon: Settings, label: 'Configuraciones', path: '/configuraciones', adminOnly: false },
];

function getRole(): 'admin' | 'profesor' {
    return ((localStorage.getItem('userRole') ?? sessionStorage.getItem('userRole')) as 'admin' | 'profesor') ?? 'profesor';
}

const AppShell: React.FC<AppShellProps> = ({ onLogout, onNavigate, activePath, children, rightPanel }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const role = getRole();
    const menuItems = allMenuItems.filter(item => !item.adminOnly || role === 'admin');

    return (
        <div className="min-h-screen relative app-bg">
            {/* Floating header */}
            <header className="fixed top-4 left-4 right-4 z-30 h-16 flex items-center gap-3 px-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-float border border-white/60">
                <button
                    onClick={() => setSidebarOpen(v => !v)}
                    className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-primary-50 hover:text-primary-600 active:scale-90 transition-all duration-150"
                    aria-label={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div className="flex items-center gap-3">
                    <img src={logo} alt="Good Life Center" className="h-10 w-10 rounded-full ring-2 ring-primary-300/60 shadow" />
                    <h1 className="text-primary-700 text-xl font-bold tracking-wide">
                        GOOD LIFE CENTER
                    </h1>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-24 bottom-4 left-4 z-20 w-56 bg-white flex flex-col rounded-2xl shadow-float border border-gray-100 overflow-hidden
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 pointer-events-none'}`}
            >
                <nav className="flex-1 py-3 overflow-y-auto">
                    {menuItems.map((item, index) => {
                        const isActive = item.path === activePath;
                        return (
                            <button
                                key={index}
                                onClick={() => !isActive && onNavigate(item.path)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`group w-full flex items-center gap-3 px-5 py-3 text-left text-[15px] transition-colors duration-150 relative
                                    ${isActive ? 'text-primary-600 bg-primary-50 font-semibold' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/60'}`}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary-500" />
                                )}
                                <item.icon size={19} className="transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-gray-200">
                    {!confirmLogout ? (
                        <button
                            onClick={() => setConfirmLogout(true)}
                            className="w-full flex items-center gap-3 px-5 py-4 text-gray-600 hover:text-accent-red hover:bg-red-50 transition-colors duration-150 text-[15px]"
                        >
                            <LogOut size={19} />
                            <span>Cerrar Sesión</span>
                        </button>
                    ) : (
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <p className="text-xs font-semibold text-gray-700 text-center">¿Cerrar sesión?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setConfirmLogout(false)}
                                    className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                                >
                                    Salir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`pt-24 pb-6 pr-6 min-h-screen flex items-start gap-6 transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'pl-64' : 'pl-6'}`}
            >
                <div className="flex-1 flex flex-col items-center overflow-y-auto min-w-0">
                    {children}
                </div>

                {rightPanel && (
                    <aside className="w-64 shrink-0 bg-white rounded-2xl shadow-card sticky top-24 overflow-y-auto animate-fadeIn [animation-delay:150ms]">
                        {rightPanel}
                    </aside>
                )}
            </main>
        </div>
    );
};

export default AppShell;
