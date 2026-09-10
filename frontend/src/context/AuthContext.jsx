import { createContext, useContext, useState, useEffect } from 'react';

const FIXED_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  name: 'JayJef System Admin',
  role: 'Administrator',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jayjef_auth_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const isAdmin = !!user && user.username === FIXED_ADMIN_CREDENTIALS.username;

  function login(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === FIXED_ADMIN_CREDENTIALS.username && password === FIXED_ADMIN_CREDENTIALS.password) {
      const userData = {
        username: FIXED_ADMIN_CREDENTIALS.username,
        name: FIXED_ADMIN_CREDENTIALS.name,
        role: FIXED_ADMIN_CREDENTIALS.role,
        loggedInAt: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem('jayjef_auth_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid admin username or password. Please use fixed credentials.' };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('jayjef_auth_user');
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, FIXED_ADMIN_CREDENTIALS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
