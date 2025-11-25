import { Link } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { t } = useLanguage();
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 w-100">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">{t("My App")}</Link>

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
            <Link className="nav-link" to="/">{t("Home")}</Link>
            <Link className="nav-link" to="/manager">{t("Manager")}</Link>
            <Link className="nav-link" to="/cashier">{t("Cashier")}</Link>
            <Link className="nav-link" to="/kiosk">{t("Kiosk")}</Link>
            <Link className="nav-link" to="/menu">{t("Menu")}</Link>
            <li className="nav-item ms-2">
              <LanguageToggle />
            </li>
          </div>
        </div>
      </div>
    </nav>
  );
}
