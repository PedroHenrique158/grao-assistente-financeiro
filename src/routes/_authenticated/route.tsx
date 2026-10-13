import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MessageCircle, Target, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    if (location.pathname !== "/boas-vindas") {
      const { data: p } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).maybeSingle();
      if (!p?.onboarded) throw redirect({ to: "/boas-vindas" });
    }
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/chat", label: "Conversar", icon: MessageCircle },
  { to: "/painel", label: "Resumo", icon: LayoutDashboard },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/perfil", label: "Perfil", icon: UserRound },
] as const;

function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/boas-vindas") return <Outlet />;
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-2 border-r bg-sidebar p-4 md:flex">
        <div className="mb-6 px-2"><Logo /></div>
        <nav aria-label="Navegação principal" className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium text-foreground hover:bg-sidebar-accent",
                path === to && "bg-primary text-primary-foreground hover:bg-primary",
              )}
              aria-current={path === to ? "page" : undefined}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex min-h-0 flex-1 flex-col pb-20 md:pb-0">
        <Outlet />
      </main>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-card md:hidden"
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={path === to ? "page" : undefined}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground",
              path === to && "text-primary",
            )}
          >
            <Icon className="size-6" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
