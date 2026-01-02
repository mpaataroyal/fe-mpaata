'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, X, ChevronRight, Star, Calendar, User, Search, MapPin, 
  Phone, Mail, Instagram, Facebook, Twitter, Utensils, Wifi, Car, Monitor,
  Loader2, ArrowRight, LogOut, CreditCard 
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/libs/firebase';
import { api } from '@/libs/apiAgent';

// --- Design Assets ---
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
  pool: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop",
  // Fallback map image if API key fails
  mapPlaceholder: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop", 
  roomPlaceholder: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop"
};

// --- Components ---

const Button = ({ children, type = 'default', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 transition-all duration-300 rounded-[2px] font-sans text-sm tracking-wide cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#D4AF37] inline-flex items-center justify-center";
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

// --- Navbar ---
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('client'); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          setUserRole(tokenResult.claims?.role || 'client');
        } catch (error) {
          console.error("Failed to fetch user role", error);
          setUserRole('client');
        }
      } else {
        setUserRole('client');
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setDropdownOpen(false);
    router.refresh();
  };

  const isAdmin = ['admin', 'super_admin', 'manager'].includes(userRole);

  const getDashboardLink = () => {
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
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4 text-[#0F2027]' : 'bg-transparent py-6 text-white'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className={`w-8 h-8 border-2 flex items-center justify-center ${scrolled ? 'border-[#0F2027]' : 'border-white'}`}>
            <span className={`font-serif text-xl ${scrolled ? 'text-[#0F2027]' : 'text-white'}`}>M</span>
          </div>
          <span className="font-serif text-xl md:text-2xl tracking-widest font-semibold uppercase">MPAATA</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-sans text-xs tracking-[0.15em] uppercase font-medium">
          <Link href="/" className={`hover:text-[#D4AF37] transition-colors ${scrolled ? 'text-[#0F2027]' : 'text-white'}`}>Home</Link>
          <Link href="/rooms" className={`hover:text-[#D4AF37] transition-colors ${scrolled ? 'text-[#0F2027]' : 'text-white'}`}>Royal Suits</Link>
          
          {user ? (
            isAdmin ? (
              // ADMIN VIEW
              <Button 
                onClick={() => router.push('/admin/dashboard')}
                type={scrolled ? 'primary' : 'ghost'} 
                className="ml-4 uppercase text-xs px-6 py-2.5"
              >
                Access Dashboard
              </Button>
            ) : (
              // CLIENT VIEW
              <div className="relative ml-4">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  className={`flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity ${scrolled ? 'text-[#0F2027]' : 'text-white'}`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${scrolled ? 'bg-[#0F2027] text-[#D4AF37]' : 'bg-white text-[#0F2027]'}`}>
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="normal-case tracking-normal font-bold">{user.displayName?.split(' ')[0]}</span>
                  <ChevronRight size={14} className={`transform transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white rounded-[2px] shadow-xl border border-gray-100 py-1 animate-fade-in-up origin-top-right text-[#0F2027]">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold truncate">{user.email}</p>
                    </div>
                    <button onClick={() => navigateToDashboard('bookings')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0F2027] flex items-center gap-2">
                      <Calendar size={14} /> My Bookings
                    </button>
                    <button onClick={() => navigateToDashboard('payments')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0F2027] flex items-center gap-2">
                      <CreditCard size={14} /> My Payments
                    </button>
                    <div className="border-t border-gray-50 mt-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center gap-4 ml-4">
              <button 
                onClick={handleLogin}
                className={`text-xs font-bold uppercase tracking-widest hover:text-[#D4AF37] transition-colors ${scrolled ? 'text-[#0F2027]' : 'text-white'}`}
              >
                Login
              </button>
              <Button 
                onClick={handleLogin}
                type={scrolled ? 'primary' : 'ghost'} 
                className="uppercase text-xs px-6 py-2.5"
              >
                Book Royal Stay
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
          {mobileMenuOpen ? <X size={24} className={scrolled ? "text-[#0F2027]" : "text-white"} /> : <Menu size={24} className={scrolled ? "text-[#0F2027]" : "text-white"} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white text-[#0F2027] shadow-xl p-8 flex flex-col gap-6 md:hidden border-t border-gray-100">
          <Link href="/" className="text-lg font-serif border-b border-gray-100 pb-2 hover:text-[#D4AF37]">Home</Link>
          <Link href="/rooms" className="text-lg font-serif border-b border-gray-100 pb-2 hover:text-[#D4AF37]">Royal Suits</Link>
          
          {user ? (
            <>
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-[#0F2027] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                  {user.displayName?.[0] || 'U'}
                </div>
                <span className="font-bold">{user.displayName}</span>
              </div>
              <Button onClick={() => router.push(getDashboardLink())} type="primary" className="w-full">
                {isAdmin ? 'Access Dashboard' : 'My Dashboard'}
              </Button>
              <button onClick={handleLogout} className="text-left text-red-500 font-bold text-sm">Sign Out</button>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              <button onClick={handleLogin} className="w-full text-left font-bold uppercase tracking-widest text-xs hover:text-[#D4AF37]">Login</button>
              <Button onClick={handleLogin} type="primary" className="w-full">Book Royal Stay</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Hero Section ---
const Hero = () => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const router = useRouter();

  const handleCheckAvailability = () => {
    router.push('/rooms');
  };

  return (
    <div className="relative h-screen min-h-[700px] flex flex-col justify-center items-center text-center text-white px-4">
      <div className="absolute inset-0 z-0">
        <img src={IMAGES.hero} alt="Luxury Resort" className="w-full h-full object-cover brightness-[0.6]" />
        <div className="absolute inset-0 bg-[#0F2027]/30 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up">
        <span className="block font-sans text-xs md:text-sm tracking-[0.3em] uppercase mb-6 text-[#D4AF37] font-semibold">
          Welcome to the Empire
        </span>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight">
          MPAATA <br/> <span className="italic font-light text-[#F3E5AB]">Royal Suits</span>
        </h1>
        <p className="font-sans text-sm md:text-base max-w-lg mx-auto leading-relaxed opacity-90 mb-12">
          Experience the grandeur of royalty. A sanctuary of gold and sapphire where luxury knows no bounds.
        </p>
      </div>

      {/* Booking Widget */}
      <div className="relative z-20 w-full max-w-5xl mx-auto -mb-32 md:-mb-24 px-4 text-left">
        <div className="bg-white p-6 md:p-8 shadow-2xl rounded-[2px] grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t-4 border-[#D4AF37]">
          
          {/* Check In */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#0F2027] font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-[#D4AF37]" /> Check In
            </label>
            <input 
              type="date" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:border-[#D4AF37] outline-none rounded-[2px]"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          {/* Check Out with Fixed Time */}
          <div className="space-y-2 relative">
            <label className="text-xs uppercase tracking-wider text-[#0F2027] font-semibold flex items-center gap-2">
              <Calendar size={14} className="text-[#D4AF37]" /> Check Out
            </label>
            <div className="flex">
              <input 
                type="date" 
                className="w-full p-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:border-[#D4AF37] outline-none rounded-l-[2px] border-r-0"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
              <div className="flex items-center justify-center bg-gray-100 border border-gray-200 border-l-0 px-3 rounded-r-[2px]">
                <span className="text-xs font-bold text-gray-400 whitespace-nowrap">10:00 AM</span>
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#0F2027] font-semibold flex items-center gap-2">
              <User size={14} className="text-[#D4AF37]" /> Guests
            </label>
            <select 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-sm focus:border-[#D4AF37] outline-none rounded-[2px]"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
              <option value="5+">5+ Guests</option>
            </select>
          </div>

          {/* Submit */}
          <Button 
            type="primary" 
            className="h-[42px] uppercase tracking-widest text-xs font-bold w-full"
            onClick={handleCheckAvailability}
          >
            Check Availability
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Intro Section ---
const IntroSection = () => (
  <section className="py-32 px-6 bg-[#fcfbf7]">
    <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center pt-16">
      <div className="space-y-8">
        <div className="w-16 h-[2px] bg-[#D4AF37]"></div>
        <h2 className="font-serif text-4xl md:text-5xl text-[#0F2027] leading-tight">
          A Kingdom <br/> of Elegance
        </h2>
        <p className="font-sans text-gray-600 leading-7 font-light text-lg">
          At MPAATA Empire, every guest is royalty. Our suites are designed with the finest satin textures and golden accents, blending seamless opulence with modern comfort.
        </p>
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div>
            <span className="block font-serif text-3xl text-[#D4AF37] mb-1">50+</span>
            <span className="text-xs uppercase tracking-widest text-gray-500">Royal Suites</span>
          </div>
          <div>
            <span className="block font-serif text-3xl text-[#D4AF37] mb-1">4</span>
            <span className="text-xs uppercase tracking-widest text-gray-500">Infinity Pools</span>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -top-6 -right-6 w-full h-full border-2 border-[#D4AF37] z-0"></div>
        <img src={IMAGES.pool} alt="Resort Pool" className="relative z-10 w-full h-[500px] object-cover grayscale-[20%] contrast-[1.1]" />
      </div>
    </div>
  </section>
);

// --- Rooms Section (Dynamic) ---
const RoomCard = ({ image, title, price, type, onClick }) => (
  <div className="group cursor-pointer" onClick={onClick}>
    <div className="relative overflow-hidden mb-6 aspect-[4/5] md:aspect-[3/4] border-b-4 border-transparent group-hover:border-[#D4AF37] transition-all bg-gray-100">
      <div className="absolute inset-0 bg-[#0F2027]/20 group-hover:bg-transparent transition-colors z-10"></div>
      <img src={image || IMAGES.roomPlaceholder} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute bottom-6 left-6 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
        <Button type="primary" className="text-xs uppercase tracking-widest px-6 border-none">View Details</Button>
      </div>
    </div>
    <div className="text-center">
      <h3 className="font-serif text-2xl text-[#0F2027] mb-2 group-hover:text-[#D4AF37] transition-colors">{title}</h3>
      <div className="flex justify-center gap-4 text-xs font-sans text-gray-500 uppercase tracking-widest">
        <span>{type}</span>
        <span className="w-[1px] h-3 bg-[#D4AF37]"></span>
        <span>From UGX {Number(price).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const RoomsSection = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.rooms.getAll();
        const rawData = response.data || response.rooms || [];
        setRooms(rawData.slice(0, 3)); 
      } catch (error) {
        console.error("Failed to fetch rooms for homepage", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-4 block">Accommodations</span>
          <h2 className="font-serif text-4xl md:text-5xl text-[#0F2027] mb-6">Stay in Majesty</h2>
          <p className="text-gray-500 font-light">Adorned with gold leaf details and rich satin fabrics, our rooms offer a princely respite.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <RoomCard 
                key={room.id || room._id}
                image={room.image || IMAGES.roomPlaceholder} 
                title={room.roomNumber ? `Suite ${room.roomNumber}` : room.type} 
                price={room.price} 
                type={room.type}
                onClick={() => router.push('/rooms')}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <Link href="/rooms">
            <Button type="default" className="px-8 py-3 uppercase text-xs tracking-widest">View All Suites</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- Amenities Section ---
const Amenities = () => {
  const items = [
    { icon: Star, title: "Royal Service", desc: "24/7 Butler & Concierge" },
    { icon: Utensils, title: "Restaurant", desc: "Fine Dining Experience" },
    { icon: Wifi, title: "Wifi", desc: "High-Speed Internet" },
    { icon: Car, title: "Parking", desc: "Secure Valet Parking" },
    { icon: Monitor, title: "Conference Room", desc: "Executive Meeting Space" },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-[#0F2027] to-[#203A43] text-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12">
        {items.map((item, idx) => (
          <div key={idx} className="text-center group flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] group-hover:text-[#0F2027] transition-all duration-500 shadow-lg">
              <item.icon className="group-hover:text-[#0F2027] text-[#D4AF37]" size={28} strokeWidth={1.5} />
            </div>
            <h4 className="font-serif text-lg mb-2 text-[#F3E5AB]">{item.title}</h4>
            <p className="text-gray-300 font-sans text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- Location Section ---
const LocationSection = () => {
  const coordinates = "1.428292,31.359560"; // Hoima coordinates
  const apiKey = "AIzaSyBp6AeE01WY__gSB8CWZNE-NBRRAF1I9qI"; 
  
  // URL for the static background image
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates}&zoom=15&size=800x600&maptype=roadmap&markers=color:red%7C${coordinates}&key=${apiKey}`;

  return (
    <section className="relative h-[600px] w-full bg-gray-100 flex items-center justify-center md:justify-start px-6 overflow-hidden">
      {/* Background Map Visual */}
      <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[#e5e5e5] relative">
               <img 
                 src={staticMapUrl} 
                 alt="Location Map of MPAATA Empire" 
                 className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale"
                 onError={(e) => { e.target.src = IMAGES.mapPlaceholder; }} // Fallback if API key fails
               />
               <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/30 to-transparent"></div>
          </div>
      </div>
  
      <div className="relative z-10 max-w-md w-full md:ml-24 bg-white/95 backdrop-blur-sm p-10 shadow-2xl rounded-[2px] animate-fade-in-up border-l-4 border-[#D4AF37]">
          <span className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-4 block">Our Empire</span>
          <h2 className="font-serif text-3xl text-[#0F2027] mb-6">Getting Here</h2>
          
          <div className="space-y-6">
              <div className="flex items-start gap-4">
                  <MapPin className="text-[#D4AF37] mt-1 shrink-0" size={20} />
                  <div>
                      <p className="text-[#0F2027] font-medium mb-1">MPAATA Empire</p>
                      <p className="text-gray-500 text-sm leading-relaxed">
                          Hoima City, Bujumbura Division<br/>
                          Rusaka, Uganda
                      </p>
                  </div>
              </div>
              
              <div className="flex items-start gap-4">
                  <Mail className="text-[#D4AF37] mt-1 shrink-0" size={20} />
                  <div>
                      <p className="text-gray-500 text-sm">mpaataempire@gmail.com</p>
                      <p className="text-gray-400 text-xs mt-1">Support 24/7</p>
                  </div>
              </div>
          </div>
  
          <div className="w-full h-[1px] bg-gray-200 my-8"></div>
  
          <a href={`https://www.google.com/maps/search/?api=1&query=${coordinates}`} target="_blank" rel="noopener noreferrer">
            <Button type="primary" className="w-full uppercase text-xs tracking-widest flex items-center gap-2">
                Get Directions <ArrowRight size={14} />
            </Button>
          </a>
      </div>
    </section>
  );
};

// --- Footer ---
const Footer = () => (
  <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-[#0F2027] flex items-center justify-center">
                <span className="font-serif text-sm text-[#0F2027]">M</span>
            </div>
            <span className="font-serif text-xl tracking-widest font-semibold uppercase text-[#0F2027]">MPAATA</span>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          Hoima City, Bujumbura Division <br/>
          Rusaka, Uganda
        </p>
        <div className="flex gap-4 text-gray-400">
          <Instagram size={20} className="hover:text-[#D4AF37] cursor-pointer" />
          <Facebook size={20} className="hover:text-[#D4AF37] cursor-pointer" />
          <Twitter size={20} className="hover:text-[#D4AF37] cursor-pointer" />
        </div>
      </div>

      <div>
        <h5 className="font-bold text-xs uppercase tracking-widest mb-6 text-[#0F2027]">Explore</h5>
        <ul className="space-y-4 text-sm text-gray-500 font-sans">
          <li><Link href="/" className="hover:text-[#D4AF37]">Home</Link></li>
          <li><Link href="/rooms" className="hover:text-[#D4AF37]">Royal Suits</Link></li>
        </ul>
      </div>

      <div>
        <h5 className="font-bold text-xs uppercase tracking-widest mb-6 text-[#0F2027]">Contact</h5>
        <ul className="space-y-4 text-sm text-gray-500 font-sans">
          <li className="flex items-center gap-3"><Phone size={14} className="text-[#D4AF37]" /> +256 (0) 700 123 456</li>
          <li className="flex items-center gap-3"><Mail size={14} className="text-[#D4AF37]" /> mpaataempire@gmail.com</li>
        </ul>
      </div>

      <div>
        <h5 className="font-bold text-xs uppercase tracking-widest mb-6 text-[#0F2027]">Newsletter</h5>
        <p className="text-gray-500 text-sm mb-4">Subscribe for exclusive royal offers.</p>
        <div className="flex border-b border-gray-300 pb-2">
          <input type="email" placeholder="Email Address" className="w-full outline-none text-sm placeholder:text-gray-300" />
          <button className="text-xs uppercase font-bold text-[#D4AF37]">Join</button>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto px-6 border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 uppercase tracking-wider">
      <p>&copy; 2026 MPAATA Empire. All Rights Reserved.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a href="#" className="hover:text-[#D4AF37]">Privacy Policy</a>
        <a href="#" className="hover:text-[#D4AF37]">Terms of Service</a>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="font-sans text-gray-900 bg-[#fcfbf7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        html { scroll-behavior: smooth; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
        }
      `}</style>

      <Navbar />
      <Hero />
      <IntroSection />
      <RoomsSection />
      <Amenities />
      <LocationSection />
      <Footer />
    </div>
  );
}