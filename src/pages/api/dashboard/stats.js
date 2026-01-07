import { db } from '@/libs/firebaseAdmin';
import { runMiddleware, verifyToken, hasRole } from '@/libs/middleware';
import Cors from 'cors';
import { DateTime, Interval } from 'luxon';

const cors = Cors({ methods: ['GET', 'HEAD'] });

const initChartMap = (range) => {
  const map = new Map();
  const now = DateTime.now();
  const data = [];

  if (range === '1y') {
    for (let i = 11; i >= 0; i--) {
      const dt = now.minus({ months: i });
      const key = dt.toFormat('yyyy-MM');
      const entry = { name: dt.toFormat('MMM yyyy'), key, revenue: 0, bookings: 0 };
      map.set(key, entry);
      data.push(entry);
    }
  } else {
    const days = range === '30d' ? 30 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const dt = now.minus({ days: i });
      const key = dt.toISODate();
      const entry = { name: dt.toFormat('MMM dd'), key, revenue: 0, bookings: 0 };
      map.set(key, entry);
      data.push(entry);
    }
  }
  return { map, array: data };
};

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  const user = await verifyToken(req, res);
  if (!user) return;
  
  if (!hasRole(user, ['admin', 'manager'])) return res.status(403).json({ error: 'Unauthorized' });

  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { range = '7d' } = req.query;
    const now = DateTime.now();
    
    // NOTE: In production with lots of data, you shouldn't fetch ALL docs.
    // Use Firestore COUNT() queries or aggregation bundles. keeping as-is for parity.
    const [bookingsSnap, paymentsSnap, roomsSnap, usersSnap] = await Promise.all([
      db.collection('bookings').get(),
      db.collection('payments').get(),
      db.collection('rooms').get(),
      db.collection('users').get()
    ]);

    const { map: chartMap, array: chartArray } = initChartMap(range);
    let totalRevenue = 0;
    let activeBookingsCount = 0;
    const recentBookings = [];

    bookingsSnap.forEach(doc => {
      const b = { id: doc.id, ...doc.data() };
      const bookingDate = DateTime.fromJSDate(b.createdAt ? b.createdAt.toDate() : new Date());
      const checkIn = b.checkIn ? DateTime.fromJSDate(b.checkIn.toDate()) : now;
      const checkOut = b.checkOut ? DateTime.fromJSDate(b.checkOut.toDate()) : now;

      const matchKey = range === '1y' ? bookingDate.toFormat('yyyy-MM') : bookingDate.toISODate();

      if (chartMap.has(matchKey)) {
        const entry = chartMap.get(matchKey);
        entry.bookings += 1;
        if (b.paymentStatus === 'paid' || b.status === 'confirmed') {
          entry.revenue += (Number(b.totalPrice) || 0);
        }
      }

      if (b.paymentStatus === 'paid' || b.status === 'confirmed') totalRevenue += (Number(b.totalPrice) || 0);

      const stayInterval = Interval.fromDateTimes(checkIn, checkOut);
      if (stayInterval.contains(now) && b.status !== 'cancelled') activeBookingsCount++;

      if (recentBookings.length < 5) {
        recentBookings.push({ key: b.id, id: b.id, guest: b.guestName, amount: b.totalPrice, status: b.status });
      }
    });

    const paymentMethods = {};
    paymentsSnap.forEach(doc => {
      const p = doc.data();
      let method = p.provider || p.method || 'Cash';
      if (method.toLowerCase().includes('mobile')) method = 'Mobile Money';
      else if (method.toLowerCase().includes('card')) method = 'Visa';
      else method = 'Cash';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    const paymentChartData = Object.keys(paymentMethods).map(k => ({ name: k, value: paymentMethods[k] }));

    res.json({
      success: true,
      stats: {
        range,
        revenue: { total: totalRevenue, chart: chartArray },
        bookings: { active: activeBookingsCount, recent: recentBookings },
        rooms: { total: roomsSnap.size, available: Math.max(0, roomsSnap.size - activeBookingsCount) },
        users: { total: usersSnap.size },
        payments: { breakdown: paymentChartData }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}