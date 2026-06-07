import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import api from "@/lib/axios"; // ✅ Use api instance
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = "fow_current_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (savedUser && access && refresh) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } else {
      // Missing tokens → clear everything to avoid stale state
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("auth/login/", { email, password });

      // ✅ Extract tokens & user
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // const loggedUser: User = res.data.user;
      const loggedUser: User = {
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.full_name,
        phone: res.data.user.phone || "",
        is_staff: res.data.user.is_staff || false,
      };
      setUser(loggedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(loggedUser));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || "Invalid email or password",
      };
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...data };
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  };
  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => {
    try {
      await api.post("auth/register/", {
        full_name: name,
        email,
        phone,
        password,
      });

      return await login(email, password);
      // return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.email?.[0] || "Registration failed",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
