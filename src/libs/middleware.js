import { admin, db } from './firebaseAdmin';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  origin: true, // or your specific domain
  credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Authentication Middleware
export const verifyToken = async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'No token provided',
      error: { code: 'UNAUTHORIZED' }
    });
    return null; // Signal failure
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    return decodedToken; // Signal success
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token',
      error: { code: 'auth/invalid-token' }
    });
    return null;
  }
};

// Role Check Helper
export const hasRole = (user, allowedRoles) => {
  const userRole = user.role || user.customClaims?.role || 'customer';
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return roles.includes(userRole);
};

// Common Formatter
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (cleanPhone.startsWith('0')) return '+256' + cleanPhone.substring(1);
  if (!cleanPhone.startsWith('+')) return '+256' + cleanPhone;
  return cleanPhone;
};