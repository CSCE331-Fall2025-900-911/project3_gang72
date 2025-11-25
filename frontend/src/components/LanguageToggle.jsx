// components/LanguageToggle.jsx
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage, isTranslating } = useLanguage();

  return (
    <button
      onClick={() => {
        console.log('Toggle button clicked!');
        toggleLanguage();
      }}
      className={`btn ${language === 'es' ? 'btn-warning' : 'btn-outline-primary'} btn-sm`}
      title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
      disabled={isTranslating}
    >
      {isTranslating ? (
        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
      ) : (
        <i className="bi bi-translate me-1"></i>
      )}
      <strong>{language === 'en' ? 'ES' : 'EN'}</strong>
    </button>
  );
}
