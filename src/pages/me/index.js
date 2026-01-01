import React, { useState, useEffect } from 'react';
import { 
  Layout, Calendar, CreditCard, LogOut, Plus, Search, 
  User, CheckCircle, AlertCircle, X, ChevronDown, 
  Loader2, Wallet, DollarSign, Phone, ArrowRight, Menu
} from 'lucide-react';

/**
 * MPAATA EMPIRE - PROTECTED DASHBOARD
 * Features: Authentication Check, My Bookings, Payment History, Booking Creation
 * Style: Satin Blue (#0F2027) & Gold (#D4AF37)
 */

// --- Theme Config ---
const THEME = {
  colors: {
    primary: '#0F2027',    // Deep Royal Blue
    secondary: '#D4AF37',  // Metallic Gold
    accent: '#F3E5AB',     // Champagne
    bg: '#fcfbf7',         // Off-white
    surface: '#ffffff',
    text: '#2c2c2c',
    border: '#e5e5e5'
  }
};

// --- Mock Data & API Simulation ---
// In your real app, you would import { api } from '@/libs/apiAgent'
const MOCK_API = {
  user: {
    uid: 'user_123',
    name: 'Royal Guest',
    email: 'guest@mpaata.com',
    role: 'client'
  },
  rooms: [
    { id: '1', roomNumber: '101', type: 'Imperial Suite', price: 20000, status: 'Available' },
    { id: '2', roomNumber: '102', type: 'Royal Deluxe', price: 500, status: 'Occupied' },
    { id: '3', roomNumber: '201', type: 'Garden Villa', price: 800, status: 'Available' },
  ],
  bookings: [
    { 
      id: 'BK-7829', 
      roomName: 'Imperial Suite', 
      checkIn: '2024-10-25T14:00:00', 
      checkOut: '2024-10-28T10:00:00', 
      totalPrice: 60000, 
      status: 'confirmed', 
      paymentStatus: 'paid', 
      paymentMethod: 'Visa' 
    },
    { 
      id: 'BK-9921', 
      roomName: 'Royal Deluxe', 
      checkIn: '2024-11-01T14:00:00', 
      checkOut: '2024-11-03T10:00:00', 
      totalPrice: 1000, 
      status: 'pending', 
      paymentStatus: 'unpaid', 
      paymentMethod: 'Mobile Money' 
    }
  ]
};

// --- UI Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: `bg-gradient-to-r from-[#0F2027] to-[#203A43] text-[#D4AF37] border border-[#D4AF37] hover:brightness-110 shadow-md`,
    secondary: `bg-white text-[#0F2027] border border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37]`,
    danger: `bg-red-50 text-red-600 border border-red-100 hover:bg-red-100`,
    ghost: `bg-transparent text-gray-500 hover:text-[#0F2027]`
  };
  return (
    <button className={`px-4 py-2 rounded-[2px] font-sans text-sm font-medium transition-all flex items-center justify-center gap-2 ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const StatusBadge = ({ status, type = 'booking' }) => {
  const styles = {
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    unpaid: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    available: 'bg-green-50 text-green-600 border-green-100',
    occupied: 'bg-red-50 text-red-600 border-red-100',
  };
  
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  const style = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-500';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${style}`}>
      {label}
    </span>
  );
};

