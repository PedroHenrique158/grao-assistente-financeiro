import { supabase } from "@/integrations/supabase/client";
import type { Goal, Transaction } from "@/lib/finance";

export async function fetchTransactions(): Promise<Transaction[]> {
  const since = new Date(Date.now() - 200 * 864e5).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, category, description, occurred_on")
    .gte("occurred_on", since)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
}

export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("id, name, target_amount, saved_amount, deadline")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((g) => ({ ...g, target_amount: Number(g.target_amount), saved_amount: Number(g.saved_amount) }));
}
