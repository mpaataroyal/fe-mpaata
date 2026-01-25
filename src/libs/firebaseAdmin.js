import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        // Handle private key newlines in env vars
        privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY
          ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY)
          : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
