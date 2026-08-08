const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
    Promise.race([promise, delay(ms).then(() => null)]) as Promise<T | null>;

const safeAll = (urls: string[]) => Promise.all(urls.map((u) => fetch(u).catch(() => null)));

/**
 * Dispara por adelantado los mismos GET que hace cada pantalla al montarse,
 * para que el navegador ya tenga la respuesta en caché cuando el componente
 * se renderice. Nunca rechaza: los errores de red se tragan para no bloquear
 * la navegación.
 */
const prefetchers: Record<string, () => Promise<unknown>> = {
    '/menu-principal': () => {
        const hoy = new Date();
        const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
        const hasta = hoy.toISOString().slice(0, 10);
        return safeAll([
            `${API_URL}/socios`,
            `${API_URL}/stats?desde=${desde}&hasta=${hasta}&granularity=day`,
            `${API_URL}/turnero`,
        ]);
    },
    '/socios': () => safeAll([
        `${API_URL}/socios`,
        `${API_URL}/socios/membresias`,
        `${API_URL}/turnero/profesores`,
    ]),
    '/turnero': () => safeAll([
        `${API_URL}/turnero`,
        `${API_URL}/turnero/profesores`,
        `${API_URL}/turnero/sedes`,
        `${API_URL}/turnero/actividades`,
    ]),
    '/planes': () => safeAll([
        `${API_URL}/socios`,
        `${API_URL}/ejercicios`,
    ]),
    '/estadisticas': () => {
        const hoy = new Date();
        const desde = new Date(hoy);
        desde.setMonth(desde.getMonth() - 3);
        const params = new URLSearchParams({
            desde: desde.toISOString().slice(0, 10),
            hasta: hoy.toISOString().slice(0, 10),
            granularity: 'day',
        });
        return safeAll([`${API_URL}/stats?${params}`]);
    },
    '/profesores': () => safeAll([
        `${API_URL}/turnero/profesores`,
        `${API_URL}/turnero/sedes`,
    ]),
    '/crear-cuenta': () => safeAll([
        `${API_URL}/socios/membresias`,
        `${API_URL}/ejercicios/zonas`,
        `${API_URL}/turnero/sedes`,
        `${API_URL}/turnero/profesores`,
    ]),
    '/comentarios': () => safeAll([`${API_URL}/comentarios`]),
    '/plantillas': () => safeAll([
        `${API_URL}/plantillas`,
        `${API_URL}/ejercicios`,
    ]),
};

export const prefetchMenuPrincipal = () => prefetchers['/menu-principal']();

/** Precarga los datos de `path` (si la pantalla tiene) con un timeout de seguridad. */
export const prefetchRoute = async (path: string): Promise<void> => {
    const run = prefetchers[path];
    if (!run) return;
    await withTimeout(run(), 4000);
};
