import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod/v4";

import type { Database } from "@/integrations/supabase/types";
import { analyzeTransactions, CATEGORIES, formatBRL, monthSummary, previousMonthKey, todayBR, type Transaction } from "@/lib/finance";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function instructions(name: string | null, goal: string | null) {
  return `Você é o "Grão", um assistente financeiro pessoal, gentil e paciente, para pessoas iniciantes em finanças no Brasil.
Hoje é ${todayBR()} (fuso de Brasília). Usuário: ${name ?? "sem nome"}. Objetivo principal: ${goal ?? "não informado"}.

Regras:
- Fale português do Brasil simples, frases curtas, sem jargão. Se usar um termo financeiro, explique em poucas palavras.
- Quando o usuário contar um gasto ou recebimento, chame registrar_transacao imediatamente. Identifique valor, tipo (receita/despesa) e categoria. Só preencha "data" se o usuário disser explicitamente uma data ("ontem", "dia 3"); caso contrário envie data = null e o sistema usa hoje. Nunca invente datas passadas.
- Categorias: ${CATEGORIES.join(", ")}. Mercado, almoço, delivery, restaurante → Alimentação. Uber, ônibus, gasolina → Transporte. Aluguel, luz, água, internet, condomínio → Moradia. Farmácia, consulta, plano de saúde → Saúde. Curso, livro, faculdade → Educação. Cinema, viagem, streaming, bar → Lazer. Salário, freela, pagamento recebido → Salário (receita). Outras receitas sem categoria clara → Outros.
- Depois de registrar, confirme em uma frase, ex.: "Registrei uma despesa de R$ 45,00 na categoria Alimentação." Ofereça corrigir se algo estiver errado.
- Se logo após um registro o usuário pedir uma alteração (ex.: "corrige para R$ 50", "muda a categoria para Lazer", "na verdade foi ontem"), chame corrigir_ultimo_lancamento. NUNCA crie uma nova transação nesse caso.
- Para corrigir ou apagar lançamentos mais antigos, use listar_transacoes para achar o lançamento e depois corrigir_transacao ou apagar_transacao.
- Para perguntas analíticas (ex.: "quanto gastei com Saúde nos últimos 3 meses?", "qual meu maior gasto do mês passado?", "gastos acima de R$ 100"), use consultar_gastos. Converta períodos relativos em datas AAAA-MM-DD a partir de hoje (mês passado = primeiro ao último dia do mês anterior; últimos 3 meses = do dia 1 de dois meses atrás até hoje). Responda com os números retornados pela ferramenta, sem recalcular nem inventar, e diga o período usado.
- Para resumo geral do mês ou dicas, use resumo_do_mes e dê no máximo 3 recomendações práticas e concretas com números.
- Para metas use criar_meta, listar_metas e guardar_na_meta.
- Se o valor não estiver claro, pergunte antes de registrar. Nunca invente valores.
- Use valores no formato R$ 1.234,56. Respostas curtas.`;
}

