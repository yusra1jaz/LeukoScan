import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

export type User = {
  id?: number;
  username: string;
  fullName?: string;
  email?: string;
  role: "admin" | "doctor" | "user";
} | null;

type AuthContextType = {
  user: User;
  login: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; user?: User; message?: string }>;
  logout: () => Promise<void>;
  signup: (data: { username: string; email: string; password: string }) => Promise<{ ok: boolean; user?: User; message?: string }>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const AuthProvider: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Debug state changes
  useEffect(() => {
    console.log('AuthContext state changed:', { user: user?.username, loading });
  }, [user, loading]);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth...');
        const res = await fetch(`${API_URL}/api/me`, {
          credentials: "include"
        });
        const data = await res.json();
        console.log('Auth check response:', { status: res.status, data });
        if (res.ok && data.user) {
          console.log('User authenticated:', data.user);
          setUser(data.user);
        } else {
          console.log('User not authenticated');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    try {
      console.log('Login attempt:', { usernameOrEmail, API_URL });
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();
      console.log('Login response:', { status: res.status, data });
      if (res.ok && data.user) {
        console.log('Setting user:', data.user);
        setUser(data.user);
        setLoading(false); // Reset loading state after successful login
        return { ok: true, user: data.user };
      }
      return { ok: false, message: data.message || "Login failed" };
    } catch (err) {
      console.error('Login error:', err);
      return { ok: false, message: "Network error" };
    } finally { 
      setLoading(false);
    }
  };

  const signup = async (payload: { username: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setLoading(false); // Reset loading state after successful signup
        return { ok: true, user: data.user };
      }
      return { ok: false, message: data.message || "Signup failed" };
    } catch (err) {
      console.error(err);
      return { ok: false, message: "Network error" };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    try { 
      await fetch(`${API_URL}/api/logout`, { method: "POST", credentials: "include" });
      // Clear diagnosis results from localStorage on logout
      localStorage.removeItem('diagnosisResult');
      localStorage.removeItem('previewUrl');
    }
    catch (err) { console.error(err); }
    finally { 
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, login, logout, signup, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
