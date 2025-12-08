import { Link, useNavigate } from "react-router-dom";

export default function ManagerNavbar() {
    const navigate = useNavigate();
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

    return (
        <nav className="navbar navbar-expand-lg navbar-dark manager-navbar">
            <div className="container">
                <Link className="navbar-brand" to="/manager">Manager Dashboard</Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#managerNavbar"
                    aria-controls="managerNavbar"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="managerNavbar">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/employees">Employees</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/ingredients">Ingredients</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/sales">Sales</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/items">Items</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/xreport">X-Report</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/zreport">Z-Report</Link>
                        </li>
                        {user && (
                            <li className="nav-item">
                                <button
                                    className="btn btn-logout"
                                    onClick={handleLogout}
                                    title={user.email}
                                >
                                    Logout
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}