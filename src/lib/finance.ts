export const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Salário",
  "Outros",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type TxType = "receita" | "despesa";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  category: Category;
  description: string;
  occurred_on: string; // YYYY-MM-DD
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(n);

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Today's date (YYYY-MM-DD) in Brazil time. */
export function todayBR(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export const monthKey = (iso: string) => iso.slice(0, 7);

export function previousMonthKey(key: string) {
  const [y = 0, m = 1] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function goalProgress(g: Pick<Goal, "target_amount" | "saved_amount">) {
  if (g.target_amount <= 0) return 0;
  return Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100));
}

export function monthSummary(txs: Transaction[], key: string) {
  const inMonth = txs.filter((t) => monthKey(t.occurred_on) === key);
  const income = inMonth.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const expense = inMonth.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const t of inMonth) {
    if (t.type === "despesa") byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  const categories = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  return { income, expense, balance: income - expense, categories, count: inMonth.length };
}

/** Simple, plain-language tips based on this month vs last month. */
export function buildInsights(txs: Transaction[], key: string): string[] {
  const cur = monthSummary(txs, key);
  const prev = monthSummary(txs, previousMonthKey(key));
  const tips: string[] = [];
  if (cur.categories[0]) {
    tips.push(
      `Seu maior gasto este mês está em ${cur.categories[0].category}: ${formatBRL(cur.categories[0].total)}.`,
    );
  }
  for (const c of cur.categories) {
    const before = prev.categories.find((p) => p.category === c.category)?.total ?? 0;
    if (before > 0) {
      const pct = Math.round(((c.total - before) / before) * 100);
      if (pct >= 10) {
        tips.push(`Você gastou ${pct}% a mais com ${c.category} do que no mês passado.`);
        break;
      }
    }
  }
  if (cur.income > 0 && cur.balance < 0) {
    tips.push("Neste mês você gastou mais do que recebeu. Vale rever os gastos de Lazer e Outros.");
  }
  tips.push(`Se economizar R$ 10 por dia, você guarda ${formatBRL(300)} por mês.`);
  return tips.slice(0, 3);
}
