/**
 * perifericos.js
 * Helpers para acceder a APIs del dispositivo:
 *   - Cámara (MediaDevices.getUserMedia)
 *   - Lectura de QR (BarcodeDetector)
 *   - Sensores de orientación (DeviceOrientationEvent)
 *   - Web Bluetooth (navigator.bluetooth)
 *   - Network Information API (navigator.connection)
 *
 * Cada función está pensada para usarse de forma defensiva: detecta soporte
 * antes de llamar a la API y maneja errores comunes (permisos, no soporte).
 */

// ─── Cámara ──────────────────────────────────────────────────────────────────

export const camera = {
  isSupported() {
    return Boolean(navigator.mediaDevices?.getUserMedia);
  },

  /**
   * Abre la cámara y devuelve un MediaStream listo para conectar a un <video>.
   * @param {'environment'|'user'} facingMode  trasera ('environment') o frontal ('user')
   */
  async open(facingMode = "environment") {
    if (!camera.isSupported()) throw new Error("Cámara no soportada en este navegador");
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });
  },

  /**
   * Detiene todas las pistas de un MediaStream.
   */
  stop(stream) {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
  },

  /**
   * Captura un frame del <video> y devuelve un Blob (image/jpeg).
   * @param {HTMLVideoElement} videoEl
   * @param {number} quality  0.0 – 1.0
   */
  async snapshot(videoEl, quality = 0.85) {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
        "image/jpeg",
        quality
      );
    });
  },
};

// ─── Lectura de QR ───────────────────────────────────────────────────────────

export const qr = {
  isSupported() {
    return typeof window.BarcodeDetector !== "undefined";
  },

  /**
   * Detecta códigos QR en un frame de video. Devuelve el texto del primer QR
   * encontrado, o null si no hay ninguno.
   * @param {HTMLVideoElement} videoEl
   */
  async detect(videoEl) {
    if (!qr.isSupported()) {
      throw new Error("BarcodeDetector no está disponible en este navegador (usa Chrome/Edge en Android o Mac).");
    }
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const codes = await detector.detect(videoEl);
    return codes.length ? codes[0].rawValue : null;
  },
};

// ─── Sensores: orientación / giroscopio ──────────────────────────────────────

export const sensores = {
  isSupported() {
    return typeof window.DeviceOrientationEvent !== "undefined";
  },

  /**
   * Solicita permiso en iOS 13+ (en Android/desktop suele devolver "granted").
   */
  async pedirPermiso() {
    const C = window.DeviceOrientationEvent;
    if (C && typeof C.requestPermission === "function") {
      return C.requestPermission();
    }
    return "granted";
  },

  /**
   * Comienza a escuchar la orientación del dispositivo.
   * Llama a `callback({alpha, beta, gamma})` cada vez que cambia.
   * @returns función para detener la escucha.
   */
  escuchar(callback) {
    const handler = (e) =>
      callback({
        alpha: e.alpha, // brújula (0–360)
        beta: e.beta, // inclinación frente-atrás (-180 a 180)
        gamma: e.gamma, // inclinación lateral (-90 a 90)
      });
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  },
};

// ─── Web Bluetooth ───────────────────────────────────────────────────────────

export const bluetooth = {
  isSupported() {
    return Boolean(navigator.bluetooth);
  },

  /**
   * Abre el diálogo del navegador para emparejar un dispositivo Bluetooth LE.
   * Devuelve el objeto BluetoothDevice (no se conecta automáticamente).
   */
  async pedirDispositivo() {
    if (!bluetooth.isSupported()) {
      throw new Error("Web Bluetooth no está disponible (requiere Chrome/Edge en HTTPS).");
    }
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["battery_service", "device_information"],
    });
  },

  /**
   * Intenta leer el nivel de batería del servicio 'battery_service' si existe.
   * Devuelve un número 0–100 o null si el dispositivo no expone ese servicio.
   */
  async leerBateria(device) {
    if (!device?.gatt) throw new Error("Dispositivo sin GATT");
    const server = await device.gatt.connect();
    try {
      const service = await server.getPrimaryService("battery_service");
      const characteristic = await service.getCharacteristic("battery_level");
      const value = await characteristic.readValue();
      return value.getUint8(0);
    } catch {
      return null;
    } finally {
      try { server.disconnect(); } catch { /* ignore */ }
    }
  },
};

// ─── Network Information API ─────────────────────────────────────────────────

export const network = {
  /**
   * Devuelve el estado actual de la conexión.
   * - online: boolean
   * - effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | null
   * - downlink: Mbps estimados
   * - rtt: latencia estimada en ms
   * - saveData: modo ahorro activo
   */
  getEstado() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      online: navigator.onLine,
      effectiveType: c?.effectiveType ?? null,
      downlink: c?.downlink ?? null,
      rtt: c?.rtt ?? null,
      saveData: c?.saveData ?? false,
      soportado: Boolean(c),
    };
  },

  /**
   * Suscribe a cambios online/offline y al evento 'change' de connection.
   * Llama a `callback(estado)` con el estado actualizado.
   * @returns función para desuscribirse.
   */
  suscribir(callback) {
    const emit = () => callback(network.getEstado());
    const c = navigator.connection;
    window.addEventListener("online", emit);
    window.addEventListener("offline", emit);
    c?.addEventListener?.("change", emit);
    return () => {
      window.removeEventListener("online", emit);
      window.removeEventListener("offline", emit);
      c?.removeEventListener?.("change", emit);
    };
  },
};

// ─── Almacenamiento de imágenes en IndexedDB ─────────────────────────────────

/**
 * Convierte un Blob a Data URL (base64) — útil para previsualizar imágenes
 * guardadas en IndexedDB sin tener que volver a crear ObjectURLs.
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
