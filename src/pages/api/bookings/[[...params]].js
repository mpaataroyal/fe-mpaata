// FIXED: Changed imports to relative paths to match your working rooms.js
import { admin, db } from '../../../libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole, formatPhoneNumber } from '../../../libs/middleware';
import Cors from 'cors';

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'HEAD'] });

// --- Helper: Safely Check Availability ---
const checkAvailability = async (roomId, checkIn, checkOut, excludeId = null) => {
  try {
    const snapshot = await db.collection('bookings')
      .where('roomId', '==', roomId)
      .where('status', 'in', ['confirmed', 'pending']) 
      .get();

    for (const doc of snapshot.docs) {
      if (excludeId && doc.id === excludeId) continue;
      const data = doc.data();

      // FIXED: Safely handle dates (Timestamp vs String vs Null)
      let existingStart, existingEnd;

      try {
        existingStart = data.checkIn?.toDate ? data.checkIn.toDate().getTime() : new Date(data.checkIn).getTime();
        existingEnd = data.checkOut?.toDate ? data.checkOut.toDate().getTime() : new Date(data.checkOut).getTime();
      } catch (e) {
        console.warn(`[Warning] Invalid date in booking ${doc.id}, skipping check.`);
        continue; // Skip corrupt data instead of crashing
      }

      // Check for overlap
      if (checkIn.getTime() < existingEnd && checkOut.getTime() > existingStart) {
        return false; 
      }
    }
    return true;
  } catch (error) {
    console.error("Availability Check Error:", error);
    throw new Error("Failed to check room availability.");
  }
};

