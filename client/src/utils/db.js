/**
 * AgroConectaDB — IndexedDB utility
 * Estructura basada en el diagrama UML de la PWA.
 */

const DB_NAME = "AgroConectaDB";
const DB_VERSION = 1;

export const STORES = {
  CATALOGO_PRODUCTOS: "catalogoProductos",
  SYNC_QUEUE: "syncQueue",
  USUARIO_LOCAL: "usuarioLocal",
  PRODUCTOS_PENDIENTES: "productosPendientes",
  PEDIDOS_PENDIENTES: "pedidosPendientes",
  DETALLE_PEDIDO_LOCAL: "detallePedidoLocal",
};

// ─── Apertura de la BD ───────────────────────────────────────────────────────

let _dbInstance = null;

function openDB() {
  if (_dbInstance) return Promise.resolve(_dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // catalogoProductos — copia local del catálogo para consulta offline
      if (!db.objectStoreNames.contains(STORES.CATALOGO_PRODUCTOS)) {
        db.createObjectStore(STORES.CATALOGO_PRODUCTOS, {
          keyPath: "idProducto",
        });
      }

      // syncQueue — cola de operaciones pendientes cuando vuelve la conexión
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: "idOperacion",
        });
        syncStore.createIndex("estado", "estado", { unique: false });
        syncStore.createIndex("tipoEntidad", "tipoEntidad", { unique: false });
      }

      // usuarioLocal — guarda la sesión local del productor o consumidor
      if (!db.objectStoreNames.contains(STORES.USUARIO_LOCAL)) {
        db.createObjectStore(STORES.USUARIO_LOCAL, { keyPath: "idUsuario" });
      }

      // productosPendientes — productos creados sin internet o aún no enviados
      if (!db.objectStoreNames.contains(STORES.PRODUCTOS_PENDIENTES)) {
        const store = db.createObjectStore(STORES.PRODUCTOS_PENDIENTES, {
          keyPath: "idLocalProducto",
        });
        store.createIndex("sincronizado", "sincronizado", { unique: false });
        store.createIndex("idProductor", "idProductor", { unique: false });
      }

      // pedidosPendientes — pedidos creados sin internet o aún no enviados
      if (!db.objectStoreNames.contains(STORES.PEDIDOS_PENDIENTES)) {
        const store = db.createObjectStore(STORES.PEDIDOS_PENDIENTES, {
          keyPath: "idLocalPedido",
        });
        store.createIndex("sincronizado", "sincronizado", { unique: false });
        store.createIndex("idConsumidor", "idConsumidor", { unique: false });
      }

      // detallePedidoLocal — líneas de cada pedido pendiente
      if (!db.objectStoreNames.contains(STORES.DETALLE_PEDIDO_LOCAL)) {
        const store = db.createObjectStore(STORES.DETALLE_PEDIDO_LOCAL, {
          keyPath: "idDetalleLocal",
        });
        store.createIndex("idLocalPedido", "idLocalPedido", { unique: false });
        store.createIndex("idProducto", "idProducto", { unique: false });
      }
    };

    request.onsuccess = () => {
      _dbInstance = request.result;
      // Limpiar la instancia si la BD se cierra inesperadamente
      _dbInstance.onclose = () => { _dbInstance = null; };
      resolve(_dbInstance);
    };

    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB bloqueada: cierra otras pestañas de la app."));
  });
}

// ─── Helpers genéricos ───────────────────────────────────────────────────────

async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getById(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putMany(storeName, items) {
  if (!items.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    items.forEach((item) => store.put(item));
  });
}

