import { describe, expect, it } from "vitest";
import { buildInsights, goalProgress, monthSummary, previousMonthKey, type Transaction } from "./finance";

const tx = (p: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  type: "despesa",
  amount: 10,
  category: "Outros",
  description: "",
  occurred_on: "2026-10-05",
  ...p,
});

describe("finance rules", () => {
  it("balance is income minus expenses in the month", () => {
    const s = monthSummary(
      [tx({ type: "receita", amount: 3500, category: "Salário" }), tx({ amount: 45, category: "Alimentação" }), tx({ amount: 999, occurred_on: "2026-09-01" })],
      "2026-10",
    );
    expect(s.income).toBe(3500);
    expect(s.expense).toBe(45);
    expect(s.balance).toBe(3455);
  });

  it("goal progress is a capped percentage", () => {
    expect(goalProgress({ target_amount: 1000, saved_amount: 250 })).toBe(25);
    expect(goalProgress({ target_amount: 1000, saved_amount: 5000 })).toBe(100);
  });

  it("previous month wraps the year", () => {
    expect(previousMonthKey("2026-01")).toBe("2025-12");
  });

  it("flags category spending growth vs last month", () => {
    const tips = buildInsights(
      [tx({ amount: 100, category: "Lazer", occurred_on: "2026-09-10" }), tx({ amount: 118, category: "Lazer" })],
      "2026-10",
    );
    expect(tips).toContain("Você gastou 18% a mais com Lazer do que no mês passado.");
  });

  it("top-category tip shows share of this month's expenses", () => {
    const tips = buildInsights([tx({ amount: 75, category: "Alimentação" }), tx({ amount: 25, category: "Lazer" })], "2026-10");
    expect(tips[0]).toBe("Seu maior gasto este mês está em Alimentação: R$\u00a075,00 (75% das despesas).");
  });

  it("no tips when the month has no expenses", () => {
    expect(buildInsights([tx({ occurred_on: "2026-09-01" })], "2026-10")).toEqual([]);
  });
});

import { analyzeTransactions } from "./finance";
describe("analyzeTransactions", () => {
  const txs = [
    { id: "1", type: "despesa", amount: 50, category: "Saúde", description: "Farmácia", occurred_on: "2026-08-10" },
    { id: "2", type: "despesa", amount: 200, category: "Saúde", description: "Consulta", occurred_on: "2026-10-05" },
    { id: "3", type: "despesa", amount: 80, category: "Alimentação", description: "Mercado", occurred_on: "2026-10-06" },
    { id: "4", type: "receita", amount: 3500, category: "Salário", description: "Salário", occurred_on: "2026-10-01" },
  ] as const;
  it("filtra por categoria e período", () => {
    const r = analyzeTransactions([...txs], { categorias: ["Saúde"], inicio: "2026-09-01", fim: "2026-10-31" });
    expect(r.quantidade).toBe(1);
    expect(r.despesas).toBe(200);
  });
  it("aponta o maior gasto com faixa de valor", () => {
    const r = analyzeTransactions([...txs], { tipo: "despesa", valorMin: 60 });
    expect(r.maior?.id).toBe("2");
    expect(r.despesas).toBe(280);
  });
});
