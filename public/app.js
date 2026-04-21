const tabs = document.querySelectorAll(".tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const statusBox = document.getElementById("status-box");
const tokenBox = document.getElementById("token-box");
const rolSelect = document.getElementById("rol");
const productorFields = document.getElementById("productor-fields");
const consumidorFields = document.getElementById("consumidor-fields");
const locationModeSelect = document.getElementById("location-mode");
const geoAutoFields = document.getElementById("geo-auto-fields");
const geoManualFields = document.getElementById("geo-manual-fields");
const getLocationBtn = document.getElementById("get-location-btn");
const locationText = document.getElementById("location-text");
const latitudManualInput = document.getElementById("latitud-manual");
const longitudManualInput = document.getElementById("longitud-manual");
const latitudInput = document.getElementById("latitud");
const longitudInput = document.getElementById("longitud");
const horarioInicioInput = document.getElementById("horario-inicio");
const horarioFinInput = document.getElementById("horario-fin");
const horarioRecogidaInput = document.getElementById("horario-recogida");

const API_BASE = "/api/v1";

let geoCoords = null;

const GEO_ERROR_BY_CODE = {
  1: "Permiso de ubicacion denegado. Habilitalo para este sitio en el navegador.",
  2: "No se pudo determinar tu posicion (GPS/red no disponible).",
  3: "Tiempo de espera agotado al obtener ubicacion. Intenta de nuevo.",
};

const getGeolocationErrorMessage = (error) => {
  if (!error) {
    return "No se recibio detalle del error de geolocalizacion.";
  }

  const byCode = GEO_ERROR_BY_CODE[error.code];
  if (byCode) {
    return byCode;
  }

  if (error.message && String(error.message).trim()) {
    return String(error.message);
  }

  return "Error desconocido al obtener la ubicacion.";
};

const buildGeoHints = async () => {
  const hints = [];

  if (!window.isSecureContext) {
    hints.push("Abre la app en un contexto seguro: usa http://localhost:3000 o HTTPS.");
  }

  try {
    if (navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "denied") {
        hints.push("El permiso esta bloqueado. Debes habilitar ubicacion en la configuracion del navegador para este sitio.");
      }
    }
  } catch (e) {
    // Algunos navegadores no soportan consultar estado de permisos.
  }

  hints.push("Verifica que la ubicacion del sistema operativo este activada.");
  return hints;
};

const setStatus = (message, type = "") => {
  statusBox.textContent = message;
  statusBox.classList.remove("success", "error");
  if (type) statusBox.classList.add(type);
};

const isValidCoordinates = (latitud, longitud) => (
  Number.isFinite(latitud)
  && Number.isFinite(longitud)
  && latitud >= -90
  && latitud <= 90
  && longitud >= -180
  && longitud <= 180
);

const setGeoCoords = (latitud, longitud) => {
  geoCoords = { latitud, longitud };
  latitudInput.value = String(latitud);
  longitudInput.value = String(longitud);
};

const getMinutesFromHHMM = (timeValue) => {
  if (!timeValue || !timeValue.includes(":")) return null;

  const [hh, mm] = timeValue.split(":").map((n) => Number(n));
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

  return hh * 60 + mm;
};

const buildHorarioRecogida = () => {
  const inicio = String(horarioInicioInput?.value || "").trim();
  const fin = String(horarioFinInput?.value || "").trim();

  if (!inicio || !fin) {
    return null;
  }

  const startMinutes = getMinutesFromHHMM(inicio);
  const endMinutes = getMinutesFromHHMM(fin);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return `${inicio}-${fin}`;
};

const clearGeoCoords = () => {
  geoCoords = null;
  latitudInput.value = "";
  longitudInput.value = "";
};

const getManualCoords = () => {
  const latitud = Number(String(latitudManualInput.value || "").trim());
  const longitud = Number(String(longitudManualInput.value || "").trim());

  if (!isValidCoordinates(latitud, longitud)) {
    return null;
  }

  return {
    latitud: Number(latitud.toFixed(8)),
    longitud: Number(longitud.toFixed(8)),
  };
};

const updateLocationMode = () => {
  const isManual = locationModeSelect.value === "MANUAL";
  geoAutoFields.classList.toggle("active", !isManual);
  geoManualFields.classList.toggle("active", isManual);

  latitudManualInput.required = isManual;
  longitudManualInput.required = isManual;

  if (isManual) {
    locationText.textContent = "Modo manual activo. Ingresa tus coordenadas para registrarte.";
    setStatus("");
  } else {
    locationText.textContent = "Modo automatico activo. Utiliza tu ubicacion actual para registrarte.";
  }
};

const toggleTab = (tabName) => {
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  loginForm.classList.toggle("active", tabName === "login");
  registerForm.classList.toggle("active", tabName === "register");
  setStatus("");
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => toggleTab(tab.dataset.tab));
});

