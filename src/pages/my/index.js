'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  LogOut,
  Plus,
  Search,
  User,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Phone,
  ArrowRight,
  Menu,
  Wifi,
  Tv,
  Wind,
  Maximize,
  Filter,
  Home,
  AlertTriangle,
  RefreshCw,
  Hash, // Added Hash icon for Transaction ID
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/libs/firebase';
import { api } from '@/libs/apiAgent';

/**
 * MPAATA EMPIRE - CLIENT DASHBOARD
 * Layout: Top Navigation
 * Features: My Bookings, Payments, Room Browsing
 */

// --- Constants ---
const DEFAULT_ROOM_IMAGE = 'suit.jpg';

// --- Helper: Image Mapping Logic (Strict .webp) ---
const getRoomImage = (room) => {
  const roomNumStr = room.roomNumber?.toString() || '';
  const num = parseInt(roomNumStr.replace(/\D/g, '') || '0');
  const type = room.type?.toUpperCase() || '';

  if (roomNumStr === 'ROYAL 1') return 'royal1.webp';
  if (roomNumStr === 'ROYAL 2') return 'royal.webp';
  if (type === 'TWIN SUITE') return 'twin.webp';
  if (num === 13) return '13.webp';
  if ([12, 16, 17, 20].includes(num)) return 'balcony.webp';
  if ([11, 14, 15, 18, 19].includes(num)) return '11_14_15_18_19.webp';
  if (num >= 1 && num <= 9) return '123456789.webp';

  return DEFAULT_ROOM_IMAGE;
};

// --- Helper: Capacity Logic ---
const getCapacity = (room) => {
  if (room.capacity) return Math.min(room.capacity, 2);
  return 2;
};

// --- Components ---

const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const styles = {
    primary: `bg-[#0F2027] text-[#D4AF37] border border-[#0F2027] hover:bg-[#1a2e38] shadow-md`,
    secondary: `bg-white text-[#0F2027] border border-gray-200 hover:border-[#D4AF37] hover:text-[#D4AF37]`,
    danger: `bg-red-50 text-red-600 border border-red-100 hover:bg-red-100`,
    ghost: `bg-transparent text-gray-500 hover:text-[#0F2027]`,
  };
  return (
    <button
      className={`px-4 py-2 rounded-[2px] font-sans text-sm font-medium transition-all flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const StatusBadge = ({ status, type = 'booking' }) => {
  const styles = {
    confirmed: 'bg-green-100 text-green-700 border-green-200',
    paid: 'bg-green-100 text-green-700 border-green-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    unpaid: 'bg-red-50 text-red-600 border-red-100',
    failed: 'bg-red-50 text-red-600 border-red-100',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    available: 'bg-green-50 text-green-600 border-green-100',
    occupied: 'bg-red-50 text-red-600 border-red-100',
  };
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Unknown';
  const style = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-500';
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${style}`}
    >
      {label}
    </span>
  );
};

const Input = ({ label, icon: Icon, error, ...props }) => (
  <div className="mb-4">
    {label && (
      <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3 top-3 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors"
        />
      )}
      <input
        className={`w-full bg-[#fcfbf7] border ${
          error ? 'border-red-300' : 'border-gray-200'
        } rounded-[2px] py-2.5 ${
          Icon ? 'pl-10' : 'pl-4'
        } pr-4 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors disabled:bg-gray-100 disabled:text-gray-500`}
        {...props}
      />
    </div>
  </div>
);

