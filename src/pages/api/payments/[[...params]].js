import { admin, db } from '@/libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole, formatPhoneNumber } from '@/libs/middleware';
import Cors from 'cors';
import axios from 'axios';

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'HEAD'] });

const RELWORX_CONFIG = {
  API_KEY: process.env.RELWORX_API_KEY, 
  ACCOUNT_NO: 'REL0309E04069',
  BASE_URL: 'https://payments.relworx.com/api', 
  CURRENCY: 'UGX'
};

const generateReference = () => 'TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

export default async function handler(req, res) {
  // 1. Run CORS Middleware
  await runMiddleware(req, res, cors);

  // 2. Parse Route Params
  // URL examples:
  // /api/payments           -> params: undefined (slug is null)
  // /api/payments/me        -> params: ['me']
  const { params } = req.query;
  const slug = params ? params[0] : null;

  console.log(`[Payments API] Method: ${req.method} | Slug: ${slug || 'ROOT'}`);

  // =================================================
  // PUBLIC ROUTES (No Auth Required)
  // =================================================

  // POST /api/payments/webhook
  if (slug === 'webhook' && req.method === 'POST') {
    return handleWebhook(req, res);
  }

  // =================================================
  // PROTECTED ROUTES (Auth Required)
  // =================================================
  const user = await verifyToken(req, res);
  if (!user) return; // verifyToken handles the 401 response

  try {
    // GET /api/payments/me (User's own payments)
    if (slug === 'me' && req.method === 'GET') {
      return handleGetMe(req, res, user);
    }

    // POST /api/payments/initiate (Start mobile money payment)
    if (slug === 'initiate' && req.method === 'POST') {
      return handleInitiate(req, res, user);
    }

    // GET /api/payments (List All - Admin/Manager only)
    if (!slug && req.method === 'GET') {
      return handleListAll(req, res, user);
    }

    // GET /api/payments/:id (Get Single Payment)
    if (slug && req.method === 'GET') {
      return handleGetById(req, res, user, slug);
    }

    // PUT /api/payments/:id (Update Status - Admin/Manager only)
    if (slug && req.method === 'PUT') {
      return handleUpdate(req, res, user, slug);
    }

    // If no match found
    console.log('[Payments API] 404 - No route matched');
    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Payment API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ------------------------------------------------------------------
// LOGIC HANDLERS
// ------------------------------------------------------------------

async function handleGetMe(req, res, user) {
  const snapshot = await db.collection('payments')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  
  const payments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    guest: 'Me',
    date: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
  }));
  return res.json({ success: true, payments });
}

async function handleInitiate(req, res, user) {
  const { bookingId, phoneNumber, amount } = req.body;
  
  if (!bookingId || !phoneNumber || !amount) {
    return res.status(400).json({ error: 'Missing details' });
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const internalRef = generateReference();

  // 1. Create Record
  const paymentDocRef = await db.collection('payments').add({
    bookingId,
    userId: user.uid,
    amount: Number(amount),
    currency: 'UGX',
    provider: 'mobile_money',
    phone: formattedPhone,
    status: 'pending',
    customer_reference: internalRef,
    externalReference: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Call Relworx API
  try {
    await axios.post(`${RELWORX_CONFIG.BASE_URL}/mobile-money/request-payment`, {
      account_no: RELWORX_CONFIG.ACCOUNT_NO,
      amount,
      currency: 'UGX',
      msisdn: formattedPhone,
      reference: internalRef,
      narration: `Booking ${bookingId.slice(0,6)}`
    }, {
      headers: { 'Authorization': `Bearer ${RELWORX_CONFIG.API_KEY}` }
    });
    return res.json({ success: true, message: 'Payment prompt sent' });
  } catch (apiError) {
    console.error('Relworx Error:', apiError.response?.data || apiError.message);
    await paymentDocRef.update({ status: 'failed', failureReason: 'API Call Failed' });
    return res.status(502).json({ error: 'Failed to trigger payment prompt' });
  }
}

async function handleListAll(req, res, user) {
  if (!hasRole(user, ['admin', 'manager', 'receptionist'])) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const snapshot = await db.collection('payments').orderBy('createdAt', 'desc').limit(100).get();
  
  const payments = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    let guestName = 'Unknown';
    if (data.userId) {
      const userSnap = await db.collection('users').doc(data.userId).get();
      if (userSnap.exists) guestName = userSnap.data().name || userSnap.data().displayName;
    }
    return {
      id: doc.id,
      ...data,
      guest: guestName,
      date: data.createdAt?.toDate().toISOString() || new Date().toISOString()
    };
  }));
  
  return res.json({ success: true, payments });
}

async function handleGetById(req, res, user, id) {
  const doc = await db.collection('payments').doc(id).get();
  
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  
  const data = doc.data();
  // Access Control: Must be owner OR admin
  if (data.userId !== user.uid && !hasRole(user, ['admin', 'manager', 'receptionist'])) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  return res.json({ success: true, data: { id: doc.id, ...data } });
}

async function handleUpdate(req, res, user, id) {
  if (!hasRole(user, ['admin', 'manager', 'receptionist'])) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });

  const paymentRef = db.collection('payments').doc(id);
  const paymentDoc = await paymentRef.get();
  
  if (!paymentDoc.exists) return res.status(404).json({ error: 'Not found' });

  await paymentRef.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  // Sync Booking Status
  const bookingId = paymentDoc.data().bookingId;
  if (bookingId) {
    let bUpdates = {};
    if (['success', 'paid'].includes(status)) {
      bUpdates.paymentStatus = 'paid';
      bUpdates.status = 'confirmed';
    } else if (status === 'failed') {
      bUpdates.paymentStatus = 'failed';
    }
    await db.collection('bookings').doc(bookingId).update(bUpdates);
  }
  
  return res.json({ success: true, message: 'Updated' });
}

async function handleWebhook(req, res) {
  const { status, customer_reference, provider_transaction_id, message } = req.body;
  
  if (!customer_reference) return res.status(400).send('Missing Ref');

  const q = await db.collection('payments')
    .where('customer_reference', '==', customer_reference)
    .limit(1)
    .get();
  
  // If payment not found, return OK to stop retry loops from provider
  if (q.empty) return res.status(200).send('OK');

  const doc = q.docs[0];
  const data = doc.data();
  const batch = db.batch();

  if (status && status.toLowerCase() === 'success') {
    // 1. Update Payment
    batch.update(doc.ref, {
      status: 'success',
      externalReference: provider_transaction_id,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Update Booking
    if (data.bookingId) {
      batch.update(db.collection('bookings').doc(data.bookingId), {
        paymentStatus: 'paid',
        status: 'confirmed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
  } else {
    // Update Failure Reason
    await doc.ref.update({ status: 'failed', failureReason: message || 'Failed' });
  }
  
  return res.status(200).send('OK');
}