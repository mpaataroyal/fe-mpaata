'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wifi,
  Tv,
  Wind,
  Maximize,
  CheckCircle,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Star,
  Calendar,
  User,
  Filter,
  ArrowRight,
  Loader2,
  Search,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/libs/firebase';
import { api } from '@/libs/apiAgent';

/**
 * MPAATA EMPIRE - ROOMS PAGE
 * Public facing rooms listing with specific filters.
 */

// --- Design Assets ---
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop',
  roomPlaceholder:
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop',
};

// --- Room Gallery Mapping ---
const ROOM_GALLERIES = {
  'ROYAL 1': [
    'royal.jpg',
    'royal1.jpg',
    'royal3.jpg',
    'royal4.jpg',
    'royal5.jpg',
    'royal6.jpg',
    'royal_bath.jpg',
  ],
  'ROYAL 2': [
    '/royal2/royal_2.webp',
    '/royal2/royal_21.webp',
    '/royal2/royal_22.webp',
    '/royal2/royal_23.webp',
  ],
  'TWIN SUITES': ['twin1.jpg', 'twin2.jpg', 'royal_bath.jpg'],
  'STANDARD SUITES': [
    'suit1.jpg',
    'suit.jpg',
    'suit22.jpg',
    'suit33.jpg',
    'suit2.jpg',
    'suit3.jpg',
    'suit4.jpg',
  ],
  'DELUXE SUITES': [
    'suit1.jpg',
    'suit.jpg',
    'suit22.jpg',
    'suit33.jpg',
    'suit2.jpg',
    'suit3.jpg',
    'suit4.jpg',
  ],
};

// --- Helper: Estimate Capacity ---
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
  if (normalized.includes('wi-fi') || normalized.includes('wifi'))
    return <Wifi size={14} />;
  if (normalized.includes('tv')) return <Tv size={14} />;
  if (normalized.includes('air') || normalized.includes('ac'))
    return <Wind size={14} />;
  if (normalized.includes('balcony')) return <Maximize size={14} />;
  return <CheckCircle size={14} />;
};

// --- Components ---

