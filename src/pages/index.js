import React, { useState, useEffect } from 'react';
// import Head from 'next/head'; // Removed for preview compatibility
import { Menu, X, ChevronRight, Star, Calendar, User, Search, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

/**
 * MPAATA EMPIRE ROYAL SUITS
 * A modern, luxury hotel website design.
 * * Tech Stack: React + Tailwind CSS
 * Design System: Satin Blue & Gold Theme.
 */

// --- Design Tokens & Assets ---
const THEME = {
  colors: {
    primary: '#0F2027',    // Deep Royal Blue / Navy
    secondary: '#D4AF37',  // Metallic Gold
    accent: '#F3E5AB',     // Champagne / Light Gold
    bg: '#fcfbf7',         // Off-white cream
    surface: '#ffffff',
    text: '#2c2c2c',
    textLight: '#595959',
    border: '#d9d9d9',     
  },
  fonts: {
    serif: '"Playfair Display", serif',
    sans: '"Lato", sans-serif',
  }
};

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
  room1: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop",
  room2: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
  room3: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974&auto=format&fit=crop",
  dining: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop",
  pool: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop",
  map: "https://images.unsplash.com/photo-1589519160732-57fc498494f8?q=80&w=2070&auto=format&fit=crop" // Realistic digital map
};

// --- Mock Components (Simulating Ant Design) ---

