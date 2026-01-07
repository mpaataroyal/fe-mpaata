'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, RefreshCw, X, Edit2, 
  User, Phone, Mail, Calendar, 
  CreditCard, Banknote, Smartphone, Loader2, AlertTriangle, CheckCircle 
} from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

// Adjusted imports based on typical Next.js src/ structure
// Assuming:
// src/pages/bookings.jsx
// src/layout.jsx (or src/components/layout.jsx) -> trying ../layout first if it's in src
// src/libs/apiAgent.js -> trying ../libs/apiAgent

import DashboardLayout from '@/layout';
import { api } from '@/libs/apiAgent'; 

const BookingsPage = () => {
  // --- State ---
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]); 
  const [staff, setStaff] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '+256',
    guestEmail: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    paymentMethod: 'Mobile Money',
    paymentPhone: '+256',
    receivedBy: ''
  });

  const [roomWarning, setRoomWarning] = useState(null); 

  // --- 1. Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, roomsRes, usersRes] = await Promise.all([
        api.bookings.getAll(),
        api.rooms.getAll(),
        api.users.getAll() 
      ]);

      const rawBookings = bookingsRes.bookings || [];
      const rawRooms = roomsRes.data || [];
      const rawUsers = usersRes.users || [];

      // Ensure bookings map correctly
      setBookings(rawBookings.map(b => ({ key: b.id, ...b })));
      setRooms(rawRooms);
      
      const staffMembers = rawUsers.filter(u => 
        ['manager', 'receptionist', 'admin'].includes(u.role)
      );
      setStaff(staffMembers);

    } catch (error) {
      console.error(error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. Logic Helpers ---

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Sync payment phone if using mobile money
    if (name === 'guestPhone' && formData.paymentMethod === 'Mobile Money') {
      setFormData(prev => ({ ...prev, paymentPhone: value }));
    }

    // Trigger room availability check
    if (name === 'roomId') {
      checkRoomAvailability(value);
    }
  };

  const checkRoomAvailability = (roomId) => {
    setRoomWarning(null);

    const roomBookings = bookings.filter(b => 
      b.roomId === roomId && 
      b.status !== 'cancelled' &&
      b.id !== editingId
    );

    const now = dayjs();
    const currentBooking = roomBookings.find(b => 
      now.isBetween(dayjs(b.checkIn), dayjs(b.checkOut), null, '[]')
    );

    if (currentBooking) {
      const availableTime = dayjs(currentBooking.checkOut);
      setRoomWarning(`Occupied. Available today at ${availableTime.format('HH:mm')}`);
      
      // Auto set start time
      setFormData(prev => ({
        ...prev,
        checkIn: availableTime.format('YYYY-MM-DDTHH:mm'),
        checkOut: availableTime.add(1, 'day').format('YYYY-MM-DDTHH:mm')
      }));
    } else {
      // Default to next hour
      const nextHour = dayjs().add(1, 'hour').startOf('hour');
      setFormData(prev => ({
        ...prev,
        checkIn: nextHour.format('YYYY-MM-DDTHH:mm'),
        checkOut: nextHour.add(1, 'day').format('YYYY-MM-DDTHH:mm')
      }));
    }
  };

  // --- 3. CRUD Operations ---

  const openModal = (booking = null) => {
    setRoomWarning(null);
    if (booking) {
      setEditingId(booking.id);
      setFormData({
        guestName: booking.guestName,
        guestPhone: booking.guestPhone || '+256',
        guestEmail: booking.guestEmail || '',
        roomId: booking.roomId,
        checkIn: dayjs(booking.checkIn).format('YYYY-MM-DDTHH:mm'),
        checkOut: dayjs(booking.checkOut).format('YYYY-MM-DDTHH:mm'),
        guests: booking.guests || 1,
        paymentMethod: booking.paymentMethod || 'Mobile Money',
        paymentPhone: booking.paymentPhone || booking.guestPhone,
        receivedBy: booking.receivedBy || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        guestName: '',
        guestPhone: '+256',
        guestEmail: '',
        roomId: '',
        checkIn: dayjs().hour(14).minute(0).format('YYYY-MM-DDTHH:mm'),
        checkOut: dayjs().add(1, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm'),
        guests: 1,
        paymentMethod: 'Mobile Money',
        paymentPhone: '+256',
        receivedBy: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validation
    if (!formData.guestName || !formData.roomId || !formData.checkIn || !formData.checkOut) {
      alert("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    let finalStatus = 'pending';
    let finalPaymentStatus = 'unpaid';

    if (formData.paymentMethod === 'Cash') {
       finalStatus = 'confirmed';
       finalPaymentStatus = 'paid';
    }

    const payload = {
      ...formData,
      checkIn: new Date(formData.checkIn).toISOString(),
      checkOut: new Date(formData.checkOut).toISOString(),
      status: finalStatus,
      paymentStatus: finalPaymentStatus,
      paymentPhone: formData.paymentMethod === 'Mobile Money' ? formData.paymentPhone : null,
      receivedBy: formData.paymentMethod === 'Cash' ? formData.receivedBy : null,
    };

    try {
      if (editingId) {
        await api.bookings.update(editingId, payload);
      } else {
        await api.bookings.create(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Operation failed';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Filtering ---
  const filteredBookings = bookings.filter(item =>
      item.guestName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- Component: Status Badge ---
  const StatusBadge = ({ status }) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-orange-100 text-orange-700 border-orange-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  return (
      <div className="p-6 md:p-12 font-sans text-gray-900">
        
        {/* Header with Search and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">Bookings</h1>
            <p className="text-gray-500 text-sm">Manage reservations and occupancy.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input Moved Here */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search guest name or ID..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white transition-colors"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={fetchData} 
                className="px-4 py-2 border border-gray-200 bg-white hover:border-[#D4AF37] text-gray-600 rounded-[2px] text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button 
                onClick={() => openModal()}
                className="px-4 py-2 bg-[#0F2027] text-[#D4AF37] border border-[#0F2027] hover:bg-[#1a2e38] rounded-[2px] text-sm font-medium flex items-center gap-2 transition-colors shadow-lg whitespace-nowrap"
              >
                <Plus size={16} /> New Booking
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={24}/></div>
                    </td>
                  </tr>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.key} className="hover:bg-[#fcfbf7] transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {booking.id.slice(0, 6)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F2027] text-sm flex items-center gap-2">
                             <User size={12} className="text-[#D4AF37]" /> {booking.guestName}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                             <Phone size={10} /> {booking.guestPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {booking.roomName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs gap-1">
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">In: {dayjs(booking.checkIn).format('MMM D, HH:mm')}</span>
                          <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded w-fit">Out: {dayjs(booking.checkOut).format('MMM D, HH:mm')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm">UGX {(booking.totalPrice || 0).toLocaleString()}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                             {booking.paymentMethod === 'Cash' ? <Banknote size={12} /> : <Smartphone size={12} />}
                             <span className={booking.paymentStatus === 'paid' ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                                {booking.paymentStatus ? booking.paymentStatus.toUpperCase() : 'UNPAID'}
                             </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openModal(booking)}
                          className="text-gray-400 hover:text-[#0F2027] transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">No bookings found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-[2px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf7]">
                <h3 className="font-serif text-lg text-[#0F2027] font-bold">
                  {editingId ? 'Edit Booking' : 'New Reservation'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Section: Guest */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Guest Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                          required
                          name="guestName"
                          value={formData.guestName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                          required
                          name="guestPhone"
                          value={formData.guestPhone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <label className="text-xs text-gray-500">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input 
                        type="email"
                        name="guestEmail"
                        value={formData.guestEmail}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        placeholder="guest@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Section: Room & Dates */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Room & Schedule</h4>
                  
                  <div className="space-y-1 mb-4">
                    <label className="text-xs text-gray-500">Select Room *</label>
                    <select 
                      name="roomId"
                      value={formData.roomId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white"
                    >
                      <option value="">-- Choose a Room --</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.roomNumber} - {room.type} (UGX {room.price?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {roomWarning && (
                    <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-3 flex items-start gap-3">
                      <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                      <p className="text-xs text-amber-700">{roomWarning}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Check In *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                          type="datetime-local"
                          name="checkIn"
                          required
                          value={formData.checkIn}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Check Out *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                          type="datetime-local"
                          name="checkOut"
                          required
                          value={formData.checkOut}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Section: Payment */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Method</h4>
                  
                  {/* Tabs */}
                  <div className="flex bg-gray-100 p-1 rounded-[2px] mb-4">
                    {['Mobile Money', 'Cash'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                        className={`flex-1 py-2 text-xs font-medium rounded-[1px] transition-all ${
                          formData.paymentMethod === method 
                            ? 'bg-white text-[#0F2027] shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {/* Payment Logic Panel */}
                  <div className="bg-gray-50 p-4 rounded border border-gray-100">
                    {formData.paymentMethod === 'Mobile Money' && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-blue-600">
                          <AlertTriangle size={14} />
                          <span className="text-xs">Status will be <b>Pending</b> until callback received.</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Momo Number</label>
                          <input 
                            name="paymentPhone"
                            value={formData.paymentPhone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-[2px] text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {formData.paymentMethod === 'Cash' && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs">Booking will be <b>Confirmed</b> immediately.</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Received By (Staff)</label>
                          <select 
                            name="receivedBy"
                            value={formData.receivedBy}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-[2px] text-sm bg-white"
                          >
                            <option value="">-- Select Staff --</option>
                            {staff.map(user => (
                              <option key={user.uid} value={user.uid}>
                                {user.displayName || user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-[#0F2027] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#0F2027] text-[#D4AF37] text-sm font-medium rounded-[2px] hover:brightness-110 flex items-center gap-2 shadow-lg"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Booking'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
  );
};

BookingsPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout>
      {page}
    </DashboardLayout>
  );
};

export default BookingsPage;