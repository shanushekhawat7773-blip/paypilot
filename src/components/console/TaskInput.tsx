"use client";

import React, { useState, useEffect } from "react";
import { MicIcon, PaperPlaneIcon, PlayIcon } from "@/components/ui/Icons";

interface TaskInputProps {
  onSubmit: (prompt: string) => void;
  onRunDemo: () => void;
  isLoading?: boolean;
}

export default function TaskInput({
  onSubmit,
  onRunDemo,
  isLoading = false,
}: TaskInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      setSpeechSupported(true);
    }
  }, []);

  const handleVoiceToggle = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    if (!isListening) {
      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsListening(false);
      recognition.stop();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const examplePrompts = [
    {
      label: "⭐ Full Demo Scenario (90s)",
      text: "Pay Riya $200 for the logo work, renew my domain if it's under $15, and send $900 to a new vendor called QuickInvoice Ltd.",
      isDemo: true,
    },
    {
      label: "Routine Contractor Payout",
      text: "Pay Riya $200 for the logo sprint deliverables.",
    },
    {
      label: "Exceeds Condition Threshold",
      text: "Renew domain registration with Domain Registrar Co if it's under $15.",
    },
    {
      label: "High-Risk Unverified Invoice",
      text: "Send $900 immediately to QuickInvoice Ltd for urgent invoice settlement.",
    },
  ];

  return (
    <div className="w-full bg-paper-100 rounded hairline-border p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 hairline-b mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs uppercase font-bold tracking-wider text-ink">
            Instruct the Payment Agent
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-paper-300 text-ink-muted rounded">
            Plain Language
          </span>
        </div>

        <button
          onClick={onRunDemo}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-medium text-navy bg-navy/10 hover:bg-navy/15 rounded transition-colors"
          title="Run canonical 90-second judge demo"
        >
          <PlayIcon size={12} />
          <span>Run 90s Hackathon Demo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="State a payment task in plain English (e.g. 'Pay Riya $200 for the logo work and renew my domain if it's under $15')..."
            rows={3}
            className="w-full p-3.5 pr-24 text-sm font-sans bg-white hairline-border rounded text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-1 focus:ring-navy leading-relaxed resize-none"
          />

          <div className="absolute right-2.5 bottom-3.5 flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isListening ? "Listening... click to stop" : "Voice input via Web Speech API"}
              aria-label="Voice input"
              className={`p-2 rounded transition-colors ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-paper-200 text-ink-muted hover:text-ink hover:bg-paper-300"
              }`}
            >
              <MicIcon size={15} />
            </button>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-navy hover:bg-navy-hover disabled:bg-ink-muted/50 rounded transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
              ) : (
                <>
                  <span>Plan</span>
                  <PaperPlaneIcon size={13} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example prompts */}
        <div className="pt-1">
          <span className="text-[11px] font-mono text-ink-muted block mb-1.5">
            Example Scenarios:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {examplePrompts.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (ex.isDemo) {
                    onRunDemo();
                  } else {
                    setPrompt(ex.text);
                  }
                }}
                className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors text-left ${
                  ex.isDemo
                    ? "bg-amber-100 text-status-held font-semibold border border-amber-300 hover:bg-amber-200"
                    : "bg-paper-200 text-ink-muted hover:text-ink hover:bg-paper-300 hairline-border"
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
