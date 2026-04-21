const API_BASE = "/api/v1";

const token = localStorage.getItem("agroconecta_token");
const savedUser = JSON.parse(localStorage.getItem("agroconecta_user") || "null");

if (!token || !savedUser) {
  window.location.replace("./index.html");
}

const currentUser = savedUser || {
  idUsuario: 0,
  nombre: "",
  rol: "",
};

const welcomeTitle = document.getElementById("welcome-title");
const welcomeSubtitle = document.getElementById("welcome-subtitle");
const logoutBtn = document.getElementById("logout-btn");

const productsList = document.getElementById("products-list");
const productsStatus = document.getElementById("products-status");

const ordersList = document.getElementById("orders-list");
const ordersStatus = document.getElementById("orders-status");

const deliveryPanel = document.getElementById("delivery-panel");
const deliveryStatus = document.getElementById("delivery-status");
const deliveryForm = document.getElementById("delivery-form");
const deliveryAddressInput = document.getElementById("delivery-address");
const deliveryModeSelect = document.getElementById("delivery-mode");
const deliveryAutoFields = document.getElementById("delivery-auto-fields");
const deliveryManualFields = document.getElementById("delivery-manual-fields");
const deliveryAutoBtn = document.getElementById("delivery-auto-btn");
const deliveryGeoText = document.getElementById("delivery-geo-text");
const deliveryLatInput = document.getElementById("delivery-lat");
const deliveryLngInput = document.getElementById("delivery-lng");
const pickupPanel = document.getElementById("pickup-panel");
const pickupStatus = document.getElementById("pickup-status");
const pickupFarm = document.getElementById("pickup-farm");
const pickupSchedule = document.getElementById("pickup-schedule");
const showPickupBtn = document.getElementById("show-pickup-btn");

const myMapStatus = document.getElementById("my-map-status");

const isConsumidor = currentUser.rol === "CONSUMIDOR";
const isProductor = currentUser.rol === "PRODUCTOR";

let myCoords = null;
let map = null;
let marker = null;
let producerPickupCoords = null;

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const setDeliveryStatus = (text, isError = false) => {
  deliveryStatus.textContent = text;
  deliveryStatus.style.color = isError ? "#a22a2a" : "";
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const getHttpErrorMessage = (response, payload, fallback) => {
  const apiMessage = payload?.message || payload?.error;
  if (apiMessage) return apiMessage;
  return `${fallback} (HTTP ${response.status})`;
};

const authFetch = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(getHttpErrorMessage(response, payload, "Error en la solicitud"));
  }

  return payload || {};
};

const isValidCoordinates = (latitud, longitud) => (
  Number.isFinite(latitud)
  && Number.isFinite(longitud)
  && latitud >= -90
  && latitud <= 90
  && longitud >= -180
  && longitud <= 180
);

const updateDeliveryMode = () => {
  const manual = deliveryModeSelect.value === "MANUAL";
  deliveryAutoFields.classList.toggle("active", !manual);
  deliveryManualFields.classList.toggle("active", manual);

  deliveryLatInput.required = manual;
  deliveryLngInput.required = manual;

  if (manual) {
    deliveryGeoText.textContent = "Modo manual activo. Ingresa coordenadas para actualizar tu entrega.";
  } else {
    deliveryGeoText.textContent = "Modo automatico activo. Captura tu ubicacion actual para actualizar la entrega.";
  }
};

const setMyCoords = (latitud, longitud) => {
  myCoords = {
    latitud: Number(latitud),
    longitud: Number(longitud),
  };
  deliveryLatInput.value = String(myCoords.latitud);
  deliveryLngInput.value = String(myCoords.longitud);
};

const renderProducts = (products) => {
  productsList.innerHTML = "";

  if (!products.length) {
    productsStatus.textContent = "No hay productos publicados aun.";
    return;
  }

  productsStatus.textContent = `${products.length} productos disponibles.`;

  products.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-card";
    card.innerHTML = `
      <h3>${item.nombre}</h3>
      <p>${item.descripcion || "Sin descripcion"}</p>
      <div class="item-meta">
        <span><strong>Precio:</strong> ${formatCurrency(item.precio)}</span>
        <span><strong>Disponible:</strong> ${item.cantidadDisponible}</span>
      </div>
    `;
    productsList.appendChild(card);
  });
};

