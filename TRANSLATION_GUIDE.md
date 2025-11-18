# Spanish Translation Implementation Guide

## Overview
This system uses Google Translate API to provide Spanish translations for your website.

## Setup

### 1. Get Google Translate API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Cloud Translation API"
4. Create credentials (API Key)
5. Add to `backend/.env`:
```
GOOGLE_TRANSLATE_API_KEY=your-api-key-here
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install @google-cloud/translate
```

## Usage in Components

### Basic Translation

```jsx
import { useLanguage } from '../context/LanguageContext';

export default function MyComponent() {
  const { t, language } = useLanguage();

  return (
    <div>
      <h1>{t("Welcome to our store")}</h1>
      <p>{t("Browse our menu")}</p>
      <button>{t("Add to Cart")}</button>
    </div>
  );
}
```

### Dynamic Translation (on-demand)

```jsx
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

export default function DynamicComponent() {
  const { language, translate } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  
  useEffect(() => {
    // Translate menu items when language changes
    if (language === 'es') {
      menuItems.forEach(async (item) => {
        item.translatedName = await translate(item.name);
      });
    }
  }, [language, menuItems]);

  return (
    <div>
      {menuItems.map(item => (
        <div key={item.id}>
          {language === 'es' ? item.translatedName : item.name}
        </div>
      ))}
    </div>
  );
}
```

## Example: Kiosk Page with Translation

```jsx
import { useLanguage } from '../context/LanguageContext';

export default function Kiosk() {
  const { t, language } = useLanguage();
  
  return (
    <div className="container">
      <h1>{t("Self-Service Kiosk")}</h1>
      
      <button className="btn btn-primary">
        {t("Add to Cart")}
      </button>
      
      <div className="cart-summary">
        <h3>{t("Your Order")}</h3>
        <p>{t("Subtotal")}: ${subtotal}</p>
        <p>{t("Tax")}: ${tax}</p>
        <p>{t("Total")}: ${total}</p>
      </div>
      
      <button className="btn btn-success">
        {t("Place Order")}
      </button>
    </div>
  );
}
```

## API Endpoints

### Single Translation
```
POST /api/translate
Body: { text: "Hello", targetLang: "es" }
Response: { translatedText: "Hola" }
```

### Batch Translation
```
POST /api/translate/batch
Body: { texts: ["Hello", "Goodbye"], targetLang: "es" }
Response: { translations: [
  { original: "Hello", translated: "Hola" },
  { original: "Goodbye", translated: "Adiós" }
]}
```

## Common Translations

### Menu/Kiosk
- "Welcome" → "Bienvenido"
- "Menu" → "Menú"
- "Add to Cart" → "Agregar al carrito"
- "Checkout" → "Pagar"
- "Total" → "Total"
- "Place Order" → "Realizar pedido"

### Manager Pages
- "Dashboard" → "Panel"
- "Employees" → "Empleados"
- "Inventory" → "Inventario"
- "Reports" → "Informes"
- "Sales" → "Ventas"

## Performance Tips

1. **Cache translations**: The context automatically caches translations to avoid duplicate API calls
2. **Batch translate**: Use batch endpoint for translating multiple items at once
3. **Pre-translate common terms**: Consider creating a static translation file for common UI elements

## Alternative: Static Translations (No API)

If you want to avoid API costs, create a translations file:

```jsx
// translations.js
export const translations = {
  en: {
    welcome: "Welcome",
    menu: "Menu",
    addToCart: "Add to Cart",
    // ... more translations
  },
  es: {
    welcome: "Bienvenido",
    menu: "Menú",
    addToCart: "Agregar al carrito",
    // ... more translations
  }
};

// Usage
const { t } = useLanguage();
<h1>{t('welcome')}</h1>
```

## Next Steps

1. Add Google Translate API key to `.env`
2. Add language toggle to pages that need it
3. Wrap text content with `t()` function
4. Test translation on kiosk and menu pages first
5. Gradually add to other pages

## Cost Estimation

Google Translate API pricing:
- $20 per 1 million characters
- Average word = 5 characters
- ~200,000 words per $20
- Very affordable for a small-medium restaurant
