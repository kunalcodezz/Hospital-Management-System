import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin" | "superadmin";
  emailVerified?: boolean;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set default base URL for API calls
axios.defaults.baseURL = import.meta.env.VITE_API_URL || window.location.origin;

// Setup Request Interceptor to add access token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleForceLogout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    
    const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
    const isPublicRoute = publicRoutes.includes(window.location.pathname);
    if (!isPublicRoute) {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // Setup Response Interceptor to handle automatic silent token refreshes on 401
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 && 
          error.response?.data?.message === "Access token expired" && 
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          try {
            const rt = localStorage.getItem("refreshToken");
            if (rt) {
              const res = await axios.post("/api/auth/refresh", { refreshToken: rt });
              const newAccessToken = res.data.accessToken;
              
              localStorage.setItem("token", newAccessToken);
              setToken(newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshErr) {
            handleForceLogout();
          }
        }
        return Promise.reject(error);
      }
    );

    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      
      if (storedToken) {
        try {
          const res = await axios.get("/api/users/me", {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.data.success) {
            const u = res.data.user;
            const normalizedUser: User = {
              id: u._id || u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              emailVerified: u.emailVerified
            };
            setToken(storedToken);
            setRefreshToken(storedRefreshToken);
            setUser(normalizedUser);
            localStorage.setItem("user", JSON.stringify(normalizedUser));
          } else {
            handleForceLogout();
          }
        } catch (error: any) {
          console.error("Token verification failed on startup:", error);
          if (error.response?.status === 401 && storedRefreshToken) {
            try {
              const res = await axios.post("/api/auth/refresh", { refreshToken: storedRefreshToken });
              const newAccessToken = res.data.accessToken;
              
              localStorage.setItem("token", newAccessToken);
              setToken(newAccessToken);
              setRefreshToken(storedRefreshToken);
              
              const meRes = await axios.get("/api/users/me", {
                headers: { Authorization: `Bearer ${newAccessToken}` }
              });
              
              if (meRes.data.success) {
                const u = meRes.data.user;
                const normalizedUser: User = {
                  id: u._id || u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  emailVerified: u.emailVerified
                };
                setUser(normalizedUser);
                localStorage.setItem("user", JSON.stringify(normalizedUser));
              } else {
                handleForceLogout();
              }
            } catch (refreshErr) {
              console.error("Token refresh failed on startup:", refreshErr);
              handleForceLogout();
            }
          } else {
            handleForceLogout();
          }
        }
      } else {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = (accessToken: string, newRefreshToken: string, newUser: User) => {
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      const rt = localStorage.getItem("refreshToken");
      await axios.post("/api/auth/logout", { refreshToken: rt });
    } catch (err) {
      console.error("Auth logout endpoint error:", err);
    } finally {
      handleForceLogout();
    }
  };

  const logoutAll = async () => {
    try {
      await axios.post("/api/auth/logout-all");
    } catch (err) {
      console.error("Auth logout-all error:", err);
    } finally {
      handleForceLogout();
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshUserData = async () => {
    try {
      const res = await axios.get("/api/users/me");
      if (res.data.success) {
        const u = res.data.user;
        const normalizedUser: User = {
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          emailVerified: u.emailVerified
        };
        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      }
    } catch (error) {
      console.error("Failed to refresh user data", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        logoutAll,
        updateUser,
        isAuthenticated: !!token,
        refreshUserData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
