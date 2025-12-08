// frontend/src/components/VoiceRecorder.jsx
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function VoiceRecorder({
  onText,
  onSilenceTimeout,
  onFiveMinuteTimeout,
}) {
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const repeatQuestionTimerRef = useRef(null);
  const fiveMinuteTimerRef = useRef(null);

  // ------------------------------
  // TIMERS (silence + inactivity)
  // ------------------------------
  const resetTimers = () => {
    if (repeatQuestionTimerRef.current) {
      clearTimeout(repeatQuestionTimerRef.current);
    }
    if (fiveMinuteTimerRef.current) {
      clearTimeout(fiveMinuteTimerRef.current);
    }

    // 30s since last recognized speech → ask again
    repeatQuestionTimerRef.current = setTimeout(() => {
      if (typeof onSilenceTimeout === "function") {
        onSilenceTimeout();
      }
    }, 30_000);

    // 5m since last recognized speech → auto-order
    fiveMinuteTimerRef.current = setTimeout(() => {
      if (typeof onFiveMinuteTimeout === "function") {
        onFiveMinuteTimeout();
      }
    }, 300_000);
  };

  const clearTimers = () => {
    if (repeatQuestionTimerRef.current) {
      clearTimeout(repeatQuestionTimerRef.current);
      repeatQuestionTimerRef.current = null;
    }
    if (fiveMinuteTimerRef.current) {
      clearTimeout(fiveMinuteTimerRef.current);
      fiveMinuteTimerRef.current = null;
    }
  };

  // ------------------------------
  // START RECORDING
  // ------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const chunks = chunksRef.current;
        chunksRef.current = [];

        if (!chunks.length) {
          setStatus("");
          return;
        }

        setStatus(t("Processing speech..."));

        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob);

        try {
          // NOTE: new endpoint used in your updated branch
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          // new things added
          const data = await res.json();

          if (data.text && data.text.trim() !== "") {
            if (typeof onText === "function") {
              onText(data.text);
            }
            // Recognized speech → reset inactivity timers
            resetTimers();
          }
        } catch (err) {
          console.error("Speech processing error:", err);
        } finally {
          setStatus("");
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setStatus(t("Listening… 🎤"));
    } catch (err) {
      console.error("Microphone error:", err);
      alert(t("Microphone access denied or error starting recording."));
    }
  };

  // ------------------------------
  // STOP RECORDING
  // ------------------------------
  const stopRecording = () => {
    setRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  };

  // ------------------------------
  // CLEANUP ON UNMOUNT
  // ------------------------------
  useEffect(() => {
    return () => {
      stopRecording();
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = () => {
    if (recording) {
      // Stop listening → send audio once
      stopRecording();
    } else {
      // Start listening
      startRecording();
    }
  };

  return (
    <div className="text-center" style={{ maxWidth: 380 }}>
      <button
        className="btn btn-lg w-100"
        onClick={handleToggle}
        style={{
          backgroundColor: recording ? "#dc3545" : "#ffb88c",
          borderColor: recording ? "#dc3545" : "#ffb88c",
          color: recording ? "#fff" : "#432818",
          fontWeight: 600,
        }}
      >
        {recording ? `⏹ ${t("Stop Speaking")}` : `🎤 ${t("Start Speaking")}`}
      </button>
      {status && (
        <div className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
          {status}
        </div>
      )}
    </div>
  );
}
