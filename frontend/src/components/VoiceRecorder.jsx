import { useState } from "react";

export default function VoiceRecorder({ onText }) {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [status, setStatus] = useState("");

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];
    setStatus("Listening… 🎤");

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

    mediaRecorder.onstop = async () => {
      setStatus("Processing speech...");
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob);

      const res = await fetch("/api/speech", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setStatus("");
      if (onText) onText(data.text);
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
    setRecording(true);
  };

  const stop = () => {
    recorder.stop();
    setRecording(false);
  };

  return (
    <div className="text-center mb-3">
      {!recording ? (
        <button className="btn btn-lg btn-warning w-100" onClick={start}>
          🎤 Speak Order
        </button>
      ) : (
        <button className="btn btn-lg btn-danger w-100" onClick={stop}>
          ⏹ Stop
        </button>
      )}
      {status && <div className="mt-2 text-muted">{status}</div>}
    </div>
  );
}
