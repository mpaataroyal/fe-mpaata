'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wifi, Tv, Wind, Maximize, CheckCircle, 
  Menu, X, Phone, Mail, MapPin, ChevronRight, Star, 
  Calendar, User, Filter, ArrowRight, Loader2, Search
} from 'lucide-react';
import { api } from '@/libs/apiAgent';

/**
 * MPAATA EMPIRE - ROOMS PAGE
 * Public facing rooms listing with specific filters.
 */

// --- Design Assets ---
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
  roomPlaceholder: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop"
};

// --- Helper: Estimate Capacity ---
// Since backend might not have capacity field yet, we infer from type
const getCapacity = (room) => {
  if (room.capacity) return room.capacity;
  const type = room.type?.toLowerCase() || '';
  if (type.includes('family') || type.includes('penthouse')) return 4;
  if (type.includes('triple')) return 3;
  if (type.includes('suite') || type.includes('deluxe')) return 2;
  return 2; // Default
};

// --- Helper: Map Amenities to Icons ---
const getAmenityIcon = (amenity) => {
  const normalized = amenity.toLowerCase();
  if (normalized.includes('wi-fi') || normalized.includes('wifi')) return <Wifi size={14} />;
  if (normalized.includes('tv')) return <Tv size={14} />;
  if (normalized.includes('air') || normalized.includes('ac')) return <Wind size={14} />;
  if (normalized.includes('balcony')) return <Maximize size={14} />;
  return <CheckCircle size={14} />;
};

// --- Components ---

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm py-4 text-[#0F2027]">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 border-2 border-[#0F2027] flex items-center justify-center">
            <span className="font-serif text-xl text-[#0F2027]">M</span>
          </div>
          <span className="font-serif text-xl md:text-2xl tracking-widest font-semibold uppercase">MPAATA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-sans text-xs tracking-[0.15em] uppercase font-medium">
          {['Home', 'Royal Suits'].map((item) => (
            <a key={item} href={item === 'Home' ? '/' : '/rooms'} className="hover:text-[#D4AF37] transition-colors">{item}</a>
          ))}
          <button onClick={() => router.push('/dashboard/bookings')} className="bg-gradient-to-r from-[#0F2027] via-[#203A43] to-[#2C5364] text-[#D4AF37] border border-[#D4AF37] px-6 py-2.5 rounded-[2px] hover:brightness-110 transition-all">
            Book Now
          </button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg p-6 flex flex-col gap-4 md:hidden">
           <a href="/" className="text-[#0F2027] font-serif text-lg">Home</a>
           <a href="/rooms" className="text-[#0F2027] font-serif text-lg">Royal Suits</a>
        </div>
      )}
    </nav>
  );
};

