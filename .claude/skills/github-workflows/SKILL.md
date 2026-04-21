---
name: github-workflows
description: "Manages GitHub repository workflows end-to-end: branching strategy, branch naming, commit conventions, versioning, releases, pull requests, and CI/CD best practices. Use this skill whenever the user mentions branches, PRs, releases, versioning, tags, merging, GitHub Actions, or asks how to structure their repo workflow — even for simple questions like 'what should I name this branch?' or 'how do I cut a release?'"
---

# GitHub Workflows Manager

## Communication Style (Mandatory)

Before executing ANY step, announce what you are about to do:

```
🔍 Step X of Y — [Step name]...
   [Plain English explanation of what you're about to look at and why]
```

After completing it, summarize findings:
```
✅ Found: [plain English summary of what was discovered]
```

**Rules:**
- Never silently run commands
- Never dump raw terminal output at the user — always translate into plain English
- Flag unexpected or concerning findings with ⚠️ before proceeding
- No destructive git command runs without explicit user confirmation

---

## Section 1: Orientation

When this skill triggers:

1. **Clarify intent** — if not already clear, ask: "What would you like to do? (e.g., name a branch, write a commit, open a PR, cut a release, audit the repo, or set up conventions from scratch)"

2. **Detect context** — announce then run:
   ```
   🔍 Reading your repository state...
      I'm going to check your branches, recent commits, and tags so I know exactly where things stand.
   ```
   Run these commands:
   - `git status`
   - `git branch -a`
   - `git log --oneline -10`
   - `git tag --sort=-v:refname | head -10`

3. **Report findings** in plain English:
   ```
   ✅ Found: [current branch], [N open branches], [latest tag or "no tags yet"], [clean/dirty working directory]
   ```
   Flag anything unusual with ⚠️.

4. **Announce workflow mode:**
   > "I'll be operating in **[mode]** mode."

### Workflow Modes

| Mode | Triggers |
|------|----------|
| `branch` | Creating or naming a branch |
| `commit` | Writing or fixing a commit message |
| `pr` | Opening, reviewing, or describing a pull request |
| `release` | Cutting a release, bumping version, writing release notes |
| `versioning` | Deciding what version number to use |
| `audit` | Reviewing existing repo structure and suggesting improvements |
| `setup` | Setting up conventions for a new or convention-less repo |

---

## Section 2: Branching Strategy

First, identify which branching model the repo uses (or recommend one). See `references/branching-strategies.md` for full detail.

### Quick Decision Logic

| Team Size | Deploy Frequency | Recommended Strategy |
|-----------|-----------------|----------------------|
| 1–3 devs | Anytime | GitHub Flow |
| 4–15 devs | Scheduled releases | GitFlow |
| 15+ devs | Continuous | Trunk-Based Development |

### When Recommending a Strategy

1. State the recommendation and justify it in 2–3 sentences
2. Show the branch topology as an ASCII diagram
3. Explain each branch type's purpose
4. Ask for confirmation before proceeding

**GitFlow topology:**
```
main          ← production-ready, tagged releases only
develop       ← integration branch, all features merge here
feature/*     ← new features, branch from develop
release/*     ← release prep, branch from develop, merges to main+develop
hotfix/*      ← urgent fixes, branch from main, merges to main+develop
```

**GitHub Flow topology:**
```
main          ← always deployable
feature/*     ← all work, branch from main, PR back to main
```

**Trunk-Based topology:**
```
main          ← always releasable, CI gate enforced
feature/*     ← short-lived (<2 days), merge to main via PR
```

---

## Section 3: Branch Naming Conventions

See `references/naming-conventions.md` for full examples.

**Format:** `<type>/<ticket-or-scope>/<short-description>`

**Valid types:**
- `feature/` — new functionality
- `fix/` — bug fixes
- `hotfix/` — urgent production fixes (GitFlow only)
- `release/` — release preparation (GitFlow only)
- `chore/` — maintenance, dependency updates, tooling
- `docs/` — documentation only
- `refactor/` — code restructuring, no behavior change
- `test/` — adding or fixing tests
- `experiment/` — exploratory/spike work, may be discarded

**Rules to enforce:**
- All lowercase
- Hyphens only — no underscores, no spaces
- Max 50 characters total
- Ticket number before description: `feature/PROJ-123/user-auth`
- Reject generic names: `fix/bug`, `feature/stuff`, `update/changes`

### Claude Behavior in `branch` Mode

```
🔍 Step 1 of 5 — Understanding your work...
   I'll ask a few quick questions to generate the best branch name for you.
```

1. Ask: what type of work is this? (feature, fix, chore, etc.)
2. Ask: do you have a ticket or issue number?
3. Ask: describe what this branch will do in a few words
4. Generate 2–3 valid name options
5. Explain the choice and ask the user to confirm or pick one
6. Output the exact command:
   ```bash
   git checkout -b <branch-name>
   ```