const Button = ({ children, type = 'default', className = '', ...props }) => {
  const baseStyle =
    'px-4 py-2 transition-all duration-300 rounded-[2px] font-sans text-sm tracking-wide cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#D4AF37] inline-flex items-center justify-center';
  const styles = {
    primary: `bg-gradient-to-r from-[#0F2027] via-[#203A43] to-[#2C5364] text-[#D4AF37] hover:brightness-110 border border-[#D4AF37] shadow-lg`,
    ghost: `bg-transparent text-white border border-white hover:bg-white hover:text-[#0F2027]`,
    default: `bg-white text-gray-800 border border-[#d9d9d9] hover:border-[#D4AF37] hover:text-[#D4AF37]`,
    link: `bg-transparent text-[#D4AF37] hover:text-[#B59024] underline-offset-4 hover:underline border-none px-0`,
  };

  return (
    <button className={`${baseStyle} ${styles[type]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          setUserRole(tokenResult.claims?.role || 'client');
        } catch (error) {
          console.error('Failed to fetch user role', error);
          setUserRole('client');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setDropdownOpen(false);
    router.refresh();
  };

  const isAdmin = ['admin', 'super_admin', 'manager', 'receptionist'].includes(
    userRole,
  );

  const getDashboardLink = () => {
    if (userRole === 'receptionist') return '/admin/bookings';
    return isAdmin ? '/admin/dashboard' : '/my';
  };

  const navigateToDashboard = (tab) => {
    router.push('/my');
    setDropdownOpen(false);
  };

  const handleLogin = () => {
    router.push('/my');
  };

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm py-4 text-[#0F2027]">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-8 h-8 border-2 border-[#0F2027] flex items-center justify-center">
            <span className="font-serif text-xl text-[#0F2027]">M</span>
          </div>
          <span className="font-serif text-xl md:text-2xl tracking-widest font-semibold uppercase">
            MPAATA
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-sans text-xs tracking-[0.15em] uppercase font-medium">
          {['Home', 'Royal Suits'].map((item) => (
            <a
              key={item}
              href={item === 'Home' ? '/' : '/rooms'}
              className="hover:text-[#D4AF37] transition-colors"
            >
              {item}
            </a>
          ))}

          {user ? (
            isAdmin ? (
              // ADMIN VIEW
              <Button
                onClick={() => router.push(getDashboardLink())}
                type="primary"
                className="uppercase text-xs px-6 py-2.5"
              >
                Access Dashboard
              </Button>
            ) : (
              // CLIENT VIEW
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0F2027] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="normal-case tracking-normal font-bold text-[#0F2027]">
                    {user.displayName?.split(' ')[0]}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transform transition-transform ${
                      dropdownOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-[2px] shadow-xl border border-gray-100 py-1 animate-fade-in-up origin-top-right">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-[#0F2027] truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={navigateToDashboard}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0F2027] flex items-center gap-2"
                    >
                      <Calendar size={14} /> My Bookings
                    </button>
                    <button
                      onClick={navigateToDashboard}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0F2027] flex items-center gap-2"
                    >
                      <CreditCard size={14} /> My Payments
                    </button>
                    <div className="border-t border-gray-50 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="text-xs font-bold uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
              >
                Login
              </button>
              <Button
                onClick={handleLogin}
                type="primary"
                className="bg-gradient-to-r from-[#0F2027] via-[#203A43] to-[#2C5364] text-[#D4AF37] border border-[#D4AF37] px-6 py-2.5 rounded-[2px] hover:brightness-110 transition-all"
              >
                Book Now
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white text-[#0F2027] shadow-xl p-8 flex flex-col gap-6 md:hidden border-t border-gray-100">
          <Link
            href="/"
            className="text-lg font-serif border-b border-gray-100 pb-2 hover:text-[#D4AF37]"
          >
            Home
          </Link>
          <Link
            href="/rooms"
            className="text-lg font-serif border-b border-gray-100 pb-2 hover:text-[#D4AF37]"
          >
            Royal Suits
          </Link>

          {user ? (
            <>
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#0F2027] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                  {user.displayName?.[0] || 'U'}
                </div>
                <span className="font-bold">{user.displayName}</span>
              </div>
              <Button
                onClick={() => router.push(getDashboardLink())}
                type="primary"
                className="w-full"
              >
                {isAdmin ? 'Access Dashboard' : 'My Dashboard'}
              </Button>
              <button
                onClick={handleLogout}
                className="text-left text-red-500 font-bold text-sm"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              <button
                onClick={handleLogin}
                className="w-full text-left font-bold uppercase tracking-widest text-xs hover:text-[#D4AF37]"
              >
                Login
              </button>
              <Button onClick={handleLogin} type="primary" className="w-full">
                Book Royal Stay
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Room Card (Carousel) ---
const RoomCard = ({ type, price, title, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Default to placeholder if specific gallery not found
  const images = ROOM_GALLERIES[type] || [IMAGES.roomPlaceholder];

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="group bg-white rounded-[2px] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-gray-100 hover:border-[#D4AF37]"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-[#0F2027]/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
        <img
          src={images[currentImageIndex]}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Carousel Buttons */}
        {images.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={prevImage}
                className="bg-white/80 p-1.5 rounded-full hover:bg-white text-[#0F2027] shadow-md transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={nextImage}
                className="bg-white/80 p-1.5 rounded-full hover:bg-white text-[#0F2027] shadow-md transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        <div className="absolute bottom-6 left-6 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0 pointer-events-none">
          <span className="bg-[#0F2027] text-[#D4AF37] text-xs uppercase tracking-widest px-4 py-2 rounded-[2px] shadow-lg">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-serif text-xl text-[#0F2027] mb-1 group-hover:text-[#D4AF37] transition-colors">
              {type}
            </h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              Room {title.replace('Suite ', '')} • {getCapacity({ type })}{' '}
              Guests
            </p>
          </div>
          <div className="text-right">
            <span className="block font-serif text-lg text-[#D4AF37] font-bold">
              UGX {Number(price).toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 uppercase">
              Per Night
            </span>
          </div>
        </div>

        <div className="w-12 h-[2px] bg-gray-100 group-hover:bg-[#D4AF37] transition-colors mb-6"></div>

        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
          Experience the pinnacle of luxury in our meticulously designed suites,
          featuring satin blue accents and royal gold finishes.
        </p>

        {/* Amenities */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fcfbf7] border border-gray-200 rounded-[2px] text-xs text-gray-600">
              <Wifi size={12} /> Wifi
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fcfbf7] border border-gray-200 rounded-[2px] text-xs text-gray-600">
              <Tv size={12} /> TV
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fcfbf7] border border-gray-200 rounded-[2px] text-xs text-gray-600">
              <Wind size={12} /> AC
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="mt-auto pt-6 border-t border-gray-50">
          <button className="w-full group/btn flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0F2027] hover:text-[#D4AF37] transition-colors">
            View Details
            <ArrowRight
              size={14}
              className="group-hover/btn:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-[#0F2027] text-white py-12 text-center border-t-4 border-[#D4AF37]">
    <h2 className="font-serif text-2xl mb-6">MPAATA Empire</h2>
    <p className="text-gray-400 text-sm mb-8">
      Hoima City, Bujumbura Division, Rusaka
    </p>
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
        console.error('Failed to fetch rooms', err);
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
      result = result.filter((r) =>
        r.amenities?.some((a) => a.toLowerCase().includes('balcony')),
      );
    } else if (activeFilter === 'Ground Floor') {
      result = result.filter(
        (r) => r.roomNumber && r.roomNumber.toString().startsWith('1'),
      );
    } else if (activeFilter === 'First Floor') {
      result = result.filter(
        (r) => r.roomNumber && r.roomNumber.toString().startsWith('2'),
      );
    }

    // 2. Filter by Occupants (Dropdown)
    if (occupants !== 'Any') {
      const minGuests = occupants === '4+' ? 4 : parseInt(occupants);
      result = result.filter((r) => getCapacity(r) >= minGuests);
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
              <span className="uppercase tracking-wider text-xs font-bold">
                Occupants:
              </span>
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
            <p className="text-[#0F2027] font-serif text-lg animate-pulse">
              Preparing your quarters...
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2px] border border-dashed border-gray-200">
            <Search className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-serif text-gray-400 mb-2">
              No Suites Found
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Try adjusting your filters to find available rooms.
            </p>
            <button
              onClick={() => {
                setActiveFilter('All');
                setOccupants('Any');
              }}
              className="px-6 py-2 bg-[#0F2027] text-white text-xs uppercase tracking-widest rounded-[2px] hover:bg-[#203A43]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id || room._id || room.key}
                type={room.type}
                title={room.roomNumber ? `Suite ${room.roomNumber}` : room.type}
                price={room.price}
                onClick={() => router.push('/rooms')}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      <style jsx global>{`
        /* Hide Scrollbar for filter overflow */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RoomsPage;
