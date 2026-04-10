/**
 * setup-firebase.js
 * Ejecutar UNA SOLA VEZ para configurar Firebase:
 *   node setup-firebase.js
 *
 * Requisitos previos:
 *   1. Haber ejecutado: firebase login
 *   2. Tener el proyecto Firebase creado y configurado en .firebaserc
 */

const admin = require('firebase-admin');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Lee el serviceAccount generado por firebase-admin init ─────────────────
const SA_PATH = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(SA_PATH)) {
    console.error('\n❌  No se encontró serviceAccountKey.json');
    console.error('   Sigue los pasos del README para generarlo.\n');
    process.exit(1);
}

const serviceAccount = require(SA_PATH);
const PROJECT_ID = serviceAccount.project_id;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
});

const auth = admin.auth();
const db   = admin.firestore();

async function setup() {
    console.log(`\n🚀  Configurando Firebase para proyecto: ${PROJECT_ID}\n`);

    // ── 1. Crear usuario en Firebase Auth ─────────────────────────────────
    let uid;
    try {
        const user = await auth.createUser({
            email:        'gcifuentes@rvcuatro.com',
            password:     '4nalista',
            displayName:  'Gabriel',
            emailVerified: true,
        });
        uid = user.uid;
        console.log(`✅  Usuario creado en Auth: ${user.email} (uid: ${uid})`);
    } catch (err) {
        if (err.code === 'auth/email-already-exists') {
            const existing = await auth.getUserByEmail('gcifuentes@rvcuatro.com');
            uid = existing.uid;
            console.log(`ℹ️   El usuario ya existe en Auth (uid: ${uid})`);
        } else {
            throw err;
        }
    }

    // ── 2. Guardar perfil en Firestore (colección "usuarios") ─────────────
    await db.collection('usuarios').doc(uid).set({
        nombre:    'Gabriel',
        correo:    'gcifuentes@rvcuatro.com',
        rol:       'admin',
        creado:    admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅  Documento en Firestore → usuarios/${uid}`);

    console.log('\n🎉  Configuración completada con éxito.\n');
    process.exit(0);
}

setup().catch(err => {
    console.error('\n❌  Error:', err.message);
    process.exit(1);
});
