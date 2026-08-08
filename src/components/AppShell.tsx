import React, { useState } from 'react';
import { Users, Calendar, FileText, BarChart3, Settings, LogOut, UserPlus, LogIn, GraduationCap, Home, Menu, X, CreditCard, ClipboardList, MessageSquare, Copy } from 'lucide-react';
import logo from '../assets/logo.png';

interface AppShellProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
    activePath: string;
    children: React.ReactNode;
    rightPanel?: React.ReactNode;
}

interface MenuItem {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    path: string;
    adminOnly: boolean;
}

interface MenuGroup {
    label: string | null;
    items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
    {
        label: null,
        items: [
            { icon: Home, label: 'Menú', path: '/menu-principal', adminOnly: false },
        ],
    },
    {
        label: 'Gestión',
        items: [
            { icon: Users, label: 'Socios', path: '/socios', adminOnly: false },
            { icon: ClipboardList, label: 'Exámenes', path: '/examenes', adminOnly: false },
            { icon: MessageSquare, label: 'Comentarios', path: '/comentarios', adminOnly: false },
            { icon: FileText, label: 'Planes', path: '/planes', adminOnly: false },
            { icon: Copy, label: 'Plantillas', path: '/plantillas', adminOnly: false },
            { icon: CreditCard, label: 'Gestión de Pagos y Venc.', path: '/vencimientos', adminOnly: false },
        ],
    },
    {
        label: 'Actividad',
        items: [
            { icon: Calendar, label: 'Turnero', path: '/turnero', adminOnly: false },
            { icon: LogIn, label: 'Ingreso', path: '/ingreso', adminOnly: false },
            { icon: BarChart3, label: 'Estadísticas', path: '/estadisticas', adminOnly: false },
        ],
    },
    {
        label: 'Equipo',
        items: [
            { icon: GraduationCap, label: 'Profesores', path: '/profesores', adminOnly: false },
            { icon: UserPlus, label: 'Agregar', path: '/crear-cuenta', adminOnly: true },
        ],
    },
    {
        label: 'Cuenta',
        items: [
            { icon: Settings, label: 'Configuraciones', path: '/configuraciones', adminOnly: false },
        ],
    },
];

function getRole(): 'admin' | 'profesor' {
    return ((localStorage.getItem('userRole') ?? sessionStorage.getItem('userRole')) as 'admin' | 'profesor') ?? 'profesor';
}

const AppShell: React.FC<AppShellProps> = ({ onLogout, onNavigate, activePath, children, rightPanel }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const role = getRole();
    const visibleGroups = menuGroups
        .map(group => ({ ...group, items: group.items.filter(item => !item.adminOnly || role === 'admin') }))
        .filter(group => group.items.length > 0);

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
                className={`fixed top-24 bottom-4 left-4 z-20 w-60 bg-white flex flex-col rounded-2xl shadow-float border border-gray-100 overflow-hidden
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 pointer-events-none'}`}
            >
                {/* Role badge */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100 shrink-0">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {role === 'admin' ? 'A' : 'P'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">
                            {role === 'admin' ? 'Administrador' : 'Profesor'}
                        </p>
                        <p className="text-[10.5px] text-gray-400 leading-tight">Panel de gestión</p>
                    </div>
                </div>

                <nav className="sidebar-scroll flex-1 py-2 overflow-y-auto overflow-x-hidden">
                    {visibleGroups.map((group, gi) => (
                        <div key={gi}>
                            {group.label && (
                                <p className="px-4 pt-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    {group.label}
                                </p>
                            )}
                            {group.items.map((item) => {
                                const isActive = item.path === activePath;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => !isActive && onNavigate(item.path)}
                                        aria-current={isActive ? 'page' : undefined}
                                        title={item.label}
                                        className={`group w-full flex items-center gap-2.5 mx-2 my-0.5 px-2.5 py-2 rounded-xl text-left text-[13.5px] transition-all duration-150
                                            ${isActive
                                                ? 'bg-primary-500 text-white font-semibold shadow-sm shadow-primary-500/40'
                                                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'}`}
                                    >
                                        <span
                                            className={`flex items-center justify-center h-7 w-7 shrink-0 rounded-lg transition-colors duration-150
                                                ${isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}
                                        >
                                            <item.icon size={15} />
                                        </span>
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="border-t border-gray-100 shrink-0">
                    {!confirmLogout ? (
                        <button
                            onClick={() => setConfirmLogout(true)}
                            className="group w-full flex items-center gap-2.5 mx-2 my-2 px-2.5 py-2 rounded-xl text-gray-600 hover:bg-red-50 hover:text-accent-red transition-colors duration-150 text-[13.5px]"
                        >
                            <span className="flex items-center justify-center h-7 w-7 shrink-0 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-accent-red transition-colors duration-150">
                                <LogOut size={15} />
                            </span>
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
                className="pt-24 pb-6 pr-6 min-h-screen flex items-start gap-6 transition-all duration-300 ease-in-out"
                style={{ paddingLeft: sidebarOpen ? '17.5rem' : '1.5rem' }}
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
