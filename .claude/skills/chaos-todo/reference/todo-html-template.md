# CHAOS Todo HTML Template — superseded by the generator

The todo dashboard is **no longer assembled from a hand-authored HTML skeleton**. It is produced by
a committed, deterministic generator, so a view can never drift from its source of truth:

```bash
node tools/chaos-todo-views/generate.mjs   # → .chaos/todo/views/index.html
```

The template — inline CSS + inline JS, fully self-contained, no external network/CDN/fonts/images —
lives in the generator:

```text
tools/chaos-todo-views/lib/template.mjs   # the HTML/CSS/JS page renderer
tools/chaos-todo-views/lib/parse.mjs      # frontmatter + body parser (zero-dep)
tools/chaos-todo-views/lib/compute.mjs    # derived data (counts, recommended-next, groupings)
tools/chaos-todo-views/generate.mjs       # CLI entry
```

**Do not hand-write view HTML.** To change the dashboard's markup, styling, or layout, edit the
generator and regenerate — reviewers review the generator, not the emitted HTML.

## Related

- `todo-html-view-contract.md` — hard requirements for the generated view.
- `tools/chaos-todo-views/README.md` — the generator (usage, flags, design notes).
