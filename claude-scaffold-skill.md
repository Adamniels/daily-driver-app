---
name: scaffold-claude
description: Set up the standard .claude/ folder structure (CLAUDE.md, settings, skills/commands/agents stubs, and a committed memory folder) in a new project. Use when starting a new repo or when asked to "set up Claude stuff" / "scaffold the .claude folder".
---

# scaffold-claude

Scaffolds the project-scoped Claude Code structure into the **current working
directory** (the root of the project the user is in). Mirrors a known-good layout:
a committed `.claude/` tree plus a portable, committed `memory/` folder so work can
be picked up on another machine after `git pull`.

## When to use

- Starting a brand-new project/repo and you want the Claude scaffolding in place.
- The user says "set up the claude folder structure", "scaffold .claude", or similar.

## Rules

1. **Never overwrite existing files.** Before writing each file, check if it exists.
   If it does, skip it and report that it was left untouched. This is safe to run in
   a repo that already has a partial setup.
2. Create the directory tree first, then the files.
3. Add the `.gitignore` entry **idempotently** (don't duplicate the line).
4. After finishing, print the resulting tree and tell the user the files are
   uncommitted, offering to commit.

## Procedure

### 1. Create directories

```
mkdir -p .claude/skills/my-skill .claude/commands .claude/agents .claude/memory
```

### 2. Create files (skip any that already exist)

**`CLAUDE.md`** (repo root):

```markdown
# <project-name>

Project instructions for Claude Code. This file is always loaded into context.

## Session start

At the start of a session, read `.claude/memory/PROGRESS.md` for current status and
`.claude/memory/decisions.md` for prior decisions. Keep both updated as work proceeds.

## Overview

<!-- One-paragraph description of what this app is and does. -->

## Architecture

<!-- Key directories, services, and how they fit together. -->

## Conventions

<!-- Coding style, naming, commit message format, testing expectations. -->

## Commands

<!-- Common build/test/run commands. -->
```

Replace `<project-name>` with the actual directory name.

**`.claude/settings.json`**:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

**`.claude/settings.local.json`** (personal overrides, gitignored):

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

**`.claude/skills/my-skill/SKILL.md`**:

```markdown
---
name: my-skill
description: One-line summary of what this skill does and when Claude should use it.
---

# my-skill

Describe the capability this skill provides.

## When to use

<!-- Conditions under which Claude should invoke this skill. -->

## Steps

<!-- The procedure Claude should follow. -->
```

**`.claude/commands/my-command.md`**:

```markdown
---
description: One-line summary shown in the slash-command menu.
---

Instructions for what Claude should do when the user runs `/my-command`.

Use `$ARGUMENTS` to reference what the user typed after the command, e.g.:

> Summarize the file at $ARGUMENTS and list any TODOs.
```

**`.claude/agents/my-agent.md`**:

```markdown
---
name: my-agent
description: When to use this subagent. Be specific so the main agent delegates correctly.
tools: Read, Grep, Glob, Bash
---

You are a specialized subagent for <purpose>.

## Responsibilities

<!-- What this agent should focus on. -->

## Output

<!-- The format/content this agent should return. -->
```

**`.claude/memory/PROGRESS.md`**:

```markdown
# Progress Log

Running status so work can be picked up on any machine after `git pull`.
Newest entries at the top.

## Current status

<!-- One or two sentences: where things stand right now. -->

## In progress

<!-- What's actively being worked on. -->

## Next up

<!-- The next concrete steps. -->

## Blockers / open questions

<!-- Anything waiting on a decision or external input. -->

---

## History

<!-- Dated entries, newest first. -->
```

**`.claude/memory/decisions.md`**:

```markdown
# Decisions

Why we chose X over Y, so it isn't re-litigated later. Newest first.

<!-- Example:
## YYYY-MM-DD — <decision title>
**Decision:** ...
**Why:** ...
**Alternatives considered:** ...
-->
```

### 3. Update `.gitignore` (idempotent)

Add `.claude/settings.local.json` so personal overrides aren't committed. If
`.gitignore` exists, append the line only if it's not already present; otherwise
create it.

```bash
if [ -f .gitignore ]; then
  grep -qxF '.claude/settings.local.json' .gitignore \
    || printf '\n# Claude Code personal overrides\n.claude/settings.local.json\n' >> .gitignore
else
  printf '# Claude Code personal overrides\n.claude/settings.local.json\n' > .gitignore
fi
```

### 4. Report

Print the resulting tree, note which files were skipped (already existed), and
mention the files are uncommitted — offer to commit them.

## Resulting structure

```
<project>/
├── CLAUDE.md                      # always-loaded instructions; points to memory/
├── .gitignore                     # ignores .claude/settings.local.json
└── .claude/
    ├── settings.json              # shared config (commit this)
    ├── settings.local.json        # personal overrides (gitignored)
    ├── skills/
    │   └── my-skill/SKILL.md
    ├── commands/
    │   └── my-command.md
    ├── agents/
    │   └── my-agent.md
    └── memory/
        ├── PROGRESS.md            # where work left off (committed, portable)
        └── decisions.md           # why X over Y (committed, portable)
```

## Notes

- The committed `.claude/memory/` folder is what makes work portable across machines —
  it travels via git, unlike Claude's built-in `~/.claude/.../memory/` dir, which is
  machine-local.
- If the project repo is shared with a team, remember `memory/` files are visible to
  everyone. For private-but-portable notes, use a separate private repo or synced folder.
- To install this as a reusable skill later, move this file to
  `~/.claude/skills/scaffold-claude/SKILL.md` (user-global) or
  `.claude/skills/scaffold-claude/SKILL.md` (project-scoped), keeping the frontmatter.
```