export async function handleChat(request: Request): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, "Faça login para conversar.");
  const supabase = userClient(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return json(401, "Sessão expirada. Entre novamente.");
  const userId = userData.user.id;

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "O assistente não está configurado.");

  let body: { messages?: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return json(400, "Pedido inválido.");
  }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-40) : [];
  if (!messages.length) return json(400, "Mensagem vazia.");

  // Persist the newest user message.
  const last = messages[messages.length - 1]!;
  if (last.role === "user") {
    const { error } = await supabase
      .from("chat_messages")
      .upsert(
        { user_id: userId, message_id: last.id, role: "user", message: last as never },
        { onConflict: "user_id,message_id" },
      );
    if (error) console.error("save user message failed", error);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, main_goal")
    .eq("id", userId)
    .maybeSingle();

  const categoryEnum = z.enum(CATEGORIES);
  const tools = {
    registrar_transacao: tool({
      description: "Registra uma receita ou despesa do usuário.",
      inputSchema: z.object({
        tipo: z.enum(["receita", "despesa"]),
        valor: z.number().describe("Valor em reais, positivo"),
        categoria: categoryEnum,
        descricao: z.string().describe("Descrição curta, ex.: Almoço"),
        data: z.string().nullable().describe("AAAA-MM-DD somente se o usuário disse a data; senão null"),
      }),
      execute: async (i) => {
        const occurred = i.data && /^\d{4}-\d{2}-\d{2}$/.test(i.data) ? i.data : todayBR();
        const { data, error } = await supabase
          .from("transactions")
          .insert({ user_id: userId, type: i.tipo, amount: i.valor, category: i.categoria, description: i.descricao, occurred_on: occurred })
          .select("id")
          .single();
        if (error) return { ok: false, erro: error.message };
        return { ok: true, id: data.id, ...i, data: occurred };
      },
    }),
    listar_transacoes: tool({
      description: "Lista os últimos lançamentos do usuário (mais recentes primeiro).",
      inputSchema: z.object({ limite: z.number().nullable() }),
      execute: async ({ limite }) => {
        const { data, error } = await supabase
          .from("transactions")
          .select("id, type, amount, category, description, occurred_on")
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(Math.min(limite ?? 10, 30));
        return error ? { ok: false, erro: error.message } : { ok: true, transacoes: data };
      },
    }),
    corrigir_transacao: tool({
      description: "Corrige um lançamento existente. Envie null nos campos que não mudam.",
      inputSchema: z.object({
        id: z.string(),
        tipo: z.enum(["receita", "despesa"]).nullable(),
        valor: z.number().nullable(),
        categoria: categoryEnum.nullable(),
        descricao: z.string().nullable(),
        data: z.string().nullable(),
      }),
      execute: async (i) => {
        const patch: Database["public"]["Tables"]["transactions"]["Update"] = {};
        if (i.tipo) patch.type = i.tipo;
        if (i.valor) patch.amount = i.valor;
        if (i.categoria) patch.category = i.categoria;
        if (i.descricao) patch.description = i.descricao;
        if (i.data) patch.occurred_on = i.data;
        const { error } = await supabase.from("transactions").update(patch).eq("id", i.id);
        return error ? { ok: false, erro: error.message } : { ok: true };
      },
    }),
    corrigir_ultimo_lancamento: tool({
      description: "Altera o último lançamento registrado (o mais recente). Envie null nos campos que não mudam.",
      inputSchema: z.object({
        tipo: z.enum(["receita", "despesa"]).nullable(),
        valor: z.number().nullable(),
        categoria: categoryEnum.nullable(),
        descricao: z.string().nullable(),
        data: z.string().nullable(),
      }),
      execute: async (i) => {
        const { data: last, error: e1 } = await supabase
          .from("transactions")
          .select("id, type, amount, category, description, occurred_on")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (e1 || !last) return { ok: false, erro: e1?.message ?? "Nenhum lançamento encontrado." };
        const patch: Database["public"]["Tables"]["transactions"]["Update"] = {};
        if (i.tipo) patch.type = i.tipo;
        if (i.valor) patch.amount = i.valor;
        if (i.categoria) patch.category = i.categoria;
        if (i.descricao) patch.description = i.descricao;
        if (i.data) patch.occurred_on = i.data;
        const { error } = await supabase.from("transactions").update(patch).eq("id", last.id);
        if (error) return { ok: false, erro: error.message };
        const m = { ...last, ...patch };
        return { ok: true, id: last.id, tipo: m.type, valor: Number(m.amount), categoria: m.category, descricao: m.description, data: m.occurred_on };
      },
    }),
    apagar_transacao: tool({
      description: "Apaga um lançamento pelo id.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        return error ? { ok: false, erro: error.message } : { ok: true };
      },
    }),
    resumo_do_mes: tool({
      description: "Resumo financeiro do mês atual e do anterior: receitas, despesas, saldo e gastos por categoria.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("transactions")
          .select("id, type, amount, category, description, occurred_on")
          .gte("occurred_on", new Date(Date.now() - 70 * 864e5).toISOString().slice(0, 10));
        if (error) return { ok: false, erro: error.message };
        const txs = (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
        const key = todayBR().slice(0, 7);
        const prevKey = previousMonthKey(key);
        return { ok: true, mesAtual: monthSummary(txs, key), mesAnterior: monthSummary(txs, prevKey) };
      },
    }),
    consultar_gastos: tool({
      description: "Consulta analítica: filtra lançamentos por período, categorias, tipo, faixa de valor e termo, e devolve totais, maior/menor lançamento e somas por categoria e por mês.",
      inputSchema: z.object({
        inicio: z.string().nullable().describe("AAAA-MM-DD inicial (inclusive) ou null"),
        fim: z.string().nullable().describe("AAAA-MM-DD final (inclusive) ou null"),
        categorias: z.array(categoryEnum).nullable(),
        tipo: z.enum(["receita", "despesa"]).nullable(),
        valor_min: z.number().nullable(),
        valor_max: z.number().nullable(),
        termo: z.string().nullable().describe("Texto na descrição, ex.: uber, ifood"),
      }),
      execute: async (i) => {
        const iso = (d: string | null) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
        let q = supabase.from("transactions").select("id, type, amount, category, description, occurred_on");
        if (iso(i.inicio)) q = q.gte("occurred_on", iso(i.inicio)!);
        if (iso(i.fim)) q = q.lte("occurred_on", iso(i.fim)!);
        const { data, error } = await q.order("occurred_on", { ascending: false }).limit(2000);
        if (error) return { ok: false, erro: error.message };
        const txs = (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Transaction[];
        const r = analyzeTransactions(txs, {
          inicio: iso(i.inicio), fim: iso(i.fim), categorias: i.categorias, tipo: i.tipo,
          valorMin: i.valor_min, valorMax: i.valor_max, termo: i.termo,
        });
        return { ok: true, periodo: { inicio: iso(i.inicio), fim: iso(i.fim) }, ...r };
      },
    }),
    criar_meta: tool({
      description: "Cria uma meta financeira.",
      inputSchema: z.object({ nome: z.string(), valor_alvo: z.number(), prazo: z.string().nullable().describe("AAAA-MM-DD ou null") }),
      execute: async (i) => {
        const { error } = await supabase
          .from("goals")
          .insert({ user_id: userId, name: i.nome, target_amount: i.valor_alvo, deadline: i.prazo });
        return error ? { ok: false, erro: error.message } : { ok: true, alvo: formatBRL(i.valor_alvo) };
      },
    }),
    listar_metas: tool({
      description: "Lista as metas do usuário com valores guardados.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase.from("goals").select("id, name, target_amount, saved_amount, deadline");
        return error ? { ok: false, erro: error.message } : { ok: true, metas: data };
      },
    }),
    guardar_na_meta: tool({
      description: "Adiciona um valor guardado a uma meta existente.",
      inputSchema: z.object({ id: z.string(), valor: z.number() }),
      execute: async ({ id, valor }) => {
        const { data: g, error } = await supabase.from("goals").select("saved_amount").eq("id", id).single();
        if (error) return { ok: false, erro: error.message };
        const saved = Number(g.saved_amount) + valor;
        const { error: e2 } = await supabase.from("goals").update({ saved_amount: saved }).eq("id", id);
        return e2 ? { ok: false, erro: e2.message } : { ok: true, guardado: formatBRL(saved) };
      },
    }),
  };

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: instructions(profile?.display_name ?? null, profile?.main_goal ?? null),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(6),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: false,
      onFinish: async ({ responseMessage }) => {
        const { error } = await supabase.from("chat_messages").upsert(
          { user_id: userId, message_id: responseMessage.id, role: "assistant", message: responseMessage as never },
          { onConflict: "user_id,message_id" },
        );
        if (error) console.error("save assistant message failed", error);
      },
    }),
    runIdFetch,
  );
}
