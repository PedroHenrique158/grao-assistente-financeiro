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
});
