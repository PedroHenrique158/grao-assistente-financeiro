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
  const top = cur.categories[0];
  if (!top || cur.expense <= 0) return tips;
  const share = Math.round((top.total / cur.expense) * 100);
  tips.push(`Seu maior gasto este mês está em ${top.category}: ${formatBRL(top.total)} (${share}% das despesas).`);
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

export type TxFilter = {
  inicio?: string | null; // YYYY-MM-DD inclusive
  fim?: string | null; // YYYY-MM-DD inclusive
  categorias?: Category[] | null;
  tipo?: TxType | null;
  valorMin?: number | null;
  valorMax?: number | null;
  termo?: string | null;
};

/** Filters transactions and aggregates totals for analytical questions. */
export function analyzeTransactions(txs: Transaction[], f: TxFilter) {
  const termo = f.termo?.trim().toLowerCase();
  const list = txs.filter((t) =>
    (!f.inicio || t.occurred_on >= f.inicio) &&
    (!f.fim || t.occurred_on <= f.fim) &&
    (!f.categorias?.length || f.categorias.includes(t.category)) &&
    (!f.tipo || t.type === f.tipo) &&
    (f.valorMin == null || t.amount >= f.valorMin) &&
    (f.valorMax == null || t.amount <= f.valorMax) &&
    (!termo || t.description.toLowerCase().includes(termo)),
  );
  const round = (n: number) => Math.round(n * 100) / 100;
  const receitas = round(list.filter((t) => t.type === "receita").reduce((a, t) => a + t.amount, 0));
  const despesas = round(list.filter((t) => t.type === "despesa").reduce((a, t) => a + t.amount, 0));
  const porCategoria: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  for (const t of list) {
    if (t.type !== "despesa") continue;
    porCategoria[t.category] = round((porCategoria[t.category] ?? 0) + t.amount);
    porMes[t.occurred_on.slice(0, 7)] = round((porMes[t.occurred_on.slice(0, 7)] ?? 0) + t.amount);
  }
  const sorted = [...list].sort((a, b) => b.amount - a.amount);
  return {
    quantidade: list.length,
    receitas,
    despesas,
    saldo: round(receitas - despesas),
    mediaPorLancamento: list.length ? round((receitas + despesas) / list.length) : 0,
    maior: sorted[0] ?? null,
    menor: sorted[sorted.length - 1] ?? null,
    porCategoria,
    porMes,
    lancamentos: [...list].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)).slice(0, 30),
  };
}
