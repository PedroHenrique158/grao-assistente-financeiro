import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

/** Microfone com Web Speech API (pt-BR). Envia o texto transcrito via onText. */
export function VoiceButton({ onText, disabled }: { onText: (text: string) => void; disabled?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const base = useRef("");

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    setSupported(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    return () => rec.current?.stop();
  }, []);

  const toggle = (current: string) => {
    if (listening) { rec.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "pt-BR"; r.interimResults = true; r.continuous = false;
    base.current = current ? current.trimEnd() + " " : "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i]![0]!.transcript;
      onText(base.current + t);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") toast.error("Permita o uso do microfone no navegador para falar com o Grão.");
      else if (e.error !== "aborted" && e.error !== "no-speech") toast.error("Não consegui ouvir. Tente de novo.");
    };
    r.onend = () => setListening(false);
    rec.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  };

  if (!supported) return null;
  return (
    <>
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        size="icon"
        className={cn("size-11 rounded-full", listening && "animate-pulse")}
        aria-label={listening ? "Parar de gravar" : "Falar mensagem"}
        aria-pressed={listening}
        disabled={disabled}
        onClick={(e) => {
          const ta = (e.currentTarget.closest("form")?.querySelector("textarea") as HTMLTextAreaElement | null);
          toggle(ta?.value ?? "");
        }}
      >
        {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
      </Button>
      <span className="sr-only" aria-live="assertive">{listening ? "Gravando. Fale agora." : ""}</span>
      {listening && <span className="text-sm font-medium text-destructive" aria-hidden>Ouvindo…</span>}
    </>
  );
}
