import { Link, useNavigate, useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

export default function ManagerNavbar() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const userStr = sessionStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
            await fetch(`${apiBase}/api/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            console.error('Logout request error:', err);
        } finally {
            sessionStorage.removeItem('user');

            if (window.google && window.google.accounts && window.google.accounts.id) {
                try {
                    window.google.accounts.id.disableAutoSelect();
                } catch (e) {
                    console.error('Error disabling Google auto-select:', e);
                }
            }

            navigate('/login', { replace: true });
        }
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav style={{
            width: '240px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            backgroundColor: '#583e23',
            position: 'fixed',
            left: 0,
            top: 0,
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
        }}>
            {/* Brand/Logo */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textAlign: 'center'
            }}>
                <Link 
                    to="/manager" 
                    style={{ 
                        color: 'white', 
                        textDecoration: 'none' 
                    }}
                >
                    📊 {t("Manager")}
                </Link>
            </div>

            {/* Navigation Links - Vertical Stack */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                paddingTop: '1rem'
            }}>
                <Link 
                    to="/manager"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    🏠 {t("Dashboard")}
                </Link>
                
                <Link 
                    to="/manager/employees"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager/employees') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager/employees') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager/employees')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager/employees')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    👥 {t("Employees")}
                </Link>
                
                <Link 
                    to="/manager/ingredients"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager/ingredients') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager/ingredients') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager/ingredients')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager/ingredients')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    🧪 {t("Ingredients")}
                </Link>
                
                <Link 
                    to="/manager/sales"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager/sales') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager/sales') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager/sales')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager/sales')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    💰 {t("Sales")}
                </Link>
                
                <Link 
                    to="/manager/items"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager/items') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager/items') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager/items')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager/items')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    🧋 {t("Items")}
                </Link>
                
                <Link 
                    to="/manager/xreport"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager/xreport') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager/xreport') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager/xreport')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager/xreport')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    📈 {t("X-Report")}
                </Link>
                
                <Link 
                    to="/manager/zreport"
                    style={{
                        display: 'block',
                        padding: '1rem 1.5rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textDecoration: 'none',
                        backgroundColor: isActive('/manager/zreport') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderLeft: isActive('/manager/zreport') ? '4px solid #FFB88C' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                        fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive('/manager/zreport')) {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/manager/zreport')) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    📊 {t("Z-Report")}
                </Link>
            </div>

            {/* Language Toggle */}
            <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: 'auto'
            }}>
                <div style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '0.5rem'
                }}>
                    {t("Language")}
                </div>
                <LanguageToggle />
            </div>

            {/* User Info & Logout */}
            {user && (
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '0.5rem'
                    }}>
                        {t("Signed in as")}
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '0.75rem',
                        wordBreak: 'break-word'
                    }}>
                        {user.email}
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#FFB88C',
                            color: '#583e23',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
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
                </div>
            )}
        </nav>
    );
}