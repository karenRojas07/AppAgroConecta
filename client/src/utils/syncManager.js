/**
 * syncManager.js
 * Gestiona la sincronización entre IndexedDB y el servidor.
 * - Procesa la syncQueue cuando vuelve la conexión.
 * - Descarga el catálogo de productos al conectarse.
 * - Escucha mensajes del Service Worker para re-sincronizar.
 */

import { db } from "./db";
import { api } from "../api/client";

// ─── Sincronización del catálogo ─────────────────────────────────────────────

/**
 * Descarga todos los productos del servidor y los guarda en catalogoProductos.
 * Se invoca al conectarse o al arrancar la app con conexión.
 */
export async function syncCatalogoProductos() {
  try {
    const res = await api.listProductos();
    const productos = res.data ?? [];
    await db.catalogo.putMany(productos);
  } catch {
    // Sin conexión o error de red: se usa el caché local, sin acción
  }
}

/**
 * Guarda el usuario autenticado en usuarioLocal para acceso offline.
 */
export async function guardarUsuarioLocal(user, token) {
  if (!user) return;
  await db.usuario.save({
    idUsuario: user.id,
    rol: user.rol,
    nombre: user.nombre,
    correo: user.correo,
    tokenTemporal: token ?? "",
  });
}

/**
 * Limpia la sesión local al hacer logout.
 */
export async function limpiarUsuarioLocal() {
  await db.usuario.clear();
}

// ─── Cola de sincronización ───────────────────────────────────────────────────

/**
 * Encola una operación para enviarla cuando haya conexión.
 * @param {'pedido'|'producto'} tipoEntidad
 * @param {string} idReferencia   — idLocalPedido o idLocalProducto
 * @param {'crear'|'actualizar'|'eliminar'} accion
 */
export async function encolarOperacion(tipoEntidad, idReferencia, accion = "crear") {
  await db.syncQueue.add({ tipoEntidad, idReferencia, accion });
}

/**
 * Procesa todas las operaciones pendientes en la syncQueue.
 * Se llama automáticamente cuando el navegador vuelve a estar online.
 */
export async function procesarSyncQueue() {
  const pendientes = await db.syncQueue.getPendientes();
  if (!pendientes.length) return;

  for (const op of pendientes) {
    try {
      await procesarOperacion(op);
      await db.syncQueue.remove(op.idOperacion);
    } catch (err) {
      // Marcar como error para no bloquear otras operaciones
      await db.syncQueue.update({
        ...op,
        estado: "error",
        ultimoError: err.message,
      });
    }
  }

  // Actualizar catálogo después de sincronizar
  await syncCatalogoProductos();
}

async function procesarOperacion(op) {
  switch (op.tipoEntidad) {
    case "pedido":
      await sincronizarPedido(op);
      break;
    case "producto":
      await sincronizarProducto(op);
      break;
    default:
      throw new Error(`Tipo de entidad desconocida: ${op.tipoEntidad}`);
  }
}

// ─── Sincronización de pedidos ────────────────────────────────────────────────

async function sincronizarPedido(op) {
  if (op.accion !== "crear") return;

  const pedido = await db.pedidosPendientes.getById(op.idReferencia);
  if (!pedido || pedido.sincronizado) return;

  const detalles = await db.detallesPedido.getByPedido(op.idReferencia);

  await api.createPedido({
    tipoEntrega: pedido.tipoEntrega,
    costoEnvio: pedido.costoEnvio,
    items: detalles.map((d) => ({
      idProducto: d.idProducto,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
    })),
  });

  await db.pedidosPendientes.marcarSincronizado(pedido.idLocalPedido);
}

// ─── Sincronización de productos ──────────────────────────────────────────────

async function sincronizarProducto(op) {
  if (op.accion !== "crear") return;

  const producto = await db.productosPendientes.getById(op.idReferencia);
  if (!producto || producto.sincronizado) return;

  await api.createProducto({
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    cantidadDisponible: producto.cantidadDisponible,
  });

  await db.productosPendientes.marcarSincronizado(producto.idLocalProducto);
}

// ─── Helpers para crear pedidos con soporte offline ───────────────────────────

/**
 * Crea un pedido. Si hay conexión, lo envía al servidor directamente.
 * Si no hay conexión, lo guarda en IndexedDB y encola la operación.
 *
 * @param {{ tipoEntrega: string, costoEnvio: number, items: Array }} pedidoData
 * @returns {{ local: boolean, idLocalPedido?: string, serverResponse?: object }}
 */
export async function crearPedidoOfflineAware(pedidoData) {
  if (navigator.onLine) {
    const res = await api.createPedido(pedidoData);
    return { local: false, serverResponse: res };
  }

  // Sin conexión: guardar localmente
  const idLocalPedido = crypto.randomUUID();

  await db.pedidosPendientes.add({
    idLocalPedido,
    idConsumidor: pedidoData.idConsumidor ?? 0,
    tipoEntrega: pedidoData.tipoEntrega,
    estadoLocal: "pendiente",
    costoEnvio: pedidoData.costoEnvio ?? 0,
    total: pedidoData.total ?? 0,
    sincronizado: false,
  });

  for (const item of pedidoData.items ?? []) {
    await db.detallesPedido.add({
      idLocalPedido,
      idProducto: item.idProducto,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    });
  }

  await encolarOperacion("pedido", idLocalPedido, "crear");

  return { local: true, idLocalPedido };
}

/**
 * Crea un producto. Si hay conexión, lo envía al servidor directamente.
 * Si no hay conexión, lo guarda en IndexedDB y encola la operación.
 */
export async function crearProductoOfflineAware(productoData) {
  if (navigator.onLine) {
    const res = await api.createProducto(productoData);
    return { local: false, serverResponse: res };
  }

  const idLocalProducto = crypto.randomUUID();

  await db.productosPendientes.add({
    idLocalProducto,
    idProductor: productoData.idProductor ?? 0,
    nombre: productoData.nombre,
    descripcion: productoData.descripcion,
    precio: productoData.precio,
    cantidadDisponible: productoData.cantidadDisponible,
    fotoLocal: productoData.fotoLocal ?? "",
    sincronizado: false,
  });

  await encolarOperacion("producto", idLocalProducto, "crear");

  return { local: true, idLocalProducto };
}

// ─── Registro de listeners ────────────────────────────────────────────────────

/**
 * Registra el listener de "online" para procesar la cola automáticamente.
 * También escucha mensajes del Service Worker.
 * Llamar una vez al iniciar la app.
 */
export function iniciarSyncManager() {
  window.addEventListener("online", () => {
    procesarSyncQueue();
    syncCatalogoProductos();
  });

  // Escuchar mensaje del SW cuando detecta conexión (Background Sync)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "PROCESS_SYNC_QUEUE") {
        procesarSyncQueue();
      }
    });
  }

  // Si ya hay conexión al arrancar, sincronizar
  if (navigator.onLine) {
    procesarSyncQueue();
    syncCatalogoProductos();
  }
}
