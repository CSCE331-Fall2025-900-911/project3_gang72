import { Link, useNavigate, useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      await fetch(`${apiBase}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      // Clear user from sessionStorage regardless of backend response
      sessionStorage.removeItem('user');

      // Sign out from Google if available
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch (e) {
          console.error('Error disabling Google auto-select:', e);
        }
      }

      // Redirect to login
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="navbar navbar-expand-lg sidebar-nav navbar-dark bg-dark px-3 w-100">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">{t("Boba Bliss")}</Link>

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
            
            {/* Language Toggle */}
            <li className="nav-item" style={{
              padding: '0.5rem 1rem',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              marginLeft: '1rem',
              borderBottom: user && location.pathname === '/cashier' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              paddingBottom: user && location.pathname === '/cashier' ? '1rem' : '0.5rem'
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '0.25rem'
              }}>
                {t("Language")}
              </div>
              <LanguageToggle />
            </li>
            
            {/* User Info & Logout - Only show on cashier view */}
            {user && location.pathname === '/cashier' && (
              <li className="nav-item" style={{
                padding: '0.5rem 1rem',
                paddingTop: '1rem',
                marginLeft: '1rem'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.25rem'
                }}>
                  {t("Signed in as")}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word',
                  maxWidth: '200px'
                }}>
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#FFB88C',
                    color: '#583e23',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#FFA366';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFB88C';
                  }}
                >
                  🚪 {t("Logout")}
                </button>
              </li>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
