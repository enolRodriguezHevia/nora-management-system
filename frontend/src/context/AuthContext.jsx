import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("nora_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const isAdmin = user?.rol === "admin";
  const isTerapeuta = user?.rol === "terapeuta";

  function logout() {
    localStorage.removeItem("nora_token");
    localStorage.removeItem("nora_user");
    setUser(null);
    window.location.href = "/login";
  }

  function setLoggedUser(userData) {
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isTerapeuta, logout, setLoggedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