const RoomCard = ({ room }) => {
  return (
    <div className="group bg-white rounded-[2px] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-gray-100 hover:border-[#D4AF37]">
      {/* Image */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-[#0F2027]/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img 
          src={room.image || IMAGES.roomPlaceholder} 
          alt={room.type} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute top-4 right-4 z-20">
            <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${room.status === 'Available' ? 'bg-[#D4AF37] text-[#0F2027]' : 'bg-gray-200 text-gray-500'}`}>
                {room.status}
            </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="font-serif text-xl text-[#0F2027] mb-1 group-hover:text-[#D4AF37] transition-colors">
                    {room.type}
                </h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  Room {room.roomNumber} • {getCapacity(room)} Guests
                </p>
            </div>
            <div className="text-right">
                <span className="block font-serif text-lg text-[#D4AF37] font-bold">
                    UGX {Number(room.price).toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 uppercase">Per Night</span>
            </div>
        </div>

        <div className="w-12 h-[2px] bg-gray-100 group-hover:bg-[#D4AF37] transition-colors mb-6"></div>

        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
            {room.description || "Experience the pinnacle of luxury in our meticulously designed suites, featuring satin blue accents and royal gold finishes."}
        </p>

        {/* Amenities */}
        <div className="mb-8">
            <div className="flex flex-wrap gap-2">
                {room.amenities && room.amenities.length > 0 ? (
                    room.amenities.slice(0, 4).map((amenity, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fcfbf7] border border-gray-200 rounded-[2px] text-xs text-gray-600">
                            {getAmenityIcon(amenity)}
                            {amenity}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-gray-400 italic">Standard amenities included</span>
                )}
            </div>
        </div>

        {/* Action */}
        <div className="mt-auto pt-6 border-t border-gray-50">
            <button className="w-full group/btn flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0F2027] hover:text-[#D4AF37] transition-colors">
                View Details 
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-[#0F2027] text-white py-12 text-center border-t-4 border-[#D4AF37]">
    <h2 className="font-serif text-2xl mb-6">MPAATA Empire</h2>
    <p className="text-gray-400 text-sm mb-8">Hoima City, Bujumbura Division, Rusaka</p>
    <div className="flex justify-center gap-6 text-xs uppercase tracking-widest text-[#D4AF37]">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Contact</a>
    </div>
  </footer>
);

// --- Page Component ---

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Balcony', 'Ground Floor', 'First Floor'
  const [occupants, setOccupants] = useState('Any'); // 'Any', '1', '2', '3', '4+'

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const response = await api.rooms.getAll();
        const rawData = response.data || response.rooms || [];
        setRooms(rawData);
        setFilteredRooms(rawData);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // --- Filtering Logic ---
  useEffect(() => {
    let result = rooms;

    // 1. Filter by Category (Buttons)
    if (activeFilter === 'Balcony') {
      result = result.filter(r => r.amenities?.some(a => a.toLowerCase().includes('balcony')));
    } else if (activeFilter === 'Ground Floor') {
      // Assuming Ground floor rooms start with 1 (e.g., 101, 102)
      result = result.filter(r => r.roomNumber && r.roomNumber.toString().startsWith('1'));
    } else if (activeFilter === 'First Floor') {
      // Assuming First floor rooms start with 2 (e.g., 201, 205)
      result = result.filter(r => r.roomNumber && r.roomNumber.toString().startsWith('2'));
    }

    // 2. Filter by Occupants (Dropdown)
    if (occupants !== 'Any') {
      const minGuests = occupants === '4+' ? 4 : parseInt(occupants);
      result = result.filter(r => getCapacity(r) >= minGuests);
    }

    setFilteredRooms(result);
  }, [activeFilter, occupants, rooms]);

  return (
    <div className="min-h-screen bg-[#fcfbf7] font-sans text-gray-900">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-[25vh] min-h-[250px] flex items-end justify-center pb-10 text-center text-white px-4">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.hero} 
            alt="Royal Suites" 
            className="w-full h-full object-cover brightness-[0.5]" 
          />
           <div className="absolute inset-0 bg-[#0F2027]/40 mix-blend-overlay"></div>
        </div>
        <div className="relative z-10 animate-fade-in-up">
            <span className="block font-sans text-xs tracking-[0.3em] uppercase mb-4 text-[#D4AF37]">
                Accommodations
            </span>
            <h1 className="font-serif text-4xl md:text-6xl text-white">
                The Royal <span className="text-[#F3E5AB] italic">Chambers</span>
            </h1>
        </div>
      </div>

      {/* --- Filter Bar --- */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-6 items-center justify-between">
            
            {/* Left: Occupants Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-gray-500 text-sm min-w-fit">
                    <User size={16} />
                    <span className="uppercase tracking-wider text-xs font-bold">Occupants:</span>
                </div>
                <select 
                  value={occupants}
                  onChange={(e) => setOccupants(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-1.5 focus:border-[#D4AF37] outline-none text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="Any">Any Guests</option>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4+">4+ Guests (Family)</option>
                </select>
            </div>

            {/* Right: Feature Filters */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                {['All', 'Balcony', 'Ground Floor', 'First Floor'].map((filter) => (
                    <button 
                        key={filter} 
                        onClick={() => setActiveFilter(filter)}
                        className={`text-xs uppercase tracking-widest px-5 py-2 rounded-full border transition-all whitespace-nowrap ${
                            activeFilter === filter 
                            ? 'bg-[#0F2027] text-[#D4AF37] border-[#0F2027] shadow-md' 
                            : 'bg-transparent text-gray-500 border-gray-200 hover:border-[#D4AF37] hover:text-[#0F2027]'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
          </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 size={40} className="animate-spin text-[#D4AF37] mb-4" />
                <p className="text-[#0F2027] font-serif text-lg animate-pulse">Preparing your quarters...</p>
            </div>
        ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2px] border border-dashed border-gray-200">
                <Search className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-xl font-serif text-gray-400 mb-2">No Suites Found</h3>
                <p className="text-sm text-gray-400 mb-6">Try adjusting your filters to find available rooms.</p>
                <button 
                    onClick={() => { setActiveFilter('All'); setOccupants('Any'); }}
                    className="px-6 py-2 bg-[#0F2027] text-white text-xs uppercase tracking-widest rounded-[2px] hover:bg-[#203A43]"
                >
                    Clear Filters
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRooms.map((room) => (
                    <RoomCard key={room.id || room._id || room.key} room={room} />
                ))}
            </div>
        )}
      </main>

      <Footer />

      <style jsx global>{`
          /* Hide Scrollbar for filter overflow */
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 1s ease-out forwards;
          }
      `}</style>
    </div>
  );
};

export default RoomsPage;