import React, { useState, useEffect } from 'react';
import { 
  Wifi, Tv, Wind, Maximize, CheckCircle, 
  Menu, X, Phone, Mail, MapPin, ChevronRight, Star, 
  Calendar, User, Filter, ArrowRight 
} from 'lucide-react';

/**
 * MPAATA EMPIRE - ROOMS PAGE
 * Displays dynamic room data from the backend with luxury styling.
 */

// --- Design Tokens (Matching Main Theme) ---
const THEME = {
  colors: {
    primary: '#0F2027',    // Deep Royal Blue
    secondary: '#D4AF37',  // Metallic Gold
    accent: '#F3E5AB',     // Champagne
    bg: '#fcfbf7',         // Off-white
    text: '#2c2c2c',
    surface: '#ffffff',
  }
};

// --- Dummy Images (as requested) ---
const DUMMY_IMAGES = [
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop", // Ocean View
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop", // Penthouse
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop", // Garden Villa
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2074&auto=format&fit=crop", // Bedroom
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2025&auto=format&fit=crop", // Cozy
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop", // Modern
];

// --- Helper to map string amenities to Icons ---
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
  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm py-4 text-[#0F2027]">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-[#0F2027] flex items-center justify-center">
            <span className="font-serif text-xl text-[#0F2027]">M</span>
          </div>
          <span className="font-serif text-xl md:text-2xl tracking-widest font-semibold uppercase">MPAATA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-sans text-xs tracking-[0.15em] uppercase font-medium">
          {['Home', 'Royal Suits', 'Dining', 'Contact'].map((item) => (
            <a key={item} href="#" className="hover:text-[#D4AF37] transition-colors">{item}</a>
          ))}
          <button className="bg-gradient-to-r from-[#0F2027] via-[#203A43] to-[#2C5364] text-[#D4AF37] border border-[#D4AF37] px-6 py-2.5 rounded-[2px] hover:brightness-110 transition-all">
            Book Now
          </button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

const RoomCard = ({ room, index }) => {
  // Rotate through dummy images
  const image = DUMMY_IMAGES[index % DUMMY_IMAGES.length];

  return (
    <div className="group bg-white rounded-[2px] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-gray-100 hover:border-[#D4AF37]">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-[#0F2027]/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img 
          src={image} 
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
                <h3 className="font-serif text-2xl text-[#0F2027] mb-1 group-hover:text-[#D4AF37] transition-colors">
                    {room.type}
                </h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Room {room.roomNumber}</p>
            </div>
            <div className="text-right">
                <span className="block font-serif text-xl text-[#D4AF37] font-bold">
                    ${room.price.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 uppercase">Per Night</span>
            </div>
        </div>

        <div className="w-12 h-[2px] bg-gray-100 group-hover:bg-[#D4AF37] transition-colors mb-6"></div>

        {/* Description (Fallback if empty) */}
        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
            {room.description || "Experience the pinnacle of luxury in our meticulously designed suites, featuring satin blue accents and royal gold finishes."}
        </p>

        {/* Amenities */}
        <div className="mb-8">
            <span className="text-[10px] font-bold text-[#0F2027] uppercase tracking-widest block mb-3">
                Royal Amenities
            </span>
            <div className="flex flex-wrap gap-2">
                {room.amenities && room.amenities.length > 0 ? (
                    room.amenities.map((amenity, idx) => (
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
                View Details & Book 
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Page Component ---

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MOCK API SIMULATION (Replace with your actual API call)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
        // ---------------------------------------------------------
        // REAL APP: Uncomment this and import 'api'
        // const response = await api.rooms.getAll();
        // setRooms(response.data);
        // ---------------------------------------------------------

        // PREVIEW SIMULATION:
        await new Promise(resolve => setTimeout(resolve, 1000)); // Fake network delay
        const mockData = {
          "success": true,
          "count": 2,
          "data": [
              {
                  "id": "5B73XBDnXjKyAo8Hxgxk",
                  "roomNumber": "101",
                  "type": "Imperial Standard",
                  "price": 20000,
                  "status": "Available",
                  "description": "A cozy retreat featuring our signature satin bedding.",
                  "amenities": ["TV", "Wi-Fi", "Mini Bar"],
              },
              {
                  "id": "sv5Pa3CmQWbMvkCFkFsD",
                  "roomNumber": "102",
                  "type": "Royal Deluxe",
                  "price": 500,
                  "status": "Available",
                  "amenities": ["Wi-Fi", "TV", "Air Conditioning", "Balcony"],
                  "description": "",
              },
              {
                  "id": "mock3",
                  "roomNumber": "205",
                  "type": "Emperor Suite",
                  "price": 1200,
                  "status": "Booked",
                  "amenities": ["Wi-Fi", "TV", "Jacuzzi", "Ocean View", "Butler"],
                  "description": "The crown jewel of the empire with panoramic ocean views.",
              }
          ]
        };
        setRooms(mockData.data);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
        setError("Failed to load royal chambers.");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div className="min-h-screen bg-[#fcfbf7] font-sans text-gray-900">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-[40vh] min-h-[400px] flex items-center justify-center text-center text-white px-4">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" 
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

      {/* Filters Bar (Visual Only for Demo) */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Filter size={16} />
                <span className="uppercase tracking-wider text-xs font-bold">Filter By:</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                {['All Suites', 'Ocean View', 'Garden Villa', 'Penthouse'].map((filter, idx) => (
                    <button key={idx} className={`text-xs uppercase tracking-widest px-4 py-2 rounded-full border transition-all whitespace-nowrap ${idx === 0 ? 'bg-[#0F2027] text-[#D4AF37] border-[#0F2027]' : 'bg-transparent text-gray-500 border-gray-200 hover:border-[#D4AF37] hover:text-[#0F2027]'}`}>
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
                <div className="w-12 h-12 border-4 border-[#e5e5e5] border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
                <p className="text-[#0F2027] font-serif text-lg animate-pulse">Preparing your quarters...</p>
            </div>
        ) : error ? (
            <div className="text-center py-20">
                <p className="text-red-500 font-serif text-xl">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-6 py-2 bg-[#0F2027] text-white rounded-[2px]"
                >
                    Try Again
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.map((room, index) => (
                    <RoomCard key={room.id} room={room} index={index} />
                ))}
            </div>
        )}
      </main>

      {/* Footer (Simplified) */}
      <footer className="bg-[#0F2027] text-white py-12 text-center border-t-4 border-[#D4AF37]">
            <h2 className="font-serif text-2xl mb-6">MPAATA Empire</h2>
            <p className="text-gray-400 text-sm mb-8">Where Luxury Lives Forever.</p>
            <div className="flex justify-center gap-6 text-xs uppercase tracking-widest text-[#D4AF37]">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Contact</a>
            </div>
      </footer>

      <style>{`
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