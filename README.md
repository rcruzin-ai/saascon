# Starter Workspace — agent-skills

A pre-installed [agent-skills](https://github.com/addyosmani/agent-skills) workspace. Clone it, point Claude Code at it, and start a new project with senior-engineer workflows already wired up.

## What's in here

```
.claude/commands/   → /spec /plan /build /test /review /code-simplify /ship
.claude-plugin/     → plugin metadata (used if installed via marketplace)
skills/             → 21 SKILL.md workflows (auto-activate by topic)
agents/             → code-reviewer, test-engineer, security-auditor personas
hooks/              → session lifecycle hooks (sdd-cache, simplify-ignore, session-start)
references/         → testing / security / performance / accessibility checklists
docs/               → setup guides for Cursor, Gemini, Copilot, etc.
CLAUDE.md           → project instructions Claude Code loads automatically
AGENTS.md           → instructions for OpenCode / generic agents
AGENT-SKILLS-README.md → upstream README, for reference
```

## Setup

### 1. Clone

```bash
git clone https://github.com/rcruzin/agentskills.git my-project
cd my-project
```

> Want to start fresh history? `rm -rf .git && git init -b main` after cloning.

### 2. Open in Claude Code

```bash
claude
```

Claude Code auto-loads [CLAUDE.md](CLAUDE.md) and registers the slash commands in [.claude/commands/](.claude/commands/). No further config required.

### 3. (Optional) Enable hooks

The hooks in [hooks/](hooks/) are not active by default. To wire them in, copy [hooks/hooks.json](hooks/hooks.json) into `.claude/settings.json` (or `~/.claude/settings.json` for global) and adjust paths to absolute. See [hooks/SDD-CACHE.md](hooks/SDD-CACHE.md) and [hooks/SIMPLIFY-IGNORE.md](hooks/SIMPLIFY-IGNORE.md).

### 4. Replace this README

Once your project starts, overwrite this file with your project's actual README. The setup info won't be needed twice.

## First session — recommended flow

The slash commands map to the dev lifecycle. For a brand-new project:

```
/spec           → write a PRD (creates SPEC.md)
/plan           → break it into tasks (creates tasks/plan.md, tasks/todo.md)
/build          → implement one slice at a time (TDD + incremental)
/test           → prove it works
/review         → quality gate before merge
/ship           → deploy
```

`SPEC.md` and `tasks/` are living documents during development. Delete them before merge or `.gitignore` them if you don't want them long-term — see the "Spec and task artifacts" section in [docs/getting-started.md](docs/getting-started.md).

## Using a different agent

This workspace is configured for Claude Code, but the skills are plain Markdown.

- **Cursor** — see [docs/cursor-setup.md](docs/cursor-setup.md)
- **Gemini CLI** — see [docs/gemini-cli-setup.md](docs/gemini-cli-setup.md)
- **GitHub Copilot** — see [docs/copilot-setup.md](docs/copilot-setup.md)
- **Windsurf** — see [docs/windsurf-setup.md](docs/windsurf-setup.md)
- **OpenCode** — see [docs/opencode-setup.md](docs/opencode-setup.md)
- **Anything else** — see [docs/getting-started.md](docs/getting-started.md)

## What to customize

Before kicking off real work, tailor these to your project:

1. **[CLAUDE.md](CLAUDE.md)** — currently describes the agent-skills repo itself. Replace its content with your project's structure, commands, conventions, and boundaries.
2. **[AGENTS.md](AGENTS.md)** — same idea for OpenCode / generic agent users.
3. **`.gitignore`** — add one (none exists yet). At minimum: language-specific build artifacts, `.env`, editor cruft.
4. **License** — the upstream MIT license was not copied. Add your own if publishing.

## Skill reference

21 skills, organized by lifecycle phase. Full descriptions in [AGENT-SKILLS-README.md](AGENT-SKILLS-README.md#all-20-skills).

| Phase | Skills |
|-------|--------|
| Define | idea-refine, spec-driven-development |
| Plan | planning-and-task-breakdown |
| Build | incremental-implementation, test-driven-development, context-engineering, source-driven-development, frontend-ui-engineering, api-and-interface-design |
| Verify | browser-testing-with-devtools, debugging-and-error-recovery |
| Review | code-review-and-quality, code-simplification, security-and-hardening, performance-optimization |
| Ship | git-workflow-and-versioning, ci-cd-and-automation, deprecation-and-migration, documentation-and-adrs, shipping-and-launch |
| Meta | using-agent-skills |

## Credits

Skills authored by [Addy Osmani](https://github.com/addyosmani) and contributors at [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) (MIT).
</content>
</invoke>