# Security Policy

CHAOS is an **experimental, public-alpha** project maintained by a small team. We take security
seriously nonetheless, and we appreciate reports that help us keep the tooling and its users safe.

> **Scope reminder.** CHAOS is a *governance workflow* you run against your own repositories. It is
> not production-hardened, and the runnable pieces (the interaction-runtime MCP server, the Decision
> Center extension, and the example project) are alpha-quality. Please evaluate accordingly.

## Supported versions

Being pre-1.0, CHAOS only supports the latest state of the default branch. There are no maintained
release branches yet, so fixes land on `main`.

| Version | Supported |
|---|---|
| `main` (public alpha) | ✅ Best-effort |
| Any earlier commit / tag | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.** Public issues are visible to
everyone and would disclose the problem before a fix exists.

Instead, report privately through **GitHub's private vulnerability reporting**:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** (under *Advisories*).
3. Fill in the private advisory form.

Direct link: <https://github.com/ferreXD/CHAOS/security/advisories/new>

This opens a private channel visible only to you and the maintainers — no personal email address is
required on either side.

### What to include

The more of this you can provide, the faster we can triage:

- **What the issue is** — the vulnerability class and a short description.
- **Where** — the affected component (e.g. `tools/chaos-interaction-mcp`,
  `extensions/chaos-decision-center`, a CHAOS command/skill, or the example project).
- **How to reproduce** — steps, a proof-of-concept, or a failing case.
- **Impact** — what an attacker could do, and any preconditions.
- **Environment** — OS, Node version, and whether you were on the Claude Code or Copilot surface.

Please share only what you're comfortable putting in the advisory, and give us a reasonable window
to respond before any public disclosure.

## What to expect

This is a single-maintainer-scale alpha, so responses are **best-effort** rather than
SLA-backed:

- **Acknowledgement:** we aim to confirm receipt within about a week.
- **Triage & fix:** we'll assess severity, keep you updated in the advisory thread, and work a fix
  on `main`. Timelines depend on severity and maintainer availability.
- **Coordinated disclosure:** we'll agree a disclosure timing with you and credit you in the
  advisory unless you'd prefer to remain anonymous.

## Scope

**In scope** — the CHAOS tooling itself:

- the interaction-runtime MCP server (`tools/chaos-interaction-mcp/`);
- the Decision Center VS Code extension (`extensions/chaos-decision-center/`);
- the CHAOS command/skill content under `.claude/` and its `.github/` mirror;
- handling of the git-backed runtime state under `.chaos/`.

**Out of scope:**

- The **example project** (`examples/task-tracker/`) and the demo walkthrough — these are
  intentionally minimal illustrative material, not a hardened application.
- Vulnerabilities in **third-party dependencies** (e.g. OpenSpec, Node packages, the .NET SDK) —
  report those upstream; we'll pick up fixes as they're released.
- Findings that require a **compromised local machine or an already-trusted operator**, since CHAOS
  runs locally under the human driver's own privileges.

## A note on the alpha posture

CHAOS deliberately keeps runtime state and per-session interaction files git-ignored, and asks
contributors never to commit secrets or private data (see [CONTRIBUTING.md](CONTRIBUTING.md)). If you
find a case where the tooling leaks secrets, private identifiers, or client residue into tracked
artifacts, that is in scope — please report it through the channel above.
