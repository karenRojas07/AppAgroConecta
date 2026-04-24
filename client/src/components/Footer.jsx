export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="brand">AgroConecta</div>
          <p className="footer-tag">Del campo a tu mesa, sin intermediarios.</p>
        </div>
        <div className="footer-links">
          <span>© {new Date().getFullYear()} AgroConecta</span>
          <span>Proyecto Final</span>
        </div>
      </div>
    </footer>
  );
}
