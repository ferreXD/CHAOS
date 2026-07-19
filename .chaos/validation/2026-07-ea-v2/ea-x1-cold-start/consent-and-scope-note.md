---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: "chaos:sync"
  lastWrittenAt: "2026-07-19T15:02:40+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T15:02:40+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "{'name': 'main', 'isDefaultBranch': True, 'upstream': 'origin/main', 'mergeBase': '8b751b7880b42286a882f2ecfd68428e72bb55f7', 'confidence': 'MEDIUM'}"
    reviewRequest: "{'providerType': 'unknown', 'id': '', 'url': '', 'title': '', 'author': '', 'sourceBranch': '', 'targetBranch': '', 'status': 'unknown', 'confidence': 'LOW'}"
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:ff078c6b28750d378494c6a074117e085545e0e96ac94b87116ca69adf4e024d"
---

# EA-X1 — Consent & scope note (for participants)

*Give this to each participant before the session; keep a signed/acknowledged copy. This is a
lightweight research-usability note, not a legal contract — adapt to your org's requirements.*

## What this is

You are helping evaluate the **onboarding experience** of an experimental developer tool called
CHAOS. We want to learn where the *documentation and setup* are confusing or broken. **We are
testing the tool and its docs — we are not testing you.** There are no right answers and no way
to "fail." Every point of confusion you hit is a useful result for us.

## What we'll ask you to do

- Use only the project's own documentation to install CHAOS, check your environment, and walk a
  small demo change far enough to see what the tool does.
- **Think aloud** as you go — say what you're looking at, what you expect, and what surprises you.
- Work unaided: the facilitator won't answer questions about CHAOS or fix things for you. If you
  get stuck, keep trying what the docs suggest, and tell us when you'd give up in real life.

Expected time: up to ~60 minutes; we'll stop by 90 minutes regardless.

## What we'll record

- Your **screen** and **audio** (your voice) during the session.
- Timestamps of each step, any errors/blockers, and your version numbers (OS, Node, .NET).
- **We will not** record secrets, tokens, or personal files. If sensitive info is about to
  appear on screen, tell us and we'll pause the recording.

## How we'll use it

- To find and fix onboarding defects, and as **evidence in an internal validation report**
  (experiment EA-X1). Findings may be published in the project's repository.
- **De-identified by default:** you'll be referred to as `P1`/`P2`/`P3`. Raw recordings are kept
  only as long as needed to extract findings, then deleted. We won't attribute quotes to you by
  name without your explicit OK.

## Your rights

- Participation is **voluntary**. You may **stop at any time**, skip anything, or ask for your
  data to be discarded — no reason needed, no consequences.
- You can ask what we recorded and request deletion afterward.

## Scope boundaries (what this trial is and isn't)

- It measures **human time-to-first-value** and **first-run friction** — the thing the automated
  probe explicitly cannot measure.
- It is **not** a security review, a performance benchmark, or a judgement of your skills.
- The tool is **public-alpha and expected to have rough edges** — hitting them is the point.

---

**Acknowledgement**

> I've read this note. I understand my participation is voluntary, that my screen and audio will
> be recorded for this usability study, and that I can stop or withdraw my data at any time.

Participant: ______________________  Date: ____________

Facilitator: ______________________  Date: ____________
