import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
    const { t, language } = useLanguage();

    return (
        <div className="text-center mt-5">
            <h1>{t("Welcome Home!")}</h1>
            <p>{t("Choose a page below:")}</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
                <Link to="/manager" className="btn btn-primary">{t("Manager")}</Link>
                <Link to="/cashier" className="btn btn-success">{t("Cashier")}</Link>
                <Link to="/kiosk" className="btn btn-primary">{t("Kiosk")}</Link>
                <Link to="/menu" className="btn btn-success">{t("Menu")}</Link>
            </div>
            <div className="mt-4 text-muted">
                <small>Current language: {language === 'en' ? 'English' : 'Español'}</small>
            </div>
        </div>
    );
}
