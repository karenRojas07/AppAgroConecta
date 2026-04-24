export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="stars" style={{ fontSize: size }}>
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          className={`star ${n <= value ? "filled" : ""}`}
          onClick={() => !readOnly && onChange?.(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
