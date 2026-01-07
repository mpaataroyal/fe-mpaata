import { admin, db } from '@/libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole, formatPhoneNumber } from '@/libs/middleware';
import Cors from 'cors';
import axios from 'axios';

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'HEAD'] });

const checkAvailability = async (roomId, checkIn, checkOut, excludeId = null) => {
  const snapshot = await db.collection('bookings')
    .where('roomId', '==', roomId)
    .where('status', 'in', ['confirmed', 'pending']) 
    .get();

  for (const doc of snapshot.docs) {
    if (excludeId && doc.id === excludeId) continue;
    const data = doc.data();
    const existingStart = data.checkIn.toDate().getTime();
    const existingEnd = data.checkOut.toDate().getTime();
    if (checkIn.getTime() < existingEnd && checkOut.getTime() > existingStart) return false; 
  }
  return true;
};

const findOrCreateUser = async (name, phone, email) => {
  const formattedPhone = formatPhoneNumber(phone);
  if (formattedPhone) {
    const q = await db.collection('users').where('phoneNumber', '==', formattedPhone).limit(1).get();
    if (!q.empty) return q.docs[0].id;
  }
  if (email) {
    const q = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!q.empty) return q.docs[0].id;
  }
  try {
    const userRecord = await admin.auth().createUser({
      displayName: name, phoneNumber: formattedPhone, email: email || undefined, emailVerified: true
    });
    await db.collection('users').doc(userRecord.uid).set({
      name, email: email || null, phoneNumber: formattedPhone, role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return userRecord.uid;
  } catch(e) { 
    if(e.code === 'auth/phone-number-already-exists') {
        const u = await admin.auth().getUserByPhoneNumber(formattedPhone);
        return u.uid;
    }
    throw e;
  }
};

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  const user = await verifyToken(req, res);
  if (!user) return; 

  // Capture params. URL /api/bookings/me -> params=['me']
  const { params } = req.query;
  const slug1 = params ? params[0] : null; 
  const slug2 = params ? params[1] : null;

  try {
    // GET /api/bookings/me
    if (slug1 === 'me' && req.method === 'GET') {
      const snapshot = await db.collection('bookings').where('userId', '==', user.uid).orderBy('createdAt', 'desc').get();
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        checkIn: doc.data().checkIn?.toDate().toISOString(),
        checkOut: doc.data().checkOut?.toDate().toISOString()
      }));
      return res.json({ success: true, bookings });
    }

    // GET /api/bookings (List All)
    if (!slug1 && req.method === 'GET') {
      if (!hasRole(user, ['admin', 'manager', 'receptionist'])) return res.status(403).json({ error: 'Unauthorized' });
      const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        checkIn: doc.data().checkIn?.toDate().toISOString(),
        checkOut: doc.data().checkOut?.toDate().toISOString(),
      }));
      return res.json({ success: true, bookings });
    }

    // POST /api/bookings (Create)
    if (!slug1 && req.method === 'POST') {
      const { roomId, checkIn, checkOut, guestName, guestPhone, guestEmail, guests, status, paymentMethod, paymentStatus, receivedBy, paymentPhone } = req.body;
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      
      const isAvailable = await checkAvailability(roomId, start, end);
      if (!isAvailable) return res.status(409).json({ error: 'Room unavailable' });

      const userId = await findOrCreateUser(guestName, guestPhone, guestEmail);
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      const totalPrice = roomDoc.data().price * (Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))));
      const formattedPayPhone = paymentMethod === 'Mobile Money' ? formatPhoneNumber(paymentPhone) : null;

      const bookingRef = await db.collection('bookings').add({
        roomId, userId, guestName, guestPhone: formatPhoneNumber(guestPhone),
        guestEmail, guests, checkIn: start, checkOut: end,
        totalPrice, status: status || 'pending', paymentStatus: paymentStatus || 'unpaid',
        paymentMethod, paymentPhone: formattedPayPhone,
        createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: user.uid
      });

      const myReference = 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      await db.collection('payments').add({
        bookingId: bookingRef.id, userId, amount: totalPrice, currency: 'UGX',
        provider: paymentMethod, phone: formattedPayPhone, status: paymentStatus || 'pending',
        customer_reference: myReference, createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(201).json({ success: true, id: bookingRef.id });
    }

    // GET /api/bookings/:id
    if (slug1 && !slug2 && req.method === 'GET') {
      const doc = await db.collection('bookings').doc(slug1).get();
      if (!doc.exists) return res.status(404).json({ error: 'Not found' });
      if (doc.data().userId !== user.uid && !hasRole(user, ['admin', 'manager', 'receptionist'])) return res.status(403).json({ error: 'Unauthorized' });
      return res.json({ success: true, data: { id: doc.id, ...doc.data(), checkIn: doc.data().checkIn?.toDate().toISOString(), checkOut: doc.data().checkOut?.toDate().toISOString() } });
    }

    // POST /api/bookings/:id/cancel
    if (slug1 && slug2 === 'cancel' && req.method === 'POST') {
      const bookingRef = db.collection('bookings').doc(slug1);
      await bookingRef.update({ status: 'cancelled', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.json({ success: true });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}