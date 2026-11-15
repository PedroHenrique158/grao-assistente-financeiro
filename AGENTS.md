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
- Private pages share a single authenticated layout that also gates onboarding. Why: one gate for every private page.
- AI requests run only on the server and verify the caller before acting. Why: keys and prompts never reach the browser.
- Financial calculations live in one shared tested module. Why: one tested source for money rules.
