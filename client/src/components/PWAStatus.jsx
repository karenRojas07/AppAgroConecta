import { useEffect, useState } from "react";
import { activateWaitingSW } from "../sw-register.js";

export default function PWAStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onUpdate = (e) => setUpdate(e.detail.registration);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("sw:update-available", onUpdate);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("sw:update-available", onUpdate);
    };
  }, []);

  return (
    <>
      {!online && (
        <div className="pwa-banner offline">
          <span className="dot" />
          Sin conexión · viendo contenido en caché
        </div>
      )}
      {update && (
        <div className="pwa-banner update">
          <span>Nueva versión disponible</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => activateWaitingSW(update)}
          >
            Actualizar
          </button>
        </div>
      )}
    </>
  );
}
