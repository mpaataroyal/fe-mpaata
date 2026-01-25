import admin from 'firebase-admin';

// Only run on server-side
if (typeof window === 'undefined') {
  if (!admin.apps.length) {
    try {
      // Log what we have (for debugging)
      console.log('Initializing Firebase Admin...', {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      });

      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Validate all required credentials exist
      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          `Missing Firebase Admin credentials: ${[
            !projectId && 'FIREBASE_PROJECT_ID',
            !clientEmail && 'FIREBASE_CLIENT_EMAIL',
            !privateKey && 'FIREBASE_PRIVATE_KEY',
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });

      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      // Don't throw during build - just log the error
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}

// Safe exports
const getAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin can only be used on the server side');
  }
  return admin;
};

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
export { admin };