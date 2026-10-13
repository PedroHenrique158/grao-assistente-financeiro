import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LogOut, Moon, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil e configurações — Grão" }] }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("display_name, main_goal").eq("id", user.id).single()).data,
  });
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [dark, setDark] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });
  useEffect(() => {
    if (profile.data) { setName(profile.data.display_name ?? ""); setGoal(profile.data.main_goal ?? ""); }
  }, [profile.data]);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  async function save(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({ display_name: name, main_goal: goal }).eq("id", user.id);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Dados salvos.");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }
  function toggleDark(v: boolean) {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("grao-theme", v ? "dark" : "light");
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as never);
    if (error) return toast.error("Não foi possível trocar a senha. Confira a senha atual.");
    toast.success("Senha alterada.");
    setPw({ current: "", next: "" });
  }
  async function clearChat() {
    if (!confirm("Apagar todo o histórico da conversa? Seus lançamentos continuam salvos.")) return;
    const { error } = await supabase.from("chat_messages").delete().eq("user_id", user.id);
    if (error) return toast.error("Não foi possível apagar.");
    qc.removeQueries({ queryKey: ["chat-history"] });
    toast.success("Histórico apagado.");
  }
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6">
      <h1 className="text-3xl font-bold">Perfil e configurações</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg">Seus dados</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-4">
            <p className="text-sm text-muted-foreground">E-mail: {user.email}</p>
            <div className="grid gap-2"><Label htmlFor="pn">Nome</Label><Input id="pn" className="h-12" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="pg">Objetivo principal</Label><Input id="pg" className="h-12" value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
            <Button type="submit" size="lg">Salvar</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Preferências</CardTitle></CardHeader>
        <CardContent>
          <div className="flex min-h-12 items-center justify-between gap-3">
            <Label htmlFor="dark" className="flex items-center gap-2 text-base"><Moon className="size-5" aria-hidden /> Modo escuro</Label>
            <Switch id="dark" checked={dark} onCheckedChange={toggleDark} />
          </div>
        </CardContent>
      </Card>
      {user.app_metadata?.provider === "email" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="size-5" aria-hidden /> Segurança</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="grid gap-4">
              <div className="grid gap-2"><Label htmlFor="cp">Senha atual</Label><Input id="cp" type="password" autoComplete="current-password" className="h-12" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="np">Nova senha</Label><Input id="np" type="password" autoComplete="new-password" className="h-12" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
              <Button type="submit" variant="outline" size="lg">Trocar senha</Button>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-lg">Privacidade</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-base">
          <p>Seus dados ficam protegidos e só você tem acesso a eles. Usamos suas informações apenas para mostrar seus resumos e dicas, conforme a LGPD.</p>
          <Button variant="outline" size="lg" onClick={clearChat}><Trash2 className="size-5" aria-hidden /> Apagar histórico da conversa</Button>
        </CardContent>
      </Card>
      <Button variant="destructive" size="lg" className="w-full" onClick={signOut}><LogOut className="size-5" aria-hidden /> Sair da conta</Button>
    </div>
  );
}
