import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
            <Link className="navbar-brand" to="/">My App</Link>
            <div className="navbar-nav">
                <Link className="nav-link" to="/">Home</Link>
                <Link className="nav-link" to="/manager">Manager</Link>
                <Link className="nav-link" to="/cashier">Cashier</Link>
            </div>
        </nav>
    );
}
