import { admin, db } from '@/libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole, formatPhoneNumber } from '@/libs/middleware';
import Cors from 'cors';

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'] });

export default async function handler(req, res) {
  // 1. Run Middleware
  await runMiddleware(req, res, cors);

  // 2. Parse Params
  const { params } = req.query;
  const slug1 = params ? params[0] : null; // uid
  const slug2 = params ? params[1] : null; // 'role' (optional)

  console.log(`[Users API] Hit: ${req.method} ${req.url}`);
  console.log(`[Users API] Slugs: slug1=${slug1}, slug2=${slug2}`);

  // 3. Verify Auth
  const user = await verifyToken(req, res);
  if (!user) return; // verifyToken handles 401 response

  try {
    // GET /api/users (List All)
    if (!slug1 && req.method === 'GET') {
      return handleList(req, res, user);
    }

    // POST /api/users (Create New)
    if (!slug1 && req.method === 'POST') {
      return handleCreate(req, res, user);
    }

    // GET /api/users/:uid (Get One)
    if (slug1 && !slug2 && req.method === 'GET') {
      return handleGetOne(req, res, user, slug1);
    }

    // PATCH /api/users/:uid/role (Update Role)
    if (slug1 && slug2 === 'role' && req.method === 'PATCH') {
      return handleUpdateRole(req, res, user, slug1);
    }

    // PUT /api/users/:uid (Update Profile)
    if (slug1 && !slug2 && req.method === 'PUT') {
      console.log('[Users API] Handling PUT Profile Update');
      return handleUpdate(req, res, user, slug1);
    }

    // DELETE /api/users/:uid (Delete)
    if (slug1 && !slug2 && req.method === 'DELETE') {
      return handleDelete(req, res, user, slug1);
    }

    console.log('[Users API] No route matched');
    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Users API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ------------------------------------------------------------------
// LOGIC HANDLERS
// ------------------------------------------------------------------

async function handleList(req, res, user) {
  if (!hasRole(user, ['admin', 'manager', 'receptionist'])) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const listUsersResult = await admin.auth().listUsers(1000);
  const users = listUsersResult.users.map((u) => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    phoneNumber: u.phoneNumber,
    role: u.customClaims ? u.customClaims.role : 'customer',
    lastSignInTime: u.metadata.lastSignInTime,
    creationTime: u.metadata.creationTime,
  }));

  return res.json({ success: true, count: users.length, users });
}

async function handleGetOne(req, res, user, uid) {
  // Allow users to get their own profile, or admins/managers to get any
  if (user.uid !== uid && !hasRole(user, ['admin', 'manager'])) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const userRecord = await admin.auth().getUser(uid);
  
  // Fetch extra data from Firestore
  let firestoreData = {};
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) firestoreData = doc.data();

  return res.json({
    success: true,
    user: {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber,
      photoURL: userRecord.photoURL,
      role: userRecord.customClaims?.role || 'customer',
      ...firestoreData
    }
  });
}

async function handleCreate(req, res, user) {
  if (!hasRole(user, ['admin', 'manager'])) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { email, password, phoneNumber, displayName, role } = req.body;
  const validRoles = ['admin', 'manager', 'receptionist', 'customer'];
  const assignedRole = validRoles.includes(role) ? role : 'customer';
  const formattedPhone = formatPhoneNumber(phoneNumber);

  const userRecord = await admin.auth().createUser({
    email,
    password,
    phoneNumber: formattedPhone,
    displayName,
    emailVerified: true 
  });

  // Assign Role
  await admin.auth().setCustomUserClaims(userRecord.uid, { role: assignedRole });

  // Create Shadow Document
  await db.collection('users').doc(userRecord.uid).set({
    email,
    name: displayName,
    role: assignedRole,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.status(201).json({
    success: true,
    message: `User created successfully as ${assignedRole}`,
    user: {
      uid: userRecord.uid,
      email: userRecord.email,
      phone: userRecord.phoneNumber,
      role: assignedRole
    }
  });
}

async function handleUpdateRole(req, res, user, uid) {
  if (!hasRole(user, 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { role } = req.body;
  if (!role || !['admin', 'manager', 'receptionist', 'customer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role provided' });
  }

  if (user.uid === uid) {
    return res.status(403).json({ error: 'You cannot change your own role.' });
  }

  const userRecord = await admin.auth().getUser(uid);
  if (userRecord.customClaims?.role === 'super_admin') {
    return res.status(403).json({ error: 'Cannot modify a Super Admin.' });
  }

  // Update Auth Claims
  await admin.auth().setCustomUserClaims(uid, {
    ...userRecord.customClaims,
    role: role
  });

  // Update Firestore
  await db.collection('users').doc(uid).update({ role: role }).catch(() => {});

  return res.json({
    success: true,
    message: `User ${userRecord.email} is now a ${role}`,
    data: { uid, role }
  });
}

async function handleUpdate(req, res, user, uid) {
  console.log('[Users API] Update payload:', req.body);

  // Ensure user is updating themselves or is an admin
  if (user.uid !== uid && !hasRole(user, 'admin')) {
    return res.status(403).json({ error: 'Unauthorized to update this user' });
  }

  const { phoneNumber, displayName } = req.body;
  const updates = {};
  
  if (phoneNumber) updates.phoneNumber = formatPhoneNumber(phoneNumber);
  if (displayName) updates.displayName = displayName;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  // Update Auth
  // Note: updateUser throws if phone number is invalid or duplicate
  await admin.auth().updateUser(uid, updates);

  // Update Firestore
  const fsUpdates = {};
  if (updates.phoneNumber) fsUpdates.phoneNumber = updates.phoneNumber;
  if (updates.displayName) fsUpdates.name = updates.displayName;
  
  await db.collection('users').doc(uid).set(fsUpdates, { merge: true });

  return res.json({
    success: true,
    message: 'User profile updated successfully',
    data: { uid, ...updates }
  });
}

async function handleDelete(req, res, user, uid) {
  if (!hasRole(user, 'admin')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (user.uid === uid) {
    return res.status(403).json({ error: 'You cannot delete your own account.' });
  }

  const userRecord = await admin.auth().getUser(uid);
  if (userRecord.customClaims?.role === 'super_admin') {
    return res.status(403).json({ error: 'Cannot delete a Super Admin.' });
  }

  // Delete from Auth
  await admin.auth().deleteUser(uid);

  // Delete from Firestore
  await db.collection('users').doc(uid).delete();

  return res.json({
    success: true,
    message: 'User deleted successfully',
    data: { uid }
  });
}