const Button = ({ children, type = 'default', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 transition-all duration-300 rounded-[2px] font-sans text-sm tracking-wide cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[#D4AF37]";
  const styles = {
    // Satin Blue Gradient Background + Gold Text
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

const Input = ({ placeholder, icon: Icon, type = "text" }) => (
  <div className="group relative flex items-center w-full">
    <div className="absolute left-3 text-gray-400 group-hover:text-[#D4AF37] transition-colors">
      {Icon && <Icon size={16} />}
    </div>
    <input 
      type={type} 
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d9d9d9] hover:border-[#D4AF37] focus:border-[#D4AF37] focus:ring-0 outline-none transition-colors text-gray-700 text-sm placeholder:text-gray-400 rounded-[2px]"
    />
  </div>
);

const DatePicker = ({ placeholder }) => (
  <Input placeholder={placeholder} icon={Calendar} type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} />
);

// --- Sections ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4 text-[#0F2027]' : 'bg-transparent py-6 text-white'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 border-2 flex items-center justify-center ${scrolled ? 'border-[#0F2027]' : 'border-white'}`}>
            <span className={`font-serif text-xl ${scrolled ? 'text-[#0F2027]' : 'text-white'}`}>M</span>
          </div>
          <span className="font-serif text-xl md:text-2xl tracking-widest font-semibold uppercase">MPAATA</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-sans text-xs tracking-[0.15em] uppercase font-medium">
          {['Home', 'Royal Suits', 'Dining', 'Wellness', 'Events', 'Contact'].map((item) => (
            <a key={item} href="#" className="hover:text-[#D4AF37] transition-colors">{item}</a>
          ))}
          <Button type={scrolled ? 'primary' : 'ghost'} className="ml-4 uppercase text-xs px-6 py-2.5">
            Book Royal Stay
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white text-[#0F2027] shadow-xl p-8 flex flex-col gap-6 md:hidden">
          {['Home', 'Royal Suits', 'Dining', 'Wellness', 'Events', 'Contact'].map((item) => (
            <a key={item} href="#" className="text-lg font-serif border-b border-gray-100 pb-2 hover:text-[#D4AF37]">{item}</a>
          ))}
          <Button type="primary" className="w-full mt-4">Book Now</Button>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  return (
    <div className="relative h-screen min-h-[700px] flex flex-col justify-center items-center text-center text-white px-4">
      {/* Background Parallax Simulation */}
      <div className="absolute inset-0 z-0">
        <img src={IMAGES.hero} alt="Luxury Resort" className="w-full h-full object-cover brightness-[0.6]" />
        {/* Blue Overlay to tint the image slightly towards the theme */}
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
      <div className="relative z-20 w-full max-w-5xl mx-auto -mb-32 md:-mb-24 px-4">
        <div className="bg-white p-6 md:p-8 shadow-2xl rounded-[2px] grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t-4 border-[#D4AF37]">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#0F2027] font-semibold">Check In</label>
            <DatePicker placeholder="Select Date" />
          </div>
          <div className="space-y-2 relative">
            <div className="flex justify-between items-baseline">
                <label className="text-xs uppercase tracking-wider text-[#0F2027] font-semibold">Check Out</label>
                <span className="text-[10px] text-red-400 font-medium tracking-wide">10:00 AM</span>
            </div>
            <DatePicker placeholder="Select Date" />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-[#0F2027] font-semibold">Guests</label>
            <Input placeholder="2 Adults, 1 Room" icon={User} />
          </div>
          <Button type="primary" className="h-[42px] uppercase tracking-widest text-xs font-bold w-full">
            Check Availability
          </Button>
        </div>
      </div>
    </div>
  );
};

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
        <Button type="link" className="mt-8 text-[#0F2027] hover:text-[#D4AF37]">Read Our Story <ChevronRight size={14} className="inline ml-1" /></Button>
      </div>
      <div className="relative">
        <div className="absolute -top-6 -right-6 w-full h-full border-2 border-[#D4AF37] z-0"></div>
        <img src={IMAGES.pool} alt="Resort Pool" className="relative z-10 w-full h-[600px] object-cover grayscale-[20%] contrast-[1.1]" />
      </div>
    </div>
  </section>
);

const RoomCard = ({ image, title, price, size }) => (
  <div className="group cursor-pointer">
    <div className="relative overflow-hidden mb-6 aspect-[4/5] md:aspect-[3/4] border-b-4 border-transparent group-hover:border-[#D4AF37] transition-all">
      <div className="absolute inset-0 bg-[#0F2027]/20 group-hover:bg-transparent transition-colors z-10"></div>
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute bottom-6 left-6 z-20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
        <Button type="primary" className="text-xs uppercase tracking-widest px-6 border-none">View Details</Button>
      </div>
    </div>
    <div className="text-center">
      <h3 className="font-serif text-2xl text-[#0F2027] mb-2 group-hover:text-[#D4AF37] transition-colors">{title}</h3>
      <div className="flex justify-center gap-4 text-xs font-sans text-gray-500 uppercase tracking-widest">
        <span>{size}</span>
        <span className="w-[1px] h-3 bg-[#D4AF37]"></span>
        <span>From ${price}/Night</span>
      </div>
    </div>
  </div>
);

const RoomsSection = () => (
  <section className="py-24 px-6 bg-white">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <span className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-4 block">Accommodations</span>
        <h2 className="font-serif text-4xl md:text-5xl text-[#0F2027] mb-6">Stay in Majesty</h2>
        <p className="text-gray-500 font-light">Adorned with gold leaf details and rich satin fabrics, our rooms offer a princely respite.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <RoomCard image={IMAGES.room1} title="Imperial Ocean Suite" price="450" size="65 SQM" />
        <RoomCard image={IMAGES.room2} title="Royal Garden Villa" price="620" size="85 SQM" />
        <RoomCard image={IMAGES.room3} title="The Emperor Penthouse" price="1,200" size="140 SQM" />
      </div>

      <div className="text-center mt-16">
         <Button type="default" className="px-8 py-3 uppercase text-xs tracking-widest">View All Suites</Button>
      </div>
    </div>
  </section>
);

const Amenities = () => {
  const items = [
    { icon: Star, title: "Royal Service", desc: "24/7 Butler & Concierge" },
    { icon: MapPin, title: "Prime Estate", desc: "Private island access" },
    { icon: Search, title: "Golden Dining", desc: "Michelin-star cuisine" },
    { icon: User, title: "Empire Spa", desc: "Gold-infused treatments" },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-[#0F2027] to-[#203A43] text-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {items.map((item, idx) => (
          <div key={idx} className="text-center md:text-left group">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 mx-auto md:mx-0 group-hover:bg-[#D4AF37] group-hover:text-[#0F2027] transition-all duration-500 shadow-lg">
              <item.icon className="group-hover:text-[#0F2027] text-[#D4AF37]" size={28} strokeWidth={1.5} />
            </div>
            <h4 className="font-serif text-xl mb-2 text-[#F3E5AB]">{item.title}</h4>
            <p className="text-gray-300 font-sans text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const LocationSection = () => (
  <section className="relative h-[600px] w-full bg-gray-100 flex items-center justify-center md:justify-start px-6">
    {/* Map Background Simulation */}
    <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-[#e5e5e5] relative overflow-hidden">
             {/* Realistic Google Map visual */}
             <div className="absolute inset-0 opacity-80" style={{backgroundImage: `url(${IMAGES.map})`, backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
             <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-[#D4AF37] rounded-full shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
             <div className="absolute top-1/2 left-1/3 -mt-6 -ml-[11px] text-[#D4AF37] transform -translate-x-1/2 -translate-y-1/2 drop-shadow-md z-10">
               <MapPin size={40} fill="#D4AF37" stroke="white" strokeWidth={1} />
             </div>
        </div>
    </div>

    {/* Location Overlay Card */}
    <div className="relative z-10 max-w-md w-full md:ml-24 bg-white/95 backdrop-blur-sm p-10 shadow-2xl rounded-[2px] animate-fade-in-up border-l-4 border-[#D4AF37]">
        <span className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-4 block">Our Empire</span>
        <h2 className="font-serif text-3xl text-[#0F2027] mb-6">Getting Here</h2>
        
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                <MapPin className="text-[#D4AF37] mt-1 shrink-0" size={20} />
                <div>
                    <p className="text-[#0F2027] font-medium mb-1">MPAATA Empire Royal Suits</p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        1 Empire Avenue, Royal District<br/>
                        Entebbe, Uganda
                    </p>
                </div>
            </div>
            
            <div className="flex items-start gap-4">
                <Phone className="text-[#D4AF37] mt-1 shrink-0" size={20} />
                <div>
                    <p className="text-gray-500 text-sm">+256 (0) 700 123 456</p>
                    <p className="text-gray-400 text-xs mt-1">Mon - Sun, 24 Hours</p>
                </div>
            </div>
        </div>

        <div className="w-full h-[1px] bg-gray-200 my-8"></div>

        <div className="space-y-4">
             <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Distances</p>
             <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                 <span>✈️ Int'l Airport</span> <span className="text-right">10 min (VIP Shuttle)</span>
                 <span>🏙️ City Center</span> <span className="text-right">30 min (Limo)</span>
             </div>
        </div>

        <Button type="primary" className="w-full mt-8 uppercase text-xs tracking-widest">
            Get Directions
        </Button>
    </div>
  </section>
);

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
          1 Empire Avenue, <br/>
          Royal District, Uganda
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
          <li><a href="#" className="hover:text-[#D4AF37]">Home</a></li>
          <li><a href="#" className="hover:text-[#D4AF37]">Royal Suits</a></li>
          <li><a href="#" className="hover:text-[#D4AF37]">Dining</a></li>
          <li><a href="#" className="hover:text-[#D4AF37]">Wellness & Spa</a></li>
        </ul>
      </div>

      <div>
        <h5 className="font-bold text-xs uppercase tracking-widest mb-6 text-[#0F2027]">Contact</h5>
        <ul className="space-y-4 text-sm text-gray-500 font-sans">
          <li className="flex items-center gap-3"><Phone size={14} className="text-[#D4AF37]" /> +256 (0) 700 123 456</li>
          <li className="flex items-center gap-3"><Mail size={14} className="text-[#D4AF37]" /> reservations@mpaata.com</li>
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
      {/* NOTE: In a real Next.js app, uncomment the Head component below.
        It is commented out here because 'next/head' is not available in this preview environment.
      */}
      {/* <Head>
        <title>MPAATA Empire Royal Suits</title>
        <meta name="description" content="Experience the grandeur of royalty at MPAATA Empire." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      */}

        {/* Inject Google Fonts */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          
          /* Custom Smooth Scroll */
          html { scroll-behavior: smooth; }
          
          /* Animations */
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