import { useLanguage } from "../context/LanguageContext";

export default function Menu() {
    const { t } = useLanguage();
    return <h1 className="text-center mt-5">{t("Menu Page")}</h1>;
}