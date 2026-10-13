import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, LayoutDashboard, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/boas-vindas")({
  head: () => ({ meta: [{ title: "Boas-vindas — Grão" }] }),
  component: Welcome,
});

const GOALS = ["Montar uma reserva de emergência", "Sair das dívidas", "Fazer uma viagem", "Entender para onde vai meu dinheiro"];

function Welcome() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState((user.user_metadata?.['display_name'] as string) ?? (user.user_metadata?.['full_name'] as string) ?? "");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name.trim() || null, main_goal: goal || null, onboarded: true });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar. Tente de novo."); return; }
    navigate({ to: "/chat" });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-8 px-5 py-10">
      <Logo />
      <p className="text-sm font-medium text-muted-foreground">Passo {step + 1} de 3</p>
      {step === 0 && (
        <section className="space-y-5">
          <h1 className="text-3xl font-bold">Como podemos te chamar?</h1>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">Seu nome</Label>
            <Input id="name" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <Button size="lg" className="h-12 w-full text-base" onClick={() => setStep(1)}>Continuar</Button>
        </section>
      )}
      {step === 1 && (
        <section className="space-y-5">
          <h1 className="text-3xl font-bold">Qual é o seu principal objetivo agora?</h1>
          <div role="radiogroup" aria-label="Objetivo principal" className="grid gap-3">
            {GOALS.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={goal === g}
                onClick={() => setGoal(g)}
                className="min-h-14 rounded-xl border-2 bg-card px-4 text-left text-base font-medium aria-checked:border-primary aria-checked:bg-secondary"
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="h-12 flex-1 text-base" onClick={() => setStep(0)}>Voltar</Button>
            <Button size="lg" className="h-12 flex-1 text-base" onClick={() => setStep(2)}>Continuar</Button>
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="space-y-5">
          <h1 className="text-3xl font-bold">É assim que funciona</h1>
          <ul className="space-y-4 text-base">
            <li className="flex gap-3"><MessageCircle className="mt-1 size-6 shrink-0 text-primary" aria-hidden /><span><strong>Converse.</strong> Escreva como falaria com alguém: “Gastei R$ 45 no almoço hoje”. Eu registro e escolho a categoria.</span></li>
            <li className="flex gap-3"><LayoutDashboard className="mt-1 size-6 shrink-0 text-primary" aria-hidden /><span><strong>Veja o resumo.</strong> Quanto entrou, quanto saiu e onde você mais gasta.</span></li>
            <li className="flex gap-3"><Target className="mt-1 size-6 shrink-0 text-primary" aria-hidden /><span><strong>Crie metas.</strong> Acompanhe quanto falta para chegar lá.</span></li>
          </ul>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="h-12 flex-1 text-base" onClick={() => setStep(1)}>Voltar</Button>
            <Button size="lg" className="h-12 flex-1 text-base" onClick={finish} disabled={saving}>{saving ? "Salvando…" : "Começar"}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
