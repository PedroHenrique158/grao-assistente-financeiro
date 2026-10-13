import { Sprout } from "lucide-react";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-xl font-bold text-foreground">
      <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
        <Sprout className="size-5" aria-hidden />
      </span>
      Grão
    </span>
  );
}

export function AgentAvatar() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
      <Sprout className="size-4" />
    </span>
  );
}
