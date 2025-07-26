"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import api from "@/services/api";

interface AuthUser {
  id: number;
  username: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("access_token");

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsAuthReady(true);
    }
  }, [mounted]);

  const login = async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });
    const { access_token, user } = response.data;

    if (!access_token || !user) {
      throw new Error("Login falhou: resposta inválida.");
    }

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    setToken(access_token);
    setIsAuthReady(true);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setIsAuthReady(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
