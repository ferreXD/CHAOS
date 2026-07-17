# Config Awareness Policy

`chaos:archaeology` must read `.chaos/config.yaml` when present.

Use config for:

- `paths.adrs`
- `paths.decisionLogs`
- `paths.openspec`
- `paths.archaeology`
- `paths.rules`
- `paths.gates`
- `agents.copilot.csharpExpert`
- `agents.copilot.csharpExpert` for Copilot C# specialist delegation; `agents.copilot.csharpExpert` may be read only as legacy/informational metadata if present.
- validation commands when test evidence is requested

If config is missing:

- `--light`: infer defaults and warn.
- `--standard`: infer defaults, warn, and recommend `chaos:status` or `chaos:init` repair.
- `--strict`: ask whether to continue with inferred paths or stop.

`chaos:archaeology` must not edit `.chaos/config.yaml`.
