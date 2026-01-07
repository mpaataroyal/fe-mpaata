import { admin, db } from '@/libs/firebaseAdmin';
import { runMiddleware } from '@/libs/middleware';
import Cors from 'cors';

const cors = Cors({ methods: ['POST', 'HEAD'] });

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID token is required',
        error: { code: 'MISSING_TOKEN' } 
      });
    }

    // 1. Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // 2. Check if user exists in Firestore
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).limit(1).get();

    let userId;
    let userData;

    if (userQuery.empty) {
      // 3. Create new user if not exists
      const newUser = {
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0],
        photoUrl: picture || null,
        role: 'customer', // Default role
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const userDoc = await usersRef.add(newUser);
      userId = userDoc.id;
      userData = { ...newUser, id: userId };
    } else {
      // 4. Update existing user
      const userDoc = userQuery.docs[0];
      userId = userDoc.id;
      userData = { id: userId, ...userDoc.data() };

      await usersRef.doc(userId).update({
        name: name || userData.name,
        photoUrl: picture || userData.photoUrl,
        firebaseUid: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: userId,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          photoUrl: userData.photoUrl
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: { code: 'AUTH_FAILED', details: error.message }
    });
  }
}