const renderOrders = (orders) => {
  ordersList.innerHTML = "";

  if (!orders.length) {
    ordersStatus.textContent = "No tienes pedidos registrados.";
    return;
  }

  ordersStatus.textContent = `${orders.length} pedidos encontrados.`;

  orders.forEach((order) => {
    const item = document.createElement("article");
    item.className = "order-item";

    const detailCount = Array.isArray(order.detalles) ? order.detalles.length : 0;
    const detailLabel = detailCount === 1 ? "detalle" : "detalles";

    item.innerHTML = `
      <div class="order-top">
        <strong>Pedido #${order.idPedido}</strong>
        <span class="badge">${order.estado}</span>
      </div>
      <p><strong>Entrega:</strong> ${order.tipoEntrega}</p>
      <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      <p><strong>Items:</strong> ${detailCount} ${detailLabel}</p>
    `;

    ordersList.appendChild(item);
  });
};

const initializeMap = () => {
  if (typeof L === "undefined") {
    myMapStatus.textContent = "No fue posible cargar el motor del mapa (Leaflet).";
    return false;
  }

  map = L.map("my-map").setView([4.5709, -74.2973], 6);

  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });

  tiles.on("tileerror", () => {
    myMapStatus.textContent = "No se pudieron cargar los mosaicos del mapa. Verifica politicas de seguridad o conexion.";
  });

  tiles.addTo(map);

  return true;
};

const renderMyMapMarker = (latitud, longitud, popupText) => {
  if (!map) {
    const initialized = initializeMap();
    if (!initialized) {
      return;
    }
  }

  const point = [Number(latitud), Number(longitud)];

  if (!isValidCoordinates(point[0], point[1])) {
    myMapStatus.textContent = "No hay coordenadas validas para mostrar en el mapa.";
    return;
  }

  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker(point).addTo(map).bindPopup(popupText);
  marker.openPopup();
  map.setView(point, 15);
  myMapStatus.textContent = `Ubicacion actual: ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`;
};

const loadProducts = async () => {
  try {
    const response = await fetch(`${API_BASE}/productos`);
    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(getHttpErrorMessage(response, payload, "No fue posible cargar productos"));
    }

    if (!payload?.success) {
      throw new Error(payload?.message || "No fue posible cargar productos");
    }

    renderProducts(payload.data || []);
  } catch (error) {
    productsStatus.textContent = error.message;
  }
};

const loadOrders = async () => {
  try {
    const payload = await authFetch(`${API_BASE}/pedidos`);
    renderOrders(payload.data || []);
  } catch (error) {
    ordersStatus.textContent = error.message;
  }
};

const loadMyLocationFromApi = async () => {
  try {
    const response = await fetch(`${API_BASE}/ubicaciones`);
    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(getHttpErrorMessage(response, payload, "No fue posible cargar ubicaciones"));
    }

    if (!payload?.success) {
      throw new Error(payload?.message || "No fue posible cargar ubicaciones");
    }

    const mine = (payload.data?.markers || []).find((item) => item.idUsuario === currentUser.idUsuario);
    if (!mine) {
      myMapStatus.textContent = "Aun no tienes ubicacion registrada.";
      return;
    }

    setMyCoords(mine.latitud, mine.longitud);
    renderMyMapMarker(mine.latitud, mine.longitud, `<strong>${currentUser.nombre}</strong><br/>${mine.tipo}`);
  } catch (error) {
    myMapStatus.textContent = error.message;
  }
};

const loadConsumidorData = async () => {
  if (!isConsumidor) {
    deliveryPanel.style.display = "none";
    return;
  }

  try {
    const payload = await authFetch(`${API_BASE}/consumidores/${currentUser.idUsuario}`);
    const perfil = payload.data;

    if (perfil?.direccion) {
      deliveryAddressInput.value = perfil.direccion;
    }

    if (isValidCoordinates(Number(perfil?.latitud), Number(perfil?.longitud))) {
      setMyCoords(Number(perfil.latitud), Number(perfil.longitud));
      deliveryGeoText.textContent = `Coordenadas registradas: ${Number(perfil.latitud).toFixed(6)}, ${Number(perfil.longitud).toFixed(6)}`;
      renderMyMapMarker(perfil.latitud, perfil.longitud, `<strong>${currentUser.nombre}</strong><br/>Punto de entrega`);
    }
  } catch (error) {
    setDeliveryStatus(error.message, true);
  }
};

