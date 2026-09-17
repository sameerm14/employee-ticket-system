import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user after page refresh
  useEffect(() => {
    const restoreUser = async () => {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));

        // Check token expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
          return;
        }

        // Get complete user information from backend
        const response = await api.get("/api/auth/me");

        setUser(response.data);
      } catch (error) {
        console.error("Unable to restore user:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { access_token, refresh_token } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // Get complete user information
      const userResponse = await api.get("/api/auth/me");

      setUser(userResponse.data);

      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
