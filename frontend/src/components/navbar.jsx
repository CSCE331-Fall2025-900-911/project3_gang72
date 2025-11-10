import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 w-100">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">My App</Link>

        {/* Toggle button for small screens */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/manager">Manager</Link>
            <Link className="nav-link" to="/cashier">Cashier</Link>
            <Link className="nav-link" to="/kiosk">Kiosk</Link>
            <Link className="nav-link" to="/menu">Menu</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
