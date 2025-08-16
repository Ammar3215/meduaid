import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { apiPost } from '../utils/api';

interface User {
  email: string;
  name?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (email: string) => Promise<boolean>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Activity-based auto-logout configuration
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const handleAutoLogout = useCallback(() => {
    console.log('[AUTH] Auto-logout triggered due to inactivity');
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    // Show user notification
    if (window.confirm('Your session has expired due to inactivity. Click OK to refresh the page.')) {
      window.location.reload();
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    if (user) {
      inactivityTimeoutRef.current = setTimeout(handleAutoLogout, INACTIVITY_TIMEOUT);
    }
  }, [user, handleAutoLogout, INACTIVITY_TIMEOUT]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        // Failed to parse user data from localStorage
        setUser(null);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Set up activity tracking when user is logged in
  useEffect(() => {
    if (!user) {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      return;
    }

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetInactivityTimer();

    // Tab visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - stop the timer
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      } else {
        // Tab became visible - restart the timer
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiPost('/api/auth/login', { email, password });
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        // Store JWT token for API authentication
        localStorage.setItem('auth_token', response.token);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await apiPost('/api/auth/register', { name: email.split('@')[0], email, password });
      if (response.success) {
        // For registration, we don't get user data back immediately
        // The user needs to verify their email first
        return true;
      }
      return false;
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
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      // Call backend logout to clear httpOnly cookie
      await apiPost('/api/auth/logout');
    } catch (error) {
      // Logout request failed - continue with local cleanup anyway
    }
    
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token'); // Clear JWT token
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, verifyEmail, loading, setUser }}>
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