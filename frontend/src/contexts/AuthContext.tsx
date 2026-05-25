// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar?: string;
};

type AuthContextData = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (full_name: string, email: string, password: string) => Promise<User>; // ✅ Adicionar register
  googleLogin: (email: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sToken, sUser, sRefreshToken] = await Promise.all([
          AsyncStorage.getItem("access_token"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("refresh_token"),
        ]);
        
        if (sToken) setToken(sToken);
        if (sUser) setUser(JSON.parse(sUser));
        
        console.log("🔐 Auth loaded:", { 
          hasToken: !!sToken, 
          hasUser: !!sUser,
          hasRefreshToken: !!sRefreshToken 
        });
      } catch (error) {
        console.error("Error loading auth:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string): Promise<User> {
    console.log("🔐 Attempting login with:", { email });
    
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("📡 Login response:", response);
      
      const data = response.data || response;
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const userData = data.user;

      if (!accessToken) {
        console.error("No access token in response:", data);
        throw new Error("Falha na autenticação");
      }

      console.log("✅ Login successful, saving tokens");
      
      await Promise.all([
        AsyncStorage.setItem("access_token", accessToken),
        refreshToken ? AsyncStorage.setItem("refresh_token", refreshToken) : null,
        AsyncStorage.setItem("user", JSON.stringify(userData)),
      ].filter(Boolean));

      setToken(accessToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  }

  // ✅ Implementar função register
  async function register(full_name: string, email: string, password: string): Promise<User> {
    console.log("📝 Attempting registration with:", { full_name, email });
    
    try {
      const response = await api.post("/auth/register", { 
        full_name, 
        email, 
        password 
      });
      
      console.log("📡 Register response:", response);
      
      const data = response.data || response;
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const userData = data.user;

      if (!accessToken) {
        console.error("No access token in response:", data);
        throw new Error("Falha no cadastro");
      }

      console.log("✅ Registration successful, saving tokens");
      
      await Promise.all([
        AsyncStorage.setItem("access_token", accessToken),
        refreshToken ? AsyncStorage.setItem("refresh_token", refreshToken) : null,
        AsyncStorage.setItem("user", JSON.stringify(userData)),
      ].filter(Boolean));

      setToken(accessToken);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("❌ Register error:", error);
      throw error;
    }
  }

  async function googleLogin(email: string, name: string): Promise<User> {
    console.log("Google Login:", email, name);
    throw new Error("Google login not implemented yet");
  }

  async function logout() {
    console.log("🔓 Logging out");
    await AsyncStorage.multiRemove(["access_token", "refresh_token", "user"]);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const response = await api.get("/auth/me");
      const userData = response.data || response;
      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        loading, 
        login,
        register,  // ✅ Expor register
        googleLogin, 
        logout, 
        refreshUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);