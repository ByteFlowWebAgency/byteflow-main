# Pull Request Review Standards Reference

## PR Description Template

Copy this into `.github/PULL_REQUEST_TEMPLATE.md` or use it as a starting point when Claude drafts your PR:

```markdown
## What
<!-- 1–3 sentences: what does this PR change? -->

## Why
<!-- Context: what problem does this solve or what feature does it add? -->

## How
<!-- Key technical decisions: how was this implemented? -->

## Testing
<!-- How was this tested? Unit tests added? Manual steps to verify? -->

## Screenshots / Demo
<!-- Attach screenshots or GIF if UI changed. Link to demo if applicable. -->

## Checklist
- [ ] Tests pass locally
- [ ] No console.log / debug artifacts left in
- [ ] CHANGELOG updated (if release-worthy change)
- [ ] Docs updated (if API or interface changed)
```

---

## PR Title Format

Same format as a commit subject line:

```
<type>(<scope>): <short description>
```

Examples:
```
feat(auth): add OAuth2 login with Google
fix(cart): resolve null pointer on empty cart checkout
chore(deps): upgrade Next.js to 15.1.0
docs(api): document rate limiting headers
refactor(db): extract query builder to separate module
```

---

## PR Size Guidelines

| Lines Changed | Status | Action |
|--------------|--------|--------|
| < 400 | ✅ Ideal | Proceed normally |
| 400–800 | ⚠️ Acceptable | Consider splitting if possible |
| 800+ | ❌ Needs splitting | Claude will suggest a split strategy |

### How to Split a Large PR

**By layer (architecture):**
- PR 1: Database migrations + model changes
- PR 2: API / service layer
- PR 3: UI / frontend changes

**By feature slice:**
- PR 1: Core feature (minimum viable)
- PR 2: Edge cases and error handling
- PR 3: Polish, tests, docs

**By file type:**
- PR 1: Backend logic
- PR 2: Frontend components
- PR 3: Tests and documentation

---

## Review Etiquette

### For Reviewers

**Comment prefixes to use:**
- `nit:` — minor stylistic preference, non-blocking ("nit: could rename this to `userId` for clarity")
- `question:` — asking for understanding, not requesting a change
- `suggestion:` — optional improvement, take it or leave it
- `blocker:` — must be resolved before merge
- No prefix = blocking by default

**Response time expectations:**
- First review: within 1 business day
- Follow-up reviews (after author responds): within 4 hours if possible
- ⚠️ If you cannot review within 1 day, communicate this on the PR

**Review tone:**
- Review the code, not the author
- Ask questions rather than making accusations: "What's the reason for X?" vs "Why did you do this wrong?"
- Acknowledge good decisions: "Nice use of memoization here"

### For Authors

- Respond to every comment — even if just "acknowledged" or "done"
- Don't push new commits mid-review without a note; it can invalidate existing review comments
- If you disagree with a suggestion, explain why — don't silently ignore it
- Use "Draft PR" to signal "not ready for review yet" for early feedback

---

## Squash vs Merge vs Rebase

| Strategy | What it does | When to use |
|----------|-------------|-------------|
| **Squash merge** | Collapses all PR commits into one on main | Feature branches with messy WIP commits |
| **Merge commit** | Preserves all commits + adds a merge commit | When commit history on the branch is meaningful |
| **Rebase merge** | Replays commits onto main, no merge commit | Clean linear history with well-written commits |

**Recommended defaults:**
- Use **squash** for feature branches from GitHub Flow
- Use **merge commit** for GitFlow `release/*` and `hotfix/*` merges (preserves the branch history)
- Use **rebase** if your team has commit discipline and wants a clean linear log

**Configure in GitHub:** Settings → General → Pull Requests → check/uncheck merge options

---

## Draft PRs

Use Draft PRs when:
- You want early feedback before the PR is ready to merge
- You want CI to run but don't want reviewers to spend time yet
- You're pairing or collaborating in progress

**How:** Click the dropdown arrow on "Create pull request" → select "Create draft pull request"

Convert to ready when: all checklist items are done and you're happy with the state.

---

## Auto-Close Keywords

Include in PR description or commit message footer to auto-close issues on merge:

```
Closes #42
Fixes #100
Resolves #7
```

Multiple issues:
```
Closes #42, closes #43, fixes #100
```

These only trigger on merge to the **default branch** (usually `main`).

---

## Handling Review Disagreements

1. **Author responds** with reasoning — explain the decision clearly
2. **Reviewer acknowledges** — if the reasoning is sound, resolve the thread
3. **If still blocked:** escalate to a third party (tech lead, another engineer)
4. **Last resort:** use a time-box — "if no resolution in 24h, we go with X"

The goal is progress, not being right. Document the decision in a comment so future contributors understand why a choice was made.
