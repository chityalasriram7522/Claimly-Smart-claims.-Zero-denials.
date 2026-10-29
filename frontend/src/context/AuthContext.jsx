import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("claimguard_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("claimguard_token");
      const storedUser = localStorage.getItem("claimguard_user");
      
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          localStorage.removeItem("claimguard_token");
          localStorage.removeItem("claimguard_user");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const res = await api.post("/auth/login", {
        username,
        password,
        remember_me: rememberMe,
      });
      const data = res.data;
      setToken(data.access_token);
      setUser(data);
      localStorage.setItem("claimguard_token", data.access_token);
      localStorage.setItem("claimguard_user", JSON.stringify(data));
      return { success: true, user: data };
    } catch (err) {
      // If backend server is unreachable (e.g. static GitHub Pages demo mode)
      if (!err.response) {
        const isProvider = username.toLowerCase().includes("provider") || username.toLowerCase().includes("prv") || !username.startsWith("POL");
        const demoUser = {
          access_token: "demo_static_token_claimly_2026",
          token_type: "bearer",
          user_id: username,
          full_name: isProvider ? "Dr. Arvind Sharma (Chief Medical Officer)" : `Policyholder (${username})`,
          role: isProvider ? "provider" : "policyholder",
          email: isProvider ? "provider@claimguard.health" : `${username.toLowerCase()}@claimguard.health`,
          provider_id: isProvider ? "PRV-8801" : null,
          policyholder_id: isProvider ? null : username,
          is_demo: true,
        };
        setToken(demoUser.access_token);
        setUser(demoUser);
        localStorage.setItem("claimguard_token", demoUser.access_token);
        localStorage.setItem("claimguard_user", JSON.stringify(demoUser));
        return { success: true, user: demoUser };
      }
      const msg = err.response?.data?.detail || "Invalid provider ID / Insurance ID or password.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("claimguard_token");
    localStorage.removeItem("claimguard_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
