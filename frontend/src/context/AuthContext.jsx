import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem("access_token")));

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      try {
        const me = await api.get("/users/me");
        if (isMounted) {
          setUser(me.data);
        }
      } catch {
        localStorage.removeItem("access_token");
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const res = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const accessToken = res.data.access_token;
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);

    const me = await api.get("/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    setUser(me.data);
    return me.data;
  };

  const register = async (fullName, email, password, role = "user") => {
    await api.post("/auth/register", {
      full_name: fullName,
      email,
      password,
      role,
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    setAuthLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, authLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
