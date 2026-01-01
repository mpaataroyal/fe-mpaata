"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../libs/firebase";
import { api } from "../libs/apiAgent";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  backendUser: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isStaff: false,
  googleLogin: async () => { console.warn("AuthContext: Provider is missing!"); },
  logout: async () => { console.warn("AuthContext: Provider is missing!"); },
  checkPermission: (requiredRole) => false,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          const response = await api.auth.googleLogin(idToken);
          
          if (response.success) {
            setBackendUser(response.data.user);
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error("Backend sync failed:", error);
          await signOut(auth);
          setUser(null);
          setBackendUser(null);
        }
      } else {
        setBackendUser(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const response = await api.auth.googleLogin(idToken);
      
      if (!response.success) {
        throw new Error(response.message || "Backend authentication failed");
      }
      
      setBackendUser(response.data.user);
      return result.user;
    } catch (error) {
      console.error("Login failed:", error);
      await signOut(auth);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout().catch(console.error);
      await signOut(auth);
      setUser(null);
      setBackendUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  // Check if user has required permission
  const checkPermission = (requiredRole) => {
    if (!backendUser) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'staff': 2,
      'customer': 1
    };
    
    const userLevel = roleHierarchy[backendUser.role?.toLowerCase()] || 0;
    const requiredLevel = roleHierarchy[requiredRole?.toLowerCase()] || 0;
    
    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    backendUser,
    loading,
    isAuthenticated: !!user && !!backendUser,
    isAdmin: backendUser?.role?.toLowerCase() === 'admin',
    isStaff: ['admin', 'staff'].includes(backendUser?.role?.toLowerCase()),
    googleLogin,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};