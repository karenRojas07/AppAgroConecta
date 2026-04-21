const API_BASE = "/api/v1";
const statusEl = document.getElementById("map-status");

const map = L.map("map").setView([4.5709, -74.2973], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const colorByRole = {
  PRODUCTOR: "#1f7a4d",
  CONSUMIDOR: "#d18c22",
};

const createMarkerIcon = (role) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:999px;background:${colorByRole[role] || "#1f2a1f"};border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const loadMarkers = async () => {
  try {
    const response = await fetch(`${API_BASE}/ubicaciones`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "No fue posible obtener ubicaciones");
    }

    const markers = payload.data.markers || [];

    if (markers.length === 0) {
      statusEl.textContent = "No hay ubicaciones registradas aun.";
      return;
    }

    const bounds = [];

    markers.forEach((item) => {
      const point = [item.latitud, item.longitud];
      bounds.push(point);

      const extra = item.tipo === "PRODUCTOR"
        ? `<br/><strong>Finca:</strong> ${item.nombreFinca || "-"}`
        : `<br/><strong>Direccion:</strong> ${item.direccion || "-"}`;

      L.marker(point, { icon: createMarkerIcon(item.tipo) })
        .addTo(map)
        .bindPopup(
          `<strong>${item.nombre || "Usuario"}</strong><br/><strong>Tipo:</strong> ${item.tipo}${extra}`
        );
    });

    map.fitBounds(bounds, { padding: [25, 25] });
    statusEl.textContent = `${markers.length} ubicaciones cargadas.`;
  } catch (error) {
    statusEl.textContent = error.message;
  }
};

loadMarkers();
