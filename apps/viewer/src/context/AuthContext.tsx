import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  email: string;
  role: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role?: "admin" | "editor" | "viewer") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "peblo_viewer_auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user && parsed.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Call backend /api/auth/login to authenticate credentials
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!res.ok) {
      let msg = "Invalid email or password";
      try {
        const data = await res.json();
        if (data.detail) {
          msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        }
      } catch {
        // ignore parse error
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const newUser: User = {
      email: email.trim(),
      role: data.role || "viewer",
      name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
    };

    setUser(newUser);
    setToken(data.access_token);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: newUser, token: data.access_token })
    );
  };

  const quickLogin = async (role: "admin" | "editor" | "viewer" = "viewer") => {
    if (role === "admin") {
      await login("admin@peblo.tv", "admin123");
    } else if (role === "editor") {
      await login("editor@peblo.tv", "editor123");
    } else {
      await login("viewer@peblo.tv", "viewer123");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
