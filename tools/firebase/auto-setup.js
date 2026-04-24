/**
 * auto-setup.js — Configuración automática de Firebase
 * Ejecutado por tools/firebase/INICIAR-FIREBASE.bat
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SCRIPT_DIR  = __dirname;
const ROOT_DIR    = path.resolve(SCRIPT_DIR, '..', '..');
const PROJECT_ID  = `douglas-consba-${Math.random().toString(36).slice(2, 7)}`;
const USER_EMAIL  = 'gcifuentes@rvcuatro.com';
const USER_PASS   = '4nalista';
const USER_NAME   = 'Gabriel';
const FIREBASE    = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'firebase.cmd');
const NODE_PATH   = 'C:\\Program Files\\nodejs';

const env = { ...process.env, PATH: `${NODE_PATH};${process.env.PATH}`, CI: '1' };
const run = (cmd) => execSync(cmd, { encoding: 'utf8', env, cwd: ROOT_DIR }).trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(method, url, token, body) {
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
}

function getStoredToken() {
    const candidates = [
        path.join(os.homedir(), 'AppData', 'Roaming', 'Configstore', 'firebase-tools.json'),
        path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json'),
    ];
    for (const p of candidates) {
        try {
            const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
            const t = cfg?.tokens?.access_token || cfg?.token;
            if (t) return t;
        } catch {}
    }
    return null;
}

function replaceFirebaseConfig(file, config) {
    const fp = path.join(ROOT_DIR, file);
    if (!fs.existsSync(fp)) return;
    let html = fs.readFileSync(fp, 'utf8');
    const configStr = `const firebaseConfig = ${JSON.stringify(config, null, 12)};`;
    html = html.replace(
        /const firebaseConfig = \{[\s\S]*?apiKey:\s*["']FIREBASE_API_KEY["'][\s\S]*?\};/,
        configStr
    );
    fs.writeFileSync(fp, html, 'utf8');
    console.log(`  ✅  ${file}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n══════════════════════════════════════════');
    console.log('  🔥  Configuración automática Firebase');
    console.log('══════════════════════════════════════════\n');

    // 1. Verificar token
    const token = getStoredToken();
    if (!token) {
        console.error('❌  No se encontró sesión de Firebase.');
        console.error('    Asegúrate de haber completado "firebase login" antes.\n');
        process.exit(1);
    }
    console.log('✅  Sesión Firebase verificada\n');

    // 2. Crear proyecto GCP/Firebase
    console.log(`📁  Creando proyecto: ${PROJECT_ID}`);
    try {
        run(`"${FIREBASE}" projects:create ${PROJECT_ID} --display-name "Douglas CONSBA"`);
        console.log('✅  Proyecto creado\n');
    } catch (e) {
        // Si ya existe, continuar
        console.log('ℹ️   Proyecto ya existe o error (continuando...)\n');
    }

    // 3. Configurar .firebaserc
    fs.writeFileSync(
        path.join(ROOT_DIR, '.firebaserc'),
        JSON.stringify({ projects: { default: PROJECT_ID } }, null, 2)
    );

    // 4. Crear Web App
    console.log('📱  Creando web app...');
    let appId;
    try {
        const out = run(`"${FIREBASE}" apps:create web "Dashboard CONSBA" --json`);
        appId = JSON.parse(out).result?.appId;
        console.log(`✅  Web app creada (${appId})\n`);
    } catch (e) {
        // Intentar listar apps existentes
        try {
            const out = run(`"${FIREBASE}" apps:list --json`);
            const apps = JSON.parse(out)?.result || [];
            appId = apps[0]?.appId;
            console.log(`ℹ️   Usando app existente (${appId})\n`);
        } catch {}
    }

    // 5. Obtener configuración SDK
    console.log('🔑  Obteniendo configuración Firebase...');
    let sdkConfig;
    try {
        const out = run(`"${FIREBASE}" apps:sdkconfig web ${appId} --json`);
        sdkConfig = JSON.parse(out).result?.sdkConfig;
        console.log(`✅  Config obtenida: projectId = ${sdkConfig?.projectId}\n`);
    } catch (e) {
        console.error('❌  No se pudo obtener la config:', e.message);
        process.exit(1);
    }

    const { apiKey, projectId } = sdkConfig;

    // 6. Crear Firestore (con reintentos)
    console.log('🗄️   Creando Firestore Database...');
    let firestoreOk = false;
    for (let i = 0; i < 3; i++) {
        try {
            run(`"${FIREBASE}" firestore:databases:create --location=nam5`);
            firestoreOk = true;
            break;
        } catch {
            try { run(`"${FIREBASE}" firestore databases create --location=nam5`); firestoreOk = true; break; }
            catch { await sleep(5000); }
        }
    }
    console.log(firestoreOk ? '✅  Firestore creado\n' : 'ℹ️   Firestore puede ya existir\n');

    // 7. Activar Email/Password en Auth
    console.log('🔐  Activando autenticación Email/Password...');
    const authRes = await api('PATCH',
        `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=signIn`,
        token,
        { signIn: { email: { enabled: true, passwordRequired: true } } }
    );
    if (authRes.status < 300) {
        console.log('✅  Auth Email/Password activada\n');
    } else {
        console.log('⚠️   Auth no se pudo activar automáticamente.');
        console.log('    Ve a Firebase Console → Authentication → Método Email/Contraseña → Activar\n');
    }

    // 8. Crear usuario en Firebase Auth
    console.log(`👤  Creando usuario: ${USER_EMAIL}`);
    let idToken, userId;

    const signupRes = await api('POST',
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        null,
        { email: USER_EMAIL, password: USER_PASS, displayName: USER_NAME, returnSecureToken: true }
    );

    if (signupRes.status === 200) {
        idToken = signupRes.data.idToken;
        userId  = signupRes.data.localId;
        console.log(`✅  Usuario creado (uid: ${userId})\n`);
    } else if (signupRes.data?.error?.message === 'EMAIL_EXISTS') {
        const signinRes = await api('POST',
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            null,
            { email: USER_EMAIL, password: USER_PASS, returnSecureToken: true }
        );
        idToken = signinRes.data.idToken;
        userId  = signinRes.data.localId;
        console.log(`ℹ️   Usuario ya existe (uid: ${userId})\n`);
    } else {
        console.log('⚠️   Error al crear usuario:', JSON.stringify(signupRes.data?.error));
        userId  = 'usuario-gabriel';
        idToken = token;
    }

    // 9. Guardar usuario en Firestore (colección "usuarios")
    console.log('📝  Guardando usuario en Firestore...');
    const fsRes = await api('PATCH',
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/usuarios/${userId}`,
        idToken,
        {
            fields: {
                nombre:   { stringValue: USER_NAME },
                correo:   { stringValue: USER_EMAIL },
                rol:      { stringValue: 'admin' }
            }
        }
    );

    if (fsRes.status < 300) {
        console.log(`✅  Firestore → usuarios/${userId}\n`);
    } else {
        console.log('⚠️   Firestore write error:', JSON.stringify(fsRes.data).slice(0, 150));
        console.log('    Verifica que Firestore esté en modo de prueba o ajusta las reglas.\n');
    }

    // 10. Actualizar HTML con config real
    console.log('📄  Actualizando archivos HTML...');
    replaceFirebaseConfig('login.html', sdkConfig);
    replaceFirebaseConfig('dashboard.html', sdkConfig);
    console.log();

    // 11. Commit y push
    console.log('🚀  Subiendo a GitHub...');
    try {
        const GH = '"C:\\Program Files\\GitHub CLI\\gh.exe"';
        execSync(`git add login.html dashboard.html .firebaserc`, { cwd: ROOT_DIR });
        execSync(`git commit -m "Add Firebase config and Firestore setup"`, { cwd: ROOT_DIR });
        execSync(`git push`, { cwd: ROOT_DIR });
        console.log('✅  Push a GitHub completado\n');
    } catch (e) {
        console.log('⚠️   Push manual: git add -A && git commit -m "Firebase config" && git push\n');
    }

    // 12. Resumen
    console.log('══════════════════════════════════════════');
    console.log('  🎉  CONFIGURACIÓN COMPLETADA');
    console.log('══════════════════════════════════════════');
    console.log(`  Proyecto  : ${projectId}`);
    console.log(`  API Key   : ${apiKey.slice(0, 12)}...`);
    console.log(`  Usuario   : ${USER_EMAIL}`);
    console.log(`  Contraseña: ${USER_PASS}`);
    console.log(`  URL       : https://gabrielcifuentes26.github.io/dashboard-consba/`);
    console.log('══════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('\n❌  Error inesperado:', err.message);
    process.exit(1);
});