const updateRoleFields = () => {
  const isProductor = rolSelect.value === "PRODUCTOR";
  productorFields.classList.toggle("active", isProductor);
  consumidorFields.classList.toggle("active", !isProductor);

  [...productorFields.querySelectorAll("input")].forEach((input) => {
    input.required = isProductor;
  });

  [...consumidorFields.querySelectorAll("input")].forEach((input) => {
    input.required = !isProductor;
  });
};

rolSelect.addEventListener("change", updateRoleFields);
updateRoleFields();
locationModeSelect.addEventListener("change", updateLocationMode);
updateLocationMode();

[latitudManualInput, longitudManualInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (locationModeSelect.value !== "MANUAL") return;

    const manualCoords = getManualCoords();
    if (!manualCoords) {
      clearGeoCoords();
      return;
    }

    setGeoCoords(manualCoords.latitud, manualCoords.longitud);
    setStatus("Coordenadas manuales listas para registro", "success");
  });
});

getLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Tu navegador no soporta geolocalizacion", "error");
    return;
  }

  locationText.textContent = "Obteniendo ubicacion actual...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude.toFixed(8));
      const lng = Number(position.coords.longitude.toFixed(8));

      setGeoCoords(lat, lng);
      locationText.textContent = `Ubicacion capturada: ${lat}, ${lng}`;
      setStatus("Ubicacion capturada correctamente", "success");
    },
    (error) => {
      const reason = getGeolocationErrorMessage(error);
      setStatus("No fue posible obtener tu ubicacion", "error");

      buildGeoHints().then((hints) => {
        locationText.textContent = `Error de ubicacion: ${reason} ${hints.join(" ")}`;
      });
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Validando credenciales...");

  const formData = new FormData(loginForm);
  const payload = {
    correo: String(formData.get("correo") || "").trim(),
    clave: String(formData.get("clave") || ""),
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No fue posible iniciar sesion");
    }

    localStorage.setItem("agroconecta_token", data.data.token);
    localStorage.setItem("agroconecta_user", JSON.stringify(data.data.user));
    tokenBox.textContent = `Token de sesion: ${data.data.token}`;
    setStatus(`Bienvenido ${data.data.user.nombre}`, "success");
    loginForm.reset();
    window.location.href = "./panel.html";
  } catch (error) {
    setStatus(error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Creando cuenta...");

  const formData = new FormData(registerForm);
  const rol = String(formData.get("rol"));
  const isProductor = rol === "PRODUCTOR";
  const locationMode = String(formData.get("locationMode") || "AUTO");

  let selectedCoords = geoCoords;

  if (locationMode === "MANUAL") {
    selectedCoords = getManualCoords();
    if (!selectedCoords) {
      setStatus("Ingresa coordenadas manuales validas para continuar", "error");
      return;
    }

    setGeoCoords(selectedCoords.latitud, selectedCoords.longitud);
  } else if (!selectedCoords) {
    setStatus("Debes usar tu ubicacion actual o cambiar a modo manual", "error");
    return;
  }

  const common = {
    nombre: String(formData.get("nombre") || "").trim(),
    telefono: String(formData.get("telefono") || "").trim(),
    correo: String(formData.get("correo") || "").trim(),
    clave: String(formData.get("clave") || ""),
    latitud: selectedCoords.latitud,
    longitud: selectedCoords.longitud,
  };

  const payload = isProductor
    ? {
        ...common,
        nombreFinca: String(formData.get("nombreFinca") || "").trim(),
        horarioRecogida: "",
      }
    : {
        ...common,
        direccion: String(formData.get("direccion") || "").trim(),
      };

  if (isProductor) {
    const horarioRecogida = buildHorarioRecogida();
    if (!horarioRecogida) {
      setStatus("Selecciona un lapso de recogida valido (hora inicio menor a hora fin)", "error");
      return;
    }

    horarioRecogidaInput.value = horarioRecogida;
    payload.horarioRecogida = horarioRecogida;
  }

  const endpoint = isProductor
    ? `${API_BASE}/auth/register/productor`
    : `${API_BASE}/auth/register/consumidor`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No fue posible registrar la cuenta");
    }

    localStorage.setItem("agroconecta_token", data.data.token);
    localStorage.setItem("agroconecta_user", JSON.stringify(data.data.user));
    tokenBox.textContent = `Token de sesion: ${data.data.token}`;
    setStatus("Cuenta creada exitosamente. Ya puedes usar la plataforma.", "success");
    registerForm.reset();
    clearGeoCoords();
    if (horarioRecogidaInput) horarioRecogidaInput.value = "";
    locationText.textContent = "Aun no se ha capturado tu ubicacion.";
    updateRoleFields();
    updateLocationMode();
  } catch (error) {
    setStatus(error.message, "error");
  }
});
