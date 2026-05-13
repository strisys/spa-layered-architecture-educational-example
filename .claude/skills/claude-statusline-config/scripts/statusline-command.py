#!/usr/bin/env python3
"""
Claude Code statusline.
Line 1: model | [context bar] N% | $cost
Line 2: folder | (branch)
Hides any block whose source data is missing.
"""

import json
import os
import subprocess
import sys

RESET  = "\033[0m"
CYAN   = "\033[0;36m"
GREEN  = "\033[0;32m"
YELLOW = "\033[0;33m"
RED    = "\033[0;31m"
DIM    = "\033[2m"

def color(s, c):
    return f"{c}{s}{RESET}"

def git_branch(folder):
    """Return current branch, or short SHA on detached HEAD, or '' if not a repo."""
    try:
        r = subprocess.run(
            ["git", "-C", folder, "symbolic-ref", "--short", "HEAD"],
            capture_output=True, text=True, timeout=2,
        )
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()
        r = subprocess.run(
            ["git", "-C", folder, "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=2,
        )
        if r.returncode == 0:
            return r.stdout.strip()
    except Exception:
        pass
    return ""

def main():
    try:
        d = json.load(sys.stdin)
    except Exception:
        d = {}

    sep = f" {DIM}|{RESET} "

    # --- Line 1: model | ctx | cost ---
    line1 = []

    model = (d.get("model") or {}).get("display_name") or "Claude"
    line1.append(color(f"🤖 {model}", CYAN))

    ctx = (d.get("context_window") or {}).get("used_percentage")
    if ctx is not None:
        try:
            pct = round(float(ctx))
            if pct >= 80:
                bc = RED
            elif pct >= 50:
                bc = YELLOW
            else:
                bc = GREEN
            width = 10
            filled = max(0, min(width, pct * width // 100))
            bar = "█" * filled + "░" * (width - filled)
            line1.append(color(f"[{bar}] {pct}%", bc))
        except (TypeError, ValueError):
            pass

    cost = (d.get("cost") or {}).get("total_cost_usd")
    if cost is not None:
        try:
            line1.append(color(f"💰 ${float(cost):.2f}", GREEN))
        except (TypeError, ValueError):
            pass

    # --- Line 2: folder | branch ---
    line2 = []

    folder = (d.get("workspace") or {}).get("current_dir") or os.getcwd()
    if folder:
        home = os.path.expanduser("~")
        display = folder
        if display == home:
            display = "~"
        elif display.startswith(home + os.sep):
            display = "~" + display[len(home):]
        line2.append(color(f"📂 {display}", YELLOW))

        branch = git_branch(folder)
        if branch:
            line2.append(color(f"🌿 {branch}", GREEN))

    if line1:
        print(sep.join(line1))
    if line2:
        print(sep.join(line2))

if __name__ == "__main__":
    main()
