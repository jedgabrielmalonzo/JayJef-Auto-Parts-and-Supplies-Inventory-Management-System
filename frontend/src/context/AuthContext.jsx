import { createContext, useContext, useState, useEffect } from 'react';

const FIXED_ADMIN_CREDENTIALS = {
  username: 'jayjef2014@gmail.com',
  email: 'jayjef2014@gmail.com',
  password: 'jayjef2014',
  name: 'JayJef System Admin',
  role: 'Administrator',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore persisted session from localStorage so browser refresh doesn't log the user out
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jayjef_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username === FIXED_ADMIN_CREDENTIALS.username || parsed?.username === 'admin') {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const isAdmin = !!user && (user.username === FIXED_ADMIN_CREDENTIALS.username || user.username === 'admin');

  function login(usernameInput, passwordInput) {
    const clean = usernameInput.trim().toLowerCase();
    const isValidUsername = clean === 'jayjef2014@gmail.com' || clean === 'admin';
    const isValidPassword = passwordInput === 'jayjef2014' || passwordInput === 'admin123';

    if (isValidUsername && isValidPassword) {
      const userData = {
        username: FIXED_ADMIN_CREDENTIALS.username,
        email: FIXED_ADMIN_CREDENTIALS.email,
        name: FIXED_ADMIN_CREDENTIALS.name,
        role: FIXED_ADMIN_CREDENTIALS.role,
        loggedInAt: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem('jayjef_auth_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
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
