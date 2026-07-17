# CHAOS Workflow Map Template

This file describes the recommended CHAOS lifecycle for navigation purposes.

It is a guide, not a hard execution engine.

## Golden path

```text
chaos:init
  ↓
chaos:status
  ↓
[optional] chaos:archaeology
  ↓
chaos:propose
  ↓
chaos:review
  ↓
chaos:apply
  ↓
chaos:verify
  ↓
chaos:archive
  ↓
chaos:sync
  ↓
chaos:retro
```

## State map

| State | Evidence | Recommended next command |
|---|---|---|
| Uninitialized | `.chaos/` missing | `chaos:init` |
| Initialized | `.chaos/context.md` exists | `chaos:status` |
| Ready | status verdict READY/STRONG | `chaos:propose` |
| Brownfield unclear | change touches legacy behavior and no archaeology exists | `chaos:archaeology <topic>` |
| Proposal created | OpenSpec change exists, review missing | `chaos:review <change-id>` |
| Reviewed | review permits implementation, apply missing | `chaos:apply <change-id>` |
| Applied | apply report exists, verification missing | `chaos:verify <change-id>` |
| Verified | verification permits closure, archive missing | `chaos:archive <change-id>` |
| Archived | archive report exists, sync missing/stale | `chaos:sync --change <change-id>` |
| Synced | sync report exists, retro recommended/missing | `chaos:retro <change-id>` |

## Command categories

| Category | Commands |
|---|---|
| Bootstrap/navigation | `chaos:init`, `chaos:help`, `chaos:status` |
| Discovery/spec | `chaos:archaeology`, `chaos:propose`, `chaos:review` |
| Execution/validation | `chaos:apply`, `chaos:verify` |
| Closure/learning | `chaos:archive`, `chaos:sync`, `chaos:retro` |