// --- Room Card ---
const RoomCard = ({ room, onBook, image }) => {
  return (
    <div className="bg-white rounded-[2px] border border-gray-100 hover:border-[#D4AF37] transition-all shadow-sm overflow-hidden group flex flex-col">
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        {/* Image */}
        <div className="absolute inset-0 bg-[#0F2027]/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
        <img
          src={image}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt={room.type}
        />

        <span
          className={`absolute top-3 right-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm z-20 ${
            room.status === 'Available'
              ? 'bg-[#D4AF37] text-[#0F2027]'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {room.status}
        </span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-lg text-[#0F2027]">{room.type}</h3>
          <span className="font-bold text-[#D4AF37]">
            UGX {room.price?.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Room {room.roomNumber}</p>
        <div className="flex gap-2 mb-6 flex-wrap">
          {room.amenities?.slice(0, 3).map((a) => (
            <span
              key={a}
              className="text-[10px] bg-gray-50 border border-gray-100 px-2 py-1 rounded text-gray-600"
            >
              {a}
            </span>
          ))}
        </div>
        <button
          onClick={() => onBook(room)}
          disabled={room.status !== 'Available'}
          className="mt-auto w-full py-2 bg-[#0F2027] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#203A43] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {room.status === 'Available' ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

// --- Login Screen ---
const LoginScreen = ({ onLogin, loading }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#fcfbf7] relative overflow-hidden font-sans">
    <div
      className="absolute inset-0 z-0 opacity-10"
      style={{
        backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    ></div>
    <div className="w-full max-w-md bg-white p-8 md:p-12 shadow-2xl relative z-10 border-t-4 border-[#D4AF37]">
      <div className="text-center mb-10">
        <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4">
          {/* Logo on Login Screen */}
          <img
            src="/logo.webp"
            alt="Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="font-serif text-3xl text-[#0F2027] mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-500 text-sm">
          Sign in to access your Royal Dashboard
        </p>
      </div>
      <button
        onClick={onLogin}
        disabled={loading}
        className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 hover:border-[#D4AF37] transition-all rounded-[2px] group"
      >
        {loading ? (
          <Loader2 className="animate-spin text-[#D4AF37]" />
        ) : (
          <>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-gray-700 font-medium group-hover:text-[#0F2027]">
              Continue with Google
            </span>
          </>
        )}
      </button>
    </div>
  </div>
);

// --- Main Dashboard ---

const UserDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, payments, rooms
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);

  // Filters
  const [roomFilter, setRoomFilter] = useState('All');
  const [occupantsFilter, setOccupantsFilter] = useState('Any');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Specific state for Merchant Sub-tabs
  const [merchantType, setMerchantType] = useState('MoMo Pay');

  const [formData, setFormData] = useState({
    roomId: '',
    checkIn: '',
    checkOutDate: '',
    phone: '',
    paymentMethod: 'Mobile Money',
    paymentPhone: '',
    transactionId: '', // Added for MoMo Pay reference
  });

  // Phone Update Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);

  // Retry Payment State
  const [retryLoadingId, setRetryLoadingId] = useState(null);

  // --- Auth & Initial Load ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let backendUser = null;
        try {
          const res = await api.users.getById(currentUser.uid);
          backendUser = res.user || res;
        } catch (err) {
          console.warn(
            'Backend user profile fetch failed, user might be new.',
            err,
          );
        }

        const phoneNumber = backendUser?.phoneNumber || null;

        setUser({
          uid: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          phoneNumber: phoneNumber,
        });

        if (!phoneNumber) {
          setIsPhoneModalOpen(true);
        }

        await loadData(currentUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadData = async (uid) => {
    try {
      const [bookingsRes, roomsRes, paymentsRes] = await Promise.all([
        api.bookings.getMine(),
        api.rooms.getAll(),
        api.payments.getMine(),
      ]);

      const roomData = roomsRes.data || roomsRes.rooms || [];
      setBookings(bookingsRes.bookings || []);
      setPayments(paymentsRes.payments || []);
      setRooms(roomData);
      setFilteredRooms(roomData);
    } catch (error) {
      console.error('Data load failed', error);
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await api.auth.googleLogin(idToken); // Sync with backend
    } catch (error) {
      console.error(error);
      alert('Login Failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleSavePhoneNumber = async (e) => {
    e.preventDefault();
    if (!phoneNumberInput || phoneNumberInput.length < 10) {
      alert('Please enter a valid phone number.');
      return;
    }

    setPhoneSaving(true);
    try {
      await api.users.update(user.uid, { phoneNumber: phoneNumberInput });
      setUser((prev) => ({ ...prev, phoneNumber: phoneNumberInput }));
      setIsPhoneModalOpen(false);
    } catch (error) {
      console.error('Failed to update phone number:', error);
      alert('Failed to save phone number. Please try again.');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleRetryPayment = async (payment) => {
    if (
      !confirm(
        `Retry payment of UGX ${Number(
          payment.amount,
        ).toLocaleString()} using ${payment.phone}?`,
      )
    )
      return;

    setRetryLoadingId(payment.id);
    try {
      await api.payments.initiate({
        bookingId: payment.bookingId,
        phoneNumber: payment.phone,
        amount: payment.amount,
      });
      alert('Payment prompt sent to your phone.');
      await loadData(user.uid);
    } catch (error) {
      console.error(error);
      alert('Retry failed. Please try again later.');
    } finally {
      setRetryLoadingId(null);
    }
  };

  // --- Filter Logic ---
  useEffect(() => {
    let result = rooms;

    // Room Type Filter
    if (roomFilter === 'Balcony') {
      result = result.filter((r) =>
        r.amenities?.some((a) => a.toLowerCase().includes('balcony')),
      );
    }

    // Occupants Filter (Max 2 Guests)
    if (occupantsFilter !== 'Any') {
      if (occupantsFilter === '2') {
        // Strict filter: If user selects 2 guests, ONLY show Twin Suites
        result = result.filter((r) => r.type === 'TWIN SUITE');
      } else {
        const minGuests = parseInt(occupantsFilter);
        result = result.filter((r) => getCapacity(r) >= minGuests);
      }
    }

    setFilteredRooms(result);
  }, [roomFilter, occupantsFilter, rooms]);

  const handleBookRoom = (room) => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const checkIn = new Date(now - tzOffset).toISOString().slice(0, 16);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkOutDate = tomorrow.toISOString().slice(0, 10);

    setFormData({
      roomId: room.id || room._id,
      checkIn,
      checkOutDate,
      phone: user.phoneNumber || '',
      paymentMethod: 'Mobile Money',
      paymentPhone: user.phoneNumber || '',
      transactionId: '',
    });
    setMerchantType('MoMo Pay'); // Default sub-tab
    setIsModalOpen(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      const checkOut = `${formData.checkOutDate}T10:00:00`;

      const payload = {
        ...formData,
        checkOut,
        userId: user.uid,
        guestName: user.name,
        guestEmail: user.email || null, // Fallback to null (safe for Firestore)
        guestPhone: formData.phone,
        guests: 1, // Default 'guests' count
        status: 'pending',
        // Only include transactionId if using Merchant Pay AND MoMo Pay
        transactionId:
          formData.paymentMethod === 'Merchant Pay' &&
          merchantType === 'MoMo Pay'
            ? formData.transactionId
            : null,
        providerDetail:
          formData.paymentMethod === 'Merchant Pay' ? merchantType : null,
      };

      await api.bookings.create(payload);
      await loadData(user.uid);
      setIsModalOpen(false);
      alert('Booking request sent successfully!');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Failed to create booking';
      alert(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  // --- Render ---

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfbf7]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  if (!user) return <LoginScreen onLogin={handleLogin} loading={authLoading} />;

  const totalSpent = payments
    .filter((p) => p.status === 'success' || p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#fcfbf7] font-sans text-gray-900">
      {/* --- Top Navigation --- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm py-4 text-[#0F2027]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <img
              src="/logo.webp"
              alt="Mpaata Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="font-serif text-xl md:text-2xl tracking-widest font-semibold uppercase hidden md:block">
              MPAATA
            </span>
          </div>

          {/* Desktop Navigation & User Profile */}
          <div className="hidden md:flex items-center gap-6">
            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-gray-50/50 p-1 rounded-[2px] border border-gray-100">
              {[
                { id: 'bookings', label: 'My Bookings', icon: Calendar },
                { id: 'rooms', label: 'Browse Rooms', icon: Search },
                { id: 'payments', label: 'Payments', icon: CreditCard },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#0F2027] text-[#D4AF37] shadow-sm'
                      : 'text-gray-500 hover:text-[#0F2027] hover:bg-white'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-gray-200"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-[#0F2027]">{user.name}</p>
                <button
                  onClick={handleLogout}
                  className="text-[10px] text-red-500 hover:underline uppercase tracking-wider font-bold"
                >
                  Sign Out
                </button>
              </div>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#0F2027] text-[#D4AF37] flex items-center justify-center font-bold">
                  {user.name?.[0]}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg p-6 flex flex-col gap-4 md:hidden">
            {/* Mobile Tabs */}
            {[
              { id: 'bookings', label: 'My Bookings' },
              { id: 'rooms', label: 'Browse Rooms' },
              { id: 'payments', label: 'Payments' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-sm font-bold uppercase tracking-widest py-2 border-b border-gray-50 ${
                  activeTab === tab.id ? 'text-[#0F2027]' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 font-bold uppercase"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* --- Main Content --- */}
      <main className="pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">
              {activeTab === 'bookings' && 'My Reservations'}
              {activeTab === 'rooms' && 'Select Your Suite'}
              {activeTab === 'payments' && 'Payment History'}
            </h1>
            <p className="text-gray-500 text-sm">
              {activeTab === 'rooms'
                ? 'Find the perfect room for your stay.'
                : 'Manage your account details.'}
            </p>
          </div>

          {/* MAKE RESERVATION BUTTON */}
          {activeTab === 'bookings' && (
            <Button onClick={() => setActiveTab('rooms')}>
              <Plus size={16} /> Make Reservation
            </Button>
          )}
        </div>

        {/* --- ROOMS TAB (WITH FILTERS) --- */}
        {activeTab === 'rooms' && (
          <div className="animate-fade-in-up">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-[2px] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Occupants:
                </span>
                <select
                  value={occupantsFilter}
                  onChange={(e) => setOccupantsFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-1.5 focus:border-[#D4AF37] outline-none text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <option value="Any">Any</option>
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                </select>
              </div>
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                {['All', 'Balcony'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRoomFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                      roomFilter === filter
                        ? 'bg-[#0F2027] text-[#D4AF37] border-[#0F2027]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#D4AF37]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id || room._id || room.key}
                  room={room}
                  image={getRoomImage(room)}
                  onBook={handleBookRoom}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- BOOKINGS TAB --- */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                      Room
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                      Dates
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F2027] text-sm">
                          {booking.roomName || 'Suite'}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {booking.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-sm">
                        UGX {booking.totalPrice?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        No active bookings found.{' '}
                        <button
                          onClick={() => setActiveTab('rooms')}
                          className="text-[#D4AF37] underline"
                        >
                          Book a room
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PAYMENTS TAB --- */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 p-8 text-center animate-fade-in-up">
            <div className="mb-8">
              <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
              <h3 className="text-lg font-serif text-gray-500">
                Payment History
              </h3>
              <p className="text-xs text-gray-400">
                Total Spent:{' '}
                <span className="font-bold text-[#0F2027]">
                  UGX {totalSpent.toLocaleString()}
                </span>
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-3 text-left">
              {payments.map((payment) => {
                const booking = bookings.find(
                  (b) => b.id === payment.bookingId,
                );
                const displayRoom = booking
                  ? booking.roomName
                  : `Booking ${payment.bookingId?.slice(0, 6) || 'Ref'}`;

                const canRetry =
                  (payment.status === 'failed' ||
                    payment.status === 'pending') &&
                  (payment.provider === 'Mobile Money' ||
                    payment.provider === 'mobile_money');

                return (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-4 border border-gray-100 rounded-[2px] hover:border-[#D4AF37] transition-all bg-gray-50/30"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#0F2027]">
                        {displayRoom}
                      </p>
                      <div className="flex gap-2 text-[10px] text-gray-400">
                        <span>
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{payment.provider}</span>
                        {payment.phone && (
                          <>
                            <span>•</span>
                            <span>{payment.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="block font-bold text-sm text-[#0F2027]">
                        UGX {Number(payment.amount).toLocaleString()}
                      </span>
                      <StatusBadge status={payment.status} type="payment" />

                      {/* Retry Button */}
                      {canRetry && (
                        <button
                          onClick={() => handleRetryPayment(payment)}
                          disabled={retryLoadingId === payment.id}
                          className="text-[10px] font-bold text-amber-600 flex items-center justify-end gap-1 mt-1 hover:underline ml-auto"
                        >
                          {retryLoadingId === payment.id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            <RefreshCw size={10} />
                          )}
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {payments.length === 0 && (
                <p className="text-sm text-gray-400">
                  No payment records found.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- Booking Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2px] shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
              <X size={20} />
            </button>
            <h2 className="font-serif text-xl text-[#0F2027] mb-6">
              Complete Booking
            </h2>
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Your Contact Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  icon={Phone}
                  required
                  placeholder="+256..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Check In (Date & Time)"
                  type="datetime-local"
                  value={formData.checkIn}
                  onChange={(e) =>
                    setFormData({ ...formData, checkIn: e.target.value })
                  }
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5">
                    Check Out
                  </label>
                  <div className="flex">
                    <input
                      type="date"
                      value={formData.checkOutDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkOutDate: e.target.value,
                        })
                      }
                      className="w-full bg-[#fcfbf7] border border-gray-200 border-r-0 rounded-l-[2px] py-2.5 pl-4 pr-2 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                      required
                    />
                    <div className="bg-gray-100 border border-gray-200 px-3 flex items-center rounded-r-[2px]">
                      <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                        10:00 AM
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-[2px] flex items-start gap-2">
                <AlertTriangle
                  className="text-amber-600 mt-0.5 shrink-0"
                  size={14}
                />
                <p className="text-xs text-amber-800">
                  Standard checkout time is <strong>10:00 AM</strong>. Late
                  checkout may incur extra charges.
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 mt-2">
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['Mobile Money', 'Merchant Pay', 'Cash'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, paymentMethod: method })
                      }
                      className={`py-2 px-1 text-xs font-medium border rounded-[2px] transition-all ${
                        formData.paymentMethod === method
                          ? 'bg-[#0F2027] text-[#D4AF37] border-[#0F2027]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {formData.paymentMethod === 'Mobile Money' && (
                  <div className="bg-gray-50 p-4 border border-gray-200 rounded-[2px]">
                    <Input
                      label="Momo Number for Payment"
                      value={formData.paymentPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPhone: e.target.value,
                        })
                      }
                      icon={Phone}
                      placeholder="Enter number to charge..."
                      required
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      A payment prompt will be sent to this number.
                    </p>
                  </div>
                )}

                {formData.paymentMethod === 'Merchant Pay' && (
                  <div className="bg-blue-50 p-4 border border-blue-100 rounded-[2px]">
                    <CreditCard
                      className="mx-auto text-blue-500 mb-2"
                      size={24}
                    />
                    <p className="text-xs text-blue-800 text-center mb-3">
                      Use the codes below to pay via Merchant ID:
                    </p>

                    {/* Secondary Tabs for Merchant Provider */}
                    <div className="flex border-b border-blue-200 mb-4 bg-white rounded-[2px] overflow-hidden">
                      {['MoMo Pay', 'Airtel Pay'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMerchantType(type)}
                          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                            merchantType === type
                              ? 'bg-[#0F2027] text-[#D4AF37]'
                              : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Display Code based on Sub-tab */}
                    <div className="mb-4 p-3 bg-white border border-dashed border-blue-200 rounded-sm text-center">
                      {merchantType === 'MoMo Pay' ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-gray-400 uppercase tracking-widest">
                            MoMo Pay Code
                          </p>
                          <span className="text-xl font-bold text-[#0F2027] tracking-wider">
                            92620395
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-gray-400 uppercase tracking-widest">
                            Airtel Pay Code
                          </p>
                          <span className="text-xl font-bold text-red-600 tracking-wider">
                            4392569
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Transaction ID Input - ONLY for MoMo Pay */}
                    {merchantType === 'MoMo Pay' && (
                      <div className="animate-fade-in-up">
                        <Input
                          label="Transaction ID (Required)"
                          value={formData.transactionId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              transactionId: e.target.value,
                            })
                          }
                          icon={Hash}
                          placeholder="Enter MoMo Ref ID..."
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.paymentMethod === 'Cash' && (
                  <div className="bg-green-50 p-4 border border-green-100 rounded-[2px] text-center">
                    <DollarSign
                      className="mx-auto text-green-600 mb-2"
                      size={24}
                    />
                    <p className="text-xs text-green-800">
                      Pay at the hotel front desk upon arrival.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={bookingLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={bookingLoading}>
                  {bookingLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Missing Phone Number Modal --- */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0F2027]/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2px] shadow-2xl p-8 relative animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="text-amber-500" size={24} />
              </div>
              <h2 className="font-serif text-2xl text-[#0F2027] mb-2">
                Complete Profile
              </h2>
              <p className="text-gray-500 text-sm">
                Please provide your phone number to continue with bookings.
              </p>
            </div>

            <form onSubmit={handleSavePhoneNumber} className="space-y-4">
              <Input
                label="Phone Number"
                value={phoneNumberInput}
                onChange={(e) => setPhoneNumberInput(e.target.value)}
                icon={Phone}
                required
                placeholder="+256..."
                autoFocus
              />

              <Button type="submit" className="w-full" disabled={phoneSaving}>
                {phoneSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default UserDashboard;
