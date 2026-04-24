/**
 * tracker.js — Registra sesiones y visitas por página
 * Incluir en cada página DESPUÉS de inicializar Supabase
 */
(function () {
    const SUPABASE_URL = 'https://iipgrojliqeyycvgnkrc.supabase.co';
    const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc3MDU3NiwiZXhwIjoyMDkxMzQ2NTc2fQ.Geew8Yzwj0FC41Tkc9fNGymOuwopf_DRXcoUuzr4ZLU';

    const PAGE_NAME = document.title || location.pathname;
    const PAGE_SLUG = location.pathname.split('/').pop() || 'index';

    let sessionId   = null;
    let pageViewId  = null;
    let userId      = null;
    let userNombre  = null;
    let heartbeatTimer = null;
    const HEARTBEAT_INTERVAL = 30000; // 30 s

    function getDevice() {
        const ua = navigator.userAgent;
        if (/Mobi|Android/i.test(ua)) return 'móvil';
        if (/Tablet|iPad/i.test(ua))  return 'tablet';
        return 'escritorio';
    }

    async function api(method, path, body) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
            method,
            headers: {
                'Content-Type':  'application/json',
                'apikey':        SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Prefer':        'return=representation'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        return res.ok ? res.json() : null;
    }

    async function startSession() {
        // Reutilizar sesión activa del mismo tab (sessionStorage)
        const existing = sessionStorage.getItem('tracker_session_id');
        if (existing) {
            sessionId = parseInt(existing);
            // Actualizar last_seen
            await api('PATCH', `sesiones?id=eq.${sessionId}`, { last_seen: new Date().toISOString() });
            return;
        }
        const rows = await api('POST', 'sesiones', {
            user_id:     userId,
            user_nombre: userNombre,
            dispositivo: getDevice(),
            last_seen:   new Date().toISOString()
        });
        if (rows && rows[0]) {
            sessionId = rows[0].id;
            sessionStorage.setItem('tracker_session_id', sessionId);
        }
    }

    async function startPageView() {
        const rows = await api('POST', 'page_views', {
            user_id:     userId,
            user_nombre: userNombre,
            pagina:      PAGE_SLUG,
            titulo:      PAGE_NAME,
            entrada_at:  new Date().toISOString()
        });
        if (rows && rows[0]) pageViewId = rows[0].id;
    }

    async function heartbeat() {
        if (!sessionId) return;
        await api('PATCH', `sesiones?id=eq.${sessionId}`, { last_seen: new Date().toISOString() });
    }

    async function closePageView() {
        if (!pageViewId) return;
        const tiempoSeg = Math.round((Date.now() - window._trackerEntrada) / 1000);
        await api('PATCH', `page_views?id=eq.${pageViewId}`, {
            salida_at:  new Date().toISOString(),
            tiempo_seg: tiempoSeg
        });
    }

    async function closeSession() {
        if (!sessionId) return;
        const inicio = sessionStorage.getItem('tracker_session_inicio');
        if (!inicio) return;
        const durMin = (Date.now() - parseInt(inicio)) / 60000;
        await api('PATCH', `sesiones?id=eq.${sessionId}`, {
            fin:          new Date().toISOString(),
            duracion_min: Math.round(durMin * 100) / 100,
            last_seen:    new Date().toISOString()
        });
    }

    async function init() {
        // Esperar a que haya sesión de Supabase Auth
        if (typeof supabase === 'undefined') return;
        const { createClient } = supabase;
        const client = createClient(SUPABASE_URL,
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg');

        const { data: { session } } = await client.auth.getSession();
        if (!session) return; // No trackear si no está logueado

        userId     = session.user.id;
        userNombre = session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario';

        window._trackerEntrada = Date.now();

        if (!sessionStorage.getItem('tracker_session_inicio')) {
            sessionStorage.setItem('tracker_session_inicio', Date.now());
        }

        await startSession();
        await startPageView();

        heartbeatTimer = setInterval(heartbeat, HEARTBEAT_INTERVAL);

        // Cerrar al salir de la página
        window.addEventListener('beforeunload', () => {
            clearInterval(heartbeatTimer);
            // Usar sendBeacon para garantizar el envío al cerrar
            const tiempoSeg = Math.round((Date.now() - window._trackerEntrada) / 1000);
            if (pageViewId) {
                navigator.sendBeacon(
                    `${SUPABASE_URL}/rest/v1/page_views?id=eq.${pageViewId}`,
                    new Blob([JSON.stringify({ salida_at: new Date().toISOString(), tiempo_seg: tiempoSeg })],
                        { type: 'application/json' })
                );
            }
        });
    }

    // Arrancar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500); // pequeño delay para que Supabase Auth inicialice
    }
})();
