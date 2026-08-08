import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import AppShell from '../components/AppShell';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ComentariosProps {
    onLogout: () => void;
    onNavigate: (path: string) => void;
}

interface ComentarioSocio {
    id: number;
    dniSocio: string;
    texto: string;
    createdAt: string;
    leido: boolean;
    leidoEn: string | null;
    nombreSocio: string | null;
    apellidoSocio: string | null;
}

type Filtro = 'noLeidos' | 'todos';

const fmtFechaHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const Comentarios: React.FC<ComentariosProps> = ({ onLogout, onNavigate }) => {
    const [comentarios, setComentarios] = useState<ComentarioSocio[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<Filtro>('noLeidos');
    const [marcando, setMarcando] = useState<number | null>(null);

    const cargar = useCallback(() => {
        setLoading(true);
        fetch(`${API_URL}/comentarios`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setComentarios)
            .catch(() => setComentarios([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const marcarLeido = async (id: number) => {
        setMarcando(id);
        try {
            const res = await fetch(`${API_URL}/comentarios/${id}/leido`, { method: 'PATCH' });
            if (res.ok) cargar();
        } finally {
            setMarcando(null);
        }
    };

    const noLeidos = comentarios.filter((c) => !c.leido).length;
    const visibles = filtro === 'noLeidos' ? comentarios.filter((c) => !c.leido) : comentarios;

    return (
        <AppShell onLogout={onLogout} onNavigate={onNavigate} activePath="/comentarios">
            <div className="w-full max-w-3xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare size={20} className="text-primary-600" />
                        Comentarios de socios
                    </h2>
                </div>

                <div className="flex gap-2 mb-5">
                    <button
                        onClick={() => setFiltro('noLeidos')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${filtro === 'noLeidos' ? 'text-amber-600 bg-amber-50 ring-2 ring-offset-1 ring-current' : 'text-amber-600 bg-amber-50 hover:bg-amber-100'}`}
                    >
                        Sin leer ({noLeidos})
                    </button>
                    <button
                        onClick={() => setFiltro('todos')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${filtro === 'todos' ? 'text-gray-700 bg-gray-100 ring-2 ring-offset-1 ring-current' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                    >
                        Todos ({comentarios.length})
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-gray-400 text-sm">Cargando...</div>
                    ) : visibles.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 text-sm">
                            {filtro === 'noLeidos' ? 'No hay comentarios sin leer.' : 'Todavía no hay comentarios.'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {visibles.map((c) => (
                                <div key={c.id} className={`px-5 py-4 flex items-start gap-4 ${c.leido ? '' : 'bg-amber-50/40'}`}>
                                    <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                        {`${c.nombreSocio?.[0] ?? '?'}${c.apellidoSocio?.[0] ?? ''}`.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold text-gray-800 text-sm">
                                                {c.nombreSocio ? `${c.nombreSocio} ${c.apellidoSocio ?? ''}` : `DNI ${c.dniSocio}`}
                                            </p>
                                            <span className="text-xs text-gray-400 shrink-0">{fmtFechaHora(c.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-700 text-sm mt-1 break-words">{c.texto}</p>
                                    </div>
                                    {!c.leido && (
                                        <button
                                            onClick={() => marcarLeido(c.id)}
                                            disabled={marcando === c.id}
                                            title="Marcar como leído"
                                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={12} />
                                            {marcando === c.id ? 'Marcando...' : 'Marcar leído'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
};

export default Comentarios;
