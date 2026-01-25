import { admin, db } from '../../../libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole } from '../../../libs/middleware';
import Cors from 'cors';

const cors = Cors({ methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'] });

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  const { params } = req.query;
  const roomId = params ? params[0] : null;

  try {
    if (!roomId && req.method === 'GET') return handleList(req, res);
    if (roomId && req.method === 'GET') return handleGetOne(req, res, roomId);

    const user = await verifyToken(req, res);
    if (!user) return; 

    if (!roomId && req.method === 'POST') return handleCreate(req, res, user);
    if (roomId && req.method === 'PUT') return handleUpdate(req, res, user, roomId);
    if (roomId && req.method === 'DELETE') return handleDelete(req, res, user, roomId);

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

  // 2. Fetch Active Bookings
  const now = new Date();
  const bookingsSnapshot = await db.collection('bookings')
    .where('status', 'in', ['confirmed', 'pending', 'checked-in']) // Added 'checked-in' just in case
    .where('checkOut', '>', admin.firestore.Timestamp.fromDate(now))
    .get();

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
    // Priority 1: Maintenance overrides everything
    if (room.status === 'Maintenance') {
      return { ...room, nextAvailable: null };
    }

    const roomBookings = bookingsByRoom[room.id] || [];
    roomBookings.sort((a, b) => a.checkIn - b.checkIn);

    // FIX: Initialize with current DB status instead of defaulting to 'Available'
    // If the DB says 'Occupied' or 'Booked', we keep it, unless we calculate otherwise.
    let calculatedStatus = ['Occupied', 'Booked'].includes(room.status) ? room.status : 'Available';
    let nextAvailable = room.nextAvailable || null;

    // Check actual bookings to verify/force Occupancy
    for (const booking of roomBookings) {
      // If now is inside the booking window
      if (now >= booking.checkIn && now < booking.checkOut) {
        calculatedStatus = 'Occupied';
        nextAvailable = booking.checkOut.toISOString();
        break; 
      }
    }

    return {
      ...room,
      status: calculatedStatus,
      nextAvailable: nextAvailable
    };
  });

  // 4. Apply Status Filter
  const finalRooms = filterStatus 
    ? processedRooms.filter(r => r.status === filterStatus)
    : processedRooms;

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
  const now = new Date();
  
  // Only calculate if not maintenance
  if (roomData.status !== 'Maintenance') {
    const bookingsSnapshot = await db.collection('bookings')
      .where('roomId', '==', id)
      .where('status', 'in', ['confirmed', 'pending', 'checked-in'])
      .where('checkOut', '>', admin.firestore.Timestamp.fromDate(now))
      .orderBy('checkIn', 'asc')
      .limit(1)
      .get();

    if (!bookingsSnapshot.empty) {
       const b = bookingsSnapshot.docs[0].data();
       const checkIn = b.checkIn.toDate();
       const checkOut = b.checkOut.toDate();
       
       if (now >= checkIn && now < checkOut) {
         roomData.status = 'Occupied';
         roomData.nextAvailable = checkOut.toISOString();
       }
    }
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
  const { roomNumber, type, price, status, amenities, description, nextAvailable } = updates;

  const roomRef = db.collection('rooms').doc(id);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) return res.status(404).json({ error: 'Room not found' });

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
    // Allow updating nextAvailable directly (useful for manual Occupied status)
    ...(nextAvailable !== undefined && { nextAvailable }), 
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: user.uid
  };

  // Logic to clear active bookings if set to Available/Maintenance
  if (status === 'Available' || status === 'Maintenance') {
    const now = new Date();
    const activeBookingsSnapshot = await db.collection('bookings')
      .where('roomId', '==', id)
      .where('status', 'in', ['confirmed', 'pending'])
      .where('checkOut', '>', admin.firestore.Timestamp.fromDate(now))
      .get();

    const batch = db.batch();
    activeBookingsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.checkIn.toDate() <= now) {
        batch.update(doc.ref, {
          checkOut: admin.firestore.Timestamp.fromDate(now),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    if (!activeBookingsSnapshot.empty) await batch.commit();
    cleanUpdates.nextAvailable = null;
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
  await roomRef.delete();
  return res.json({ success: true, message: 'Room deleted successfully' });
}