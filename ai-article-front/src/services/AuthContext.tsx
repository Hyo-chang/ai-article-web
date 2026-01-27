// src/services/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import authService from "./auth.services";
import { User } from "../types/User";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      setIsLoggedIn(true);
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const loggedInUser = await authService.login(identifier, password);
      setUser(loggedInUser);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("AuthContext.login failed:", error);
      setUser(null);
      setIsLoggedIn(false);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const refreshUser = async () => {
    const storedUser = authService.getCurrentUser();
    setUser(storedUser);
    setIsLoggedIn(!!storedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
