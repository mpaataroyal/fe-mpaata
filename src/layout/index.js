'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 
import { 
  Calendar, CreditCard, LogOut, User, ArrowRight, Menu, 
  TrendingUp, Users, Settings, Search, X, Loader2,
  Home, Globe 
} from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

import { auth, googleProvider } from '@/libs/firebase';
import { api } from '@/libs/apiAgent';

// --- Login Screen Component ---
const LoginScreen = ({ onLogin, isLoggingIn }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#fcfbf7] relative overflow-hidden font-sans">
    <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
    <div className="w-full max-w-md bg-white p-8 md:p-12 shadow-2xl relative z-10 border-t-4 border-[#D4AF37]">
      <div className="text-center mb-10">
        <div className="w-12 h-12 border-2 border-[#0F2027] flex items-center justify-center mx-auto mb-4">
          <span className="font-serif text-2xl text-[#0F2027]">M</span>
        </div>
        <h1 className="font-serif text-3xl text-[#0F2027] mb-2">Welcome Back</h1>
        <p className="text-gray-500 text-sm">Sign in to access the Empire Dashboard</p>
      </div>
      <div className="space-y-3">
        <button 
          onClick={onLogin}
          disabled={isLoggingIn}
          className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-[#0F2027] border border-[#0F2027] hover:brightness-110 transition-all rounded-[2px] group text-white disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <Loader2 className="animate-spin text-[#D4AF37]" size={20} />
          ) : (
            <>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
              <span className="font-medium text-[#D4AF37]">Continue with Google</span>
              <ArrowRight size={16} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform ml-auto" />
            </>
          )}
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-8">Secured by MPAATA Identity Service.</p>
    </div>
  </div>
);

// --- Layout Component ---
const DashboardLayout = ({ children }) => {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const idTokenResult = await currentUser.getIdTokenResult();
          const role = idTokenResult.claims.role || 'client'; 
          
          setUser({
            uid: currentUser.uid,
            name: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            role: role
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      await api.auth.googleLogin(idToken); 
      const idTokenResult = await user.getIdTokenResult(true);
      const role = idTokenResult.claims.role || 'client';

      setUser({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: role
      });

    } catch (error) {
      console.error("Login Failed:", error);
      alert("Login failed. Please try again.");
    } finally {
       setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout Failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fcfbf7] text-[#0F2027]">
        <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={40} />
        <p className="font-serif animate-pulse">Entering the Empire...</p>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={handleGoogleLogin} isLoggingIn={isLoggingIn} />;

  // 2. DEFINE MENU ITEMS BASED ON ROLE
  const isAdmin = ['admin', 'super_admin', 'manager'].includes(user.role);
  const isReceptionist = user.role === 'receptionist';
  
  let menuItems = [];

  if (isAdmin) {
    menuItems = [
      { label: 'Dashboard', icon: TrendingUp, href: '/admin/dashboard' },
      { label: 'Users', icon: Users, href: '/admin/users' },
      { label: 'Rooms', icon: Home, href: '/admin/rooms' },
      { label: 'Bookings', icon: Calendar, href: '/admin/bookings' },
      { label: 'Payments', icon: CreditCard, href: '/admin/payments' }
    ];
  } else if (isReceptionist) {
    // Receptionist Menu (Restricted Admin Layout)
    menuItems = [
      { label: 'Bookings', icon: Calendar, href: '/admin/bookings' },
      { label: 'Rooms', icon: Home, href: '/admin/rooms' },
      { label: 'Payments', icon: CreditCard, href: '/admin/payments' },
    ];
  } else {
    // Client Menu (Fallback for sidebar view)
    menuItems = [
      { label: 'My Bookings', icon: Calendar, href: '/bookings' },
      { label: 'My Payments', icon: CreditCard, href: '/payments' },
      { label: 'Profile', icon: User, href: '/profile' },
    ];
  }

  return (
    <div className="h-screen bg-[#fcfbf7] flex font-sans text-gray-900 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>}
      
      <aside className={`fixed md:relative w-64 bg-[#0F2027] text-white h-full z-40 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#D4AF37] flex items-center justify-center"><span className="font-serif font-bold text-[#D4AF37]">M</span></div>
            <span className="font-serif tracking-widest font-bold">MPAATA</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={20} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link 
                key={index} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-[2px] transition-all group hover:bg-white/5 ${
                  isActive ? 'bg-[#D4AF37] text-[#0F2027] font-bold shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-[#0F2027]' : 'text-gray-400 group-hover:text-[#D4AF37]'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#0a161b] shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full border border-[#D4AF37]" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F3E5AB] flex items-center justify-center text-[#0F2027] font-bold shadow-lg">{user.name ? user.name.charAt(0) : 'U'}</div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-[2px] transition-colors"><LogOut size={14} /> Sign Out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded"><Menu size={24} /></button>
          <div className="hidden md:flex items-center bg-[#fcfbf7] px-3 py-2 rounded-[2px] w-96 border border-transparent focus-within:border-[#D4AF37] transition-colors">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm ml-2 w-full placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-4">
             {/* Replaced Bell with Visit Site */}
            <Link 
              href="/" 
              target="_blank" 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-[2px] hover:border-[#D4AF37] hover:text-[#0F2027] transition-all"
            >
              <Globe size={14} /> Visit Site
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fcfbf7]">{children}</main>
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Lato', sans-serif; }
      `}</style>
    </div>
  );
};

export default DashboardLayout;