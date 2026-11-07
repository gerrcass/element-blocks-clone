# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

- Create: `gh issue create --title "..." --body "..."` (heredoc for multi-line)
- Read: `gh issue view <n> --json number,title,body,labels,comments`
- List: `gh issue list --state open --json number,title,labels`
- Comment/close: `gh issue comment <n> --body "..."` / `gh issue close <n> --comment "..."`

Local mirror: `.scratch/element-blocks/issues/<NN>-<slug>.md` (one file per ticket, written by `/to-tickets`; GitHub issues are the source of truth when they exist).

Find at: `gh issue list --state all`

**PRs as a request surface: no.**
