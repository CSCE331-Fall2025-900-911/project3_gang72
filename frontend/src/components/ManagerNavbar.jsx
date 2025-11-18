import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function ManagerNavbar() {
    const { t } = useLanguage();
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
                            <Link className="nav-link" to="/manager/employees">{t("Employees")}</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/ingredients">{t("Ingredients")}</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/sales">{t("Sales")}</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/items">{t("Items")}</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/xreport">{t("X-Report")}</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/manager/zreport">{t("Z-Report")}</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
