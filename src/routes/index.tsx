import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard, MessageCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, AgentAvatar } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Grão — Seu assistente financeiro por conversa" },
      { name: "description", content: "Registre gastos e receitas conversando. O Grão categoriza tudo, mostra seu resumo e ajuda você a alcançar suas metas." },
      { property: "og:title", content: "Grão — Seu assistente financeiro por conversa" },
      { property: "og:description", content: "Controle seu dinheiro sem planilhas: é só conversar." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <Button asChild variant="outline" size="lg"><Link to="/auth">Entrar</Link></Button>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-5 pb-16 pt-6 md:grid-cols-2 md:items-center md:pt-16">
        <section className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">Cuide do seu dinheiro conversando.</h1>
          <p className="text-lg text-muted-foreground">Sem planilhas e sem formulários. Conte o que gastou ou recebeu, e o Grão organiza tudo para você.</p>
          <Button asChild size="lg" className="h-14 px-8 text-lg"><Link to="/auth">Começar grátis</Link></Button>
        </section>
        <section aria-label="Exemplo de conversa" className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground">Gastei R$ 45 no almoço hoje.</p>
          <div className="flex gap-2"><AgentAvatar /><p className="max-w-[85%]">Registrei uma despesa de <strong>R$ 45,00</strong> na categoria <strong>Alimentação</strong>.</p></div>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground">Recebi meu salário de R$ 3.500.</p>
          <div className="flex gap-2"><AgentAvatar /><p className="max-w-[85%]">Receita de <strong>R$ 3.500,00</strong> registrada na categoria <strong>Salário</strong>. 🎉</p></div>
        </section>
      </main>
      <section className="border-t bg-secondary/50">
        <ul className="mx-auto grid max-w-5xl gap-6 px-5 py-12 md:grid-cols-3">
          {[
            { icon: MessageCircle, t: "Registre conversando", d: "Escreva do seu jeito. O valor, a categoria e a data são identificados sozinhos." },
            { icon: LayoutDashboard, t: "Resumo simples", d: "Veja quanto entrou, quanto saiu e onde você mais gasta." },
            { icon: Target, t: "Metas e dicas", d: "Acompanhe seus objetivos e receba sugestões para economizar." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="space-y-2">
              <Icon className="size-7 text-primary" aria-hidden />
              <h2 className="text-xl font-bold">{t}</h2>
              <p className="text-base text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
