# Codex instructions for this site

Before making changes, read `PROJECT_CONTEXT.md` in this folder and the project memory file at:

`C:\Users\АМ\Documents\Сайт Церкви\ПАМЯТЬ_ПРОЕКТА.md`

Rules:

- Treat the current `site` folder as the source of truth.
- Do not roll the design back to earlier drafts unless the user explicitly asks.
- Preserve the calm modern Orthodox style: blue church identity, warm quiet backgrounds, icon-centered visual language, no loud marketing layout.
- Preserve the notes/payment logic unless a requested change requires updating it.
- Before editing, run or inspect `git status` and understand uncommitted changes.
- After meaningful edits, run `npm run lint` and `npm run build`.
- For deploy preview, push to GitHub; GitHub Pages is configured by `.github/workflows/pages.yml`.

Current public links:

- Repository: `https://github.com/pehal16/hram-blagoveshcheniya-gorlovka`
- GitHub Pages preview: `https://pehal16.github.io/hram-blagoveshcheniya-gorlovka/`
