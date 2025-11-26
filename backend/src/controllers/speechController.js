const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

exports.transcribeSpeech = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ text: "" });
    }

    const audioBytes = req.file.buffer.toString("base64");

    const request = {
      config: {
        encoding: "WEBM_OPUS",
        sampleRateHertz: 48000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
      },
      audio: { content: audioBytes },
    };

    // This works well for 400–500ms chunks
    const [response] = await client.recognize(request);

    const transcript =
      response.results?.map(r => r.alternatives[0].transcript).join(" ") || "";

    res.json({ text: transcript });
  } catch (err) {
    console.error("Speech error:", err);
    res.json({ text: "" });
  }
};
