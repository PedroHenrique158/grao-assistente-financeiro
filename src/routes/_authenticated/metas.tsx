import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, PiggyBank, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { fetchGoals } from "@/lib/data";
import { formatBRL, formatDateBR, goalProgress, type Goal } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/metas")({
  head: () => ({ meta: [{ title: "Minhas metas — Grão" }] }),
  component: Goals,
});

const IDEAS = ["Reserva de emergência", "Viagem", "Notebook novo", "Carro"];

function Goals() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const goals = useQuery({ queryKey: ["goals"], queryFn: fetchGoals });
  const [form, setForm] = useState({ name: "", target: "", deadline: "" });
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["goals"] });

  async function create(e: FormEvent) {
    e.preventDefault();
    const target = Number(form.target.replace(/\./g, "").replace(",", "."));
    if (!form.name.trim() || !(target > 0)) return toast.error("Dê um nome e um valor para a meta.");
    const { error } = await supabase.from("goals").insert({ user_id: user.id, name: form.name.trim(), target_amount: target, deadline: form.deadline || null });
    if (error) return toast.error("Não foi possível criar a meta.");
    toast.success("Meta criada!");
    setForm({ name: "", target: "", deadline: "" });
    setOpen(false);
    refresh();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Minhas metas</h1>
        <Button size="lg" onClick={() => setOpen((o) => !o)} aria-expanded={open}><Plus className="size-5" aria-hidden /> Nova meta</Button>
      </div>

      {open && (
        <Card><CardContent className="py-5">
          <form onSubmit={create} className="grid gap-4">
            <div className="flex flex-wrap gap-2" aria-label="Ideias de meta">
              {IDEAS.map((i) => <Button key={i} type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => setForm({ ...form, name: i })}>{i}</Button>)}
            </div>
            <div className="grid gap-2"><Label htmlFor="gn">Nome da meta</Label><Input id="gn" className="h-12" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="gv">Quanto quer juntar (R$)</Label><Input id="gv" inputMode="decimal" className="h-12" placeholder="5.000" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="gd">Prazo (opcional)</Label><Input id="gd" type="date" className="h-12" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <Button type="submit" size="lg" className="h-12">Criar meta</Button>
          </form>
        </CardContent></Card>
      )}

      {goals.data?.length === 0 && !open && (
        <p className="text-base text-muted-foreground">Você ainda não tem metas. Uma boa primeira meta é a reserva de emergência: um dinheiro guardado para imprevistos.</p>
      )}
      <div className="grid gap-4">
        {goals.data?.map((g) => <GoalCard key={g.id} goal={g} onChange={refresh} />)}
      </div>
    </div>
  );
}

function GoalCard({ goal, onChange }: { goal: Goal; onChange: () => void }) {
  const [amount, setAmount] = useState("");
  const pct = goalProgress(goal);
  const left = Math.max(0, goal.target_amount - goal.saved_amount);
  let perMonth: string | null = null;
  if (goal.deadline && left > 0) {
    const months = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (30 * 864e5)));
    perMonth = `Guardando ${formatBRL(left / months)} por mês, você chega lá no prazo.`;
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    const v = Number(amount.replace(",", "."));
    if (!(v > 0)) return;
    const { error } = await supabase.from("goals").update({ saved_amount: goal.saved_amount + v }).eq("id", goal.id);
    if (error) return toast.error("Não foi possível guardar.");
    toast.success(`${formatBRL(v)} guardado em ${goal.name}.`);
    setAmount("");
    onChange();
  }
  async function remove() {
    if (!confirm(`Apagar a meta "${goal.name}"?`)) return;
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    if (error) return toast.error("Não foi possível apagar.");
    onChange();
  }
  return (
    <Card><CardContent className="space-y-3 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{goal.name}</h2>
          <p className="text-sm text-muted-foreground">{goal.deadline ? `Prazo: ${formatDateBR(goal.deadline)}` : "Sem prazo definido"}</p>
        </div>
        <Button variant="ghost" size="icon" className="size-11" aria-label={`Apagar meta ${goal.name}`} onClick={remove}><Trash2 className="size-5" /></Button>
      </div>
      <Progress value={pct} aria-label={`Progresso: ${pct}%`} className="h-3" />
      <p className="text-base"><strong>{formatBRL(goal.saved_amount)}</strong> de {formatBRL(goal.target_amount)} · {pct}%</p>
      {perMonth && <p className="text-sm text-muted-foreground">{perMonth}</p>}
      <form onSubmit={add} className="flex gap-2">
        <Label htmlFor={`a-${goal.id}`} className="sr-only">Valor para guardar</Label>
        <Input id={`a-${goal.id}`} inputMode="decimal" placeholder="Valor (R$)" className="h-12" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button type="submit" size="lg" className="h-12"><PiggyBank className="size-5" aria-hidden /> Guardar</Button>
      </form>
    </CardContent></Card>
  );
}
