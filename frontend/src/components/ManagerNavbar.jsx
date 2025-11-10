import { Link } from "react-router-dom";

export default function ManagerNavbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
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
                    </ul>
                </div>
            </div>
        </nav>
    );
}