const findOrCreateUser = async (name, phone, email) => {
  const formattedPhone = formatPhoneNumber(phone);
  
  // Try finding by phone
  if (formattedPhone) {
    const q = await db.collection('users').where('phoneNumber', '==', formattedPhone).limit(1).get();
    if (!q.empty) return q.docs[0].id;
  }
  
  // Try finding by email
  if (email) {
    const q = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!q.empty) return q.docs[0].id;
  }

  // Create new user
  try {
    const userRecord = await admin.auth().createUser({
      displayName: name, 
      phoneNumber: formattedPhone, 
      email: email || undefined, 
      emailVerified: true
    });
    
    await db.collection('users').doc(userRecord.uid).set({
      name, 
      email: email || null, 
      phoneNumber: formattedPhone, 
      role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return userRecord.uid;
  } catch(e) { 
    if(e.code === 'auth/phone-number-already-exists') {
        const u = await admin.auth().getUserByPhoneNumber(formattedPhone);
        return u.uid;
    }
    console.error("User Creation Error:", e);
    throw e;
  }
};

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  
  const user = await verifyToken(req, res);
  if (!user) return; 

  const { params } = req.query;
  const slug1 = params ? params[0] : null; 
  const slug2 = params ? params[1] : null;

  try {
    // GET /api/v1/bookings/me
    if (slug1 === 'me' && req.method === 'GET') {
      const snapshot = await db.collection('bookings')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();
        
      const bookings = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id, 
          ...d,
          checkIn: d.checkIn?.toDate ? d.checkIn.toDate().toISOString() : d.checkIn,
          checkOut: d.checkOut?.toDate ? d.checkOut.toDate().toISOString() : d.checkOut
        };
      });
      return res.json({ success: true, bookings });
    }

    // GET /api/v1/bookings (List All - Admin)
    if (!slug1 && req.method === 'GET') {
      if (!hasRole(user, ['admin', 'manager', 'receptionist'])) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
      const bookings = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id, 
          ...d,
          checkIn: d.checkIn?.toDate ? d.checkIn.toDate().toISOString() : d.checkIn,
          checkOut: d.checkOut?.toDate ? d.checkOut.toDate().toISOString() : d.checkOut,
        };
      });
      return res.json({ success: true, bookings });
    }

    // POST /api/v1/bookings (Create)
    if (!slug1 && req.method === 'POST') {
      const { 
        roomId, checkIn, checkOut, guestName, guestPhone, guestEmail, guests, 
        status, paymentMethod, paymentStatus, receivedBy, paymentPhone,
        transactionId, providerDetail 
      } = req.body;

      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const now = new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid dates provided.' });
      }

      const isAvailable = await checkAvailability(roomId, start, end);
      if (!isAvailable) return res.status(409).json({ error: 'Room unavailable for selected dates.' });

      const userId = await findOrCreateUser(guestName, guestPhone, guestEmail);
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      
      if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

      // Calculate Price
      const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      const totalPrice = roomDoc.data().price * nights;
      
      const formattedPayPhone = paymentMethod === 'Mobile Money' ? formatPhoneNumber(paymentPhone) : null;

      // Determine Statuses
      let finalStatus = status || 'pending';
      let finalPaymentStatus = paymentStatus || 'unpaid';
      
      // Auto-confirm if transaction ID exists (Merchant Pay)
      if (transactionId) {
        finalStatus = 'confirmed';
        finalPaymentStatus = 'paid';
      }

      // Create Booking
      const bookingRef = await db.collection('bookings').add({
        roomId, 
        userId, 
        guestName, 
        guestPhone: formatPhoneNumber(guestPhone),
        guestEmail: guestEmail || null, 
        guests: Number(guests) || 1, 
        checkIn: admin.firestore.Timestamp.fromDate(start), 
        checkOut: admin.firestore.Timestamp.fromDate(end),
        totalPrice, 
        status: finalStatus, 
        paymentStatus: finalPaymentStatus,
        paymentMethod, 
        paymentPhone: formattedPayPhone,
        receivedBy: receivedBy || null,
        transactionId: transactionId || null, 
        providerDetail: providerDetail || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        createdBy: user.uid
      });

      // --- UPDATE ROOM STATUS ---
      // If booking starts Today (or earlier) and ends in Future, Mark Room Occupied
      if (start <= now && end > now && (finalStatus === 'confirmed' || finalStatus === 'pending')) {
         try {
           await db.collection('rooms').doc(roomId).update({
             status: 'Occupied',
             nextAvailable: admin.firestore.Timestamp.fromDate(end)
           });
         } catch (err) {
           console.error("Failed to update room status:", err);
           // Don't fail the request, just log it
         }
      }

      // Create Payment Record
      const myReference = 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      await db.collection('payments').add({
        bookingId: bookingRef.id, 
        userId, 
        amount: totalPrice, 
        currency: 'UGX',
        provider: paymentMethod, 
        providerDetail: providerDetail || null,
        phone: formattedPayPhone, 
        status: finalPaymentStatus,
        transactionId: transactionId || null, 
        customer_reference: myReference, 
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(201).json({ success: true, id: bookingRef.id });
    }

    // GET /api/v1/bookings/:id
    if (slug1 && !slug2 && req.method === 'GET') {
      const doc = await db.collection('bookings').doc(slug1).get();
      if (!doc.exists) return res.status(404).json({ error: 'Not found' });
      
      if (doc.data().userId !== user.uid && !hasRole(user, ['admin', 'manager', 'receptionist'])) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const d = doc.data();
      return res.json({ 
        success: true, 
        data: { 
          id: doc.id, 
          ...d, 
          checkIn: d.checkIn?.toDate ? d.checkIn.toDate().toISOString() : d.checkIn,
          checkOut: d.checkOut?.toDate ? d.checkOut.toDate().toISOString() : d.checkOut
        } 
      });
    }

    // PUT /api/v1/bookings/:id (Update)
    if (slug1 && req.method === 'PUT') {
       const bookingRef = db.collection('bookings').doc(slug1);
       // Ensure we convert string dates to timestamps if they are present in req.body
       const updates = { ...req.body, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
       
       if (updates.checkIn) updates.checkIn = admin.firestore.Timestamp.fromDate(new Date(updates.checkIn));
       if (updates.checkOut) updates.checkOut = admin.firestore.Timestamp.fromDate(new Date(updates.checkOut));

       await bookingRef.update(updates);
       return res.json({ success: true });
    }

    // POST /api/v1/bookings/:id/cancel
    if (slug1 && slug2 === 'cancel' && req.method === 'POST') {
      const bookingRef = db.collection('bookings').doc(slug1);
      const bSnap = await bookingRef.get();
      
      if (!bSnap.exists) return res.status(404).json({error: "Booking not found"});

      await bookingRef.update({ status: 'cancelled', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      
      // Free up the room
      const bData = bSnap.data();
      await db.collection('rooms').doc(bData.roomId).update({ status: 'Available', nextAvailable: null });

      return res.json({ success: true });
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error("Booking API Critical Error:", error);
    res.status(500).json({ error: error.message });
  }
}