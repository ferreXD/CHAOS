# chaos-todo-views

Deterministic generator for the CHAOS todo **dashboard** — the human-readable HTML digest of the
backlog. Replaces hand-authored HTML: `chaos:todo` runs this instead of hand-editing views, so a
view can never drift from its source of truth.

## What it does

Reads the durable source of truth —

```text
.chaos/todo/items/*.md    # one Markdown file per todo (frontmatter + body sections)
.chaos/todo/index.md      # repository index (context + provenance)
```

— and emits **one self-contained page**:

```text
.chaos/todo/views/index.html   # the whole dashboard (overview, by-target, by-type, blockers, all)
```

The page is a single file with **inline CSS + inline JS**, no external network, CDN, fonts, or
images — open it directly in a browser (or VS Code preview), fully offline. In-page navigation
(tabs, live search, filter, sort, light/dark) is driven by a small embedded script that renders
from a JSON blob of the parsed items. There is **no build step**.

## Usage

```bash
node tools/chaos-todo-views/generate.mjs
```

Options:

| Flag | Default | Meaning |
|---|---|---|
| `--items <dir>` | `.chaos/todo/items` | Item source directory. |
| `--index <file>` | `.chaos/todo/index.md` | Repository index (context/provenance). |
| `--out <file>` | `.chaos/todo/views/index.html` | Output HTML (use a dated path for a snapshot). |
| `--now <iso>` | latest item timestamp | Value shown as "Generated …". |
| `--source-command <s>` | `chaos:todo --refresh` | Footer provenance label. |

Requires **Node ≥ 22** (already a CHAOS dependency). Zero npm dependencies.

## Design notes

- **Deterministic:** same inputs → byte-identical output (timestamp defaults to the newest item
  timestamp, not the wall clock), so regenerating produces a clean, reviewable diff.
- **Source of truth is Markdown.** This HTML is a generated artifact — never hand-edit it;
  re-run the generator.
- **Escaping:** all interpolated content is HTML-escaped; the embedded JSON escapes `<`/`>` to
  prevent a `</script>` breakout; the client renders text via DOM APIs (no `innerHTML` of raw
  item text beyond a small, escape-first Markdown subset for `code`/`**bold**`/`*em*`).

## Layout

```text
generate.mjs        # CLI entry: read → parse → render → write, prints a summary
lib/parse.mjs       # zero-dep YAML-subset frontmatter parser + item/index parsing
lib/compute.mjs     # derived data (counts, recommended-next, groupings) for the stdout summary
lib/template.mjs    # the self-contained HTML/CSS/JS page renderer
```
