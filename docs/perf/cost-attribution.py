import json, os, glob
from collections import defaultdict

BASE = r"C:/Users/monch/.claude/projects/d--Proyectos-CHAOS-CHAOS/57f356d4-0970-4af5-8709-f88c657d4b9f/subagents/workflows"
RUNS = {
    "X2":      f"{BASE}/wf_7fb294b1-cb8",   # 6 arms (3 chaos + 3 plain)
    "X2b-p1":  f"{BASE}/wf_9edd0fe0-713",   # 6 (3 chaos surface + 3 plain)
    "X2b-p2":  f"{BASE}/wf_5ce8b2f5-f26",   # 3 chaos resume
}

GOV_DOC_HINTS = ("agents.md", "/.chaos/rules", "/constitution", "/architecture", "/.chaos/context",
                 "/gates/", "/commands/index", "add-task-query-filters", "/.chaos/config", "bootstrap-report")
GOV_ART_HINTS = ("/.chaos/changes/", "openspec/")

def classify_target(path):
    p = (path or "").lower().replace("\\", "/")
    if any(h in p for h in GOV_ART_HINTS): return "gov_artifact"
    if p.endswith(".cs") or "/src/" in p or "/tests/" in p: return "code"
    if any(h in p for h in GOV_DOC_HINTS): return "gov_doc"
    return "other"

def classify_bash(cmd):
    c = (cmd or "").lower()
    if "dotnet" in c: return "build_test"
    if c.strip().startswith("date "): return "shell"
    return "shell"

def turn_category(tools):
    # tools: list of (name, target-or-cmd)
    names = [t[0] for t in tools]
    # priority order
    for name, tgt in tools:
        if name in ("Write", "Edit", "MultiEdit"):
            k = classify_target(tgt)
            if k == "gov_artifact": return "write_gov_artifact"
            if k == "code": return "write_code"
            return "write_other"
    for name, tgt in tools:
        if name == "Bash": return classify_bash(tgt)
        if name.startswith("mcp__chaos"): return "runtime_mcp"
    for name, tgt in tools:
        if name in ("Read", "Grep", "Glob"):
            k = classify_target(tgt)
            return "read_gov_doc" if k == "gov_doc" else ("read_code" if k == "code" else "read_other")
    return "reasoning_only"

def arm_type(first_prompt):
    fp = (first_prompt or "").lower()
    if "governed lifecycle" in fp or "chaos governed" in fp or "resuming a paused chaos" in fp: return "chaos"
    return "plain"

def parse_agent(path):
    turns = {}   # requestId -> {usage, tools:[], textlen}
    first_prompt = None
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line: continue
        try: o = json.loads(line)
        except: continue
        if o.get("type") == "user" and first_prompt is None:
            msg = o.get("message", {})
            c = msg.get("content")
            if isinstance(c, str): first_prompt = c
            elif isinstance(c, list):
                first_prompt = " ".join(b.get("text","") for b in c if isinstance(b,dict) and b.get("type")=="text")
        if o.get("type") != "assistant": continue
        m = o.get("message", {})
        rid = o.get("requestId") or o.get("uuid")
        u = m.get("usage", {}) or {}
        t = turns.setdefault(rid, {"in":0,"out":0,"cache_r":0,"cache_c":0,"tools":[],"textlen":0})
        # usage identical across the group's lines; set (not add)
        t["in"] = u.get("input_tokens",0); t["out"] = u.get("output_tokens",0)
        t["cache_r"] = u.get("cache_read_input_tokens",0); t["cache_c"] = u.get("cache_creation_input_tokens",0)
        for b in m.get("content", []):
            if not isinstance(b, dict): continue
            if b.get("type") == "tool_use":
                inp = b.get("input", {}) or {}
                tgt = inp.get("file_path") or inp.get("command") or inp.get("pattern") or ""
                t["tools"].append((b.get("name",""), tgt))
            elif b.get("type") == "text":
                t["textlen"] += len(b.get("text",""))
    return first_prompt, turns

# aggregate
agg = defaultdict(lambda: defaultdict(lambda: {"out":0,"in_ctx":0,"turns":0}))  # arm -> category -> metrics
arm_totals = defaultdict(lambda: {"out":0,"in_ctx":0,"turns":0,"agents":0})
for run, d in RUNS.items():
    for f in sorted(glob.glob(f"{d}/agent-*.jsonl")):
        if ".meta." in f: continue
        fp, turns = parse_agent(f)
        arm = arm_type(fp)
        arm_totals[arm]["agents"] += 1
        for rid, t in turns.items():
            cat = turn_category(t["tools"]) if t["tools"] else "reasoning_only"
            in_ctx = t["cache_c"] + t["cache_r"] + t["in"]
            agg[arm][cat]["out"] += t["out"]; agg[arm][cat]["in_ctx"] += in_ctx; agg[arm][cat]["turns"] += 1
            arm_totals[arm]["out"] += t["out"]; arm_totals[arm]["in_ctx"] += in_ctx; arm_totals[arm]["turns"] += 1

for arm in ("chaos","plain"):
    tot = arm_totals[arm]
    print(f"\n===== {arm.upper()} ({tot['agents']} agents, {tot['turns']} turns) =====")
    print(f"  TOTAL output tokens: {tot['out']:,}  |  input+cache (context) tokens: {tot['in_ctx']:,}")
    cats = sorted(agg[arm].items(), key=lambda kv: -kv[1]["out"])
    print(f"  {'category':22} {'out_tok':>10} {'out%':>6} {'ctx_tok':>12} {'turns':>6}")
    for cat, m in cats:
        op = 100*m["out"]/tot["out"] if tot["out"] else 0
        print(f"  {cat:22} {m['out']:>10,} {op:>5.1f}% {m['in_ctx']:>12,} {m['turns']:>6}")
