/**
 * tracker.js — Registra sesiones y visitas por página.
 * Incluir en cada página DESPUÉS de inicializar Supabase.
 */
(function () {
    const SUPABASE_URL = 'https://iipgrojliqeyycvgnkrc.supabase.co';
    const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc3MDU3NiwiZXhwIjoyMDkxMzQ2NTc2fQ.Geew8Yzwj0FC41Tkc9fNGymOuwopf_DRXcoUuzr4ZLU';

    const PAGE_NAME = document.title || location.pathname;
    const PAGE_SLUG = location.pathname.split('/').pop() || 'index';

    let sessionId      = null;
    let pageViewId     = null;
    let userId         = null;
    let userNombre     = null;
    let heartbeatTimer = null;
    const HEARTBEAT_INTERVAL = 30000; // 30 s

    // ── Idle timeout ──────────────────────────────────────────────────────────
    const IDLE_TIMEOUT   = 20 * 60 * 1000;  // 20 min
    const IDLE_WARN_AT   = 30 * 1000;       // mostrar aviso 30 s antes
    let idleTimer        = null;
    let idleWarnTimer    = null;
    let countdownTimer   = null;
    let idleModal        = null;

    function buildModal() {
        const el = document.createElement('div');
        el.id = 'idle-modal';
        el.style.cssText = [
            'position:fixed;inset:0;z-index:99999',
            'display:flex;align-items:center;justify-content:center',
            'background:rgba(15,23,42,0.55);backdrop-filter:blur(4px)',
        ].join(';');
        el.innerHTML = `
            <div style="background:#fff;border-radius:16px;padding:36px 40px;max-width:360px;width:90%;
                        box-shadow:0 20px 60px rgba(0,0,0,0.18);text-align:center;font-family:inherit">
                <div style="font-size:2.5rem;margin-bottom:12px">⏳</div>
                <div style="font-size:1.05rem;font-weight:700;color:#1e293b;margin-bottom:8px">
                    ¿Sigues ahí?
                </div>
                <div style="font-size:0.85rem;color:#64748b;margin-bottom:20px">
                    Tu sesión cerrará por inactividad en
                </div>
                <div id="idle-countdown"
                     style="font-size:2.2rem;font-weight:800;color:#ef4444;margin-bottom:24px;
                            font-variant-numeric:tabular-nums">
                    0:30
                </div>
                <button id="idle-stay-btn"
                        style="background:#1e40af;color:#fff;border:none;border-radius:10px;
                               padding:12px 32px;font-size:0.9rem;font-weight:600;cursor:pointer;
                               width:100%;transition:background .2s">
                    Seguir conectado
                </button>
            </div>`;
        document.body.appendChild(el);
        el.querySelector('#idle-stay-btn').addEventListener('click', resetIdle);
        return el;
    }

    function showIdleWarning() {
        if (!idleModal) idleModal = buildModal();
        idleModal.style.display = 'flex';
        let secs = Math.round(IDLE_WARN_AT / 1000);
        document.getElementById('idle-countdown').textContent =
            `0:${String(secs).padStart(2,'0')}`;
        clearInterval(countdownTimer);
        countdownTimer = setInterval(() => {
            secs--;
            const cd = document.getElementById('idle-countdown');
            if (cd) cd.textContent = `0:${String(Math.max(secs,0)).padStart(2,'0')}`;
            if (secs <= 0) clearInterval(countdownTimer);
        }, 1000);
    }

    function resetIdle() {
        clearTimeout(idleTimer);
        clearTimeout(idleWarnTimer);
        clearInterval(countdownTimer);
        if (idleModal) idleModal.style.display = 'none';
        idleWarnTimer = setTimeout(showIdleWarning, IDLE_TIMEOUT - IDLE_WARN_AT);
        idleTimer     = setTimeout(forceLogout,     IDLE_TIMEOUT);
    }

    async function forceLogout() {
        clearInterval(heartbeatTimer);
        clearInterval(countdownTimer);
        // Cerrar sesión en BD
        if (sessionId) {
            const inicio = sessionStorage.getItem('tracker_session_inicio');
            const durMin = inicio ? (Date.now() - parseInt(inicio)) / 60000 : 0;
            await api('PATCH', `sesiones?id=eq.${sessionId}`, {
                fin:          new Date().toISOString(),
                duracion_min: Math.round(durMin * 100) / 100,
                last_seen:    new Date().toISOString()
            });
        }
        sessionStorage.removeItem('tracker_session_id');
        sessionStorage.removeItem('tracker_session_inicio');
        // Sign out Supabase
        if (typeof supabase !== 'undefined') {
            const { createClient } = supabase;
            const client = createClient(SUPABASE_URL,
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg');
            await client.auth.signOut();
        }
        window.location.href = 'index.html?idle=1';
    }

    function startIdleWatch() {
        ['mousemove','mousedown','keydown','scroll','touchstart','click'].forEach(ev =>
            document.addEventListener(ev, resetIdle, { passive: true })
        );
        resetIdle();
    }
    // ─────────────────────────────────────────────────────────────────────────

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
        const existing = sessionStorage.getItem('tracker_session_id');
        if (existing) {
            sessionId = parseInt(existing);
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
        if (typeof supabase === 'undefined') return;
        const { createClient } = supabase;
        const client = createClient(SUPABASE_URL,
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGdyb2psaXFleXljdmdua3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzA1NzYsImV4cCI6MjA5MTM0NjU3Nn0.Y6FQ-1qWd7HPMvTnK4alpKxM-YLJ5CsKmkorAZKMJrg');

        const { data: { session } } = await client.auth.getSession();
        if (!session) return;

        userId     = session.user.id;
        userNombre = session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario';

        window._trackerEntrada = Date.now();

        if (!sessionStorage.getItem('tracker_session_inicio')) {
            sessionStorage.setItem('tracker_session_inicio', Date.now());
        }

        await startSession();
        await startPageView();

        heartbeatTimer = setInterval(heartbeat, HEARTBEAT_INTERVAL);

        // Verificar rol — solo aplicar idle timeout a usuarios no-admin
        const { data: perfil } = await client.from('usuarios').select('rol').eq('id', userId).single();
        if (perfil?.rol !== 'admin') {
            startIdleWatch();
        }

        window.addEventListener('beforeunload', () => {
            clearInterval(heartbeatTimer);
            clearTimeout(idleTimer);
            clearTimeout(idleWarnTimer);
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }
})();
