import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  const logout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('demoUser');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const savedUser = localStorage.getItem('demoUser');

      if (isLoggedIn && savedUser) {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to read auth status from localStorage", error);
      logout();
    }
    setLoading(false);
  }, [logout]);

  const login = async (email: string, password: string) => {
    // Demo-only login
    if (email === 'sns@gmail.com' && password === 'password123') {
        const demoUser = { id: 'demo', email: 'sns@gmail.com' };
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('demoUser', JSON.stringify(demoUser));
        setUser(demoUser);
        setIsAuthenticated(true);
    } else {
        throw new Error("Invalid credentials. Please use sns@gmail.com and password123 for demo access.");
    }
  };
  
  const signup = async (email: string, password: string) => {
    if (email === 'sns@gmail.com') {
      throw new Error("This email is for demo login only. Please use another.");
    }
    // Simulate signup by logging in immediately
    const newUser = { id: `user_${Date.now()}`, email };
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('demoUser', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const value = { isAuthenticated, user, loading, login, signup, logout };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"></div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
