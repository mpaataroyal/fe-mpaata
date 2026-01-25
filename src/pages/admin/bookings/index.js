'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, RefreshCw, X, Edit2, 
  User, Phone, Mail, Calendar, 
  CreditCard, Banknote, Smartphone, Loader2, AlertTriangle, CheckCircle, Hash 
} from 'lucide-react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

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
  
  // Specific state for Merchant Sub-tabs
  const [merchantType, setMerchantType] = useState('MoMo Pay'); 

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
    receivedBy: '',
    transactionId: '' 
  });

  const [roomWarning, setRoomWarning] = useState(null); 

  // --- 1. Fetch Data & Sync Logic ---
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

      // Determine Room Occupancy from Bookings
      const now = dayjs();
      const occupiedRooms = new Set();

      rawBookings.forEach(booking => {
        const start = dayjs(booking.checkIn);
        const end = dayjs(booking.checkOut);
        
        if (
          ['confirmed', 'pending', 'checked-in'].includes(booking.status) &&
          now.isSameOrAfter(start.subtract(1, 'hour')) && 
          now.isBefore(end)
        ) {
          occupiedRooms.add(booking.roomId);
        }
      });

      const processedRooms = rawRooms.map(room => {
        const id = room.id || room._id;
        if (occupiedRooms.has(id) && room.status !== 'Maintenance') {
          return { ...room, status: 'Occupied' };
        }
        return room;
      });

      const roomMap = {};
      processedRooms.forEach(r => {
        const id = r.id || r._id;
        roomMap[id] = r;
      });

      const formattedBookings = rawBookings.map(b => {
        const room = roomMap[b.roomId];
        const displayRoomName = room 
          ? `${room.roomNumber} - ${room.type}` 
          : (b.roomName || 'Unknown');

        return { 
          key: b.id, 
          ...b,
          roomName: displayRoomName 
        };
      });

      setBookings(formattedBookings);
      setRooms(processedRooms);
      
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'guestPhone' && formData.paymentMethod === 'Mobile Money') {
      setFormData(prev => ({ ...prev, paymentPhone: value }));
    }

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
    } 
  };

  // --- 3. CRUD Operations ---

  const openModal = (booking = null) => {
    setRoomWarning(null);
    setMerchantType('MoMo Pay');
    
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
        receivedBy: booking.receivedBy || '',
        transactionId: booking.transactionId || ''
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
        receivedBy: '',
        transactionId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.guestName || !formData.roomId || !formData.checkIn || !formData.checkOut) {
      alert("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    let finalStatus = 'pending';
    let finalPaymentStatus = 'unpaid';

    const isManualPayment = ['Cash', 'Merchant Pay'].includes(formData.paymentMethod);

    if (isManualPayment) {
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
      receivedBy: isManualPayment ? formData.receivedBy : null,
      transactionId: formData.paymentMethod === 'Merchant Pay' ? formData.transactionId : null,
      providerDetail: formData.paymentMethod === 'Merchant Pay' ? merchantType : null
    };

    try {
      if (editingId) {
        await api.bookings.update(editingId, payload);
      } else {
        await api.bookings.create(payload);
      }

      // Force Update Room Status
      const now = dayjs();
      const start = dayjs(payload.checkIn);
      const end = dayjs(payload.checkOut);

      if (now.isSameOrAfter(start.subtract(1, 'hour')) && now.isBefore(end)) {
         console.log("Forcing Room Status to Occupied...");
         await api.rooms.update(payload.roomId, {
           status: 'Occupied',
           nextAvailable: payload.checkOut
         });
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

  const filteredBookings = bookings.filter(item =>
      item.guestName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.roomName && item.roomName.toLowerCase().includes(searchText.toLowerCase()))
  );

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
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">Bookings</h1>
            <p className="text-gray-500 text-sm">Manage reservations and occupancy.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search guest, room or ID..."
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
                        {booking.roomName}
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
                             {booking.paymentMethod === 'Cash' && <Banknote size={12} />}
                             {booking.paymentMethod === 'Mobile Money' && <Smartphone size={12} />}
                             {booking.paymentMethod === 'Merchant Pay' && <Hash size={12} />}
                             <span className={booking.paymentStatus === 'paid' ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                                {booking.paymentStatus ? booking.paymentStatus.toUpperCase() : 'UNPAID'}
                             </span>
                          </div>
                          {booking.transactionId && (
                            <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1 rounded w-fit">
                              ID: {booking.transactionId}
                            </span>
                          )}
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
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf7]">
                <h3 className="font-serif text-lg text-[#0F2027] font-bold">
                  {editingId ? 'Edit Booking' : 'New Reservation'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Guest Details */}
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

                {/* Room & Dates */}
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
                        <option key={room.id} value={room.id} disabled={room.status === 'Occupied' || room.status === 'Booked'}>
                          {room.roomNumber} - {room.type} (UGX {room.price?.toLocaleString()}) {room.status === 'Occupied' ? '(Occupied)' : ''}
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

                {/* Payment Section */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Method</h4>
                  
                  <div className="flex bg-gray-100 p-1 rounded-[2px] mb-4 overflow-x-auto">
                    {['Mobile Money', 'Merchant Pay', 'Cash'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                        className={`flex-1 py-2 px-2 text-xs font-medium rounded-[1px] transition-all whitespace-nowrap ${
                          formData.paymentMethod === method 
                            ? 'bg-white text-[#0F2027] shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

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

                    {formData.paymentMethod === 'Merchant Pay' && (
                      <div>
                        <div className="flex items-center gap-2 mb-4 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs">Payment verified by staff. Booking will be <b>Confirmed</b>.</span>
                        </div>

                        {/* Secondary Tabs for Merchant Provider */}
                        <div className="flex border-b border-gray-200 mb-4">
                           {['MoMo Pay', 'Airtel Pay'].map((type) => (
                             <button
                               key={type}
                               type="button"
                               onClick={() => setMerchantType(type)}
                               className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                                 merchantType === type 
                                  ? 'border-[#0F2027] text-[#0F2027]' 
                                  : 'border-transparent text-gray-400 hover:text-gray-600'
                               }`}
                             >
                               {type}
                             </button>
                           ))}
                        </div>

                        {/* Display Code based on Sub-tab */}
                        <div className="mb-4 p-3 bg-white border border-dashed border-gray-300 rounded text-center">
                          {merchantType === 'MoMo Pay' ? (
                             <div className="flex flex-col gap-1">
                               <p className="text-xs text-gray-400">MoMo Pay Code</p>
                               <span className="text-lg font-bold text-[#0F2027]">92620395</span>
                             </div>
                          ) : (
                             <div className="flex flex-col gap-1">
                               <p className="text-xs text-gray-400">Airtel Pay Code</p>
                               <span className="text-lg font-bold text-red-600">4392569</span>
                             </div>
                          )}
                        </div>
                        
                        {/* Transaction ID Input - For Both MoMo and Airtel */}
                        {(merchantType === 'MoMo Pay' || merchantType === 'Airtel Pay') && (
                          <div className="space-y-1 mb-4">
                            <label className="text-xs text-gray-500 font-bold">Transaction ID *</label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-2.5 text-gray-400" size={16} />
                              <input 
                                required
                                name="transactionId"
                                value={formData.transactionId}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                                placeholder={`Enter ${merchantType.split(' ')[0]} transaction ID...`} 
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Verified By (Staff) *</label>
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

                    {formData.paymentMethod === 'Cash' && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs">Booking will be <b>Confirmed</b> immediately.</span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-gray-500">Received By (Staff) *</label>
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