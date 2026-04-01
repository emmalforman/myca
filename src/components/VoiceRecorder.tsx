"use client";

import { useState, useRef } from "react";

export default function VoiceRecorder({
  onRecordingComplete,
}: {
  onRecordingComplete: (blob: Blob, duration: number) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        onRecordingComplete(blob, duration);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
      setDuration(0);

      timer.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      alert("Please allow microphone access to record a voice message.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
      if (timer.current) clearInterval(timer.current);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-red-700">
              {formatTime(duration)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop
          </button>
        </>
      ) : (
        <button
          onClick={startRecording}
          className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Record Voice Message
        </button>
      )}
    </div>
  );
}
