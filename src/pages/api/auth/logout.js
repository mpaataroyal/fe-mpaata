import { runMiddleware, verifyToken } from '@/libs/middleware';
import Cors from 'cors';

const cors = Cors({ methods: ['POST', 'HEAD'] });

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  if (req.method !== 'POST') return res.status(405).end();

  // Optional: Verify token to ensure the request comes from a logged-in user
  const user = await verifyToken(req, res);
  if (!user) return; // verifyToken handles the 401 response

  try {
    // Since Firebase Auth on the client side handles the session state (tokens),
    // the server mainly acknowledges the request. 
    // If you were using server-side session cookies, you would clear them here.

    res.json({
      success: true,
      message: 'Logged out successfully',
      data: null,
      error: null
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: { code: 'LOGOUT_FAILED' }
    });
  }
}