// context/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Any language code: 'en', 'es', 'fr', 'ja', etc.
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationTrigger, setTranslationTrigger] = useState(0);

  // Toggle between English and Spanish
  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'es' : 'en';
      console.log('Language toggled to:', newLang);
      return newLang;
    });
  };

  // Translate text using API
  const translate = async (text, targetLang = 'es') => {
    if (!text || typeof text !== 'string') return text;
    
    // Check if already translated
    const key = `${text}_${targetLang}`;
    if (translations[key]) {
      return translations[key];
    }

    try {
      setIsTranslating(true);
      const response = await fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translated = data.translatedText;

      // Cache translation
      setTranslations(prev => ({
        ...prev,
        [key]: translated
      }));
      
      // Trigger re-render of components using translations
      setTranslationTrigger(prev => prev + 1);

      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    } finally {
      setIsTranslating(false);
    }
  };

  // Get translated text based on current language
  const t = (text) => {
    if (!text) return text;
    if (language === 'en') return text;
    
    const key = `${text}_${language}`;
    
    // If not cached yet, trigger translation and return original for now
    if (!translations[key]) {
      translate(text, language);
      return text;
    }
    
    return translations[key];
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    translate,
    t, // translation function
    isTranslating,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