async function remove(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const index = tx.objectStore(storeName).index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── API pública ─────────────────────────────────────────────────────────────

export const db = {
  STORES,

  /**
   * catalogoProductos
   * Copia local del catálogo para consulta offline.
   */
  catalogo: {
    getAll: () => getAll(STORES.CATALOGO_PRODUCTOS),
    getById: (idProducto) => getById(STORES.CATALOGO_PRODUCTOS, idProducto),
    put: (item) => put(STORES.CATALOGO_PRODUCTOS, { ...item, fechaSync: new Date().toISOString() }),
    putMany: (items) =>
      putMany(
        STORES.CATALOGO_PRODUCTOS,
        items.map((i) => ({ ...i, fechaSync: new Date().toISOString() }))
      ),
    clear: () => clearStore(STORES.CATALOGO_PRODUCTOS),
  },

  /**
   * syncQueue
   * Cola de operaciones pendientes cuando vuelve la conexión.
   */
  syncQueue: {
    getAll: () => getAll(STORES.SYNC_QUEUE),
    getPendientes: () => getByIndex(STORES.SYNC_QUEUE, "estado", "pendiente"),
    add: (op) =>
      put(STORES.SYNC_QUEUE, {
        ...op,
        idOperacion: op.idOperacion ?? crypto.randomUUID(),
        fecha: op.fecha ?? new Date().toISOString(),
        estado: "pendiente",
      }),
    update: (op) => put(STORES.SYNC_QUEUE, op),
    remove: (idOperacion) => remove(STORES.SYNC_QUEUE, idOperacion),
    clear: () => clearStore(STORES.SYNC_QUEUE),
  },

  /**
   * usuarioLocal
   * Guarda la sesión local del productor o consumidor.
   */
  usuario: {
    get: async () => {
      const all = await getAll(STORES.USUARIO_LOCAL);
      return all[0] ?? null;
    },
    save: (u) => put(STORES.USUARIO_LOCAL, { ...u, ultimoAcceso: new Date().toISOString() }),
    clear: () => clearStore(STORES.USUARIO_LOCAL),
  },

  /**
   * productosPendientes
   * Productos creados sin internet o aún no enviados al servidor.
   */
  productosPendientes: {
    getAll: () => getAll(STORES.PRODUCTOS_PENDIENTES),
    getById: (id) => getById(STORES.PRODUCTOS_PENDIENTES, id),
    getNoSincronizados: () =>
      getByIndex(STORES.PRODUCTOS_PENDIENTES, "sincronizado", false),
    add: (p) =>
      put(STORES.PRODUCTOS_PENDIENTES, {
        ...p,
        idLocalProducto: p.idLocalProducto ?? crypto.randomUUID(),
        sincronizado: false,
      }),
    update: (p) => put(STORES.PRODUCTOS_PENDIENTES, p),
    marcarSincronizado: async (idLocal) => {
      const item = await getById(STORES.PRODUCTOS_PENDIENTES, idLocal);
      if (item) return put(STORES.PRODUCTOS_PENDIENTES, { ...item, sincronizado: true });
    },
    remove: (id) => remove(STORES.PRODUCTOS_PENDIENTES, id),
  },

  /**
   * pedidosPendientes
   * Pedidos creados sin internet o aún no enviados al servidor.
   */
  pedidosPendientes: {
    getAll: () => getAll(STORES.PEDIDOS_PENDIENTES),
    getById: (id) => getById(STORES.PEDIDOS_PENDIENTES, id),
    getNoSincronizados: () =>
      getByIndex(STORES.PEDIDOS_PENDIENTES, "sincronizado", false),
    add: (p) =>
      put(STORES.PEDIDOS_PENDIENTES, {
        ...p,
        idLocalPedido: p.idLocalPedido ?? crypto.randomUUID(),
        fechaCreacion: p.fechaCreacion ?? new Date().toISOString(),
        estadoLocal: p.estadoLocal ?? "pendiente",
        sincronizado: false,
      }),
    update: (p) => put(STORES.PEDIDOS_PENDIENTES, p),
    marcarSincronizado: async (idLocal) => {
      const item = await getById(STORES.PEDIDOS_PENDIENTES, idLocal);
      if (item) return put(STORES.PEDIDOS_PENDIENTES, { ...item, sincronizado: true });
    },
    remove: (id) => remove(STORES.PEDIDOS_PENDIENTES, id),
  },

  /**
   * detallePedidoLocal
   * Líneas de cada pedido pendiente.
   */
  detallesPedido: {
    getAll: () => getAll(STORES.DETALLE_PEDIDO_LOCAL),
    getByPedido: (idLocalPedido) =>
      getByIndex(STORES.DETALLE_PEDIDO_LOCAL, "idLocalPedido", idLocalPedido),
    add: (d) =>
      put(STORES.DETALLE_PEDIDO_LOCAL, {
        ...d,
        idDetalleLocal: d.idDetalleLocal ?? crypto.randomUUID(),
        subtotal: d.subtotal ?? d.cantidad * d.precioUnitario,
      }),
    update: (d) => put(STORES.DETALLE_PEDIDO_LOCAL, d),
    removeByPedido: async (idLocalPedido) => {
      const items = await getByIndex(STORES.DETALLE_PEDIDO_LOCAL, "idLocalPedido", idLocalPedido);
      await Promise.all(items.map((i) => remove(STORES.DETALLE_PEDIDO_LOCAL, i.idDetalleLocal)));
    },
    remove: (id) => remove(STORES.DETALLE_PEDIDO_LOCAL, id),
  },
};
