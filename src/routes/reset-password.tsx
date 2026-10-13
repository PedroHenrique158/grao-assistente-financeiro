import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Grão" },
      { name: "description", content: "Crie uma nova senha para sua conta no Grão." },
      { property: "og:title", content: "Nova senha — Grão" },
      { property: "og:description", content: "Crie uma nova senha para sua conta no Grão." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error("O link pode ter expirado. Peça um novo.");
    toast.success("Senha alterada!");
    navigate({ to: "/chat" });
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
      <Logo />
      <h1 className="text-3xl font-bold">Criar nova senha</h1>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="p" className="text-base">Nova senha</Label><Input id="p" type="password" minLength={6} required className="h-12 text-base" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
        <Button type="submit" size="lg" className="h-12 text-base">Salvar nova senha</Button>
      </form>
    </div>
  );
}