const Input = ({ label, icon: Icon, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>}
    <div className="relative group">
      {Icon && <Icon size={16} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors" />}
      <input 
        className={`w-full bg-[#fcfbf7] border ${error ? 'border-red-300' : 'border-gray-200'} rounded-[2px] py-2.5 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors`}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
  </div>
);

// --- Login Component (Protected Route Guard) ---

const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#fcfbf7] relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
    
    <div className="w-full max-w-md bg-white p-8 md:p-12 shadow-2xl relative z-10 border-t-4 border-[#D4AF37]">
      <div className="text-center mb-10">
        <div className="w-12 h-12 border-2 border-[#0F2027] flex items-center justify-center mx-auto mb-4">
          <span className="font-serif text-2xl text-[#0F2027]">M</span>
        </div>
        <h1 className="font-serif text-3xl text-[#0F2027] mb-2">Welcome Back</h1>
        <p className="text-gray-500 text-sm">Sign in to access your Royal Dashboard</p>
      </div>

      <button 
        onClick={onLogin}
        className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 hover:border-[#D4AF37] transition-all rounded-[2px] group"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        <span className="text-gray-700 font-medium group-hover:text-[#0F2027]">Continue with Google</span>
        <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform group-hover:text-[#D4AF37]" />
      </button>

      <p className="text-center text-xs text-gray-400 mt-8">
        By continuing, you agree to MPAATA Empire's Terms of Service.
      </p>
    </div>
  </div>
);

// --- Main Application ---

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Data States
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    phone: '',
    paymentMethod: 'Mobile Money'
  });
  const [roomWarning, setRoomWarning] = useState(null);

  // --- Auth & Data Loading ---
  useEffect(() => {
    // 1. Check if user is logged in (Simulation)
    // In Real App: onAuthStateChanged(auth, (user) => { ... })
    setTimeout(() => {
      const savedUser = sessionStorage.getItem('mpaata_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        loadData();
      }
      setLoading(false);
    }, 1000);
  }, []);

  const loadData = async () => {
    // 2. Fetch Data (Simulation)
    // In Real App: const res = await api.bookings.getAll(); setBookings(res);
    setBookings(MOCK_API.bookings);
    setRooms(MOCK_API.rooms);
  };

  const handleLogin = () => {
    // Simulate Google Login Success
    const mockUser = MOCK_API.user;
    sessionStorage.setItem('mpaata_user', JSON.stringify(mockUser));
    setUser(mockUser);
    loadData();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mpaata_user');
    setUser(null);
  };

  // --- Logic ---

  const handleRoomSelect = (e) => {
    const roomId = e.target.value;
    const room = rooms.find(r => r.id === roomId);
    
    setFormData({ ...formData, roomId });
    
    // Check occupancy logic (from your requirements)
    if (room && room.status === 'Occupied') {
      setRoomWarning('Note: This room is currently marked as occupied. Please confirm availability with reception if immediate check-in is required.');
    } else {
      setRoomWarning(null);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    // Simulate API Call for Booking Creation
    setTimeout(() => {
      const room = rooms.find(r => r.id === formData.roomId);
      const newBooking = {
        id: `BK-${Math.floor(Math.random() * 10000)}`,
        roomName: room ? room.type : 'Unknown Room',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalPrice: room ? room.price : 0,
        status: 'pending',
        paymentStatus: formData.paymentMethod === 'Cash' ? 'paid' : 'pending',
        paymentMethod: formData.paymentMethod
      };

      setBookings([newBooking, ...bookings]);
      setModalLoading(false);
      setIsModalOpen(false);
      
      // Reset Form
      setFormData({
        roomId: '', checkIn: '', checkOut: '', guestName: user?.name || '', phone: '', paymentMethod: 'Mobile Money'
      });
      setRoomWarning(null);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fcfbf7] text-[#0F2027]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
        <p className="font-serif animate-pulse">Entering the Empire...</p>
      </div>
    );
  }

  // Protected Route Guard
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#fcfbf7] flex font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0F2027] text-white hidden md:flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-8 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 border border-[#D4AF37] flex items-center justify-center">
            <span className="font-serif font-bold text-[#D4AF37]">M</span>
          </div>
          <span className="font-serif tracking-widest font-bold">MPAATA</span>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2px] transition-colors ${activeTab === 'bookings' ? 'bg-[#D4AF37] text-[#0F2027] font-bold shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar size={18} /> My Bookings
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2px] transition-colors ${activeTab === 'payments' ? 'bg-[#D4AF37] text-[#0F2027] font-bold shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard size={18} /> My Payments
          </button>
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#D4AF37]">
              <User size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-12">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center mb-8">
            <span className="font-serif text-xl font-bold text-[#0F2027]">MPAATA</span>
            <Menu className="text-[#0F2027]" />
        </header>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">
              {activeTab === 'bookings' ? 'My Bookings' : 'Payment History'}
            </h1>
            <p className="text-gray-500 text-sm">Manage your stays and transactions securely.</p>
          </div>
          {activeTab === 'bookings' && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> New Booking
            </Button>
          )}
        </div>

        {/* --- BOOKINGS TAB CONTENT --- */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F2027] text-sm">{booking.roomName}</p>
                        <p className="text-xs text-gray-400">ID: {booking.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded-sm inline-block w-fit">
                            In: {new Date(booking.checkIn).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-600 bg-amber-50 px-2 py-0.5 rounded-sm inline-block w-fit">
                            Out: {new Date(booking.checkOut).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-sans text-sm font-medium">
                        ${booking.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <StatusBadge status={booking.paymentStatus} type="payment" />
                           <span className="text-xs text-gray-400">{booking.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-xs font-bold text-[#D4AF37] hover:underline">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No bookings found. Start your journey today.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PAYMENTS TAB CONTENT --- */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 p-8 text-center animate-fade-in-up">
            <div className="max-w-md mx-auto">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <DollarSign className="text-green-600" size={32} />
               </div>
               <h3 className="font-serif text-2xl text-[#0F2027] mb-2">Total Spent: $61,000</h3>
               <p className="text-gray-500 text-sm mb-8">View and download your invoices below.</p>
               
               <div className="space-y-4">
                 {bookings.filter(b => b.paymentStatus === 'paid').map(b => (
                   <div key={b.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-[2px] hover:border-[#D4AF37] transition-colors bg-gray-50/50">
                      <div className="text-left">
                        <p className="text-sm font-bold text-[#0F2027]">{b.roomName}</p>
                        <p className="text-xs text-gray-400">{new Date(b.checkIn).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">${b.totalPrice.toLocaleString()}</p>
                        <button className="text-[10px] uppercase font-bold text-[#0F2027] mt-1 hover:text-[#D4AF37]">Download Invoice</button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

      </main>

      {/* --- NEW BOOKING MODAL (Dialog) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2px] shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-serif text-xl text-[#0F2027]">Create New Booking</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitBooking} className="p-6 overflow-y-auto flex-1">
              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Guest Name" 
                  value={formData.guestName} 
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  required 
                  icon={User}
                />
                <Input 
                  label="Phone Number" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+256..." 
                  required 
                  icon={Phone}
                />
              </div>

              {/* Room Selection */}
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">Select Room</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none bg-[#fcfbf7] border border-gray-200 rounded-[2px] py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-[#D4AF37] text-gray-700"
                    value={formData.roomId}
                    onChange={handleRoomSelect}
                    required
                  >
                    <option value="">-- Choose a Suite --</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} - {room.type} (UGX {room.price?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Occupancy Warning */}
              {roomWarning && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-[2px] flex gap-2 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {roomWarning}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Check In" 
                  type="datetime-local" 
                  value={formData.checkIn} 
                  onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                  required 
                />
                <Input 
                  label="Check Out" 
                  type="datetime-local" 
                  value={formData.checkOut} 
                  onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                  required 
                />
              </div>

              {/* Payment Method Selector */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Mobile Money', 'Visa', 'Cash'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: method})}
                      className={`py-2 px-1 text-xs font-medium border rounded-[2px] transition-all ${formData.paymentMethod === method ? 'bg-[#0F2027] text-[#D4AF37] border-[#0F2027]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Dynamic Payment Instructions */}
                <div className="mt-4 bg-[#fcfbf7] p-4 rounded-[2px] border border-gray-100">
                   {formData.paymentMethod === 'Mobile Money' && (
                     <p className="text-xs text-gray-600 flex items-center gap-2">
                       <Phone size={14} className="text-[#D4AF37]" /> 
                       Enter number above. Status will be <strong>Pending</strong> until push approved.
                     </p>
                   )}
                   {formData.paymentMethod === 'Visa' && (
                     <p className="text-xs text-gray-600 flex items-center gap-2">
                       <CreditCard size={14} className="text-[#D4AF37]" /> 
                       You will be redirected to the secure payment gateway.
                     </p>
                   )}
                   {formData.paymentMethod === 'Cash' && (
                     <p className="text-xs text-green-600 flex items-center gap-2">
                       <CheckCircle size={14} /> 
                       Reservation will be marked as <strong>Paid</strong> immediately.
                     </p>
                   )}
                </div>
              </div>

            </form>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitBooking} disabled={modalLoading}>
                {modalLoading ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Lato', sans-serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;