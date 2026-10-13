import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Grão, seu assistente financeiro" },
      { name: "description", content: "Entre ou crie sua conta no Grão para organizar seu dinheiro conversando." },
      { property: "og:title", content: "Entrar — Grão" },
      { property: "og:description", content: "Organize seu dinheiro conversando, sem planilhas." },
    ],
  }),
  component: AuthPage,
});

type Mode = "entrar" | "criar" | "esqueci";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/chat" }));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === "SIGNED_IN" && s) navigate({ to: "/chat" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast.error("E-mail ou senha incorretos.");
      } else if (mode === "criar") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/chat", data: { display_name: name } },
        });
        if (error) toast.error(error.message.includes("Password") ? "A senha precisa ter pelo menos 6 caracteres." : "Não foi possível criar a conta.");
        else setNotice("Conta criada! Enviamos um link para o seu e-mail. Clique nele para confirmar e entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) toast.error("Não foi possível enviar o e-mail.");
        else setNotice("Se este e-mail tiver conta, você receberá um link para criar uma nova senha.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com o Google.");
  }

  const titles: Record<Mode, string> = { entrar: "Entrar na sua conta", criar: "Criar sua conta", esqueci: "Recuperar senha" };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Logo />
      <h1 className="text-3xl font-bold">{titles[mode]}</h1>
      {mode !== "esqueci" && (
        <>
          <Button variant="outline" size="lg" className="h-12 text-base" onClick={google}>
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z"/></svg>
            Continuar com Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">ou use seu e-mail</p>
        </>
      )}
      <form onSubmit={submit} className="grid gap-4">
        {mode === "criar" && (
          <div className="grid gap-2"><Label htmlFor="n" className="text-base">Seu nome</Label><Input id="n" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></div>
        )}
        <div className="grid gap-2"><Label htmlFor="e" className="text-base">E-mail</Label><Input id="e" type="email" required className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        {mode !== "esqueci" && (
          <div className="grid gap-2"><Label htmlFor="p" className="text-base">Senha</Label><Input id="p" type="password" required minLength={6} className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "criar" ? "new-password" : "current-password"} /></div>
        )}
        <Button type="submit" size="lg" className="h-12 text-base" disabled={busy}>
          {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : mode === "criar" ? "Criar conta" : "Enviar link"}
        </Button>
      </form>
      {notice && <p role="status" className="rounded-lg border border-primary bg-secondary p-4 text-base">{notice}</p>}
      <div className="flex flex-col gap-2 text-base">
        {mode === "entrar" && (<>
          <button className="min-h-11 text-left font-medium text-primary underline" onClick={() => setMode("esqueci")}>Esqueci minha senha</button>
          <button className="min-h-11 text-left font-medium text-primary underline" onClick={() => setMode("criar")}>Não tem conta? Criar agora</button>
        </>)}
        {mode !== "entrar" && <button className="min-h-11 text-left font-medium text-primary underline" onClick={() => setMode("entrar")}>Já tenho conta. Entrar</button>}
      </div>
    </div>
  );
}
