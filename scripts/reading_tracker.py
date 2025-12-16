#!/usr/bin/env python3

import argparse
import fnmatch
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


DEFAULT_COVERAGE_FILE = "project-coverage.json"
DEFAULT_STATE_FILE = "_context/reading-progress.json"


@dataclass(frozen=True)
class CoverageFileStat:
    path: str
    chars: int


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _match_any(path: str, patterns: Iterable[str]) -> bool:
    return any(fnmatch.fnmatch(path, pat) for pat in patterns)


def load_coverage(project_root: Path, coverage_file: str) -> Tuple[List[CoverageFileStat], Dict[str, Any]]:
    coverage_path = (project_root / coverage_file).resolve()
    data = _load_json(coverage_path)

    files: List[CoverageFileStat] = []
    for item in data.get("all_files", []):
        file_path = item.get("path")
        chars = item.get("chars")
        readable = item.get("readable", True)
        if not readable or file_path is None or chars is None:
            continue
        files.append(CoverageFileStat(path=file_path.replace("\\", "/"), chars=int(chars)))

    return files, data


def load_state(project_root: Path, state_file: str) -> Dict[str, Any]:
    state_path = (project_root / state_file).resolve()
    if not state_path.exists():
        return {
            "version": 1,
            "project_root": str(project_root),
            "coverage_file": DEFAULT_COVERAGE_FILE,
            "exclude": [
                "**/package-lock.json",
                "**/pnpm-lock.yaml",
                "**/yarn.lock",
                "**/project-coverage.json",
                "**/docs_analysis.json",
                "**/EKS/project-coverage.json",
            ],
            "files": {},
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }

    return _load_json(state_path)


def save_state(project_root: Path, state_file: str, state: Dict[str, Any]) -> None:
    state["updated_at"] = _now_iso()
    _save_json((project_root / state_file).resolve(), state)


def compute_progress(
    coverage: List[CoverageFileStat],
    state: Dict[str, Any],
) -> Dict[str, Any]:
    exclude = state.get("exclude", [])
    covered_files = [f for f in coverage if not _match_any(f.path, exclude)]

    total_chars = sum(f.chars for f in covered_files)
    total_files = len(covered_files)

    files_state: Dict[str, Any] = state.get("files", {})

    done_chars = 0
    done_files = 0
    partial_chars = 0
    partial_files = 0

    done_set = set()
    partial_set = set()

    for p, meta in files_state.items():
        normalized = p.replace("\\", "/")
        status = (meta or {}).get("status", "pending")
        if status == "done":
            done_set.add(normalized)
        elif status == "partial":
            partial_set.add(normalized)

    chars_by_path = {f.path: f.chars for f in covered_files}

    for p in done_set:
        if p in chars_by_path:
            done_chars += chars_by_path[p]
            done_files += 1

    for p in partial_set:
        if p in chars_by_path:
            partial_chars += chars_by_path[p]
            partial_files += 1

    unread_files = [
        f for f in covered_files if f.path not in done_set and f.path not in partial_set
    ]
    unread_files_sorted = sorted(unread_files, key=lambda x: x.chars, reverse=True)

    return {
        "total_files_in_scope": total_files,
        "total_chars_in_scope": total_chars,
        "done_files": done_files,
        "done_chars": done_chars,
        "partial_files": partial_files,
        "partial_chars": partial_chars,
        "unread_files": len(unread_files),
        "unread_chars": total_chars - done_chars - partial_chars,
        "pct_done": (done_chars / total_chars * 100) if total_chars else 0,
        "pct_done_plus_partial": ((done_chars + partial_chars) / total_chars * 100) if total_chars else 0,
        "top_unread": [
            {"path": f.path, "chars": f.chars}
            for f in unread_files_sorted[:20]
        ],
    }


def cmd_status(project_root: Path, coverage_file: str, state_file: str) -> int:
    coverage, _ = load_coverage(project_root, coverage_file)
    state = load_state(project_root, state_file)
    report = compute_progress(coverage, state)

    print("=" * 80)
    print("📊 READING COVERAGE")
    print("=" * 80)
    print(f"Project root: {project_root}")
    print(f"Coverage file: {coverage_file}")
    print(f"State file: {state_file}")
    print("-")
    print(f"Files in scope: {report['total_files_in_scope']:,}")
    print(f"Chars in scope: {report['total_chars_in_scope']:,}")
    print(f"Done: {report['done_files']:,} files | {report['done_chars']:,} chars | {report['pct_done']:.2f}%")
    print(
        f"Done+Partial: {report['done_files'] + report['partial_files']:,} files | "
        f"{report['done_chars'] + report['partial_chars']:,} chars | {report['pct_done_plus_partial']:.2f}%"
    )
    print(f"Unread: {report['unread_files']:,} files | {report['unread_chars']:,} chars")
    print("-")
    print("Top 20 unread files by size:")
    for i, item in enumerate(report["top_unread"], 1):
        print(f"  {i:2}. {item['path']:<70} {item['chars']:,} chars")
    print("=" * 80)

    return 0


def cmd_mark(project_root: Path, coverage_file: str, state_file: str, paths: List[str], status: str) -> int:
    coverage, _ = load_coverage(project_root, coverage_file)
    state = load_state(project_root, state_file)

    chars_by_path = {
        f.path: f.chars
        for f in coverage
        if not _match_any(f.path, state.get("exclude", []))
    }

    files_state: Dict[str, Any] = state.setdefault("files", {})

    updated = 0
    for raw in paths:
        p = raw.replace("\\", "/")

        # Accept both absolute and relative paths
        if p.startswith(str(project_root).replace("\\", "/")):
            p = p[len(str(project_root).replace("\\", "/")) :].lstrip("/")

        if p not in chars_by_path:
            print(f"⚠️  Not in scope or not found in coverage: {raw}")
            continue

        files_state[p] = {
            "status": status,
            "read_at": _now_iso(),
        }
        updated += 1

    save_state(project_root, state_file, state)
    print(f"✅ Updated {updated} file(s) to status='{status}'.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Track reading coverage against project-coverage.json")
    parser.add_argument("--root", default=str(Path.cwd()), help="Project root path")
    parser.add_argument("--coverage", default=DEFAULT_COVERAGE_FILE, help="Coverage JSON file")
    parser.add_argument("--state", default=DEFAULT_STATE_FILE, help="Reading state JSON file")

    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="Show current reading coverage")

    mark = sub.add_parser("mark", help="Mark file(s) as done")
    mark.add_argument("paths", nargs="+", help="File paths (relative to project root)")

    partial = sub.add_parser("partial", help="Mark file(s) as partial")
    partial.add_argument("paths", nargs="+", help="File paths (relative to project root)")

    args = parser.parse_args()

    project_root = Path(args.root).resolve()

    if args.cmd == "status":
        return cmd_status(project_root, args.coverage, args.state)
    if args.cmd == "mark":
        return cmd_mark(project_root, args.coverage, args.state, args.paths, status="done")
    if args.cmd == "partial":
        return cmd_mark(project_root, args.coverage, args.state, args.paths, status="partial")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
