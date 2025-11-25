/**
 * translationController.js
 * 
 * Handles translation requests using Google Translate API
 */

const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Translate client
const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

/**
 * Translate text to target language
 */
async function translateText(text, targetLang = 'es') {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Express handler for translation requests
 * POST /api/translate
 * Body: { text: string, targetLang: string }
 */
async function translateHandler(req, res) {
  try {
    const { text, targetLang = 'es' } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }

    const translatedText = await translateText(text, targetLang);

    res.json({
      success: true,
      originalText: text,
      translatedText,
      targetLang
    });
  } catch (error) {
    console.error('Translation handler error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Batch translate multiple texts
 */
async function batchTranslateHandler(req, res) {
  try {
    const { texts, targetLang = 'es' } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Texts array is required'
      });
    }

    const [translations] = await translate.translate(texts, targetLang);

    const results = texts.map((text, index) => ({
      original: text,
      translated: Array.isArray(translations) ? translations[index] : translations
    }));

    res.json({
      success: true,
      translations: results,
      targetLang
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  translateText,
  translateHandler,
  batchTranslateHandler
};
