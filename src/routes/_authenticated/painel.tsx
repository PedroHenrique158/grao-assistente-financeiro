import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Lightbulb, Pencil, Trash2, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchGoals, fetchTransactions } from "@/lib/data";
import {
  buildInsights, CATEGORIES, formatBRL, formatDateBR, goalProgress, monthSummary, previousMonthKey, todayBR, type Transaction,
} from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Resumo do mês — Grão" }] }),
  component: Dashboard,
});

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function Dashboard() {
  const txs = useQuery({ queryKey: ["transactions"], queryFn: fetchTransactions });
  const goals = useQuery({ queryKey: ["goals"], queryFn: fetchGoals });
  const [editing, setEditing] = useState<Transaction | null>(null);
  const qc = useQueryClient();
  const key = todayBR().slice(0, 7);
  const list = txs.data ?? [];
  const s = monthSummary(list, key);
  const tips = buildInsights(list, key);

  const months: string[] = [key];
  for (let i = 0; i < 5; i++) months.unshift(previousMonthKey(months[0]));
  const chart = months.map((m) => ({ mes: MONTHS[Number(m.slice(5)) - 1], gastos: monthSummary(list, m).expense }));

  async function remove(t: Transaction) {
    if (!confirm(`Apagar "${t.description || t.category}" de ${formatBRL(t.amount)}?`)) return;
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    if (error) return toast.error("Não foi possível apagar.");
    toast.success("Lançamento apagado.");
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  if (txs.isPending) return <p className="p-6 text-muted-foreground">Carregando…</p>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-3xl font-bold">Resumo do mês</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={ArrowUpCircle} label="Entrou" value={s.income} tone="text-income" />
        <Stat icon={ArrowDownCircle} label="Saiu" value={s.expense} tone="text-expense" />
        <Stat icon={Wallet} label="Saldo" value={s.balance} tone={s.balance >= 0 ? "text-foreground" : "text-destructive"} />
      </div>

      {list.length === 0 ? (
        <Card><CardContent className="space-y-3 py-6 text-base">
          <p>Ainda não há lançamentos. Conte seu primeiro gasto para o assistente.</p>
          <Button asChild size="lg"><Link to="/chat">Ir para a conversa</Link></Button>
        </CardContent></Card>
      ) : (
        <>
          <Card className="border-accent bg-accent/40">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="size-5" aria-hidden /> Dicas do Grão</CardTitle></CardHeader>
            <CardContent><ul className="list-disc space-y-1 pl-5 text-base">{tips.map((t) => <li key={t}>{t}</li>)}</ul></CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Onde você mais gastou</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {s.categories.length === 0 && <p className="text-muted-foreground">Nenhum gasto este mês.</p>}
                {s.categories.slice(0, 5).map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-base"><span>{c.category}</span><strong>{formatBRL(c.total)}</strong></div>
                    <Progress value={s.expense ? (c.total / s.expense) * 100 : 0} aria-label={`${c.category}: ${Math.round((c.total / s.expense) * 100)}% dos gastos`} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Gastos nos últimos 6 meses</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={{ gastos: { label: "Gastos", color: "var(--chart-1)" } }} className="h-56 w-full" aria-label="Gráfico de gastos por mês">
                  <BarChart data={chart}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatBRL(Number(v))} />} />
                    <Bar dataKey="gastos" fill="var(--color-gastos)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {goals.data && goals.data.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Suas metas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {goals.data.map((g) => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-base"><span>{g.name}</span><span>{goalProgress(g)}%</span></div>
                    <Progress value={goalProgress(g)} aria-label={`${g.name}: ${goalProgress(g)}%`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">Últimos lançamentos</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y">
                {list.slice(0, 15).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium">{t.description || t.category}</p>
                      <p className="text-sm text-muted-foreground">{t.category} · {formatDateBR(t.occurred_on)}</p>
                    </div>
                    <span className={`font-bold ${t.type === "receita" ? "text-income" : "text-expense"}`}>
                      {t.type === "receita" ? "+" : "−"} {formatBRL(t.amount)}
                    </span>
                    <Button variant="ghost" size="icon" className="size-11" aria-label={`Corrigir ${t.description}`} onClick={() => setEditing(t)}><Pencil className="size-5" /></Button>
                    <Button variant="ghost" size="icon" className="size-11" aria-label={`Apagar ${t.description}`} onClick={() => remove(t)}><Trash2 className="size-5" /></Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
      {editing && <EditTx tx={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <Icon className={`size-8 ${tone}`} aria-hidden />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`font-display text-2xl font-bold ${tone}`}>{formatBRL(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EditTx({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ ...tx, amount: String(tx.amount) });
  async function save() {
    const amount = Number(f.amount.replace(",", "."));
    if (!(amount > 0)) return toast.error("Informe um valor maior que zero.");
    const { error } = await supabase
      .from("transactions")
      .update({ type: f.type, amount, category: f.category, description: f.description, occurred_on: f.occurred_on })
      .eq("id", tx.id);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Lançamento corrigido.");
    qc.invalidateQueries({ queryKey: ["transactions"] });
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Corrigir lançamento</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label htmlFor="d">Descrição</Label><Input id="d" className="h-12" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label htmlFor="v">Valor (R$)</Label><Input id="v" inputMode="decimal" className="h-12" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="dt">Data</Label><Input id="dt" type="date" className="h-12" value={f.occurred_on} onChange={(e) => setF({ ...f, occurred_on: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Tipo</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as Transaction["type"] })}>
                <SelectTrigger className="h-12" aria-label="Tipo"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="despesa">Despesa</SelectItem><SelectItem value="receita">Receita</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Categoria</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v as Transaction["category"] })}>
                <SelectTrigger className="h-12" aria-label="Categoria"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="lg" onClick={onClose}>Cancelar</Button><Button size="lg" onClick={save}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
