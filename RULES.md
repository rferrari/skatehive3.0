# Coding Rules

These rules supplement the information in `AGENTS.md` and apply to all contributions.

1. Use **TypeScript** for all new code.
2. Indent with **2 spaces**; avoid tabs.
3. Keep imports ordered: external modules first, then internal paths.
4. Run `pnpm lint` before committing.
5. Group related changes in a single commit with a descriptive message.
6. Ensure the app builds with `pnpm build` before opening a PR.
7. Verify new dependencies with `pnpm info` and `pnpm audit` before adding them.
