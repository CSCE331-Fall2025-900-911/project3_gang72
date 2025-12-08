import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Outlet } from "react-router-dom";
import ManagerNavbar from "../components/ManagerNavbar"; // Adjust path as needed
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Manager() {
    const { t } = useLanguage();
    const [employees, setEmployees] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [sales, setSales] = useState([]);

  
    // Fetch employees
    useEffect(() => {
        fetch("/api/employees")
            .then(res => res.json())
            .then(data => setEmployees(Array.isArray(data) ? data : data.employees || []))
            .catch(console.error);
    }, []);

    // Fetch ingredients
    useEffect(() => {
        fetch("/api/ingredients")
            .then(res => res.json())
            .then(data => setIngredients(Array.isArray(data) ? data : data.ingredients || []))
            .catch(console.error);
    }, []);

    // Fetch sales
    useEffect(() => {
        fetch("/api/sales")
            .then(res => res.json())
            .then(data => setSales(Array.isArray(data) ? data : data.sales || []))
            .catch(console.error);
    }, []);

    return (
        <div className="main-content">
            <ManagerNavbar />
            <div className="container mt-4">
                <h1 className="mb-4">{t("Manager Dashboard")}</h1>
                {/* Render subpages and pass data via context */}
                <Outlet context={{ employees, ingredients, sales }} />
            </div>
        </div>
    );
}