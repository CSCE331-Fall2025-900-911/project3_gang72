/**
 * translationController.js
 *
 * Handles translation requests using Google Cloud Translate API
 */

require('dotenv').config();
const { Translate } = require('@google-cloud/translate').v2;

// Ensure API key exists
if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
  console.error("❌ Missing GOOGLE_TRANSLATE_API_KEY in environment variables.");
}

// Initialize Google Translate client
const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

/**
 * Translate a single text string
 */
async function translateText(text, targetLang = 'es') {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate text.');
  }
}

/**
 * POST /api/translate
 * Body: { text: string, targetLang?: string }
 */
async function translateHandler(req, res) {
  try {
    const { text, targetLang = 'es' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid text string is required.'
      });
    }

    const translatedText = await translateText(text, targetLang);

    return res.json({
      success: true,
      originalText: text,
      translatedText,
      targetLang
    });

  } catch (error) {
    console.error('Translation handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during translation.'
    });
  }
}

/**
 * POST /api/translate/batch
 * Body: { texts: string[], targetLang?: string }
 */
async function batchTranslateHandler(req, res) {
  try {
    const { texts, targetLang = 'es' } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty array of texts is required.'
      });
    }

    const [translations] = await translate.translate(texts, targetLang);

    const results = texts.map((text, index) => ({
      original: text,
      translated: Array.isArray(translations) ? translations[index] : translations
    }));

    return res.json({
      success: true,
      targetLang,
      translations: results
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during batch translation.'
    });
  }
}

module.exports = {
  translateText,
  translateHandler,
  batchTranslateHandler
};
