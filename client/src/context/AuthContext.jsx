import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, tokenStore } from "../api/client";
import { guardarUsuarioLocal, limpiarUsuarioLocal, syncCatalogoProductos } from "../utils/syncManager";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.me();
      setUser(data);
    } catch {
      tokenStore.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (correo, clave) => {
    const { data } = await api.login({ correo, clave });
    tokenStore.setToken(data.token);
    setUser(data.user);
    // Persistir sesión y catálogo en IndexedDB para acceso offline
    await guardarUsuarioLocal(data.user, data.token);
    syncCatalogoProductos();
    return data.user;
  }, []);

  const registerProductor = useCallback(async (body) => {
    const { data } = await api.registerProductor(body);
    tokenStore.setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const registerConsumidor = useCallback(async (body) => {
    const { data } = await api.registerConsumidor(body);
    tokenStore.setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    tokenStore.clearToken();
    setUser(null);
    await limpiarUsuarioLocal();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuth: !!user,
      isProductor: user?.rol === "PRODUCTOR",
      isConsumidor: user?.rol === "CONSUMIDOR",
      login,
      registerProductor,
      registerConsumidor,
      logout,
      refresh,
      setUser,
    }),
    [user, loading, login, registerProductor, registerConsumidor, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
