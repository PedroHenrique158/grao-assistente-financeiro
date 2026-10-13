<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules
- Signed-in pages live under `src/routes/_authenticated/`; the layout gates auth and redirects to onboarding until `profiles.onboarded` is true. Why: one gate for every private page.
- AI chat streams through the `/api/chat` server route (`src/lib/ai/chat.server.ts`), which checks the user's token and uses tools to write transactions and goals with row security applied. Why: keys and prompts stay on the server.
- Money math (totals, insights, goal progress) lives in `src/lib/finance.ts` with tests beside it. Why: one tested source for financial rules.
