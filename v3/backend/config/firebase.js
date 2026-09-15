const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

let credential = null;

// Automatic clock skew sync (resolves local system clock offset against Google servers)
(async () => {
    try {
        const res = await fetch('https://www.google.com', { method: 'HEAD' });
        const googleDate = res.headers.get('date');
        if (googleDate) {
            const skew = new Date(googleDate).getTime() - Date.now();
            if (Math.abs(skew) > 60000) {
                const origNow = Date.now;
                Date.now = () => origNow() + skew;
            }
        }
    } catch (e) {}
})();



// 1. Full JSON string provided in environment variable (Render recommended method)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
        console.log('🔑 Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT env var');
    } catch (e) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
}

// 2. Custom file path provided in environment variable
if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(resolvedPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
            console.log('🔑 Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_PATH');
        } catch (e) {
            console.error('❌ Failed to read service account from FIREBASE_SERVICE_ACCOUNT_PATH:', e.message);
        }
    }
}

// 3. Local serviceAccountKey.json file in config directory
if (!credential) {
    const localKeyPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
            console.log('🔑 Loaded Firebase credentials from config/serviceAccountKey.json');
        } catch (e) {
            console.error('❌ Failed to read config/serviceAccountKey.json:', e.message);
        }
    }
}

// 4. Individual environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
if (!credential && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        });
        console.log('🔑 Loaded Firebase credentials from individual environment variables');
    } catch (e) {
        console.error('❌ Failed to initialize from individual Firebase env vars:', e.message);
    }
}

// 5. Default application credentials fallback
if (!credential) {
    try {
        credential = admin.credential.applicationDefault();
        console.log('🔑 Using applicationDefault Firebase credentials');
    } catch (e) {
        console.warn('⚠️ No explicit Firebase credentials found, continuing with default setup.');
    }
}

if (!admin.apps.length) {
    try {
        admin.initializeApp(credential ? { credential } : {});
        console.log('✅ Firebase Admin Initialized Successfully');
    } catch (err) {
        console.error('❌ Firebase Admin Initialization Failed:', err.message);
    }
}

const db = admin.firestore();

// Atomic Integer Counter generator for sequential numeric IDs
// Ensures complete compatibility with existing frontend (parseInt, WebRTC room IDs, Math.min)
async function getNextId(counterName) {
    const counterRef = db.collection('counters').doc(counterName);
    return await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let next = 1;
        if (counterDoc.exists) {
            next = (counterDoc.data().current || 0) + 1;
        }
        transaction.set(counterRef, { current: next }, { merge: true });
        return next;
    });
}

module.exports = { admin, db, getNextId };
