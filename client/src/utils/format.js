export const formatCOP = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

export const estadoLabel = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const estadoColor = {
  PENDIENTE: "warn",
  CONFIRMADO: "info",
  EN_PREPARACION: "info",
  LISTO: "leaf",
  ENTREGADO: "ok",
  CANCELADO: "danger",
};
