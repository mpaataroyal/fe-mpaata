import { admin, db } from '../../../libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole } from '../../../libs/middleware';
import Cors from 'cors';

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'] });

export default async function handler(req, res) {
  // 1. Run Middleware
  await runMiddleware(req, res, cors);

  // 2. Parse Params
  // /api/v1/rooms       -> params: undefined
  // /api/v1/rooms/123   -> params: ['123']
  const { params } = req.query;
  const roomId = params ? params[0] : null;

  try {
    // =================================================
    // PUBLIC ROUTES (Partially Public)
    // =================================================
    
    // GET /api/v1/rooms (List)
    if (!roomId && req.method === 'GET') {
      return handleList(req, res);
    }

    // GET /api/v1/rooms/:id (Get One)
    if (roomId && req.method === 'GET') {
      return handleGetOne(req, res, roomId);
    }

    // =================================================
    // PROTECTED ROUTES (Auth Required)
    // =================================================
    const user = await verifyToken(req, res);
    if (!user) return; // verifyToken handles 401 response

    // POST /api/v1/rooms (Create)
    if (!roomId && req.method === 'POST') {
      return handleCreate(req, res, user);
    }

    // PUT /api/v1/rooms/:id (Update)
    if (roomId && req.method === 'PUT') {
      return handleUpdate(req, res, user, roomId);
    }

    // DELETE /api/v1/rooms/:id (Delete)
    if (roomId && req.method === 'DELETE') {
      return handleDelete(req, res, user, roomId);
    }

    res.status(404).json({ error: 'Endpoint not found' });
  } catch (error) {
    console.error('Rooms API Error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ------------------------------------------------------------------
// LOGIC HANDLERS
// ------------------------------------------------------------------

async function handleList(req, res) {
  const { status: filterStatus, type } = req.query;
    
  // 1. Fetch All Rooms
  let roomsQuery = db.collection('rooms');
  if (type) roomsQuery = roomsQuery.where('type', '==', type);
  
  const roomsSnapshot = await roomsQuery.get();
  const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. Fetch Active Bookings (Pending or Confirmed, Future or Current)
  const now = new Date();
  const bookingsSnapshot = await db.collection('bookings')
    .where('status', 'in', ['confirmed', 'pending'])
    .where('checkOut', '>', admin.firestore.Timestamp.fromDate(now))
    .get();

  // Group bookings by room
  const bookingsByRoom = {};
  bookingsSnapshot.forEach(doc => {
    const b = doc.data();
    if (!bookingsByRoom[b.roomId]) bookingsByRoom[b.roomId] = [];
    bookingsByRoom[b.roomId].push({
      checkIn: b.checkIn.toDate(),
      checkOut: b.checkOut.toDate(),
    });
  });

  // 3. Calculate Status per Room
  const processedRooms = rooms.map(room => {
    // If manually set to Maintenance, keep it
    if (room.status === 'Maintenance') {
      return { ...room, nextAvailable: null };
    }

    const roomBookings = bookingsByRoom[room.id] || [];
    // Sort by start time
    roomBookings.sort((a, b) => a.checkIn - b.checkIn);

    let calculatedStatus = 'Available';
    let nextAvailable = null;

    for (const booking of roomBookings) {
      if (now >= booking.checkIn && now < booking.checkOut) {
        calculatedStatus = 'Occupied';
        nextAvailable = booking.checkOut;
        break; // Found the current active booking
      }
    }

    return {
      ...room,
      status: calculatedStatus,
      nextAvailable: nextAvailable ? nextAvailable.toISOString() : null
    };
  });

  // 4. Apply Status Filter (in memory)
  const finalRooms = filterStatus 
    ? processedRooms.filter(r => r.status === filterStatus)
    : processedRooms;

  // Sort by room number naturally (numeric sort if possible)
  finalRooms.sort((a, b) => 
    (a.roomNumber || '').toString().localeCompare((b.roomNumber || '').toString(), undefined, { numeric: true })
  );

  return res.json({
    success: true,
    count: finalRooms.length,
    data: finalRooms 
  });
}

async function handleGetOne(req, res, id) {
  const roomDoc = await db.collection('rooms').doc(id).get();
  if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

  const roomData = { id: roomDoc.id, ...roomDoc.data() };

  // Calculate Dynamic Status for Single Room
  const now = new Date();
  const bookingsSnapshot = await db.collection('bookings')
    .where('roomId', '==', id)
    .where('status', 'in', ['confirmed', 'pending'])
    .where('checkOut', '>', admin.firestore.Timestamp.fromDate(now))
    .orderBy('checkIn', 'asc') // Get earliest first
    .get();

  if (roomData.status !== 'Maintenance') {
    let calculatedStatus = 'Available';
    let nextAvailable = null;

    for (const doc of bookingsSnapshot.docs) {
      const b = doc.data();
      const checkIn = b.checkIn.toDate();
      const checkOut = b.checkOut.toDate();

      if (now >= checkIn && now < checkOut) {
        calculatedStatus = 'Occupied';
        nextAvailable = checkOut;
        break;
      }
    }
    
    roomData.status = calculatedStatus;
    roomData.nextAvailable = nextAvailable ? nextAvailable.toISOString() : null;
  }

  return res.json({ success: true, data: roomData });
}

async function handleCreate(req, res, user) {
  if (!hasRole(user, ['admin', 'manager'])) return res.status(403).json({ error: 'Unauthorized' });

  const { roomNumber, type, price, status, amenities, description } = req.body;

  if (!roomNumber || !type || !price) {
    return res.status(400).json({ error: 'Room Number, Type, and Price are required.' });
  }

  const existingRoom = await db.collection('rooms').where('roomNumber', '==', roomNumber).limit(1).get();
  if (!existingRoom.empty) return res.status(409).json({ error: `Room ${roomNumber} already exists.` });

  const roomData = {
    roomNumber,
    type,
    price: Number(price),
    status: status || 'Available',
    amenities: amenities || [],
    description: description || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: user.uid 
  };

  const roomRef = await db.collection('rooms').add(roomData);

  return res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: { id: roomRef.id, ...roomData }
  });
}

async function handleUpdate(req, res, user, id) {
  if (!hasRole(user, ['admin', 'manager', 'receptionist'])) return res.status(403).json({ error: 'Unauthorized' });

  const updates = req.body;
  const { roomNumber, type, price, status, amenities, description } = updates;

  const roomRef = db.collection('rooms').doc(id);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

  // Check duplicate number if changed
  if (roomNumber && roomNumber !== roomDoc.data().roomNumber) {
      const duplicateCheck = await db.collection('rooms').where('roomNumber', '==', roomNumber).limit(1).get();
      if (!duplicateCheck.empty) return res.status(409).json({ error: `Room ${roomNumber} already exists.` });
  }

  const cleanUpdates = {
    ...(roomNumber && { roomNumber }),
    ...(type && { type }),
    ...(price && { price: Number(price) }),
    ...(status && { status }),
    ...(amenities && { amenities }),
    ...(description && { description }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: user.uid
  };

  // 🟢 FORCE END ACTIVE BOOKINGS LOGIC
  // If Admin manually sets status to 'Available' or 'Maintenance', 
  // we must end any currently running bookings to reflect this state immediately.
  if (status === 'Available' || status === 'Maintenance') {
    const now = new Date();
    
    const activeBookingsSnapshot = await db.collection('bookings')
      .where('roomId', '==', id)
      .where('status', 'in', ['confirmed', 'pending'])
      .where('checkOut', '>', admin.firestore.Timestamp.fromDate(now))
      .get();

    const batch = db.batch();
    let updatesCount = 0;

    activeBookingsSnapshot.forEach(doc => {
      const data = doc.data();
      // If booking started in the past (is active now)
      if (data.checkIn.toDate() <= now) {
        batch.update(doc.ref, {
          checkOut: admin.firestore.Timestamp.fromDate(now),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatesCount++;
      }
    });

    if (updatesCount > 0) await batch.commit();
  }

  await roomRef.update(cleanUpdates);

  return res.json({
    success: true,
    message: 'Room updated successfully',
    data: { id, ...cleanUpdates }
  });
}

async function handleDelete(req, res, user, id) {
  if (!hasRole(user, ['admin', 'manager'])) return res.status(403).json({ error: 'Unauthorized' });

  const roomRef = db.collection('rooms').doc(id);
  const roomDoc = await roomRef.get();
  
  if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

  await roomRef.delete();

  return res.json({
    success: true,
    message: 'Room deleted successfully',
    data: { id }
  });
}