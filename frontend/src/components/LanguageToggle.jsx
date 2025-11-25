// components/LanguageToggle.jsx
import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export default function LanguageToggle() {
  const { language, setLanguage, isTranslating } = useLanguage();
  
  const currentLang = LANGUAGES.find(lang => lang.code === language) || LANGUAGES[0];

  return (
    <select
      value={language}
      onChange={(e) => {
        console.log('Language changed to:', e.target.value);
        setLanguage(e.target.value);
      }}
      className={`form-select form-select-sm ${language === 'en' ? '' : 'bg-warning'}`}
      disabled={isTranslating}
      style={{ width: 'auto', minWidth: '120px' }}
    >
      {LANGUAGES.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
