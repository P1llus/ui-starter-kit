"""Map Claude Code sessions for this repo: the orchestrator timeline and every subagent.

Claude Code keeps each session as JSONL under ~/.claude/projects/<repo path with / as ->/.
Subagents live in <session>/subagents/agent-<id>.jsonl with a .meta.json (description, type,
parent). The files hold screenshots as base64, so they get huge: never cat them, use this.

    uv run python sessions.py list                        # sessions, newest last
    uv run python sessions.py agents [SESSION]            # every subagent: time, depth, stats, result
    uv run python sessions.py unfinished [SESSION]        # agents cut off (usage limit) or without a result
    uv run python sessions.py timeline [SESSION] --out ../work/timeline.md   # condensed orchestrator log
    uv run python sessions.py agent <id-prefix> [SESSION] # condensed log of one subagent

SESSION is a session id or prefix; default is the most recent. --project <repo path> maps another
repo, --dir <folder> points at a Claude project folder directly. Uses only the standard library.

Uses: an orchestrator resuming after a crash (`unfinished` shows who to resume and where they
stopped), a user reviewing what the agents did, or a wrap-up note on how the build went.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LIMIT_RE = re.compile(r"usage limit|session limit|hit your limit|rate limit", re.I)


def claude_dir(args) -> Path:
    if args.dir:
        return Path(args.dir)
    home = Path(os.environ.get("CLAUDE_CONFIG_DIR", Path.home() / ".claude"))
    repo = Path(args.project).resolve() if args.project else REPO
    return home / "projects" / re.sub(r"[^A-Za-z0-9]", "-", str(repo))


def sessions(root: Path) -> list[Path]:
    return sorted((p for p in root.glob("*.jsonl") if p.stat().st_size > 0), key=lambda p: p.stat().st_mtime)


def pick(root: Path, prefix: str | None) -> Path:
    found = sessions(root)
    if prefix:
        found = [p for p in found if p.stem.startswith(prefix)]
    if not found:
        raise SystemExit(f"no session found in {root}")
    return found[-1]


def events(path: Path):
    with open(path, encoding="utf8", errors="replace") as f:
        for raw in f:
            try:
                yield json.loads(raw)
            except json.JSONDecodeError:
                continue


def text_of(content) -> str:
    if isinstance(content, str):
        return content
    return "\n".join(p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") == "text")


def first_prompt(path: Path) -> str:
    for e in events(path):
        if e.get("type") == "user":
            t = text_of(e.get("message", {}).get("content", ""))
            if t and not t.startswith("<"):
                return t.strip().replace("\n", " ")[:120]
    return ""


def cmd_list(args) -> int:
    root = claude_dir(args)
    print(f"sessions in {root}")
    for p in sessions(root):
        stamps = [e.get("timestamp") for e in events(p) if e.get("timestamp")]
        subs = len(list((root / p.stem / "subagents").glob("*.meta.json"))) if (root / p.stem).exists() else 0
        span = f"{stamps[0][:16]} .. {stamps[-1][:16]}" if stamps else "?"
        print(f"{p.stem[:8]}  {span}  {p.stat().st_size / 1e6:6.1f} MB  {subs:3d} agents  {first_prompt(p)}")
    return 0


def agent_rows(root: Path, session: Path) -> list[dict]:
    rows = []
    for meta_path in sorted((root / session.stem / "subagents").glob("*.meta.json")):
        meta = json.loads(meta_path.read_text())
        jl = meta_path.with_name(meta_path.name.replace(".meta.json", ".jsonl"))
        first = last = None
        final, prompt, tools, png, shots, spawned, stops, last_error, working = "", "", 0, 0, 0, 0, 0, False, False
        for e in events(jl):
            ts = e.get("timestamp")
            if ts:
                first, last = first or ts, ts
            if e.get("type") == "user" and not prompt:
                prompt = text_of(e["message"].get("content", ""))
            if e.get("type") == "assistant":
                if e.get("isApiErrorMessage"):
                    stops += 1
                for part in e["message"].get("content", []):
                    if part.get("type") == "text" and part["text"].strip():
                        final = part["text"].strip()
                        last_error = bool(e.get("isApiErrorMessage"))
                        working = False
                    elif part.get("type") == "tool_use":
                        tools += 1
                        working = True  # text before a tool call is an interim line, not the result
                        inp = part.get("input", {})
                        if part["name"] == "Read" and str(inp.get("file_path", "")).endswith(".png"):
                            png += 1
                        if part["name"] == "Bash" and re.search(r"shoot\.py|browse\.py", inp.get("command", "")):
                            shots += 1
                        if part["name"] in ("Agent", "Task"):
                            spawned += 1
        cut = last_error or bool(LIMIT_RE.search(final[-300:]) and len(final) < 300)
        status = "cut off" if cut else ("done" if final and not working else "running or stopped" if tools else "no result")
        rows.append({
            "id": jl.stem.replace("agent-", ""), "desc": meta.get("description", ""), "type": meta.get("agentType", ""),
            "parent": (meta.get("parentAgentId") or "")[:8], "depth": meta.get("spawnDepth", 1),
            "start": (first or "")[:16], "end": (last or "")[11:16], "mb": jl.stat().st_size / 1e6,
            "tools": tools, "png": png, "shots": shots, "spawned": spawned, "status": status, "stops": stops,
            "final": final, "prompt": prompt,
        })
    rows.sort(key=lambda r: r["start"])
    return rows


def cmd_agents(args, only_unfinished: bool = False) -> int:
    root = claude_dir(args)
    session = pick(root, args.session)
    rows = agent_rows(root, session)
    if only_unfinished:
        rows = [r for r in rows if r["status"] != "done"]
    out = [f"# Subagents of session {session.stem[:8]} ({len(rows)} shown)", "",
           "PNG = screenshots opened with Read; shots = shoot.py/browse.py runs; stops = API errors such as",
           "usage limits (the agent was resumed if its status is done). Times are UTC.", "",
           "| Start | End | Depth | Id | Parent | Task | Tools | PNG | Shots | Stops | Status | Result (first line) |",
           "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows:
        line = (r["final"].splitlines() or [""])[0][:140].replace("|", "/")
        out.append(f"| {r['start']} | {r['end']} | {r['depth']} | {r['id'][:8]} | {r['parent']} | {r['desc']} | "
                   f"{r['tools']} | {r['png']} | {r['shots']} | {r['stops']} | {r['status']} | {line} |")
    if only_unfinished and rows:
        out += ["", "Last words of each (where it stopped):", ""]
        out += [f"- {r['id'][:8]} {r['desc']}: {r['final'][-300:]!r}" for r in rows]
    emit("\n".join(out), args.out)
    return 0


def cmd_timeline(args) -> int:
    root = claude_dir(args)
    session = pick(root, args.session)
    names: dict[str, str] = {}
    out = [f"# Timeline of session {session.stem[:8]}", ""]
    for e in events(session):
        ts = e.get("timestamp", "")[:19]
        if e.get("type") == "user":
            content = e["message"].get("content", "")
            parts = [{"type": "text", "text": content}] if isinstance(content, str) else content
            for part in parts:
                if part.get("type") == "text":
                    t = part["text"]
                    if "<task-notification>" in t:
                        summary = re.search(r"<summary>(.*?)</summary>", t, re.S)
                        result = re.search(r"<result>(.*?)</result>", t, re.S)
                        out.append(f"\n<- {ts} {summary.group(1) if summary else 'agent notification'}")
                        if result:
                            out.append("   " + result.group(1).strip()[: args.chars].replace("\n", "\n   "))
                    elif not t.startswith("<"):
                        out.append(f"\n## USER {ts}\n{t[:4000]}")
        elif e.get("type") == "assistant":
            for part in e["message"].get("content", []):
                if part.get("type") == "text" and part["text"].strip():
                    out.append(f"\n{ts} {part['text'].strip()[:1500]}")
                elif part.get("type") == "tool_use":
                    inp = part.get("input", {})
                    if part["name"] in ("Agent", "Task"):
                        names[part["id"]] = inp.get("description", "")
                        out.append(f"-> {ts} AGENT {inp.get('description')}: {inp.get('prompt', '')[: args.chars]!r}")
                    elif part["name"] == "SendMessage":
                        out.append(f"-> {ts} MESSAGE {json.dumps(inp)[: args.chars]}")
                    elif part["name"] in ("Write", "Edit"):
                        out.append(f"   {part['name']} {inp.get('file_path')}")
                    elif part["name"] == "Bash" and re.search(r"git commit", inp.get("command", "")):
                        out.append(f"   COMMIT {inp.get('command', '')[:200]!r}")
        elif e.get("type") == "system" and e.get("subtype") == "compact_boundary":
            out.append(f"\n==== context compacted {ts}")
    emit("\n".join(out), args.out)
    return 0


def cmd_agent(args) -> int:
    root = claude_dir(args)
    session = pick(root, args.session)
    found = list((root / session.stem / "subagents").glob(f"agent-{args.id}*.jsonl"))
    if not found:
        raise SystemExit(f"no subagent {args.id} in session {session.stem[:8]}")
    out = []
    for e in events(found[0]):
        ts = e.get("timestamp", "")[11:19]
        if e.get("type") == "user":
            content = e["message"].get("content", "")
            if isinstance(content, str):
                out.append(f"\n## PROMPT {ts}\n{content}")
                continue
            for part in content:
                if part.get("type") == "text":
                    out.append(f"\n## USER {ts}\n{part['text']}")
                elif part.get("type") == "tool_result":
                    c = part.get("content")
                    t = " ".join(x.get("text", "[image]") if x.get("type") == "text" else "[image]" for x in c) if isinstance(c, list) else str(c)
                    out.append(f"   <- {t[: args.chars]!r}")
        elif e.get("type") == "assistant":
            for part in e["message"].get("content", []):
                if part.get("type") == "text" and part["text"].strip():
                    out.append(f"\n{ts} {part['text'].strip()}")
                elif part.get("type") == "tool_use":
                    inp = part.get("input", {})
                    brief = inp.get("command") or inp.get("file_path") or inp.get("description") or json.dumps(inp)
                    out.append(f"  . {part['name']} {str(brief)[:400]}")
    emit("\n".join(out), args.out)
    return 0


def emit(text: str, out: str | None) -> None:
    if out:
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        Path(out).write_text(text + "\n")
        print(f"wrote {out}")
    else:
        print(text)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", help="repo path to map (default: this repo)")
    ap.add_argument("--dir", help="Claude project folder, instead of deriving it from --project")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list")
    for name in ("agents", "unfinished", "timeline"):
        sp = sub.add_parser(name)
        sp.add_argument("session", nargs="?")
        sp.add_argument("--out")
        sp.add_argument("--chars", type=int, default=600, help="characters of prompts and results to keep")
    sp = sub.add_parser("agent")
    sp.add_argument("id")
    sp.add_argument("session", nargs="?")
    sp.add_argument("--out")
    sp.add_argument("--chars", type=int, default=300)
    args = ap.parse_args()
    if args.cmd == "list":
        return cmd_list(args)
    if args.cmd == "agents":
        return cmd_agents(args)
    if args.cmd == "unfinished":
        return cmd_agents(args, only_unfinished=True)
    if args.cmd == "timeline":
        return cmd_timeline(args)
    return cmd_agent(args)


if __name__ == "__main__":
    sys.exit(main())
