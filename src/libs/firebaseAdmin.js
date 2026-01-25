import admin from 'firebase-admin';

// Only initialize on server-side
if (typeof window === 'undefined' && !admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY is not set');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    throw error;
  }
}

// Safe exports that work on both client and server
const isServer = typeof window === 'undefined';

export const db = isServer && admin.apps.length ? admin.firestore() : null;
export const auth = isServer && admin.apps.length ? admin.auth() : null;
export { admin };