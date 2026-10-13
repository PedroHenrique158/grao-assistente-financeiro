import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { AgentAvatar } from "@/components/Logo";
import { formatBRL } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Conversar — Grão" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = Route.useRouteContext();
  const history = useQuery({
    queryKey: ["chat-history", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("message")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((r) => r.message as unknown as UIMessage);
    },
    staleTime: Infinity,
  });
  if (history.isPending) return <div className="p-6"><Shimmer>Carregando conversa…</Shimmer></div>;
  return <ChatWindow initial={history.data ?? []} />;
}

const QUICK = ["Gastei R$ 45 no almoço hoje", "Recebi meu salário de R$ 3.500", "Quanto gastei este mês?", "Me dá uma dica para economizar"];

type ToolPart = { type: string; state?: string; input?: Record<string, unknown>; output?: Record<string, unknown> };

function ToolNote({ part }: { part: ToolPart }) {
  const name = part.type.replace("tool-", "");
  if (part.state !== "output-available") return <Shimmer className="text-sm">Anotando…</Shimmer>;
  if (part.output && part.output.ok === false) return <p className="text-sm text-destructive">Não consegui concluir essa ação.</p>;
  if (name === "registrar_transacao" && part.input) {
    const i = part.input as { tipo: string; valor: number; categoria: string; descricao: string };
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
        <CheckCircle2 className="size-4 text-income" aria-hidden />
        <span>
          {i.tipo === "receita" ? "Receita" : "Despesa"} de <strong>{formatBRL(i.valor)}</strong> · {i.categoria} · {i.descricao}
        </span>
      </div>
    );
  }
  const labels: Record<string, string> = {
    corrigir_transacao: "Lançamento corrigido",
    apagar_transacao: "Lançamento apagado",
    criar_meta: "Meta criada",
    guardar_na_meta: "Valor guardado na meta",
  };
  if (labels[name])
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-income" aria-hidden /> {labels[name]}
      </div>
    );
  return null;
}

function ChatWindow({ initial }: { initial: UIMessage[] }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [],
  );
  const { messages, sendMessage, status, stop } = useChat({
    id: "principal",
    messages: initial,
    transport,
    onError: (e) => {
      const m = e.message || "";
      if (m.includes("429")) toast.error("Muitas mensagens seguidas. Espere um pouco e tente de novo.");
      else if (m.includes("402")) toast.error("O assistente está sem créditos no momento.");
      else toast.error("Não consegui responder agora. Verifique sua conexão e tente de novo.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col md:h-dvh">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <AgentAvatar />
        <div>
          <h1 className="text-lg font-bold leading-tight">Grão</h1>
          <p className="text-sm text-muted-foreground">Seu assistente financeiro</p>
        </div>
      </header>
      <Conversation className="flex-1">
        <ConversationContent aria-live="polite">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<AgentAvatar />}
              title="Olá! Me conte um gasto ou recebimento."
              description="Escreva do seu jeito, por exemplo: “Paguei R$ 120 de internet”."
            />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent
                  className={
                    m.role === "user"
                      ? "bg-primary text-base text-primary-foreground"
                      : "gap-2 bg-transparent text-base text-foreground"
                  }
                >
                  {m.parts.map((p, i) => {
                    if (p.type === "text")
                      return m.role === "user" ? <span key={i}>{p.text}</span> : <MessageResponse key={i}>{p.text}</MessageResponse>;
                    if (p.type.startsWith("tool-")) return <ToolNote key={i} part={p as ToolPart} />;
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer className="text-base">Pensando…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton aria-label="Ir para o fim da conversa" />
      </Conversation>
      <div className="space-y-3 border-t bg-background p-3">
        <Suggestions aria-label="Sugestões rápidas">
          {QUICK.map((q) => (
            <Suggestion key={q} suggestion={q} onClick={send} disabled={busy} className="min-h-11 text-sm" />
          ))}
        </Suggestions>
        <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea
            ref={inputRef}
            aria-label="Escreva sua mensagem"
            placeholder="Ex.: Gastei R$ 80 no mercado"
            className="text-base"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} aria-label={busy ? "Parar" : "Enviar"} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
