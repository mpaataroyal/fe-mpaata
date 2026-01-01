'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, RefreshCw, 
  Home, Banknote, CheckCircle, AlertTriangle, Loader2 // <--- Changed DollarSign to Banknote
} from 'lucide-react';
import DashboardLayout from '@/layout';
import { api } from '@/libs/apiAgent'; 

const AMENITY_OPTIONS = [
  'Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 
  'Ocean View', 'Balcony', 'Room Service', 
  'Jacuzzi', 'Kitchenette', 'Work Desk'
];

const ROOM_TYPES = [
  'Standard Room', 'Deluxe Suite', 
  'Ocean View', 'Presidential Suite', 'Family Room'
];

const RoomsPage = () => {
  // --- State ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [submitting, setSubmitting] = useState(false); 
  const [searchText, setSearchText] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Standard Room',
    price: '',
    status: 'Available',
    nextAvailable: '',
    amenities: [],
    description: ''
  });

  // --- 1. Fetch Rooms ---
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await api.rooms.getAll();
      const rawData = response.data || response.rooms || response || [];
      
      const formattedRooms = Array.isArray(rawData) ? rawData.map(room => ({
        key: room.id || room._id, 
        ...room
      })) : [];

      setRooms(formattedRooms);
    } catch (error) {
      console.error(error);
      alert('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // --- 2. Form Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity) // Remove
          : [...prev.amenities, amenity] // Add
      };
    });
  };

  const openModal = (room = null) => {
    if (room) {
      setEditingId(room.key);
      setFormData({
        roomNumber: room.roomNumber,
        type: room.type,
        price: room.price,
        status: room.status,
        nextAvailable: room.nextAvailable ? new Date(room.nextAvailable).toISOString().split('T')[0] : '',
        amenities: room.amenities || [],
        description: room.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        roomNumber: '',
        type: 'Standard Room',
        price: '',
        status: 'Available',
        nextAvailable: '',
        amenities: [],
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Prepare Payload
    const payload = {
      ...formData,
      price: Number(formData.price),
      nextAvailable: formData.status === 'Available' ? null : formData.nextAvailable,
    };

    try {
      if (editingId) {
        await api.rooms.update(editingId, payload);
      } else {
        await api.rooms.create(payload);
      }
      setIsModalOpen(false);
      fetchRooms(); 
    } catch (error) {
      console.error(error);
      alert('Operation failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    
    try {
      await api.rooms.delete(id);
      setRooms(prev => prev.filter(r => r.key !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete room');
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
      <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.Maintenance}`}>
        {status}
      </span>
    );
  };

  const filteredRooms = rooms.filter(
    (item) =>
      item.roomNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
      <div className="p-6 md:p-12 font-sans text-gray-900">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">Room Management</h1>
            <p className="text-gray-500 text-sm">Manage hotel inventory and pricing.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchRooms} 
              className="px-4 py-2 border border-gray-200 bg-white hover:border-[#D4AF37] text-gray-600 rounded-[2px] text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button 
              onClick={() => openModal()}
              className="px-4 py-2 bg-[#0F2027] text-[#D4AF37] border border-[#0F2027] hover:bg-[#1a2e38] rounded-[2px] text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"
            >
              <Plus size={16} /> Add Room
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-[2px] shadow-sm border border-gray-100 mb-6 flex items-center gap-3 max-w-md">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search Room Number or Type..."
            className="flex-1 bg-transparent outline-none text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Room No.</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price / Night</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amenities</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Next Available</th>
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
                      <td className="px-6 py-4">
                         <div className="flex flex-wrap gap-1">
                           {room.amenities && room.amenities.slice(0, 2).map(a => (
                             <span key={a} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded border border-gray-200">{a}</span>
                           ))}
                           {room.amenities && room.amenities.length > 2 && (
                             <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded border border-gray-200">+{room.amenities.length - 2}</span>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {room.status === 'Available' ? (
                          <span className="text-green-600 font-medium">Now</span>
                        ) : room.nextAvailable ? (
                          <span className="text-gray-500">{new Date(room.nextAvailable).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-gray-400 italic">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(room)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(room.key)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
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
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2px] shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf7]">
                <h3 className="font-serif text-lg text-[#0F2027] font-bold">
                  {editingId ? `Edit Room` : 'Add New Room'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
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
                      <label className="text-xs font-bold text-gray-500 uppercase">Price per Night (UGX) *</label>
                      <div className="relative">
                        {/* 🟢 CHANGED TO BANKNOTE ICON */}
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
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Room Type *</label>
                      <select 
                        required
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white"
                      >
                        {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
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
                </div>

                {/* Next Available Date (Conditional) */}
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

                {/* Amenities Selector */}
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Amenities</label>
                   <div className="flex flex-wrap gap-2">
                     {AMENITY_OPTIONS.map(amenity => {
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
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : (editingId ? 'Update Room' : 'Create Room')}
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