---

## Section 4: Commit Message Conventions

Enforce **Conventional Commits** (https://www.conventionalcommits.org).

**Format:**
```
<type>(<scope>): <short description>

[optional body — wrap at 72 chars]

[optional footer: BREAKING CHANGE: ..., Closes #123]
```

**Valid types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

**Rules:**
- Subject line max 72 characters
- Imperative mood: "add feature" not "added feature"
- No period at end of subject
- Body wraps at 72 characters
- Footer references issues: `Closes #42`, `Refs #100`
- Breaking changes: `feat!:` in subject OR `BREAKING CHANGE:` in footer

### Claude Behavior in `commit` Mode

```
🔍 Step 1 of 5 — Inspecting staged changes...
   I'm going to look at what you've staged so I can draft the best commit message.
```

1. Announce then run `git diff --staged` if available
2. Identify the correct type based on the diff
3. Draft the commit message
4. Show it in a code block
5. Ask if the user wants any adjustments
6. Output the exact command:
   ```bash
   git commit -m "type(scope): description"
   ```

---

## Section 5: Versioning

See `references/versioning-guide.md` for full detail.

**Use Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH[-prerelease][+build]`**

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Breaking API change | MAJOR | 1.2.3 → 2.0.0 |
| New backwards-compatible feature | MINOR | 1.2.3 → 1.3.0 |
| Backwards-compatible bug fix | PATCH | 1.2.3 → 1.2.4 |
| Pre-release alpha | PATCH + suffix | 1.3.0-alpha.1 |
| Pre-release beta | PATCH + suffix | 1.3.0-beta.2 |
| Release candidate | PATCH + suffix | 1.3.0-rc.1 |

**Special rules:**
- `0.x.x` = initial development; MINOR bumps may be breaking
- `1.0.0` = first stable public API
- Never reuse a version number
- Always use annotated tags: `git tag -a v1.3.0 -m "Release v1.3.0"`

### Claude Behavior in `versioning` Mode

```
🔍 Step 1 of 4 — Checking recent version tags...
   I'm going to look at your tag history and recent commits to determine the right version bump.
```

1. Announce then run `git tag --sort=-v:refname | head -5`
2. Announce then run `git log <last-tag>..HEAD --oneline`
3. Identify the highest-impact change type from commits
4. State: "Based on [X], this should be a [MAJOR/MINOR/PATCH] bump. New version: vX.Y.Z"
5. Confirm with user before proceeding

---

## Section 6: Release Workflow

See `references/release-checklist.md` for the full checklist.

### Claude Behavior in `release` Mode

Announce each step before running it:

```
🔍 Step 1 of 8 — Verifying you're on the right branch...
🔍 Step 2 of 8 — Checking for uncommitted changes...
🔍 Step 3 of 8 — Pulling latest changes...
🔍 Step 4 of 8 — Determining version number...
🔍 Step 5 of 8 — Updating version files...
🔍 Step 6 of 8 — Generating/updating CHANGELOG...
🔍 Step 7 of 8 — Committing version bump...
🔍 Step 8 of 8 — Creating annotated git tag...
```

**Step 1 — Branch verification:**
- GitFlow: must be on `release/*` or `hotfix/*`
- GitHub Flow / Trunk: must be on `main` or a dedicated release branch
- ⚠️ If wrong branch: warn, suggest correct branch, pause for user confirmation

**Step 2 — Clean working directory:**
- Run `git status`
- ⚠️ If dirty: show what's uncommitted, ask user to stash or commit first
- Never release from a dirty working directory

**Step 3 — Pull latest:**
- Run `git pull origin <current-branch>`
- Report: up to date, or how many commits were pulled

**Step 4 — Version determination:**
- Run `git log <last-tag>..HEAD --oneline`
- Analyze commit types, recommend bump
- Confirm with user before proceeding

**Step 5 — Update version files:**
Detect which files need updating:
- Node.js: `package.json` → `"version"` field
- Python: `pyproject.toml` → `[project] version` or `setup.py`
- Generic: `VERSION` file if present
- Show the exact edit, confirm before writing

**Step 6 — CHANGELOG:**
- If no CHANGELOG.md: create one using Keep a Changelog format
- Categorize commits into: Added, Changed, Fixed, Deprecated, Removed, Security
- Prepend new section at top, show draft, ask for edits before saving

**Step 7 — Commit:**
```bash
git add <version files> CHANGELOG.md
git commit -m "chore(release): bump version to vX.Y.Z"
```

**Step 8 — Tag:**
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```
Remind user: `git push origin <branch> && git push origin vX.Y.Z`

---

## Section 7: Pull Request Standards

See `references/pr-review-standards.md` for full detail.

**PR size guidelines:**
- Ideal: under 400 lines changed
- Acceptable: 400–800 lines
- ⚠️ Needs splitting: 800+ lines (suggest split strategy)

**PR title format:** `<type>(<scope>): <description>` (same as commit subject)

**Required PR description:**
```markdown
## What
[1–3 sentence summary of what this changes]

## Why
[Context: what problem does this solve or feature does this add]

## How
[Brief technical approach — key decisions made]

## Testing
[How was this tested? Unit tests? Manual steps?]

## Screenshots / Demo
[If UI changes — attach or link]

## Checklist
- [ ] Tests pass
- [ ] No console.log / debug artifacts left in
- [ ] CHANGELOG updated (if release-worthy)
- [ ] Docs updated (if API changed)
```

### Claude Behavior in `pr` Mode

```
🔍 Step 1 of 5 — Reading your branch commits...
   I'm going to look at what's changed on this branch versus main so I can draft your PR description.
```

1. Ask: what does this PR do? (or infer from commits)
2. Ask: what's the ticket/issue number?
3. Announce then run `git log main..HEAD --oneline`
4. Draft the full PR description using the template above
5. Suggest a PR title
6. ⚠️ Warn if the PR looks too large (estimate line count)
7. Offer a split strategy if > 800 lines

---

## Section 8: Audit Mode

Full repo health check — announce each check before running it.

```
🔍 Checking branch hygiene...
🔍 Checking commit message consistency...
🔍 Checking version tag history...
🔍 Checking for CHANGELOG...
🔍 Checking for stale branches...
```

### Checks to Run

| Check | Command | What to look for |
|-------|---------|-----------------|
| Branch list | `git branch -a` | Naming violations, stale branches |
| Commit history | `git log --oneline -20` | Non-conventional commits |
| Tags | `git tag --sort=-v:refname` | Missing tags, lightweight vs annotated |
| Stale branches | `git for-each-ref --sort=-committerdate refs/heads --format='%(refname:short) %(committerdate:relative)'` | No activity in 30+ days |

### Output Format: Scored Report Card

```
## [Repo Name] Health Report

### Branching          ✅ Good       (X/X branches follow naming conventions)
### Commit Hygiene     ⚠️  Needs Work  (X/20 recent commits use conventional format)
### Version Tags       ✅ Good       (X annotated tags, clean SemVer progression)
### CHANGELOG          ❌ Missing    (no CHANGELOG.md found)
### Stale Branches     ⚠️  X stale    ([branch]: X days, [branch]: Y days)

### Recommendations
1. [Highest priority fix]
2. [Second priority fix]
3. [Third priority fix]
```

---

## Section 9: Setup Mode

For repos with no established conventions.

**Announce:**
> "I'm going to help you set up Git conventions for this repo from scratch. I'll ask a few questions, then configure everything."

**Ask 5 questions:**
1. How large is your team? (number of developers)
2. How often do you deploy or cut releases?
3. Do you use a ticketing system? (Jira, Linear, GitHub Issues, or none)
4. What language/ecosystem? (Node.js, Python, Go, other)
5. Do you use GitHub Actions for CI/CD?

**Based on answers, configure:**
- Branching strategy (with ASCII diagram)
- Branch naming rules
- Commit convention (always Conventional Commits)
- Version scheme (SemVer unless strong reason otherwise)

**Generate these files (show each before creating, ask for confirmation):**
- `.github/PULL_REQUEST_TEMPLATE.md`
- `CHANGELOG.md` (empty scaffold)
- `.commitlintrc.json` (Node.js projects only)

### `.github/PULL_REQUEST_TEMPLATE.md` content:
```markdown
## What
<!-- 1–3 sentences describing what this PR changes -->

## Why
<!-- What problem does this solve or feature does it add? -->

## How
<!-- Brief technical approach — key decisions made -->

## Testing
<!-- How was this tested? Unit tests? Manual steps to verify? -->

## Screenshots / Demo
<!-- Attach screenshots or a demo link if UI changes are included -->

## Checklist
- [ ] Tests pass locally
- [ ] No console.log / debug artifacts left in
- [ ] CHANGELOG updated (if release-worthy change)
- [ ] Docs updated (if API or interface changed)
```

### `CHANGELOG.md` scaffold:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Deprecated

### Removed

### Security
```

### `.commitlintrc.json` (Node.js):
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["feat","fix","docs","style","refactor","test","chore","perf","ci","build","revert"]],
    "subject-max-length": [2, "always", 72],
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "body-max-line-length": [2, "always", 72]
  }
}
```

---

## Adaptive Behavior

- **Detect user sophistication** from their language. If they say "I need to cut a release" treat them as experienced. If they say "how do I make a branch" explain more carefully.
- **Never assume conventions exist** — always verify first with git commands.
- **Adjust verbosity** — power users get concise outputs; beginners get more explanation.
- **Always confirm** before any write operation (file edit, commit, tag).
