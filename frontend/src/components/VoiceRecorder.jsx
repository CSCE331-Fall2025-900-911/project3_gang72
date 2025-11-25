import { useState, useEffect, useRef } from "react";

export default function VoiceRecorder({ onText, onSilenceTimeout, onFiveMinuteTimeout }) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const repeatQuestionTimerRef = useRef(null);
  const fiveMinuteTimerRef = useRef(null);

  // ------------------------------
  // SPEAK HELPER (female voice)
  // ------------------------------
  function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = speechSynthesis.getVoices().find((v) =>
      v.name.toLowerCase().includes("female")
    );
    speechSynthesis.speak(utter);
  }

  // ------------------------------
  // START CONTINUOUS LISTENING
  // ------------------------------
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      setRecording(true);
      setStatus("Listening… 🎤");

      let chunks = [];
      let lastSoundTime = Date.now();

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const detectSilence = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b) / data.length;

        // Adjust threshold if needed
        if (volume < 10) {
          if (Date.now() - lastSoundTime > 1200) {
            // Silence detected → stop recording
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
          }
        } else {
          lastSoundTime = Date.now();
        }

        if (recording) requestAnimationFrame(detectSilence);
      };

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (chunks.length === 0) {
          restartListening();
          return;
        }

        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks = [];

        setStatus("Processing speech...");

        const formData = new FormData();
        formData.append("audio", blob);

        try {
          const res = await fetch("/api/speech", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (data.text && data.text.trim() !== "") {
            // We got speech → reset inactivity timers
            resetTimers();

            if (onText) onText(data.text);
          }
        } catch (err) {
          console.error("Speech processing error:", err);
        }

        // After processing → restart listening
        restartListening();
      };

      mediaRecorder.start();
      requestAnimationFrame(detectSilence);

      // START GLOBAL TIMERS
      resetTimers();
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Microphone access denied or error starting recording.");
    }
  };

  // ------------------------------
  // RESTART LISTENING
  // ------------------------------
  const restartListening = () => {
    if (!recording) return; // Stop if turned off
    startListening();
  };

  // ------------------------------
  // RESET TIMERS
  // ------------------------------
  const resetTimers = () => {
    // Clear old timers
    if (repeatQuestionTimerRef.current) clearTimeout(repeatQuestionTimerRef.current);
    if (fiveMinuteTimerRef.current) clearTimeout(fiveMinuteTimerRef.current);

    // 30-second question repeat (silence)
    repeatQuestionTimerRef.current = setTimeout(() => {
      if (onSilenceTimeout) onSilenceTimeout();
    }, 30000);

    // 5-minute full inactivity → auto-order
    fiveMinuteTimerRef.current = setTimeout(() => {
      if (onFiveMinuteTimeout) onFiveMinuteTimeout();
    }, 300000); // 5 minutes
  };

  // ------------------------------
  // STOP EVERYTHING
  // ------------------------------
  const stopAll = () => {
    setRecording(false);
    setStatus("");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    clearTimeout(repeatQuestionTimerRef.current);
    clearTimeout(fiveMinuteTimerRef.current);
  };

  useEffect(() => {
    return () => stopAll();
  }, []);

  return (
    <div className="text-center mb-3">
      {!recording ? (
        <button className="btn btn-lg btn-warning w-100" onClick={startListening}>
          🎤 Speak Order
        </button>
      ) : (
        <button className="btn btn-lg btn-danger w-100" onClick={stopAll}>
          ⏹ Stop Listening
        </button>
      )}
      {status && <div className="mt-2 text-muted">{status}</div>}
    </div>
  );
}
