import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  email: string;
  name?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  jwt: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (email: string) => Promise<boolean>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setJwt(token);
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data from localStorage", error);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('jwt');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      setUser(data.user);
      setJwt(data.token);
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: email.split('@')[0], email, password }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      setUser(data.user);
      setJwt(data.token);
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  };

  const verifyEmail = async (email: string) => {
    // Simulate email verification (optional: implement backend endpoint)
    if (user && user.email === email) {
      const verifiedUser = { ...user, isVerified: true };
      setUser(verifiedUser);
      localStorage.setItem('user', JSON.stringify(verifiedUser));
      setJwt(jwt || '');
      localStorage.setItem('jwt', jwt || '');
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setJwt(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, jwt, login, signup, logout, verifyEmail, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 