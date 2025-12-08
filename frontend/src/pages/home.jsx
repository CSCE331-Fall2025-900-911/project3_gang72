import { Link } from "react-router-dom";
import { useEffect } from 'react';
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
    const { t, language } = useLanguage();

    useEffect(() => {
        if (window.voiceController) {
            // Add home-specific helpful commands
            window.voiceController.registerCommand(
                ['show options', 'what can I do', 'help'],
                () => {
                    window.voiceController.speak('You can say: go to manager, go to cashier, go to kiosk, or go to menu');
                }
            );
        }
    }, []);

    return (
        <div className="main-content">
            <div className="home-container">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1>{t("Boba Bliss!")}</h1>
                </div>

                {/* Module Grid */}
                <div className="module-grid">
                    {/* Manager Module */}
                    <Link to="/manager" className="module-card manager">
                        <div className="module-icon">📊</div>
                        <h3 className="module-title">{t("Manager")}</h3>
                        <div className="module-badge">{t("Back Office")}</div>
                        <p className="module-description">
                            {t("Access analytics, reports, inventory management, and administrative tools")}
                        </p>
                        <div className="module-button">{t("Launch Manager")}</div>
                    </Link>

                    {/* Cashier Module */}
                    <Link to="/cashier" className="module-card cashier">
                        <div className="module-icon">💳</div>
                        <h3 className="module-title">{t("Cashier")}</h3>
                        <div className="module-badge">{t("Front of House")}</div>
                        <p className="module-description">
                            {t("Process customer orders and payments during service hours")}
                        </p>
                        <div className="module-button">{t("Launch Cashier")}</div>
                    </Link>

                    {/* Kiosk Module */}
                    <Link to="/kiosk" className="module-card kiosk">
                        <div className="module-icon">🖥️</div>
                        <h3 className="module-title">{t("Kiosk")}</h3>
                        <div className="module-badge">{t("Self-Service")}</div>
                        <p className="module-description">
                            {t("Customer-facing self-service ordering interface")}
                        </p>
                        <div className="module-button">{t("Launch Kiosk")}</div>
                    </Link>

                    {/* Menu Module */}
                    <Link to="/menu" className="module-card menu">
                        <div className="module-icon">📋</div>
                        <h3 className="module-title">{t("Menu")}</h3>
                        <div className="module-badge">{t("Management")}</div>
                        <p className="module-description">
                            {t("Create, edit, and manage menu items, pricing, and categories")}
                        </p>
                        <div className="module-button">{t("Edit Menu")}</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}