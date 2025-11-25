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
        <div className="text-center mt-5">
            <h1>{t("Welcome Home!")}</h1>
            <p>{t("Choose a page below:")}</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
                <Link to="/manager" className="btn btn-primary">{t("Manager")}</Link>
                <Link to="/cashier" className="btn btn-success">{t("Cashier")}</Link>
                <Link to="/kiosk" className="btn btn-primary">{t("Kiosk")}</Link>
                <Link to="/menu" className="btn btn-success">{t("Menu")}</Link>
            </div>
        </div>
    );
}