const loadProductorData = async () => {
  if (!isProductor) {
    pickupPanel.style.display = "none";
    return;
  }

  deliveryPanel.style.display = "none";

  try {
    const payload = await authFetch(`${API_BASE}/productores/${currentUser.idUsuario}`);
    const perfil = payload.data;

    pickupFarm.innerHTML = `<strong>Finca:</strong> ${perfil?.nombreFinca || "-"}`;
    pickupSchedule.innerHTML = `<strong>Horario:</strong> ${perfil?.horarioRecogida || "-"}`;

    const latitud = Number(perfil?.latitud);
    const longitud = Number(perfil?.longitud);

    if (!isValidCoordinates(latitud, longitud)) {
      pickupStatus.textContent = "No tienes coordenadas de recogida validas registradas.";
      showPickupBtn.disabled = true;
      return;
    }

    producerPickupCoords = { latitud, longitud };
    renderMyMapMarker(
      latitud,
      longitud,
      `<strong>${currentUser.nombre}</strong><br/>Punto de recogida`
    );
    pickupStatus.textContent = "Tu punto de recogida esta listo para visualizarse en el mapa.";
    showPickupBtn.disabled = false;
  } catch (error) {
    pickupStatus.textContent = error.message;
    showPickupBtn.disabled = true;
  }
};

const handleCaptureAutoLocation = () => {
  if (!navigator.geolocation) {
    setDeliveryStatus("Tu navegador no soporta geolocalizacion.", true);
    return;
  }

  deliveryGeoText.textContent = "Capturando ubicacion actual...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitud = Number(position.coords.latitude.toFixed(8));
      const longitud = Number(position.coords.longitude.toFixed(8));
      setMyCoords(latitud, longitud);
      deliveryGeoText.textContent = `Ubicacion capturada: ${latitud}, ${longitud}`;
      setDeliveryStatus("Ubicacion lista para guardar.");
      renderMyMapMarker(latitud, longitud, `<strong>${currentUser.nombre}</strong><br/>Punto de entrega`);
    },
    () => {
      setDeliveryStatus("No fue posible capturar la ubicacion actual.", true);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};

const handleSubmitDelivery = async (event) => {
  event.preventDefault();

  const direccion = String(deliveryAddressInput.value || "").trim();
  if (!direccion) {
    setDeliveryStatus("La direccion es obligatoria.", true);
    return;
  }

  let latitud;
  let longitud;

  if (deliveryModeSelect.value === "MANUAL") {
    latitud = Number(String(deliveryLatInput.value || "").trim());
    longitud = Number(String(deliveryLngInput.value || "").trim());
  } else {
    latitud = Number(myCoords?.latitud);
    longitud = Number(myCoords?.longitud);
  }

  if (!isValidCoordinates(latitud, longitud)) {
    setDeliveryStatus("Debes capturar o ingresar coordenadas validas para actualizar la entrega.", true);
    return;
  }

  try {
    const payload = {
      direccion,
      latitud,
      longitud,
    };

    await authFetch(`${API_BASE}/consumidores/${currentUser.idUsuario}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    setMyCoords(latitud, longitud);
    setDeliveryStatus("Ubicacion de entrega actualizada correctamente.");
    deliveryGeoText.textContent = `Ubicacion registrada: ${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
    renderMyMapMarker(latitud, longitud, `<strong>${currentUser.nombre}</strong><br/>Punto de entrega`);
  } catch (error) {
    setDeliveryStatus(error.message, true);
  }
};

const setupDashboard = async () => {
  welcomeTitle.textContent = `Hola ${currentUser.nombre}`;
  welcomeSubtitle.textContent = `Rol: ${currentUser.rol}. Aqui puedes gestionar tu experiencia en AgroConecta.`;

  updateDeliveryMode();
  deliveryModeSelect.addEventListener("change", updateDeliveryMode);
  deliveryAutoBtn.addEventListener("click", handleCaptureAutoLocation);
  deliveryForm.addEventListener("submit", handleSubmitDelivery);

  showPickupBtn.addEventListener("click", () => {
    if (!producerPickupCoords) return;

    renderMyMapMarker(
      producerPickupCoords.latitud,
      producerPickupCoords.longitud,
      `<strong>${currentUser.nombre}</strong><br/>Punto de recogida`
    );
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await authFetch(`${API_BASE}/auth/logout`, { method: "POST" });
    } catch (error) {
      // Aunque falle logout remoto, limpiamos sesion local.
    } finally {
      localStorage.removeItem("agroconecta_token");
      localStorage.removeItem("agroconecta_user");
      window.location.href = "./index.html";
    }
  });

  await Promise.all([
    loadProducts(),
    loadOrders(),
    loadMyLocationFromApi(),
    loadConsumidorData(),
    loadProductorData(),
  ]);
};

setupDashboard();
