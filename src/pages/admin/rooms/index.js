'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Home,
  Banknote,
  Loader2,
  Power,
  DollarSign,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/libs/firebase';
import DashboardLayout from '@/layout';
import { api } from '@/libs/apiAgent';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Initialize dayjs plugins
dayjs.extend(isSameOrAfter);

const AMENITY_OPTIONS = [
  'Wi-Fi',
  'TV',
  'Air Conditioning',
  'Mini Bar',
  'Ocean View',
  'Balcony',
  'Room Service',
  'Jacuzzi',
  'Kitchenette',
  'Work Desk',
];

const ROOM_TYPES = [
  'ROYAL 1',
  'ROYAL 2',
  'TWIN SUITE',
  'STANDARD SUITE',
  'DELUXE SUITE',
];

const RoomsPage = () => {
  // --- State ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'STANDARD SUITE',
    price: '',
    priceUSD: '',
    status: 'Available',
    nextAvailable: '',
    amenities: [],
    description: '',
  });

  // --- Auth Check ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdTokenResult();
          setUserRole(token.claims.role || 'client');
        } catch (error) {
          console.error('Error fetching claims', error);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const isAdminOrManager = ['admin', 'manager'].includes(userRole);
  const isReceptionist = userRole === 'receptionist';

  // --- 1. Fetch Rooms & Sync with Bookings ---
  const fetchRooms = async () => {
    setLoading(true);
    try {
      // 1. Always fetch rooms
      const promises = [api.rooms.getAll()];
      
      // 2. Fetch bookings ONLY if admin/manager (to calculate occupancy)
      if (isAdminOrManager) {
        promises.push(api.bookings.getAll());
      }

      const [roomsRes, bookingsRes] = await Promise.all(promises);

      const rawRooms = roomsRes.data || roomsRes.rooms || roomsRes || [];
      const rawBookings = bookingsRes ? (bookingsRes.bookings || []) : [];

      // --- Occupancy Calculation Logic ---
      const now = dayjs();
      const occupiedRoomMap = {};

      if (rawBookings.length > 0) {
        rawBookings.forEach(booking => {
          const start = dayjs(booking.checkIn);
          const end = dayjs(booking.checkOut);
          
          // Logic: Status is active AND time is overlapping
          const isStatusActive = ['confirmed', 'pending', 'checked-in'].includes(booking.status);
          
          // Use core isBefore() and plugin isSameOrAfter()
          const isTimeActive = now.isSameOrAfter(start.subtract(1, 'hour')) && now.isBefore(end);

          if (isStatusActive && isTimeActive) {
            occupiedRoomMap[booking.roomId] = {
              status: 'Booked',
              nextAvailable: booking.checkOut
            };
          }
        });
      }

      // Merge Room Data with Calculated Status
      const formattedRooms = Array.isArray(rawRooms)
        ? rawRooms.map((room) => {
            const id = room.id || room._id;
            const bookingInfo = occupiedRoomMap[id];

            let displayStatus = room.status;
            let displayNextAvailable = room.nextAvailable;

            // Override DB status if we found an active booking in the booking list
            if (bookingInfo && room.status !== 'Maintenance') {
               displayStatus = 'Booked'; 
               displayNextAvailable = bookingInfo.nextAvailable;
            }

            return {
              key: id,
              ...room,
              status: displayStatus,
              nextAvailable: displayNextAvailable
            };
          })
        : [];

      setRooms(formattedRooms);
    } catch (error) {
      console.error(error);
      if (error.response?.status !== 403) {
         alert('Failed to load rooms');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole !== null) {
        fetchRooms();
    }
  }, [userRole]); 

  // --- 2. Form Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const openModal = (room = null) => {
    if (room) {
      setEditingId(room.key);
      setFormData({
        roomNumber: room.roomNumber || '',
        type: room.type || 'STANDARD SUITE',
        price: room.price || '',
        priceUSD: room.priceUSD || '',
        status: room.status || 'Available',
        nextAvailable: room.nextAvailable
          ? new Date(room.nextAvailable).toISOString().split('T')[0]
          : '',
        amenities: room.amenities || [],
        description: room.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        roomNumber: '',
        type: 'STANDARD SUITE',
        price: '',
        priceUSD: '',
        status: 'Available',
        nextAvailable: '',
        amenities: [],
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // --- DEBUG LOGS ---
    console.log('Form Data before payload:', formData);
    console.log('priceUSD value:', formData.priceUSD);
    console.log('priceUSD type:', typeof formData.priceUSD);

    // --- PAYLOAD CONSTRUCTION ---
    const payload = {
      roomNumber: formData.roomNumber,
      type: formData.type,
      price: Number(formData.price) || 0,
      priceUSD: formData.priceUSD ? Number(formData.priceUSD) : 0,
      status: formData.status,
      nextAvailable: formData.status === 'Available' ? null : formData.nextAvailable,
      amenities: formData.amenities,
      description: formData.description,
    };

    console.log('Payload being sent:', payload);
    console.log('Payload stringified:', JSON.stringify(payload, null, 2));

    try {
      if (editingId) {
        // Test: Log the actual API call
        console.log('Calling api.rooms.update with:', { id: editingId, payload });
        const response = await api.rooms.update(editingId, payload);
        console.log('Update response:', response);
      } else {
        // Test: Log the actual API call
        console.log('Calling api.rooms.create with:', payload);
        const response = await api.rooms.create(payload);
        console.log('Create response:', response);
      }
      setIsModalOpen(false);
      fetchRooms(); 
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      alert('Operation failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await api.rooms.delete(id);
      setRooms((prev) => prev.filter((r) => r.key !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete room');
    }
  };

  const handleStatusToggle = async (room) => {
    const newStatus = room.status === 'Available' ? 'Maintenance' : 'Available';
    if (!confirm(`Are you sure you want to ${newStatus === 'Available' ? 'make available' : 'mark unavailable'} Room ${room.roomNumber}?`))
      return;

    try {
      await api.rooms.update(room.key, {
        status: newStatus,
        nextAvailable: null,
      });
      fetchRooms();
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  // --- 3. UI Helpers ---

  const StatusBadge = ({ status }) => {
    const styles = {
      Available: 'bg-green-100 text-green-700 border-green-200',
      Occupied: 'bg-red-100 text-red-700 border-red-200',
      Booked: 'bg-blue-100 text-blue-700 border-blue-200',
      Maintenance: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
      <span
        className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${
          styles[status] || styles.Maintenance
        }`}
      >
        {status}
      </span>
    );
  };

  const filteredRooms = rooms.filter(
    (item) =>
      item.roomNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
      <div className="p-6 md:p-12 font-sans text-gray-900">
        {/* Header with Search and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">
              Room Management
            </h1>
            <p className="text-gray-500 text-sm">
              Manage hotel inventory and pricing.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search Room Number or Type..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white transition-colors"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchRooms}
                className="px-4 py-2 border border-gray-200 bg-white hover:border-[#D4AF37] text-gray-600 rounded-[2px] text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{' '}
                Refresh
              </button>

              {isAdminOrManager && (
                <button
                  onClick={() => openModal()}
                  className="px-4 py-2 bg-[#0F2027] text-[#D4AF37] border border-[#0F2027] hover:bg-[#1a2e38] rounded-[2px] text-sm font-medium flex items-center gap-2 transition-colors shadow-lg whitespace-nowrap"
                >
                  <Plus size={16} /> Add Room
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Room No.
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Price (UGX)
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Price (USD)
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Next Available
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="animate-spin text-[#D4AF37]" size={24} />
                      </div>
                    </td>
                  </tr>
                ) : filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <tr key={room.key} className="hover:bg-[#fcfbf7] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#0F2027]">
                        {room.roomNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {room.type}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={room.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        UGX {Number(room.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        $ {room.priceUSD ? Number(room.priceUSD).toLocaleString() : '0'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {room.status === 'Available' ? (
                          <span className="text-green-600 font-medium">Now</span>
                        ) : room.nextAvailable ? (
                          <span className="text-gray-500">
                            {dayjs(room.nextAvailable).format('MMM D, YYYY')}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdminOrManager && (
                            <>
                              <button onClick={() => openModal(room)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(room.key)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          {isReceptionist && (
                            <button onClick={() => handleStatusToggle(room)} className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-bold border ${room.status === 'Available' ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                              <Power size={14} />
                              {room.status === 'Available' ? 'Disable' : 'Enable'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      No rooms found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL --- */}
        {isModalOpen && isAdminOrManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2px] shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf7]">
                <h3 className="font-serif text-lg text-[#0F2027] font-bold">
                  {editingId ? `Edit Room` : 'Add New Room'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Room Number *</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input
                        required
                        name="roomNumber"
                        value={formData.roomNumber}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        placeholder="e.g. 101"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Room Type *</label>
                    <select
                      required
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white"
                    >
                      {ROOM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price Row: UGX and USD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Price (UGX) *</label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input
                        required
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        placeholder="150000"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Price (USD) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                      <input
                        required
                        type="number"
                        name="priceUSD"
                        value={formData.priceUSD}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                        placeholder="40"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Row */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Status *</label>
                  <select
                    required
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Booked">Booked</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                {/* Next Available */}
                {formData.status !== 'Available' && (
                  <div className="bg-yellow-50 p-4 border border-yellow-100 rounded-[2px]">
                    <label className="text-xs font-bold text-yellow-700 uppercase block mb-1">When will it be available?</label>
                    <input
                      type="date"
                      name="nextAvailable"
                      required
                      value={formData.nextAvailable}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-yellow-200 rounded-[2px] text-sm focus:outline-none focus:border-yellow-500 bg-white"
                    />
                  </div>
                )}

                {/* Amenities */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const isSelected = formData.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            isSelected
                              ? 'bg-[#0F2027] text-[#D4AF37] border-[#0F2027] font-bold shadow-sm'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Enter room details..."
                  ></textarea>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-[#0F2027] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-[#0F2027] text-[#D4AF37] text-sm font-medium rounded-[2px] hover:brightness-110 flex items-center gap-2 shadow-lg">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : editingId ? 'Update Room' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

RoomsPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout>
      {page}
    </DashboardLayout>
  );
};

export default RoomsPage;