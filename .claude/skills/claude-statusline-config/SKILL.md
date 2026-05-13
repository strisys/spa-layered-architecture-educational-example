---
name: claude-statusline-config
description: Install and maintain Stephen's two-line Claude Code statusline — model + context bar + session cost on line 1, folder + git branch on line 2. Self-contained — scripts ship inside this skill under scripts/, no external repo to clone. Use when configuring Claude Code on a new machine, customizing the statusline, debugging why the statusline is missing, or changing how model/context/cost/branch are displayed.
---

# Claude Code Statusline Config

## What it looks like

Two color-coded lines. Each block hides if its source data is missing (no git repo → no branch; no model call yet → no bar/cost).

```
🤖 Claude Opus 4.7 │ [████░░░░░░] 42% │ 💰 $0.42
📂 ~/source/mortgage-ai │ 🌿 main
```

- **Line 1:** model (cyan) │ context bar (green <50%, yellow 50–79%, red ≥80%) │ session cost (green)
- **Line 2:** cwd with `~` collapse (yellow) │ git branch — falls back to short SHA on detached HEAD (green)

## Install

The scripts are bundled inside this skill at `scripts/`. The same path resolves on every machine: `$HOME/.claude/skills/claude-statusline-config/scripts/`. No external repo to clone.

**1. Merge the `statusLine` key into `~/.claude/settings.json`.** Read the existing file first; preserve every other key:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash $HOME/.claude/skills/claude-statusline-config/scripts/statusline-command.sh"
  }
}
```

> **Expect one approval prompt for this edit if Claude Code's sandbox is active.** Writes to `~/.claude/settings.json` are intentionally denied by the sandbox so a compromised session cannot silently rewrite its own permissions. The edit falls out of sandbox auto-allow into the regular permission flow → one-time approval. Approve and continue.

**2. Confirm executable bits** (git preserves them; cheap to verify on Linux/macOS):

```bash
chmod +x $HOME/.claude/skills/claude-statusline-config/scripts/statusline-command.{sh,py}
```

**3. Verify** the script runs standalone, without Claude Code:

```bash
echo '{"model":{"display_name":"Claude"},"workspace":{"current_dir":"'"$PWD"'"}}' \
  | bash $HOME/.claude/skills/claude-statusline-config/scripts/statusline-command.sh
```

Expected: two ANSI-colored lines printed to stdout. A `python3: command not found` error means Python 3 is missing — install via `apt install python3` (it ships pre-installed on most Ubuntu / WSL Ubuntu distros).

**4. Statusline appears on the next Claude Code prompt.** No restart needed — Claude Code re-reads `settings.json` for the `statusLine` block on every prompt.

## Migrating from the older dotfiles-based install

Earlier versions of this skill referenced `$HOME/source/mortgage-ai/dotfiles/claude/statusline-command.sh` and required cloning the dotfiles repo. If `~/.claude/settings.json` still points at that path, replace it with the bundled-skill path above. The dotfiles repo is no longer required for the statusline (it may still hold other unrelated dotfiles).

## Files in this skill

| File | Role |
|---|---|
| `SKILL.md` | This document — agent-facing instructions |
| `scripts/statusline-command.sh` | Bash wrapper — `exec`s the python file in the same directory |
| `scripts/statusline-command.py` | All logic — JSON parsing, ANSI colors, bar rendering, git lookup |

Python is used (not `jq`) because `jq` is not always available on fresh distros; Python 3 almost always is.

## Editing

Edit either script directly under `scripts/`. Changes take effect on the next Claude Code prompt (no Claude Code restart needed). Edits propagate to other machines via the standard backup/restore flow (`/backup-settings` here → `git pull` + restore on the other machine), since this skill — including its `scripts/` directory — lives under `~/.claude/skills/` which is part of the backup.

## Troubleshooting

- **Statusline missing entirely** — confirm `~/.claude/settings.json` has the `statusLine` key, the script path resolves on this machine (`ls $HOME/.claude/skills/claude-statusline-config/scripts/statusline-command.sh`), and the bash wrapper has `+x`.
- **Raw escape codes (e.g. `\033[0;36m`) instead of colors** — terminal does not support ANSI. Use Windows Terminal, iTerm2, GNOME Terminal, or any modern terminal emulator.
- **Branch shows as a short SHA** — the repo is in detached-HEAD state. By design — checkout a branch to restore the name.
- **No context bar / no cost** — Claude Code has not yet sent `context_window.used_percentage` / `cost.total_cost_usd`. Both appear after the first model call in the session.
- **`python3: command not found`** — install Python 3 via `apt install python3` (or whatever the distro's package manager uses).
