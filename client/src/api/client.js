const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const getToken = () => localStorage.getItem("ac_token");
const setToken = (t) => localStorage.setItem("ac_token", t);
const clearToken = () => localStorage.removeItem("ac_token");

async function request(method, path, body, { auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const msg =
      payload?.message || payload?.error || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const api = {
  // Auth
  registerProductor: (body) => request("POST", "/auth/register/productor", body),
  registerConsumidor: (body) => request("POST", "/auth/register/consumidor", body),
  login: (body) => request("POST", "/auth/login", body),
  me: () => request("GET", "/auth/me", null, { auth: true }),
  logout: () => request("POST", "/auth/logout", null, { auth: true }),

  // Productores
  listProductores: () => request("GET", "/productores"),
  getProductor: (id) => request("GET", `/productores/${id}`),
  updateProductor: (id, body) =>
    request("PATCH", `/productores/${id}`, body, { auth: true }),

  // Consumidores
  listConsumidores: () => request("GET", "/consumidores"),
  getConsumidor: (id) => request("GET", `/consumidores/${id}`),
  updateConsumidor: (id, body) =>
    request("PATCH", `/consumidores/${id}`, body, { auth: true }),

  // Productos
  listProductos: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/productos${q ? `?${q}` : ""}`);
  },
  getProducto: (id) => request("GET", `/productos/${id}`),
  createProducto: (body) => request("POST", "/productos", body, { auth: true }),
  updateProducto: (id, body) =>
    request("PATCH", `/productos/${id}`, body, { auth: true }),
  deleteProducto: (id) =>
    request("DELETE", `/productos/${id}`, null, { auth: true }),

  // Pedidos
  listPedidos: () => request("GET", "/pedidos", null, { auth: true }),
  getPedido: (id) => request("GET", `/pedidos/${id}`, null, { auth: true }),
  createPedido: (body) => request("POST", "/pedidos", body, { auth: true }),
  cambiarEstadoPedido: (id, estado) =>
    request("PATCH", `/pedidos/${id}/estado`, { estado }, { auth: true }),

  // Reseñas
  listResenas: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/resenas${q ? `?${q}` : ""}`, null, { auth: true });
  },
  getResena: (id) => request("GET", `/resenas/${id}`, null, { auth: true }),
  createResena: (body) => request("POST", "/resenas", body, { auth: true }),

  // Ubicaciones
  listUbicaciones: () => request("GET", "/ubicaciones"),

  // Health
  health: () => request("GET", "/health"),
};

export const tokenStore = { getToken, setToken, clearToken };
