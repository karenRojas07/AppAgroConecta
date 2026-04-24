export default function Loading({ label = "Cargando..." }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}
